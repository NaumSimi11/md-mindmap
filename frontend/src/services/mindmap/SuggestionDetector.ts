/**
 * SuggestionDetector - Detects opportunities for proactive AI suggestions
 * Analyzes node structure and content to offer contextual help
 */

import type { Node, Edge } from "@xyflow/react";
import type { Suggestion, SuggestionType } from "@/components/mindmap/ProactiveSuggestion";

export class SuggestionDetector {
  private dismissedSuggestions = new Set<string>();
  private lastSuggestionTime = new Map<string, number>();
  private cooldownPeriod = 30000; // 30 seconds between same suggestion

  /**
   * Detect suggestions for a specific node
   */
  detectForNode(
    node: Node,
    allNodes: Node[],
    allEdges: Edge[],
    onSuggestionAction: (command: string) => void
  ): Suggestion | null {
    // Check if we recently showed a suggestion for this node
    const lastTime = this.lastSuggestionTime.get(node.id);
    if (lastTime && Date.now() - lastTime < this.cooldownPeriod) {
      return null;
    }

    // Get node's children
    const children = this.getChildren(node.id, allEdges, allNodes);
    
    // Get node's siblings
    const siblings = this.getSiblings(node.id, allEdges, allNodes);

    // Priority order: check conditions from most to least important
    
    // 1. Node has NO children (empty leaf)
    if (children.length === 0 && !this.isDismissed(`add-children-${node.id}`)) {
      return this.createSuggestion(
        'add-children',
        node.id,
        "💡 Add sub-topics to this node?",
        'lightbulb',
        () => onSuggestionAction(`Add 3 sub-topics to "${node.data.label}"`),
        'medium'
      );
    }

    // 2. Node has FEW children (1-2)
    if (children.length > 0 && children.length <= 2 && !this.isDismissed(`expand-${node.id}`)) {
      return this.createSuggestion(
        'add-children',
        node.id,
        `🌱 Expand "${node.data.label}" with more ideas?`,
        'plus',
        () => onSuggestionAction(`Add 2 more to "${node.data.label}"`),
        'low'
      );
    }

    // 3. Node has NO description (could be enhanced)
    if (!node.data.description && !this.isDismissed(`enhance-${node.id}`)) {
      return this.createSuggestion(
        'enhance',
        node.id,
        "✨ Enhance this node with more detail?",
        'sparkles',
        () => onSuggestionAction(`Enhance "${node.data.label}"`),
        'medium'
      );
    }

    // 4. Too many siblings (5+) - suggest grouping
    if (siblings.length >= 5 && !this.isDismissed(`group-${node.id}`)) {
      const parent = this.getParent(node.id, allEdges, allNodes);
      if (parent) {
        return this.createSuggestion(
          'group',
          node.id,
          "📦 Too many items here. Group similar ones?",
          'branch',
          () => onSuggestionAction(`Organize children of "${parent.data.label}"`),
          'low'
        );
      }
    }

    // 5. Deep branch with few nodes (potential for expansion)
    const depth = this.getNodeDepth(node.id, allEdges);
    if (depth >= 2 && children.length === 0 && !this.isDismissed(`fill-branch-${node.id}`)) {
      return this.createSuggestion(
        'fill-branch',
        node.id,
        "🤔 This branch looks empty. Fill it in?",
        'alert',
        () => onSuggestionAction(`Add details to "${node.data.label}"`),
        'low'
      );
    }

    return null;
  }

  /**
   * Detect global suggestions (not node-specific)
   */
  detectGlobal(
    allNodes: Node[],
    allEdges: Edge[],
    onSuggestionAction: (command: string) => void
  ): Suggestion | null {
    // Check if mindmap is very sparse (< 5 nodes)
    if (allNodes.length < 5 && !this.isDismissed('global-sparse')) {
      return this.createSuggestion(
        'add-children',
        'global',
        "🚀 Your mindmap is just starting. Want to expand it?",
        'sparkles',
        () => onSuggestionAction("Add 5 more ideas to root"),
        'high'
      );
    }

    // Check if there are orphaned nodes (no connections)
    const orphans = this.getOrphanNodes(allNodes, allEdges);
    if (orphans.length > 0 && !this.isDismissed('global-orphans')) {
      return this.createSuggestion(
        'connect',
        'global',
        `🔗 Found ${orphans.length} disconnected node(s). Connect them?`,
        'branch',
        () => onSuggestionAction("Connect disconnected nodes"),
        'high'
      );
    }

    return null;
  }

  /**
   * Create a suggestion object
   */
  private createSuggestion(
    type: SuggestionType,
    nodeId: string,
    message: string,
    icon: Suggestion['icon'],
    action: () => void,
    priority: Suggestion['priority']
  ): Suggestion {
    const suggestionId = `${type}-${nodeId}`;
    
    // Record that we're showing this suggestion
    this.lastSuggestionTime.set(nodeId, Date.now());
    
    return {
      id: suggestionId,
      type,
      nodeId,
      message,
      icon,
      action,
      priority,
    };
  }

  /**
   * Get children of a node
   */
  private getChildren(nodeId: string, edges: Edge[], nodes: Node[]): Node[] {
    const childIds = edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);
    
    return nodes.filter(n => childIds.includes(n.id));
  }

  /**
   * Get siblings of a node
   */
  private getSiblings(nodeId: string, edges: Edge[], nodes: Node[]): Node[] {
    // Find parent
    const parentEdge = edges.find(e => e.target === nodeId);
    if (!parentEdge) return [];
    
    // Find all children of parent (including this node)
    const siblings = this.getChildren(parentEdge.source, edges, nodes);
    
    // Remove self
    return siblings.filter(n => n.id !== nodeId);
  }

  /**
   * Get parent of a node
   */
  private getParent(nodeId: string, edges: Edge[], nodes: Node[]): Node | null {
    const parentEdge = edges.find(e => e.target === nodeId);
    if (!parentEdge) return null;
    
    return nodes.find(n => n.id === parentEdge.source) || null;
  }

  /**
   * Get depth of a node (distance from root)
   */
  private getNodeDepth(nodeId: string, edges: Edge[]): number {
    let depth = 0;
    let currentId = nodeId;
    
    while (true) {
      const parentEdge = edges.find(e => e.target === currentId);
      if (!parentEdge) break;
      
      depth++;
      currentId = parentEdge.source;
      
      // Prevent infinite loops
      if (depth > 100) break;
    }
    
    return depth;
  }

  /**
   * Get orphaned nodes (no edges)
   */
  private getOrphanNodes(nodes: Node[], edges: Edge[]): Node[] {
    return nodes.filter(node => {
      const hasIncoming = edges.some(e => e.target === node.id);
      const hasOutgoing = edges.some(e => e.source === node.id);
      return !hasIncoming && !hasOutgoing;
    });
  }

  /**
   * Check if suggestion was dismissed
   */
  private isDismissed(suggestionId: string): boolean {
    return this.dismissedSuggestions.has(suggestionId);
  }

  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestions.add(suggestionId);
    console.log(`🚫 Dismissed suggestion: ${suggestionId}`);
  }

  /**
   * Clear dismissed suggestions (for reset)
   */
  clearDismissed(): void {
    this.dismissedSuggestions.clear();
    console.log('🧹 Cleared dismissed suggestions');
  }

  /**
   * Clear cooldowns (for testing)
   */
  clearCooldowns(): void {
    this.lastSuggestionTime.clear();
    console.log('🧹 Cleared suggestion cooldowns');
  }
}

// Export singleton instance
export const suggestionDetector = new SuggestionDetector();


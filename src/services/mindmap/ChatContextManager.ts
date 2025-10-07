/**
 * ChatContextManager - Manages conversation context for intelligent AI chat
 * Remembers recent actions, selections, and references for natural conversation flow
 */

export interface ChatAction {
  timestamp: number;
  action: 'add' | 'modify' | 'delete' | 'analyze' | 'organize';
  targetNodes: string[]; // Node IDs
  description: string;
}

export interface ChatContext {
  // Recent actions with their targets
  lastAddedNodes: string[];
  lastModifiedNodes: string[];
  lastDeletedNodes: string[];
  lastSelectedNode: string | null;
  
  // Conversation history
  actionHistory: ChatAction[];
  
  // Active focus (what we're currently working on)
  activeFocus: {
    nodeIds: string[];
    topic: string;
    timestamp: number;
  } | null;
}

export class ChatContextManager {
  private context: ChatContext = {
    lastAddedNodes: [],
    lastModifiedNodes: [],
    lastDeletedNodes: [],
    lastSelectedNode: null,
    actionHistory: [],
    activeFocus: null,
  };
  
  private maxHistorySize = 10; // Keep last 10 actions

  /**
   * Record an action in the context
   */
  recordAction(
    action: ChatAction['action'],
    targetNodes: string[],
    description: string
  ): void {
    const newAction: ChatAction = {
      timestamp: Date.now(),
      action,
      targetNodes,
      description,
    };
    
    // Add to history (keep last N)
    this.context.actionHistory.unshift(newAction);
    if (this.context.actionHistory.length > this.maxHistorySize) {
      this.context.actionHistory = this.context.actionHistory.slice(0, this.maxHistorySize);
    }
    
    // Update context based on action type
    switch (action) {
      case 'add':
        this.context.lastAddedNodes = targetNodes;
        this.updateActiveFocus(targetNodes, description);
        break;
      case 'modify':
        this.context.lastModifiedNodes = targetNodes;
        this.updateActiveFocus(targetNodes, description);
        break;
      case 'delete':
        this.context.lastDeletedNodes = targetNodes;
        break;
    }
    
    console.log('📝 Context updated:', {
      action,
      targetCount: targetNodes.length,
      lastAdded: this.context.lastAddedNodes.length,
      lastModified: this.context.lastModifiedNodes.length,
    });
  }
  
  /**
   * Update active focus (what we're working on)
   */
  private updateActiveFocus(nodeIds: string[], topic: string): void {
    this.context.activeFocus = {
      nodeIds,
      topic,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Resolve pronouns and references to actual node IDs
   * "them", "it", "these", "those" → actual node IDs from context
   */
  resolvePronoun(pronoun: string): string[] | null {
    const lower = pronoun.toLowerCase().trim();
    
    console.log(`🔍 Resolving pronoun: "${lower}"`);
    
    // Check for pronouns
    if (['them', 'these', 'those', 'they'].includes(lower)) {
      // Return the most recent multi-node action target
      if (this.context.lastModifiedNodes.length > 0) {
        console.log(`✅ Resolved "${lower}" → lastModifiedNodes (${this.context.lastModifiedNodes.length})`);
        return this.context.lastModifiedNodes;
      }
      if (this.context.lastAddedNodes.length > 0) {
        console.log(`✅ Resolved "${lower}" → lastAddedNodes (${this.context.lastAddedNodes.length})`);
        return this.context.lastAddedNodes;
      }
    }
    
    if (['it', 'that', 'this'].includes(lower)) {
      // Return the most recent single-node action target
      if (this.context.lastSelectedNode) {
        console.log(`✅ Resolved "${lower}" → lastSelectedNode`);
        return [this.context.lastSelectedNode];
      }
      if (this.context.lastModifiedNodes.length === 1) {
        console.log(`✅ Resolved "${lower}" → lastModifiedNodes[0]`);
        return this.context.lastModifiedNodes;
      }
      if (this.context.lastAddedNodes.length > 0) {
        console.log(`✅ Resolved "${lower}" → lastAddedNodes[0]`);
        return [this.context.lastAddedNodes[0]];
      }
    }
    
    console.warn(`⚠️ Could not resolve pronoun: "${lower}"`);
    return null;
  }
  
  /**
   * Get context summary for AI prompt
   */
  getContextSummary(allNodes: Array<{ id: string; label: string }>): string {
    const parts: string[] = [];
    
    // Active focus
    if (this.context.activeFocus) {
      const focusLabels = this.context.activeFocus.nodeIds
        .map(id => allNodes.find(n => n.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      parts.push(`🎯 Active Focus: ${this.context.activeFocus.topic} (${focusLabels})`);
    }
    
    // Last added
    if (this.context.lastAddedNodes.length > 0) {
      const labels = this.context.lastAddedNodes
        .map(id => allNodes.find(n => n.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      parts.push(`➕ Last Added: ${labels} (${this.context.lastAddedNodes.length} nodes)`);
    }
    
    // Last modified
    if (this.context.lastModifiedNodes.length > 0) {
      const labels = this.context.lastModifiedNodes
        .map(id => allNodes.find(n => n.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      parts.push(`✏️ Last Modified: ${labels} (${this.context.lastModifiedNodes.length} nodes)`);
    }
    
    // Recent actions
    if (this.context.actionHistory.length > 0) {
      const recentActions = this.context.actionHistory.slice(0, 3).map(a => 
        `- ${a.action}: ${a.description}`
      ).join('\n');
      parts.push(`📜 Recent Actions:\n${recentActions}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : 'No active context';
  }
  
  /**
   * Check if command contains pronouns
   */
  containsPronoun(command: string): boolean {
    const lower = command.toLowerCase();
    const pronouns = ['them', 'it', 'these', 'those', 'they', 'that', 'this'];
    return pronouns.some(p => lower.includes(p));
  }
  
  /**
   * Get the context
   */
  getContext(): ChatContext {
    return { ...this.context };
  }
  
  /**
   * Set selected node (for single-node operations)
   */
  setSelectedNode(nodeId: string | null): void {
    this.context.lastSelectedNode = nodeId;
    console.log(`📍 Selected node updated: ${nodeId}`);
  }
  
  /**
   * Clear context (new topic or explicit reset)
   */
  clearContext(): void {
    console.log('🧹 Clearing context');
    this.context = {
      lastAddedNodes: [],
      lastModifiedNodes: [],
      lastDeletedNodes: [],
      lastSelectedNode: null,
      actionHistory: [],
      activeFocus: null,
    };
  }
  
  /**
   * Check if context is stale (older than 5 minutes)
   */
  isContextStale(): boolean {
    if (!this.context.activeFocus) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.context.activeFocus.timestamp > fiveMinutes;
  }
  
  /**
   * Get active focus node IDs
   */
  getActiveFocusNodes(): string[] {
    return this.context.activeFocus?.nodeIds || [];
  }
}

// Export singleton instance
export const chatContextManager = new ChatContextManager();


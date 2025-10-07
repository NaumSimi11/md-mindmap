/**
 * TreeLayout - Hierarchical tree layout algorithm
 * Places nodes in a tree structure, either top-down or left-right
 */

import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutEdge,
  LayoutDimensions,
  LayoutConfig,
  calculateNodeLevels,
  groupNodesByLevel,
} from '../LayoutEngine';

export type TreeDirection = 'vertical' | 'horizontal';

export interface TreeLayoutConfig extends LayoutConfig {
  direction?: TreeDirection;
  siblingSpacing?: number; // Horizontal spacing between siblings
}

export class TreeLayout implements LayoutAlgorithm {
  name = 'Tree';
  description = 'Hierarchical top-down or left-right tree layout';
  
  private direction: TreeDirection = 'vertical';

  constructor(direction: TreeDirection = 'vertical') {
    this.direction = direction;
  }

  apply(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    dimensions: LayoutDimensions,
    config: TreeLayoutConfig = {}
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const direction = config.direction ?? this.direction;
    console.log(`🌳 TreeLayout: Applying ${direction} tree to ${nodes.length} nodes`);

    if (nodes.length === 0) {
      return { nodes: [], edges };
    }

    // Configuration
    const levelSpacing = config.levelSpacing ?? 120; // Spacing between levels
    const siblingSpacing = config.siblingSpacing ?? 150; // Spacing between siblings
    const nodeWidth = 120; // Assumed node width
    const nodeHeight = 60; // Assumed node height

    // Calculate levels if not already set
    const nodesWithLevels = calculateNodeLevels(nodes, edges);
    
    // Group by level
    const levelGroups = groupNodesByLevel(nodesWithLevels);
    const maxLevel = Math.max(...Array.from(levelGroups.keys()));

    console.log(`🌳 TreeLayout: ${levelGroups.size} levels detected (0-${maxLevel})`);

    // Track preserved nodes
    const preservedNodes = new Set<string>();
    if (config.preservePositions) {
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          preservedNodes.add(node.id);
        }
      });
      console.log(`🌳 TreeLayout: Preserving ${preservedNodes.size} manually positioned nodes`);
    }

    // Build parent-child map for better spacing
    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    if (direction === 'vertical') {
      return this.applyVerticalTree(
        nodesWithLevels,
        levelGroups,
        maxLevel,
        dimensions,
        preservedNodes,
        levelSpacing,
        siblingSpacing,
        childrenMap
      );
    } else {
      return this.applyHorizontalTree(
        nodesWithLevels,
        levelGroups,
        maxLevel,
        dimensions,
        preservedNodes,
        levelSpacing,
        siblingSpacing,
        childrenMap
      );
    }
  }

  /**
   * Apply vertical tree (top-down)
   */
  private applyVerticalTree(
    nodesWithLevels: LayoutNode[],
    levelGroups: Map<number, LayoutNode[]>,
    maxLevel: number,
    dimensions: LayoutDimensions,
    preservedNodes: Set<string>,
    levelSpacing: number,
    siblingSpacing: number,
    childrenMap: Map<string, string[]>
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const startY = 80; // Top margin
    const totalWidth = dimensions.width * 0.9;
    const startX = dimensions.width * 0.05;

    const layoutedNodes = nodesWithLevels.map(node => {
      // Preserve manually positioned nodes
      if (preservedNodes.has(node.id)) {
        return node;
      }

      const level = node.level ?? 0;
      const nodesAtLevel = levelGroups.get(level) ?? [];
      const indexInLevel = nodesAtLevel.findIndex(n => n.id === node.id);

      // Calculate Y position (level-based)
      const y = startY + level * levelSpacing;

      // Calculate X position (spread evenly across width)
      let x: number;
      if (nodesAtLevel.length === 1) {
        // Single node at this level - center it
        x = dimensions.centerX;
      } else {
        // Multiple nodes - distribute evenly
        const spacing = totalWidth / (nodesAtLevel.length + 1);
        x = startX + spacing * (indexInLevel + 1);
      }

      return {
        ...node,
        x,
        y,
      };
    });

    console.log('🌳 TreeLayout: Vertical tree complete');
    return { nodes: layoutedNodes, edges: [] };
  }

  /**
   * Apply horizontal tree (left-right)
   */
  private applyHorizontalTree(
    nodesWithLevels: LayoutNode[],
    levelGroups: Map<number, LayoutNode[]>,
    maxLevel: number,
    dimensions: LayoutDimensions,
    preservedNodes: Set<string>,
    levelSpacing: number,
    siblingSpacing: number,
    childrenMap: Map<string, string[]>
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const startX = 80; // Left margin
    const totalHeight = dimensions.height * 0.9;
    const startY = dimensions.height * 0.05;

    const layoutedNodes = nodesWithLevels.map(node => {
      // Preserve manually positioned nodes
      if (preservedNodes.has(node.id)) {
        return node;
      }

      const level = node.level ?? 0;
      const nodesAtLevel = levelGroups.get(level) ?? [];
      const indexInLevel = nodesAtLevel.findIndex(n => n.id === node.id);

      // Calculate X position (level-based)
      const x = startX + level * levelSpacing;

      // Calculate Y position (spread evenly across height)
      let y: number;
      if (nodesAtLevel.length === 1) {
        // Single node at this level - center it
        y = dimensions.centerY;
      } else {
        // Multiple nodes - distribute evenly
        const spacing = totalHeight / (nodesAtLevel.length + 1);
        y = startY + spacing * (indexInLevel + 1);
      }

      return {
        ...node,
        x,
        y,
      };
    });

    console.log('🌳 TreeLayout: Horizontal tree complete');
    return { nodes: layoutedNodes, edges: [] };
  }
}

// Export instances
export const treeVerticalLayout = new TreeLayout('vertical');
export const treeHorizontalLayout = new TreeLayout('horizontal');

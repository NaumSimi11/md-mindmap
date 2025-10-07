/**
 * RadialLayout - Concentric circles layout algorithm
 * Places nodes in circular rings based on their hierarchy level
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

export class RadialLayout implements LayoutAlgorithm {
  name = 'Radial';
  description = 'Concentric circles layout with nodes arranged by hierarchy level';

  apply(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    dimensions: LayoutDimensions,
    config: LayoutConfig = {}
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    console.log('🎨 RadialLayout: Applying to', nodes.length, 'nodes');

    if (nodes.length === 0) {
      return { nodes: [], edges };
    }

    // Configuration
    const radiusIncrement = config.levelSpacing ?? 150; // Distance between rings
    const minRadius = 100; // Minimum radius for first ring
    const nodeRadius = 25; // Visual node radius for spacing

    // Calculate levels if not already set
    const nodesWithLevels = calculateNodeLevels(nodes, edges);
    
    // Group by level
    const levelGroups = groupNodesByLevel(nodesWithLevels);
    const maxLevel = Math.max(...Array.from(levelGroups.keys()));

    console.log(`🎨 RadialLayout: ${levelGroups.size} levels detected (0-${maxLevel})`);

    // Track which nodes to preserve (manually positioned)
    const preservedNodes = new Set<string>();
    if (config.preservePositions) {
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          preservedNodes.add(node.id);
        }
      });
      console.log(`🎨 RadialLayout: Preserving ${preservedNodes.size} manually positioned nodes`);
    }

    // Layout nodes by level
    const layoutedNodes = nodesWithLevels.map(node => {
      // Preserve manually positioned nodes
      if (preservedNodes.has(node.id)) {
        console.log(`🎨 RadialLayout: Preserving position for node ${node.id}`);
        return node;
      }

      const level = node.level ?? 0;
      const nodesAtLevel = levelGroups.get(level) ?? [];
      const indexInLevel = nodesAtLevel.findIndex(n => n.id === node.id);

      if (level === 0) {
        // Root node(s) at center
        if (nodesAtLevel.length === 1) {
          // Single root - place at exact center
          return {
            ...node,
            x: dimensions.centerX,
            y: dimensions.centerY,
          };
        } else {
          // Multiple roots - arrange in small circle
          const angle = (indexInLevel / nodesAtLevel.length) * 2 * Math.PI;
          const radius = minRadius / 2;
          return {
            ...node,
            x: dimensions.centerX + Math.cos(angle) * radius,
            y: dimensions.centerY + Math.sin(angle) * radius,
          };
        }
      } else {
        // Nodes in concentric rings
        const radius = minRadius + (level - 1) * radiusIncrement;
        const angleStep = (2 * Math.PI) / nodesAtLevel.length;
        const angle = indexInLevel * angleStep;
        
        // Add slight rotation offset per level for better visual distribution
        const levelOffset = (level * Math.PI) / (maxLevel + 1);

        return {
          ...node,
          x: dimensions.centerX + Math.cos(angle + levelOffset) * radius,
          y: dimensions.centerY + Math.sin(angle + levelOffset) * radius,
        };
      }
    });

    console.log('🎨 RadialLayout: Layout complete');

    return {
      nodes: layoutedNodes,
      edges,
    };
  }
}

// Export singleton instance
export const radialLayout = new RadialLayout();

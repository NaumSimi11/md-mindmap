/**
 * ForceLayout - Physics-based organic layout using force simulation
 * Nodes attract/repel each other naturally
 */

import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutEdge,
  LayoutDimensions,
  LayoutConfig,
} from '../LayoutEngine';

export interface ForceLayoutConfig extends LayoutConfig {
  strength?: number; // Link strength (0-1)
  distance?: number; // Target link distance
  charge?: number; // Node repulsion strength (negative)
  iterations?: number; // Number of simulation iterations
}

export class ForceLayout implements LayoutAlgorithm {
  name = 'Force';
  description = 'Physics-based organic layout with natural spacing';

  apply(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    dimensions: LayoutDimensions,
    config: ForceLayoutConfig = {}
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    console.log(`⚛️ ForceLayout: Applying physics simulation to ${nodes.length} nodes`);

    if (nodes.length === 0) {
      return { nodes: [], edges };
    }

    // Configuration
    const strength = config.strength ?? 0.3;
    const distance = config.distance ?? 100;
    const charge = config.charge ?? -300;
    const iterations = config.iterations ?? 300;

    // Track preserved nodes
    const preservedNodes = new Set<string>();
    if (config.preservePositions) {
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          preservedNodes.add(node.id);
        }
      });
      console.log(`⚛️ ForceLayout: Preserving ${preservedNodes.size} manually positioned nodes`);
    }

    // Create mutable copies
    const layoutNodes = nodes.map(node => ({
      ...node,
      x: node.x ?? dimensions.centerX + (Math.random() - 0.5) * 200,
      y: node.y ?? dimensions.centerY + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));

    // Build node map for quick lookup
    const nodeMap = new Map<string, typeof layoutNodes[0]>();
    layoutNodes.forEach(node => nodeMap.set(node.id, node));

    // Run force simulation manually (simplified D3 force simulation)
    for (let iteration = 0; iteration < iterations; iteration++) {
      const alpha = 1 - (iteration / iterations); // Cooling factor

      // Apply link forces (attraction)
      edges.forEach(edge => {
        const source = nodeMap.get(typeof edge.source === 'string' ? edge.source : edge.source.id);
        const target = nodeMap.get(typeof edge.target === 'string' ? edge.target : edge.target.id);

        if (!source || !target) return;
        if (preservedNodes.has(source.id) && preservedNodes.has(target.id)) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - distance) * strength * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!preservedNodes.has(source.id)) {
          source.vx += fx;
          source.vy += fy;
        }

        if (!preservedNodes.has(target.id)) {
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Apply charge forces (repulsion between all nodes)
      for (let i = 0; i < layoutNodes.length; i++) {
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const nodeA = layoutNodes[i];
          const nodeB = layoutNodes[j];

          if (preservedNodes.has(nodeA.id) && preservedNodes.has(nodeB.id)) continue;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;

          // Coulomb's law: F = k * q1 * q2 / r^2
          const force = charge * alpha / distSq;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!preservedNodes.has(nodeA.id)) {
            nodeA.vx += fx;
            nodeA.vy += fy;
          }

          if (!preservedNodes.has(nodeB.id)) {
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        }
      }

      // Apply centering force (keep nodes from drifting away)
      const centerForce = 0.01 * alpha;
      layoutNodes.forEach(node => {
        if (preservedNodes.has(node.id)) return;

        const dx = dimensions.centerX - node.x;
        const dy = dimensions.centerY - node.y;

        node.vx += dx * centerForce;
        node.vy += dy * centerForce;
      });

      // Update positions and apply velocity decay
      const velocityDecay = 0.6;
      layoutNodes.forEach(node => {
        if (preservedNodes.has(node.id)) return;

        node.vx *= velocityDecay;
        node.vy *= velocityDecay;

        node.x += node.vx;
        node.y += node.vy;
      });
    }

    // Remove velocity properties before returning
    const finalNodes = layoutNodes.map(({ vx, vy, ...node }) => node);

    console.log('⚛️ ForceLayout: Simulation complete');
    return { nodes: finalNodes, edges };
  }
}

// Export instance
export const forceLayout = new ForceLayout();

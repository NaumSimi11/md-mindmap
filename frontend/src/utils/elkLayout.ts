/**
 * ELK Layout Utilities for React Flow
 * Provides automatic graph layouts using ELK.js
 */

import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export interface LayoutOptions {
  direction?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  spacing?: number;
}

export async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  algorithm: 'layered' | 'force' | 'radial' | 'tree' = 'layered',
  options: LayoutOptions = {}
) {
  const { direction = 'DOWN', spacing = 150 } = options;

  // Map algorithm to ELK algorithm
  const elkAlgorithm = algorithm === 'tree' ? 'layered' : algorithm;

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': elkAlgorithm,
      'elk.direction': direction,
      'elk.spacing.nodeNode': spacing.toString(),
      'elk.layered.spacing.nodeNodeBetweenLayers': (spacing * 1.5).toString(),
      ...(elkAlgorithm === 'layered' && {
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      }),
      ...(elkAlgorithm === 'force' && {
        'elk.force.iterations': '300',
        'elk.force.repulsion': '10',
      }),
      ...(elkAlgorithm === 'radial' && {
        'elk.radial.radius': '200',
      }),
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 150,
      height: 50,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(graph);

    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      if (elkNode) {
        return {
          ...node,
          position: {
            x: elkNode.x ?? node.position.x,
            y: elkNode.y ?? node.position.y,
          },
        };
      }
      return node;
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('ELK layout failed:', error);
    return { nodes, edges }; // Return original if layout fails
  }
}

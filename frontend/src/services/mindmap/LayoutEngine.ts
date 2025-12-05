/**
 * LayoutEngine - Manages mindmap layout algorithms
 * Provides pluggable layout system with multiple algorithms
 */

export interface LayoutNode {
  id: string;
  label: string;
  level?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  parent?: string;
  [key: string]: any;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface LayoutDimensions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface LayoutConfig {
  preservePositions?: boolean; // Keep manually positioned nodes
  nodeSpacing?: number; // Minimum spacing between nodes
  levelSpacing?: number; // Vertical/radial spacing between levels
  animate?: boolean; // Animate transitions
}

export interface LayoutAlgorithm {
  name: string;
  description: string;
  apply(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    dimensions: LayoutDimensions,
    config?: LayoutConfig
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] };
}

/**
 * Layout Engine - Registry and manager for layout algorithms
 */
export class LayoutEngine {
  private algorithms: Map<string, LayoutAlgorithm> = new Map();
  private currentLayout: string = 'radial';

  constructor() {
    console.log('🎨 LayoutEngine: Initializing');
  }

  /**
   * Register a layout algorithm
   */
  register(id: string, algorithm: LayoutAlgorithm): void {
    console.log(`🎨 LayoutEngine: Registering layout "${id}"`);
    this.algorithms.set(id, algorithm);
  }

  /**
   * Get all available layouts
   */
  getAvailableLayouts(): Array<{ id: string; name: string; description: string }> {
    return Array.from(this.algorithms.entries()).map(([id, algo]) => ({
      id,
      name: algo.name,
      description: algo.description,
    }));
  }

  /**
   * Apply a layout algorithm
   */
  apply(
    layoutId: string,
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    dimensions: LayoutDimensions,
    config: LayoutConfig = {}
  ): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
    const algorithm = this.algorithms.get(layoutId);
    
    if (!algorithm) {
      console.error(`🎨 LayoutEngine: Layout "${layoutId}" not found`);
      throw new Error(`Layout algorithm "${layoutId}" not found`);
    }

    console.log(`🎨 LayoutEngine: Applying "${layoutId}" layout to ${nodes.length} nodes`);
    
    const result = algorithm.apply(nodes, edges, dimensions, config);
    this.currentLayout = layoutId;
    
    console.log(`🎨 LayoutEngine: Layout "${layoutId}" applied successfully`);
    return result;
  }

  /**
   * Get current layout ID
   */
  getCurrentLayout(): string {
    return this.currentLayout;
  }

  /**
   * Set current layout
   */
  setCurrentLayout(layoutId: string): void {
    if (!this.algorithms.has(layoutId)) {
      throw new Error(`Layout algorithm "${layoutId}" not found`);
    }
    this.currentLayout = layoutId;
  }
}

/**
 * Helper: Calculate node levels based on parent relationships
 */
export function calculateNodeLevels(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): LayoutNode[] {
  // Build parent-child map
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });

  // Find root nodes (no parents)
  const rootNodes = nodes.filter(node => !parentMap.has(node.id));
  
  if (rootNodes.length === 0 && nodes.length > 0) {
    // No clear hierarchy, treat first node as root
    rootNodes.push(nodes[0]);
  }

  // BFS to assign levels
  const levelsMap = new Map<string, number>();
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  rootNodes.forEach(root => {
    levelsMap.set(root.id, 0);
    queue.push({ nodeId: root.id, level: 0 });
  });

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    const children = childrenMap.get(nodeId) || [];
    
    children.forEach(childId => {
      if (!levelsMap.has(childId)) {
        levelsMap.set(childId, level + 1);
        queue.push({ nodeId: childId, level: level + 1 });
      }
    });
  }

  // Assign levels to nodes
  return nodes.map(node => ({
    ...node,
    level: levelsMap.get(node.id) ?? 0,
  }));
}

/**
 * Helper: Group nodes by level
 */
export function groupNodesByLevel(nodes: LayoutNode[]): Map<number, LayoutNode[]> {
  const levelMap = new Map<number, LayoutNode[]>();
  
  nodes.forEach(node => {
    const level = node.level ?? 0;
    if (!levelMap.has(level)) {
      levelMap.set(level, []);
    }
    levelMap.get(level)!.push(node);
  });
  
  return levelMap;
}

/**
 * Helper: Calculate bounding box of nodes
 */
export function calculateBounds(nodes: LayoutNode[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const width = node.width ?? 50;
    const height = node.height ?? 50;

    minX = Math.min(minX, x - width / 2);
    maxX = Math.max(maxX, x + width / 2);
    minY = Math.min(minY, y - height / 2);
    maxY = Math.max(maxY, y + height / 2);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Create and export singleton instance
export const layoutEngine = new LayoutEngine();

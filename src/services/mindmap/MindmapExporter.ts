/**
 * MindmapExporter - Export mindmaps to various formats
 * Supports Mermaid (Flowchart, Mindmap, Graph, Sequence, Class), Markdown, JSON
 */

export interface ExportNode {
  id: string;
  label: string;
  level?: number;
  parent?: string;
  x?: number;
  y?: number;
  [key: string]: any;
}

export interface ExportEdge {
  id?: string;
  source: string;
  target: string;
  type?: string;
  [key: string]: any;
}

export interface MindmapData {
  title?: string;
  nodes: ExportNode[];
  edges: ExportEdge[];
  [key: string]: any;
}

export type ExportFormat = 
  | 'mermaid-flowchart'
  | 'mermaid-mindmap'
  | 'mermaid-graph'
  | 'mermaid-sequence'
  | 'mermaid-class'
  | 'markdown'
  | 'json';

export class MindmapExporter {
  /**
   * Export mindmap to specified format
   */
  export(data: MindmapData, format: ExportFormat): string {
    console.log(`📤 MindmapExporter: Exporting to ${format}`);

    switch (format) {
      case 'mermaid-flowchart':
        return this.toMermaidFlowchart(data);
      case 'mermaid-mindmap':
        return this.toMermaidMindmap(data);
      case 'mermaid-graph':
        return this.toMermaidGraph(data);
      case 'mermaid-sequence':
        return this.toMermaidSequence(data);
      case 'mermaid-class':
        return this.toMermaidClass(data);
      case 'markdown':
        return this.toMarkdown(data);
      case 'json':
        return this.toJSON(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export as Mermaid Flowchart
   */
  toMermaidFlowchart(data: MindmapData): string {
    const { nodes, edges } = data;
    let mermaid = 'flowchart TD\n';

    // Add nodes
    nodes.forEach(node => {
      const cleanLabel = this.sanitizeMermaidLabel(node.label);
      mermaid += `    ${node.id}["${cleanLabel}"]\n`;
    });

    // Add edges
    edges.forEach(edge => {
      mermaid += `    ${edge.source} --> ${edge.target}\n`;
    });

    return mermaid;
  }

  /**
   * Export as Mermaid Mindmap
   */
  toMermaidMindmap(data: MindmapData): string {
    const { nodes, edges } = data;
    
    // Build parent-child map
    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    // Find root node (no parent)
    const parentMap = new Map<string, string>();
    edges.forEach(edge => {
      parentMap.set(edge.target, edge.source);
    });
    
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));
    const rootNode = rootNodes[0] || nodes[0];

    if (!rootNode) {
      return 'mindmap\n  root((Empty))';
    }

    let mermaid = 'mindmap\n';
    
    // Recursive function to build mindmap
    const buildMindmap = (nodeId: string, indent: number): void => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const cleanLabel = this.sanitizeMermaidLabel(node.label);
      const indentation = '  '.repeat(indent);
      
      if (indent === 0) {
        // Root node
        mermaid += `${indentation}root((${cleanLabel}))\n`;
      } else {
        // Child nodes
        mermaid += `${indentation}${cleanLabel}\n`;
      }

      // Add children
      const children = childrenMap.get(nodeId) || [];
      children.forEach(childId => {
        buildMindmap(childId, indent + 1);
      });
    };

    buildMindmap(rootNode.id, 0);

    return mermaid;
  }

  /**
   * Export as Mermaid Graph
   */
  toMermaidGraph(data: MindmapData): string {
    const { nodes, edges } = data;
    let mermaid = 'graph LR\n';

    // Add nodes
    nodes.forEach(node => {
      const cleanLabel = this.sanitizeMermaidLabel(node.label);
      mermaid += `    ${node.id}["${cleanLabel}"]\n`;
    });

    // Add edges
    edges.forEach(edge => {
      mermaid += `    ${edge.source} --- ${edge.target}\n`;
    });

    return mermaid;
  }

  /**
   * Export as Mermaid Sequence Diagram
   */
  toMermaidSequence(data: MindmapData): string {
    const { nodes, edges } = data;
    let mermaid = 'sequenceDiagram\n';

    // For sequence diagrams, we'll interpret nodes as participants
    // and edges as messages
    nodes.forEach(node => {
      const cleanLabel = this.sanitizeMermaidLabel(node.label);
      mermaid += `    participant ${node.id} as ${cleanLabel}\n`;
    });

    mermaid += '\n';

    // Add interactions
    edges.forEach(edge => {
      mermaid += `    ${edge.source}->> ${edge.target}: interaction\n`;
    });

    return mermaid;
  }

  /**
   * Export as Mermaid Class Diagram
   */
  toMermaidClass(data: MindmapData): string {
    const { nodes, edges } = data;
    let mermaid = 'classDiagram\n';

    // Add classes
    nodes.forEach(node => {
      const cleanLabel = this.sanitizeMermaidLabel(node.label);
      mermaid += `    class ${node.id} {\n`;
      mermaid += `        +${cleanLabel}\n`;
      mermaid += `    }\n`;
    });

    // Add relationships
    edges.forEach(edge => {
      mermaid += `    ${edge.source} --> ${edge.target}\n`;
    });

    return mermaid;
  }

  /**
   * Export as Markdown hierarchy
   */
  toMarkdown(data: MindmapData): string {
    const { nodes, edges } = data;
    
    // Build parent-child map
    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    });

    // Find root nodes
    const parentMap = new Map<string, string>();
    edges.forEach(edge => {
      parentMap.set(edge.target, edge.source);
    });
    
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));

    let markdown = `# ${data.title || 'Mindmap'}\n\n`;

    // Recursive function to build hierarchy
    const buildHierarchy = (nodeId: string, level: number): void => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const indent = '  '.repeat(level);
      const prefix = level === 0 ? '## ' : '- ';
      markdown += `${indent}${prefix}${node.label}\n`;

      // Add children
      const children = childrenMap.get(nodeId) || [];
      children.forEach(childId => {
        buildHierarchy(childId, level + 1);
      });
    };

    rootNodes.forEach(root => buildHierarchy(root.id, 0));

    return markdown;
  }

  /**
   * Export as JSON
   */
  toJSON(data: MindmapData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Sanitize label for Mermaid syntax
   */
  private sanitizeMermaidLabel(label: string): string {
    return label
      .replace(/"/g, "'") // Replace double quotes
      .replace(/\[/g, "(") // Replace brackets
      .replace(/\]/g, ")")
      .replace(/\{/g, "(")
      .replace(/\}/g, ")")
      .trim();
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): Array<{
    id: ExportFormat;
    name: string;
    description: string;
    extension: string;
  }> {
    return [
      {
        id: 'mermaid-flowchart',
        name: 'Mermaid Flowchart',
        description: 'Top-down flowchart diagram',
        extension: '.flowchart.md',
      },
      {
        id: 'mermaid-mindmap',
        name: 'Mermaid Mindmap',
        description: 'Hierarchical mindmap',
        extension: '.mindmap.md',
      },
      {
        id: 'mermaid-graph',
        name: 'Mermaid Graph',
        description: 'Network graph',
        extension: '.graph.md',
      },
      {
        id: 'mermaid-sequence',
        name: 'Mermaid Sequence',
        description: 'Sequence diagram',
        extension: '.sequence.md',
      },
      {
        id: 'mermaid-class',
        name: 'Mermaid Class',
        description: 'Class diagram',
        extension: '.class.md',
      },
      {
        id: 'markdown',
        name: 'Markdown',
        description: 'Hierarchical list',
        extension: '.md',
      },
      {
        id: 'json',
        name: 'JSON',
        description: 'Full data export',
        extension: '.json',
      },
    ];
  }

  /**
   * Download exported content as file
   */
  download(content: string, filename: string, mimeType: string = 'text/markdown'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded: ${filename}`);
  }
}

// Export singleton instance
export const mindmapExporter = new MindmapExporter();

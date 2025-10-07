/*
 High-level mindmap generation utilities.
 Ported from mdtauri-main/src/services/MindmapGenerator.js and adapted to TypeScript.
*/

export type MindmapItemType = 'heading' | 'concept' | 'root';

export interface MindmapNode {
  id: string;
  text: string;
  level: number;
  lineNumber?: number;
  type: MindmapItemType;
}

export interface MindmapConnection {
  from: string;
  to: string;
  type: 'hierarchy' | 'association' | 'flow' | 'parent-child';
}

export interface MindmapMetadata {
  sourceType: string;
  generatedAt: string;
  nodeCount: number;
}

export interface MindmapData {
  nodes: MindmapNode[];
  connections: MindmapConnection[];
  metadata: MindmapMetadata;
  // Optional extension bag for richer UIs (e.g., milestones)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  milestones?: any[];
}

export class MindmapGenerator {
  private nodeIdCounter: number;

  constructor() {
    this.nodeIdCounter = 0;
  }

  generateFromHeadings(content: string): MindmapData {
    const headings = this.extractHeadings(content);
    return this.createMindmapStructure(headings);
  }

  generateFromSelection(selectedText: string): MindmapData {
    const concepts = this.extractConcepts(selectedText);
    return this.createMindmapStructure(concepts);
  }

  extractHeadings(content: string): MindmapNode[] {
    if (!content || typeof content !== 'string') return [];

    const lines = content.split('\n');
    const headings: MindmapNode[] = [];

    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        headings.push({
          id: this.generateNodeId(),
          text,
          level,
          lineNumber: index + 1,
          type: 'heading',
        });
      }
    });

    return headings;
  }

  extractConcepts(text: string): MindmapNode[] {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split('\n');
    const concepts: MindmapNode[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const words = trimmedLine.split(/\s+/);
        const keyWords = words.filter((word) =>
          word.length > 2 && /^[A-Z]/.test(word) &&
          !['The', 'And', 'Or', 'But', 'For', 'With', 'From', 'This', 'That'].includes(word)
        );

        if (keyWords.length > 0) {
          concepts.push({
            id: this.generateNodeId(),
            text: keyWords.slice(0, 3).join(' '),
            level: 1,
            lineNumber: index + 1,
            type: 'concept',
          });
        }
      }
    });

    return concepts.slice(0, 10);
  }

  createMindmapStructure(items: MindmapNode[]): MindmapData {
    if (!items || items.length === 0) {
      return {
        nodes: [],
        connections: [],
        metadata: {
          sourceType: 'empty',
          generatedAt: new Date().toISOString(),
          nodeCount: 0,
        },
      };
    }

    const nodes: MindmapNode[] = [];
    const connections: MindmapConnection[] = [];

    let rootNode: MindmapNode | null = null;
    if (!items.some((item) => item.level === 1)) {
      rootNode = {
        id: this.generateNodeId(),
        text: 'Document',
        level: 0,
        type: 'root',
      };
      nodes.push(rootNode);
    }

    const itemsByLevel = this.groupByLevel(items);
    Object.keys(itemsByLevel)
      .map((k) => parseInt(k))
      .sort((a, b) => a - b)
      .forEach((level) => {
        const levelItems = itemsByLevel[level] ?? [];
        const parentLevel = level - 1;

        levelItems.forEach((item) => {
          nodes.push(item);
          const parent = this.findParentNode(item, itemsByLevel[parentLevel] ?? [], rootNode);
          if (parent) {
            connections.push({
              from: parent.id,
              to: item.id,
              type: 'hierarchy',
            });
          }
        });
      });

    return {
      nodes,
      connections,
      metadata: {
        sourceType: items[0]?.type ?? 'unknown',
        generatedAt: new Date().toISOString(),
        nodeCount: nodes.length,
      },
    };
  }

  // Parse a simple Mermaid flowchart/graph into MindmapData (best-effort)
  fromMermaid(code: string): MindmapData {
    if (!code) {
      return { nodes: [], connections: [], metadata: { sourceType: 'mermaid', generatedAt: new Date().toISOString(), nodeCount: 0 } };
    }

    // Strip fences
    let src = code.trim();
    src = src.replace(/^```mermaid\n?/i, '').replace(/```$/i, '').trim();

    const nodeById = new Map<string, MindmapNode>();
    const edges: MindmapConnection[] = [];

    const lines = src.split('\n').map((l) => l.trim());
    const nodeDeclRegexes = [
      /^(\w+)\s*\[\s*"?(.+?)"?\s*\]$/,           // A["Label"] or A[Label]
      /^(\w+)\s*\(\s*"?(.+?)"?\s*\)$/,           // A("Label") or A(Label)
      /^(\w+)\s*\(\(\s*"?(.+?)"?\s*\)\)$/,     // A((Label))
    ];
    const edgeRegex = /(\w+)\s*-{1,3}>{1}\s*(\w+)/;   // A --> B or A -> B

    for (const line of lines) {
      if (!line || line.startsWith('%') || line.startsWith('%%')) continue;
      // Detect node declarations
      let matched = false;
      for (const re of nodeDeclRegexes) {
        const m = line.match(re);
        if (m) {
          const id = m[1];
          const label = (m[2] || m[3] || m[4] || id).trim();
          if (!nodeById.has(id)) {
            nodeById.set(id, { id, text: label, level: 1, type: 'concept' });
          }
          matched = true;
          break;
        }
      }
      if (matched) continue;
      // Detect edges
      const e = line.match(edgeRegex);
      if (e) {
        const from = e[1];
        const to = e[2];
        if (!nodeById.has(from)) nodeById.set(from, { id: from, text: from, level: 1, type: 'concept' });
        if (!nodeById.has(to)) nodeById.set(to, { id: to, text: to, level: 1, type: 'concept' });
        edges.push({ from, to, type: 'hierarchy' });
      }
    }

    // Level assignment via BFS from roots (nodes with no incoming edges)
    const indeg = new Map<string, number>();
    for (const id of nodeById.keys()) indeg.set(id, 0);
    edges.forEach(({ to }) => indeg.set(to, (indeg.get(to) || 0) + 1));
    const roots = Array.from(nodeById.keys()).filter((id) => (indeg.get(id) || 0) === 0);
    const queue: Array<{ id: string; level: number }> = roots.map((id) => ({ id, level: 1 }));
    const visited = new Set<string>();
    while (queue.length) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodeById.get(id)!;
      node.level = level;
      edges.filter((e) => e.from === id).forEach((e) => queue.push({ id: e.to, level: level + 1 }));
    }

    const nodes = Array.from(nodeById.values());
    return {
      nodes,
      connections: edges,
      metadata: { sourceType: 'mermaid', generatedAt: new Date().toISOString(), nodeCount: nodes.length },
    };
  }

  private groupByLevel(items: MindmapNode[]): Record<number, MindmapNode[]> {
    return items.reduce<Record<number, MindmapNode[]>>((groups, item) => {
      const level = item.level;
      if (!groups[level]) {
        groups[level] = [];
      }
      groups[level].push(item);
      return groups;
    }, {});
  }

  private findParentNode(
    item: MindmapNode,
    potentialParents: MindmapNode[],
    rootNode: MindmapNode | null
  ): MindmapNode | null {
    if (item.level === 1 && rootNode) return rootNode;
    const parentLevel = item.level - 1;
    const parents = potentialParents.filter((p) => p.level === parentLevel);
    if (parents.length > 0) return parents[0];
    return null;
  }

  exportAsJson(mindmapData: MindmapData): string {
    return JSON.stringify(mindmapData, null, 2);
  }

  exportMindmap(data: MindmapData, format: 'json' | 'flowchart' | 'mindmap' | 'graph' | 'sequence' | 'class' | 'markdown'): string {
    switch (format) {
      case 'json':
        return this.exportAsJson(data);
      case 'flowchart':
        return this.toMermaidFlowchart(data);
      case 'mindmap':
        return this.toMermaidMindmap(data);
      case 'graph':
        return this.toMermaidGraph(data);
      case 'sequence':
        return this.toMermaidSequence(data);
      case 'class':
        return this.toMermaidClass(data);
      case 'markdown':
        return this.toMarkdown(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  toMermaidFlowchart(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return 'flowchart TD\n  A[No data]';
    let mermaid = 'flowchart TD\n';
    data.nodes.forEach((node) => {
      const nodeId = this.sanitizeNodeId(node.id);
      const nodeText = this.escapeMermaidText(node.text);
      mermaid += `  ${nodeId}["${nodeText}"]\n`;
    });
    data.connections.forEach((conn) => {
      const fromId = this.sanitizeNodeId(conn.from);
      const toId = this.sanitizeNodeId(conn.to);
      mermaid += `  ${fromId} --> ${toId}\n`;
    });
    return mermaid;
  }

  toMermaidMindmap(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return 'mindmap\n  root((No data))';
    let mermaid = 'mindmap\n';
    const rootNode = data.nodes.find((n) => n.level === 0 || n.level === 1);
    if (!rootNode) return 'mindmap\n  root((No root))';
    mermaid += `  root(("${this.escapeMermaidText(rootNode.text)}"))\n`;

    const children = data.nodes.filter((n) => data.connections.some((c) => c.from === rootNode.id && c.to === n.id));
    children.forEach((child) => {
      mermaid += `    ${this.escapeMermaidText(child.text)}\n`;
      const grandchildren = data.nodes.filter((n) => data.connections.some((c) => c.from === child.id && c.to === n.id));
      grandchildren.forEach((g) => {
        mermaid += `      ${this.escapeMermaidText(g.text)}\n`;
      });
    });
    return mermaid;
  }

  toMermaidGraph(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return 'graph TD\n  A[No data]';
    let mermaid = 'graph TD\n';
    data.nodes.forEach((node) => {
      const nodeId = this.sanitizeNodeId(node.id);
      const nodeText = this.escapeMermaidText(node.text);
      if (node.level === 0 || node.level === 1) {
        mermaid += `  ${nodeId}(("${nodeText}"))\n`;
      } else if (node.level === 2) {
        mermaid += `  ${nodeId}["${nodeText}"]\n`;
      } else {
        mermaid += `  ${nodeId}("${nodeText}")\n`;
      }
    });
    data.connections.forEach((conn) => {
      const fromId = this.sanitizeNodeId(conn.from);
      const toId = this.sanitizeNodeId(conn.to);
      mermaid += `  ${fromId} --> ${toId}\n`;
    });
    return mermaid;
  }

  toMermaidSequence(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return 'sequenceDiagram\n  participant A as No data';
    let mermaid = 'sequenceDiagram\n';
    const participants = data.nodes.filter((n) => n.level <= 1);
    participants.forEach((p) => {
      const id = this.sanitizeNodeId(p.id);
      const name = this.escapeMermaidText(p.text);
      mermaid += `  participant ${id} as ${name}\n`;
    });
    data.connections.forEach((conn) => {
      const fromNode = data.nodes.find((n) => n.id === conn.from);
      const toNode = data.nodes.find((n) => n.id === conn.to);
      if (fromNode && toNode && fromNode.level <= 1 && toNode.level <= 1) {
        const fromId = this.sanitizeNodeId(fromNode.id);
        const toId = this.sanitizeNodeId(toNode.id);
        mermaid += `  ${fromId}->>${toId}: ${this.escapeMermaidText(toNode.text)}\n`;
      }
    });
    return mermaid;
  }

  toMermaidClass(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return 'classDiagram\n  class NoData';
    let mermaid = 'classDiagram\n';
    data.nodes.forEach((node) => {
      const className = this.sanitizeNodeId(node.id);
      const classText = this.escapeMermaidText(node.text);
      mermaid += `  class ${className} {\n`;
      mermaid += `    ${classText}\n`;
      mermaid += `  }\n`;
    });
    data.connections.forEach((conn) => {
      const fromClass = this.sanitizeNodeId(conn.from);
      const toClass = this.sanitizeNodeId(conn.to);
      mermaid += `  ${fromClass} --> ${toClass}\n`;
    });
    return mermaid;
  }

  toMarkdown(data: MindmapData): string {
    if (!data || !data.nodes || data.nodes.length === 0) return '# Mindmap\n\n_No data_';
    const lines: string[] = [];
    const root = data.nodes.find((n) => n.level === 0 || n.level === 1);
    if (root) lines.push(`# ${root.text}`);
    const byLevel: Record<number, MindmapNode[]> = data.nodes.reduce((acc, n) => {
      if (!acc[n.level]) acc[n.level] = [];
      acc[n.level].push(n);
      return acc;
    }, {} as Record<number, MindmapNode[]>);
    Object.keys(byLevel)
      .map((k) => parseInt(k))
      .sort((a, b) => a - b)
      .forEach((lvl) => {
        if (lvl <= 1) return; // root/level-1 already conveyed by title
        byLevel[lvl].forEach((node) => {
          const depth = Math.max(0, lvl - 1);
          lines.push(`${'  '.repeat(depth)}- ${node.text}`);
        });
      });
    return lines.join('\n');
  }

  private generateNodeId(): string {
    return `node_${++this.nodeIdCounter}`;
  }

  private sanitizeNodeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, 'n$1');
  }

  private escapeMermaidText(text: string): string {
    return (text || '')
      .replace(/\"/g, '"')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .trim();
  }
}

export default MindmapGenerator;



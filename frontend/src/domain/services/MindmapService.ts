/**
 * Mindmap Service - Pure domain logic
 * 
 * Business logic for mindmap operations.
 */

import { Mindmap, MindmapNode, HeadingNode } from '../entities/Mindmap';

export class MindmapService {
    /**
     * Validate mindmap structure
     */
    static isValidStructure(mindmap: Mindmap): boolean {
        return this.validateNode(mindmap.rootNode);
    }

    /**
     * Convert mindmap to flat list of nodes
     */
    static flatten(mindmap: Mindmap): MindmapNode[] {
        const nodes: MindmapNode[] = [];
        this.collectNodes(mindmap.rootNode, nodes);
        return nodes;
    }

    /**
     * Find path from root to a specific node
     */
    static findPath(mindmap: Mindmap, targetNodeId: string): MindmapNode[] | null {
        const path: MindmapNode[] = [];
        if (this.findPathRecursive(mindmap.rootNode, targetNodeId, path)) {
            return path;
        }
        return null;
    }

    /**
     * Get all leaf nodes (nodes without children)
     */
    static getLeafNodes(mindmap: Mindmap): MindmapNode[] {
        const leaves: MindmapNode[] = [];
        this.collectLeaves(mindmap.rootNode, leaves);
        return leaves;
    }

    /**
     * Calculate statistics for mindmap
     */
    static getStatistics(mindmap: Mindmap): MindmapStatistics {
        const nodes = this.flatten(mindmap);
        const leaves = this.getLeafNodes(mindmap);

        return {
            totalNodes: nodes.length,
            leafNodes: leaves.length,
            maxDepth: mindmap.getMaxDepth(),
            averageBranchingFactor: this.calculateAverageBranching(mindmap),
        };
    }

    /**
     * Merge two mindmaps
     */
    static merge(mindmap1: Mindmap, mindmap2: Mindmap): Mindmap {
        const mergedRoot: MindmapNode = {
            id: crypto.randomUUID(),
            text: `${mindmap1.title} + ${mindmap2.title}`,
            children: [mindmap1.rootNode, mindmap2.rootNode],
        };

        return new Mindmap(
            crypto.randomUUID(),
            `Merged: ${mindmap1.title} & ${mindmap2.title}`,
            mergedRoot,
            new Date(),
            new Date()
        );
    }

    /**
     * Clone a mindmap with new IDs
     */
    static clone(mindmap: Mindmap): Mindmap {
        const clonedRoot = this.cloneNode(mindmap.rootNode);
        return new Mindmap(
            crypto.randomUUID(),
            `${mindmap.title} (Copy)`,
            clonedRoot,
            new Date(),
            new Date(),
            mindmap.sourceDocumentId
        );
    }

    /**
     * Prune mindmap to specific depth
     */
    static pruneToDepth(mindmap: Mindmap, maxDepth: number): Mindmap {
        const prunedRoot = this.pruneNodeToDepth(mindmap.rootNode, maxDepth, 0);
        return new Mindmap(
            mindmap.id,
            mindmap.title,
            prunedRoot,
            mindmap.createdAt,
            new Date(),
            mindmap.sourceDocumentId
        );
    }

    // Private helper methods

    private static validateNode(node: MindmapNode): boolean {
        if (!node.id || !node.text) return false;

        if (node.children) {
            for (const child of node.children) {
                if (!this.validateNode(child)) return false;
            }
        }

        return true;
    }

    private static collectNodes(node: MindmapNode, collection: MindmapNode[]): void {
        collection.push(node);
        if (node.children) {
            for (const child of node.children) {
                this.collectNodes(child, collection);
            }
        }
    }

    private static findPathRecursive(
        node: MindmapNode,
        targetId: string,
        path: MindmapNode[]
    ): boolean {
        path.push(node);

        if (node.id === targetId) {
            return true;
        }

        if (node.children) {
            for (const child of node.children) {
                if (this.findPathRecursive(child, targetId, path)) {
                    return true;
                }
            }
        }

        path.pop();
        return false;
    }

    private static collectLeaves(node: MindmapNode, collection: MindmapNode[]): void {
        if (!node.children || node.children.length === 0) {
            collection.push(node);
            return;
        }

        for (const child of node.children) {
            this.collectLeaves(child, collection);
        }
    }

    private static calculateAverageBranching(mindmap: Mindmap): number {
        const nodes = this.flatten(mindmap);
        const nodesWithChildren = nodes.filter(n => n.children && n.children.length > 0);

        if (nodesWithChildren.length === 0) return 0;

        const totalChildren = nodesWithChildren.reduce(
            (sum, node) => sum + (node.children?.length || 0),
            0
        );

        return totalChildren / nodesWithChildren.length;
    }

    private static cloneNode(node: MindmapNode): MindmapNode {
        return {
            id: crypto.randomUUID(),
            text: node.text,
            children: node.children?.map(child => this.cloneNode(child)),
            metadata: node.metadata ? { ...node.metadata } : undefined,
        };
    }

    // ... existing methods ...

    /**
     * Parse Mermaid code to Mindmap structure
     * Ported from MindmapGenerator
     */
    static fromMermaid(code: string): MindmapNode {
        if (!code) {
            return { id: crypto.randomUUID(), text: 'Root', children: [] };
        }

        // Strip fences
        let src = code.trim();
        src = src.replace(/^```mermaid\n?/i, '').replace(/```$/i, '').trim();

        const nodeById = new Map<string, MindmapNode>();
        const edges: { from: string; to: string }[] = [];

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
                        nodeById.set(id, { id, text: label, children: [] });
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
                if (!nodeById.has(from)) nodeById.set(from, { id: from, text: from, children: [] });
                if (!nodeById.has(to)) nodeById.set(to, { id: to, text: to, children: [] });
                edges.push({ from, to });
            }
        }

        // Build tree structure
        // Find roots (nodes with no incoming edges)
        const incomingEdges = new Set<string>();
        edges.forEach(e => incomingEdges.add(e.to));

        const roots = Array.from(nodeById.values()).filter(n => !incomingEdges.has(n.id));

        // Connect children
        edges.forEach(e => {
            const parent = nodeById.get(e.from);
            const child = nodeById.get(e.to);
            if (parent && child) {
                if (!parent.children) parent.children = [];
                parent.children.push(child);
            }
        });

        if (roots.length === 0) {
            return { id: crypto.randomUUID(), text: 'Root', children: [] };
        }

        if (roots.length === 1) {
            return roots[0];
        }

        // Multiple roots, create a virtual root
        return {
            id: crypto.randomUUID(),
            text: 'Mindmap',
            children: roots
        };
    }

    /**
     * Export mindmap to Mermaid syntax
     */
    static toMermaid(mindmap: Mindmap): string {
        let mermaid = 'mindmap\n';
        const root = mindmap.rootNode;

        mermaid += `  root(("${this.escapeMermaidText(root.text)}"))\n`;

        if (root.children) {
            this.appendMermaidChildren(root.children, 2, mermaid);
        }

        return mermaid;
    }

    private static appendMermaidChildren(nodes: MindmapNode[], indent: number, output: string): void {
        for (const node of nodes) {
            output += `${' '.repeat(indent)}${this.escapeMermaidText(node.text)}\n`;
            if (node.children) {
                this.appendMermaidChildren(node.children, indent + 2, output);
            }
        }
    }

    private static escapeMermaidText(text: string): string {
        return (text || '')
            .replace(/\"/g, '"')
            .replace(/"/g, '\\"')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .trim();
    }

    private static pruneNodeToDepth(
        node: MindmapNode,
        maxDepth: number,
        currentDepth: number
    ): MindmapNode {
        if (currentDepth >= maxDepth) {
            return {
                id: node.id,
                text: node.text,
                metadata: node.metadata,
            };
        }

        return {
            id: node.id,
            text: node.text,
            children: node.children?.map(child =>
                this.pruneNodeToDepth(child, maxDepth, currentDepth + 1)
            ),
            metadata: node.metadata,
        };
    }
}

/**
 * Mindmap Statistics
 */
export interface MindmapStatistics {
    totalNodes: number;
    leafNodes: number;
    maxDepth: number;
    averageBranchingFactor: number;
}

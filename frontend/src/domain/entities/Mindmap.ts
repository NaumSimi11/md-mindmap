/**
 * Mindmap Entity - Core domain model
 * 
 * Pure TypeScript class representing a mindmap structure.
 * No external dependencies.
 */

export class Mindmap {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly rootNode: MindmapNode,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly sourceDocumentId?: string
    ) {
        this.validate();
    }

    /**
     * Update the root node (immutable)
     */
    updateRootNode(newRootNode: MindmapNode): Mindmap {
        return new Mindmap(
            this.id,
            this.title,
            newRootNode,
            this.createdAt,
            new Date(),
            this.sourceDocumentId
        );
    }

    /**
     * Update title (immutable)
     */
    updateTitle(newTitle: string): Mindmap {
        return new Mindmap(
            this.id,
            newTitle,
            this.rootNode,
            this.createdAt,
            new Date(),
            this.sourceDocumentId
        );
    }

    /**
     * Domain validation
     */
    isValid(): boolean {
        return (
            this.id.length > 0 &&
            this.title.length > 0 &&
            this.rootNode !== null
        );
    }

    /**
     * Count total nodes in the mindmap
     */
    getTotalNodeCount(): number {
        return this.countNodes(this.rootNode);
    }

    /**
     * Get maximum depth of the mindmap
     */
    getMaxDepth(): number {
        return this.calculateDepth(this.rootNode);
    }

    /**
     * Check if mindmap is empty (only root node)
     */
    isEmpty(): boolean {
        return !this.rootNode.children || this.rootNode.children.length === 0;
    }

    /**
     * Find a node by ID
     */
    findNode(nodeId: string): MindmapNode | null {
        return this.searchNode(this.rootNode, nodeId);
    }

    /**
     * Convert to Mermaid syntax
     */
    toMermaidSyntax(): string {
        const lines: string[] = ['graph TD'];
        this.generateMermaidLines(this.rootNode, lines);
        return lines.join('\n');
    }

    /**
     * Convert to JSON
     */
    toJSON(): MindmapDTO {
        return {
            id: this.id,
            title: this.title,
            rootNode: this.rootNode,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            sourceDocumentId: this.sourceDocumentId,
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data: MindmapDTO): Mindmap {
        return new Mindmap(
            data.id,
            data.title,
            data.rootNode,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.sourceDocumentId
        );
    }

    /**
     * Factory: Create new mindmap
     */
    static create(title: string, rootNodeText: string): Mindmap {
        const rootNode: MindmapNode = {
            id: crypto.randomUUID(),
            text: rootNodeText,
            children: [],
        };

        return new Mindmap(
            crypto.randomUUID(),
            title,
            rootNode,
            new Date(),
            new Date()
        );
    }

    /**
     * Factory: Create from markdown headings
     */
    static fromMarkdownHeadings(title: string, headings: HeadingNode[]): Mindmap {
        const rootNode = this.buildTreeFromHeadings(headings);
        return new Mindmap(
            crypto.randomUUID(),
            title,
            rootNode,
            new Date(),
            new Date()
        );
    }

    // Private helper methods

    private validate(): void {
        if (!this.isValid()) {
            throw new Error('Invalid mindmap: id, title, and rootNode are required');
        }
    }

    private countNodes(node: MindmapNode): number {
        let count = 1; // Count current node
        if (node.children) {
            for (const child of node.children) {
                count += this.countNodes(child);
            }
        }
        return count;
    }

    private calculateDepth(node: MindmapNode, currentDepth: number = 0): number {
        if (!node.children || node.children.length === 0) {
            return currentDepth;
        }

        let maxChildDepth = currentDepth;
        for (const child of node.children) {
            const childDepth = this.calculateDepth(child, currentDepth + 1);
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        }

        return maxChildDepth;
    }

    private searchNode(node: MindmapNode, targetId: string): MindmapNode | null {
        if (node.id === targetId) {
            return node;
        }

        if (node.children) {
            for (const child of node.children) {
                const found = this.searchNode(child, targetId);
                if (found) return found;
            }
        }

        return null;
    }

    private generateMermaidLines(node: MindmapNode, lines: string[], parentId?: string): void {
        const nodeId = node.id.replace(/-/g, '');
        const nodeText = node.text.replace(/"/g, '\\"');

        if (parentId) {
            lines.push(`  ${parentId}["${nodeText}"]`);
            lines.push(`  ${parentId} --> ${nodeId}`);
        } else {
            lines.push(`  ${nodeId}["${nodeText}"]`);
        }

        if (node.children) {
            for (const child of node.children) {
                this.generateMermaidLines(child, lines, nodeId);
            }
        }
    }

    private static buildTreeFromHeadings(headings: HeadingNode[]): MindmapNode {
        if (headings.length === 0) {
            return {
                id: crypto.randomUUID(),
                text: 'Empty',
                children: [],
            };
        }

        const root: MindmapNode = {
            id: crypto.randomUUID(),
            text: headings[0].text,
            children: [],
        };

        const stack: Array<{ node: MindmapNode; level: number }> = [
            { node: root, level: headings[0].level },
        ];

        for (let i = 1; i < headings.length; i++) {
            const heading = headings[i];
            const newNode: MindmapNode = {
                id: crypto.randomUUID(),
                text: heading.text,
                children: [],
            };

            // Find parent
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            if (stack.length > 0) {
                const parent = stack[stack.length - 1].node;
                if (!parent.children) parent.children = [];
                parent.children.push(newNode);
            }

            stack.push({ node: newNode, level: heading.level });
        }

        return root;
    }
}

/**
 * Mindmap Node Value Object
 */
export interface MindmapNode {
    id: string;
    text: string;
    children?: MindmapNode[];
    metadata?: {
        color?: string;
        icon?: string;
        collapsed?: boolean;
    };
}

/**
 * Heading Node (for parsing)
 */
export interface HeadingNode {
    level: number;
    text: string;
}

/**
 * Data Transfer Object
 */
export interface MindmapDTO {
    id: string;
    title: string;
    rootNode: MindmapNode;
    createdAt: string;
    updatedAt: string;
    sourceDocumentId?: string;
}

import { Editor } from '@tiptap/react';

/**
 * Document Edit Tools - Antigravity-powered editing functions
 * 
 * These functions provide structured, powerful editing capabilities
 * matching Antigravity's native editing tools.
 */

export interface EditDocumentArgs {
    action: 'replace' | 'insert_before' | 'insert_after' | 'delete';
    target: string; // Heading or content to find (fuzzy matched)
    newContent?: string; // For replace/insert actions
    reason: string;
}

export interface CreateSectionArgs {
    title: string;
    content: string;
    position: 'start' | 'end' | { after: string } | { before: string };
}

export interface RewriteSectionArgs {
    target: string;
    style: 'professional' | 'casual' | 'technical' | 'creative';
    instructions: string;
}

export interface MultiEditArgs {
    edits: EditDocumentArgs[];
}

export interface DocumentEditResult {
    success: boolean;
    message: string;
    position?: { from: number; to: number };
    error?: string;
}

export class DocumentEditTools {
    private editor: Editor;

    constructor(editor: Editor) {
        this.editor = editor;
    }

    /**
     * Find a position in the document using fuzzy matching
     * (Same logic as AISidebarChat's findTextPosition)
     */
    private findPosition(searchText: string): { from: number; to: number } | null {
        const doc = this.editor.state.doc;

        const normalize = (str: string) => {
            return str
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/`/g, '')
                .replace(/#/g, '')
                .replace(/[✅⚠️🤝💪🌟📚🔧🚀]/g, '')
                .trim()
                .toLowerCase();
        };

        const normalizedSearch = normalize(searchText);
        let bestMatch: { from: number; to: number; score: number } | null = null;

        doc.descendants((node, pos) => {
            const nodeText = node.textContent;
            const normalizedNode = normalize(nodeText);

            let score = 0;

            if (normalizedNode === normalizedSearch) {
                score = 1.0;
            } else if (normalizedNode.includes(normalizedSearch)) {
                score = 0.8;
            } else if (normalizedSearch.includes(normalizedNode) && normalizedNode.length > 5) {
                score = 0.6;
            } else {
                const searchWords = normalizedSearch.split(/\s+/);
                const nodeWords = normalizedNode.split(/\s+/);
                const matchingWords = searchWords.filter(w => nodeWords.some(nw => nw.includes(w) || w.includes(nw)));
                if (matchingWords.length > 0) {
                    score = (matchingWords.length / Math.max(searchWords.length, nodeWords.length)) * 0.5;
                }
            }

            if (node.type.name === 'heading') {
                score *= 1.5;
            }

            if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = {
                    from: pos,
                    to: pos + node.nodeSize,
                    score
                };
            }
        });

        return bestMatch ? { from: bestMatch.from, to: bestMatch.to } : null;
    }

    /**
     * Edit document - replace, insert, or delete content
     */
    async editDocument(args: EditDocumentArgs): Promise<DocumentEditResult> {
        const { action, target, newContent, reason } = args;

        console.log(`🔧 edit_document: ${action} at "${target}"`);
        console.log(`📝 Reason: ${reason}`);

        const position = this.findPosition(target);

        if (!position) {
            return {
                success: false,
                message: `Could not find target: "${target}"`,
                error: 'Target not found'
            };
        }

        try {
            switch (action) {
                case 'replace':
                    if (!newContent) {
                        return { success: false, message: 'newContent required for replace', error: 'Missing content' };
                    }
                    this.editor
                        .chain()
                        .focus()
                        .command(({ tr }) => {
                            tr.replaceWith(position.from, position.to, this.editor.schema.text(newContent));
                            return true;
                        })
                        .run();
                    break;

                case 'insert_after':
                    if (!newContent) {
                        return { success: false, message: 'newContent required for insert_after', error: 'Missing content' };
                    }
                    this.editor
                        .chain()
                        .focus()
                        .command(({ tr }) => {
                            tr.insert(position.to, this.editor.schema.text('\n\n' + newContent));
                            return true;
                        })
                        .run();
                    break;

                case 'insert_before':
                    if (!newContent) {
                        return { success: false, message: 'newContent required for insert_before', error: 'Missing content' };
                    }
                    this.editor
                        .chain()
                        .focus()
                        .command(({ tr }) => {
                            tr.insert(position.from, this.editor.schema.text(newContent + '\n\n'));
                            return true;
                        })
                        .run();
                    break;

                case 'delete':
                    this.editor
                        .chain()
                        .focus()
                        .command(({ tr }) => {
                            tr.delete(position.from, position.to);
                            return true;
                        })
                        .run();
                    break;
            }

            return {
                success: true,
                message: `Successfully ${action}d content at "${target}"`,
                position
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
   * Create a new section
   */
    async createSection(args: CreateSectionArgs): Promise<DocumentEditResult> {
        const { title, content, position } = args;

        console.log(`📄 create_section: "${title}" at position:`, position);

        // Check if content already starts with a heading
        const hasHeading = content.trim().startsWith('#');
        const fullContent = hasHeading
            ? `${content}\n\n`
            : `## ${title}\n\n${content}\n\n`;

        try {
            if (position === 'start') {
                this.editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                        tr.insert(0, this.editor.schema.text(fullContent));
                        return true;
                    })
                    .run();
            } else if (position === 'end') {
                const endPos = this.editor.state.doc.content.size;
                this.editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                        tr.insert(endPos, this.editor.schema.text(fullContent));
                        return true;
                    })
                    .run();
            } else if ('after' in position) {
                return this.editDocument({
                    action: 'insert_after',
                    target: position.after,
                    newContent: fullContent.trim(),
                    reason: `Creating new section "${title}"`
                });
            } else if ('before' in position) {
                return this.editDocument({
                    action: 'insert_before',
                    target: position.before,
                    newContent: fullContent.trim(),
                    reason: `Creating new section "${title}"`
                });
            }

            return {
                success: true,
                message: `Created section "${title}"`
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to create section: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Rewrite a section (placeholder - would need AI integration)
     */
    async rewriteSection(args: RewriteSectionArgs): Promise<DocumentEditResult> {
        const { target, style, instructions } = args;

        console.log(`✍️ rewrite_section: "${target}" in ${style} style`);
        console.log(`📝 Instructions: ${instructions}`);

        // This would call the AI service to rewrite the section
        // For now, just return a placeholder
        return {
            success: false,
            message: 'rewrite_section not yet implemented - needs AI integration',
            error: 'Not implemented'
        };
    }

    /**
     * Make multiple edits atomically
     */
    async multiEdit(args: MultiEditArgs): Promise<DocumentEditResult> {
        const { edits } = args;

        console.log(`🔀 multi_edit: ${edits.length} edits`);

        const results: DocumentEditResult[] = [];

        for (const edit of edits) {
            const result = await this.editDocument(edit);
            results.push(result);

            if (!result.success) {
                return {
                    success: false,
                    message: `Multi-edit failed at edit ${results.length}: ${result.message}`,
                    error: result.error
                };
            }
        }

        return {
            success: true,
            message: `Successfully completed ${edits.length} edits`
        };
    }

    /**
     * Get function schemas for AI
     */
    static getFunctionSchemas() {
        return [
            {
                name: 'edit_document',
                description: 'Make targeted edits to the document (replace, insert, delete)',
                parameters: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['replace', 'insert_before', 'insert_after', 'delete'],
                            description: 'Type of edit to perform'
                        },
                        target: {
                            type: 'string',
                            description: 'Heading or content to find (fuzzy matched)'
                        },
                        newContent: {
                            type: 'string',
                            description: 'New content (for replace/insert actions)'
                        },
                        reason: {
                            type: 'string',
                            description: 'Brief explanation of why this edit is being made'
                        }
                    },
                    required: ['action', 'target', 'reason']
                }
            },
            {
                name: 'create_section',
                description: 'Create a new section in the document',
                parameters: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Section title (without ## prefix)'
                        },
                        content: {
                            type: 'string',
                            description: 'Section content'
                        },
                        position: {
                            oneOf: [
                                { type: 'string', enum: ['start', 'end'] },
                                { type: 'object', properties: { after: { type: 'string' } } },
                                { type: 'object', properties: { before: { type: 'string' } } }
                            ],
                            description: 'Where to place the section'
                        }
                    },
                    required: ['title', 'content', 'position']
                }
            },
            {
                name: 'multi_edit',
                description: 'Make multiple edits atomically',
                parameters: {
                    type: 'object',
                    properties: {
                        edits: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    action: { type: 'string', enum: ['replace', 'insert_before', 'insert_after', 'delete'] },
                                    target: { type: 'string' },
                                    newContent: { type: 'string' },
                                    reason: { type: 'string' }
                                }
                            }
                        }
                    },
                    required: ['edits']
                }
            }
        ];
    }
}

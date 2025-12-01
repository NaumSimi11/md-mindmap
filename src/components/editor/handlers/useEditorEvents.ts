import { Editor } from '@tiptap/react';
import { useMemo } from 'react';
import { markdownToHtml, htmlToMarkdown } from '../../../utils/markdownConversion';

interface UseEditorEventsProps {
    editor: Editor | null;
    setShowTableMenu: (show: boolean, position?: { x: number; y: number }) => void;
    setContextMenu: (menu: { visible: boolean; x: number; y: number; selectedText: string }) => void;
    onContentChange?: (content: string) => void;
    isProgrammaticUpdateRef: React.MutableRefObject<boolean>;
}

export const useEditorEvents = ({
    editor,
    setShowTableMenu,
    setContextMenu,
    onContentChange,
    isProgrammaticUpdateRef,
}: UseEditorEventsProps) => {
    return useMemo(() => ({
        attributes: {
            class: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
        },
        handleDOMEvents: {
            // Handle Cmd/Ctrl+Click to open links
            click: (view: any, event: any) => {
                const target = event.target as HTMLElement;

                // Check if clicked on a link
                if (target.tagName === 'A' || target.closest('a')) {
                    const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
                    const href = link.getAttribute('href');

                    // Open link if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
                    if ((event.metaKey || event.ctrlKey) && href) {
                        event.preventDefault();
                        window.open(href, '_blank', 'noopener,noreferrer');
                        return true;
                    }
                }

                return false;
            },
            // Handle YouTube URL pastes - convert to embeds automatically
            paste: (view: any, event: any) => {
                const text = event.clipboardData?.getData('text/plain');
                if (text) {
                    const youtubeMatch = text.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][\w=&-]*)?$/);
                    if (youtubeMatch) {
                        event.preventDefault();
                        const videoId = youtubeMatch[1];
                        const { state, dispatch } = view;
                        const node = state.schema.nodes.youtube.create({ videoId });
                        const tr = state.tr.replaceSelectionWith(node);
                        dispatch(tr);
                        return true;
                    }
                }
                return false;
            },
            contextmenu: (view: any, event: any) => {
                const target = event.target as HTMLElement;

                // Check if right-clicking on a table cell
                if (target.tagName === 'TD' || target.tagName === 'TH' || target.closest('td, th')) {
                    const cell = (target.tagName === 'TD' || target.tagName === 'TH' ? target : target.closest('td, th')) as HTMLElement;
                    if (cell && editor) {
                        // Check if we can perform table operations (confirm we're in a table)
                        if (editor.can().addRowBefore() || editor.can().addColumnBefore()) {
                            event.preventDefault();
                            const rect = cell.getBoundingClientRect();
                            setShowTableMenu(true, { x: rect.right + 8, y: rect.top });
                            return true;
                        }
                    }
                }

                // Regular context menu for non-table elements
                event.preventDefault();
                const { from, to } = view.state.selection;
                const selectedText = view.state.doc.textBetween(from, to, ' ');

                setContextMenu({
                    visible: true,
                    x: event.clientX,
                    y: event.clientY,
                    selectedText,
                });

                return true;
            },
        },
        handlePaste: (view: any, event: any) => {
            try {
                const text = event.clipboardData?.getData('text/plain') || '';
                if (!text) return false;
                const mdLike = /(^#\s)|(^-{3,}$)|(^\*\s)|(^\d+\.\s)|(```[\s\S]*?```)/m.test(text);
                if (!mdLike) return false;
                event.preventDefault();

                const regex = /(\s*```\s*mermaid[\s\S]*?```)/g;
                const parts = text.split(regex);
                // Prevent onUpdate from firing during programmatic multi-step insert
                isProgrammaticUpdateRef.current = true;

                // Process parts sequentially (not chained, to avoid issues)
                parts.forEach((part: string) => {
                    if (!part.trim()) return;
                    const trimmed = part.trimStart();
                    if (/^```\s*mermaid/.test(trimmed) && editor) {
                        const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
                        const code = m ? m[1].trim() : '';
                        if (code) {
                            // Insert mermaid node using a single insertContent call with all nodes
                            editor.commands.insertContent([
                                { type: 'paragraph' },
                                {
                                    type: 'mermaid',
                                    attrs: { code, scale: 1, width: '780px' }
                                },
                                { type: 'paragraph' }
                            ]);
                        }
                    } else if (editor) {
                        editor.commands.insertContent(markdownToHtml(part));
                    }
                });
                // Ensure NodeViews mount and render, then trigger content update
                // Increased timeout to allow mermaid nodes to fully mount
                setTimeout(() => {
                    try { editor?.commands.focus(); } catch { }
                    isProgrammaticUpdateRef.current = false;

                    // CRITICAL: Manually trigger content update for outline sync
                    const markdown = htmlToMarkdown('', editor);
                    onContentChange?.(markdown);
                }, 200);
                return true;
            } catch (e) {
                console.error('Paste handler error:', e);
                return false;
            }
        }
    }), [editor, setShowTableMenu, setContextMenu, onContentChange, isProgrammaticUpdateRef]);
};

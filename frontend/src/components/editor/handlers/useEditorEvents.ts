import { Editor } from '@tiptap/react';
import { useMemo } from 'react';
import { markdownToHtml, htmlToMarkdown } from '../../../utils/markdownConversion';

interface UseEditorEventsProps {
    editor: Editor | null;
    setShowTableMenu: (show: boolean, position?: { x: number; y: number }) => void;
    setContextMenu: (menu: { visible: boolean; x: number; y: number; selectedText: string }) => void;
    // ❌ STEP 1: Removed onContentChange (Yjs will handle persistence)
    isProgrammaticUpdateRef: React.MutableRefObject<boolean>;
}

export const useEditorEvents = ({
    editor,
    setShowTableMenu,
    setContextMenu,
    // ❌ STEP 1: Removed onContentChange
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
                
                // Check if it looks like markdown
                const mdLike = /(^#\s)|(^-{3,}$)|(^\*\s)|(^\d+\.\s)|(```[\s\S]*?```)/m.test(text);
                if (!mdLike) return false;
                
                event.preventDefault();
                console.log(`📋 PASTE: ${text.length} chars`);

                if (!editor) {
                    console.error('❌ No editor');
                    return false;
                }

                // Convert to HTML
                const html = markdownToHtml(text);
                console.log(`✅ HTML: ${html.length} chars`);
                
                // 🔥 FIX: Pass { parseOptions: { preserveWhitespace: false } } to parse HTML
                editor.chain().focus().insertContent(html, {
                    parseOptions: {
                        preserveWhitespace: false,
                    }
                }).run();
                console.log('✅ Inserted with HTML parsing');
                
                return true;
            } catch (e) {
                console.error('❌ Paste error:', e);
                return false;
            }
        }
    }), [editor, setShowTableMenu, setContextMenu, isProgrammaticUpdateRef]); // ❌ STEP 1: Removed onContentChange from deps
};

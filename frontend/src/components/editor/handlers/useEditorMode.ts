import { Editor } from '@tiptap/react';
import { htmlToMarkdown, markdownToHtml } from '../../../utils/markdownConversion';

interface UseEditorModeProps {
    editor: Editor | null;
    editorMode: 'wysiwyg' | 'markdown';
    setEditorMode: (mode: 'wysiwyg' | 'markdown') => void;
    markdownContent: string;
    setMarkdownContent: (content: string) => void;
    markdownTextareaRef: React.RefObject<HTMLTextAreaElement>;
    savedCursorTextRef: React.MutableRefObject<string | null>;
    isProgrammaticUpdateRef: React.MutableRefObject<boolean>;
}

export const useEditorMode = ({
    editor,
    editorMode,
    setEditorMode,
    markdownContent,
    setMarkdownContent,
    markdownTextareaRef,
    savedCursorTextRef,
    isProgrammaticUpdateRef,
}: UseEditorModeProps) => {

    // Parse markdown and insert into editor (handles mermaid blocks and FontAwesome icons specially)
    const parseAndInsertMarkdown = (markdown: string) => {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║  PARSE AND INSERT MARKDOWN            ║');
        console.log('╚════════════════════════════════════════╝');

        if (!editor) {
            console.log('❌ ERROR: No editor instance!');
            return;
        }

        

        // CRITICAL FIX: Strip outer markdown code fence if present
        if (markdown.startsWith('```markdown\n')) {
            markdown = markdown
                .replace(/^```markdown\n/, '')  // Remove opening
                .replace(/\n```$/, '');           // Remove closing
        }

        // Set flag to prevent onUpdate from firing
        isProgrammaticUpdateRef.current = true;
        // Split content by mermaid blocks (capture group keeps the delimiter)
        // More flexible regex to handle different newline styles
        const regex = /(\s*```\s*mermaid[\s\S]*?```)/g;
        const parts = markdown.split(regex);

     

        // Clear editor FIRST before building content
        editor.commands.clearContent();

        // Now insert each part directly (NO intermediate building)
        parts.forEach((part, index) => {

            if (!part.trim()) {
                return;
            }

            const trimmed = part.trimStart();
            if (/^```\s*mermaid/.test(trimmed)) {
                const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
                const code = m ? m[1].trim() : '';

                if (code) {

                    // Insert as array in a single call (chaining doesn't work for mermaid nodes)
                    const success = editor.commands.insertContent([
                        { type: 'paragraph' },
                        { type: 'mermaid', attrs: { code, scale: 1, width: '780px' } },
                        { type: 'paragraph' }
                    ]);

                }
            } else {
                const html = markdownToHtml(part);
                // 🔥 FIX: Parse HTML properly
                editor.chain().insertContent(html, {
                    parseOptions: { preserveWhitespace: false }
                }).run();
            }
        });

        // Restore cursor position after content is inserted
        if (savedCursorTextRef.current !== null) {
            const searchText = savedCursorTextRef.current;
            // Wait for content to be fully inserted and rendered
            setTimeout(() => {
                // Find the text in the editor and set cursor there
                const docText = editor.state.doc.textContent;
                let foundPos = docText.indexOf(searchText);

                if (foundPos === -1) {
                    // If exact match not found, try to find a substring
                    // Use the last part of the saved text
                    const searchLength = Math.min(50, searchText.length);
                    const searchSubstring = searchText.substring(searchText.length - searchLength);
                    foundPos = docText.indexOf(searchSubstring);
                    if (foundPos !== -1) {
                        foundPos += searchSubstring.length;
                    }
                } else {
                    foundPos += searchText.length;
                }

                if (foundPos !== -1) {
                    try {
                        editor.commands.setTextSelection(foundPos);
                        editor.commands.scrollIntoView();
                    } catch (e) {
                        console.warn('Failed to restore cursor position:', e);
                    }
                }
                isProgrammaticUpdateRef.current = false;
            }, 100);
        } else {
            isProgrammaticUpdateRef.current = false;
        }
    };

    const toggleEditorMode = () => {
       

        if (editorMode === 'wysiwyg') {
            if (!editor) return;

            // Switching to Markdown - save text before cursor and convert content

            // Save text content before cursor for better position mapping
            const cursorPos = editor.state.selection.from;
            const textBeforeCursor = editor.state.doc.textBetween(0, cursorPos);
            savedCursorTextRef.current = textBeforeCursor;

            const markdown = htmlToMarkdown('', editor);
            setMarkdownContent(markdown);
            setEditorMode('markdown');

            // Set cursor position in markdown textarea after a short delay
            setTimeout(() => {
                if (markdownTextareaRef.current && savedCursorTextRef.current !== null) {
                    // Find the text in markdown and set cursor there
                    const markdownText = markdownTextareaRef.current.value;
                    const searchText = savedCursorTextRef.current;
                    // Try to find the text, or use approximate position
                    let markdownPos = markdownText.indexOf(searchText);
                    if (markdownPos === -1) {
                        // Fallback: use approximate position based on text length
                        markdownPos = Math.min(cursorPos, markdownText.length);
                    } else {
                        markdownPos += searchText.length;
                    }
                    markdownTextareaRef.current.setSelectionRange(markdownPos, markdownPos);
                    markdownTextareaRef.current.focus();
                }
            }, 50);
        } else {
            // Switching to WYSIWYG - save text before cursor in markdown and restore in WYSIWYG

            // Save text content before cursor in markdown mode
            if (markdownTextareaRef.current) {
                const cursorPos = markdownTextareaRef.current.selectionStart;
                savedCursorTextRef.current = markdownContent.substring(0, cursorPos);
            }

            
            parseAndInsertMarkdown(markdownContent);
            setEditorMode('wysiwyg');
            // DON'T call onContentChange here - content hasn't changed, just the view mode
        }
    };

    return { toggleEditorMode };
};

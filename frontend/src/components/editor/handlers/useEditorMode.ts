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

        console.log('📥 INPUT:');
        console.log('  Length:', markdown.length);
        console.log('  Full content:', markdown);

        // CRITICAL FIX: Strip outer markdown code fence if present
        if (markdown.startsWith('```markdown\n')) {
            console.log('  ⚠️  Content wrapped in ```markdown fence, stripping...');
            markdown = markdown
                .replace(/^```markdown\n/, '')  // Remove opening
                .replace(/\n```$/, '');           // Remove closing
            console.log('  ✅ After stripping, length:', markdown.length);
            console.log('  ✅ After stripping:', markdown);
        }

        console.log('  Contains ```mermaid?', markdown.includes('```mermaid'));

        // Set flag to prevent onUpdate from firing
        isProgrammaticUpdateRef.current = true;
        console.log('🚫 isProgrammaticUpdate set to TRUE');

        // Split content by mermaid blocks (capture group keeps the delimiter)
        // More flexible regex to handle different newline styles
        const regex = /(\s*```\s*mermaid[\s\S]*?```)/g;
        console.log('\n📦 SPLITTING by regex:', regex);
        const parts = markdown.split(regex);
        console.log('  Split into', parts.length, 'parts');

        parts.forEach((part, index) => {
            console.log(`\n  ━━━ Part ${index} ━━━`);
            console.log('  Length:', part.length);
            console.log('  Content:', part);
            console.log('  Starts with ```mermaid?', part.startsWith('```mermaid'));
        });

        // Clear editor FIRST before building content
        console.log('\n🗑️  CLEARING EDITOR FIRST');
        editor.commands.clearContent();
        console.log('✅ Editor cleared\n');

        // Now insert each part directly (NO intermediate building)
        console.log('🔄 INSERTING PARTS DIRECTLY:');
        parts.forEach((part, index) => {
            console.log(`\n━━━ Part ${index} ━━━`);

            if (!part.trim()) {
                console.log('⏭️  Empty, skipping');
                return;
            }

            const trimmed = part.trimStart();
            if (/^```\s*mermaid/.test(trimmed)) {
                const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
                const code = m ? m[1].trim() : '';

                if (code) {
                    console.log('🎨 MERMAID:', code.substring(0, 50) + '...');
                    console.log('📍 Cursor before:', editor.state.selection.from);

                    // Insert as array in a single call (chaining doesn't work for mermaid nodes)
                    const success = editor.commands.insertContent([
                        { type: 'paragraph' },
                        { type: 'mermaid', attrs: { code, scale: 1, width: '780px' } },
                        { type: 'paragraph' }
                    ]);

                    console.log('📍 Cursor after:', editor.state.selection.from);
                    console.log('🔍 Insert success?', success);
                }
            } else {
                console.log('📄 MARKDOWN:', part.substring(0, 40) + '...');
                const html = markdownToHtml(part);
                // Insert HTML content - TipTap will parse it
                editor.chain().insertContent(html).run();
            }
        });

        console.log('\n🔍 FINAL CHECK:');
        console.log('  Editor HTML length:', editor.getHTML().length);
        console.log('  Editor HTML:', editor.getHTML().substring(0, 300));
        console.log('  Editor JSON:', JSON.stringify(editor.getJSON(), null, 2).substring(0, 500));

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
                console.log('✅ isProgrammaticUpdate set to FALSE');
            }, 100);
        } else {
            isProgrammaticUpdateRef.current = false;
            console.log('✅ isProgrammaticUpdate set to FALSE');
        }
    };

    const toggleEditorMode = () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔀 TOGGLE MODE CALLED');
        console.log('  Current mode:', editorMode);

        if (editorMode === 'wysiwyg') {
            if (!editor) return;

            // Switching to Markdown - save text before cursor and convert content
            console.log('  ➡️  WYSIWYG → Markdown');

            // Save text content before cursor for better position mapping
            const cursorPos = editor.state.selection.from;
            const textBeforeCursor = editor.state.doc.textBetween(0, cursorPos);
            savedCursorTextRef.current = textBeforeCursor;
            console.log('  📍 Saved text before cursor:', textBeforeCursor.substring(Math.max(0, textBeforeCursor.length - 50)));

            const markdown = htmlToMarkdown('', editor);
            console.log('  📝 Converted to markdown, length:', markdown.length);
            console.log('  📝 Preview:', markdown.substring(0, 200));
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
                    console.log('  📍 Set markdown cursor position:', markdownPos);
                }
            }, 50);
        } else {
            // Switching to WYSIWYG - save text before cursor in markdown and restore in WYSIWYG
            console.log('  ➡️  Markdown → WYSIWYG');

            // Save text content before cursor in markdown mode
            if (markdownTextareaRef.current) {
                const cursorPos = markdownTextareaRef.current.selectionStart;
                savedCursorTextRef.current = markdownContent.substring(0, cursorPos);
                console.log('  📍 Saved markdown text before cursor:', savedCursorTextRef.current.substring(Math.max(0, savedCursorTextRef.current.length - 50)));
            }

            console.log('  📝 markdownContent length:', markdownContent.length);
            console.log('  📝 markdownContent preview:', markdownContent.substring(0, 200));
            console.log('  🔍 Contains mermaid?', markdownContent.includes('```mermaid'));

            parseAndInsertMarkdown(markdownContent);
            setEditorMode('wysiwyg');
            // DON'T call onContentChange here - content hasn't changed, just the view mode
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    return { toggleEditorMode };
};

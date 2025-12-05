import { useEffect } from 'react';
import { Editor } from '@tiptap/react';
// 🔥 Syntax highlighting imports - IMPORTANT: Load Prism core first!
import Prism from 'prismjs';
// Load theme and plugins after core
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';

// Load languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-yaml';

// Helper to load languages dynamically if needed (though we import common ones above)
const loadPrismLanguage = async (lang: string) => {
    if (Prism.languages[lang]) return;

    try {
        // Dynamic import for other languages could go here if we wanted to code-split
        // For now we just rely on the static imports above
        console.log(`Language ${lang} not loaded statically`);
    } catch (e) {
        console.warn(`Failed to load language: ${lang}`, e);
    }
};

export const useSyntaxHighlighting = (editor: Editor | null) => {
    // 🔥 Apply Prism syntax highlighting to code blocks
    useEffect(() => {
        // Safety check: ensure editor and view are ready
        if (!editor || !editor.view || !editor.view.dom) {
            return;
        }

        const highlightCodeBlocks = async () => {
            try {
                const editorElement = editor.view.dom;
                const codeBlocks = editorElement.querySelectorAll('pre code[class*="language-"]');

                for (const block of Array.from(codeBlocks)) {
                    // Extract language from class
                    const className = block.className;
                    const match = className.match(/language-(\w+)/);

                    if (match && match[1]) {
                        const lang = match[1];

                        // Load language if not already loaded
                        await loadPrismLanguage(lang);

                        // Highlight the block
                        if (Prism.languages[lang]) {
                            try {
                                Prism.highlightElement(block as HTMLElement);
                            } catch (e) {
                                console.warn('Prism highlight failed:', e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Code highlighting error:', error);
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            highlightCodeBlocks();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [editor, editor?.state.doc]);
};

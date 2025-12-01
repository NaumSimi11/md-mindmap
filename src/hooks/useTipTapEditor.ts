import { useEditor, Editor } from '@tiptap/react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { getExtensions } from '../components/editor/extensions';
import { useEditorEvents } from '../components/editor/handlers/useEditorEvents';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConversion';

interface UseTipTapEditorProps {
    initialContent?: string;
    onContentChange?: (content: string) => void;
    onEditorReady?: (editor: Editor) => void;
    aiSuggestionsEnabled: boolean;
    aiAutocompleteEnabled: boolean;
    setShowDiagramMenu: (show: boolean) => void;
    setShowAIModal: (show: boolean) => void;
    setShowTableModal: (show: boolean) => void;
    setShowTableMenu: (show: boolean, position?: { x: number; y: number }) => void;
    setContextMenu: (menu: { visible: boolean; x: number; y: number; selectedText: string }) => void;
}

export const useTipTapEditor = ({
    initialContent = '',
    onContentChange,
    onEditorReady,
    aiSuggestionsEnabled,
    aiAutocompleteEnabled,
    setShowDiagramMenu,
    setShowAIModal,
    setShowTableModal,
    setShowTableMenu,
    setContextMenu,
}: UseTipTapEditorProps) => {
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const isProgrammaticUpdateRef = useRef(false);
    const aiHintsEnabledRef = useRef({ enabled: aiSuggestionsEnabled });

    // Update AI hints ref when prop changes
    useEffect(() => {
        aiHintsEnabledRef.current.enabled = aiSuggestionsEnabled;
    }, [aiSuggestionsEnabled]);

    // Get configured extensions
    const extensions = useMemo(() => getExtensions({
        setShowDiagramMenu,
        setShowAIModal,
        setShowTableModal,
        aiHintsEnabledRef,
        aiAutocompleteEnabled,
    }), [setShowDiagramMenu, setShowAIModal, setShowTableModal, aiAutocompleteEnabled]);

    // Get editor event handlers
    const editorProps = useEditorEvents({
        editor: editorInstance,
        setShowTableMenu,
        setContextMenu,
        onContentChange,
        isProgrammaticUpdateRef,
    });

    const editor = useEditor({
        extensions,
        content: markdownToHtml(initialContent),
        editorProps,
        onUpdate: ({ editor }) => {
            // Skip if this is a programmatic update (mode switching, etc.)
            if (isProgrammaticUpdateRef.current) {
                return;
            }

            // CRITICAL: Convert to markdown for storage
            // This preserves formatting when saving and enables mindmap generation
            // Use JSON conversion to properly handle mermaid diagrams
            const markdown = htmlToMarkdown('', editor);
            onContentChange?.(markdown);
        },
        onCreate: ({ editor }) => {
            setEditorInstance(editor);
            onEditorReady?.(editor);
        },
    });

    // Sync editor instance state if useEditor returns a new instance (unlikely but safe)
    useEffect(() => {
        if (editor && editor !== editorInstance) {
            setEditorInstance(editor);
        }
    }, [editor, editorInstance]);

    return {
        editor,
        isProgrammaticUpdateRef,
    };
};

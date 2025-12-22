import { useEditor, Editor } from '@tiptap/react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { getExtensions } from '../components/editor/extensions';
import { useEditorEvents } from '../components/editor/handlers/useEditorEvents';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConversion';
import type * as Y from 'yjs';

interface UseTipTapEditorProps {
    // ❌ STEP 1: Removed initialContent and onContentChange (Yjs will handle in STEP 3)
    onEditorReady?: (editor: Editor) => void;
    aiSuggestionsEnabled: boolean;
    aiAutocompleteEnabled: boolean;
    setShowDiagramMenu: (show: boolean) => void;
    setShowAIModal: (show: boolean) => void;
    setShowTableModal: (show: boolean) => void;
    setShowTableMenu: (show: boolean, position?: { x: number; y: number }) => void;
    setContextMenu: (menu: { visible: boolean; x: number; y: number; selectedText: string }) => void;
    ydoc?: Y.Doc;  // 🔥 Will be used in STEP 3
    provider?: any;  // 🔥 Will be used in STEP 3
}

export const useTipTapEditor = ({
    // ❌ STEP 1: initialContent and onContentChange removed
    onEditorReady,
    aiSuggestionsEnabled,
    aiAutocompleteEnabled,
    setShowDiagramMenu,
    setShowAIModal,
    setShowTableModal,
    setShowTableMenu,
    setContextMenu,
    ydoc,
    provider,
}: UseTipTapEditorProps) => {
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const isProgrammaticUpdateRef = useRef(false);
    const aiHintsEnabledRef = useRef({ enabled: aiSuggestionsEnabled });

    // Update AI hints ref when prop changes
    useEffect(() => {
        aiHintsEnabledRef.current.enabled = aiSuggestionsEnabled;
    }, [aiSuggestionsEnabled]);

    // 🔥 STEP 3: Get configured extensions with Yjs support
    const extensions = useMemo(() => getExtensions({
        setShowDiagramMenu,
        setShowAIModal,
        setShowTableModal,
        aiHintsEnabledRef,
        aiAutocompleteEnabled,
        ydoc,        // ✅ STEP 3: Yjs document for collaboration
        provider,    // ✅ STEP 3: WebSocket provider (optional)
    }), [setShowDiagramMenu, setShowAIModal, setShowTableModal, aiAutocompleteEnabled, ydoc, provider]);

    // Get editor event handlers
    // ❌ STEP 1: Removed onContentChange (no longer needed)
    const editorProps = useEditorEvents({
        editorRef,
        setShowTableMenu,
        setContextMenu,
        isProgrammaticUpdateRef,
    });

    // 🔥 STRICT FIX: TipTap re-initializes when ydoc changes (undefined → defined)
    // This ensures Collaboration extension binds to the correct Yjs document
    const editor = useEditor({
        extensions,
        editorProps,
        // ❌ NO content initialization (Yjs owns content)
        // ❌ NO onUpdate persistence (Yjs auto-persists)
        onCreate: ({ editor }) => {
            // Keep latest editor instance in both state and ref
            editorRef.current = editor;
            setEditorInstance(editor);
            onEditorReady?.(editor);
        },
    }, [ydoc]); // ✅ CRITICAL: Editor is created ONLY after ydoc is ready

    // Sync editor instance state if useEditor returns a new instance (unlikely but safe)
    useEffect(() => {
        if (editor && editor !== editorInstance) {
            setEditorInstance(editor);
        }
    }, [editor, editorInstance]);

    // 🔥 STEP 4: Pick up hydrated content from Yjs (one-time only)
    // This reads the _init_markdown field written by WorkspaceContext
    const hasLoadedInitialRef = useRef(false);
    useEffect(() => {
        if (!ydoc || !editor || hasLoadedInitialRef.current) {
            return;
        }
        
        // Check if WorkspaceContext wrote initial content to _init_markdown
        const tempText = ydoc.getText('_init_markdown');
        const htmlContent = tempText.toString();
        
        if (!htmlContent) {
            // No initial content to load
            hasLoadedInitialRef.current = true;
            return;
        }
        
        console.log('🔧 [STEP 4] Loading hydrated content from Yjs:', htmlContent.length, 'chars');
        
        // Load into editor (one-time only)
        isProgrammaticUpdateRef.current = true;
        editor.commands.setContent(htmlContent);
        
        // Clear the temp field (content now in XmlFragment via Collaboration extension)
        ydoc.transact(() => {
            tempText.delete(0, tempText.length);
        });
        
        requestAnimationFrame(() => {
            isProgrammaticUpdateRef.current = false;
        });
        
        console.log('✅ [STEP 4] Initial content loaded and temp field cleared');
        hasLoadedInitialRef.current = true;
    }, [ydoc, editor, isProgrammaticUpdateRef]);

    return {
        editor,
        isProgrammaticUpdateRef,
    };
};

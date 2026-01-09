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
    localSynced?: boolean;  // 🔥 FIX: Wait for IndexedDB sync before checking _init_markdown
    // 🔥 NEW: Current user info for collaboration cursors
    currentUser?: {
        name: string;
        color: string;
    };
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
    localSynced = false,  // 🔥 FIX: Wait for IndexedDB sync before checking _init_markdown
    currentUser,  // 🔥 NEW: User info for collaboration cursors
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
        currentUser, // ✅ NEW: User info for collaboration cursors
    }), [setShowDiagramMenu, setShowAIModal, setShowTableModal, aiAutocompleteEnabled, ydoc, provider, currentUser]);

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

    // 🔥 STEP 4: Pick up hydrated content from Yjs (one-time only per document)
    // This reads the _init_markdown field written by WorkspaceContext
    const hasLoadedInitialRef = useRef(false);
    const lastYdocRef = useRef<Y.Doc | undefined>(undefined);
    
    // 🔥 BUG FIX: Reset hasLoadedInitialRef when ydoc changes (document switch)
    useEffect(() => {
        if (ydoc !== lastYdocRef.current) {
            hasLoadedInitialRef.current = false;
            lastYdocRef.current = ydoc;
        }
    }, [ydoc]);
    
    useEffect(() => {
        // 🔥 FIX: Wait for IndexedDB to sync BEFORE checking content
        if (!ydoc || !editor || hasLoadedInitialRef.current || !localSynced) {
            if (!localSynced && ydoc && editor) {
                console.log('⏳ [STEP 4] Waiting for IndexedDB sync before loading content...');
            }
            return;
        }
        
        // Check if XmlFragment already has content (loaded from IndexedDB or WebSocket)
        const fragment = ydoc.getXmlFragment('content');
        if (fragment.length > 0) {
            hasLoadedInitialRef.current = true;
            return;
        }
        
        // Check _init_markdown for content to load
        const tempText = ydoc.getText('_init_markdown');
        const htmlContent = tempText.toString();
        
        if (!htmlContent) {
            hasLoadedInitialRef.current = true;
            return;
        }
        
        
        // 🔥 FIX: Robust retry mechanism with cleanup
        let attempts = 0;
        const maxAttempts = 15;
        const retryDelay = 100; // ms
        let timeoutId: NodeJS.Timeout | null = null;
        let cancelled = false;
        
        const trySetContent = () => {
            // Check if effect was cleaned up
            if (cancelled || hasLoadedInitialRef.current) {
                return;
            }
            
            attempts++;
            
            // Check if editor and view are fully ready
            if (!editor.view || editor.isDestroyed) {
                if (attempts < maxAttempts) {
                    timeoutId = setTimeout(trySetContent, retryDelay);
                    return;
                }
                // Don't log error - content might have loaded from another effect
                return;
            }
            
            try {
                isProgrammaticUpdateRef.current = true;
                
                editor.commands.setContent(htmlContent, { emitUpdate: false });
                
                // Verify content was set
                const newFragment = ydoc.getXmlFragment('content');
                if (newFragment.length > 0) {
                    
                    // Clear _init_markdown (content now in XmlFragment)
                    ydoc.transact(() => {
                        if (tempText.length > 0) {
                            tempText.delete(0, tempText.length);
                        }
                    });
                    
                    hasLoadedInitialRef.current = true;
                } else if (attempts < maxAttempts && !cancelled) {
                    timeoutId = setTimeout(trySetContent, retryDelay);
                    return;
                }
                
                requestAnimationFrame(() => {
                    isProgrammaticUpdateRef.current = false;
                });
            } catch (error) {
                console.error(`❌ [STEP 4] Attempt ${attempts} failed:`, error);
                if (attempts < maxAttempts && !cancelled) {
                    timeoutId = setTimeout(trySetContent, retryDelay);
                }
            }
        };
        
        // Small delay to ensure editor is mounted
        timeoutId = setTimeout(trySetContent, 50);
        
        // Cleanup function - cancel pending retries
        return () => {
            cancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [ydoc, editor, isProgrammaticUpdateRef, localSynced]);

    return {
        editor,
        isProgrammaticUpdateRef,
    };
};

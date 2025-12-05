import { useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useDocumentStore } from '@/stores/documentStore';
import { useDocument } from './useDocuments';
import { useAutoSave } from './useAutoSave';

/**
 * Hook that connects a TipTap editor to the document store and storage service.
 * Handles loading, saving, and state synchronization.
 */
export function useEditorDocument(editor: Editor | null, documentId: string) {
  const { 
    setCurrentDocument, 
    updateContent, 
    content: storeContent,
    hasUnsavedChanges,
  } = useDocumentStore();
  
  const { 
    document, 
    isLoading, 
    error: loadError,
  } = useDocument(documentId);
  
  const { forceSave } = useAutoSave({
    enabled: true,
    delay: 1000,
  });

  // Load document into store when fetched
  useEffect(() => {
    if (document) {
      setCurrentDocument(document);
    }
  }, [document, setCurrentDocument]);

  // Update store when editor content changes
  const handleEditorUpdate = useCallback((html: string) => {
    updateContent(html);
  }, [updateContent]);

  // Sync store content to editor (for external updates)
  useEffect(() => {
    if (editor && storeContent && !hasUnsavedChanges) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== storeContent) {
        editor.commands.setContent(storeContent, false);
      }
    }
  }, [editor, storeContent, hasUnsavedChanges]);

  // Manual save function
  const saveNow = useCallback(async () => {
    await forceSave();
  }, [forceSave]);

  return {
    document,
    isLoading,
    loadError,
    hasUnsavedChanges,
    saveNow,
    handleEditorUpdate,
  };
}


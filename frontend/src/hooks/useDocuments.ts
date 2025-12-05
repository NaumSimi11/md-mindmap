import { useState, useEffect, useCallback } from 'react';
import { getStorageService } from '@/services/storage/StorageFactory';
import type { StorageDocument, StorageMetadata } from '@/services/storage/IStorageService';

export function useDocuments() {
  const [documents, setDocuments] = useState<StorageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const storage = getStorageService();

  // Load all documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const docs = await storage.list();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  // Create new document
  const createDocument = useCallback(async (title: string, content: string = '') => {
    try {
      const doc = await storage.create(title, content);
      await loadDocuments(); // Refresh list
      return doc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      throw err;
    }
  }, [storage, loadDocuments]);

  // Delete document
  const deleteDocument = useCallback(async (id: string) => {
    try {
      await storage.delete(id);
      await loadDocuments(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    }
  }, [storage, loadDocuments]);

  // Search documents
  const searchDocuments = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadDocuments();
      return;
    }
    
    try {
      const results = await storage.search(query);
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search documents');
    }
  }, [storage, loadDocuments]);

  // Update metadata (e.g., rename)
  const updateDocumentMetadata = useCallback(async (id: string, metadata: Partial<StorageMetadata>) => {
    try {
      await storage.updateMetadata(id, metadata);
      await loadDocuments(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    }
  }, [storage, loadDocuments]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    isLoading,
    error,
    createDocument,
    deleteDocument,
    searchDocuments,
    updateDocumentMetadata,
    refreshDocuments: loadDocuments,
  };
}

// Hook for managing a single document
export function useDocument(documentId: string) {
  const [document, setDocument] = useState<StorageDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const storage = getStorageService();

  // Load document
  const loadDocument = useCallback(async () => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const doc = await storage.read(documentId);
      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, storage]);

  // Save document content
  const saveDocument = useCallback(async (content: string) => {
    if (!documentId) {
      throw new Error('No document ID provided');
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await storage.update(documentId, content);
      // Update local state
      setDocument(prev => prev ? { ...prev, content } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [documentId, storage]);

  // Auto-save with debounce
  const autoSave = useCallback(async (content: string) => {
    // Debounce is handled by the component using this hook
    await saveDocument(content);
  }, [saveDocument]);

  // Initial load
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  return {
    document,
    isLoading,
    isSaving,
    error,
    saveDocument,
    autoSave,
    refreshDocument: loadDocument,
  };
}


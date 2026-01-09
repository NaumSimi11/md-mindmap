/**
 * useDocumentManager Hook
 * 
 * React integration for DocumentLifecycleManager
 * Production-ready hook for document operations
 */

import { useEffect, useState, useCallback } from 'react';
import { DocumentLifecycleManager } from '@/services/document';
import type { DocumentInstance, DocumentMetadata } from '@/services/document/types';

export interface UseDocumentManagerReturn {
  // State
  initialized: boolean;
  error: Error | null;
  
  // Document operations
  createDocument: (metadata: Omit<DocumentMetadata, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DocumentInstance>;
  loadDocument: (documentId: string) => Promise<DocumentInstance>;
  saveDocument: (documentId: string) => Promise<void>;
  closeDocument: (documentId: string, options?: { saveBeforeClose?: boolean }) => Promise<void>;
  
  // Document state
  getDocument: (documentId: string) => DocumentInstance | undefined;
  isDocumentOpen: (documentId: string) => boolean;
  getOpenDocuments: () => string[];
  
  // Statistics
  getStats: () => {
    autoSaveActive: number;
    total: number;
    referenced: number;
    unreferenced: number;
    states: { loaded: number; loading: number; saving: number; error: number };
    totalMemory: number;
  };
}

/**
 * Hook to interact with DocumentLifecycleManager
 */
export function useDocumentManager(): UseDocumentManagerReturn {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [, forceUpdate] = useState({});
  
  const manager = DocumentLifecycleManager.getInstance();
  
  // Initialize manager
  useEffect(() => {
    let mounted = true;
    
    const initManager = async () => {
      try {
        await manager.init();
        
        if (mounted) {
          setInitialized(true);
        }
      } catch (err) {
        console.error('❌ useDocumentManager: Initialization failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Initialization failed'));
        }
      }
    };
    
    initManager();
    
    return () => {
      mounted = false;
    };
  }, [manager]);
  
  // Listen to document events for UI updates
  useEffect(() => {
    const handleDocumentEvent = () => {
      forceUpdate({});
    };
    
    // Subscribe to all document events
    const unsubscribe = manager.subscribe(handleDocumentEvent);
    
    return () => {
      unsubscribe();
    };
  }, [manager]);
  
  // Create document
  const createDocument = useCallback(async (
    metadata: Omit<DocumentMetadata, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DocumentInstance> => {
    try {
      const instance = await manager.createDocument(metadata as any);
      return instance;
    } catch (err) {
      console.error('❌ Failed to create document:', err);
      throw err;
    }
  }, [manager]);
  
  // Load document
  const loadDocument = useCallback(async (documentId: string): Promise<DocumentInstance> => {
    try {
      const instance = await manager.loadDocument({ documentId });
      return instance;
    } catch (err) {
      console.error('❌ Failed to load document:', err);
      throw err;
    }
  }, [manager]);
  
  // Save document
  const saveDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      await manager.saveDocument(documentId);
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      throw err;
    }
  }, [manager]);
  
  // Close document
  const closeDocument = useCallback(async (
    documentId: string, 
    options?: { saveBeforeClose?: boolean }
  ): Promise<void> => {
    try {
      await manager.closeDocument(documentId, options);
    } catch (err) {
      console.error('❌ Failed to close document:', err);
      throw err;
    }
  }, [manager]);
  
  // Get document
  const getDocument = useCallback((documentId: string): DocumentInstance | undefined => {
    return manager.getDocument(documentId);
  }, [manager]);
  
  // Check if document is open
  const isDocumentOpen = useCallback((documentId: string): boolean => {
    return manager.isDocumentLoaded(documentId);
  }, [manager]);
  
  // Get all open documents
  const getOpenDocuments = useCallback((): string[] => {
    return manager.getAllDocuments().map(d => d.id);
  }, [manager]);
  
  // Get statistics
  const getStats = useCallback(() => {
    return manager.getStats();
  }, [manager]);
  
  return {
    initialized,
    error,
    createDocument,
    loadDocument,
    saveDocument,
    closeDocument,
    getDocument,
    isDocumentOpen,
    getOpenDocuments,
    getStats,
  };
}


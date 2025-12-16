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
    totalDocuments: number;
    activeDocuments: number;
    memoryUsage: number;
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
    
    const init = async () => {
      try {
        console.log('🔷 useDocumentManager: Initializing...');
        await manager.initialize();
        
        if (mounted) {
          setInitialized(true);
          console.log('✅ useDocumentManager: Initialized');
        }
      } catch (err) {
        console.error('❌ useDocumentManager: Initialization failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Initialization failed'));
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [manager]);
  
  // Listen to document events for UI updates
  useEffect(() => {
    const handleDocumentEvent = () => {
      forceUpdate({});
    };
    
    manager.on('document:created', handleDocumentEvent);
    manager.on('document:loaded', handleDocumentEvent);
    manager.on('document:saved', handleDocumentEvent);
    manager.on('document:closed', handleDocumentEvent);
    
    return () => {
      manager.off('document:created', handleDocumentEvent);
      manager.off('document:loaded', handleDocumentEvent);
      manager.off('document:saved', handleDocumentEvent);
      manager.off('document:closed', handleDocumentEvent);
    };
  }, [manager]);
  
  // Create document
  const createDocument = useCallback(async (
    metadata: Omit<DocumentMetadata, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DocumentInstance> => {
    try {
      console.log('📝 Creating document:', metadata.title);
      const instance = await manager.createDocument({
        ...metadata,
        content: metadata.content || '',
      });
      console.log('✅ Document created:', instance.metadata.id);
      return instance;
    } catch (err) {
      console.error('❌ Failed to create document:', err);
      throw err;
    }
  }, [manager]);
  
  // Load document
  const loadDocument = useCallback(async (documentId: string): Promise<DocumentInstance> => {
    try {
      console.log('📖 Loading document:', documentId);
      const instance = await manager.loadDocument({ documentId });
      console.log('✅ Document loaded:', documentId);
      return instance;
    } catch (err) {
      console.error('❌ Failed to load document:', err);
      throw err;
    }
  }, [manager]);
  
  // Save document
  const saveDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      console.log('💾 Saving document:', documentId);
      await manager.saveDocument(documentId);
      console.log('✅ Document saved:', documentId);
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
      console.log('🔒 Closing document:', documentId);
      await manager.closeDocument(documentId, options);
      console.log('✅ Document closed:', documentId);
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
    return manager.isDocumentOpen(documentId);
  }, [manager]);
  
  // Get all open documents
  const getOpenDocuments = useCallback((): string[] => {
    return manager.getOpenDocuments();
  }, [manager]);
  
  // Get statistics
  const getStats = useCallback(() => {
    return manager.getStatistics();
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


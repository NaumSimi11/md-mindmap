/**
 * useDocumentLifecycle Hook
 * 
 * React hook for document lifecycle management
 * Integrates DocumentLifecycleManager with React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DocumentLifecycleManager,
  DocumentInstance,
  DocumentState,
  DocumentEvent,
  DocumentEventType,
  CreateDocumentOptions,
  LoadDocumentOptions,
  SaveDocumentOptions,
  CloseDocumentOptions,
} from '@/services/document';

export function useDocumentLifecycle() {
  const [manager] = useState(() => DocumentLifecycleManager.getInstance());
  const [initialized, setInitialized] = useState(false);
  const [documents, setDocuments] = useState<DocumentInstance[]>([]);
  const mountedRef = useRef(true);

  // Initialize manager
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await manager.init();
        if (mounted) {
          setInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize document manager:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [manager]);

  // Subscribe to document events
  useEffect(() => {
    if (!initialized) return;

    const handleEvent = (event: DocumentEvent) => {
      if (!mountedRef.current) return;

      // Update documents list on relevant events
      if ([
        DocumentEventType.DOCUMENT_CREATED,
        DocumentEventType.DOCUMENT_LOADED,
        DocumentEventType.DOCUMENT_CLOSED,
      ].includes(event.type)) {
        setDocuments(manager.getAllDocuments());
      }
    };

    const unsubscribe = manager.subscribe(handleEvent);

    // Initial load
    setDocuments(manager.getAllDocuments());

    return unsubscribe;
  }, [initialized, manager]);

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  /**
   * Create new document
   */
  const createDocument = useCallback(
    async (options: CreateDocumentOptions): Promise<DocumentInstance | null> => {
      if (!initialized) {
        console.error('Document manager not initialized');
        return null;
      }

      try {
        const instance = await manager.createDocument(options);
        return instance;
      } catch (error) {
        console.error('Failed to create document:', error);
        return null;
      }
    },
    [initialized, manager]
  );

  /**
   * Load existing document
   */
  const loadDocument = useCallback(
    async (options: LoadDocumentOptions): Promise<DocumentInstance | null> => {
      if (!initialized) {
        console.error('Document manager not initialized');
        return null;
      }

      try {
        const instance = await manager.loadDocument(options);
        return instance;
      } catch (error) {
        console.error('Failed to load document:', error);
        return null;
      }
    },
    [initialized, manager]
  );

  /**
   * Save document
   */
  const saveDocument = useCallback(
    async (
      documentId: string,
      options?: SaveDocumentOptions
    ): Promise<boolean> => {
      if (!initialized) {
        console.error('Document manager not initialized');
        return false;
      }

      try {
        await manager.saveDocument(documentId, options);
        return true;
      } catch (error) {
        console.error('Failed to save document:', error);
        return false;
      }
    },
    [initialized, manager]
  );

  /**
   * Close document
   */
  const closeDocument = useCallback(
    async (
      documentId: string,
      options?: CloseDocumentOptions
    ): Promise<boolean> => {
      if (!initialized) {
        console.error('Document manager not initialized');
        return false;
      }

      try {
        await manager.closeDocument(documentId, options);
        return true;
      } catch (error) {
        console.error('Failed to close document:', error);
        return false;
      }
    },
    [initialized, manager]
  );

  /**
   * Get document instance
   */
  const getDocument = useCallback(
    (documentId: string): DocumentInstance | undefined => {
      if (!initialized) return undefined;
      return manager.getDocument(documentId);
    },
    [initialized, manager]
  );

  /**
   * Check if document is loaded
   */
  const isDocumentLoaded = useCallback(
    (documentId: string): boolean => {
      if (!initialized) return false;
      return manager.isDocumentLoaded(documentId);
    },
    [initialized, manager]
  );

  /**
   * Get manager statistics
   */
  const getStats = useCallback(() => {
    if (!initialized) return null;
    return manager.getStats();
  }, [initialized, manager]);

  return {
    // State
    initialized,
    documents,
    
    // Operations
    createDocument,
    loadDocument,
    saveDocument,
    closeDocument,
    getDocument,
    isDocumentLoaded,
    getStats,
    
    // Manager instance (for advanced use)
    manager,
  };
}


/**
 * useBackendWorkspace Hook
 * Manages workspace state with backend integration
 */

import { useState, useEffect } from 'react';
import { backendWorkspaceService, type Workspace, type Document } from '@/services/workspace/BackendWorkspaceService';
import { useAuth } from './useAuth';

export function useBackendWorkspace() {
  const { isAuthenticated, user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspace when user logs in
  useEffect(() => {
    const initWorkspace = async () => {
      if (!isAuthenticated || !user) {
        setWorkspace(null);
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await backendWorkspaceService.init();
        
        const currentWorkspace = backendWorkspaceService.getCurrentWorkspace();
        const docs = backendWorkspaceService.getAllDocuments();

        setWorkspace(currentWorkspace);
        setDocuments(docs);

        console.log('✅ Workspace hook initialized:', currentWorkspace.name);
      } catch (err: any) {
        console.error('❌ Failed to initialize workspace:', err);
        setError(err.message || 'Failed to load workspace');
      } finally {
        setIsLoading(false);
      }
    };

    initWorkspace();
  }, [isAuthenticated, user]);

  // Create new document
  const createDocument = async (
    type: Document['type'],
    title: string,
    content: string = ''
  ): Promise<Document> => {
    const doc = await backendWorkspaceService.createDocument(type, title, content);
    setDocuments(prev => [...prev, doc]);
    return doc;
  };

  // Update document
  const updateDocument = async (documentId: string, updates: Partial<Document>): Promise<void> => {
    await backendWorkspaceService.updateDocument(documentId, updates);
    setDocuments(prev => 
      prev.map(d => d.id === documentId ? { ...d, ...updates } : d)
    );
  };

  // Auto-save document
  const autoSaveDocument = (documentId: string, content: string): void => {
    backendWorkspaceService.autoSave(documentId, content);
  };

  // Delete document
  const deleteDocument = async (documentId: string): Promise<void> => {
    await backendWorkspaceService.deleteDocument(documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  // Get document by ID
  const getDocument = (documentId: string): Document | undefined => {
    return documents.find(d => d.id === documentId);
  };

  // Refresh documents from backend
  const refreshDocuments = async (): Promise<void> => {
    if (!workspace) return;
    
    try {
      await backendWorkspaceService.init();
      const docs = backendWorkspaceService.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  };

  return {
    workspace,
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    autoSaveDocument,
    deleteDocument,
    getDocument,
    refreshDocuments,
    // Utility methods
    searchDocuments: backendWorkspaceService.searchDocuments.bind(backendWorkspaceService),
    getStarredDocuments: backendWorkspaceService.getStarredDocuments.bind(backendWorkspaceService),
    getRecentDocuments: backendWorkspaceService.getRecentDocuments.bind(backendWorkspaceService),
    markDocumentOpened: backendWorkspaceService.markDocumentOpened.bind(backendWorkspaceService),
    toggleStar: backendWorkspaceService.toggleStar.bind(backendWorkspaceService),
    getWorkspaceStats: backendWorkspaceService.getWorkspaceStats.bind(backendWorkspaceService),
  };
}


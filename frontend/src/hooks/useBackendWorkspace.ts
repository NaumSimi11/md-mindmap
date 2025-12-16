/**
 * useBackendWorkspace Hook
 * Manages workspace state with backend integration (Multi-Workspace Support)
 */

import { useState, useEffect, useCallback } from 'react';
import { backendWorkspaceService, type Workspace, type Document } from '@/services/workspace-legacy/BackendWorkspaceService';
import { useAuth } from './useAuth';

const LAST_WORKSPACE_KEY = 'mdreader_last_workspace_id';

export function useBackendWorkspace() {
  const { isAuthenticated, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspaces when user logs in
  useEffect(() => {
    const initWorkspaces = async () => {
      if (!isAuthenticated || !user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Initialize backend service
        await backendWorkspaceService.init();
        
        // Get all workspaces (returns workspaces array directly after init)
        const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
        
        // Deduplicate workspaces by ID (defensive fix for any duplicates)
        const uniqueWorkspaces = Array.from(
          new Map(allWorkspaces.map(w => [w.id, w])).values()
        );
        setWorkspaces(uniqueWorkspaces);

        // Try to restore last workspace from localStorage
        const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
        let workspace = allWorkspaces.find(w => w.id === lastWorkspaceId);
        
        // Fall back to first workspace if last one not found
        if (!workspace && allWorkspaces.length > 0) {
          workspace = allWorkspaces[0];
        }

        if (workspace) {
          setCurrentWorkspace(workspace);
          
          // Load documents for this workspace
          const docs = backendWorkspaceService.getAllDocuments();
          setDocuments(docs);
          
          // Save to localStorage
          localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
          
          console.log('✅ Workspace hook initialized:', workspace.name);
          console.log('📦 Total workspaces:', allWorkspaces.length);
        }
      } catch (err: any) {
        console.error('❌ Failed to initialize workspaces:', err);
        setError(err.message || 'Failed to load workspaces');
      } finally {
        setIsLoading(false);
      }
    };

    initWorkspaces();
  }, [isAuthenticated, user]);

  // Switch to a different workspace
  const switchWorkspace = useCallback(async (workspace: Workspace): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear current state first
      setCurrentWorkspace(null);
      setDocuments([]);
      
      // Then load new workspace
      await backendWorkspaceService.switchWorkspace(workspace.id);
      const docs = backendWorkspaceService.getAllDocuments();
      
      // Update with new data
      setCurrentWorkspace({...workspace});
      setDocuments([...docs]);
      localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
      
      console.log('✅ Switched to workspace:', workspace.name, '| Docs:', docs.length);
    } catch (err) {
      console.error('❌ Failed to switch workspace:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new workspace
  const createWorkspace = useCallback(async (data: { name: string; description: string; icon: string }): Promise<Workspace> => {
    const newWorkspace = await backendWorkspaceService.createWorkspace(data);
    
    // Refresh workspaces list from service
    const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
    setWorkspaces(allWorkspaces);
    
    // Automatically switch to the new workspace
    await switchWorkspace(newWorkspace);
    
    console.log('✅ Workspace created:', newWorkspace.name);
    return newWorkspace;
  }, [switchWorkspace]);

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
    if (!currentWorkspace) return;
    
    try {
      await backendWorkspaceService.init();
      const docs = backendWorkspaceService.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  };

  return {
    // Multi-workspace support
    workspaces,
    currentWorkspace,
    createWorkspace,
    switchWorkspace,
    
    // Documents
    documents,
    createDocument,
    updateDocument,
    autoSaveDocument,
    deleteDocument,
    getDocument,
    refreshDocuments,
    
    // State
    isLoading,
    error,
    
    // Utility methods
    searchDocuments: backendWorkspaceService.searchDocuments.bind(backendWorkspaceService),
    getStarredDocuments: backendWorkspaceService.getStarredDocuments.bind(backendWorkspaceService),
    getRecentDocuments: backendWorkspaceService.getRecentDocuments.bind(backendWorkspaceService),
    markDocumentOpened: backendWorkspaceService.markDocumentOpened.bind(backendWorkspaceService),
    toggleStar: backendWorkspaceService.toggleStar.bind(backendWorkspaceService),
    getWorkspaceStats: backendWorkspaceService.getWorkspaceStats.bind(backendWorkspaceService),
  };
}


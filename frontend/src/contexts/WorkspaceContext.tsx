/**
 * WorkspaceContext - Shared workspace state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { backendWorkspaceService, type Workspace, type Document } from '@/services/workspace/BackendWorkspaceService';
import { OfflineWorkspaceService } from '@/services/offline/OfflineWorkspaceService';
import { syncManager } from '@/services/offline/SyncManager';

// Create offline-aware wrapper
const offlineWorkspaceService = new OfflineWorkspaceService(backendWorkspaceService);

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  createWorkspace: (data: { name: string; description: string; icon: string }) => Promise<Workspace>;
  createDocument: (type: Document['type'], title: string, content?: string) => Promise<Document>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocument: (documentId: string) => Document | undefined;
  refreshDocuments: () => Promise<void>;
  autoSaveDocument: (documentId: string, content: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LAST_WORKSPACE_KEY = 'mdreader:last-workspace-id';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initCounter, setInitCounter] = useState(0); // Force re-init counter

  // Initialize on auth
  useEffect(() => {
    const init = async () => {
      console.log('🔵 WorkspaceContext init triggered:', { 
        isAuthenticated, 
        hasUser: !!user, 
        userId: user?.id,
        email: user?.email,
        username: user?.username,
        authLoading,
        initCounter 
      });
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Waiting for auth to finish loading...', { authLoading });
        setIsLoading(false);
        return;
      }
      
      if (!isAuthenticated) {
        console.log('⚠️ Not authenticated, clearing state', { isAuthenticated });
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setDocuments([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('⚠️ No user object yet, waiting...', { user });
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 Initializing workspace for user:', user.username || user.email);
        setIsLoading(true);
        await offlineWorkspaceService.init();
        
        const allWorkspaces = await offlineWorkspaceService.getAllWorkspaces();
        const uniqueWorkspaces = Array.from(new Map(allWorkspaces.map(w => [w.id, w])).values());
        setWorkspaces(uniqueWorkspaces);

        const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
        let workspace = allWorkspaces.find(w => w.id === lastWorkspaceId) || allWorkspaces[0];

        if (workspace) {
          // Set workspace in context
          setCurrentWorkspace(workspace);
          
          // Check if service needs to switch workspace
          try {
            const serviceWorkspace = offlineWorkspaceService.getCurrentWorkspace();
            if (serviceWorkspace.id !== workspace.id) {
              console.log('🔄 Service has different workspace, switching...');
              await offlineWorkspaceService.switchWorkspace(workspace.id);
            }
          } catch (err) {
            // Service might not have workspace yet, switch it
            console.log('🔄 Service has no workspace, switching...');
            await offlineWorkspaceService.switchWorkspace(workspace.id);
          }
          
          const docs = offlineWorkspaceService.getAllDocuments();
          setDocuments(docs);
          localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
          
          console.log('✅ Workspace context initialized:', workspace.name, 'with', docs.length, 'docs');
          console.log('📊 Final state:', {
            workspaces: uniqueWorkspaces.length,
            currentWorkspace: workspace.name,
            documents: docs.length
          });
        } else {
          console.warn('⚠️ No workspace found for user');
        }
      } catch (err: any) {
        console.error('❌ Workspace init failed:', err);
        setError(err.message || 'Failed to load workspaces');
      } finally {
        setIsLoading(false);
        console.log('✅ WorkspaceContext initialization complete (isLoading = false)');
      }
    };

    init();
  }, [isAuthenticated, user, authLoading, user?.id, initCounter]); // Include initCounter to force re-init
  
  // Listen for login events to FORCE re-init
  useEffect(() => {
    const handleLoginSuccess = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔔 Login event detected, FORCING workspace re-init for user:', customEvent.detail?.user?.username);
      
      // Force re-init by incrementing counter
      setInitCounter(prev => prev + 1);
    };
    
    window.addEventListener('auth:login', handleLoginSuccess);
    return () => window.removeEventListener('auth:login', handleLoginSuccess);
  }, []);
  
  // Listen for document sync events (when offline docs get real IDs from backend)
  useEffect(() => {
    const handleDocumentSynced = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { oldId, newId, doc } = customEvent.detail;
      
      console.log(`🔄 Document synced: ${oldId} → ${newId}`);
      
      // Map the API doc to our Document type
      const mappedDoc: Document = {
        id: doc.id,
        type: 'markdown',
        title: doc.title,
        content: doc.content,
        folderId: doc.folder_id || null,
        workspaceId: doc.workspace_id,
        starred: doc.is_starred || false,
        tags: doc.tags || [],
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
        lastOpenedAt: doc.last_opened_at ? new Date(doc.last_opened_at) : undefined,
        metadata: {}
      };
      
      // Update backend service's internal state
      const backendDocs = (offlineWorkspaceService as any).backendService.documents;
      const oldIndex = backendDocs.findIndex((d: Document) => d.id === oldId);
      if (oldIndex >= 0) {
        backendDocs.splice(oldIndex, 1, mappedDoc);
        console.log('✅ Updated backend service state with synced document');
      }
      
      // Update context state
      setDocuments(prev => {
        // Remove the old temp ID document AND any existing with new ID (dedup)
        const filtered = prev.filter(d => d.id !== oldId && d.id !== newId);
        
        console.log(`📊 Sync event: ${prev.length} docs → removing ${oldId} and ${newId} → ${filtered.length} → adding ${newId}`);
        
        // Add the new one
        return [...filtered, mappedDoc];
      });
    };
    
    const handleOfflineDataLoaded = () => {
      console.log('🔄 Offline data loaded event, refreshing documents...');
      const docs = offlineWorkspaceService.getAllDocuments();
      setDocuments([...docs]);
      console.log(`✅ Refreshed: ${docs.length} documents`);
    };
    
    window.addEventListener('document-synced', handleDocumentSynced);
    window.addEventListener('offline-data-loaded', handleOfflineDataLoaded);
    
    return () => {
      window.removeEventListener('document-synced', handleDocumentSynced);
      window.removeEventListener('offline-data-loaded', handleOfflineDataLoaded);
    };
  }, []);

  const switchWorkspace = useCallback(async (workspace: Workspace) => {
    try {
      console.log('🔄 [Context] Switching workspace:', workspace.name, workspace.id);
      
      // If switching to a different workspace, sync pending changes first
      const oldWorkspaceId = currentWorkspace?.id;
      if (oldWorkspaceId && oldWorkspaceId !== workspace.id) {
        console.log('🔄 [Context] Syncing pending changes before switch...');
        
        // Try to sync with 3-second timeout
        await Promise.race([
          syncManager.syncNow(),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]).catch(err => {
          console.warn('⚠️ Failed to sync before workspace switch:', err);
        });
        
        // Dispatch event after sync attempt
        window.dispatchEvent(new CustomEvent('workspace:switch', {
          detail: { oldWorkspaceId, newWorkspaceId: workspace.id }
        }));
      }
      
      setIsLoading(true);
      
      // Clear old state
      setCurrentWorkspace(null);
      setDocuments([]);
      console.log('🧹 [Context] Cleared old state');
      
      // Load new workspace
      await offlineWorkspaceService.switchWorkspace(workspace.id);
      const docs = offlineWorkspaceService.getAllDocuments();
      console.log('📦 [Context] Loaded from backend:', docs.length, 'docs');
      
      // Update state
      setCurrentWorkspace({...workspace});
      setDocuments([...docs]);
      localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
      console.log('✅ [Context] State updated:', workspace.name);
    } catch (err) {
      console.error('❌ [Context] Switch failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data: { name: string; description: string; icon: string }) => {
    const newWorkspace = await offlineWorkspaceService.createWorkspace(data);
    const allWorkspaces = await offlineWorkspaceService.getAllWorkspaces();
    setWorkspaces(allWorkspaces);
    await switchWorkspace(newWorkspace);
    return newWorkspace;
  }, [switchWorkspace]);

  const createDocument = useCallback(async (type: Document['type'], title: string, content: string = '') => {
    if (!currentWorkspace) {
      console.error('❌ Cannot create document: No workspace loaded');
      throw new Error('No workspace selected. Please wait for workspace to load.');
    }
    
    console.log('🔵 WorkspaceContext.createDocument() called:', { type, title, currentWorkspace: currentWorkspace?.name });
    
    const doc = await offlineWorkspaceService.createDocument(type, title, content);
    
    console.log('📄 Document created by service:', {
      id: doc.id,
      title: doc.title,
      workspaceId: doc.workspaceId
    });
    
    // Force refresh from service to get latest state (includes our new doc)
    const latestDocs = offlineWorkspaceService.getAllDocuments();
    console.log(`📊 getAllDocuments() returned ${latestDocs.length} documents`);
    
    setDocuments(latestDocs);
    console.log(`✅ State updated with ${latestDocs.length} documents`);
    
    return doc;
  }, [currentWorkspace]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    await offlineWorkspaceService.updateDocument(documentId, updates);
    setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    await offlineWorkspaceService.deleteDocument(documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  }, []);

  const getDocument = useCallback((documentId: string) => {
    return documents.find(d => d.id === documentId);
  }, [documents]);

  const refreshDocuments = useCallback(async () => {
    if (!currentWorkspace) return;
    
    try {
      await offlineWorkspaceService.init();
      const docs = offlineWorkspaceService.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  }, [currentWorkspace]);

  const autoSaveDocument = useCallback((documentId: string, content: string) => {
    offlineWorkspaceService.autoSave(documentId, content);
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      documents,
      isLoading,
      error,
      switchWorkspace,
      createWorkspace,
      createDocument,
      updateDocument,
      deleteDocument,
      getDocument,
      refreshDocuments,
      autoSaveDocument,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}


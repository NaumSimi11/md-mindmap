/**
 * useBackendFolders Hook
 * Manages folder state with backend integration
 */

import { useState, useEffect, useCallback } from 'react';
import { folderService, type Folder, type FolderTree, type CreateFolderData, type UpdateFolderData } from '@/services/api/FolderService';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { offlineDB } from '@/services/offline/OfflineDatabase';
import { syncManager } from '@/services/offline/SyncManager';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './useAuth';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { authService } from '@/services/api';

export function useBackendFolders() {
  const { currentWorkspace } = useWorkspace();
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Helper function to flatten folder tree
  const flattenTree = (tree: FolderTree[]): Folder[] => {
    const result: Folder[] = [];
    const flatten = (nodes: FolderTree[]) => {
      for (const node of nodes) {
        result.push({
          id: node.id,
          workspace_id: node.workspace_id,
          parent_id: node.parent_id,
          name: node.name,
          icon: node.icon,
          position: node.position,
          created_at: node.created_at,
          updated_at: node.updated_at
        });
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      }
    };
    flatten(tree);
    return result;
  };

  // Load all folders for current workspace
  const loadFolders = useCallback(async () => {
    console.log('🔄 [BackendFolders] loadFolders called', { 
      workspaceId: currentWorkspace?.id 
    });
    if (!currentWorkspace) {
      console.log('🔄 [BackendFolders] No workspace, skipping');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
      const isLocalOnly = currentWorkspace.syncStatus === 'local';
      const authCheck = authService.isAuthenticated();
      const shouldUseBackend = authCheck || isAuthenticated;
      
     

      // Guest mode OR local-only workspace: Load from GuestWorkspaceService
      if (!shouldUseBackend || isLocalOnly) {
        
        // Get folders for current workspace
        const guestFolders = await guestWorkspaceService.getFolders(currentWorkspace.id);
        
        // Convert to backend folder format and build tree
        const folders: Folder[] = guestFolders.map(gf => ({
          id: gf.id,
          workspace_id: gf.workspaceId,
          parent_id: gf.parentId,
          name: gf.name,
          icon: gf.icon,
          position: gf.position,
          created_at: gf.createdAt,
          updated_at: gf.updatedAt
        }));
        
        setFolders(folders);
        
        // Build tree from flat list
        const tree = buildTreeFromFolders(folders);
        setFolderTree(tree);
        
        setIsLoading(false);
        return;
      }

      // Authenticated mode + synced workspace: Load from BackendWorkspaceService
      try {
        // Check if workspace ID is a temp ID (starts with "temp_")
        if (currentWorkspace.id.startsWith('temp_')) {
          // Workspace has temp ID, waiting for sync - set empty state
          setFolders([]);
          setFolderTree([]);
          setIsLoading(false);
          return;
        }

        // Load folders from BackendWorkspaceService (uses IndexedDB cache internally)
        const { backendWorkspaceService } = await import('@/services/workspace');
        
        // 🔥 FIX: Check for cloud workspace ID mapping (local ID → cloud ID)
        let workspaceIdToUse = currentWorkspace.id;
        try {
          const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
          const cloudWorkspaceId = await selectiveSyncService.getCloudWorkspaceId(currentWorkspace.id);
          if (cloudWorkspaceId && cloudWorkspaceId !== currentWorkspace.id) {
            workspaceIdToUse = cloudWorkspaceId;
          }
        } catch {
          // Ignore mapping errors, use original ID
        }
        
        const backendFolders = await backendWorkspaceService.getFolders(workspaceIdToUse);
        
        console.log('🔄 [BackendFolders] Got folders from backend:', {
          count: backendFolders?.length,
          folders: backendFolders?.map((f: any) => ({ id: f.id, name: f.name }))
        });
        
        // Handle array or object response
        const folderArray = Array.isArray(backendFolders) 
          ? backendFolders 
          : (backendFolders as any)?.items || [];
        
        // Convert to Folder format (snake_case for compatibility)
        const folders: Folder[] = folderArray.map((bf: any) => ({
          id: bf.id,
          workspace_id: bf.workspaceId || bf.workspace_id,
          parent_id: bf.parentId || bf.parent_id,
          name: bf.name,
          icon: bf.icon,
          position: bf.position,
          created_at: bf.createdAt || bf.created_at,
          updated_at: bf.updatedAt || bf.updated_at
        }));
        
        console.log('🔄 [BackendFolders] Setting folders:', folders.length);
        setFolders(folders);
        
        // Build tree from flat list
        const tree = buildTreeFromFolders(folders);
        console.log('🔄 [BackendFolders] Built tree:', tree.length);
        setFolderTree(tree);
        
        setIsLoading(false);
        return;
      } catch {
        // Set empty state on error
        setFolders([]);
        setFolderTree([]);
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
      // Don't clear state on error - keep existing folders visible
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for folder sync events (when offline folders get real IDs from backend)
  useEffect(() => {
    const handleFolderSynced = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { oldId, newId, folder } = customEvent.detail;
      
      
      // Update local state: replace old temp ID with new real ID
      setFolders(prev => {
        const filtered = prev.filter(f => f.id !== oldId);
        return [...filtered, {
          id: folder.id,
          workspace_id: folder.workspace_id,
          parent_id: folder.parent_id,
          name: folder.name,
          icon: folder.icon,
          position: folder.position,
          created_at: folder.created_at,
          updated_at: folder.updated_at
        }];
      });
      
      // Reload tree to reflect changes
      loadFolders();
    };
    
    // 🤖 Listen for agent-created content (folders AND documents)
    const handleDocumentsCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { folders: folderCount, documents: docCount } = customEvent.detail || {};
      console.log('🔄 [BackendFolders] 📣 Event received! Agent created content:', { folderCount, docCount });
      // Always refresh - documents might need folder tree update
      console.log('🔄 [BackendFolders] Scheduling folder refresh...');
      loadFolders();
      setTimeout(() => {
        console.log('🔄 [BackendFolders] Refresh attempt #2 (500ms)');
        loadFolders();
      }, 500);
      setTimeout(() => {
        console.log('🔄 [BackendFolders] Refresh attempt #3 (1500ms)');
        loadFolders();
      }, 1500);
    };
    
    window.addEventListener('folder-synced', handleFolderSynced);
    window.addEventListener('documents:created', handleDocumentsCreated);
    
    return () => {
      window.removeEventListener('folder-synced', handleFolderSynced);
      window.removeEventListener('documents:created', handleDocumentsCreated);
    };
  }, [loadFolders]);

  // Load folders when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      loadFolders();
    } else {
      setFolders([]);
      setFolderTree([]);
    }
  }, [currentWorkspace?.id, loadFolders]);

  // Create new folder - Works offline!
  const createFolder = useCallback(async (data: CreateFolderData): Promise<Folder> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
    const isLocalOnly = currentWorkspace.sync?.status === 'local';
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;
    


    // Guest mode OR local-only workspace: Use guest service
    if (!shouldUseBackend || isLocalOnly) {
      const folder = await guestWorkspaceService.createFolder({
        workspaceId: currentWorkspace.id,
        name: data.name,
        icon: data.icon || '📁',
        parentId: data.parent_id || null
      });
      
      // Refresh folder list
      await loadFolders();
      
      return folder as any;
    }

    // Authenticated mode: Use BackendWorkspaceService (handles API + cache)
    if (isOnline) {
      try {
        // 🔥 FIX: Use BackendWorkspaceService instead of direct API call
        // This ensures folder is cached in the correct IndexedDB (MDReaderBackendCache)
        const { backendWorkspaceService } = await import('@/services/workspace');
        const backendFolder = await backendWorkspaceService.createFolder({
          workspaceId: currentWorkspace.id,
          name: data.name,
          icon: data.icon,
          parentId: data.parent_id || null,
        });
        
        // Convert to Folder format (snake_case for compatibility)
        const folder: Folder = {
          id: backendFolder.id,
          workspace_id: backendFolder.workspaceId,
          parent_id: backendFolder.parentId,
          name: backendFolder.name,
          icon: backendFolder.icon,
          position: backendFolder.position,
          created_at: backendFolder.createdAt,
          updated_at: backendFolder.updatedAt
        };
        
        // Reload folders to get updated tree (will load from BackendWorkspaceService cache)
        await loadFolders();
        
        return folder;
      } catch {
        // Fall through to offline mode
      }
    }

    // Offline mode: Create locally with temp ID
    
    const tempId = `temp-folder-${uuidv4()}`;
    const now = new Date().toISOString();
    
    const folder: Folder = {
      id: tempId,
      workspace_id: currentWorkspace.id,
      parent_id: data.parent_id || null,
      name: data.name,
      icon: data.icon || '📁',
      position: data.position || 0,
      created_at: now,
      updated_at: now
    };

    // Store in IndexedDB
    await offlineDB.folders.put({
      ...folder,
      last_synced: null,
      pending_changes: true
    });

    // Queue for sync
    await syncManager.queueChange({
      entity_type: 'folder',
      entity_id: tempId,
      workspace_id: currentWorkspace.id,
      operation: 'create',
      data: {
        workspaceId: currentWorkspace.id,
        name: data.name,
        icon: data.icon || '📁',
        parentId: data.parent_id || null,
        position: data.position || 0
      },
      priority: 'high'
    });

    // Update local state immediately
    setFolders(prev => [...prev, folder]);
    
    // Rebuild tree
    const newTree = buildTreeFromFolders([...folders, folder]);
    setFolderTree(newTree);

    return folder;
  }, [currentWorkspace?.id, isAuthenticated, isOnline, loadFolders, folders]);

  // Update folder - Works offline!
  const updateFolder = useCallback(async (folderId: string, data: UpdateFolderData): Promise<void> => {
    if (!currentWorkspace) return;

    // Update IndexedDB first (optimistic)
    try {
      const existing = await offlineDB.folders.get(folderId);
      if (existing) {
        await offlineDB.folders.update(folderId, {
          ...data,
          updated_at: new Date().toISOString(),
          pending_changes: true
        });
      }
    } catch {
      // Could not update IndexedDB
    }

    if (isOnline) {
      // Try online first
      try {
        await folderService.updateFolder(folderId, currentWorkspace.id, data);
        
        // Update local state
        setFolders(prev => 
          prev.map(f => f.id === folderId ? { ...f, ...data } : f)
        );
        
        // Reload tree if structure changed
        if (data.parent_id !== undefined || data.position !== undefined) {
          await loadFolders();
        }
        
        return;
      } catch {
        // Fall through to queue
      }
    }

    // Offline or failed: Queue for sync
    
    await syncManager.queueChange({
      entity_type: 'folder',
      entity_id: folderId,
      workspace_id: currentWorkspace.id,
      operation: 'update',
      data: data,
      priority: 'normal'
    });

    // Update local state immediately
    setFolders(prev => 
      prev.map(f => f.id === folderId ? { ...f, ...data, updated_at: new Date().toISOString() } : f)
    );
    
    // Rebuild tree if structure changed
    if (data.parent_id !== undefined || data.position !== undefined) {
      const updatedFolders = folders.map(f => 
        f.id === folderId ? { ...f, ...data, updated_at: new Date().toISOString() } : f
      );
      const newTree = buildTreeFromFolders(updatedFolders);
      setFolderTree(newTree);
    }

  }, [currentWorkspace?.id, isOnline, loadFolders, folders]);

  // Delete folder - Works offline!
  const deleteFolder = useCallback(async (folderId: string, cascade: boolean = false): Promise<void> => {
    if (!currentWorkspace) return;

    // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
    const isLocalOnly = currentWorkspace.sync?.status === 'local';
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;


    // Guest mode OR local-only workspace: Use guest service
    if (!shouldUseBackend || isLocalOnly) {
      await guestWorkspaceService.deleteFolder(folderId);
      
      // Refresh folder list
      await loadFolders();
      
      return;
    }

    // Authenticated mode + synced workspace: Use BackendWorkspaceService
    if (shouldUseBackend && isOnline) {
      try {
        // 🔥 FIX: Use BackendWorkspaceService instead of direct API call
        // This ensures folder is deleted from the correct IndexedDB cache (MDReaderBackendCache)
        const { backendWorkspaceService } = await import('@/services/workspace');
        await backendWorkspaceService.deleteFolder(folderId);
        
        // Remove from local state immediately (optimistic UI)
        setFolders(prev => prev.filter(f => f.id !== folderId));
        
        // Rebuild tree
        const updatedFolders = folders.filter(f => f.id !== folderId);
        const newTree = buildTreeFromFolders(updatedFolders);
        setFolderTree(newTree);
        
        // Reload folders to ensure consistency (will load from BackendWorkspaceService cache)
        await loadFolders();
        
        return;
      } catch (err) {
        // Revert optimistic update on error
        await loadFolders();
        throw err;
      }
    }

    // Guest mode or offline: Use direct API call (legacy path)
    if (isOnline && !shouldUseBackend) {
      try {
        await folderService.deleteFolder(folderId, currentWorkspace.id, cascade);
        
        // Remove from IndexedDB (guest mode uses offlineDB)
        await offlineDB.folders.delete(folderId);
        
        // Remove from local state
        setFolders(prev => prev.filter(f => f.id !== folderId));
        
        // Reload tree
        await loadFolders();
        
        return;
      } catch {
        // Fall through to queue
      }
    }

    // Offline or failed: Queue for sync
    
    // Delete from IndexedDB
    await offlineDB.folders.delete(folderId);
    
    await syncManager.queueChange({
      entity_type: 'folder',
      entity_id: folderId,
      workspace_id: currentWorkspace.id,
      operation: 'delete',
      data: { cascade },
      priority: 'normal'
    });

    // Remove from local state immediately
    setFolders(prev => prev.filter(f => f.id !== folderId));
    
    // Rebuild tree
    const updatedFolders = folders.filter(f => f.id !== folderId);
    const newTree = buildTreeFromFolders(updatedFolders);
    setFolderTree(newTree);

  }, [currentWorkspace?.id, isOnline, loadFolders, folders]);

  // Move folder - Works offline!
  const moveFolder = useCallback(async (folderId: string, parentId: string | null, position?: number): Promise<void> => {
    if (!currentWorkspace) return;


    // This is just an updateFolder with parent_id and position
    await updateFolder(folderId, { parent_id: parentId, position });
  }, [currentWorkspace?.id, isOnline, updateFolder]);

  // Get folder by ID
  const getFolder = useCallback((folderId: string): Folder | undefined => {
    return folders.find(f => f.id === folderId);
  }, [folders]);

  // Get root folders
  const getRootFolders = useCallback((): Folder[] => {
    return folders.filter(f => !f.parent_id);
  }, [folders]);

  // Get subfolders of a folder
  const getSubfolders = useCallback((parentId: string | null): Folder[] => {
    return folders.filter(f => f.parent_id === parentId);
  }, [folders]);

  return {
    folders,
    folderTree,
    isLoading,
    error,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    getFolder,
    getRootFolders,
    getSubfolders,
  };
}

/**
 * Flatten folder tree into array
 */
function flattenTree(tree: FolderTree[]): Folder[] {
  const result: Folder[] = [];
  
  function traverse(nodes: FolderTree[]) {
    for (const node of nodes) {
      const { children, document_count, ...folder } = node;
      result.push(folder);
      
      if (children && children.length > 0) {
        traverse(children);
      }
    }
  }
  
  traverse(tree);
  return result;
}

/**
 * Build folder tree from flat array (for IndexedDB cache)
 */
function buildTreeFromFolders(folders: Folder[]): FolderTree[] {
  const folderMap = new Map<string, FolderTree>();
  const rootFolders: FolderTree[] = [];
  
  // First pass: Create all nodes
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      document_count: 0 // We don't have document count in cache
    });
  });
  
  // Second pass: Build tree structure
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootFolders.push(node);
      }
    } else {
      // Root folder
      rootFolders.push(node);
    }
  });
  
  // Sort by position
  const sortByPosition = (a: FolderTree, b: FolderTree) => a.position - b.position;
  rootFolders.sort(sortByPosition);
  folderMap.forEach(node => node.children.sort(sortByPosition));
  
  return rootFolders;
}


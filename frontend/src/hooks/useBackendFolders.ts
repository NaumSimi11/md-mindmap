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
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
      const isLocalOnly = currentWorkspace.sync?.status === 'local';
      const authCheck = authService.isAuthenticated();
      const shouldUseBackend = authCheck || isAuthenticated;
      
      console.log('🔵 loadFolders called:', {
        'React isAuthenticated': isAuthenticated,
        'Direct auth check': authCheck,
        'Workspace sync status': currentWorkspace.sync?.status,
        'Is local-only': isLocalOnly,
        'Using': isLocalOnly ? 'guest (local)' : shouldUseBackend ? 'backend (cloud)' : 'guest',
        'Workspace ID': currentWorkspace.id
      });

      // Guest mode OR local-only workspace: Load from GuestWorkspaceService
      if (!shouldUseBackend || isLocalOnly) {
        console.log('📂 Loading folders from local IndexedDB:', isLocalOnly ? '(local workspace)' : '(guest mode)');
        
        // Get folders for current workspace
        const guestFolders = await guestWorkspaceService.getFolders(currentWorkspace.id);
        console.log(`✅ Loaded ${guestFolders.length} local folder(s) for workspace ${currentWorkspace.id}`);
        
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
        
        console.log(`✅ Built folder tree with ${tree.length} root folder(s)`);
        setIsLoading(false);
        return;
      }

      // Authenticated mode + synced workspace: Load from BackendWorkspaceService
      try {
        // Check if workspace ID is a temp ID (starts with "temp_")
        if (currentWorkspace.id.startsWith('temp_')) {
          console.warn('⚠️ Workspace has temp ID, waiting for sync...', currentWorkspace.id);
          // Set empty state - folders will be created when workspace syncs
          setFolders([]);
          setFolderTree([]);
          setIsLoading(false);
          return;
        }

        console.log('☁️ Loading folders from cloud/cache:', currentWorkspace.name);
        // Load folders from BackendWorkspaceService (uses IndexedDB cache internally)
        const { backendWorkspaceService } = await import('@/services/workspace');
        const backendFolders = await backendWorkspaceService.getFolders(currentWorkspace.id);
        
        // Convert to Folder format (snake_case for compatibility)
        const folders: Folder[] = backendFolders.map(bf => ({
          id: bf.id,
          workspace_id: bf.workspaceId,
          parent_id: bf.parentId,
          name: bf.name,
          icon: bf.icon,
          position: bf.position,
          created_at: bf.createdAt,
          updated_at: bf.updatedAt
        }));
        
        setFolders(folders);
        
        // Build tree from flat list
        const tree = buildTreeFromFolders(folders);
        setFolderTree(tree);
        
        console.log(`✅ Loaded ${folders.length} folder(s) from BackendWorkspaceService`);
        setIsLoading(false);
        return;
      } catch (error: any) {
        console.error('❌ Failed to load folders from BackendWorkspaceService:', error);
        // Set empty state on error
        setFolders([]);
        setFolderTree([]);
        setIsLoading(false);
        return;
      }

      // Guest mode: Try to load from backend first (legacy path)
      try {
        const tree = await folderService.getFolderTree(currentWorkspace.id);
        setFolderTree(tree);

        // Flatten tree for easy access
        const flatFolders = flattenTree(tree);
        setFolders(flatFolders);

        // 🔥 CRITICAL FIX: Cache folders in IndexedDB
        console.log('💾 Caching folders in IndexedDB...');
        await offlineDB.folders.clear(); // Clear old data
        for (const folder of flatFolders) {
          await offlineDB.folders.put({
            id: folder.id,
            workspace_id: folder.workspace_id,
            parent_id: folder.parent_id || null,
            name: folder.name,
            icon: folder.icon,
            position: folder.position,
            created_at: folder.created_at,
            updated_at: folder.updated_at,
            last_synced: new Date().toISOString(),
            pending_changes: false
          });
        }

        console.log('✅ Loaded folders from backend:', flatFolders.length);
        return;
      } catch (fetchError: any) {
        // If offline or network error, try IndexedDB cache
        console.warn('⚠️ Failed to load folders from backend, trying IndexedDB cache...');
        
        const cachedFolders = await offlineDB.folders
          .where('workspace_id').equals(currentWorkspace.id)
          .toArray();
        
        if (cachedFolders.length > 0) {
          // Map to Folder type and rebuild tree
          const folders: Folder[] = cachedFolders.map(cf => ({
            id: cf.id,
            workspace_id: cf.workspace_id,
            parent_id: cf.parent_id,
            name: cf.name,
            icon: cf.icon,
            position: cf.position,
            created_at: cf.created_at,
            updated_at: cf.updated_at
          }));
          
          setFolders(folders);
          
          // Rebuild tree from flat list
          const tree = buildTreeFromFolders(folders);
          setFolderTree(tree);
          
          console.log('✅ Loaded folders from IndexedDB cache:', folders.length);
          return;
        } else {
          console.warn('⚠️ No cached folders in IndexedDB');
          // Set empty state
          setFolders([]);
          setFolderTree([]);
          throw fetchError; // Re-throw original error
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to load folders:', err);
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
      
      console.log(`🔄 Folder synced: ${oldId} → ${newId}`);
      
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
    
    window.addEventListener('folder-synced', handleFolderSynced);
    
    return () => {
      window.removeEventListener('folder-synced', handleFolderSynced);
    };
  }, [loadFolders]);

  // Load folders when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      console.log('🔄 Folders: workspace changed, loading folders for:', currentWorkspace.id);
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
    
    console.log(`🔵 createFolder() called:`, {
      'React isAuthenticated': isAuthenticated,
      'Direct auth check': authCheck,
      'Workspace sync status': currentWorkspace.sync?.status,
      'Is local-only': isLocalOnly,
      'Using': isLocalOnly ? 'guest (local)' : shouldUseBackend ? 'backend (cloud)' : 'guest'
    });

    // Guest mode OR local-only workspace: Use guest service
    if (!shouldUseBackend || isLocalOnly) {
      console.log('📂 Creating folder in local IndexedDB:', isLocalOnly ? '(local workspace)' : '(guest mode)');
      const folder = await guestWorkspaceService.createFolder({
        workspaceId: currentWorkspace.id,
        name: data.name,
        icon: data.icon || '📁',
        parentId: data.parent_id || null
      });
      
      // Refresh folder list
      await loadFolders();
      
      console.log('✅ Local folder created:', folder.name);
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
        
        console.log('✅ Folder created online:', folder.name);
        return folder;
      } catch (err) {
        console.warn('⚠️ Online creation failed, falling through to offline mode:', err);
        // Fall through to offline mode
      }
    }

    // Offline mode: Create locally with temp ID
    console.log('📴 Creating folder offline...');
    
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

    console.log('📴 Folder created offline, queued for sync:', folder.name);
    return folder;
  }, [currentWorkspace?.id, isAuthenticated, isOnline, loadFolders, folders]);

  // Update folder - Works offline!
  const updateFolder = useCallback(async (folderId: string, data: UpdateFolderData): Promise<void> => {
    if (!currentWorkspace) return;

    console.log(`🔄 updateFolder(${folderId}), isOnline: ${isOnline}`);

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
    } catch (err) {
      console.warn('⚠️ Could not update IndexedDB:', err);
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
        
        console.log('✅ Folder updated online:', folderId);
        return;
      } catch (err) {
        console.warn('⚠️ Online update failed, queuing for sync:', err);
        // Fall through to queue
      }
    }

    // Offline or failed: Queue for sync
    console.log('📴 Queuing folder update for sync...');
    
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

    console.log('📴 Folder update queued for sync');
  }, [currentWorkspace?.id, isOnline, loadFolders, folders]);

  // Delete folder - Works offline!
  const deleteFolder = useCallback(async (folderId: string, cascade: boolean = false): Promise<void> => {
    if (!currentWorkspace) return;

    // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
    const isLocalOnly = currentWorkspace.sync?.status === 'local';
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;

    console.log(`🗑️ deleteFolder(${folderId}), isOnline: ${isOnline}, Workspace sync: ${currentWorkspace.sync?.status}, Using: ${isLocalOnly ? 'guest (local)' : shouldUseBackend ? 'backend (cloud)' : 'guest'}`);

    // Guest mode OR local-only workspace: Use guest service
    if (!shouldUseBackend || isLocalOnly) {
      console.log('📂 Deleting folder from local IndexedDB:', isLocalOnly ? '(local workspace)' : '(guest mode)');
      await guestWorkspaceService.deleteFolder(folderId);
      
      // Refresh folder list
      await loadFolders();
      
      console.log('✅ Local folder deleted:', folderId);
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
        
        console.log('✅ Folder deleted online:', folderId);
        return;
      } catch (err) {
        console.error('❌ Failed to delete folder:', err);
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
        
        console.log('✅ Folder deleted online:', folderId);
        return;
      } catch (err) {
        console.warn('⚠️ Online deletion failed, queuing for sync:', err);
        // Fall through to queue
      }
    }

    // Offline or failed: Queue for sync
    console.log('📴 Queuing folder deletion for sync...');
    
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

    console.log('📴 Folder deletion queued for sync');
  }, [currentWorkspace?.id, isOnline, loadFolders, folders]);

  // Move folder - Works offline!
  const moveFolder = useCallback(async (folderId: string, parentId: string | null, position?: number): Promise<void> => {
    if (!currentWorkspace) return;

    console.log(`🔄 moveFolder(${folderId}), isOnline: ${isOnline}`);

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


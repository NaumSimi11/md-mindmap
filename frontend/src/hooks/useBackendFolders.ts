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

export function useBackendFolders() {
  const { currentWorkspace } = useWorkspace();
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

      // Try to load from backend first
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

    console.log(`🔵 createFolder() called, isOnline: ${isOnline}`);

    if (isOnline) {
      // Try online first
      try {
        const folder = await folderService.createFolder(currentWorkspace.id, data);
        
        // Cache in IndexedDB
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
        
        // Reload folders to get updated tree
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
  }, [currentWorkspace?.id, isOnline, loadFolders, folders]);

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

    console.log(`🗑️ deleteFolder(${folderId}), isOnline: ${isOnline}`);

    if (isOnline) {
      // Try online first
      try {
        await folderService.deleteFolder(folderId, currentWorkspace.id, cascade);
        
        // Remove from IndexedDB
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


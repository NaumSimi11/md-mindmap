/**
 * useBackendFolders Hook
 * Manages folder state with backend integration
 */

import { useState, useEffect, useCallback } from 'react';
import { folderService, type Folder, type FolderTree, type CreateFolderData, type UpdateFolderData } from '@/services/api/FolderService';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useBackendFolders() {
  const { currentWorkspace } = useWorkspace();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load folders when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      console.log('🔄 Folders: workspace changed, loading folders for:', currentWorkspace.id);
      loadFolders();
    } else {
      setFolders([]);
      setFolderTree([]);
    }
  }, [currentWorkspace?.id]);

  // Load all folders for current workspace
  const loadFolders = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load folder tree (includes all folders in nested structure)
      const tree = await folderService.getFolderTree(currentWorkspace.id);
      setFolderTree(tree);

      // Flatten tree for easy access
      const flatFolders = flattenTree(tree);
      setFolders(flatFolders);

      console.log('✅ Loaded folders:', flatFolders.length);
    } catch (err: any) {
      console.error('❌ Failed to load folders:', err);
      setError(err.message || 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Create new folder
  const createFolder = useCallback(async (data: CreateFolderData): Promise<Folder> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      const folder = await folderService.createFolder(currentWorkspace.id, data);
      
      // Reload folders to get updated tree
      await loadFolders();
      
      console.log('✅ Folder created:', folder.name);
      return folder;
    } catch (err) {
      console.error('❌ Failed to create folder:', err);
      throw err;
    }
  }, [currentWorkspace?.id, loadFolders]);

  // Update folder
  const updateFolder = useCallback(async (folderId: string, data: UpdateFolderData): Promise<void> => {
    if (!currentWorkspace) return;

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
      
      console.log('✅ Folder updated:', folderId);
    } catch (err) {
      console.error('❌ Failed to update folder:', err);
      throw err;
    }
  }, [currentWorkspace?.id, loadFolders]);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string, cascade: boolean = false): Promise<void> => {
    if (!currentWorkspace) return;

    try {
      await folderService.deleteFolder(folderId, currentWorkspace.id, cascade);
      
      // Remove from local state
      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // Reload tree
      await loadFolders();
      
      console.log('✅ Folder deleted:', folderId);
    } catch (err) {
      console.error('❌ Failed to delete folder:', err);
      throw err;
    }
  }, [currentWorkspace?.id, loadFolders]);

  // Move folder
  const moveFolder = useCallback(async (folderId: string, parentId: string | null, position?: number): Promise<void> => {
    if (!currentWorkspace) return;

    try {
      await folderService.moveFolder(folderId, currentWorkspace.id, { parent_id: parentId, position });
      
      // Reload tree
      await loadFolders();
      
      console.log('✅ Folder moved:', folderId);
    } catch (err) {
      console.error('❌ Failed to move folder:', err);
      throw err;
    }
  }, [currentWorkspace?.id, loadFolders]);

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


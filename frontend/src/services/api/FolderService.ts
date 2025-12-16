/**
 * Folder Service
 * API client for folder operations
 */

import { apiClient } from './ApiClient';

export interface Folder {
  id: string;
  workspace_id: string;
  created_by_id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  color: string | null;
  position: number;
  is_expanded: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FolderTree extends Folder {
  children: FolderTree[];
  document_count: number;
}

export interface CreateFolderData {
  name: string;
  icon?: string;
  color?: string | null;
  parent_id?: string | null;
}

export interface UpdateFolderData {
  name?: string;
  icon?: string;
  color?: string | null;
  parent_id?: string | null;
  position?: number;
  is_expanded?: boolean;
}

export interface MoveFolderData {
  parent_id: string | null;
  position?: number;
}

export class FolderService {
  /**
   * Create a new folder
   */
  async createFolder(workspaceId: string, data: CreateFolderData): Promise<Folder> {
    return apiClient.post<Folder>(`/api/v1/folders?workspace_id=${workspaceId}`, data);
  }

  /**
   * List folders in workspace (optionally filtered by parent)
   */
  async listFolders(workspaceId: string, parentId?: string | null): Promise<Folder[]> {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (parentId !== undefined) {
      params.append('parent_id', parentId || '');
    }
    return apiClient.get<Folder[]>(`/api/v1/folders/workspace/${workspaceId}?${params}`);
  }

  /**
   * Get folder tree (nested hierarchy)
   * Builds tree from flat list on frontend (better performance)
   */
  async getFolderTree(workspaceId: string): Promise<FolderTree[]> {
    // Get flat list from backend
    const response = await apiClient.get<any>(`/api/v1/folders/workspace/${workspaceId}`);
    const folders = response.items || [];
    
    // Build tree structure
    return this.buildTree(folders);
  }

  /**
   * Build tree from flat folder list
   */
  private buildTree(folders: Folder[]): FolderTree[] {
    const folderMap = new Map<string, FolderTree>();
    const rootFolders: FolderTree[] = [];

    // First pass: Create all nodes
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        document_count: 0
      });
    });

    // Second pass: Build hierarchy
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      
      if (folder.parent_id === null) {
        // Root folder
        rootFolders.push(node);
      } else {
        // Child folder
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootFolders.push(node);
        }
      }
    });

    // Sort by position
    const sortByPosition = (a: FolderTree, b: FolderTree) => a.position - b.position;
    rootFolders.sort(sortByPosition);
    rootFolders.forEach(folder => {
      folder.children.sort(sortByPosition);
    });

    return rootFolders;
  }

  /**
   * Get folder by ID
   */
  async getFolder(folderId: string, workspaceId: string): Promise<Folder> {
    return apiClient.get<Folder>(`/api/v1/folders/${folderId}?workspace_id=${workspaceId}`);
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, workspaceId: string, data: UpdateFolderData): Promise<Folder> {
    return apiClient.patch<Folder>(`/api/v1/folders/${folderId}?workspace_id=${workspaceId}`, data);
  }

  /**
   * Move folder to new parent
   */
  async moveFolder(folderId: string, workspaceId: string, data: MoveFolderData): Promise<Folder> {
    return apiClient.post<Folder>(`/api/v1/folders/${folderId}/move?workspace_id=${workspaceId}`, data);
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string, workspaceId: string, cascade: boolean = false): Promise<void> {
    return apiClient.delete(`/api/v1/folders/${folderId}?workspace_id=${workspaceId}&cascade=${cascade}`);
  }
}

export const folderService = new FolderService();


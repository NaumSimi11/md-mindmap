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

class FolderService {
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
   */
  async getFolderTree(workspaceId: string): Promise<FolderTree[]> {
    return apiClient.get<FolderTree[]>(`/api/v1/folders/workspace/${workspaceId}/tree`);
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


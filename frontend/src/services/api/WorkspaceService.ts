/**
 * Workspace Service
 * Handles workspace management operations
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Workspace, WorkspaceCreate, WorkspaceMember } from '@/types/api.types';

export class WorkspaceService {
  /**
   * Get all workspaces for current user
   */
  async listWorkspaces(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>(API_ENDPOINTS.workspaces.list);
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: WorkspaceCreate): Promise<Workspace> {
    return apiClient.post<Workspace>(API_ENDPOINTS.workspaces.create, data);
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace> {
    return apiClient.get<Workspace>(API_ENDPOINTS.workspaces.get(id));
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, data: Partial<WorkspaceCreate>): Promise<Workspace> {
    return apiClient.put<Workspace>(API_ENDPOINTS.workspaces.update(id), data);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.workspaces.delete(id));
  }

  /**
   * Get workspace members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return apiClient.get<WorkspaceMember[]>(API_ENDPOINTS.workspaces.members(workspaceId));
  }

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, email: string, role: string = 'member'): Promise<WorkspaceMember> {
    return apiClient.post<WorkspaceMember>(API_ENDPOINTS.workspaces.members(workspaceId), {
      email,
      role,
    });
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();
export default workspaceService;


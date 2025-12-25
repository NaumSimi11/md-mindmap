/**
 * Workspace Members API Client
 * ============================
 * 
 * Handles workspace membership operations:
 * - Add/remove members
 * - Change member roles
 * - Transfer ownership
 * - List members
 * - Get user's workspaces
 */

import { apiClient } from './ApiClient';
import { authService } from './AuthService';

// ============================================================================
// Types
// ============================================================================

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  email?: string;
  username?: string;
  full_name?: string;
  role: WorkspaceRole;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserWorkspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  owner_id: string;
  role: WorkspaceRole;
  member_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface AddMemberRequest {
  user_id: string;
  role: Exclude<WorkspaceRole, 'owner'>;  // Cannot grant owner via add
  expires_at?: string;
}

export interface ChangeMemberRoleRequest {
  role: Exclude<WorkspaceRole, 'owner'>;  // Cannot promote to owner
}

export interface TransferOwnershipRequest {
  new_owner_id: string;
  demote_current_owner_to?: WorkspaceRole;
}

// ============================================================================
// API Client
// ============================================================================

export const WorkspaceMembersClient = {
  /**
   * Resolve workspace ID (local → cloud UUID mapping)
   * 
   * Local workspace IDs are like "ws_<timestamp>_<random>" (not UUIDs!)
   * Cloud workspace IDs are UUIDs.
   * 
   * This method:
   * 1. If ID is already a UUID → return as-is
   * 2. If ID starts with "ws_" → look up cloud ID from mapping
   * 3. If no mapping found → throw error (workspace not synced)
   */
  async resolveWorkspaceId(workspaceId: string): Promise<string> {
    // Check if already a UUID (no ws_ prefix)
    if (!workspaceId.startsWith('ws_')) {
      return workspaceId;
    }

    // Local workspace ID → need to resolve to cloud ID
    const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
    const cloudId = await selectiveSyncService.getCloudWorkspaceId(workspaceId);
    
    if (!cloudId) {
      throw new Error(`Workspace ${workspaceId} is not synced to cloud. Please push workspace first.`);
    }
    
    return cloudId;
  },

  /**
   * Add a member to a workspace
   * 
   * Permission: Admin or Owner
   */
  async addMember(workspaceId: string, request: AddMemberRequest): Promise<WorkspaceMember> {
    // 🔥 BUG FIX #11: Resolve workspace ID
    const resolvedId = await this.resolveWorkspaceId(workspaceId);
    return apiClient.post(`/api/v1/workspaces/${resolvedId}/members`, request);
  },

  /**
   * List all members of a workspace
   * 
   * Permission: Any member (viewer+)
   */
  async listMembers(workspaceId: string): Promise<{
    data: WorkspaceMember[];
    total: number;
    workspace_id: string;
  }> {
    // 🔥 BUG FIX #11: Resolve local workspace ID to cloud ID
    // Local workspace IDs are like "ws_1766647644416_mb1c9uyp9" (not UUIDs!)
    // We need to look up the cloud UUID from the mapping
    const resolvedId = await this.resolveWorkspaceId(workspaceId);
    return apiClient.get(`/api/v1/workspaces/${resolvedId}/members`);
  },

  /**
   * Remove a member from a workspace
   * 
   * Permission: Admin or Owner
   * Note: Cannot remove owner
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    // 🔥 BUG FIX #11: Resolve workspace ID
    const resolvedId = await this.resolveWorkspaceId(workspaceId);
    await apiClient.delete(`/api/v1/workspaces/${resolvedId}/members/${userId}`);
  },

  /**
   * Change a member's role
   * 
   * Permission: Admin or Owner
   * Note: Cannot change owner role, cannot promote to owner
   */
  async changeMemberRole(
    workspaceId: string,
    userId: string,
    request: ChangeMemberRoleRequest
  ): Promise<WorkspaceMember> {
    // 🔥 BUG FIX #11: Resolve workspace ID
    const resolvedId = await this.resolveWorkspaceId(workspaceId);
    return apiClient.patch(
      `/api/v1/workspaces/${resolvedId}/members/${userId}/role`,
      request
    );
  },

  /**
   * Transfer workspace ownership
   * 
   * Permission: Owner only
   * 
   * CRITICAL: This is an atomic operation that:
   * 1. Promotes new owner
   * 2. Demotes current owner
   * 3. Updates workspace.owner_id
   * 4. Creates audit log
   */
  async transferOwnership(
    workspaceId: string,
    request: TransferOwnershipRequest
  ): Promise<WorkspaceMember> {
    // 🔥 BUG FIX #11: Resolve workspace ID
    const resolvedId = await this.resolveWorkspaceId(workspaceId);
    return apiClient.post(`/api/v1/workspaces/${resolvedId}/transfer-ownership`, request);
  },

  /**
   * Get all workspaces the current user is a member of
   * 
   * Returns workspaces where user has any role (owner/admin/editor/viewer)
   */
  async getUserWorkspaces(): Promise<{
    data: UserWorkspace[];
    total: number;
  }> {
    // In guest/offline mode there's no "current user" on the backend.
    // Avoid hitting the API at all and just return an empty list.
    if (!authService.isAuthenticated()) {
      console.log('📴 [WorkspaceMembersClient] getUserWorkspaces called while not authenticated; returning empty list');
      return { data: [], total: 0 };
    }
    
    return apiClient.get('/api/v1/users/me/workspaces');
  },
};


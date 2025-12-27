/**
 * Workspace Members Hook
 * ======================
 * 
 * React hook for workspace membership operations.
 * 
 * Features:
 * - List workspace members
 * - Add/remove members
 * - Change member roles
 * - Transfer ownership
 * - Real-time updates via React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkspaceMembersClient, type WorkspaceMember, type AddMemberRequest, type ChangeMemberRoleRequest, type TransferOwnershipRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

function getApiErrorMessage(error: any): string {
  // ApiClient throws { message, status, details }
  if (error?.message && typeof error.message === 'string') return error.message;
  const detail = error?.details?.detail;
  if (typeof detail === 'string') return detail;
  if (typeof detail?.message === 'string') return detail.message;
  return 'Request failed';
}

// ============================================================================
// Query Keys
// ============================================================================

export const workspaceMembersKeys = {
  all: ['workspace-members'] as const,
  workspace: (workspaceId: string) => [...workspaceMembersKeys.all, workspaceId] as const,
  userWorkspaces: () => ['user-workspaces'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Check if workspace ID is a local-only ID (not synced to cloud)
 * Local IDs use format: ws_<timestamp>_<random>
 * Cloud IDs are UUIDs: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function isLocalOnlyWorkspace(workspaceId: string | undefined): boolean {
  if (!workspaceId) return true;
  
  // Check if it's a UUID (cloud workspace)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(workspaceId)) return false;
  
  // Check if it has ws_ prefix with UUID suffix (cloud workspace with local prefix)
  if (workspaceId.startsWith('ws_')) {
    const suffix = workspaceId.slice(3);
    if (uuidRegex.test(suffix)) return false;
  }
  
  // Otherwise it's a local-only workspace (timestamp-based ID)
  return true;
}

/**
 * List workspace members
 * 
 * NOTE: Only works for cloud-synced workspaces. Local-only workspaces
 * don't have members (single user).
 */
export function useWorkspaceMembers(workspaceId: string | undefined) {
  // 🔥 BUG FIX: Skip API call for local-only workspaces
  // Local workspaces (ws_<timestamp>_<random>) aren't synced to cloud
  // and calling listMembers on them causes 422 errors
  const isLocalOnly = isLocalOnlyWorkspace(workspaceId);
  
  return useQuery({
    queryKey: workspaceId ? workspaceMembersKeys.workspace(workspaceId) : [],
    queryFn: async () => {
      if (!workspaceId || isLocalOnly) return null;
      try {
        return await WorkspaceMembersClient.listMembers(workspaceId);
      } catch (error: any) {
        // Gracefully handle "not synced" errors
        if (error.message?.includes('not synced')) {
          console.log(`⚠️ Workspace ${workspaceId} not synced, skipping members fetch`);
          return null;
        }
        throw error;
      }
    },
    enabled: !!workspaceId && !isLocalOnly,
  });
}

/**
 * Get user's workspaces (with role context)
 */
export function useUserWorkspaces() {
  return useQuery({
    queryKey: workspaceMembersKeys.userWorkspaces(),
    queryFn: () => WorkspaceMembersClient.getUserWorkspaces(),
  });
}

/**
 * Add a member to workspace
 */
export function useAddWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: AddMemberRequest) =>
      WorkspaceMembersClient.addMember(workspaceId, request),
    onSuccess: () => {
      // Invalidate workspace members list
      queryClient.invalidateQueries({ queryKey: workspaceMembersKeys.workspace(workspaceId) });
      
      toast({
        title: 'Member added',
        description: 'The user has been added to the workspace.',
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error) || 'Failed to add member';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove a member from workspace
 */
export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) =>
      WorkspaceMembersClient.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceMembersKeys.workspace(workspaceId) });
      
      toast({
        title: 'Member removed',
        description: 'The user has been removed from the workspace.',
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error) || 'Failed to remove member';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Change a member's role
 */
export function useChangeMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: ChangeMemberRoleRequest }) =>
      WorkspaceMembersClient.changeMemberRole(workspaceId, userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceMembersKeys.workspace(workspaceId) });
      
      toast({
        title: 'Role updated',
        description: 'The member\'s role has been changed.',
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error) || 'Failed to change role';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Transfer workspace ownership
 * 
 * CRITICAL: This is an atomic operation
 */
export function useTransferOwnership(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: TransferOwnershipRequest) =>
      WorkspaceMembersClient.transferOwnership(workspaceId, request),
    onSuccess: () => {
      // Invalidate workspace members
      queryClient.invalidateQueries({ queryKey: workspaceMembersKeys.workspace(workspaceId) });
      
      // Invalidate user's workspaces (role changed)
      queryClient.invalidateQueries({ queryKey: workspaceMembersKeys.userWorkspaces() });
      
      toast({
        title: 'Ownership transferred',
        description: 'Workspace ownership has been transferred successfully.',
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error) || 'Failed to transfer ownership';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });
}


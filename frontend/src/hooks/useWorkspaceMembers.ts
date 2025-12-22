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
 * List workspace members
 */
export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? workspaceMembersKeys.workspace(workspaceId) : [],
    queryFn: () => workspaceId ? WorkspaceMembersClient.listMembers(workspaceId) : null,
    enabled: !!workspaceId,
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


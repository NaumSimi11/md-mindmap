/**
 * Workspace Permissions Hook
 * ===========================
 * 
 * Determines user's capabilities in a workspace based on their role.
 * 
 * Role Hierarchy: owner > admin > editor > viewer
 */

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceMembers } from './useWorkspaceMembers';
import type { WorkspaceRole } from '@/services/api';

// ============================================================================
// Types
// ============================================================================

export interface WorkspacePermissions {
  // Role info
  role: WorkspaceRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isMember: boolean;
  
  // Capabilities
  canManageMembers: boolean;      // Admin or Owner
  canRemoveMembers: boolean;      // Admin or Owner
  canChangeRoles: boolean;        // Admin or Owner
  canTransferOwnership: boolean;  // Owner only
  canCreateDocuments: boolean;    // Editor, Admin, or Owner
  canDeleteWorkspace: boolean;    // Owner only
  canEditWorkspace: boolean;      // Admin or Owner
  
  // Loading state
  isLoading: boolean;
}

// ============================================================================
// Role Hierarchy
// ============================================================================

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

function getRoleLevel(role: WorkspaceRole | null): number {
  return role ? ROLE_HIERARCHY[role] : 0;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Get user's permissions in a workspace
 * 
 * Returns capabilities based on user's role
 */
export function useWorkspacePermissions(workspaceId: string | undefined): WorkspacePermissions {
  const { user } = useAuth();
  const { data: membersData, isLoading } = useWorkspaceMembers(workspaceId);

  const permissions = useMemo(() => {
    // If loading or no data, return default (no permissions)
    if (isLoading || !membersData || !user) {
      return {
        role: null,
        isOwner: false,
        isAdmin: false,
        isEditor: false,
        isViewer: false,
        isMember: false,
        canManageMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canTransferOwnership: false,
        canCreateDocuments: false,
        canDeleteWorkspace: false,
        canEditWorkspace: false,
        isLoading,
      };
    }

    // Find user's membership
    const membership = membersData.data.find(m => m.user_id === user.id);
    const role = membership?.role || null;
    const roleLevel = getRoleLevel(role);

    // Determine capabilities
    return {
      role,
      isOwner: role === 'owner',
      isAdmin: role === 'admin',
      isEditor: role === 'editor',
      isViewer: role === 'viewer',
      isMember: !!role,
      
      // Capabilities (based on role level)
      canManageMembers: roleLevel >= ROLE_HIERARCHY.admin,
      canRemoveMembers: roleLevel >= ROLE_HIERARCHY.admin,
      canChangeRoles: roleLevel >= ROLE_HIERARCHY.admin,
      canTransferOwnership: role === 'owner',
      canCreateDocuments: roleLevel >= ROLE_HIERARCHY.editor,
      canDeleteWorkspace: role === 'owner',
      canEditWorkspace: roleLevel >= ROLE_HIERARCHY.admin,
      
      isLoading: false,
    };
  }, [membersData, user, isLoading]);

  return permissions;
}

/**
 * Get role display information
 */
export function getRoleInfo(role: WorkspaceRole) {
  const roleInfo = {
    owner: {
      label: 'Owner',
      icon: '👑',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      description: 'Full control over workspace',
    },
    admin: {
      label: 'Admin',
      icon: '🛡️',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Can manage members and settings',
    },
    editor: {
      label: 'Editor',
      icon: '✏️',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Can create and edit documents',
    },
    viewer: {
      label: 'Viewer',
      icon: '👁️',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      description: 'Can view documents',
    },
  };

  return roleInfo[role];
}


/**
 * Document Permissions Hook
 * ==========================
 * 
 * UX-only permission guards based on user role.
 * Backend is authoritative - these are UI hints only.
 * 
 * Role hierarchy (must match backend exactly):
 * owner > admin > editor > commenter > viewer
 */

import { useMemo } from 'react';

export type Role = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer';

export interface DocumentPermissions {
  role: Role | null;
  
  // View permissions
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  
  // Sharing permissions
  canManageMembers: boolean;
  canCreateLinks: boolean;
  
  // Versioning permissions
  canRestoreAsNew: boolean;
  canOverwriteRestore: boolean;
  
  // Ownership permissions
  canTransferOwnership: boolean;
  
  // Role checks
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isCommenter: boolean;
  isViewer: boolean;
  isGuest: boolean;
}

/**
 * Get document permissions for user role
 * 
 * UX-only - backend will still validate all actions
 * 
 * @param userRole - User's role for document (or null)
 * @param isAuthenticated - Whether user is authenticated
 * @returns Permission flags for UI
 */
export function useDocumentPermissions(
  userRole: Role | null,
  isAuthenticated: boolean = false
): DocumentPermissions {
  return useMemo(() => {
    if (!userRole) {
      return {
        role: null,
        canView: false,
        canComment: false,
        canEdit: false,
        canManageMembers: false,
        canCreateLinks: false,
        canRestoreAsNew: false,
        canOverwriteRestore: false,
        canTransferOwnership: false,
        isOwner: false,
        isAdmin: false,
        isEditor: false,
        isCommenter: false,
        isViewer: false,
        isGuest: !isAuthenticated,
      };
    }

    // Role level (must match backend hierarchy)
    const roleLevel = {
      owner: 5,
      admin: 4,
      editor: 3,
      commenter: 2,
      viewer: 1,
    }[userRole] || 0;

    return {
      role: userRole,
      
      // View permissions
      canView: roleLevel >= 1,        // viewer+
      canComment: roleLevel >= 2,      // commenter+
      canEdit: roleLevel >= 3,         // editor+
      
      // Sharing permissions
      canManageMembers: roleLevel >= 4, // admin+ (invite, remove, change role)
      canCreateLinks: roleLevel >= 4,   // admin+ (create, revoke share links)
      
      // Versioning permissions
      canRestoreAsNew: roleLevel >= 3,  // editor+ (safe restore)
      canOverwriteRestore: roleLevel >= 5, // owner ONLY (destructive)
      
      // Ownership permissions
      canTransferOwnership: roleLevel >= 5, // owner ONLY
      
      // Role checks
      isOwner: userRole === 'owner',
      isAdmin: userRole === 'admin',
      isEditor: userRole === 'editor',
      isCommenter: userRole === 'commenter',
      isViewer: userRole === 'viewer',
      isGuest: !isAuthenticated,
    };
  }, [userRole, isAuthenticated]);
}


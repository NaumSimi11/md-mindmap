/**
 * Shares API Client
 * ==================
 * 
 * Client for document sharing, invitations, and share links.
 * Consumes backend APIs from Phase 3.
 * 
 * CRITICAL: Backend is authoritative for all permissions.
 */

import { apiClient } from './ApiClient';

// ============================================================================
// Types
// ============================================================================

export type Role = 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer';

export interface Member {
  id: string;
  document_id: string;
  principal_type: 'user' | 'workspace';
  principal_id: string;
  role: Role;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  status: 'active' | 'revoked';
  user_email: string | null;
  user_name: string | null;
}

export interface Invitation {
  id: string;
  document_id: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string | null;
  created_at: string;
  expires_at: string | null;
  invited_by: string;
  inviter_name: string | null;
  inviter_email: string | null;
}

export interface ShareLink {
  link_id: string;
  token: string;
  document_id: string;
  mode: 'view' | 'comment' | 'edit';
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  has_password: boolean;
}

// ============================================================================
// API Client
// ============================================================================

export class SharesClient {
  /**
   * Invite users by email
   * 
   * Permission: Owner/Admin
   * 
   * @param documentId - Document ID
   * @param emails - Email addresses to invite
   * @param role - Role to assign (admin, editor, commenter, viewer)
   * @param message - Optional invite message
   * @param send_email - Whether to send email notification (default: true)
   * @returns Created invitations
   */
  static async inviteUsers(
    documentId: string,
    emails: string[],
    role: Role,
    message?: string,
    send_email: boolean = true
  ): Promise<{ success: boolean; invited: any[]; errors: any[] }> {
    return apiClient.post(`/api/v1/documents/${documentId}/invite`, {
      emails,
      role,
      message,
      send_email,
    });
  }

  /**
   * List document members and pending invitations
   * 
   * Permission: Any role with access (viewer+)
   * 
   * @param documentId - Document ID
   * @returns Members and pending invites
   */
  static async listMembers(documentId: string): Promise<{
    members: Member[];
    pending_invites: Invitation[];
  }> {
    // Backend expects bare UUID, not prefixed ids like "doc_<uuid>"
    const { extractUuid } = await import('@/utils/identity');
    const canonicalId = extractUuid(documentId);
    return apiClient.get(`/api/v1/documents/${canonicalId}/members`);
  }

  /**
   * Accept invitation
   * 
   * Permission: Authenticated user with matching email
   * 
   * @param token - Invitation token
   * @returns Success response
   */
  static async acceptInvitation(token: string): Promise<{
    success: boolean;
    document_id: string;
    role: Role;
    message: string;
  }> {
    return apiClient.post(`/api/v1/invitations/${token}/accept`, {});
  }

  /**
   * Decline invitation
   * 
   * Permission: Authenticated user with matching email
   * 
   * @param token - Invitation token
   * @returns Success response
   */
  static async declineInvitation(token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.post(`/api/v1/invitations/${token}/decline`, {});
  }

  /**
   * Remove member from document
   * 
   * Permission: Owner/Admin (cannot remove owner)
   * 
   * @param documentId - Document ID
   * @param memberId - Member ID to remove
   * @returns Success response
   */
  static async removeMember(
    documentId: string,
    memberId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/v1/documents/${documentId}/members/${memberId}`);
  }

  /**
   * Change member role
   * 
   * Permission: Owner/Admin (only owner can promote to owner)
   * 
   * @param documentId - Document ID
   * @param memberId - Member ID
   * @param role - New role
   * @returns Success response
   */
  static async changeMemberRole(
    documentId: string,
    memberId: string,
    role: Role
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/v1/documents/${documentId}/members/${memberId}/role`, { role });
  }

  /**
   * Transfer document ownership
   * 
   * Permission: Owner only
   * 
   * @param documentId - Document ID
   * @param newOwnerId - New owner user ID
   * @returns Success response
   */
  static async transferOwnership(
    documentId: string,
    newOwnerId: string
  ): Promise<{
    success: boolean;
    new_owner_id: string;
    message: string;
  }> {
    return apiClient.post(`/api/v1/documents/${documentId}/transfer-ownership`, { new_owner_id: newOwnerId });
  }

  /**
   * Create share link
   * 
   * Permission: Owner/Admin
   * 
   * @param documentId - Document ID
   * @param mode - Access mode (view, comment, edit)
   * @param expires_at - Optional expiration timestamp
   * @param max_uses - Optional maximum uses
   * @param password - Optional password
   * @returns Created share link
   */
  static async createShareLink(
    documentId: string,
    mode: 'view' | 'comment' | 'edit',
    expires_at?: string | null,
    max_uses?: number | null,
    password?: string | null
  ): Promise<ShareLink> {
    return apiClient.post(`/api/v1/documents/${documentId}/share-links`, {
      mode,
      expires_at,
      max_uses,
      password,
    });
  }

  /**
   * List share links
   * 
   * Permission: Any role with access (viewer+)
   * 
   * @param documentId - Document ID
   * @returns Share links
   */
  static async listShareLinks(documentId: string): Promise<{
    links: ShareLink[];
  }> {
    return apiClient.get(`/api/v1/documents/${documentId}/share-links`);
  }

  /**
   * Revoke share link
   * 
   * Permission: Owner/Admin
   * 
   * @param documentId - Document ID
   * @param linkId - Link ID to revoke
   * @returns Success response
   */
  static async revokeShareLink(
    documentId: string,
    linkId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/v1/documents/${documentId}/share-links/${linkId}`);
  }

  /**
   * Validate share link (PUBLIC - no auth required)
   * 
   * @param token - Share link token
   * @param password - Optional password
   * @returns Validation result
   */
  static async validateShareLink(
    token: string,
    password?: string | null
  ): Promise<{
    valid: boolean;
    document_id: string | null;
    mode: 'view' | 'comment' | 'edit' | null;
    reason: string | null;
  }> {
    try {
      return await apiClient.post(`/api/v1/share/validate`, { token, password });
    } catch (err: any) {
      return {
        valid: false,
        document_id: null,
        mode: null,
        reason: err?.message || 'network_error',
      };
    }
  }
}


/**
 * API Contract Schemas
 * 
 * These Zod schemas define the exact shape of API responses.
 * If the backend changes its response format, tests will fail immediately.
 * 
 * IMPORTANT: These schemas are the source of truth for API contracts.
 * Update them when the backend API changes intentionally.
 */

import { z } from 'zod';

// ============================================================================
// AUTH CONTRACTS
// ============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(1),
  full_name: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
  is_superuser: z.boolean(),
  email_verified_at: z.string().datetime().optional().nullable(),
  last_login_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AuthResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.literal('bearer'),
  // User may or may not be included in response
  user: UserSchema.optional(),
});

export const TokenRefreshResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.literal('bearer'),
});

// ============================================================================
// WORKSPACE CONTRACTS
// ============================================================================

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  slug: z.string().min(1),
  owner_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean().optional(),
});

export const WorkspaceListResponseSchema = z.object({
  data: z.array(WorkspaceSchema),
  total: z.number().int().nonnegative(),
});

export const WorkspaceMemberSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  user: UserSchema.optional(),
  joined_at: z.string().datetime(),
});

export const WorkspaceMembersListResponseSchema = z.object({
  data: z.array(WorkspaceMemberSchema),
  total: z.number().int().nonnegative(),
  workspace_id: z.string().uuid(),
});

// ============================================================================
// FOLDER CONTRACTS
// ============================================================================

export const FolderSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1),
  parent_id: z.string().uuid().optional().nullable(),
  position: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean().optional(),
});

export const FolderListResponseSchema = z.object({
  data: z.array(FolderSchema),
  total: z.number().int().nonnegative(),
});

// ============================================================================
// DOCUMENT CONTRACTS
// ============================================================================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  folder_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  content: z.string(),
  content_type: z.enum(['markdown', 'text', 'json']),
  version: z.number().int().positive(),
  yjs_version: z.number().int().nonnegative().optional().nullable(),
  yjs_state_b64: z.string().optional().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean(),
});

export const DocumentListItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  folder_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  content_type: z.enum(['markdown', 'text', 'json']),
  version: z.number().int().positive(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean(),
  // content and yjs_state_b64 may be omitted in list view
});

export const DocumentListResponseSchema = z.object({
  data: z.array(DocumentListItemSchema),
  total: z.number().int().nonnegative(),
});

// ============================================================================
// SNAPSHOT CONTRACTS
// ============================================================================

export const SnapshotSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  version: z.number().int().positive(),
  content: z.string().optional(),
  yjs_state_b64: z.string().optional().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const SnapshotListResponseSchema = z.object({
  data: z.array(SnapshotSchema),
  total: z.number().int().nonnegative(),
});

// ============================================================================
// SHARE CONTRACTS
// ============================================================================

export const ShareSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  shared_with_user_id: z.string().uuid().optional().nullable(),
  shared_with_email: z.string().email().optional().nullable(),
  permission: z.enum(['view', 'comment', 'edit']),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional().nullable(),
});

export const ShareLinkSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  token: z.string().min(1),
  permission: z.enum(['view', 'comment', 'edit']),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
  use_count: z.number().int().nonnegative(),
  is_active: z.boolean(),
});

// ============================================================================
// ERROR CONTRACTS
// ============================================================================

export const ValidationErrorSchema = z.object({
  detail: z.array(z.object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
  })),
});

export const ApiErrorSchema = z.object({
  detail: z.string(),
});

// ============================================================================
// HELPER TYPES (inferred from schemas)
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentListItem = z.infer<typeof DocumentListItemSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type Share = z.infer<typeof ShareSchema>;
export type ShareLink = z.infer<typeof ShareLinkSchema>;


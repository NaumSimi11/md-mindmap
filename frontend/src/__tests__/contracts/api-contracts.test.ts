/**
 * API Contract Tests
 * 
 * These tests verify that API responses match the expected schema.
 * They use mock data that mirrors real backend responses.
 * 
 * Purpose:
 * - Catch breaking API changes early
 * - Document expected response formats
 * - Ensure frontend types match backend responses
 * 
 * Run with: npm run test -- src/__tests__/contracts/api-contracts.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  UserSchema,
  AuthResponseSchema,
  WorkspaceSchema,
  WorkspaceListResponseSchema,
  WorkspaceMemberSchema,
  WorkspaceMembersListResponseSchema,
  FolderSchema,
  FolderListResponseSchema,
  DocumentSchema,
  DocumentListItemSchema,
  DocumentListResponseSchema,
  SnapshotSchema,
  ShareSchema,
  ShareLinkSchema,
  ValidationErrorSchema,
  ApiErrorSchema,
} from './api-contracts';

// ============================================================================
// MOCK DATA (Based on real backend responses)
// ============================================================================

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  bio: null,
  avatar_url: null,
  is_active: true,
  is_verified: true,
  is_superuser: false,
  email_verified_at: null,
  last_login_at: '2025-12-27T10:00:00.000Z',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-12-27T10:00:00.000Z',
};

const mockAuthResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
  refresh_token: 'refresh_token_example_123',
  token_type: 'bearer',
  user: mockUser,
};

const mockWorkspace = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  name: 'My Workspace',
  description: 'A test workspace',
  slug: 'my-workspace',
  owner_id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-12-27T10:00:00.000Z',
  is_deleted: false,
};

const mockWorkspaceMember = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  workspace_id: '660e8400-e29b-41d4-a716-446655440001',
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  role: 'owner' as const,
  user: mockUser,
  joined_at: '2025-01-01T00:00:00.000Z',
};

const mockFolder = {
  id: '880e8400-e29b-41d4-a716-446655440003',
  workspace_id: '660e8400-e29b-41d4-a716-446655440001',
  name: 'Getting Started',
  parent_id: null,
  position: 0,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  is_deleted: false,
};

const mockDocument = {
  id: '990e8400-e29b-41d4-a716-446655440004',
  workspace_id: '660e8400-e29b-41d4-a716-446655440001',
  folder_id: '880e8400-e29b-41d4-a716-446655440003',
  title: 'Welcome Document',
  content: '# Welcome\n\nThis is your first document.',
  content_type: 'markdown' as const,
  version: 1,
  yjs_version: 0,
  yjs_state_b64: null,
  created_by: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  is_deleted: false,
};

const mockDocumentListItem = {
  id: '990e8400-e29b-41d4-a716-446655440004',
  workspace_id: '660e8400-e29b-41d4-a716-446655440001',
  folder_id: '880e8400-e29b-41d4-a716-446655440003',
  title: 'Welcome Document',
  content_type: 'markdown' as const,
  version: 1,
  created_by: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  is_deleted: false,
};

const mockSnapshot = {
  id: 'aa0e8400-e29b-41d4-a716-446655440005',
  document_id: '990e8400-e29b-41d4-a716-446655440004',
  version: 1,
  content: '# Welcome\n\nThis is your first document.',
  yjs_state_b64: 'AAA=',
  created_by: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  title: 'Initial version',
  description: null,
};

const mockShare = {
  id: 'bb0e8400-e29b-41d4-a716-446655440006',
  document_id: '990e8400-e29b-41d4-a716-446655440004',
  shared_with_user_id: null,
  shared_with_email: 'friend@example.com',
  permission: 'view' as const,
  created_by: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  expires_at: null,
};

const mockShareLink = {
  id: 'cc0e8400-e29b-41d4-a716-446655440007',
  document_id: '990e8400-e29b-41d4-a716-446655440004',
  token: 'abc123xyz789',
  permission: 'view' as const,
  created_by: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2025-01-01T00:00:00.000Z',
  expires_at: null,
  max_uses: null,
  use_count: 0,
  is_active: true,
};

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('API Contract Tests', () => {
  describe('Auth Contracts', () => {
    it('UserSchema validates correct user response', () => {
      const result = UserSchema.safeParse(mockUser);
      expect(result.success).toBe(true);
    });

    it('UserSchema rejects invalid user (missing required field)', () => {
      const invalidUser = { ...mockUser, id: undefined };
      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('UserSchema rejects invalid UUID', () => {
      const invalidUser = { ...mockUser, id: 'not-a-uuid' };
      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('AuthResponseSchema validates login response', () => {
      const result = AuthResponseSchema.safeParse(mockAuthResponse);
      expect(result.success).toBe(true);
    });

    it('AuthResponseSchema allows missing user (login returns tokens only)', () => {
      const responseWithoutUser = {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
      };
      const result = AuthResponseSchema.safeParse(responseWithoutUser);
      expect(result.success).toBe(true);
    });
  });

  describe('Workspace Contracts', () => {
    it('WorkspaceSchema validates workspace response', () => {
      const result = WorkspaceSchema.safeParse(mockWorkspace);
      expect(result.success).toBe(true);
    });

    it('WorkspaceListResponseSchema validates list response', () => {
      const listResponse = {
        data: [mockWorkspace],
        total: 1,
      };
      const result = WorkspaceListResponseSchema.safeParse(listResponse);
      expect(result.success).toBe(true);
    });

    it('WorkspaceMemberSchema validates member response', () => {
      const result = WorkspaceMemberSchema.safeParse(mockWorkspaceMember);
      expect(result.success).toBe(true);
    });

    it('WorkspaceMembersListResponseSchema validates members list', () => {
      const listResponse = {
        data: [mockWorkspaceMember],
        total: 1,
        workspace_id: mockWorkspace.id,
      };
      const result = WorkspaceMembersListResponseSchema.safeParse(listResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Folder Contracts', () => {
    it('FolderSchema validates folder response', () => {
      const result = FolderSchema.safeParse(mockFolder);
      expect(result.success).toBe(true);
    });

    it('FolderSchema allows nested folders (parent_id set)', () => {
      const nestedFolder = {
        ...mockFolder,
        id: 'dd0e8400-e29b-41d4-a716-446655440008',
        parent_id: mockFolder.id,
        name: 'Nested Folder',
      };
      const result = FolderSchema.safeParse(nestedFolder);
      expect(result.success).toBe(true);
    });

    it('FolderListResponseSchema validates list response', () => {
      const listResponse = {
        data: [mockFolder],
        total: 1,
      };
      const result = FolderListResponseSchema.safeParse(listResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Document Contracts', () => {
    it('DocumentSchema validates full document response', () => {
      const result = DocumentSchema.safeParse(mockDocument);
      expect(result.success).toBe(true);
    });

    it('DocumentSchema validates document with yjs_state_b64', () => {
      const docWithYjs = {
        ...mockDocument,
        yjs_state_b64: 'AAECAwQ=', // Base64 encoded Yjs state
        yjs_version: 5,
      };
      const result = DocumentSchema.safeParse(docWithYjs);
      expect(result.success).toBe(true);
    });

    it('DocumentListItemSchema validates list item (no content)', () => {
      const result = DocumentListItemSchema.safeParse(mockDocumentListItem);
      expect(result.success).toBe(true);
    });

    it('DocumentListResponseSchema validates list response', () => {
      const listResponse = {
        data: [mockDocumentListItem],
        total: 1,
      };
      const result = DocumentListResponseSchema.safeParse(listResponse);
      expect(result.success).toBe(true);
    });

    it('DocumentSchema rejects invalid content_type', () => {
      const invalidDoc = { ...mockDocument, content_type: 'html' };
      const result = DocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });
  });

  describe('Snapshot Contracts', () => {
    it('SnapshotSchema validates snapshot response', () => {
      const result = SnapshotSchema.safeParse(mockSnapshot);
      expect(result.success).toBe(true);
    });

    it('SnapshotSchema allows minimal snapshot (no content)', () => {
      const minimalSnapshot = {
        id: mockSnapshot.id,
        document_id: mockSnapshot.document_id,
        version: 1,
        created_by: mockSnapshot.created_by,
        created_at: mockSnapshot.created_at,
      };
      const result = SnapshotSchema.safeParse(minimalSnapshot);
      expect(result.success).toBe(true);
    });
  });

  describe('Share Contracts', () => {
    it('ShareSchema validates share response', () => {
      const result = ShareSchema.safeParse(mockShare);
      expect(result.success).toBe(true);
    });

    it('ShareSchema validates share with user_id', () => {
      const shareWithUser = {
        ...mockShare,
        shared_with_user_id: mockUser.id,
        shared_with_email: null,
      };
      const result = ShareSchema.safeParse(shareWithUser);
      expect(result.success).toBe(true);
    });

    it('ShareLinkSchema validates share link response', () => {
      const result = ShareLinkSchema.safeParse(mockShareLink);
      expect(result.success).toBe(true);
    });

    it('ShareLinkSchema validates link with expiry and max_uses', () => {
      const limitedLink = {
        ...mockShareLink,
        expires_at: '2025-12-31T23:59:59.000Z',
        max_uses: 10,
        use_count: 3,
      };
      const result = ShareLinkSchema.safeParse(limitedLink);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Contracts', () => {
    it('ValidationErrorSchema validates 422 response', () => {
      const validationError = {
        detail: [
          {
            loc: ['body', 'email'],
            msg: 'field required',
            type: 'value_error.missing',
          },
        ],
      };
      const result = ValidationErrorSchema.safeParse(validationError);
      expect(result.success).toBe(true);
    });

    it('ApiErrorSchema validates generic error response', () => {
      const apiError = {
        detail: 'Not found',
      };
      const result = ApiErrorSchema.safeParse(apiError);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty arrays in list responses', () => {
      const emptyList = { data: [], total: 0 };
      expect(DocumentListResponseSchema.safeParse(emptyList).success).toBe(true);
      expect(WorkspaceListResponseSchema.safeParse(emptyList).success).toBe(true);
      expect(FolderListResponseSchema.safeParse(emptyList).success).toBe(true);
    });

    it('handles null optional fields correctly', () => {
      const userWithNulls = {
        ...mockUser,
        full_name: null,
        bio: null,
        avatar_url: null,
        email_verified_at: null,
        last_login_at: null,
      };
      const result = UserSchema.safeParse(userWithNulls);
      expect(result.success).toBe(true);
    });

    it('rejects negative version numbers', () => {
      const invalidDoc = { ...mockDocument, version: -1 };
      const result = DocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });

    it('rejects empty title', () => {
      const invalidDoc = { ...mockDocument, title: '' };
      const result = DocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });
  });
});


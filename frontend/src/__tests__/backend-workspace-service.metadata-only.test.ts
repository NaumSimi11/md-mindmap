import { describe, it, expect, vi } from 'vitest';

// NOTE: vi.mock() factories are hoisted; use vi.hoisted() for shared fns.
const updateDocumentMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/api', () => ({
  workspaceService: {
    listWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
  },
  documentService: {
    updateDocument: updateDocumentMock,
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
    autoSave: vi.fn(),
  },
  authService: {
    isAuthenticated: vi.fn(() => true),
  },
}));

import { backendWorkspaceService } from '@/services/workspace-legacy/BackendWorkspaceService';

describe('BackendWorkspaceService.updateDocument (metadata-only)', () => {
  it('should NOT send content in updateDocument payload', async () => {
    updateDocumentMock.mockResolvedValue({
      id: 'doc-1',
      workspace_id: 'ws-1',
      folder_id: 'folder-1',
      title: 'New Title',
      content: 'server-content',
      content_type: 'markdown',
      is_starred: true,
      tags: [],
      version: 2,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await backendWorkspaceService.updateDocument('doc-1', {
      title: 'New Title',
      folderId: 'folder-1',
      starred: true,
      // This must be ignored for REST updates
      content: 'DO NOT SEND THIS',
    } as any);

    expect(updateDocumentMock).toHaveBeenCalledTimes(1);

    const [, payload] = updateDocumentMock.mock.calls[0];
    expect(payload).toEqual({
      title: 'New Title',
      folder_id: 'folder-1',
      is_starred: true,
    });

    // Double safety check
    expect(payload).not.toHaveProperty('content');
  });
});

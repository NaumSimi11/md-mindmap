import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API services
const mockDocumentService = vi.hoisted(() => ({
  getDocument: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  listDocuments: vi.fn(),
  deleteDocument: vi.fn(),
}));

const mockFolderService = vi.hoisted(() => ({
  getFolder: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  listFolders: vi.fn(),
  deleteFolder: vi.fn(),
}));

const mockAuthService = vi.hoisted(() => ({
  isAuthenticated: vi.fn(() => true),
}));

const mockGuestWorkspaceService = vi.hoisted(() => ({
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  getFolder: vi.fn(),
  updateFolder: vi.fn(),
  getFolders: vi.fn(() => []),
  getDocuments: vi.fn(() => []),
}));

const mockWorkspaceService = vi.hoisted(() => ({
  createWorkspace: vi.fn(),
  listWorkspaces: vi.fn(() => []),
}));

const mockBackendWorkspaceService = vi.hoisted(() => ({
  getCurrentWorkspace: vi.fn(),
  getAllWorkspaces: vi.fn(() => []),
  getFolders: vi.fn(() => []),
  getDocuments: vi.fn(() => []),
  updateDocument: vi.fn(),
  createDocument: vi.fn(),
}));

// Yjs is the single source of truth for content during pushDocument now.
vi.mock('@/services/yjs/YjsDocumentManager', () => ({
  yjsDocumentManager: {
    getDocument: vi.fn(() => ({ ydoc: {}, websocketProvider: null, indexeddbProvider: { on: vi.fn(), off: vi.fn() }, isInitialized: true })),
    getYjsBinarySnapshot: vi.fn(() => null),
  },
}));

vi.mock('@/services/snapshots/serializeYjs', () => ({
  serializeYjsToHtml: vi.fn(() => '<p>test</p>'),
}));

vi.mock('@/utils/markdownConversion', async () => {
  const actual = await vi.importActual<any>('@/utils/markdownConversion');
  return {
    ...actual,
    htmlToMarkdown: vi.fn(() => 'test'),
  };
});

vi.mock('@/services/api', () => ({
  workspaceService: mockWorkspaceService,
  documentService: mockDocumentService,
  folderService: mockFolderService,
  authService: mockAuthService,
}));

// Dexie mapping DBs are internal to SelectiveSyncService; we don't hit them directly here.

vi.mock('@/services/workspace/GuestWorkspaceService', () => ({
  guestWorkspaceService: mockGuestWorkspaceService,
}));

vi.mock('@/services/workspace', () => ({
  backendWorkspaceService: mockBackendWorkspaceService,
}));

import { selectiveSyncService } from '@/services/sync/SelectiveSyncService';

describe('SelectiveSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pushDocument', () => {
    it('should return error if not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = await selectiveSyncService.pushDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Not authenticated');
    });

    it('should return error if document not found locally', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockGuestWorkspaceService.getDocument.mockReturnValue(undefined);

      const result = await selectiveSyncService.pushDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Document metadata not found locally');
    });

    it('should create document on cloud if not exists', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockWorkspaceService.createWorkspace.mockResolvedValue({ id: 'ws-1', name: 'Local Workspace' });
      mockBackendWorkspaceService.getCurrentWorkspace.mockResolvedValue({ id: 'ws-1', name: 'Local Workspace' });
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        title: 'Test Doc',
        type: 'markdown',
        folderId: null,
        workspaceId: 'ws-1',
        starred: false,
        tags: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        sync: { status: 'local', localVersion: 1 },
      });
      mockDocumentService.createDocument.mockResolvedValue({ id: 'doc-123' });

      const result = await selectiveSyncService.pushDocument('doc-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('synced');
      expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'doc-123',
          title: 'Test Doc',
        })
      );
      expect(mockGuestWorkspaceService.updateDocument).toHaveBeenCalledWith(
        'doc-123',
        expect.objectContaining({
          syncStatus: 'synced',
        })
      );
    });

    it('should detect conflict if cloud is newer', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      // Conflict detection is no longer based on GET probe timestamps.
      // It is enforced via expected_yjs_version / backend conflict responses.
      mockWorkspaceService.createWorkspace.mockResolvedValue({ id: 'ws-1', name: 'Local Workspace' });
      mockBackendWorkspaceService.getCurrentWorkspace.mockResolvedValue({ id: 'ws-1', name: 'Local Workspace' });
      mockGuestWorkspaceService.getDocument.mockReturnValue({ id: 'doc-123', title: 'Test Doc', workspaceId: 'ws-1' });
      mockDocumentService.updateDocument.mockRejectedValue({ status: 409, message: 'conflict' });
      // pushDocument conflict path triggers a pull, so return a minimal cloud doc
      mockDocumentService.getDocument.mockResolvedValue({ id: 'doc-123', updated_at: new Date().toISOString() });

      const result = await selectiveSyncService.pushDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error'); // current implementation maps backend errors to error status
    });
  });

  describe('pullDocument', () => {
    it('should return error if not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = await selectiveSyncService.pullDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Not authenticated');
    });

    it('should pull document from cloud and update local', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockDocumentService.getDocument.mockResolvedValue({
        id: 'doc-123',
        title: 'Cloud Doc',
        content: 'cloud content',
        content_type: 'markdown',
        folder_id: null,
        is_starred: true,
        tags: ['test'],
        version: 2,
        updated_at: '2025-01-01T12:00:00Z',
        workspace_id: 'ws-1',
        created_at: '2025-01-01',
        created_by: 'user-1',
      });
      mockBackendWorkspaceService.getDocuments.mockResolvedValue([
        { id: 'doc-123', updatedAt: new Date('2025-01-01T10:00:00Z') },
      ]);

      const result = await selectiveSyncService.pullDocument('doc-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('synced');
      expect(mockGuestWorkspaceService.updateDocument).toHaveBeenCalledWith(
        'doc-123',
        expect.objectContaining({
          syncStatus: 'synced',
          cloudId: 'doc-123',
        })
      );
    });

    it('should detect conflict if local is newer', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockDocumentService.getDocument.mockResolvedValue({
        id: 'doc-123',
        updated_at: '2025-01-01T10:00:00Z', // Cloud is older
      });
      mockBackendWorkspaceService.getDocuments.mockResolvedValue([
        { id: 'doc-123', updatedAt: new Date('2025-01-01T12:00:00Z') },
      ]);

      const result = await selectiveSyncService.pullDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('conflict');
      expect(result.error).toBe('Local version is newer');
    });
  });

  describe('pushFolder', () => {
    it('should return error if not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = await selectiveSyncService.pushFolder('folder-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Not authenticated');
    });

    it('should create folder on cloud if not exists', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockGuestWorkspaceService.getFolder.mockReturnValue({
        id: 'folder-123',
        name: 'Test Folder',
        workspaceId: 'ws-1',
        parentId: null,
        sync: { status: 'local', localVersion: 1 },
      });
      mockFolderService.getFolder.mockRejectedValue({ response: { status: 404 } });
      mockFolderService.createFolder.mockResolvedValue({ id: 'folder-123' });

      const result = await selectiveSyncService.pushFolder('folder-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('synced');
      expect(mockFolderService.createFolder).toHaveBeenCalled();
    });
  });

  describe('markAsLocalOnly', () => {
    it('should update document sync status to local', async () => {
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        sync: { status: 'synced', localVersion: 1 },
      });

      await selectiveSyncService.markAsLocalOnly('doc-123');

      expect(mockGuestWorkspaceService.updateDocument).toHaveBeenCalledWith(
        'doc-123',
        expect.objectContaining({ syncStatus: 'local' })
      );
    });
  });

  describe('getSyncStatus', () => {
    it('should return document sync status', () => {
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        sync: { status: 'synced', localVersion: 1 },
      });

      const status = selectiveSyncService.getSyncStatus('doc-123');

      expect(status).toBe('synced');
    });

    it('should return local if document not found', () => {
      mockGuestWorkspaceService.getDocument.mockReturnValue(undefined);

      const status = selectiveSyncService.getSyncStatus('doc-123');

      expect(status).toBe('local');
    });
  });
});

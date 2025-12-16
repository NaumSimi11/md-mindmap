import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API services
const mockDocumentService = {
  getDocument: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  listDocuments: vi.fn(),
  deleteDocument: vi.fn(),
};

const mockFolderService = {
  getFolder: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  listFolders: vi.fn(),
  deleteFolder: vi.fn(),
};

const mockAuthService = {
  isAuthenticated: vi.fn(() => true),
};

const mockGuestWorkspaceService = {
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  getFolder: vi.fn(),
  updateFolder: vi.fn(),
  getFolders: vi.fn(() => []),
  getDocuments: vi.fn(() => []),
};

vi.mock('@/services/api', () => ({
  documentService: mockDocumentService,
  folderService: mockFolderService,
  authService: mockAuthService,
}));

vi.mock('@/services/workspace/GuestWorkspaceService', () => ({
  guestWorkspaceService: mockGuestWorkspaceService,
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
      expect(result.error).toBe('Document not found locally');
    });

    it('should create document on cloud if not exists', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
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
      mockDocumentService.getDocument.mockRejectedValue({ response: { status: 404 } });
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
          sync: expect.objectContaining({
            status: 'synced',
          }),
        })
      );
    });

    it('should detect conflict if cloud is newer', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        title: 'Test Doc',
        updatedAt: '2025-01-01T10:00:00Z',
        sync: { status: 'local', localVersion: 1 },
      });
      mockDocumentService.getDocument.mockResolvedValue({
        id: 'doc-123',
        updated_at: '2025-01-01T12:00:00Z', // Cloud is newer
      });

      const result = await selectiveSyncService.pushDocument('doc-123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('conflict');
      expect(result.error).toBe('Cloud version is newer');
      expect(result.conflictData).toBeDefined();
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
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        updatedAt: '2025-01-01T10:00:00Z', // Local is older
      });

      const result = await selectiveSyncService.pullDocument('doc-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('synced');
      expect(mockGuestWorkspaceService.updateDocument).toHaveBeenCalledWith(
        'doc-123',
        expect.objectContaining({
          title: 'Cloud Doc',
          starred: true,
          tags: ['test'],
          sync: expect.objectContaining({
            status: 'synced',
            cloudVersion: 2,
          }),
        })
      );
    });

    it('should detect conflict if local is newer', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockDocumentService.getDocument.mockResolvedValue({
        id: 'doc-123',
        updated_at: '2025-01-01T10:00:00Z', // Cloud is older
      });
      mockGuestWorkspaceService.getDocument.mockReturnValue({
        id: 'doc-123',
        updatedAt: '2025-01-01T12:00:00Z', // Local is newer
      });

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
        expect.objectContaining({
          sync: expect.objectContaining({
            status: 'local',
          }),
        })
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

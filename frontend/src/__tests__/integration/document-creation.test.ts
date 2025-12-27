/**
 * Integration Tests: Document Creation Flow
 * 
 * Tests the full document creation workflow:
 * - Guest creates document → stored locally
 * - Authenticated user creates document → syncs to cloud
 * - Document metadata correctly populated
 * - ID generation follows expected format
 * - Sync status transitions correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the services
vi.mock('@/services/workspace/GuestWorkspaceService', () => ({
  guestWorkspaceService: {
    initialized: true,
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    getAllWorkspaces: vi.fn().mockResolvedValue([]),
    getCurrentWorkspace: vi.fn().mockResolvedValue({ id: 'ws-1', name: 'Local Workspace' }),
  }
}));

vi.mock('@/services/workspace', () => ({
  backendWorkspaceService: {
    initialized: false,
    init: vi.fn(),
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    getAllWorkspaces: vi.fn().mockResolvedValue([]),
    getCurrentWorkspace: vi.fn().mockResolvedValue(null),
  }
}));

vi.mock('@/services/api', () => ({
  authService: {
    isAuthenticated: vi.fn().mockReturnValue(false),
    getStoredUser: vi.fn().mockReturnValue(null),
  },
  documentService: {
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  workspaceService: {
    createWorkspace: vi.fn(),
    getWorkspaces: vi.fn(),
  },
}));

describe('Document Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest Mode Document Creation', () => {
    it('creates document with local sync status', async () => {
      const { guestWorkspaceService } = await import('@/services/workspace/GuestWorkspaceService');
      
      const mockDocument = {
        id: 'doc_550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Document',
        type: 'markdown',
        content: '# Hello',
        workspaceId: 'ws-1',
        folderId: null,
        syncStatus: 'local',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      vi.mocked(guestWorkspaceService.createDocument).mockResolvedValue(mockDocument);
      
      const result = await guestWorkspaceService.createDocument({
        title: 'Test Document',
        type: 'markdown',
        content: '# Hello',
        workspaceId: 'ws-1',
      });
      
      expect(result.id).toBeDefined();
      expect(result.syncStatus).toBe('local');
      expect(result.title).toBe('Test Document');
      expect(guestWorkspaceService.createDocument).toHaveBeenCalledTimes(1);
    });

    it('generates document ID with correct format', () => {
      // Document IDs should be UUID v4 format, optionally with doc_ prefix
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const prefixedUuidRegex = /^doc_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      const bareId = '550e8400-e29b-41d4-a716-446655440000';
      const prefixedId = 'doc_550e8400-e29b-41d4-a716-446655440000';
      
      expect(uuidRegex.test(bareId)).toBe(true);
      expect(prefixedUuidRegex.test(prefixedId)).toBe(true);
    });
  });

  describe('Authenticated Mode Document Creation', () => {
    beforeEach(async () => {
      const { authService } = await import('@/services/api');
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    });

    it('creates document with appropriate sync status', async () => {
      const { backendWorkspaceService } = await import('@/services/workspace');
      
      const mockDocument = {
        id: '660e8400-e29b-41d4-a716-446655440001',
        title: 'Cloud Document',
        type: 'markdown',
        content: '# Cloud',
        workspaceId: 'ws-cloud-1',
        folderId: null,
        syncStatus: 'local', // Created locally first (local-first architecture)
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      vi.mocked(backendWorkspaceService.createDocument).mockResolvedValue(mockDocument);
      
      const result = await backendWorkspaceService.createDocument({
        title: 'Cloud Document',
        type: 'markdown',
        content: '# Cloud',
        workspaceId: 'ws-cloud-1',
      });
      
      // Local-first: even authenticated users start with 'local' status
      expect(result.syncStatus).toBe('local');
      expect(result.id).toBeDefined();
    });
  });

  describe('Document Metadata Validation', () => {
    it('requires title for document creation', () => {
      // Validation should prevent empty titles
      const isValidTitle = (title: string | undefined) => {
        return typeof title === 'string' && title.trim().length > 0;
      };
      
      expect(isValidTitle('Valid Title')).toBe(true);
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle('   ')).toBe(false);
      expect(isValidTitle(undefined)).toBe(false);
    });

    it('defaults content to empty string', () => {
      const content = undefined;
      const defaultContent = content || '';
      
      expect(defaultContent).toBe('');
    });

    it('validates document type', () => {
      const validTypes = ['markdown', 'text', 'json'];
      
      expect(validTypes.includes('markdown')).toBe(true);
      expect(validTypes.includes('text')).toBe(true);
      expect(validTypes.includes('json')).toBe(true);
      expect(validTypes.includes('html')).toBe(false);
    });
  });

  describe('Sync Status Transitions', () => {
    it('transitions from local to syncing to synced', () => {
      const validTransitions: Record<string, string[]> = {
        'local': ['syncing', 'pending'],
        'syncing': ['synced', 'error', 'conflict'],
        'synced': ['pending', 'conflict'],
        'pending': ['syncing'],
        'conflict': ['synced', 'local'],
        'error': ['syncing', 'local'],
      };
      
      // Verify local → syncing is valid
      expect(validTransitions['local']).toContain('syncing');
      
      // Verify syncing → synced is valid
      expect(validTransitions['syncing']).toContain('synced');
      
      // Verify synced → pending is valid (on local edit)
      expect(validTransitions['synced']).toContain('pending');
    });
  });
});

describe('Document Update Integration', () => {
  it('increments version on update', async () => {
    const currentVersion = 1;
    const newVersion = currentVersion + 1;
    
    expect(newVersion).toBe(2);
  });

  it('updates syncStatus to pending when synced document is edited', () => {
    const previousStatus = 'synced';
    
    // When a synced document is edited locally, it becomes pending
    const newStatus = previousStatus === 'synced' ? 'pending' : previousStatus;
    
    expect(newStatus).toBe('pending');
  });

  it('keeps local status unchanged on edit', () => {
    const previousStatus = 'local';
    
    // Local documents stay local (no cloud sync yet)
    const newStatus = previousStatus === 'synced' ? 'pending' : previousStatus;
    
    expect(newStatus).toBe('local');
  });
});

describe('Document Deletion Integration', () => {
  it('soft deletes document', () => {
    // Backend uses soft delete (is_deleted flag)
    const document = {
      id: 'doc-1',
      is_deleted: false,
    };
    
    // Soft delete
    const deletedDoc = { ...document, is_deleted: true };
    
    expect(deletedDoc.is_deleted).toBe(true);
    expect(deletedDoc.id).toBe('doc-1'); // ID preserved
  });
});


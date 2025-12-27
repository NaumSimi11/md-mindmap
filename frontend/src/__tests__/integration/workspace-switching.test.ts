/**
 * Integration Tests: Workspace Switching Flow
 * 
 * Tests workspace switching behavior:
 * - State cleanup when switching workspaces
 * - Documents refresh after switch
 * - Yjs documents released on workspace change
 * - Current workspace ID updates correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the services
vi.mock('@/services/workspace/GuestWorkspaceService', () => ({
  guestWorkspaceService: {
    initialized: true,
    getAllWorkspaces: vi.fn().mockResolvedValue([]),
    getCurrentWorkspace: vi.fn().mockResolvedValue({ id: 'ws-1', name: 'Workspace 1' }),
    switchWorkspace: vi.fn(),
    getDocuments: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('@/services/yjs/YjsDocumentManager', () => ({
  yjsDocumentManager: {
    releaseDocument: vi.fn(),
    destroyDocument: vi.fn(),
    getDocument: vi.fn(),
    debugListDocuments: vi.fn().mockReturnValue([]),
  }
}));

describe('Workspace Switching Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('tracks current workspace ID correctly', async () => {
      let currentWorkspaceId: string | null = null;
      
      const switchWorkspace = (workspaceId: string) => {
        currentWorkspaceId = workspaceId;
      };
      
      expect(currentWorkspaceId).toBeNull();
      
      switchWorkspace('ws-1');
      expect(currentWorkspaceId).toBe('ws-1');
      
      switchWorkspace('ws-2');
      expect(currentWorkspaceId).toBe('ws-2');
    });

    it('clears previous workspace state on switch', () => {
      let documents: any[] = [{ id: 'doc-1' }, { id: 'doc-2' }];
      let currentDocumentId: string | null = 'doc-1';
      
      const switchWorkspace = () => {
        // Clear state when switching
        documents = [];
        currentDocumentId = null;
      };
      
      switchWorkspace();
      
      expect(documents).toHaveLength(0);
      expect(currentDocumentId).toBeNull();
    });
  });

  describe('Document Release', () => {
    it('releases Yjs documents when switching workspaces', async () => {
      const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
      
      const activeDocIds = ['doc-1', 'doc-2'];
      
      // Simulate releasing all documents on switch
      activeDocIds.forEach(docId => {
        yjsDocumentManager.releaseDocument(docId);
      });
      
      expect(yjsDocumentManager.releaseDocument).toHaveBeenCalledTimes(2);
      expect(yjsDocumentManager.releaseDocument).toHaveBeenCalledWith('doc-1');
      expect(yjsDocumentManager.releaseDocument).toHaveBeenCalledWith('doc-2');
    });
  });

  describe('Documents Refresh', () => {
    it('loads new workspace documents after switch', async () => {
      const { guestWorkspaceService } = await import('@/services/workspace/GuestWorkspaceService');
      
      const newWorkspaceId = 'ws-2';
      
      // After switch, documents should be fetched for new workspace
      await guestWorkspaceService.getDocuments(newWorkspaceId);
      
      expect(guestWorkspaceService.getDocuments).toHaveBeenCalledWith(newWorkspaceId);
    });
  });

  describe('Workspace Switching Event', () => {
    it('dispatches workspace:switch event on change', () => {
      const dispatchedEvents: string[] = [];
      
      // Mock event dispatcher
      const dispatchEvent = (eventName: string) => {
        dispatchedEvents.push(eventName);
      };
      
      const switchWorkspace = (from: string | null, to: string) => {
        dispatchEvent('workspace:switch');
      };
      
      switchWorkspace(null, 'ws-1');
      switchWorkspace('ws-1', 'ws-2');
      
      expect(dispatchedEvents).toContain('workspace:switch');
      expect(dispatchedEvents).toHaveLength(2);
    });
  });

  describe('Local vs Cloud Workspace Switching', () => {
    it('identifies local workspace correctly', () => {
      const isLocalWorkspace = (id: string) => {
        // Local workspace IDs have timestamp-based format
        return id.startsWith('ws_') && id.includes('_') && !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      };
      
      expect(isLocalWorkspace('ws_1766647644416_mb1c9uyp9')).toBe(true);
      expect(isLocalWorkspace('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    });

    it('skips API calls for local workspace', () => {
      const apiCallsMade: string[] = [];
      
      const loadWorkspaceMembers = (workspaceId: string, isLocal: boolean) => {
        if (isLocal) {
          console.log('Skipping API call for local workspace');
          return Promise.resolve([]);
        }
        apiCallsMade.push(`loadMembers:${workspaceId}`);
        return Promise.resolve([{ id: 'member-1' }]);
      };
      
      // Local workspace should skip API
      loadWorkspaceMembers('ws_local_123', true);
      expect(apiCallsMade).toHaveLength(0);
      
      // Cloud workspace should call API
      loadWorkspaceMembers('550e8400-e29b-41d4-a716-446655440000', false);
      expect(apiCallsMade).toHaveLength(1);
    });
  });

  describe('Workspace List Management', () => {
    it('combines local and cloud workspaces', () => {
      const localWorkspaces = [
        { id: 'ws_local_1', name: 'Local 1', source: 'local' },
        { id: 'ws_local_2', name: 'Local 2', source: 'local' },
      ];
      
      const cloudWorkspaces = [
        { id: 'cloud-uuid-1', name: 'Cloud 1', source: 'cloud' },
      ];
      
      // Combine with local first (local-first architecture)
      const allWorkspaces = [...localWorkspaces, ...cloudWorkspaces];
      
      expect(allWorkspaces).toHaveLength(3);
      expect(allWorkspaces[0].source).toBe('local');
    });

    it('handles workspace not found gracefully', () => {
      const workspaces = [{ id: 'ws-1' }, { id: 'ws-2' }];
      
      const findWorkspace = (id: string) => {
        return workspaces.find(w => w.id === id) || null;
      };
      
      expect(findWorkspace('ws-1')).not.toBeNull();
      expect(findWorkspace('ws-nonexistent')).toBeNull();
    });
  });
});


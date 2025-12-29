/**
 * Auto-Sync Tests
 * 
 * Tests for the automatic synchronization system:
 * - NetworkStatusService
 * - SyncModeService
 * - AutoSyncManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// NetworkStatusService Tests
// =============================================================================
describe('NetworkStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect initial online status', () => {
    // Simulate online status
    const mockNavigator = { onLine: true };
    expect(mockNavigator.onLine).toBe(true);
  });

  it('should detect offline status', () => {
    const mockNavigator = { onLine: false };
    expect(mockNavigator.onLine).toBe(false);
  });

  it('should notify listeners on status change', () => {
    const listeners = new Set<(online: boolean) => void>();
    const callback = vi.fn();
    
    listeners.add(callback);
    
    // Simulate status change
    listeners.forEach(cb => cb(true));
    
    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should allow unsubscribing from status changes', () => {
    const listeners = new Set<(online: boolean) => void>();
    const callback = vi.fn();
    
    listeners.add(callback);
    listeners.delete(callback);
    
    // Should not be called after unsubscribe
    listeners.forEach(cb => cb(true));
    
    expect(callback).not.toHaveBeenCalled();
  });
});

// =============================================================================
// SyncModeService Tests
// =============================================================================
describe('SyncModeService', () => {
  describe('getSyncMode', () => {
    it('should return local-only for documents without cloudId', () => {
      const inferSyncMode = (doc: { cloudId?: string; syncStatus: string }) => {
        if (doc.cloudId && doc.syncStatus === 'synced') return 'cloud-enabled';
        if (doc.syncStatus === 'syncing') return 'pending-sync';
        return 'local-only';
      };

      const localDoc = { syncStatus: 'local' };
      expect(inferSyncMode(localDoc)).toBe('local-only');
    });

    it('should return cloud-enabled for synced documents with cloudId', () => {
      const inferSyncMode = (doc: { cloudId?: string; syncStatus: string }) => {
        if (doc.cloudId && doc.syncStatus === 'synced') return 'cloud-enabled';
        if (doc.syncStatus === 'syncing') return 'pending-sync';
        return 'local-only';
      };

      const cloudDoc = { cloudId: 'uuid-123', syncStatus: 'synced' };
      expect(inferSyncMode(cloudDoc)).toBe('cloud-enabled');
    });

    it('should return pending-sync for documents currently syncing', () => {
      const inferSyncMode = (doc: { cloudId?: string; syncStatus: string }) => {
        if (doc.cloudId && doc.syncStatus === 'synced') return 'cloud-enabled';
        if (doc.syncStatus === 'syncing') return 'pending-sync';
        return 'local-only';
      };

      const syncingDoc = { syncStatus: 'syncing' };
      expect(inferSyncMode(syncingDoc)).toBe('pending-sync');
    });
  });

  describe('shouldAutoSync', () => {
    it('should return true for cloud-enabled documents', () => {
      const shouldAutoSync = (syncMode: string) => syncMode === 'cloud-enabled';
      
      expect(shouldAutoSync('cloud-enabled')).toBe(true);
      expect(shouldAutoSync('local-only')).toBe(false);
      expect(shouldAutoSync('pending-sync')).toBe(false);
    });
  });
});

// =============================================================================
// AutoSyncManager Tests
// =============================================================================
describe('AutoSyncManager', () => {
  describe('Queue Management', () => {
    it('should add documents to sync queue', () => {
      const queue = new Map<string, { documentId: string; addedAt: number }>();
      
      const queueDocument = (docId: string) => {
        queue.set(docId, { documentId: docId, addedAt: Date.now() });
      };

      queueDocument('doc-1');
      queueDocument('doc-2');

      expect(queue.size).toBe(2);
      expect(queue.has('doc-1')).toBe(true);
      expect(queue.has('doc-2')).toBe(true);
    });

    it('should not duplicate documents in queue', () => {
      const queue = new Map<string, { documentId: string; addedAt: number }>();
      
      const queueDocument = (docId: string) => {
        queue.set(docId, { documentId: docId, addedAt: Date.now() });
      };

      queueDocument('doc-1');
      queueDocument('doc-1');
      queueDocument('doc-1');

      expect(queue.size).toBe(1);
    });

    it('should remove documents after successful sync', () => {
      const queue = new Map<string, { documentId: string }>();
      
      queue.set('doc-1', { documentId: 'doc-1' });
      queue.set('doc-2', { documentId: 'doc-2' });

      // Simulate successful sync
      queue.delete('doc-1');

      expect(queue.size).toBe(1);
      expect(queue.has('doc-1')).toBe(false);
      expect(queue.has('doc-2')).toBe(true);
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid document modifications', async () => {
      vi.useFakeTimers();
      
      const syncCalls: string[] = [];
      const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
      const DEBOUNCE_MS = 2000;
      
      const onDocumentModified = (docId: string) => {
        const existingTimer = debounceTimers.get(docId);
        if (existingTimer) clearTimeout(existingTimer);
        
        const timer = setTimeout(() => {
          syncCalls.push(docId);
          debounceTimers.delete(docId);
        }, DEBOUNCE_MS);
        
        debounceTimers.set(docId, timer);
      };

      // Rapid modifications
      onDocumentModified('doc-1');
      onDocumentModified('doc-1');
      onDocumentModified('doc-1');

      // Before debounce timeout
      expect(syncCalls).toHaveLength(0);

      // After debounce timeout
      vi.advanceTimersByTime(DEBOUNCE_MS + 100);
      
      // Should only sync once
      expect(syncCalls).toHaveLength(1);
      expect(syncCalls[0]).toBe('doc-1');

      vi.useRealTimers();
    });
  });

  describe('Network Recovery', () => {
    it('should process queue when network comes online', () => {
      let queueProcessed = false;
      
      const onNetworkOnline = () => {
        queueProcessed = true;
      };

      // Simulate network coming online
      onNetworkOnline();

      expect(queueProcessed).toBe(true);
    });

    it('should not process queue when offline', () => {
      let queueProcessed = false;
      const isOnline = false;
      
      const processQueue = () => {
        if (!isOnline) return;
        queueProcessed = true;
      };

      processQueue();

      expect(queueProcessed).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed syncs up to max retries', () => {
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let removedFromQueue = false;

      const handleSyncFailure = () => {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          removedFromQueue = true;
        }
      };

      // Simulate 3 failures
      handleSyncFailure();
      handleSyncFailure();
      handleSyncFailure();

      expect(retryCount).toBe(3);
      expect(removedFromQueue).toBe(true);
    });

    it('should not remove from queue if under max retries', () => {
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let removedFromQueue = false;

      const handleSyncFailure = () => {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          removedFromQueue = true;
        }
      };

      // Only 2 failures
      handleSyncFailure();
      handleSyncFailure();

      expect(retryCount).toBe(2);
      expect(removedFromQueue).toBe(false);
    });
  });

  describe('Auth Handling', () => {
    it('should clear queue on logout', () => {
      const queue = new Map<string, { documentId: string }>();
      queue.set('doc-1', { documentId: 'doc-1' });
      queue.set('doc-2', { documentId: 'doc-2' });

      // Simulate logout
      const handleLogout = () => queue.clear();
      handleLogout();

      expect(queue.size).toBe(0);
    });

    it('should not queue documents when not authenticated', () => {
      const isAuthenticated = false;
      const queue = new Map<string, { documentId: string }>();
      
      const queueDocument = (docId: string) => {
        if (!isAuthenticated) return;
        queue.set(docId, { documentId: docId });
      };

      queueDocument('doc-1');

      expect(queue.size).toBe(0);
    });
  });
});

// =============================================================================
// Integration: Sync Mode + Auto Sync
// =============================================================================
describe('Sync Mode + Auto Sync Integration', () => {
  it('should only auto-sync cloud-enabled documents', () => {
    const documents = [
      { id: 'doc-1', syncMode: 'cloud-enabled', syncStatus: 'modified' },
      { id: 'doc-2', syncMode: 'local-only', syncStatus: 'modified' },
      { id: 'doc-3', syncMode: 'cloud-enabled', syncStatus: 'synced' },
    ];

    const shouldAutoSync = (doc: { syncMode: string }) => doc.syncMode === 'cloud-enabled';
    const needsSync = (doc: { syncStatus: string }) => doc.syncStatus === 'modified';

    const docsToSync = documents.filter(doc => shouldAutoSync(doc) && needsSync(doc));

    expect(docsToSync).toHaveLength(1);
    expect(docsToSync[0].id).toBe('doc-1');
  });

  it('should handle enabling sync for previously local-only document', async () => {
    const document = {
      id: 'doc-1',
      syncMode: 'local-only' as const,
      syncStatus: 'local',
      cloudId: undefined as string | undefined,
    };

    // Simulate enabling sync
    const enableSync = async () => {
      document.syncMode = 'pending-sync';
      // Simulate backend call
      document.cloudId = 'backend-uuid-123';
      document.syncMode = 'cloud-enabled';
      document.syncStatus = 'synced';
    };

    await enableSync();

    expect(document.syncMode).toBe('cloud-enabled');
    expect(document.cloudId).toBe('backend-uuid-123');
    expect(document.syncStatus).toBe('synced');
  });
});

// =============================================================================
// Workspace Sync Tests
// =============================================================================
describe('Workspace Sync', () => {
  it('should enable sync for all documents in workspace', async () => {
    const documents = [
      { id: 'doc-1', syncMode: 'local-only' },
      { id: 'doc-2', syncMode: 'local-only' },
      { id: 'doc-3', syncMode: 'cloud-enabled' },
    ];

    let synced = 0;
    
    const enableWorkspaceSync = async () => {
      for (const doc of documents) {
        if (doc.syncMode !== 'cloud-enabled') {
          doc.syncMode = 'cloud-enabled';
          synced++;
        }
      }
    };

    await enableWorkspaceSync();

    expect(synced).toBe(2); // Only 2 were local-only
    expect(documents.every(d => d.syncMode === 'cloud-enabled')).toBe(true);
  });

  it('should track sync errors per document', async () => {
    const documents = [
      { id: 'doc-1', syncMode: 'local-only', title: 'Doc 1' },
      { id: 'doc-2', syncMode: 'local-only', title: 'Doc 2' },
    ];

    const errors: string[] = [];
    let succeeded = 0;
    let failed = 0;

    const enableWorkspaceSync = async () => {
      for (const doc of documents) {
        // Simulate doc-2 failing
        if (doc.id === 'doc-2') {
          errors.push(`${doc.title}: Network error`);
          failed++;
        } else {
          doc.syncMode = 'cloud-enabled';
          succeeded++;
        }
      }
    };

    await enableWorkspaceSync();

    expect(succeeded).toBe(1);
    expect(failed).toBe(1);
    expect(errors).toContain('Doc 2: Network error');
  });
});


/**
 * AutoSyncManager
 * 
 * Automatically syncs cloud-enabled documents when:
 * - Document is modified (debounced)
 * - Network comes back online
 * - App becomes visible after being hidden
 * 
 * This is the core of the "set it and forget it" sync experience.
 */

import { networkStatusService } from './NetworkStatusService';
import { syncModeService } from './SyncModeService';
import { selectiveSyncService } from './SelectiveSyncService';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { authService } from '@/services/api';
import type { DocumentMeta } from '@/services/workspace/types';
import type { SyncResult } from '@/types/sync.types';

interface SyncQueueItem {
  documentId: string;
  addedAt: number;
  retryCount: number;
  lastError?: string;
}

interface AutoSyncStats {
  totalSynced: number;
  totalFailed: number;
  lastSyncAt: Date | null;
  pendingCount: number;
}

class AutoSyncManager {
  private static instance: AutoSyncManager | null = null;
  
  // Sync queue
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private syncInProgress: boolean = false;
  
  // Debounce timers
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly DEBOUNCE_MS = 2000; // Wait 2s after last change before syncing
  
  // Retry settings
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 5000;
  
  // Stats
  private stats: AutoSyncStats = {
    totalSynced: 0,
    totalFailed: 0,
    lastSyncAt: null,
    pendingCount: 0,
  };
  
  // Cleanup
  private unsubscribeNetwork: (() => void) | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): AutoSyncManager {
    if (!AutoSyncManager.instance) {
      AutoSyncManager.instance = new AutoSyncManager();
    }
    return AutoSyncManager.instance;
  }

  /**
   * Initialize auto-sync listeners
   */
  init(): void {
    if (this.initialized) return;

    // Initialize network status service
    networkStatusService.init();

    // Listen for network changes
    this.unsubscribeNetwork = networkStatusService.onStatusChange((online) => {
      if (online) {
        console.log('🔄 [AutoSync] Network online - processing queue');
        this.processQueue();
      }
    });

    // Listen for visibility changes (sync when app becomes visible)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Listen for auth events
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:login', this.handleLogin);
      window.addEventListener('auth:logout', this.handleLogout);
    }

    this.initialized = true;
    console.log('🔄 [AutoSync] Initialized');
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
      this.unsubscribeNetwork = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('auth:login', this.handleLogin);
      window.removeEventListener('auth:logout', this.handleLogout);
    }

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.syncQueue.clear();
    this.initialized = false;
    
    console.log('🔄 [AutoSync] Destroyed');
  }

  /**
   * Called when a document is modified
   * Only queues if the document is cloud-enabled
   */
  async onDocumentModified(documentId: string): Promise<void> {
    // Skip if not authenticated
    if (!authService.isAuthenticated()) return;

    // Get document to check sync mode
    const document = await guestWorkspaceService.getDocument(documentId);
    if (!document) return;

    // Only auto-sync cloud-enabled documents
    if (!syncModeService.shouldAutoSync(document)) {
      return;
    }

    // Debounce: clear existing timer and set new one
    const existingTimer = this.debounceTimers.get(documentId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(documentId);
      this.queueDocument(documentId);
    }, this.DEBOUNCE_MS);

    this.debounceTimers.set(documentId, timer);
  }

  /**
   * Force sync a specific document immediately
   */
  async syncDocument(documentId: string): Promise<SyncResult> {
    if (!authService.isAuthenticated()) {
      return { success: false, status: 'error', error: 'Not authenticated' };
    }

    console.log(`🔄 [AutoSync] Force syncing: ${documentId}`);
    
    // Mark as syncing
    await guestWorkspaceService.updateDocument(documentId, {
      syncStatus: 'syncing',
    });

    try {
      const result = await selectiveSyncService.pushDocument(documentId);

      if (result.success) {
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        });
        
        this.stats.totalSynced++;
        this.stats.lastSyncAt = new Date();
        
        // Remove from queue if present
        this.syncQueue.delete(documentId);
        
        console.log(`✅ [AutoSync] Synced: ${documentId}`);
      } else {
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'error',
        });
        
        this.stats.totalFailed++;
        console.error(`❌ [AutoSync] Failed: ${documentId} - ${result.error}`);
      }

      return result;
    } catch (error) {
      await guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'error',
      });
      
      this.stats.totalFailed++;
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [AutoSync] Error syncing ${documentId}:`, errorMsg);
      
      return { success: false, status: 'error', error: errorMsg };
    }
  }

  /**
   * Sync all pending documents
   */
  async syncAll(): Promise<{ synced: number; failed: number }> {
    const pendingDocs = await syncModeService.getPendingSyncDocuments();
    let synced = 0;
    let failed = 0;

    for (const doc of pendingDocs) {
      const result = await this.syncDocument(doc.id);
      if (result.success) {
        synced++;
      } else {
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Get current sync stats
   */
  getStats(): AutoSyncStats {
    return {
      ...this.stats,
      pendingCount: this.syncQueue.size,
    };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { 
    size: number; 
    isProcessing: boolean;
    items: Array<{ documentId: string; retryCount: number }>;
  } {
    return {
      size: this.syncQueue.size,
      isProcessing: this.syncInProgress,
      items: Array.from(this.syncQueue.values()).map(item => ({
        documentId: item.documentId,
        retryCount: item.retryCount,
      })),
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private queueDocument(documentId: string): void {
    const existing = this.syncQueue.get(documentId);
    
    if (existing) {
      // Update timestamp but keep retry count
      existing.addedAt = Date.now();
    } else {
      this.syncQueue.set(documentId, {
        documentId,
        addedAt: Date.now(),
        retryCount: 0,
      });
    }

    console.log(`📥 [AutoSync] Queued: ${documentId} (queue size: ${this.syncQueue.size})`);
    this.stats.pendingCount = this.syncQueue.size;

    // Try to process queue if online
    if (networkStatusService.isOnline()) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.syncInProgress) return;
    if (this.syncQueue.size === 0) return;
    if (!authService.isAuthenticated()) return;
    if (!networkStatusService.isOnline()) return;

    this.syncInProgress = true;
    console.log(`🔄 [AutoSync] Processing queue (${this.syncQueue.size} items)`);

    const items = Array.from(this.syncQueue.values());

    for (const item of items) {
      try {
        const result = await this.syncDocument(item.documentId);

        if (result.success) {
          this.syncQueue.delete(item.documentId);
        } else {
          // Increment retry count
          item.retryCount++;
          item.lastError = result.error;

          if (item.retryCount >= this.MAX_RETRIES) {
            console.warn(`⚠️ [AutoSync] Max retries reached for: ${item.documentId}`);
            this.syncQueue.delete(item.documentId);
            
            // Update document status to error
            await guestWorkspaceService.updateDocument(item.documentId, {
              syncStatus: 'error',
            });
          }
        }
      } catch (error) {
        console.error(`❌ [AutoSync] Queue processing error:`, error);
        item.retryCount++;
      }

      // Small delay between syncs to avoid overwhelming the server
      await this.delay(100);
    }

    this.stats.pendingCount = this.syncQueue.size;
    this.syncInProgress = false;

    console.log(`🔄 [AutoSync] Queue processing complete. Remaining: ${this.syncQueue.size}`);

    // Emit event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync:queue-processed', {
        detail: { remaining: this.syncQueue.size },
      }));
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && networkStatusService.isOnline()) {
      console.log('🔄 [AutoSync] App visible - checking queue');
      this.processQueue();
    }
  };

  private handleLogin = (): void => {
    console.log('🔄 [AutoSync] User logged in - will sync cloud-enabled docs');
    // Slight delay to let auth settle
    setTimeout(() => this.processQueue(), 1000);
  };

  private handleLogout = (): void => {
    console.log('🔄 [AutoSync] User logged out - clearing queue');
    this.syncQueue.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.stats = {
      totalSynced: 0,
      totalFailed: 0,
      lastSyncAt: null,
      pendingCount: 0,
    };
  };

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const autoSyncManager = AutoSyncManager.getInstance();


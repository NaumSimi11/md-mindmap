/**
 * SyncModeService
 * 
 * Manages the sync mode of documents and workspaces.
 * Handles enabling/disabling cloud sync for individual documents.
 * 
 * Sync Modes:
 * - 'local-only': Never syncs to cloud
 * - 'cloud-enabled': Automatically syncs when online
 * - 'pending-sync': Waiting for first push to complete
 */

import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { selectiveSyncService } from '@/services/sync/SelectiveSyncService';
import { authService } from '@/services/api';
import type { DocumentMeta } from '@/services/workspace/types';

export type SyncMode = 'local-only' | 'cloud-enabled' | 'pending-sync';

export interface SyncModeChangeEvent {
  documentId: string;
  previousMode: SyncMode;
  newMode: SyncMode;
  cloudId?: string;
}

type SyncModeCallback = (event: SyncModeChangeEvent) => void;

class SyncModeService {
  private static instance: SyncModeService | null = null;
  private listeners: Set<SyncModeCallback> = new Set();

  private constructor() {}

  static getInstance(): SyncModeService {
    if (!SyncModeService.instance) {
      SyncModeService.instance = new SyncModeService();
    }
    return SyncModeService.instance;
  }

  /**
   * Enable cloud sync for a document
   * 
   * Flow:
   * 1. Set syncMode to 'pending-sync'
   * 2. Push document to backend
   * 3. On success: set syncMode to 'cloud-enabled', store cloudId
   * 4. On failure: revert to 'local-only', show error
   */
  async enableCloudSync(documentId: string): Promise<{ success: boolean; error?: string }> {
    if (!authService.isAuthenticated()) {
      return { success: false, error: 'Please log in to enable cloud sync' };
    }

    const document = await guestWorkspaceService.getDocument(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const previousMode = this.getSyncMode(document);
    
    // Already cloud-enabled
    if (previousMode === 'cloud-enabled' && document.cloudId) {
      return { success: true };
    }

    try {
      // Step 1: Mark as pending
      await guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'syncing',
      });

      // Step 2: Push to cloud
      const result = await selectiveSyncService.pushDocument(documentId);

      if (!result.success) {
        // Revert on failure
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'local',
        });
        return { success: false, error: result.error || 'Failed to sync document' };
      }

      // Step 3: Update with cloud info
      const cloudId = result.cloudId || document.cloudId;
      await guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'synced',
        cloudId: cloudId,
        lastSyncedAt: new Date().toISOString(),
      });

      // Notify listeners
      this.notifyModeChange({
        documentId,
        previousMode,
        newMode: 'cloud-enabled',
        cloudId,
      });

      console.log(`☁️ [SyncMode] Cloud sync enabled for ${documentId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [SyncMode] Failed to enable cloud sync:`, error);
      
      // Revert on error
      await guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'local',
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Disable cloud sync for a document
   * 
   * @param documentId - Document to disable sync for
   * @param deleteFromCloud - If true, also deletes from backend (default: false)
   */
  async disableCloudSync(
    documentId: string, 
    deleteFromCloud: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    const document = await guestWorkspaceService.getDocument(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const previousMode = this.getSyncMode(document);

    try {
      // Optionally delete from cloud
      if (deleteFromCloud && document.cloudId) {
        // TODO: Implement backend delete
        console.log(`🗑️ [SyncMode] Would delete from cloud: ${document.cloudId}`);
      }

      // Update local document
      await guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'local',
        // Keep cloudId for potential re-enable
      });

      this.notifyModeChange({
        documentId,
        previousMode,
        newMode: 'local-only',
      });

      console.log(`📴 [SyncMode] Cloud sync disabled for ${documentId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [SyncMode] Failed to disable cloud sync:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get the current sync mode of a document
   */
  getSyncMode(document: DocumentMeta): SyncMode {
    // If explicitly set, use that
    if ((document as any).syncMode) {
      return (document as any).syncMode;
    }

    // Infer from other fields
    if (document.cloudId && document.syncStatus === 'synced') {
      return 'cloud-enabled';
    }
    
    if (document.syncStatus === 'syncing') {
      return 'pending-sync';
    }

    return 'local-only';
  }

  /**
   * Check if a document should auto-sync
   */
  shouldAutoSync(document: DocumentMeta): boolean {
    const mode = this.getSyncMode(document);
    return mode === 'cloud-enabled';
  }

  /**
   * Get all documents that need to be synced
   * (cloud-enabled with local changes)
   */
  async getPendingSyncDocuments(): Promise<DocumentMeta[]> {
    const workspaces = await guestWorkspaceService.getAllWorkspaces();
    const pendingDocs: DocumentMeta[] = [];

    for (const workspace of workspaces) {
      const docs = await guestWorkspaceService.getDocumentsForWorkspace(workspace.id);
      
      for (const doc of docs) {
        const mode = this.getSyncMode(doc);
        const needsSync = doc.syncStatus === 'modified' || doc.syncStatus === 'pending';
        
        if (mode === 'cloud-enabled' && needsSync) {
          pendingDocs.push(doc);
        }
      }
    }

    return pendingDocs;
  }

  /**
   * Enable cloud sync for all documents in a workspace
   */
  async enableWorkspaceSync(workspaceId: string): Promise<{ 
    success: boolean; 
    synced: number; 
    failed: number;
    errors: string[];
  }> {
    if (!authService.isAuthenticated()) {
      return { success: false, synced: 0, failed: 0, errors: ['Please log in'] };
    }

    const documents = await guestWorkspaceService.getDocumentsForWorkspace(workspaceId);
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doc of documents) {
      const mode = this.getSyncMode(doc);
      
      if (mode !== 'cloud-enabled') {
        const result = await this.enableCloudSync(doc.id);
        
        if (result.success) {
          synced++;
        } else {
          failed++;
          errors.push(`${doc.title}: ${result.error}`);
        }
      }
    }

    console.log(`☁️ [SyncMode] Workspace sync complete: ${synced} synced, ${failed} failed`);
    
    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  /**
   * Subscribe to sync mode changes
   */
  onModeChange(callback: SyncModeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private notifyModeChange(event: SyncModeChangeEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('☁️ [SyncMode] Listener error:', error);
      }
    });

    // Also dispatch a DOM event for React components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync:mode-change', { detail: event }));
    }
  }
}

export const syncModeService = SyncModeService.getInstance();


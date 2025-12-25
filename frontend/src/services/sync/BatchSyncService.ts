/**
 * Batch Sync Service
 * ==================
 * 
 * Handles batch synchronization of multiple documents in one API call.
 * Optimizes offline → online sync by reducing network requests.
 * 
 * Features:
 * - Collect pending operations from IndexedDB
 * - Batch push to backend (1 request vs N requests)
 * - Conflict detection and resolution
 * - Progress tracking
 * - Retry logic
 */

import { guestWorkspaceService } from '../workspace/GuestWorkspaceService';
import { apiClient } from '../api/ApiClient';

// =========================================
// Types
// =========================================

export type BatchOperationType = 'create' | 'update' | 'delete';
export type BatchOperationStatus = 'success' | 'conflict' | 'error' | 'skipped';

export interface BatchOperation {
  operation: BatchOperationType;
  clientId: string;
  documentId?: string;
  data?: any;
  expectedVersion?: number;
}

export interface BatchOperationResult {
  clientId: string;
  status: BatchOperationStatus;
  documentId?: string;
  version?: number;
  error?: string;
  conflictData?: any;
}

export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: BatchOperationResult[];
  processingTimeMs: number;
}

export interface BatchSyncProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentOperation?: string;
}

// =========================================
// Batch Sync Service
// =========================================

class BatchSyncService {
  private progressCallback?: (progress: BatchSyncProgress) => void;

  /**
   * Set progress callback for UI updates
   */
  setProgressCallback(callback: (progress: BatchSyncProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Collect all pending operations from IndexedDB
   * 
   * Scans guest workspace service for documents with:
   * - syncStatus: 'local' (never synced)
   * - syncStatus: 'pending' (sync in progress)
   * - syncStatus: 'modified' (synced but modified)
   */
  async collectPendingOperations(workspaceId: string): Promise<BatchOperation[]> {
    const operations: BatchOperation[] = [];

    try {
      // Get all documents in workspace
      const documents = await guestWorkspaceService.getDocuments(workspaceId);

      for (const doc of documents) {
        // Skip synced documents
        if (doc.syncStatus === 'synced') {
          continue;
        }

        // Create operation based on sync status
        if (doc.syncStatus === 'local' || doc.syncStatus === 'pending') {
          // Document never synced → CREATE
          operations.push({
            operation: 'create',
            clientId: `create_${doc.id}`,
            documentId: doc.id,
            data: {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              content_type: 'markdown',
              folder_id: doc.folderId || null,
              tags: doc.tags || [],
              is_starred: doc.starred || false,
              yjs_state_b64: doc.yjsStateB64,
            },
          });
        } else if (doc.syncStatus === 'modified' && doc.cloudId) {
          // Document synced but modified → UPDATE
          operations.push({
            operation: 'update',
            clientId: `update_${doc.id}`,
            documentId: doc.cloudId,
            data: {
              title: doc.title,
              content: doc.content,
              folder_id: doc.folderId || null,
              tags: doc.tags || [],
              is_starred: doc.starred || false,
              yjs_state_b64: doc.yjsStateB64,
            },
            expectedVersion: doc.version,
          });
        }
      }

      console.log(`📦 [BatchSync] Collected ${operations.length} pending operations`);
      return operations;
    } catch (error) {
      console.error('❌ [BatchSync] Failed to collect operations:', error);
      throw error;
    }
  }

  /**
   * Push batch of operations to backend
   */
  async pushBatch(
    workspaceId: string,
    operations: BatchOperation[],
    atomic: boolean = false
  ): Promise<BatchSyncResult> {
    if (operations.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        processingTimeMs: 0,
      };
    }

    try {
      console.log(`☁️ [BatchSync] Pushing ${operations.length} operations to cloud...`);

      // Update progress
      this.progressCallback?.({
        total: operations.length,
        completed: 0,
        successful: 0,
        failed: 0,
        currentOperation: 'Sending batch request...',
      });

      // Send batch request
      const response = await apiClient.post<BatchSyncResult>(
        `/api/v1/documents/batch`,
        {
          workspace_id: workspaceId,
          operations,
          atomic,
        }
      );

      console.log(`✅ [BatchSync] Batch completed: ${response.successful}/${response.total} successful`);

      // Update progress
      this.progressCallback?.({
        total: response.total,
        completed: response.total,
        successful: response.successful,
        failed: response.failed,
        currentOperation: 'Processing results...',
      });

      // Process results and update local IndexedDB
      await this.processResults(response.results);

      return response;
    } catch (error) {
      console.error('❌ [BatchSync] Batch push failed:', error);
      throw error;
    }
  }

  /**
   * Process batch results and update local IndexedDB
   */
  private async processResults(results: BatchOperationResult[]): Promise<void> {
    for (const result of results) {
      try {
        if (result.status === 'success' && result.documentId) {
          // Extract original document ID from client ID
          const originalDocId = result.clientId.replace(/^(create|update)_/, '');

          // Update local document with sync status
          await guestWorkspaceService.updateDocument(originalDocId, {
            syncStatus: 'synced',
            cloudId: result.documentId,
            version: result.version,
            lastSyncedAt: new Date().toISOString(),
          });

          console.log(`✅ [BatchSync] Updated local doc: ${originalDocId} → ${result.documentId}`);
        } else if (result.status === 'conflict') {
          // Mark as conflict for manual resolution
          const originalDocId = result.clientId.replace(/^(create|update)_/, '');
          await guestWorkspaceService.updateDocument(originalDocId, {
            syncStatus: 'conflict',
          });

          console.warn(`⚠️ [BatchSync] Conflict detected: ${originalDocId}`, result.conflictData);
        } else if (result.status === 'error') {
          console.error(`❌ [BatchSync] Operation failed: ${result.clientId}`, result.error);
        }
      } catch (error) {
        console.error(`❌ [BatchSync] Failed to process result for ${result.clientId}:`, error);
      }
    }
  }

  /**
   * Sync all pending documents in a workspace
   * 
   * This is the main entry point for batch sync.
   * Call this on login or when user clicks "Sync All".
   */
  async syncWorkspace(workspaceId: string, atomic: boolean = false): Promise<BatchSyncResult> {
    try {
      console.log(`🔄 [BatchSync] Starting workspace sync: ${workspaceId}`);

      // Step 1: Collect pending operations
      const operations = await this.collectPendingOperations(workspaceId);

      if (operations.length === 0) {
        console.log(`✅ [BatchSync] No pending operations`);
        return {
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
          processingTimeMs: 0,
        };
      }

      // Step 2: Push batch to backend
      const result = await this.pushBatch(workspaceId, operations, atomic);

      // Step 3: Report results
      console.log(`🎉 [BatchSync] Workspace sync complete:`, {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        time: `${result.processingTimeMs}ms`,
      });

      return result;
    } catch (error) {
      console.error('❌ [BatchSync] Workspace sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all workspaces
   * 
   * Call this on login to sync everything at once.
   */
  async syncAllWorkspaces(): Promise<Map<string, BatchSyncResult>> {
    const results = new Map<string, BatchSyncResult>();

    try {
      console.log(`🔄 [BatchSync] Starting full sync (all workspaces)...`);

      // Get all workspaces
      const workspaces = await guestWorkspaceService.getAllWorkspaces();

      for (const workspace of workspaces) {
        try {
          const result = await this.syncWorkspace(workspace.id);
          results.set(workspace.id, result);
        } catch (error) {
          console.error(`❌ [BatchSync] Failed to sync workspace ${workspace.id}:`, error);
          // Continue with other workspaces
        }
      }

      // Calculate totals
      let totalOps = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      for (const result of results.values()) {
        totalOps += result.total;
        totalSuccessful += result.successful;
        totalFailed += result.failed;
      }

      console.log(`🎉 [BatchSync] Full sync complete:`, {
        workspaces: results.size,
        total: totalOps,
        successful: totalSuccessful,
        failed: totalFailed,
      });

      return results;
    } catch (error) {
      console.error('❌ [BatchSync] Full sync failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const batchSyncService = new BatchSyncService();


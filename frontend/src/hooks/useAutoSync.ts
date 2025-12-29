/**
 * useAutoSync Hook
 * 
 * Provides auto-sync functionality for documents.
 * Automatically syncs cloud-enabled documents when modified.
 */

import { useEffect, useCallback } from 'react';
import { autoSyncManager } from '@/services/sync/AutoSyncManager';
import { syncModeService, type SyncMode } from '@/services/sync/SyncModeService';

/**
 * Initialize auto-sync on app startup
 * Call this once in your app's root component
 */
export function useAutoSyncInit(): void {
  useEffect(() => {
    autoSyncManager.init();
    
    return () => {
      autoSyncManager.destroy();
    };
  }, []);
}

/**
 * Hook for document-level auto-sync
 * Call this in your editor component
 */
export function useDocumentAutoSync(documentId: string | undefined) {
  // Notify auto-sync manager when document is modified
  const notifyModified = useCallback(() => {
    if (documentId) {
      autoSyncManager.onDocumentModified(documentId);
    }
  }, [documentId]);

  return { notifyModified };
}

/**
 * Hook for managing a document's sync mode
 */
export function useSyncMode(documentId: string) {
  const enableSync = useCallback(async () => {
    return syncModeService.enableCloudSync(documentId);
  }, [documentId]);

  const disableSync = useCallback(async (deleteFromCloud = false) => {
    return syncModeService.disableCloudSync(documentId, deleteFromCloud);
  }, [documentId]);

  return { enableSync, disableSync };
}

/**
 * Hook to get auto-sync stats
 */
export function useAutoSyncStats() {
  return autoSyncManager.getStats();
}

/**
 * Hook to get queue status
 */
export function useAutoSyncQueue() {
  return autoSyncManager.getQueueStatus();
}


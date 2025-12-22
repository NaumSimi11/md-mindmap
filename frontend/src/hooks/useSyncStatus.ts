/**
 * useSyncStatus Hook - Track durability snapshot status
 * 
 * Task 2: Provide real-time sync status for UI display
 * 
 * Returns:
 * - lastSyncedAt: Timestamp of last successful backup
 * - lastSyncSuccess: Whether last backup succeeded
 * - pendingCount: Number of failed snapshots waiting for retry
 * - isOnline: Network connectivity status
 */

import { useState, useEffect } from 'react';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { FailedSnapshotStore } from '@/services/snapshots/FailedSnapshotStore';

export interface SyncStatusData {
  lastSyncedAt: Date | null;
  lastSyncSuccess: boolean;
  isBackingUp: boolean;
  cloudEnabled: boolean;
  pendingCount: number;
  isOnline: boolean;
}

/**
 * Hook to track sync status for a document
 */
export function useSyncStatus(documentId: string): SyncStatusData {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean>(true);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [cloudEnabled, setCloudEnabled] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  useEffect(() => {
    // Poll sync status every 2 seconds
    const statusInterval = setInterval(() => {
      const instance = yjsDocumentManager.getDocumentInstance(documentId);
      if (instance?.snapshotManager) {
        const status = instance.snapshotManager.getSyncStatus();
        setLastSyncedAt(status.lastSyncedAt);
        setLastSyncSuccess(status.lastSyncSuccess);
        setIsBackingUp(status.isBackingUp);
        setCloudEnabled(true);
      } else {
        setCloudEnabled(false);
        setIsBackingUp(false);
      }
    }, 2000);
    
    // Poll pending count every 5 seconds
    const countInterval = setInterval(async () => {
      try {
        const count = await FailedSnapshotStore.getPendingCount();
        setPendingCount(count);
      } catch (error) {
        console.error('[useSyncStatus] Failed to get pending count:', error);
      }
    }, 5000);
    
    // Initial fetch
    (async () => {
      const count = await FailedSnapshotStore.getPendingCount();
      setPendingCount(count);
    })();
    
    // Listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(countInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [documentId]);
  
  return {
    lastSyncedAt,
    lastSyncSuccess,
    isBackingUp,
    cloudEnabled,
    pendingCount,
    isOnline,
  };
}


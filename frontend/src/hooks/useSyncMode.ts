/**
 * useSyncMode Hook
 * Manages user's sync preference (online/offline)
 */

import { useState, useEffect } from 'react';

export type SyncMode = 'online' | 'offline';

const STORAGE_KEY = 'mdreader:sync-mode';

export function useSyncMode() {
  const [syncMode, setSyncMode] = useState<SyncMode>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as SyncMode) || 'online';
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, syncMode);
  }, [syncMode]);

  const toggleSyncMode = () => {
    setSyncMode(prev => prev === 'online' ? 'offline' : 'online');
  };

  return {
    syncMode,
    setSyncMode,
    toggleSyncMode,
    isOnlineMode: syncMode === 'online',
    isOfflineMode: syncMode === 'offline',
  };
}

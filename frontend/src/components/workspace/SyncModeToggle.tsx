/**
 * SyncModeToggle Component
 * Allows user to manually switch between online/offline sync modes
 */

import React from 'react';
import { useSyncMode } from '@/hooks/useSyncMode';
import { useAuth } from '@/hooks/useAuth';

export const SyncModeToggle: React.FC = () => {
  const { syncMode, toggleSyncMode } = useSyncMode();
  const { isAuthenticated } = useAuth();

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const isOnline = syncMode === 'online';

  return (
    <button
      onClick={toggleSyncMode}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 hover:scale-105
        ${isOnline 
          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
        }
      `}
      title={isOnline ? 'Click to work offline' : 'Click to work online'}
    >
      <span className="text-base">
        {isOnline ? '☁️' : '💾'}
      </span>
      <span>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </button>
  );
};

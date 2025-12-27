/**
 * SyncStatusIndicator Component
 * 
 * Purpose: Display sync status to users with visual feedback
 * 
 * States:
 * - Initializing: Setting up Yjs document
 * - Local-only: Guest mode, no cloud sync
 * - Connecting: Attempting cloud connection
 * - Synced: All changes saved (local + cloud)
 * - Offline: Network disconnected
 * - Error: Sync error occurred
 * 
 * Design: Minimal, unobtrusive, informative
 */

import React, { useState, useEffect } from 'react';
import type { SyncStatus } from '@/hooks/useYjsDocument';
import { authService } from '@/services/api';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  localSynced: boolean;
  cloudSynced: boolean;
  online: boolean;
  error: Error | null;
  onRetry?: () => void;
}

interface StatusConfig {
  icon: string;
  label: string;
  color: string;
  description: string;
  showRetry: boolean;
}

/**
 * Status configuration map
 */
const STATUS_CONFIG: Record<SyncStatus, StatusConfig> = {
  initializing: {
    icon: '⏳',
    label: 'Initializing',
    color: 'text-gray-500',
    description: 'Setting up document...',
    showRetry: false,
  },
  'local-only': {
    icon: '💾',
    label: 'Local Only',
    color: 'text-blue-500',
    description: 'Changes saved locally',
    showRetry: false,
  },
  connecting: {
    icon: '🔄',
    label: 'Connecting',
    color: 'text-yellow-500',
    description: 'Connecting to cloud...',
    showRetry: false,
  },
  synced: {
    icon: '✅',
    label: 'Synced',
    color: 'text-green-500',
    description: 'All changes saved',
    showRetry: false,
  },
  offline: {
    icon: '📴',
    label: 'Offline',
    color: 'text-orange-500',
    description: 'Working offline',
    showRetry: false,
  },
  error: {
    icon: '❌',
    label: 'Error',
    color: 'text-red-500',
    description: 'Sync error occurred',
    showRetry: true,
  },
};

/**
 * Format timestamp for last sync display
 */
function formatLastSync(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return timestamp.toLocaleTimeString();
}

/**
 * SyncStatusIndicator Component
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  localSynced,
  cloudSynced,
  online,
  error,
  onRetry,
}) => {
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [expanded, setExpanded] = useState(false);
  
  // Update last sync time when synced
  useEffect(() => {
    if (status === 'synced' || (status === 'local-only' && localSynced)) {
      setLastSync(new Date());
    }
  }, [status, localSynced]);
  
  const config = STATUS_CONFIG[status];
  
  // Auto-collapse after 3 seconds
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => setExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [expanded]);
  
  // ✅ Hide "Local Only" indicator when authenticated (per user request)
  // Only show when there's something important (error, offline, syncing, or not authenticated)
  const isAuthenticated = authService.isAuthenticated();
  const shouldShow = status !== 'local-only' || (!isAuthenticated && status === 'local-only');
  
  if (!shouldShow) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 group"
      data-testid="sync-status-indicator"
      data-sync-status={status}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-lg
          transition-all duration-200
          ${expanded ? 'min-w-[200px]' : 'min-w-[120px]'}
        `}
      >
        {/* Animated Icon */}
        <span 
          className={`
            text-lg
            ${status === 'connecting' ? 'animate-spin' : ''}
          `}
        >
          {config.icon}
        </span>
        
        {/* Status Label */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </div>
          
          {/* Expanded Info */}
          {expanded && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {error ? (
                <div className="text-red-500 truncate" title={error.message}>
                  {error.message}
                </div>
              ) : (
                config.description
              )}
            </div>
          )}
        </div>
        
        {/* Retry Button */}
        {config.showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="
              px-2 py-1 text-xs rounded
              bg-red-100 dark:bg-red-900/20
              text-red-600 dark:text-red-400
              hover:bg-red-200 dark:hover:bg-red-900/30
              transition-colors
            "
            title="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
      
      {/* Detailed Status (Expanded) */}
      {expanded && (
        <div
          className="
            absolute bottom-full right-0 mb-2
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-xl p-3
            min-w-[250px]
            text-xs
          "
        >
          {/* Status Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Local:</span>
              <span className={localSynced ? 'text-green-500' : 'text-gray-400'}>
                {localSynced ? '✓ Synced' : '⏳ Syncing...'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cloud:</span>
              <span className={cloudSynced ? 'text-green-500' : 'text-gray-400'}>
                {!online ? '📴 Offline' : cloudSynced ? '✓ Synced' : '⏳ Syncing...'}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Last sync:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatLastSync(lastSync)}
              </span>
            </div>
          </div>
          
          {/* Status Message */}
          {status === 'local-only' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>
                  Guest mode: Changes are saved locally. Login to sync across devices.
                </span>
              </div>
            </div>
          )}
          
          {status === 'offline' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>
                  Offline mode: Changes will sync when connection is restored.
                </span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2 text-red-500">
                <span>⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">Error Details:</div>
                  <div className="text-xs break-words mt-1">
                    {error.message}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Minimal Sync Status Badge (Alternative Simple Version)
 * For use in toolbars or compact spaces
 */
export const SyncStatusBadge: React.FC<Pick<SyncStatusIndicatorProps, 'status' | 'localSynced' | 'cloudSynced'>> = ({
  status,
  localSynced,
  cloudSynced,
}) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded text-xs
        ${config.color}
        bg-gray-100 dark:bg-gray-800
      `}
      title={config.description}
      data-testid="sync-status-badge"
      data-sync-status={status}
    >
      <span className={status === 'connecting' ? 'animate-spin' : ''}>
        {config.icon}
      </span>
      <span className="font-medium">{config.label}</span>
    </div>
  );
};


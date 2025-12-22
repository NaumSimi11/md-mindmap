/**
 * Sync Status Badge - Prominent indicator for durability snapshot status
 * 
 * Task 2: Display sync status to users
 * 
 * States:
 * - Backing up: Yellow spinner (animated)
 * - Backed up: Green checkmark with timestamp
 * - Failed: Red warning with retry count
 * - Offline: Gray cloud-off icon
 * 
 * Displays:
 * - Icon (animated during backup)
 * - "Last backed up: X ago" timestamp
 * - Badge count for pending retries
 * - Tooltip with detailed status
 */

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncStatusBadgeProps {
  lastSyncedAt: Date | null;
  lastSyncSuccess: boolean;
  isBackingUp?: boolean;
  cloudEnabled?: boolean;
  pendingCount: number;
  isOnline: boolean;
  className?: string;
}

/**
 * Format relative timestamp (e.g., "3s ago", "2m ago")
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return date.toLocaleTimeString();
}

/**
 * Determine current sync state
 */
function getSyncState(
  lastSyncedAt: Date | null,
  lastSyncSuccess: boolean,
  isBackingUp: boolean,
  cloudEnabled: boolean,
  pendingCount: number,
  isOnline: boolean
): 'disabled' | 'not-backed-up' | 'backing-up' | 'backed-up' | 'failed' | 'offline' {
  if (!isOnline) return 'offline';
  if (!cloudEnabled) return 'disabled';
  if (pendingCount > 0) return 'failed';
  if (isBackingUp) return 'backing-up';
  if (!lastSyncedAt) return 'not-backed-up';
  
  // Check if last sync was recent (<10s) - considered "backing up"
  const timeSinceSync = Date.now() - lastSyncedAt.getTime();
  if (timeSinceSync < 10000 && lastSyncSuccess) {
    return 'backing-up';
  }
  
  return lastSyncSuccess ? 'backed-up' : 'failed';
}

/**
 * State configuration
 */
const stateConfig = {
  disabled: {
    icon: CloudOff,
    label: 'Cloud backup off',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    animate: false,
  },
  'not-backed-up': {
    icon: Cloud,
    label: 'Not backed up yet',
    color: 'text-gray-600 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    animate: false,
  },
  'backing-up': {
    icon: Loader2,
    label: 'Backing up...',
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    animate: true,
  },
  'backed-up': {
    icon: CheckCircle,
    label: 'Backed up',
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    animate: false,
  },
  'failed': {
    icon: AlertCircle,
    label: 'Backup failed',
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    animate: false,
  },
  'offline': {
    icon: CloudOff,
    label: 'Offline',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    animate: false,
  },
};

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  lastSyncedAt,
  lastSyncSuccess,
  isBackingUp = false,
  cloudEnabled = true,
  pendingCount,
  isOnline,
  className,
}) => {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(lastSyncedAt));
  const state = getSyncState(lastSyncedAt, lastSyncSuccess, isBackingUp, cloudEnabled, pendingCount, isOnline);
  const config = stateConfig[state];
  const Icon = config.icon;
  
  // Update relative time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSyncedAt));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastSyncedAt]);
  
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all',
              config.bgColor,
              config.borderColor,
              'cursor-default select-none',
              className
            )}
          >
            {/* Icon */}
            <Icon
              className={cn(
                'h-4 w-4',
                config.color,
                config.animate && 'animate-spin'
              )}
            />
            
            {/* Text */}
            <div className="flex flex-col items-start">
              <span className={cn('text-xs font-medium', config.color)}>
                {config.label}
              </span>
              {lastSyncedAt && state === 'backed-up' && (
                <span className="text-[10px] text-muted-foreground">
                  {relativeTime}
                </span>
              )}
            </div>
            
            {/* Badge count for pending retries */}
            {pendingCount > 0 && (
              <div className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                {pendingCount > 99 ? '99+' : pendingCount}
              </div>
            )}
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="w-64">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Durability Status</div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium text-green-500">Saved ✓</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cloud Backup:</span>
                <span className={cn('font-medium', config.color)}>
                  {config.label}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">
                  {isOnline ? 'Online ✓' : 'Offline'}
                </span>
              </div>
              
              {lastSyncedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last backed up:</span>
                  <span className="font-medium">{relativeTime}</span>
                </div>
              )}
              
              {pendingCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending retries:</span>
                  <span className="font-medium text-red-500">{pendingCount}</span>
                </div>
              )}
            </div>
            
            {pendingCount > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Changes are saved locally. Cloud backup will retry automatically.
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


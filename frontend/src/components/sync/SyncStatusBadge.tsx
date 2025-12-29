/**
 * SyncStatusBadge
 * 
 * Visual indicator for document sync status.
 * Shows different icons/colors based on sync mode and status.
 */

import React from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  HardDrive 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SyncMode } from '@/services/workspace/types';

interface SyncStatusBadgeProps {
  syncMode: SyncMode;
  syncStatus: string;
  lastSyncedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function SyncStatusBadge({
  syncMode,
  syncStatus,
  lastSyncedAt,
  size = 'sm',
  showLabel = false,
  className,
}: SyncStatusBadgeProps) {
  const iconClass = sizeClasses[size];

  // Determine display based on mode and status
  const getDisplay = () => {
    // Local-only documents
    if (syncMode === 'local-only') {
      return {
        icon: <HardDrive className={cn(iconClass, 'text-muted-foreground')} />,
        label: 'Local only',
        tooltip: 'This document is stored locally and will not sync to cloud',
        color: 'text-muted-foreground',
      };
    }

    // Pending first sync
    if (syncMode === 'pending-sync') {
      return {
        icon: <RefreshCw className={cn(iconClass, 'text-yellow-500 animate-spin')} />,
        label: 'Syncing...',
        tooltip: 'First sync in progress',
        color: 'text-yellow-500',
      };
    }

    // Cloud-enabled - check status
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className={cn(iconClass, 'text-green-500')} />,
          label: 'Synced',
          tooltip: lastSyncedAt 
            ? `Last synced: ${formatRelativeTime(lastSyncedAt)}`
            : 'Synced to cloud',
          color: 'text-green-500',
        };
      
      case 'syncing':
        return {
          icon: <RefreshCw className={cn(iconClass, 'text-blue-500 animate-spin')} />,
          label: 'Syncing',
          tooltip: 'Syncing changes to cloud',
          color: 'text-blue-500',
        };
      
      case 'modified':
        return {
          icon: <Cloud className={cn(iconClass, 'text-yellow-500')} />,
          label: 'Modified',
          tooltip: 'Local changes pending sync',
          color: 'text-yellow-500',
        };
      
      case 'pending':
        return {
          icon: <Cloud className={cn(iconClass, 'text-yellow-500')} />,
          label: 'Pending',
          tooltip: 'Waiting to sync',
          color: 'text-yellow-500',
        };
      
      case 'conflict':
        return {
          icon: <AlertTriangle className={cn(iconClass, 'text-orange-500')} />,
          label: 'Conflict',
          tooltip: 'Sync conflict detected - manual resolution needed',
          color: 'text-orange-500',
        };
      
      case 'error':
        return {
          icon: <CloudOff className={cn(iconClass, 'text-red-500')} />,
          label: 'Error',
          tooltip: 'Sync failed - will retry automatically',
          color: 'text-red-500',
        };
      
      default:
        return {
          icon: <Cloud className={cn(iconClass, 'text-muted-foreground')} />,
          label: 'Cloud',
          tooltip: 'Cloud sync enabled',
          color: 'text-muted-foreground',
        };
    }
  };

  const display = getDisplay();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1', className)}>
            {display.icon}
            {showLabel && (
              <span className={cn('text-xs', display.color)}>
                {display.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {display.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}


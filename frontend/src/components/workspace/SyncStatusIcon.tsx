/**
 * Sync Status Icon Component
 * 
 * Modern version using Lucide icons with animations
 * Replaces emoji icons with dynamic, professional icons
 */

import React from 'react';
import { 
  HardDrive, 
  Cloud, 
  CheckCircle,
  Loader2, 
  AlertCircle, 
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/types/sync.types';

interface SyncStatusIconProps {
  status: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const statusConfig = {
  local: {
    icon: HardDrive,
    label: 'Local',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: false,
  },
  synced: {
    icon: CheckCircle,
    label: 'Synced',
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    animate: false,
  },
  syncing: {
    icon: Loader2,
    label: 'Syncing...',
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    animate: true,
  },
  modified: {
    icon: Save,
    label: 'Modified',
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    animate: false,
  },
  conflict: {
    icon: AlertCircle,
    label: 'Conflict',
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    animate: false,
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    animate: false,
  },
  pending: {
    icon: HardDrive,
    label: 'Pending',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    animate: false,
  },
};

export const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({
  status,
  size = 'sm',
  showLabel = false,
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.local;
  const Icon = config.icon;
  const sizeClass = sizeMap[size];

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
          config.bgColor,
          config.color,
          'font-medium',
          className
        )}
        title={config.label}
      >
        <Icon className={cn(sizeClass, config.animate && 'animate-spin')} />
        <span className="text-xs">{config.label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      title={config.label}
    >
      <Icon
        className={cn(
          sizeClass,
          config.color,
          config.animate && 'animate-spin'
        )}
      />
    </span>
  );
};

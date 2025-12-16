/**
 * Modern Sync Status Icon Component
 * 
 * Uses Lucide icons with animations instead of emojis
 * Modern, dynamic, and visually appealing
 */

import React from 'react';
import { 
  HardDrive, 
  Cloud, 
  CheckCircle,
  Loader2, 
  AlertCircle, 
  Save,
  CloudOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/types/sync.types';

interface ModernSyncStatusIconProps {
  status: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const statusConfig = {
  local: {
    icon: HardDrive,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Local',
    animate: false,
  },
  synced: {
    icon: CheckCircle,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Synced',
    animate: false,
  },
  syncing: {
    icon: Loader2,
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Syncing...',
    animate: true,
  },
  modified: {
    icon: Save,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Modified',
    animate: false,
  },
  conflict: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Conflict',
    animate: false,
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Error',
    animate: false,
  },
  pending: {
    icon: Cloud,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    label: 'Pending',
    animate: false,
  },
};

export const ModernSyncStatusIcon: React.FC<ModernSyncStatusIconProps> = ({
  status,
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  const config = statusConfig[status] || statusConfig.local;
  const Icon = config.icon;
  const sizeClass = sizeMap[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      title={showTooltip ? config.label : undefined}
    >
      <Icon
        className={cn(
          sizeClass,
          config.color,
          config.animate && 'animate-spin'
        )}
      />
    </div>
  );
};

/**
 * Save Indicator Component
 * Shows when document needs to be saved (local or cloud)
 */
interface SaveIndicatorProps {
  needsSave: boolean;
  saveType: 'local' | 'cloud' | 'both';
  onSave?: () => void;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  needsSave,
  saveType,
  onSave,
  className = '',
}) => {
  if (!needsSave) return null;

  const getSaveLabel = () => {
    if (saveType === 'local') return 'Save to Local';
    if (saveType === 'cloud') return 'Save to Cloud';
    return 'Save';
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-orange-500 dark:bg-orange-600',
        'text-white shadow-lg',
        'animate-pulse',
        'cursor-pointer hover:bg-orange-600 dark:hover:bg-orange-700',
        'transition-colors',
        className
      )}
      onClick={onSave}
      title="Click to save"
    >
      <Save className="h-4 w-4" />
      <span className="text-sm font-medium">{getSaveLabel()}</span>
    </div>
  );
};


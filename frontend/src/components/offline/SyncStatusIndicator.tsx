/**
 * SyncStatusIndicator - Ambient sync status display
 * 
 * Design Philosophy: "Invisible Until It Matters"
 * - Hidden when everything is synced
 * - Subtle pulse when syncing
 * - Clear indicator when offline or has issues
 * 
 * Following Linear/Notion's approach: ambient, non-intrusive
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, AlertCircle, Loader2, Check } from 'lucide-react';
import { syncManager, SyncStatus, SyncEvent } from '@/services/offline/SyncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SyncStatusIndicator() {
  const { status: networkStatus } = useNetworkStatus();
  const [syncState, setSyncState] = useState<{
    status: SyncStatus;
    pendingCount: number;
    lastSyncTime: Date | null;
  }>({
    status: 'online_synced',
    pendingCount: 0,
    lastSyncTime: null
  });
  
  // Listen to sync events
  useEffect(() => {
    const updateState = async () => {
      const state = await syncManager.getState();
      setSyncState({
        status: state.status,
        pendingCount: state.pendingCount,
        lastSyncTime: state.lastSyncTime
      });
    };
    
    // Initial state
    updateState();
    
    // Listen to sync events
    const unsubscribe = syncManager.addEventListener((event: SyncEvent) => {
      if (event.type === 'status_changed' || event.type === 'sync_completed') {
        updateState();
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Don't render anything if everything is synced
  const shouldHide = syncState.status === 'online_synced' && syncState.pendingCount === 0;
  
  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <SyncIcon status={syncState.status} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <SyncTooltipContent 
                  status={syncState.status}
                  pendingCount={syncState.pendingCount}
                  lastSyncTime={syncState.lastSyncTime}
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================================================
// Icon Component (with animations)
// ==========================================================================

function SyncIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case 'online_syncing':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Cloud className="h-4 w-4 text-blue-500" />
        </motion.div>
      );
    
    case 'online_pending':
      return (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Cloud className="h-4 w-4 text-blue-400" />
        </motion.div>
      );
    
    case 'offline':
      return (
        <div className="relative">
          <CloudOff className="h-4 w-4 text-amber-500" />
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      );
    
    case 'conflict':
      return (
        <div className="relative">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      );
    
    case 'error':
      return (
        <div className="relative">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <motion.div
            className="absolute inset-0 bg-red-500/20 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      );
    
    case 'online_synced':
    default:
      return (
        <Check className="h-4 w-4 text-green-500" />
      );
  }
}

// ==========================================================================
// Tooltip Content
// ==========================================================================

function SyncTooltipContent({ 
  status, 
  pendingCount, 
  lastSyncTime 
}: { 
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: Date | null;
}) {
  const getStatusText = () => {
    switch (status) {
      case 'online_synced':
        return 'All changes synced';
      case 'online_syncing':
        return 'Syncing changes...';
      case 'online_pending':
        return `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending`;
      case 'offline':
        return `Offline • ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} queued`;
      case 'conflict':
        return 'Conflicts detected';
      case 'error':
        return 'Sync failed';
      default:
        return 'Unknown status';
    }
  };
  
  const getDetailText = () => {
    if (status === 'offline') {
      return 'Changes will sync when online';
    }
    if (status === 'conflict') {
      return 'Review conflicts to continue';
    }
    if (status === 'error') {
      return 'Check connection and retry';
    }
    if (lastSyncTime) {
      const ago = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (ago < 60) {
        return `Last synced ${ago}s ago`;
      } else if (ago < 3600) {
        return `Last synced ${Math.floor(ago / 60)}m ago`;
      } else {
        return `Last synced ${Math.floor(ago / 3600)}h ago`;
      }
    }
    return null;
  };
  
  const detailText = getDetailText();
  
  return (
    <div className="flex flex-col gap-1">
      <div className="font-medium text-sm">{getStatusText()}</div>
      {detailText && (
        <div className="text-xs text-muted-foreground">{detailText}</div>
      )}
    </div>
  );
}

// ==========================================================================
// Alternative: Badge Version (for settings/debug)
// ==========================================================================

export function SyncStatusBadge() {
  const [syncState, setSyncState] = useState<{
    status: SyncStatus;
    pendingCount: number;
  }>({
    status: 'online_synced',
    pendingCount: 0
  });
  
  useEffect(() => {
    const updateState = async () => {
      const state = await syncManager.getState();
      setSyncState({
        status: state.status,
        pendingCount: state.pendingCount
      });
    };
    
    updateState();
    
    const unsubscribe = syncManager.addEventListener(() => {
      updateState();
    });
    
    return unsubscribe;
  }, []);
  
  const getBadgeColor = () => {
    switch (syncState.status) {
      case 'online_synced':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'online_syncing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'online_pending':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'offline':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'conflict':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };
  
  const getBadgeText = () => {
    switch (syncState.status) {
      case 'online_synced':
        return 'Synced';
      case 'online_syncing':
        return 'Syncing...';
      case 'online_pending':
        return `${syncState.pendingCount} Pending`;
      case 'offline':
        return `Offline (${syncState.pendingCount})`;
      case 'conflict':
        return 'Conflicts';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={`
      px-2 py-1 rounded-md text-xs font-medium border
      transition-colors duration-200
      ${getBadgeColor()}
    `}>
      {getBadgeText()}
    </div>
  );
}


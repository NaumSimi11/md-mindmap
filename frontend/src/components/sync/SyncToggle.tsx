/**
 * SyncToggle
 * 
 * Toggle button to enable/disable cloud sync for a document.
 * Shows current sync status and allows user to change it.
 */

import React, { useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { syncModeService } from '@/services/sync/SyncModeService';
import { authService } from '@/services/api';
import type { SyncMode } from '@/services/workspace/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SyncToggleProps {
  documentId: string;
  documentTitle: string;
  syncMode: SyncMode;
  syncStatus: string;
  onSyncModeChange?: (newMode: SyncMode) => void;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md';
  className?: string;
}

export function SyncToggle({
  documentId,
  documentTitle,
  syncMode,
  syncStatus,
  onSyncModeChange,
  variant = 'icon',
  size = 'sm',
  className,
}: SyncToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const isCloudEnabled = syncMode === 'cloud-enabled';
  const isPending = syncMode === 'pending-sync' || syncStatus === 'syncing';
  const isAuthenticated = authService.isAuthenticated();

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enable cloud sync');
      return;
    }

    if (isCloudEnabled) {
      // Show confirmation dialog before disabling
      setShowDisableDialog(true);
      return;
    }

    // Enable cloud sync
    setIsLoading(true);
    
    try {
      const result = await syncModeService.enableCloudSync(documentId);
      
      if (result.success) {
        toast.success(`"${documentTitle}" is now syncing to cloud`);
        onSyncModeChange?.('cloud-enabled');
      } else {
        toast.error(result.error || 'Failed to enable cloud sync');
      }
    } catch (error) {
      toast.error('Failed to enable cloud sync');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableConfirm = async () => {
    setShowDisableDialog(false);
    setIsLoading(true);

    try {
      const result = await syncModeService.disableCloudSync(documentId, false);
      
      if (result.success) {
        toast.info(`"${documentTitle}" will no longer sync to cloud`);
        onSyncModeChange?.('local-only');
      } else {
        toast.error(result.error || 'Failed to disable cloud sync');
      }
    } catch (error) {
      toast.error('Failed to disable cloud sync');
    } finally {
      setIsLoading(false);
    }
  };

  // Icon variant
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
                  className
                )}
                onClick={handleToggle}
                disabled={isLoading || isPending || !isAuthenticated}
              >
                {isLoading || isPending ? (
                  <Loader2 className={cn(
                    size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    'animate-spin'
                  )} />
                ) : isCloudEnabled ? (
                  <Cloud className={cn(
                    size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    'text-green-500'
                  )} />
                ) : (
                  <CloudOff className={cn(
                    size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    'text-muted-foreground'
                  )} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {!isAuthenticated ? 'Log in to enable cloud sync' :
               isLoading ? 'Syncing...' :
               isPending ? 'Sync in progress...' :
               isCloudEnabled ? 'Click to disable cloud sync' :
               'Click to enable cloud sync'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DisableConfirmDialog
          open={showDisableDialog}
          onOpenChange={setShowDisableDialog}
          documentTitle={documentTitle}
          onConfirm={handleDisableConfirm}
        />
      </>
    );
  }

  // Button variant
  return (
    <>
      <Button
        variant={isCloudEnabled ? 'secondary' : 'outline'}
        size={size}
        className={className}
        onClick={handleToggle}
        disabled={isLoading || isPending || !isAuthenticated}
      >
        {isLoading || isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : isCloudEnabled ? (
          <>
            <Cloud className="h-4 w-4 mr-2 text-green-500" />
            Cloud Sync On
          </>
        ) : (
          <>
            <CloudOff className="h-4 w-4 mr-2" />
            Enable Cloud Sync
          </>
        )}
      </Button>

      <DisableConfirmDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        documentTitle={documentTitle}
        onConfirm={handleDisableConfirm}
      />
    </>
  );
}

// Confirmation dialog for disabling sync
function DisableConfirmDialog({
  open,
  onOpenChange,
  documentTitle,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Cloud Sync?</AlertDialogTitle>
          <AlertDialogDescription>
            "{documentTitle}" will no longer sync to the cloud. 
            Changes will only be saved locally on this device.
            <br /><br />
            The cloud copy will remain but won't receive future updates.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Disable Sync
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


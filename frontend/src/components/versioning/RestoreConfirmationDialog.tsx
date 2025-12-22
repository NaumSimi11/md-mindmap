/**
 * Restore Confirmation Dialog
 * ============================
 * 
 * Shows destructive warning for overwrite restore.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO Yjs imports
 * - NO CRDT logic
 * - NO backup creation in frontend
 * - Backend handles ALL restore logic
 * - Frontend sends action + force flag ONLY
 */

import React, { useState } from 'react';
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
import type { Snapshot, RestoreAction } from '@/services/api/snapshotsClient';
import type { DocumentPermissions } from '@/hooks/useDocumentPermissions';

interface RestoreConfirmationDialogProps {
  snapshot: Snapshot;
  action: RestoreAction;
  documentId: string;
  permissions: DocumentPermissions;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const RestoreConfirmationDialog: React.FC<RestoreConfirmationDialogProps> = ({
  snapshot,
  action,
  documentId,
  permissions,
  onConfirm,
  onCancel,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setConfirming(true);
    
    try {
      // CRITICAL: Just call API - backend handles everything
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
      setConfirming(false);
    }
  };

  const isOverwrite = action === 'overwrite';

  return (
    <AlertDialog open onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOverwrite && '⚠️ '}
            {isOverwrite ? 'Overwrite Document?' : 'Restore Snapshot?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {isOverwrite ? (
              <>
                <div className="text-destructive font-semibold">
                  DESTRUCTIVE ACTION
                </div>
                <p>
                  This will replace the current document with the snapshot from{' '}
                  <span className="font-medium">
                    {new Date(snapshot.created_at).toLocaleString()}
                  </span>
                  .
                </p>
                <p className="text-sm">
                  A backup will be created automatically before overwrite.
                </p>
                <p className="text-sm text-muted-foreground">
                  This action is only available to document owners.
                </p>
              </>
            ) : (
              <>
                <p>
                  This will create a new document from the snapshot taken on{' '}
                  <span className="font-medium">
                    {new Date(snapshot.created_at).toLocaleString()}
                  </span>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  The original document will remain unchanged.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={
              confirming ||
              (isOverwrite && !permissions.canOverwriteRestore)
            }
            className={
              isOverwrite
                ? 'bg-destructive hover:bg-destructive/90 focus:ring-destructive'
                : ''
            }
          >
            {confirming
              ? 'Processing...'
              : isOverwrite
              ? 'Overwrite Document'
              : 'Restore as New'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


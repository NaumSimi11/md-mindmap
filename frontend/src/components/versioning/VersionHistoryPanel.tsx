/**
 * Version History Panel
 * ======================
 * 
 * Shows document snapshots and allows restore.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO Yjs imports
 * - NO CRDT logic
 * - Backend handles ALL restore logic
 * - UI is intent-only
 */

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, AlertCircle } from 'lucide-react';
import { SnapshotsClient, type Snapshot, type RestoreAction } from '@/services/api/snapshotsClient';
import { useDocumentPermissions, type Role } from '@/hooks/useDocumentPermissions';
import { RestoreConfirmationDialog } from './RestoreConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

interface VersionHistoryPanelProps {
  documentId: string;
  userRole: Role;
  isAuthenticated: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: (newDocumentId?: string) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  documentId,
  userRole,
  isAuthenticated,
  isOpen,
  onClose,
  onRestoreComplete,
}) => {
  const permissions = useDocumentPermissions(userRole, isAuthenticated);
  const { toast } = useToast();
  
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [restoreAction, setRestoreAction] = useState<RestoreAction>('new_document');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load snapshots when panel opens
  useEffect(() => {
    if (isOpen && documentId) {
      loadSnapshots();
    }
  }, [isOpen, documentId]);

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await SnapshotsClient.listSnapshots(documentId, 50, 0);
      setSnapshots(data.snapshots);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClick = (snapshot: Snapshot, action: RestoreAction) => {
    setSelectedSnapshot(snapshot);
    setRestoreAction(action);
    setShowRestoreDialog(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedSnapshot) return;

    try {
      // CRITICAL: Just call API - backend handles everything
      const result = await SnapshotsClient.restoreSnapshot(
        documentId,
        selectedSnapshot.id,
        restoreAction,
        restoreAction === 'new_document' ? `${selectedSnapshot.note || 'Restored'} (Copy)` : undefined,
        restoreAction === 'overwrite' // force flag
      );

      // Handle 409 Conflict (provider active)
      if ('error' in result && result.reason === 'provider_active') {
        toast({
          title: 'Cannot Overwrite',
          description: 'Document has active collaborators. Use "Restore as New Document" instead.',
          variant: 'destructive',
        });
        setShowRestoreDialog(false);
        return;
      }

      // Success
      if (result.success) {
        toast({
          title: 'Snapshot Restored',
          description: result.message,
        });
        
        setShowRestoreDialog(false);
        onClose();
        onRestoreComplete?.(result.new_document_id || undefined);
      }
    } catch (err) {
      toast({
        title: 'Restore Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              View and restore previous versions of this document
            </SheetDescription>
          </SheetHeader>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-180px)] mt-6">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading snapshots...
              </div>
            )}

            {!loading && snapshots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No snapshots available</p>
              </div>
            )}

            {!loading && snapshots.length > 0 && (
              <div className="space-y-4">
                {snapshots.map((snapshot) => (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    permissions={permissions}
                    onRestoreAsNew={() => handleRestoreClick(snapshot, 'new_document')}
                    onOverwrite={() => handleRestoreClick(snapshot, 'overwrite')}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {showRestoreDialog && selectedSnapshot && (
        <RestoreConfirmationDialog
          snapshot={selectedSnapshot}
          action={restoreAction}
          documentId={documentId}
          permissions={permissions}
          onConfirm={handleRestoreConfirm}
          onCancel={() => setShowRestoreDialog(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// Snapshot Card Component
// ============================================================================

interface SnapshotCardProps {
  snapshot: Snapshot;
  permissions: ReturnType<typeof useDocumentPermissions>;
  onRestoreAsNew: () => void;
  onOverwrite: () => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({
  snapshot,
  permissions,
  onRestoreAsNew,
  onOverwrite,
}) => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge variant="default">Manual</Badge>;
      case 'auto':
        return <Badge variant="secondary">Auto</Badge>;
      case 'restore-backup':
        return <Badge variant="outline">Backup</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {getTypeBadge(snapshot.type)}
            <span className="text-xs text-muted-foreground">
              {formatSize(snapshot.size_bytes)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{new Date(snapshot.created_at).toLocaleString()}</span>
          </div>

          {snapshot.note && (
            <p className="text-sm mt-2">{snapshot.note}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {permissions.canRestoreAsNew && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRestoreAsNew}
            className="flex-1"
          >
            Restore as New
          </Button>
        )}

        {permissions.canOverwriteRestore && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onOverwrite}
            className="flex-1"
          >
            Overwrite
          </Button>
        )}
      </div>
    </div>
  );
};


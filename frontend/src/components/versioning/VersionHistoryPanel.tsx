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

import React, { useState, useEffect, useCallback } from 'react';
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
import { Clock, FileText, AlertCircle, Camera, Eye } from 'lucide-react';
import { SnapshotsClient, type Snapshot, type RestoreAction } from '@/services/api/snapshotsClient';
import { useDocumentPermissions, type Role } from '@/hooks/useDocumentPermissions';
import { RestoreConfirmationDialog } from './RestoreConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { createManualHistorySnapshot } from '@/services/snapshots/snapshotClient';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { EnhancedVersionPreview } from '../editor/EnhancedVersionPreview';
import * as Y from 'yjs';

interface VersionHistoryPanelProps {
  documentId: string;
  userRole: Role;
  isAuthenticated: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: (newDocumentId?: string) => void;
  /** Optional: Document sync status to determine if it's local-only */
  syncStatus?: 'local' | 'synced' | 'syncing' | 'conflict' | 'pending' | 'modified' | 'error';
  /** Optional: Cloud ID if synced */
  cloudId?: string | null;
  /** Optional: Current document content for comparison */
  currentContent?: string;
  /** Optional: Callback to replace current version */
  onReplaceVersion?: (content: string) => void;
  /** Optional: Editor instance for getting HTML preview */
  editor?: any;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  documentId,
  userRole,
  isAuthenticated,
  isOpen,
  onClose,
  onRestoreComplete,
  syncStatus,
  cloudId,
  currentContent = '',
  onReplaceVersion,
  editor,
}) => {
  const permissions = useDocumentPermissions(userRole, isAuthenticated);
  const { toast } = useToast();
  
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [restoreAction, setRestoreAction] = useState<RestoreAction>('new_document');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  
  // Determine if document is local-only (not synced to cloud)
  const isLocalOnly = !cloudId && syncStatus === 'local';

  // Load snapshots when panel opens
  useEffect(() => {
    if (isOpen && documentId) {
      loadSnapshots();
    }
  }, [isOpen, documentId]);

  // Create manual snapshot
  const handleCreateSnapshot = useCallback(async () => {
    const timestamp = new Date().toISOString();

    const normalizedId = documentId.startsWith('doc_') 
      ? documentId.slice(4) 
      : documentId;
    

    setCreatingSnapshot(true);
    
    try {
      // Get binary snapshot from YjsDocumentManager
      const binarySnapshot = yjsDocumentManager.getYjsBinarySnapshot(documentId);
      
      if (!binarySnapshot) {
        console.error(`❌ [${new Date().toISOString()}] No binary snapshot available!`);
        toast({
          title: 'Cannot Create Snapshot',
          description: 'Document not currently loaded. Please open the document first.',
          variant: 'destructive',
        });
        return;
      }
      
      
      // Convert to base64
      const base64State = btoa(String.fromCharCode(...binarySnapshot));
      
      // Get HTML preview from editor if available
      let htmlPreview: string | undefined;
      
      if (editor) {
        try {
          htmlPreview = editor.getHTML();
        } catch (err) {
          console.error(`❌ [${new Date().toISOString()}] Could not get HTML preview from editor:`, err);
        }
      } else {
        console.error(`❌ [${new Date().toISOString()}] ⚠️ NO EDITOR AVAILABLE FOR HTML PREVIEW!`);
      }
 
      
      const success = await createManualHistorySnapshot(
        normalizedId,
        base64State,
        'Manual save point',
        htmlPreview
      );
      
      
      if (success) {
        toast({
          title: 'Snapshot Created',
          description: 'Your document version has been saved.',
        });
        await loadSnapshots();
      } else {
        toast({
          title: 'Failed to Create Snapshot',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(`💥 [${new Date().toISOString()}] SNAPSHOT CREATION ERROR:`, err);
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setCreatingSnapshot(false);
    }
  }, [documentId, toast, editor]);

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 🔥 FIX: Normalize document ID - strip doc_ prefix for backend API
      const normalizedId = documentId.startsWith('doc_') 
        ? documentId.slice(4) 
        : documentId;
      
      const data = await SnapshotsClient.listSnapshots(normalizedId, 50, 0);
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

    // 🔥 FIX: Normalize document ID for backend API
    const normalizedId = documentId.startsWith('doc_') 
      ? documentId.slice(4) 
      : documentId;

    try {
      // CRITICAL: Just call API - backend handles everything
      const result = await SnapshotsClient.restoreSnapshot(
        normalizedId,
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

          {/* Local-Only Document Notice */}
          {isLocalOnly && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Local Document</p>
                  <p className="text-sm mt-1">
                    This document is stored locally and hasn't been synced to the cloud. 
                    Version history is only available for cloud-synced documents.
                  </p>
                  <p className="text-sm mt-2">
                    To enable version history, sync this document to the cloud by clicking 
                    "Save to Cloud" in the menu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Snapshot Button - only show for cloud-synced documents */}
          {permissions.canEdit && !isLocalOnly && (
            <div className="mt-4">
              <Button
                onClick={handleCreateSnapshot}
                disabled={creatingSnapshot}
                className="w-full"
                variant="outline"
              >
                <Camera className="w-4 h-4 mr-2" />
                {creatingSnapshot ? 'Creating Snapshot...' : 'Create Snapshot Now'}
              </Button>
            </div>
          )}

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
                    onPreview={() => {
                      setPreviewSnapshot(snapshot);
                      setShowEnhancedPreview(true);
                    }}
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

      {/* Enhanced Preview Modal */}
      {showEnhancedPreview && previewSnapshot && (() => {
        const timestamp = new Date().toISOString();
        
        
        return (
          <EnhancedVersionPreview
            isOpen={showEnhancedPreview}
            onClose={() => setShowEnhancedPreview(false)}
            version={{
              version_number: snapshots.findIndex(s => s.id === previewSnapshot.id) + 1,
              title: previewSnapshot.note || 'Snapshot',
              content: previewSnapshot.html_preview || 'No content available for this snapshot',
              created_at: previewSnapshot.created_at,
              change_summary: previewSnapshot.note,
              word_count: Math.floor((previewSnapshot.size_bytes || 0) / 20),
              created_by_id: previewSnapshot.created_by || null,
            }}
            currentContent={currentContent}
            currentVersion={snapshots.length}
            onRestoreAsNew={async () => {
              setShowEnhancedPreview(false);
              handleRestoreClick(previewSnapshot, 'new_document');
            }}
            onReplaceCurrentVersion={async () => {
              setShowEnhancedPreview(false);
              if (onReplaceVersion && previewSnapshot.html_preview) {
                onReplaceVersion(previewSnapshot.html_preview);
              } else {
                handleRestoreClick(previewSnapshot, 'overwrite');
              }
            }}
            isAuthenticated={isAuthenticated}
          />
        );
      })()}
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
  onPreview: () => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({
  snapshot,
  permissions,
  onRestoreAsNew,
  onOverwrite,
  onPreview,
}) => {
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  
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
  
  // Get a text preview from HTML (strip tags)
  const getTextPreview = (html: string | null, maxLength: number = 150) => {
    if (!html) return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
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
            <p className="text-sm mt-2 font-medium">{snapshot.note}</p>
          )}
          
          {/* Text preview from HTML */}
          {snapshot.html_preview && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {getTextPreview(snapshot.html_preview, 100)}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {/* Enhanced Preview Button - Icon only for space */}
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          className="px-3"
          title="Preview Version"
        >
          <Eye className="w-4 h-4" />
        </Button>

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


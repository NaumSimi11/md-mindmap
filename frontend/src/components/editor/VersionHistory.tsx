/**
 * VersionHistory - Document version history panel
 * Shows WHO made WHAT changes WHEN (collaboration-ready)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, User, RotateCcw, Eye, X } from 'lucide-react';
import { documentVersionService, type DocumentVersion } from '@/services/api/DocumentVersionService';
// Simple time formatter (no external deps)
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};
import { toast } from 'sonner';

interface VersionHistoryProps {
  documentId: string;
  currentVersion: number;
  onRestore: (versionNumber: number) => void;
  onClose: () => void;
}

export function VersionHistory({ documentId, currentVersion, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const response = await documentVersionService.getVersions(documentId);
      setVersions(response.versions);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (version: DocumentVersion) => {
    setPreviewVersion(version);
    setShowPreview(true);
  };

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Restore to version ${versionNumber}? This will create a new version with the old content.`)) {
      return;
    }

    try {
      await documentVersionService.restoreVersion(documentId, versionNumber);
      toast.success(`Restored to version ${versionNumber}`);
      onRestore(versionNumber);
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  return (
    <>
      {/* Version List Panel */}
      <div className="w-80 border-l border-border bg-card flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {versions.length} versions
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Version List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No version history yet
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    version.version_number === currentVersion
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent border-border'
                  }`}
                >
                  {/* Version Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          Version {version.version_number}
                        </span>
                        {version.version_number === currentVersion && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(new Date(version.created_at))}
                      </div>
                    </div>
                  </div>

                  {/* WHO - Collaboration Info */}
                  {version.created_by_id && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <User className="h-3 w-3" />
                      <span>User {version.created_by_id.substring(0, 8)}</span>
                    </div>
                  )}

                  {/* WHAT - Change Summary */}
                  {version.change_summary && (
                    <div className="text-sm text-foreground mb-3 p-2 bg-muted/50 rounded">
                      "{version.change_summary}"
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{version.word_count} words</span>
                    {version.title !== versions[0]?.title && (
                      <span className="text-amber-600">Title changed</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(version)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    {version.version_number !== currentVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRestore(version.version_number)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Preview Modal */}
      {showPreview && previewVersion && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Version {previewVersion.version_number} - {previewVersion.title}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {formatTimeAgo(new Date(previewVersion.created_at))}
                {previewVersion.change_summary && ` - "${previewVersion.change_summary}"`}
              </div>
            </DialogHeader>

            <ScrollArea className="h-[60vh] border rounded-lg p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {previewVersion.content}
                </pre>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowPreview(false);
                handleRestore(previewVersion.version_number);
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


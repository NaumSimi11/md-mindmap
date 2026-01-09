/**
 * VersionHistory - Document version history panel
 * Shows WHO made WHAT changes WHEN (collaboration-ready)
 * 
 * 🔴 CRITICAL POINT #13: Dual Mode Support
 * - Guest mode: Load from GuestVersionManager (IndexedDB)
 * - Authenticated mode: Load from backend API
 * - MUST detect auth state and switch data source
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, RotateCcw, Eye, X } from 'lucide-react';
import { documentVersionService, type DocumentVersion } from '@/services/api/DocumentVersionService';
import { guestVersionManager } from '@/services/workspace-legacy/GuestVersionManager';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedVersionPreview } from './EnhancedVersionPreview';
import { toast } from 'sonner';

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

interface VersionHistoryProps {
  documentId: string;
  currentVersion: number;
  currentContent?: string; // Current document content for comparison
  onRestore: (versionNumber: number) => void;
  onReplaceVersion?: (content: string) => void; // Replace current version
  onClose: () => void;
}

export function VersionHistory({ 
  documentId, 
  currentVersion, 
  currentContent = '',
  onRestore, 
  onReplaceVersion,
  onClose 
}: VersionHistoryProps) {
  const { isAuthenticated } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [documentId, isAuthenticated]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);

      // 🔥 FIX: Normalize document ID - strip doc_ prefix for backend API
      const normalizedId = documentId.startsWith('doc_')
        ? documentId.slice(4)
        : documentId;

      if (isAuthenticated) {
        // AUTHENTICATED MODE: Load from backend API
        const response = await documentVersionService.getVersions(normalizedId);
        setVersions(response.versions);
      } else {
        // GUEST MODE: Load from GuestVersionManager (uses original ID)
        const guestVersions = guestVersionManager.getVersions(documentId);

        // Convert to DocumentVersion format
        const converted: DocumentVersion[] = guestVersions.versions.map(v => ({
          id: v.yjsDocId,
          document_id: documentId,
          version_number: v.versionNumber,
          title: '', // Not stored in guest mode
          content: '', // Loaded on demand
          change_summary: v.comment,
          word_count: v.wordCount,
          created_by_id: null,
          created_at: v.createdAt
        }));

        setVersions(converted);
      }
    } catch (error: any) {
      console.error('Failed to load versions:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to load version history';

      if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = 'Document not found or no version history available';
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        errorMessage = 'You do not have permission to view version history';
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = 'Please log in to view version history';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests - please try again later';
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (version: DocumentVersion) => {
    // 🔴 CRITICAL POINT #14: Content Loading for Preview
    // Guest mode: Need to load content from Yjs doc
    // Authenticated mode: Content already in version object
    
    setIsLoadingContent(true);
    
    try {
      if (!isAuthenticated && !version.content) {
        const content = await guestVersionManager.getVersionContent(documentId, version.version_number);
        
        if (content) {
          setPreviewVersion({ ...version, content });
        } else {
          toast.error('Failed to load version content');
          return;
        }
      } else {
        setPreviewVersion(version);
      }
      
      setShowPreview(true);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleRestoreAsNew = async () => {
    if (!previewVersion) return;

    try {
      if (isAuthenticated) {
        // AUTHENTICATED MODE: Use backend API
        await documentVersionService.restoreVersion(documentId, previewVersion.version_number);
        toast.success(`Created new document from version ${previewVersion.version_number}`);
      } else {
        // GUEST MODE: Restore from local version
        const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const success = await guestVersionManager.restoreVersionAsNew(
          documentId,
          previewVersion.version_number,
          newDocId
        );
        
        if (!success) {
          toast.error('Failed to create new document from version');
          return;
        }
        
        toast.success(`Created new document from version ${previewVersion.version_number}`);
      }

      onRestore(previewVersion.version_number);
      setShowPreview(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to restore version:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to restore version';

      if (error.message?.includes('409') || error.message?.includes('provider_active')) {
        errorMessage = 'Cannot restore while document is being edited by others';
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        errorMessage = 'You do not have permission to restore versions';
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = 'Version not found - it may have been deleted';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      }

      toast.error(errorMessage);
    }
  };

  const handleReplaceCurrentVersion = async () => {
    if (!previewVersion || !onReplaceVersion) return;

    try {
      if (isAuthenticated) {
        // AUTHENTICATED MODE: Use callback to replace content
        onReplaceVersion(previewVersion.content);
      } else {
        // GUEST MODE: Use guest version manager to restore
        const success = await guestVersionManager.restoreVersion(
          documentId,
          previewVersion.version_number
        );
        
        if (!success) {
          toast.error('Failed to replace current version');
          return;
        }
      }
      
      toast.success(`Replaced current version with version ${previewVersion.version_number}`);
      setShowPreview(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to replace version:', error);
      toast.error('Failed to replace current version');
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
                      disabled={isLoadingContent}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {isLoadingContent ? 'Loading...' : 'Preview'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Enhanced Preview Modal */}
      {showPreview && previewVersion && (
        <EnhancedVersionPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          version={previewVersion}
          currentContent={currentContent}
          currentVersion={currentVersion}
          onRestoreAsNew={handleRestoreAsNew}
          onReplaceCurrentVersion={handleReplaceCurrentVersion}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
}


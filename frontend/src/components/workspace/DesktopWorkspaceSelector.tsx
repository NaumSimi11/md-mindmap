import React, { useState, useEffect } from 'react';
import { Folder, Check, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { workspaceService } from '@/services/workspace-legacy/WorkspaceService';
import { usePlatform } from '@/contexts/PlatformContext';
import { toast } from 'sonner';

export const DesktopWorkspaceSelector: React.FC = () => {
  const { isDesktop } = usePlatform();
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);

  useEffect(() => {
    if (isDesktop) {
      const path = workspaceService.getDesktopWorkspacePath();
      setWorkspacePath(path);
    }
  }, [isDesktop]);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      const path = await workspaceService.selectDesktopWorkspaceFolder();
      if (path) {
        setWorkspacePath(path);
        toast.success(`Folder selected: ${path.split('/').pop()}`);
      }
    } catch (error) {
      console.error('Failed to select workspace folder:', error);
      toast.error('Failed to select folder');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSyncFiles = async () => {
    setIsSyncing(true);
    try {
      const count = await workspaceService.syncDesktopFolder();
      setLastSyncCount(count);
      
      if (count > 0) {
        toast.success(`Imported ${count} file${count === 1 ? '' : 's'}!`, {
          description: 'Check the sidebar to see your imported documents',
        });
        // Trigger a page refresh to show new files
        window.location.reload();
      } else {
        toast.info('No new files to import', {
          description: 'All files are already in your workspace',
        });
      }
    } catch (error) {
      console.error('Failed to sync files:', error);
      toast.error('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  };

  // Only show on desktop
  if (!isDesktop) {
    return null;
  }

  return (
    <div className="glass-card p-4 border border-border/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Folder className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Desktop Workspace</h3>
            {workspacePath ? (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {workspacePath}
                  </p>
                </div>
                {lastSyncCount !== null && (
                  <p className="text-xs text-green-600 mt-1">
                    Last sync: {lastSyncCount} file{lastSyncCount === 1 ? '' : 's'} imported
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Select a folder to sync your .md files
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workspacePath && (
            <Button
              onClick={handleSyncFiles}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Syncing..." : "Sync Files"}
            </Button>
          )}
          <Button
            onClick={handleSelectFolder}
            disabled={isSelecting}
            variant={workspacePath ? "outline" : "default"}
            size="sm"
          >
            {isSelecting ? "Selecting..." : workspacePath ? "Change" : "Select Folder"}
          </Button>
        </div>
      </div>

      {/* Info box */}
      {workspacePath && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Sync your existing .md files</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Click "Sync Files" to import all .md files from this folder into the sidebar.
                They'll be editable right here in the app!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

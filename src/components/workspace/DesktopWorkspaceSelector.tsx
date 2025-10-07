import React, { useState, useEffect } from 'react';
import { Folder, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { workspaceService } from '@/services/workspace/WorkspaceService';
import { usePlatform } from '@/contexts/PlatformContext';

export const DesktopWorkspaceSelector: React.FC = () => {
  const { isDesktop } = usePlatform();
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

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
      }
    } catch (error) {
      console.error('Failed to select workspace folder:', error);
    } finally {
      setIsSelecting(false);
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
              <div className="flex items-center gap-2 mt-1">
                <Check className="w-4 h-4 text-green-500" />
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {workspacePath}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Select a folder to save your documents
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSelectFolder}
          disabled={isSelecting}
          variant={workspacePath ? "outline" : "default"}
          size="sm"
        >
          {isSelecting ? "Selecting..." : workspacePath ? "Change Folder" : "Select Folder"}
        </Button>
      </div>
    </div>
  );
};

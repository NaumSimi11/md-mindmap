/**
 * FileWatcherIndicator
 * 
 * Shows file watching status and recent changes
 */

import { Eye, EyeOff, FileEdit, FilePlus, FileX } from 'lucide-react';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { isDesktop } from '@/utils/platform';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FileWatcherIndicator() {
  const { isWatching, recentChanges, clearRecentChanges } = useFileWatcher();

  // Only show in desktop mode
  if (!isDesktop()) {
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <FilePlus className="h-3.5 w-3.5 text-green-500" />;
      case 'modified':
        return <FileEdit className="h-3.5 w-3.5 text-blue-500" />;
      case 'deleted':
        return <FileX className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <FileEdit className="h-3.5 w-3.5" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'modified':
        return 'text-blue-600 dark:text-blue-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 relative"
          title={isWatching ? 'File watcher active' : 'File watcher inactive'}
        >
          {isWatching ? (
            <Eye className="h-4 w-4 text-green-500" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
          {recentChanges.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center">
              {recentChanges.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWatching ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <h4 className="font-semibold text-sm">
                File Watcher
              </h4>
            </div>
            {recentChanges.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentChanges}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="text-xs text-muted-foreground">
            {isWatching ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Watching for external changes
              </span>
            ) : (
              <span className="text-gray-500">Not watching</span>
            )}
          </div>

          {/* Recent Changes */}
          {recentChanges.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Recent Changes
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {recentChanges.map((change, index) => {
                    const fileName = change.path.split('/').pop() || change.path;
                    const time = new Date(change.timestamp).toLocaleTimeString();
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="mt-0.5">
                          {getEventIcon(change.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" title={fileName}>
                            {fileName}
                          </div>
                          <div className={`text-[10px] ${getEventColor(change.event_type)}`}>
                            {change.event_type} • {time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No recent changes
            </div>
          )}

          {/* Info */}
          <div className="text-[10px] text-muted-foreground border-t pt-2">
            💡 Changes made in VS Code, Obsidian, or other editors will be detected automatically
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


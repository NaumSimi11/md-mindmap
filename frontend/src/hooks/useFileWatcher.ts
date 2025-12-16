/**
 * useFileWatcher Hook
 * 
 * React hook to integrate file watching into components
 */

import { useEffect, useState, useCallback } from 'react';
import { fileWatcherService, type FileChangeEvent } from '@/services/tauri/FileWatcherService';
import { isDesktop } from '@/utils/platform';

export function useFileWatcher() {
  const [recentChanges, setRecentChanges] = useState<FileChangeEvent[]>([]);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (!isDesktop()) {
      return;
    }

    // Listen for file changes
    const unsubscribe = fileWatcherService.onFileChange((event) => {
      setRecentChanges(prev => [...prev.slice(-9), event]); // Keep last 10
    });

    setIsWatching(true);

    return () => {
      unsubscribe();
      setIsWatching(false);
    };
  }, []);

  const registerDocument = useCallback((documentId: string, filePath: string) => {
    if (isDesktop()) {
      fileWatcherService.registerOpenDocument(documentId, filePath);
    }
  }, []);

  const unregisterDocument = useCallback((documentId: string) => {
    if (isDesktop()) {
      fileWatcherService.unregisterOpenDocument(documentId);
    }
  }, []);

  const clearRecentChanges = useCallback(() => {
    setRecentChanges([]);
  }, []);

  return {
    isWatching,
    recentChanges,
    registerDocument,
    unregisterDocument,
    clearRecentChanges,
  };
}


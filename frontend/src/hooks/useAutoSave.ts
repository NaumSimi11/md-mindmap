import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { getStorageService } from '@/services/storage/StorageFactory';

interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number; // milliseconds
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const {
    enabled = true,
    delay = 1000, // 1 second default
    onSave,
    onError,
  } = options;

  const { content, currentDocument, markSaving, markSaved, hasUnsavedChanges } = useDocumentStore();
  const storage = getStorageService();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !currentDocument || !hasUnsavedChanges) {
      return;
    }

    // Don't save if content hasn't changed since last save
    if (content === lastSavedContentRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        markSaving(true);
        await storage.update(currentDocument.id, content);
        lastSavedContentRef.current = content;
        markSaved();
        onSave?.();
      } catch (error) {
        console.error('Auto-save failed:', error);
        markSaving(false);
        onError?.(error instanceof Error ? error : new Error('Auto-save failed'));
      }
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, currentDocument, hasUnsavedChanges, enabled, delay, storage, markSaving, markSaved, onSave, onError]);

  // Force save function (bypass debounce)
  const forceSave = async () => {
    if (!currentDocument) {
      throw new Error('No document to save');
    }

    try {
      markSaving(true);
      await storage.update(currentDocument.id, content);
      lastSavedContentRef.current = content;
      markSaved();
      onSave?.();
    } catch (error) {
      markSaving(false);
      onError?.(error instanceof Error ? error : new Error('Save failed'));
      throw error;
    }
  };

  return {
    forceSave,
  };
}


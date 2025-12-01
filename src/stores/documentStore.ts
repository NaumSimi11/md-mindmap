import { create } from 'zustand';
import type { StorageDocument } from '@/services/storage/IStorageService';

interface DocumentState {
  // Current document
  currentDocument: StorageDocument | null;
  
  // Document content (may be modified, unsaved)
  content: string;
  
  // Save status
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  setCurrentDocument: (document: StorageDocument) => void;
  updateContent: (content: string) => void;
  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocument: null,
  content: '',
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,

  setCurrentDocument: (document) => {
    set({
      currentDocument: document,
      content: document.content,
      hasUnsavedChanges: false,
      lastSaved: document.metadata.updatedAt,
    });
  },

  updateContent: (content) => {
    const currentContent = get().content;
    if (content !== currentContent) {
      set({
        content,
        hasUnsavedChanges: true,
      });
    }
  },

  markSaving: (saving) => {
    set({ isSaving: saving });
  },

  markSaved: () => {
    set({
      isSaving: false,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
    });
  },

  reset: () => {
    set({
      currentDocument: null,
      content: '',
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
    });
  },
}));


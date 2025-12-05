/**
 * AI Staging Store - Memory for Generated Content
 * 
 * This store holds AI-generated content BEFORE applying it to the document.
 * Enables preview → modify → accept workflow.
 */

import { create } from 'zustand';

export interface StagedSection {
  title: string;
  content: string;
  position?: 'start' | 'end' | { after: string } | { before: string };
}

export interface StagedContent {
  id: string;
  type: 'create_section' | 'edit_document' | 'multi_edit';
  
  // Original user request
  originalRequest: string;
  
  // Generated content (in memory, not applied yet)
  generatedContent: string; // Full markdown preview
  sections: StagedSection[];
  
  // Function call details
  functionCall?: {
    name: string;
    arguments: any;
  };
  
  // Metadata
  status: 'preview' | 'modifying' | 'accepted' | 'rejected';
  timestamp: Date;
  wordCount: number;
  sectionCount: number;
  
  // Friendly description
  description: string;
}

export interface ModificationRequest {
  stagedContentId: string;
  request: string;
  timestamp: Date;
}

interface AIStagingStore {
  // Current staged content (only one at a time)
  currentStaged: StagedContent | null;
  
  // History of modifications for current staged content
  modificationHistory: ModificationRequest[];
  
  // History of all staged items (for undo/redo)
  history: StagedContent[];
  
  // Actions
  stageContent: (content: Omit<StagedContent, 'id' | 'timestamp' | 'wordCount' | 'sectionCount' | 'status'>) => void;
  updateStaged: (updates: Partial<StagedContent>) => void;
  acceptStaged: () => StagedContent | null;
  rejectStaged: () => void;
  modifyStaged: (request: string) => void;
  clearStaged: () => void;
  
  // Preview controls
  isPreviewExpanded: boolean;
  setPreviewExpanded: (expanded: boolean) => void;
}

export const useAIStagingStore = create<AIStagingStore>((set, get) => ({
  currentStaged: null,
  modificationHistory: [],
  history: [],
  isPreviewExpanded: false,

  stageContent: (content) => {
    const wordCount = content.generatedContent.split(/\s+/).length;
    const sectionCount = content.sections.length;
    
    const stagedContent: StagedContent = {
      ...content,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'preview',
      wordCount,
      sectionCount,
    };

    set({
      currentStaged: stagedContent,
      modificationHistory: [],
    });
  },

  updateStaged: (updates) => {
    const current = get().currentStaged;
    if (!current) return;

    const updated: StagedContent = {
      ...current,
      ...updates,
      wordCount: updates.generatedContent 
        ? updates.generatedContent.split(/\s+/).length 
        : current.wordCount,
      sectionCount: updates.sections?.length ?? current.sectionCount,
    };

    set({ currentStaged: updated });
  },

  acceptStaged: () => {
    const current = get().currentStaged;
    if (!current) return null;

    const accepted = {
      ...current,
      status: 'accepted' as const,
    };

    set((state) => ({
      currentStaged: null,
      modificationHistory: [],
      history: [...state.history, accepted],
    }));

    return accepted;
  },

  rejectStaged: () => {
    const current = get().currentStaged;
    if (!current) return;

    const rejected = {
      ...current,
      status: 'rejected' as const,
    };

    set((state) => ({
      currentStaged: null,
      modificationHistory: [],
      history: [...state.history, rejected],
    }));
  },

  modifyStaged: (request) => {
    const current = get().currentStaged;
    if (!current) return;

    const modification: ModificationRequest = {
      stagedContentId: current.id,
      request,
      timestamp: new Date(),
    };

    set((state) => ({
      modificationHistory: [...state.modificationHistory, modification],
      currentStaged: current ? { ...current, status: 'modifying' } : null,
    }));
  },

  clearStaged: () => {
    set({
      currentStaged: null,
      modificationHistory: [],
    });
  },

  setPreviewExpanded: (expanded) => {
    set({ isPreviewExpanded: expanded });
  },
}));


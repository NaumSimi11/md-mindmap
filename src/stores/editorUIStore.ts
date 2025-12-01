import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface EditorUIState {
  // Sidebar State
  isSidebarOpen: boolean;
  isMinimized: boolean;

  // Editor Mode
  editorMode: 'wysiwyg' | 'markdown';

  // Modal States
  showAIModal: boolean;
  showLinkModal: boolean;
  showImageModal: boolean;
  showDiagramMenu: boolean;
  showTableModal: boolean;
  showTableMenu: boolean;
  showMindmapChoiceModal: boolean;
  showKeyboardShortcuts: boolean;

  // Table Menu Position
  tableMenuPosition: { x: number; y: number };

  // Actions - Sidebar
  toggleSidebar: () => void;
  toggleMinimized: () => void;

  // Actions - Editor Mode
  setEditorMode: (mode: 'wysiwyg' | 'markdown') => void;
  toggleEditorMode: () => void;

  // Actions - Modals
  setShowAIModal: (show: boolean) => void;
  setShowLinkModal: (show: boolean) => void;
  setShowImageModal: (show: boolean) => void;
  setShowDiagramMenu: (show: boolean) => void;
  setShowTableModal: (show: boolean) => void;
  setShowTableMenu: (show: boolean, position?: { x: number; y: number }) => void;
  setShowMindmapChoiceModal: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
}

export const useEditorUIStore = create<EditorUIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isSidebarOpen: false,
        isMinimized: false,
        editorMode: 'wysiwyg',
        showAIModal: false,
        showLinkModal: false,
        showImageModal: false,
        showDiagramMenu: false,
        showTableModal: false,
        showTableMenu: false,
        showMindmapChoiceModal: false,
        showKeyboardShortcuts: false,
        tableMenuPosition: { x: 0, y: 0 },

        // Actions - Sidebar
        toggleSidebar: () => set((state) => ({
          isSidebarOpen: !state.isSidebarOpen
        })),

        toggleMinimized: () => set((state) => ({
          isMinimized: !state.isMinimized
        })),

        // Actions - Editor Mode
        setEditorMode: (mode) => set({ editorMode: mode }),

        toggleEditorMode: () => set((state) => ({
          editorMode: state.editorMode === 'wysiwyg' ? 'markdown' : 'wysiwyg'
        })),

        // Actions - Modals
        setShowAIModal: (show) => set({ showAIModal: show }),
        setShowLinkModal: (show) => set({ showLinkModal: show }),
        setShowImageModal: (show) => set({ showImageModal: show }),

        setShowDiagramMenu: (show) => set({ showDiagramMenu: show }),

        setShowTableModal: (show) => set({ showTableModal: show }),

        setShowTableMenu: (show, position) => set({
          showTableMenu: show,
          ...(position && { tableMenuPosition: position })
        }),

        setShowMindmapChoiceModal: (show) => set({ showMindmapChoiceModal: show }),

        setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),
      }),
      { name: 'editor-ui-store' }
    )
  )
);


import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SlashMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    searchQuery: string;
    cursorPosition: number;
}

export interface BubbleMenuState {
    isVisible: boolean;
    position: { x: number; y: number };
    selectedText: string;
    selectionStart: number;
    selectionEnd: number;
}

export interface EditorMenuState {
    visible: boolean;
    x: number;
    y: number;
    insideMermaid: boolean;
    selection: string;
}

interface EditorState {
    // Existing UI State (from WYSIWYGEditor)
    isSidebarOpen: boolean;
    activeModal: 'none' | 'ai' | 'settings' | 'export' | 'diagram' | 'table' | 'image';
    isEditable: boolean;
    wordCount: number;
    currentSection: string | null;
    selectedText: string | null;

    // New state from Editor.tsx (14 useState hooks)
    documentTitle: string;
    markdownContent: string;
    showPreview: boolean;
    activeTab: string;
    showAIModal: boolean;
    isMenuOpen: boolean;
    isMobilePreviewMode: boolean;
    aiOpen: boolean;
    showMindmapModal: boolean;
    mindmapModalMode: 'headings' | 'selection';
    mindmapSourceText: string;
    showInfoModal: boolean;
    showRecentFiles: boolean;
    showMoreOptions: boolean;
    showExportOptions: boolean;
    slashMenu: SlashMenuState;
    bubbleMenu: BubbleMenuState;
    editorMenu: EditorMenuState;
    aiSuggestionsEnabled: boolean;
    cursorPosition: number;

    // Existing Actions
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    openModal: (modal: EditorState['activeModal']) => void;
    closeModal: () => void;
    setEditable: (value: boolean) => void;
    setWordCount: (count: number) => void;
    setCurrentSection: (section: string | null) => void;
    setSelectedText: (text: string | null) => void;

    // New Actions for Editor.tsx
    setDocumentTitle: (title: string) => void;
    setMarkdownContent: (content: string) => void;
    setShowPreview: (show: boolean) => void;
    setActiveTab: (tab: string) => void;
    setShowAIModal: (show: boolean) => void;
    setIsMenuOpen: (open: boolean) => void;
    setIsMobilePreviewMode: (mode: boolean) => void;
    setAiOpen: (open: boolean) => void;
    setAiSuggestionsEnabled: (enabled: boolean) => void;
    setShowMindmapModal: (show: boolean) => void;
    setMindmapModalMode: (mode: 'headings' | 'selection') => void;
    setMindmapSourceText: (text: string) => void;
    setShowInfoModal: (show: boolean) => void;
    setShowRecentFiles: (show: boolean) => void;
    setShowMoreOptions: (show: boolean) => void;
    setShowExportOptions: (show: boolean) => void;
    setSlashMenu: (menu: Partial<SlashMenuState>) => void;
    setBubbleMenu: (menu: Partial<BubbleMenuState>) => void;
    setEditorMenu: (menu: Partial<EditorMenuState>) => void;
    setCursorPosition: (position: number) => void;

    // Batch actions
    togglePreview: () => void;
    toggleMobilePreview: () => void;
    closeAllModals: () => void;
    resetSlashMenu: () => void;
    resetBubbleMenu: () => void;

    // Functional update wrappers (Senior Pattern)
    appendMarkdownContent: (text: string) => void;
    updateSlashMenu: (updates: Partial<SlashMenuState>) => void;
    updateBubbleMenu: (updates: Partial<BubbleMenuState>) => void;
    updateEditorMenu: (updates: Partial<EditorMenuState>) => void;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        (set) => ({
            // Existing Initial State
            isSidebarOpen: true,
            activeModal: 'none',
            isEditable: true,
            wordCount: 0,
            currentSection: null,
            selectedText: null,

            // New Initial State from Editor.tsx
            documentTitle: "Untitled Document",
            markdownContent: "",
            showPreview: true,
            activeTab: "editor",
            showAIModal: false,
            isMenuOpen: false,
            isMobilePreviewMode: false,
            aiOpen: false,
            showMindmapModal: false,
            mindmapModalMode: 'headings',
            mindmapSourceText: "",
            showInfoModal: false,
            showRecentFiles: false,
            showMoreOptions: false,
            showExportOptions: false,
            slashMenu: {
                isOpen: false,
                position: { x: 0, y: 0 },
                searchQuery: '',
                cursorPosition: 0,
            },
            bubbleMenu: {
                isVisible: false,
                position: { x: 0, y: 0 },
                selectedText: '',
                selectionStart: 0,
                selectionEnd: 0,
            },
            editorMenu: {
                visible: false,
                x: 0,
                y: 0,
                insideMermaid: false,
                selection: '',
            },
            aiSuggestionsEnabled: false,
            cursorPosition: 0,

            // Existing Actions
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
            openModal: (modal) => set({ activeModal: modal }),
            closeModal: () => set({ activeModal: 'none' }),
            setEditable: (value) => set({ isEditable: value }),
            setWordCount: (count) => set({ wordCount: count }),
            setCurrentSection: (section) => set({ currentSection: section }),
            setSelectedText: (text) => set({ selectedText: text }),

            // New Actions for Editor.tsx
            setDocumentTitle: (title) => set({ documentTitle: title }),
            setMarkdownContent: (content) => set({ markdownContent: content }),
            setShowPreview: (show) => set({ showPreview: show }),
            setActiveTab: (tab) => set({ activeTab: tab }),
            setShowAIModal: (show) => set({ showAIModal: show }),
            setIsMenuOpen: (open) => set({ isMenuOpen: open }),
            setIsMobilePreviewMode: (mode) => set({ isMobilePreviewMode: mode }),
            setAiOpen: (open) => set({ aiOpen: open }),
            setAiSuggestionsEnabled: (enabled) => set({ aiSuggestionsEnabled: enabled }),
            setShowMindmapModal: (show) => set({ showMindmapModal: show }),
            setMindmapModalMode: (mode) => set({ mindmapModalMode: mode }),
            setMindmapSourceText: (text) => set({ mindmapSourceText: text }),
            setShowInfoModal: (show) => set({ showInfoModal: show }),
            setShowRecentFiles: (show) => set({ showRecentFiles: show }),
            setShowMoreOptions: (show) => set({ showMoreOptions: show }),
            setShowExportOptions: (show) => set({ showExportOptions: show }),
            setSlashMenu: (menu) => set((state) => ({ slashMenu: { ...state.slashMenu, ...menu } })),
            setBubbleMenu: (menu) => set((state) => ({ bubbleMenu: { ...state.bubbleMenu, ...menu } })),
            setEditorMenu: (menu) => set((state) => ({ editorMenu: { ...state.editorMenu, ...menu } })),
            setCursorPosition: (position) => set({ cursorPosition: position }),

            // Batch actions
            togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
            toggleMobilePreview: () => set((state) => ({ isMobilePreviewMode: !state.isMobilePreviewMode })),
            closeAllModals: () => set({
                showAIModal: false,
                showMindmapModal: false,
                showInfoModal: false,
                showRecentFiles: false,
                showMoreOptions: false,
                showExportOptions: false,
                aiOpen: false,
                activeModal: 'none',
            }),
            resetSlashMenu: () => set({
                slashMenu: {
                    isOpen: false,
                    position: { x: 0, y: 0 },
                    searchQuery: '',
                    cursorPosition: 0,
                },
            }),
            resetBubbleMenu: () => set({
                bubbleMenu: {
                    isVisible: false,
                    position: { x: 0, y: 0 },
                    selectedText: '',
                    selectionStart: 0,
                    selectionEnd: 0,
                },
            }),

            // Functional update wrappers
            appendMarkdownContent: (text) => set((state) => ({ markdownContent: state.markdownContent + text })),
            updateSlashMenu: (updates) => set((state) => ({ slashMenu: { ...state.slashMenu, ...updates } })),
            updateBubbleMenu: (updates) => set((state) => ({ bubbleMenu: { ...state.bubbleMenu, ...updates } })),
            updateEditorMenu: (updates) => set((state) => ({ editorMenu: { ...state.editorMenu, ...updates } })),
        }),
        { name: 'EditorStore' }
    )
);

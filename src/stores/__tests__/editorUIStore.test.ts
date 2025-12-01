import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorUIStore } from '../editorUIStore';

describe('editorUIStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorUIStore.setState({
      isSidebarOpen: false,
      isMinimized: false,
      editorMode: 'wysiwyg',
      showAIModal: false,
      showDiagramMenu: false,
      showTableModal: false,
      showTableMenu: false,
      showMindmapChoiceModal: false,
      showKeyboardShortcuts: false,
      tableMenuPosition: { x: 0, y: 0 },
    });
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useEditorUIStore.getState();
    
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(false);
    
    toggleSidebar();
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(true);
    
    toggleSidebar();
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(false);
  });

  it('should toggle minimized state', () => {
    const { toggleMinimized } = useEditorUIStore.getState();
    
    expect(useEditorUIStore.getState().isMinimized).toBe(false);
    
    toggleMinimized();
    expect(useEditorUIStore.getState().isMinimized).toBe(true);
    
    toggleMinimized();
    expect(useEditorUIStore.getState().isMinimized).toBe(false);
  });

  it('should set AI modal visibility', () => {
    const { setShowAIModal } = useEditorUIStore.getState();
    
    setShowAIModal(true);
    expect(useEditorUIStore.getState().showAIModal).toBe(true);
    
    setShowAIModal(false);
    expect(useEditorUIStore.getState().showAIModal).toBe(false);
  });

  it('should set diagram menu visibility', () => {
    const { setShowDiagramMenu } = useEditorUIStore.getState();
    
    setShowDiagramMenu(true);
    expect(useEditorUIStore.getState().showDiagramMenu).toBe(true);
    
    setShowDiagramMenu(false);
    expect(useEditorUIStore.getState().showDiagramMenu).toBe(false);
  });

  it('should set table modal visibility', () => {
    const { setShowTableModal } = useEditorUIStore.getState();
    
    setShowTableModal(true);
    expect(useEditorUIStore.getState().showTableModal).toBe(true);
    
    setShowTableModal(false);
    expect(useEditorUIStore.getState().showTableModal).toBe(false);
  });

  it('should set table menu visibility and position', () => {
    const { setShowTableMenu } = useEditorUIStore.getState();
    
    setShowTableMenu(true, { x: 100, y: 200 });
    expect(useEditorUIStore.getState().showTableMenu).toBe(true);
    expect(useEditorUIStore.getState().tableMenuPosition).toEqual({ x: 100, y: 200 });
    
    setShowTableMenu(false);
    expect(useEditorUIStore.getState().showTableMenu).toBe(false);
  });

  it('should set mindmap choice modal visibility (CRITICAL)', () => {
    const { setShowMindmapChoiceModal } = useEditorUIStore.getState();
    
    setShowMindmapChoiceModal(true);
    expect(useEditorUIStore.getState().showMindmapChoiceModal).toBe(true);
    
    setShowMindmapChoiceModal(false);
    expect(useEditorUIStore.getState().showMindmapChoiceModal).toBe(false);
  });

  it('should set keyboard shortcuts visibility', () => {
    const { setShowKeyboardShortcuts } = useEditorUIStore.getState();
    
    setShowKeyboardShortcuts(true);
    expect(useEditorUIStore.getState().showKeyboardShortcuts).toBe(true);
    
    setShowKeyboardShortcuts(false);
    expect(useEditorUIStore.getState().showKeyboardShortcuts).toBe(false);
  });

  it('should set editor mode', () => {
    const { setEditorMode } = useEditorUIStore.getState();
    
    expect(useEditorUIStore.getState().editorMode).toBe('wysiwyg');
    
    setEditorMode('markdown');
    expect(useEditorUIStore.getState().editorMode).toBe('markdown');
    
    setEditorMode('wysiwyg');
    expect(useEditorUIStore.getState().editorMode).toBe('wysiwyg');
  });

  it('should toggle editor mode', () => {
    const { toggleEditorMode } = useEditorUIStore.getState();
    
    expect(useEditorUIStore.getState().editorMode).toBe('wysiwyg');
    
    toggleEditorMode();
    expect(useEditorUIStore.getState().editorMode).toBe('markdown');
    
    toggleEditorMode();
    expect(useEditorUIStore.getState().editorMode).toBe('wysiwyg');
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore';
import type { StorageDocument } from '@/services/storage/IStorageService';

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      currentDocument: null,
      content: '',
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
    });
  });

  it('should set current document', () => {
    const mockDoc: StorageDocument = {
      id: 'test-id',
      title: 'Test Doc',
      content: 'Test content',
      metadata: {
        id: 'test-id',
        title: 'Test Doc',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 12,
      },
    };

    const { setCurrentDocument } = useDocumentStore.getState();
    setCurrentDocument(mockDoc);

    const state = useDocumentStore.getState();
    expect(state.currentDocument).toEqual(mockDoc);
    expect(state.content).toBe('Test content');
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('should update content and mark as unsaved', () => {
    const mockDoc: StorageDocument = {
      id: 'test-id',
      title: 'Test Doc',
      content: 'Original content',
      metadata: {
        id: 'test-id',
        title: 'Test Doc',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 16,
      },
    };

    const { setCurrentDocument, updateContent } = useDocumentStore.getState();
    setCurrentDocument(mockDoc);
    updateContent('Modified content');

    const state = useDocumentStore.getState();
    expect(state.content).toBe('Modified content');
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('should mark document as saving', () => {
    const { markSaving } = useDocumentStore.getState();
    markSaving(true);

    expect(useDocumentStore.getState().isSaving).toBe(true);

    markSaving(false);
    expect(useDocumentStore.getState().isSaving).toBe(false);
  });

  it('should mark document as saved', () => {
    const { updateContent, markSaved } = useDocumentStore.getState();
    
    // Simulate editing
    updateContent('New content');
    expect(useDocumentStore.getState().hasUnsavedChanges).toBe(true);

    // Mark as saved
    markSaved();
    const state = useDocumentStore.getState();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.isSaving).toBe(false);
    expect(state.lastSaved).toBeInstanceOf(Date);
  });

  it('should reset state', () => {
    const mockDoc: StorageDocument = {
      id: 'test-id',
      title: 'Test Doc',
      content: 'Test content',
      metadata: {
        id: 'test-id',
        title: 'Test Doc',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 12,
      },
    };

    const { setCurrentDocument, updateContent, reset } = useDocumentStore.getState();
    setCurrentDocument(mockDoc);
    updateContent('Modified');

    reset();

    const state = useDocumentStore.getState();
    expect(state.currentDocument).toBeNull();
    expect(state.content).toBe('');
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.lastSaved).toBeNull();
  });

  it('should not mark as unsaved when content is same', () => {
    const { updateContent } = useDocumentStore.getState();
    
    updateContent('Same content');
    expect(useDocumentStore.getState().hasUnsavedChanges).toBe(true);
    
    // Reset unsaved flag
    useDocumentStore.setState({ hasUnsavedChanges: false });
    
    // Update with same content
    updateContent('Same content');
    expect(useDocumentStore.getState().hasUnsavedChanges).toBe(false);
  });
});


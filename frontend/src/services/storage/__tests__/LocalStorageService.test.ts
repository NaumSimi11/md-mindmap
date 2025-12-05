import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageService } from '../LocalStorageService';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let originalLocalStorage: Storage;

  // Mock localStorage
  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    const localStorageMock: Record<string, string> = {};
    
    global.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      },
      key: (index: number) => Object.keys(localStorageMock)[index] || null,
      length: Object.keys(localStorageMock).length,
    } as Storage;

    service = new LocalStorageService();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('should create a document', async () => {
    const doc = await service.create('Test Doc', 'Test content');
    
    expect(doc.id).toBeTruthy();
    expect(doc.title).toBe('Test Doc');
    expect(doc.content).toBe('Test content');
    expect(doc.metadata.createdAt).toBeInstanceOf(Date);
    expect(doc.metadata.updatedAt).toBeInstanceOf(Date);
  });

  it('should read a document', async () => {
    const created = await service.create('Test Doc', 'Test content');
    const read = await service.read(created.id);
    
    expect(read).not.toBeNull();
    expect(read!.id).toBe(created.id);
    expect(read!.title).toBe('Test Doc');
    expect(read!.content).toBe('Test content');
  });

  it('should return null for non-existent document', async () => {
    const doc = await service.read('non-existent-id');
    expect(doc).toBeNull();
  });

  it('should update a document', async () => {
    const created = await service.create('Test Doc', 'Original content');
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await service.update(created.id, 'Updated content');
    
    const updated = await service.read(created.id);
    expect(updated!.content).toBe('Updated content');
    expect(updated!.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.metadata.updatedAt.getTime()
    );
  });

  it('should delete a document', async () => {
    const created = await service.create('Test Doc', 'Test content');
    await service.delete(created.id);
    
    const deleted = await service.read(created.id);
    expect(deleted).toBeNull();
  });

  it('should list all documents', async () => {
    await service.create('Doc 1', 'Content 1');
    await new Promise(resolve => setTimeout(resolve, 5));
    await service.create('Doc 2', 'Content 2');
    await new Promise(resolve => setTimeout(resolve, 5));
    await service.create('Doc 3', 'Content 3');
    
    const list = await service.list();
    expect(list).toHaveLength(3);
    expect(list[0].title).toBe('Doc 3'); // Most recent first
    expect(list[2].title).toBe('Doc 1'); // Oldest last
  });

  it('should search documents by title', async () => {
    await service.create('Important Doc', 'Some content');
    await service.create('Another Doc', 'Other content');
    await service.create('Important Note', 'More content');
    
    const results = await service.search('important');
    expect(results).toHaveLength(2);
  });

  it('should search documents by content', async () => {
    await service.create('Doc 1', 'JavaScript is awesome');
    await service.create('Doc 2', 'Python is great');
    await service.create('Doc 3', 'JavaScript and TypeScript');
    
    const results = await service.search('javascript');
    expect(results).toHaveLength(2);
  });

  it('should update metadata', async () => {
    const doc = await service.create('Original Title', 'Content');
    
    await service.updateMetadata(doc.id, {
      title: 'Updated Title',
      tags: ['tag1', 'tag2'],
    });
    
    const updated = await service.read(doc.id);
    expect(updated!.title).toBe('Updated Title');
    expect(updated!.metadata.tags).toEqual(['tag1', 'tag2']);
  });

  it('should report storage info', async () => {
    await service.create('Test', 'Content');
    
    const info = await service.getStorageInfo();
    expect(info.type).toBe('local');
    expect(info.used).toBeGreaterThan(0);
    expect(info.total).toBeGreaterThan(info.used);
  });
});


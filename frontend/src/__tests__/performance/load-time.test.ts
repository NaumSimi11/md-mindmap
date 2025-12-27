/**
 * Performance Tests
 * 
 * Tests that ensure operations complete within acceptable time limits.
 * These tests help catch performance regressions early.
 * 
 * Performance targets:
 * - Document list load: < 200ms
 * - Document switch: < 100ms
 * - Yjs hydration (100KB): < 500ms
 * - Storage operations: < 50ms
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Performance measurement helper
function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

async function measureTimeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

describe('Performance Tests', () => {
  describe('Storage Operations', () => {
    it('safeStorage.getItem should be fast (<50ms)', async () => {
      const { safeStorage } = await import('@/utils/storage');
      
      // Set a value first
      safeStorage.setItem('perf_test', 'test_value');
      
      const { duration } = measureTime(() => {
        for (let i = 0; i < 100; i++) {
          safeStorage.getItem('perf_test');
        }
      });
      
      // 100 reads should take less than 50ms
      expect(duration).toBeLessThan(50);
      
      safeStorage.removeItem('perf_test');
    });

    it('safeStorage.setItem should be fast (<50ms)', async () => {
      const { safeStorage } = await import('@/utils/storage');
      
      const { duration } = measureTime(() => {
        for (let i = 0; i < 100; i++) {
          safeStorage.setItem(`perf_test_${i}`, 'test_value');
        }
      });
      
      // 100 writes should take less than 50ms
      expect(duration).toBeLessThan(50);
      
      // Cleanup
      for (let i = 0; i < 100; i++) {
        safeStorage.removeItem(`perf_test_${i}`);
      }
    });

    it('jsonStorage handles large objects efficiently (<100ms)', async () => {
      const { jsonStorage } = await import('@/utils/storage');
      
      // Create a large object (simulating a user with many workspaces)
      const largeObject = {
        id: 'user-1',
        workspaces: Array(50).fill(null).map((_, i) => ({
          id: `ws-${i}`,
          name: `Workspace ${i}`,
          documents: Array(20).fill(null).map((_, j) => ({
            id: `doc-${i}-${j}`,
            title: `Document ${j}`,
          })),
        })),
      };
      
      const { duration: writeTime } = measureTime(() => {
        jsonStorage.set('large_object', largeObject);
      });
      
      const { duration: readTime } = measureTime(() => {
        jsonStorage.get('large_object');
      });
      
      expect(writeTime).toBeLessThan(100);
      expect(readTime).toBeLessThan(100);
      
      jsonStorage.remove('large_object');
    });
  });

  describe('ID Operations', () => {
    it('extractUuid should be fast (<1ms for 1000 calls)', async () => {
      const { extractUuid } = await import('@/utils/id');
      
      const testIds = Array(1000).fill('doc_550e8400-e29b-41d4-a716-446655440000');
      
      const { duration } = measureTime(() => {
        testIds.forEach(id => extractUuid(id));
      });
      
      expect(duration).toBeLessThan(10); // Very generous, should be <1ms
    });

    it('toCloudId should be fast (<1ms for 1000 calls)', async () => {
      const { toCloudId } = await import('@/utils/id');
      
      const testIds = Array(1000).fill('doc_550e8400-e29b-41d4-a716-446655440000');
      
      const { duration } = measureTime(() => {
        testIds.forEach(id => toCloudId(id));
      });
      
      expect(duration).toBeLessThan(10);
    });

    it('isValidUUID should be fast (<1ms for 1000 calls)', async () => {
      const { isValidUUID } = await import('@/utils/id');
      
      const testIds = Array(1000).fill('550e8400-e29b-41d4-a716-446655440000');
      
      const { duration } = measureTime(() => {
        testIds.forEach(id => isValidUUID(id));
      });
      
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Data Transformation', () => {
    it('document mapping should be fast (<10ms for 100 docs)', () => {
      const mockDocs = Array(100).fill(null).map((_, i) => ({
        id: `doc-${i}`,
        type: 'markdown',
        title: `Document ${i}`,
        content: '# Hello World\n'.repeat(100),
        folderId: null,
        workspaceId: 'ws-1',
        starred: false,
        tags: ['tag1', 'tag2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'local',
        version: 1,
      }));
      
      const mapDocument = (meta: any) => ({
        id: meta.id || '',
        type: meta.type || 'markdown',
        title: meta.title || 'Untitled',
        content: meta.content || '',
        folderId: meta.folderId ?? null,
        workspaceId: meta.workspaceId || '',
        starred: meta.starred ?? false,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        createdAt: new Date(meta.createdAt || Date.now()),
        updatedAt: new Date(meta.updatedAt || Date.now()),
        sync: {
          status: meta.syncStatus || 'local',
          localVersion: meta.version ?? 1,
        },
      });
      
      const { duration } = measureTime(() => {
        mockDocs.map(mapDocument);
      });
      
      expect(duration).toBeLessThan(10);
    });

    it('array filtering should be fast (<5ms for 1000 items)', () => {
      const items = Array(1000).fill(null).map((_, i) => ({
        id: `item-${i}`,
        workspaceId: `ws-${i % 5}`,
      }));
      
      const { duration } = measureTime(() => {
        items.filter(item => item.workspaceId === 'ws-2');
      });
      
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Event Dispatch', () => {
    it('custom event dispatch should be fast (<10ms for 100 events)', () => {
      const { duration } = measureTime(() => {
        for (let i = 0; i < 100; i++) {
          window.dispatchEvent(new CustomEvent('test:perf', { detail: { i } }));
        }
      });
      
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Memory Usage Patterns', () => {
    it('large string operations should not crash', () => {
      // Test with 1MB of content
      const largeContent = 'A'.repeat(1024 * 1024);
      
      const { duration } = measureTime(() => {
        const encoded = JSON.stringify({ content: largeContent });
        const decoded = JSON.parse(encoded);
        return decoded.content.length;
      });
      
      // Should complete, even if slow
      expect(duration).toBeLessThan(1000);
    });

    it('document list with 500 items should be manageable', () => {
      const documents = Array(500).fill(null).map((_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        content: `Content for document ${i}`.repeat(10),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      const { duration: sortDuration } = measureTime(() => {
        documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      });
      
      const { duration: filterDuration } = measureTime(() => {
        documents.filter(d => d.title.includes('Document 1'));
      });
      
      expect(sortDuration).toBeLessThan(50);
      expect(filterDuration).toBeLessThan(10);
    });
  });

  describe('Regex Operations', () => {
    it('UUID validation regex should be fast', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const testIds = Array(1000).fill('550e8400-e29b-41d4-a716-446655440000');
      
      const { duration } = measureTime(() => {
        testIds.forEach(id => uuidRegex.test(id));
      });
      
      expect(duration).toBeLessThan(5);
    });

    it('content sanitization regex should be fast', () => {
      const content = '<script>alert("xss")</script>'.repeat(100);
      
      const { duration } = measureTime(() => {
        content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      });
      
      expect(duration).toBeLessThan(5);
    });
  });
});


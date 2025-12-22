import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Test environment storage mocks
// ---------------------------------------------------------------------------
// Our app uses `idb` (openDB) for the canonical IndexedDB storage provider.
// happy-dom does not implement IndexedDB. Instead of a broken stub, we mock `idb`
// with an in-memory implementation that supports the subset of methods we use.
const __idbStores = new Map<string, Map<string, any>>();

vi.mock('idb', () => {
  return {
    openDB: async (dbName: string, _version: number, opts?: any) => {
      // Ensure store exists
      if (!__idbStores.has(dbName)) __idbStores.set(dbName, new Map());

      // Simulate upgrade callback
      if (opts?.upgrade) {
        const fakeDb = {
          objectStoreNames: { contains: () => true },
          createObjectStore: () => undefined,
        };
        opts.upgrade(fakeDb);
      }

      const store = __idbStores.get(dbName)!;

      return {
        async get(_storeName: string, key: string) {
          return store.get(key);
        },
        async put(_storeName: string, value: any) {
          store.set(value.key, value);
        },
        async delete(_storeName: string, key: string) {
          store.delete(key);
        },
        async getAllKeys(_storeName: string) {
          return Array.from(store.keys());
        },
        async clear(_storeName: string) {
          store.clear();
        },
      };
    },
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Add custom matchers if needed
expect.extend({
  toBeRoundTripEqual(received: string, expected: string) {
    const normalize = (str: string) =>
      str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+$/gm, '');

    const normalizedReceived = normalize(received);
    const normalizedExpected = normalize(expected);
    const pass = normalizedReceived === normalizedExpected;

    return {
      pass,
      message: () =>
        pass
          ? `Expected markdown NOT to match after round-trip conversion`
          : `Expected markdown to match after round-trip conversion\n\nExpected:\n${normalizedExpected}\n\nReceived:\n${normalizedReceived}`,
    };
  },
});

// Extend expect types
declare module 'vitest' {
  interface Assertion {
    toBeRoundTripEqual(expected: string): void;
  }
}


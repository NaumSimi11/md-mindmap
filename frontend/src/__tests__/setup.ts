import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal IndexedDB stubs for happy-dom tests.
// Some app modules reference indexedDB; happy-dom throws MissingAPIError unless we stub.
if (!(globalThis as any).indexedDB) {
  (globalThis as any).indexedDB = {
    open: () => ({}),
    deleteDatabase: () => ({}),
    databases: async () => [],
  };
}

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


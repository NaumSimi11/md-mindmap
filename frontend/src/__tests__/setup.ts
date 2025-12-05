import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

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


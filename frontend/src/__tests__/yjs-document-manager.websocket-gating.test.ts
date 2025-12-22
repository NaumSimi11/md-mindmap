import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock providers to avoid real IndexedDB / WebSocket usage.
const indexeddbCtor = vi.fn();
const hocuspocusCtor = vi.fn();

vi.mock('y-indexeddb', () => {
  return {
    IndexeddbPersistence: function IndexeddbPersistence(this: any, ...args: any[]) {
      indexeddbCtor(...args);
      // minimal event API used by our code
      return {
        on: vi.fn(),
        destroy: vi.fn(),
      };
    },
  };
});

vi.mock('@hocuspocus/provider', () => {
  return {
    HocuspocusProvider: function HocuspocusProvider(this: any, config: any) {
      hocuspocusCtor(config);
      return {
        configuration: config,
        on: vi.fn(),
        destroy: vi.fn(),
        awareness: { setLocalState: vi.fn(), getLocalState: vi.fn() },
      };
    },
  };
});

import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';

describe('YjsDocumentManager WebSocket gating', () => {
  beforeEach(() => {
    indexeddbCtor.mockClear();
    hocuspocusCtor.mockClear();

    // Ensure clean singleton state
    yjsDocumentManager.destroyAll();
  });

  afterEach(() => {
    yjsDocumentManager.destroyAll();
  });

  it('should ALWAYS create IndexedDB persistence', () => {
    yjsDocumentManager.getDocument('doc-1', { enableWebSocket: false, isAuthenticated: false });
    expect(indexeddbCtor).toHaveBeenCalledTimes(1);
    expect(indexeddbCtor.mock.calls[0][0]).toBe('mdreader-doc-1');
  });

  it('should NOT create WebSocket provider when enableWebSocket=false', () => {
    yjsDocumentManager.getDocument('doc-1', { enableWebSocket: false, isAuthenticated: true });
    expect(hocuspocusCtor).not.toHaveBeenCalled();
  });

  it('should NOT create WebSocket provider when not authenticated (even if enableWebSocket=true)', () => {
    yjsDocumentManager.getDocument('doc-1', { enableWebSocket: true, isAuthenticated: false });
    expect(hocuspocusCtor).not.toHaveBeenCalled();
  });

  it('should create WebSocket provider when enableWebSocket=true and authenticated', () => {
    yjsDocumentManager.getDocument('doc-1', {
      enableWebSocket: true,
      isAuthenticated: true,
      websocketUrl: 'ws://localhost:1234',
    });

    expect(hocuspocusCtor).toHaveBeenCalledTimes(1);
    const [config] = hocuspocusCtor.mock.calls[0];
    expect(config.url).toBe('ws://localhost:1234');
    expect(config.name).toBe('doc-1');
  });
});

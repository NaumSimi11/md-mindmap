import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock providers to avoid real IndexedDB / WebSocket usage.
const indexeddbCtor = vi.fn();
const websocketCtor = vi.fn();

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

vi.mock('y-websocket', () => {
  return {
    WebsocketProvider: function WebsocketProvider(this: any, ...args: any[]) {
      websocketCtor(...args);
      return {
        on: vi.fn(),
        destroy: vi.fn(),
        awareness: { setLocalState: vi.fn(), getLocalState: vi.fn() },
        wsconnected: true,
      };
    },
  };
});

import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';

describe('YjsDocumentManager WebSocket gating', () => {
  beforeEach(() => {
    indexeddbCtor.mockClear();
    websocketCtor.mockClear();

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
    expect(websocketCtor).not.toHaveBeenCalled();
  });

  it('should NOT create WebSocket provider when not authenticated (even if enableWebSocket=true)', () => {
    yjsDocumentManager.getDocument('doc-1', { enableWebSocket: true, isAuthenticated: false });
    expect(websocketCtor).not.toHaveBeenCalled();
  });

  it('should create WebSocket provider when enableWebSocket=true and authenticated', () => {
    yjsDocumentManager.getDocument('doc-1', {
      enableWebSocket: true,
      isAuthenticated: true,
      websocketUrl: 'ws://localhost:1234',
    });

    expect(websocketCtor).toHaveBeenCalledTimes(1);
    const [url, room] = websocketCtor.mock.calls[0];
    expect(url).toBe('ws://localhost:1234');
    expect(room).toBe('doc-1');
  });
});

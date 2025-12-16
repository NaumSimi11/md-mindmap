import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';

// Provider constructors we can assert against
const indexeddbCtor = vi.hoisted(() => vi.fn());
const websocketCtor = vi.hoisted(() => vi.fn());

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: function IndexeddbPersistence(this: any, ...args: any[]) {
    indexeddbCtor(...args);
    return { on: vi.fn(), destroy: vi.fn() };
  },
}));

vi.mock('y-websocket', () => ({
  WebsocketProvider: function WebsocketProvider(this: any, ...args: any[]) {
    websocketCtor(...args);
    return {
      on: vi.fn(),
      destroy: vi.fn(),
      wsconnected: true,
      awareness: { setLocalState: vi.fn(), getLocalState: vi.fn() },
    };
  },
}));

import { UnifiedSyncManager } from '@/services/sync/UnifiedSyncManager';
import { StorageProviderFactory } from '@/services/sync/storage/StorageProviderFactory';
import { EnvironmentDetector } from '@/services/sync/EnvironmentDetector';
import { Platform, NetworkMode, AuthMode } from '@/services/sync/types';

describe('UnifiedSyncManager provider gating', () => {
  beforeEach(() => {
    indexeddbCtor.mockReset();
    websocketCtor.mockReset();

    // Reset singleton between tests
    UnifiedSyncManager.resetInstance();
  });

  afterEach(() => {
    UnifiedSyncManager.resetInstance();
    vi.restoreAllMocks();
  });

  it('should always create IndexedDB persistence and not create websocket when shouldUseCloudSync=false', async () => {
    // Fake storage provider
    vi.spyOn(StorageProviderFactory, 'createAndInit').mockResolvedValue({
      init: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      getInfo: vi.fn(async () => ({ provider: 'test', used: 0, available: 0, total: 0 })),
    });

    // Fake environment detector (guest or offline)
    const detector = {
      init: vi.fn(async () => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.GUEST,
        userId: undefined,
        deviceId: 'device_test',
      })),
      subscribe: vi.fn(),
      getEnvironment: vi.fn(() => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.GUEST,
        userId: undefined,
        deviceId: 'device_test',
      })),
      shouldUseCloudSync: vi.fn(() => false),
      getStorageKey: vi.fn((documentId: string) => `yjs_guest_device_test_${documentId}`),
    } as any;

    vi.spyOn(EnvironmentDetector, 'getInstance').mockReturnValue(detector);

    const manager = UnifiedSyncManager.getInstance({
      websocketUrl: 'ws://localhost:1234',
      enableCloudSync: true,
    });

    await manager.init();
    const ydoc = manager.getDocument('doc-1');

    expect(ydoc).toBeInstanceOf(Y.Doc);
    expect(indexeddbCtor).toHaveBeenCalledTimes(1);
    expect(websocketCtor).not.toHaveBeenCalled();
  });

  it('should create websocket provider when shouldUseCloudSync=true and enableCloudSync=true', async () => {
    vi.spyOn(StorageProviderFactory, 'createAndInit').mockResolvedValue({
      init: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      getInfo: vi.fn(async () => ({ provider: 'test', used: 0, available: 0, total: 0 })),
    });

    const detector = {
      init: vi.fn(async () => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.AUTHENTICATED,
        userId: 'u1',
        deviceId: 'device_test',
      })),
      subscribe: vi.fn(),
      getEnvironment: vi.fn(() => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.AUTHENTICATED,
        userId: 'u1',
        deviceId: 'device_test',
      })),
      shouldUseCloudSync: vi.fn(() => true),
      getStorageKey: vi.fn((documentId: string) => `yjs_user_u1_${documentId}`),
    } as any;

    vi.spyOn(EnvironmentDetector, 'getInstance').mockReturnValue(detector);

    const manager = UnifiedSyncManager.getInstance({
      websocketUrl: 'ws://localhost:1234',
      enableCloudSync: true,
    });

    await manager.init();
    manager.getDocument('doc-2');

    expect(indexeddbCtor).toHaveBeenCalledTimes(1);
    expect(websocketCtor).toHaveBeenCalledTimes(1);

    const [url, room] = websocketCtor.mock.calls[0];
    expect(url).toBe('ws://localhost:1234');
    expect(room).toBe('doc-2');
  });

  it('should NOT create websocket provider when enableCloudSync=false even if shouldUseCloudSync=true', async () => {
    vi.spyOn(StorageProviderFactory, 'createAndInit').mockResolvedValue({
      init: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      exists: vi.fn(),
      clear: vi.fn(),
      getInfo: vi.fn(async () => ({ provider: 'test', used: 0, available: 0, total: 0 })),
    });

    const detector = {
      init: vi.fn(async () => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.AUTHENTICATED,
        userId: 'u1',
        deviceId: 'device_test',
      })),
      subscribe: vi.fn(),
      getEnvironment: vi.fn(() => ({
        platform: Platform.WEB,
        network: NetworkMode.ONLINE,
        auth: AuthMode.AUTHENTICATED,
        userId: 'u1',
        deviceId: 'device_test',
      })),
      shouldUseCloudSync: vi.fn(() => true),
      getStorageKey: vi.fn((documentId: string) => `yjs_user_u1_${documentId}`),
    } as any;

    vi.spyOn(EnvironmentDetector, 'getInstance').mockReturnValue(detector);

    const manager = UnifiedSyncManager.getInstance({
      websocketUrl: 'ws://localhost:1234',
      enableCloudSync: false,
    });

    await manager.init();
    manager.getDocument('doc-3');

    expect(indexeddbCtor).toHaveBeenCalledTimes(1);
    expect(websocketCtor).not.toHaveBeenCalled();
  });
});

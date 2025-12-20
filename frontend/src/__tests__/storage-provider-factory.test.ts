import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageProviderFactory } from '@/services/sync/storage/StorageProviderFactory';
import { Platform } from '@/services/sync/types';

describe('StorageProviderFactory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to IndexedDB when opt-in flag is not set', async () => {
    // Ensure env flag is falsey
    vi.stubEnv('VITE_ENABLE_TAURI_FS_CANONICAL', '');

    // Spy on console
    const logSpy = vi.spyOn(console, 'log');

    const provider = await StorageProviderFactory.createAndInit(Platform.WEB);
    const info = await provider.getInfo();

    expect(info).toBeDefined();
    // Should log creation of IndexedDB provider
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Creating IndexedDBStorageProvider/));
  });

  it('uses TauriStorageProvider when opt-in and platform is DESKTOP', async () => {
    // Stub env flag
    vi.stubEnv('VITE_ENABLE_TAURI_FS_CANONICAL', 'true');

    // Mock the dynamic import of TauriStorageProvider
    const fakeTauri = {
      TauriStorageProvider: class {
        async init() {}
        async getInfo() { return { provider: 'Tauri FS', used: 0, available: 0, total: 0 }; }
      }
    };

    vi.stubGlobal('window', Object.assign({}, (globalThis as any).window));
    // Mock dynamic import by mocking module resolver
    vi.mock('@/services/sync/storage/TauriStorageProvider', () => fakeTauri, { virtual: true });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const provider = await StorageProviderFactory.createAndInit(Platform.DESKTOP);
    const info = await provider.getInfo();

    expect(info.provider).toBe('Tauri FS');
    expect(warnSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Creating TauriStorageProvider/));
  });
});



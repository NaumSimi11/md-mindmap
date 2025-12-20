/**
 * Storage Provider Factory
 * 
 * Creates appropriate storage provider based on platform
 * WEB ONLY - Using IndexedDB for all platforms
 */

import { IStorageProvider, Platform } from '../types';
import { IndexedDBStorageProvider } from './IndexedDBStorageProvider';

export class StorageProviderFactory {
  /**
   * Create storage provider for platform
   * 
   * NOTE: Currently only IndexedDB is supported
   * Tauri storage will be added later
   */
  static create(platform: Platform): IStorageProvider {
    // Synchronous create remains IndexedDB for safety.
    console.log(`🗄️  Creating IndexedDBStorageProvider (platform: ${platform})`);
    return new IndexedDBStorageProvider();
  }

  /**
   * Create and initialize storage provider
   */
  static async createAndInit(platform: Platform): Promise<IStorageProvider> {
    // Environment opt-in (explicit, dangerous)
    const envFlag = Boolean(import.meta.env.VITE_ENABLE_TAURI_FS_CANONICAL === 'true');

    // Runtime dev-only override (explicit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runtimeFlag = Boolean((import.meta.env.DEV && (window as any).__MDREADER_ENABLE_TAURI_FS_CANONICAL__) || false);

    const enableTauriFS = envFlag || runtimeFlag;

    if (enableTauriFS) {
      if (platform !== Platform.DESKTOP) {
        console.warn('⚠️ VITE_ENABLE_TAURI_FS_CANONICAL set but platform is not DESKTOP. Falling back to IndexedDB.');
      } else {
        // Attempt dynamic import to avoid bundling Tauri API in web builds
        try {
          console.warn('⚠️ WARNING: Tauri filesystem storage is EXPERIMENTAL and NOT CANONICAL by default');
          const mod = await import('./TauriStorageProvider');
          const TauriStorageProvider = mod.TauriStorageProvider;
          console.log(`🗄️  Creating TauriStorageProvider (platform: ${platform}) - Reason: explicit opt-in`);
          const provider = new TauriStorageProvider();
          await provider.init();
          return provider;
        } catch (error) {
          console.error('❌ Failed to initialize TauriStorageProvider, falling back to IndexedDB:', error);
        }
      }
    }

    // Default path: IndexedDB provider (safe canonical store)
    console.log(`🗄️  Creating IndexedDBStorageProvider (platform: ${platform}) - Reason: default canonical storage`);
    const provider = StorageProviderFactory.create(platform);
    await provider.init();
    return provider;
  }
}

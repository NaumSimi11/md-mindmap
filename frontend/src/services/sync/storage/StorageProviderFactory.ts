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
    // Always use IndexedDB for now (works in both web and desktop)
    console.log(`🗄️  Creating IndexedDBStorageProvider (platform: ${platform})`);
    return new IndexedDBStorageProvider();
  }

  /**
   * Create and initialize storage provider
   */
  static async createAndInit(platform: Platform): Promise<IStorageProvider> {
    const provider = StorageProviderFactory.create(platform);
    await provider.init();
    return provider;
  }
}

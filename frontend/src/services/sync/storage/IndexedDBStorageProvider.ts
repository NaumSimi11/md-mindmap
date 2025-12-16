/**
 * IndexedDB Storage Provider
 * 
 * Web platform storage using IndexedDB
 */

import { IStorageProvider, StorageInfo, SyncError, SyncErrorCode } from '../types';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface YjsDB extends DBSchema {
  documents: {
    key: string;
    value: {
      key: string;
      data: Uint8Array;
      timestamp: number;
    };
  };
}

export class IndexedDBStorageProvider implements IStorageProvider {
  private db: IDBPDatabase<YjsDB> | null = null;
  private readonly dbName = 'mdreader-yjs-storage';
  private readonly storeName = 'documents';

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    try {
      this.db = await openDB<YjsDB>(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to initialize IndexedDB',
        true,
        error as Error
      );
    }
  }

  /**
   * Read data by key
   */
  async read(key: string): Promise<Uint8Array | null> {
    this.ensureInitialized();

    try {
      const record = await this.db!.get(this.storeName, key);
      return record?.data || null;
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to read from IndexedDB: ${key}`,
        true,
        error as Error
      );
    }
  }

  /**
   * Write data by key
   */
  async write(key: string, data: Uint8Array): Promise<void> {
    this.ensureInitialized();

    try {
      await this.db!.put(this.storeName, {
        key,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to write to IndexedDB: ${key}`,
        true,
        error as Error
      );
    }
  }

  /**
   * Delete data by key
   */
  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.db!.delete(this.storeName, key);
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to delete from IndexedDB: ${key}`,
        true,
        error as Error
      );
    }
  }

  /**
   * List all keys
   */
  async list(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const keys = await this.db!.getAllKeys(this.storeName);
      return keys as string[];
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to list keys from IndexedDB',
        true,
        error as Error
      );
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const record = await this.db!.get(this.storeName, key);
      return record !== undefined;
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to check existence in IndexedDB: ${key}`,
        true,
        error as Error
      );
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      await this.db!.clear(this.storeName);
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to clear IndexedDB',
        true,
        error as Error
      );
    }
  }

  /**
   * Get storage info
   */
  async getInfo(): Promise<StorageInfo> {
    this.ensureInitialized();

    try {
      // Estimate storage usage
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          provider: 'IndexedDB',
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          total: estimate.quota || 0,
        };
      }

      // Fallback if estimate not available
      return {
        provider: 'IndexedDB',
        used: 0,
        available: Number.MAX_SAFE_INTEGER,
        total: Number.MAX_SAFE_INTEGER,
      };
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to get storage info',
        true,
        error as Error
      );
    }
  }

  /**
   * Ensure DB is initialized
   */
  private ensureInitialized(): void {
    if (!this.db) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'IndexedDB not initialized',
        true
      );
    }
  }
}


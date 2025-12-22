/**
 * Tauri Storage Provider
 * 
 * Desktop platform storage using Tauri file system
 */

import { IStorageProvider, StorageInfo, SyncError, SyncErrorCode } from '../types';
import { appDataDir, join } from '@tauri-apps/api/path';
import { readFile, writeFile, remove, readDir, mkdir, exists } from '@tauri-apps/plugin-fs';

export class TauriStorageProvider implements IStorageProvider {
  private storageDir: string | null = null;
  private initialized = false;

  /**
   * Initialize Tauri storage
   */
  async init(): Promise<void> {
    try {
      // Get app data directory
      const appDir = await appDataDir();
      this.storageDir = await join(appDir, 'yjs-storage');

      // Create storage directory if it doesn't exist
      const dirExists = await exists(this.storageDir);
      if (!dirExists) {
        await mkdir(this.storageDir, { recursive: true });
      }

      this.initialized = true;
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to initialize Tauri storage',
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
      const filePath = await this.getFilePath(key);
      const fileExists = await exists(filePath);

      if (!fileExists) {
        return null;
      }

      return await readFile(filePath);
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to read from Tauri FS: ${key}`,
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
      const filePath = await this.getFilePath(key);
      await writeFile(filePath, data);
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to write to Tauri FS: ${key}`,
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
      const filePath = await this.getFilePath(key);
      const fileExists = await exists(filePath);

      if (fileExists) {
        await remove(filePath);
      }
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to delete from Tauri FS: ${key}`,
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
      const entries = await readDir(this.storageDir!);
      return entries
        .filter(entry => !entry.children) // Only files
        .map(entry => entry.name || '')
        .filter(name => name.endsWith('.yjs'))
        .map(name => name.replace('.yjs', ''));
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to list keys from Tauri FS',
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
      const filePath = await this.getFilePath(key);
      return await exists(filePath);
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        `Failed to check existence in Tauri FS: ${key}`,
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
      const keys = await this.list();
      await Promise.all(keys.map(key => this.delete(key)));
    } catch (error) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Failed to clear Tauri storage',
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
      // Calculate used space
      const keys = await this.list();
      let used = 0;

      for (const key of keys) {
        const data = await this.read(key);
        if (data) {
          used += data.byteLength;
        }
      }

      // Estimate available space (simplified)
      const total = 100 * 1024 * 1024 * 1024; // 100GB estimate
      const available = total - used;

      return {
        provider: 'Tauri FS',
        used,
        available,
        total,
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
   * Get file path for key
   */
  private async getFilePath(key: string): Promise<string> {
    // Sanitize key to be filesystem-safe
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return await join(this.storageDir!, `${safeKey}.yjs`);
  }

  /**
   * Ensure storage is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.storageDir) {
      throw new SyncError(
        SyncErrorCode.STORAGE_ERROR,
        'Tauri storage not initialized',
        true
      );
    }
  }
}


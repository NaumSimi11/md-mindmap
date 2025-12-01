import type { IStorageService } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';

/**
 * Storage Factory
 * 
 * Returns the appropriate storage service based on:
 * - User authentication status
 * - Platform (web, Tauri, mobile)
 * - Feature flags
 */

let storageInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    // For now, always use LocalStorage
    // Later: Check auth status and use AWS/Supabase for logged-in users
    storageInstance = new LocalStorageService();
    
    // Future:
    // if (isAuthenticated()) {
    //   storageInstance = new AmplifyStorageService();
    // } else if (isTauri()) {
    //   storageInstance = new TauriStorageService();
    // } else {
    //   storageInstance = new LocalStorageService();
    // }
  }
  
  return storageInstance;
}

// For testing: allow resetting the storage instance
export function resetStorageService(): void {
  storageInstance = null;
}


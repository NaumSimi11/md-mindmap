/**
 * Safe Storage Utilities
 * 
 * Provides localStorage-like API that:
 * - Works in SSR environments (no window)
 * - Works in private browsing mode (localStorage disabled)
 * - Provides type-safe get/set with JSON serialization
 * - Falls back to in-memory storage when localStorage unavailable
 */

// In-memory fallback for when localStorage is unavailable
const memoryStorage: Map<string, string> = new Map();

/**
 * Check if localStorage is available and functional
 * Tests both existence and write permission
 */
function isLocalStorageAvailable(): boolean {
  // SSR check
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    // Private browsing mode or storage quota exceeded
    return false;
  }
}

// Cache the availability check (doesn't change during session)
let _isAvailable: boolean | null = null;
function checkAvailability(): boolean {
  if (_isAvailable === null) {
    _isAvailable = isLocalStorageAvailable();
    if (!_isAvailable) {
      console.warn('⚠️ localStorage unavailable, using in-memory fallback');
    }
  }
  return _isAvailable;
}

/**
 * Safe localStorage wrapper
 * Falls back to in-memory storage when localStorage unavailable
 */
export const safeStorage = {
  /**
   * Get item from storage
   */
  getItem(key: string): string | null {
    if (checkAvailability()) {
      return localStorage.getItem(key);
    }
    return memoryStorage.get(key) ?? null;
  },

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): void {
    if (checkAvailability()) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Quota exceeded, fall back to memory
        console.warn(`⚠️ localStorage.setItem failed for ${key}, using memory`);
        memoryStorage.set(key, value);
      }
    } else {
      memoryStorage.set(key, value);
    }
  },

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    if (checkAvailability()) {
      localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
  },

  /**
   * Clear all storage
   */
  clear(): void {
    if (checkAvailability()) {
      localStorage.clear();
    }
    memoryStorage.clear();
  },

  /**
   * Get all keys
   */
  keys(): string[] {
    if (checkAvailability()) {
      return Object.keys(localStorage);
    }
    return Array.from(memoryStorage.keys());
  },
};

/**
 * Type-safe JSON storage helpers
 */
export const jsonStorage = {
  /**
   * Get and parse JSON from storage
   * Returns null if key doesn't exist or parsing fails
   */
  get<T>(key: string): T | null {
    const value = safeStorage.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      console.warn(`⚠️ Failed to parse JSON for key: ${key}`);
      return null;
    }
  },

  /**
   * Stringify and store JSON
   */
  set<T>(key: string, value: T): void {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`❌ Failed to stringify for key: ${key}`, e);
    }
  },

  /**
   * Remove item
   */
  remove(key: string): void {
    safeStorage.removeItem(key);
  },
};

/**
 * Storage keys used by the application
 * Centralized for easy refactoring and documentation
 */
export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  LAST_WORKSPACE_ID: 'lastWorkspaceId',
  THEME: 'theme',
  GUEST_USER_ID: 'guest_user_id',
} as const;

/**
 * Check if storage is using fallback mode
 * Useful for showing warnings to users in private browsing
 */
export function isUsingFallbackStorage(): boolean {
  return !checkAvailability();
}


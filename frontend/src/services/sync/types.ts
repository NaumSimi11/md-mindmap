/**
 * Core Types for Sync System
 * 
 * Defines all types used across sync infrastructure
 */

// ============================================================================
// CONNECTION STATES
// ============================================================================

export enum ConnectionState {
  INITIALIZING = 'INITIALIZING',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface ConnectionStateInfo {
  state: ConnectionState;
  timestamp: number;
  error?: Error;
  retryCount?: number;
  nextRetry?: number;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export enum Platform {
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
}

export enum NetworkMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum AuthMode {
  GUEST = 'GUEST',
  AUTHENTICATED = 'AUTHENTICATED',
}

export interface Environment {
  platform: Platform;
  network: NetworkMode;
  auth: AuthMode;
  userId?: string;
  deviceId: string;
}

// ============================================================================
// STORAGE PROVIDER INTERFACE
// ============================================================================

export interface IStorageProvider {
  /**
   * Initialize storage
   */
  init(): Promise<void>;

  /**
   * Read data by key
   */
  read(key: string): Promise<Uint8Array | null>;

  /**
   * Write data by key
   */
  write(key: string, data: Uint8Array): Promise<void>;

  /**
   * Delete data by key
   */
  delete(key: string): Promise<void>;

  /**
   * List all keys
   */
  list(): Promise<string[]>;

  /**
   * Check if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all data
   */
  clear(): Promise<void>;

  /**
   * Get storage info
   */
  getInfo(): Promise<StorageInfo>;
}

export interface StorageInfo {
  provider: string;
  used: number;
  available: number;
  total: number;
}

// ============================================================================
// SYNC EVENTS
// ============================================================================

export enum SyncEventType {
  STATE_CHANGE = 'STATE_CHANGE',
  ENVIRONMENT_CHANGE = 'ENVIRONMENT_CHANGE',
  DOCUMENT_SYNCED = 'DOCUMENT_SYNCED',
  SYNC_ERROR = 'SYNC_ERROR',
  MIGRATION_STARTED = 'MIGRATION_STARTED',
  MIGRATION_COMPLETED = 'MIGRATION_COMPLETED',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
}

export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  data?: any;
}

export type SyncEventListener = (event: SyncEvent) => void;

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================

export interface SyncConfig {
  // Connection settings
  websocketUrl: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  
  // Storage settings
  storageKey: string;
  
  // Performance settings
  syncDebounceMs: number;
  batchSize: number;
  
  // Feature flags
  enableCloudSync: boolean;
  enableMultiTab: boolean;
  enableCompression: boolean;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  websocketUrl: 'ws://localhost:1234',
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  storageKey: 'mdreader-yjs',
  syncDebounceMs: 100,
  batchSize: 100,
  enableCloudSync: true,
  enableMultiTab: true,
  enableCompression: false,
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum SyncErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  FATAL_ERROR = 'FATAL_ERROR',
}

export class SyncError extends Error {
  constructor(
    public code: SyncErrorCode,
    message: string,
    public recoverable: boolean = true,
    public cause?: Error
  ) {
    super(message);
    this.name = 'SyncError';
  }
}


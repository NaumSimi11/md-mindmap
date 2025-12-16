/**
 * Sync System - Public API
 * 
 * Exports all public interfaces and classes
 */

// Main manager
export { UnifiedSyncManager } from './UnifiedSyncManager';

// Types
export type {
  IStorageProvider,
  StorageInfo,
  Environment,
  ConnectionStateInfo,
  SyncConfig,
  SyncEvent,
  SyncEventListener,
} from './types';

export {
  ConnectionState,
  Platform,
  NetworkMode,
  AuthMode,
  SyncEventType,
  SyncErrorCode,
  SyncError,
  DEFAULT_SYNC_CONFIG,
} from './types';

// Utilities
export { EnvironmentDetector } from './EnvironmentDetector';
export { ConnectionStateMachine } from './ConnectionStateMachine';
export { StorageProviderFactory } from './storage/StorageProviderFactory';


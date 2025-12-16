/**
 * Sync Types
 * 
 * Defines sync status and metadata for local-first, selective sync model
 * Following Google Drive pattern: local first, user decides what syncs
 */

/**
 * Sync status for documents, folders, and workspaces
 */
export type SyncStatus = 
  | 'local'      // Only exists locally (not pushed to cloud)
  | 'synced'     // Synced with cloud (local matches cloud)
  | 'syncing'    // Currently syncing to/from cloud
  | 'modified'   // Local changes not yet synced
  | 'conflict'   // Conflict between local and cloud versions
  | 'error';     // Sync error occurred

/**
 * Sync metadata attached to entities
 */
export interface SyncMetadata {
  status: SyncStatus;
  lastSyncedAt?: Date;
  cloudVersion?: number;
  localVersion: number;
  error?: string;
  conflictData?: ConflictData;
}

/**
 * Conflict data for resolution
 */
export interface ConflictData {
  localUpdatedAt: Date;
  cloudUpdatedAt: Date;
  localContent?: string;
  cloudContent?: string;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  status: SyncStatus;
  error?: string;
  conflictData?: ConflictData;
}

/**
 * Sync queue item (for batch operations)
 */
export interface SyncQueueItem {
  id: string;
  type: 'document' | 'folder' | 'workspace';
  operation: 'push' | 'pull';
  priority: number;
  createdAt: Date;
}

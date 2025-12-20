/**
 * OfflineDatabase - IndexedDB layer for offline storage
 * 
 * Uses Dexie.js for type-safe IndexedDB access.
 * Stores documents, folders, workspaces, and pending changes for offline sync.
 * 
 * Schema follows existing backend data structures for easy sync.
 */

import Dexie, { Table } from 'dexie';

// ============================================================================
// Types - Mirror backend entities for offline storage
// ============================================================================

export interface OfflineDocument {
  id: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  content: string;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Offline-specific fields
  remote_version: number;         // Last known server version
  last_synced: string | null;     // Last successful sync timestamp
  pending_changes: boolean;       // Has unsynced changes
}

export interface OfflineFolder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
  
  // Offline-specific
  last_synced: string | null;
  pending_changes: boolean;
}

export interface OfflineWorkspace {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  created_at: string;
  updated_at: string;
  
  // Offline-specific
  last_synced: string | null;
  is_active: boolean;             // Currently selected workspace
}

export interface PendingChange {
  id: string;
  entity_type: 'document' | 'folder' | 'workspace';
  entity_id: string;
  workspace_id: string | null;    // Which workspace this change belongs to
  operation: 'create' | 'update' | 'delete';
  data: any;                      // The change payload
  timestamp: string;              // When change was made
  retry_count: number;            // Number of sync attempts
  last_error: string | null;      // Last sync error message
  priority: 'high' | 'normal' | 'low'; // Sync priority
}

export interface SyncMetadata {
  key: string;                    // 'last_sync' | 'sync_status' | etc.
  value: any;                     // Flexible value storage
  updated_at: string;
}

/**
 * Failed Snapshot - Queue for retrying failed durability snapshots
 * 
 * CRITICAL INVARIANT:
 * These snapshots are WRITE-ONLY (push to backend)
 * They are NEVER applied/loaded during collaboration
 * They represent failed backup attempts, not sync state
 */
export interface FailedSnapshot {
  id: string;                     // UUID
  documentId: string;             // Document ID (without doc_ prefix)
  yjsState: string;               // base64-encoded Yjs binary
  html: string | null;            // Optional HTML preview
  updatedAt: number;              // Timestamp when snapshot was created
  failedAt: number;               // Timestamp of first failure
  retryCount: number;             // Number of retry attempts
  lastError: string | null;       // Last error message
  nextRetryAt: number;            // Timestamp for next retry (exponential backoff)
}

// ============================================================================
// Dexie Database Class
// ============================================================================

class OfflineDatabaseClass extends Dexie {
  documents!: Table<OfflineDocument, string>;
  folders!: Table<OfflineFolder, string>;
  workspaces!: Table<OfflineWorkspace, string>;
  pending_changes!: Table<PendingChange, string>;
  sync_metadata!: Table<SyncMetadata, string>;
  failed_snapshots!: Table<FailedSnapshot, string>;
  
  constructor() {
    super('MDReaderOfflineDB');
    
    // Define schema - Version 3 (added workspace_id to pending_changes)
    this.version(3).stores({
      // Primary key is 'id' by default
      documents: 'id, workspaceId, folderId, [workspaceId+folderId], pendingChanges, lastSynced',
      folders: 'id, workspaceId, parentId, pendingChanges',
      workspaces: 'id, ownerId, isActive',
      pending_changes: 'id, entityType, entityId, workspaceId, [workspaceId+priority+timestamp], timestamp, priority, [priority+timestamp]',
      syncMetadata: 'key'
    });
    
    // Version 4 - Add failed_snapshots table for durability retry queue
    this.version(4).stores({
      documents: 'id, workspaceId, folderId, [workspaceId+folderId], pendingChanges, lastSynced',
      folders: 'id, workspaceId, parentId, pendingChanges',
      workspaces: 'id, ownerId, isActive',
      pending_changes: 'id, entityType, entityId, workspaceId, [workspaceId+priority+timestamp], timestamp, priority, [priority+timestamp]',
      syncMetadata: 'key',
      failed_snapshots: 'id, documentId, nextRetryAt, failedAt' // Index by nextRetryAt for efficient retry scheduling
    });
  }
  
  /**
   * Clear all data (for testing or logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.documents.clear(),
      this.folders.clear(),
      this.workspaces.clear(),
      this.pending_changes.clear(),
      this.sync_metadata.clear(),
      this.failed_snapshots.clear()
    ]);
    console.log('🗑️ Offline database cleared');
  }
  
  /**
   * Get database storage statistics
   */
  async getStorageInfo(): Promise<{
    documentCount: number;
    folderCount: number;
    workspaceCount: number;
    pendingChanges: number;
    estimatedSize: string;
  }> {
    const [documentCount, folderCount, workspaceCount, pendingCount] = await Promise.all([
      this.documents.count(),
      this.folders.count(),
      this.workspaces.count(),
      this.pending_changes.count()
    ]);
    
    // Estimate size (rough calculation)
    const avgDocSize = 50 * 1024; // ~50KB per document
    const estimatedBytes = documentCount * avgDocSize;
    const estimatedSize = `${(estimatedBytes / 1024 / 1024).toFixed(2)} MB`;
    
    return {
      documentCount,
      folderCount,
      workspaceCount,
      pendingChanges: pendingCount,
      estimatedSize
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const offlineDB = new OfflineDatabaseClass();

// Log database initialization
offlineDB.on('ready', () => {
  console.log('✅ Offline database initialized');
});

offlineDB.on('versionchange', () => {
  console.log('⚠️ Database schema changed, reload recommended');
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Get available storage quota
 */
export async function getStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;
    
    return { used, quota, percentage };
  }
  
  // Fallback if not supported
  return { used: 0, quota: 0, percentage: 0 };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}


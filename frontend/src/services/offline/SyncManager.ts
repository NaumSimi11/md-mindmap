/**
 * SyncManager - Core offline sync engine
 * 
 * @deprecated This service is deprecated in favor of Yjs CRDT synchronization.
 * Yjs handles sync/conflict resolution/offline automatically.
 * 
 * Migration: Use useYjsDocument hook instead
 * Will be removed in v2.0.0
 * 
 * Responsibilities (DEPRECATED):
 * - Queue changes when offline
 * - Sync changes when online
 * - Detect and handle conflicts
 * - Retry failed syncs with exponential backoff
 * - Prioritize current document
 * 
 * Design:
 * - Singleton service
 * - Event-driven (emits sync events)
 * - Non-blocking (all syncs run async)
 */

import { offlineDB, PendingChange } from './OfflineDatabase';
import { documentService as apiDocument } from '@/services/api';
import { folderService as apiFolder } from '@/services/api/FolderService';

// UUID generator
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 
  | 'online_synced'      // Online, no pending changes
  | 'online_syncing'     // Online, currently syncing
  | 'online_pending'     // Online but has pending changes (queued)
  | 'offline'            // Offline, changes queued
  | 'conflict'           // Has unresolved conflicts
  | 'error';             // Sync failed (after all retries)

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  conflictDetails: Conflict[];
  errors: Array<{ changeId: string; error: string }>;
}

export interface Conflict {
  id: string;
  documentId: string;
  localVersion: {
    content: string;
    updatedAt: string;
    version: number;
  };
  remoteVersion: {
    content: string;
    updatedAt: string;
    version: number;
  };
  type: 'content' | 'deletion';
}

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  lastError: string | null;
}

export type SyncEventType = 
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'conflict_detected'
  | 'status_changed';

export interface SyncEvent {
  type: SyncEventType;
  data?: any;
}

type SyncEventListener = (event: SyncEvent) => void;

// ============================================================================
// SyncManager Class
// ============================================================================

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncStatus: SyncStatus = 'online_synced';
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private autoSyncInterval: number | null = null;
  private listeners: Set<SyncEventListener> = new Set();
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second
  
  constructor() {
    this.setupNetworkListeners();
    this.setupLifecycleListeners();
    
    // TEMPORARY FIX: Clear all pending changes on init to resolve orphaned changes
    // TODO: Add workspace_id to PendingChange schema for proper filtering
    this.clearAllPendingChanges().then(() => {
      console.log('🧹 Cleared all pending changes on init (temporary fix for orphaned data)');
    });
    
    this.cleanupStaleChanges(); // Run cleanup on init
    console.log('🔄 SyncManager initialized');
  }
  
  // ==========================================================================
  // Public API
  // ==========================================================================
  
  /**
   * Queue a change for syncing
   */
  async queueChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retry_count' | 'last_error'>): Promise<string> {
    const changeId = uuidv4();
    
    console.log(`📋 SyncManager.queueChange():`, {
      operation: change.operation,
      entity_type: change.entity_type,
      entity_id: change.entity_id,
      priority: change.priority || 'normal',
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    });
    
    const pendingChange: PendingChange = {
      id: changeId,
      ...change,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      last_error: null,
      priority: change.priority || 'normal'
    };
    
    await offlineDB.pending_changes.add(pendingChange);
    
    const totalPending = await offlineDB.pending_changes.count();
    console.log(`📝 Change queued: ${change.operation} ${change.entity_type} ${change.entity_id} (Total pending: ${totalPending})`);
    
    // Update status
    await this.updateStatus();
    
    // If online, attempt immediate sync
    if (this.isOnline && !this.isSyncing) {
      // Don't await - fire and forget
      this.syncNow().catch(err => {
        console.error('❌ Auto-sync failed:', err);
      });
    }
    
    return changeId;
  }
  
  /**
   * Sync all pending changes now
   * @param workspaceId - Optional: only sync changes for this workspace
   */
  async syncNow(workspaceId?: string): Promise<SyncResult> {
    console.log('🔄 syncNow() called, isOnline:', this.isOnline, 'isSyncing:', this.isSyncing, 'workspace:', workspaceId || 'all');
    
    if (!this.isOnline) {
      console.log('📴 Cannot sync: offline');
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        conflictDetails: [],
        errors: []
      };
    }
    
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        conflictDetails: [],
        errors: []
      };
    }
    
    this.isSyncing = true;
    this.syncStatus = 'online_syncing';
    this.emitEvent({ type: 'sync_started' });
    
    console.log('🔄 Starting sync...');
    
    try {
      // Get pending changes, ordered by priority and timestamp
      let pendingChanges = await offlineDB.pending_changes
        .orderBy('[priority+timestamp]')
        .toArray();
      
      console.log(`📦 Found ${pendingChanges.length} pending changes (before filtering)`);
      
      // Filter by workspace if specified
      if (workspaceId) {
        pendingChanges = pendingChanges.filter(change => change.workspace_id === workspaceId);
        console.log(`📦 Filtered to ${pendingChanges.length} changes for workspace ${workspaceId}`);
      }
      
      if (pendingChanges.length === 0) {
        console.log('✅ No changes to sync');
        this.isSyncing = false;
        this.syncStatus = 'online_synced';
        this.lastSyncTime = new Date();
        this.emitEvent({ type: 'sync_completed', data: { synced: 0 } });
        return {
          success: true,
          synced: 0,
          failed: 0,
          conflicts: 0,
          conflictDetails: [],
          errors: []
        };
      }
      
      console.log(`📦 Syncing ${pendingChanges.length} changes...`);
      
      const result = await this.processSyncQueue(pendingChanges);
      
      this.isSyncing = false;
      this.lastSyncTime = new Date();
      
      if (result.conflicts > 0) {
        this.syncStatus = 'conflict';
        this.emitEvent({ type: 'conflict_detected', data: result });
      } else if (result.failed > 0) {
        this.syncStatus = 'error';
        this.lastError = `${result.failed} changes failed to sync`;
        this.emitEvent({ type: 'sync_failed', data: result });
      } else {
        this.syncStatus = 'online_synced';
        this.lastError = null;
        this.emitEvent({ type: 'sync_completed', data: result });
      }
      
      console.log(`✅ Sync complete: ${result.synced} synced, ${result.failed} failed, ${result.conflicts} conflicts`);
      
      return result;
      
    } catch (error) {
      this.isSyncing = false;
      this.syncStatus = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Sync failed:', error);
      
      this.emitEvent({ type: 'sync_failed', data: { error } });
      
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        conflictDetails: [],
        errors: [{ changeId: 'unknown', error: this.lastError }]
      };
    }
  }
  
  /**
   * Get current sync state
   */
  async getState(): Promise<SyncState> {
    const pendingCount = await offlineDB.pending_changes.count();
    
    return {
      status: this.syncStatus,
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError
    };
  }
  
  /**
   * Clear all pending changes (dangerous!)
   */
  async clearPendingChanges(): Promise<void> {
    await offlineDB.pending_changes.clear();
    console.log('🗑️ All pending changes cleared');
    await this.updateStatus();
  }
  
  /**
   * Start automatic sync every interval
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    this.autoSyncInterval = window.setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        // Check if there are pending changes before syncing
        const pendingCount = await offlineDB.pending_changes.count();
        if (pendingCount > 0) {
          this.syncNow().catch(err => {
            console.error('❌ Auto-sync failed:', err);
          });
        }
      }
    }, intervalMs);
    
    console.log(`⏰ Auto-sync started (every ${intervalMs}ms)`);
  }
  
  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏸️ Auto-sync stopped');
    }
  }
  
  /**
   * Cleanup stale pending changes
   * - Removes changes older than 24 hours with 3+ retries
   * - Removes orphaned changes (document no longer exists)
   */
  async cleanupStaleChanges(): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // 1. Remove changes older than 24 hours with high retry counts
      const staleChanges = await offlineDB.pending_changes
        .where('timestamp').below(twentyFourHoursAgo.toISOString())
        .filter(change => change.retry_count >= 3)
        .toArray();
      
      if (staleChanges.length > 0) {
        console.log(`🗑️ Removing ${staleChanges.length} stale changes (24h+ old, 3+ retries)`);
        for (const change of staleChanges) {
          await offlineDB.pending_changes.delete(change.id);
        }
      }
      
      // 2. Validate entities still exist in IndexedDB
      const allChanges = await offlineDB.pending_changes.toArray();
      let orphanedCount = 0;
      
      for (const change of allChanges) {
        if (change.entity_type === 'document') {
          const doc = await offlineDB.documents.get(change.entity_id);
          if (!doc) {
            console.warn(`⚠️ Orphaned change for non-existent document: ${change.entity_id}`);
            await offlineDB.pending_changes.delete(change.id);
            orphanedCount++;
          }
        } else if (change.entity_type === 'folder') {
          const folder = await offlineDB.folders.get(change.entity_id);
          if (!folder) {
            console.warn(`⚠️ Orphaned change for non-existent folder: ${change.entity_id}`);
            await offlineDB.pending_changes.delete(change.id);
            orphanedCount++;
          }
        }
      }
      
      if (orphanedCount > 0) {
        console.log(`🗑️ Removed ${orphanedCount} orphaned changes`);
      }
      
      await this.updateStatus();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
  
  /**
   * Clear all pending changes (used on logout)
   */
  async clearAllPendingChanges(): Promise<void> {
    const count = await offlineDB.pending_changes.count();
    if (count > 0) {
      console.log(`🧹 Clearing ${count} pending changes`);
      await offlineDB.pending_changes.clear();
      await this.updateStatus();
    }
  }
  
  /**
   * Add event listener
   */
  addEventListener(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // ==========================================================================
  // Private Methods
  // ==========================================================================
  
  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }
  
  private setupLifecycleListeners(): void {
    // Clear pending changes on logout
    window.addEventListener('auth:logout', async () => {
      console.log('🚪 Logout detected, clearing pending changes');
      this.stopAutoSync(); // Stop background sync
      await this.clearAllPendingChanges();
    });
    
    // Sync before workspace switch
    window.addEventListener('workspace:switch', async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { oldWorkspaceId, newWorkspaceId } = customEvent.detail || {};
      console.log(`🔄 Workspace switch: ${oldWorkspaceId} → ${newWorkspaceId}`);
      
      // Attempt to sync remaining changes for old workspace
      if (this.isOnline && !this.isSyncing) {
        await this.syncNow().catch(err => {
          console.warn('⚠️ Failed to sync before workspace switch:', err);
        });
      }
    });
  }
  
  private handleOnline = async () => {
    console.log('🌐 SyncManager: Online');
    this.isOnline = true;
    await this.updateStatus();
    
    // Trigger sync after brief delay
    setTimeout(() => {
      this.syncNow().catch(err => {
        console.error('❌ Reconnect sync failed:', err);
      });
    }, 1000);
  };
  
  private handleOffline = async () => {
    console.log('📴 SyncManager: Offline');
    this.isOnline = false;
    this.syncStatus = 'offline';
    await this.updateStatus();
  };
  
  private async updateStatus(): Promise<void> {
    const pendingCount = await offlineDB.pending_changes.count();
    
    if (!this.isOnline) {
      this.syncStatus = 'offline';
    } else if (this.isSyncing) {
      this.syncStatus = 'online_syncing';
    } else if (pendingCount > 0) {
      this.syncStatus = 'online_pending';
    } else {
      this.syncStatus = 'online_synced';
    }
    
    this.emitEvent({ type: 'status_changed', data: { status: this.syncStatus, pendingCount } });
  }
  
  private async processSyncQueue(changes: PendingChange[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      conflictDetails: [],
      errors: []
    };
    
    for (const change of changes) {
      try {
        const syncResult = await this.syncChange(change);
        
        if (syncResult.success) {
          // Remove from queue
          await offlineDB.pending_changes.delete(change.id);
          result.synced++;
        } else if (syncResult.conflict) {
          // Conflict detected
          result.conflicts++;
          result.conflictDetails.push(syncResult.conflict);
          // Don't remove from queue - user needs to resolve
        } else {
          // Sync failed
          await this.handleSyncFailure(change);
          result.failed++;
        }
        
      } catch (error) {
        console.error(`❌ Failed to sync change ${change.id}:`, error);
        result.failed++;
        result.errors.push({
          changeId: change.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        await this.handleSyncFailure(change);
      }
    }
    
    result.success = result.failed === 0;
    return result;
  }
  
  private async syncChange(change: PendingChange): Promise<{ success: boolean; conflict?: Conflict }> {
    console.log(`   → Syncing ${change.operation} ${change.entity_type} ${change.entity_id}...`);
    
    try {
      switch (change.entity_type) {
        case 'document':
          return await this.syncDocument(change);
        case 'folder':
          return await this.syncFolder(change);
        case 'workspace':
          return await this.syncWorkspace(change);
        default:
          console.error(`Unknown entity type: ${change.entity_type}`);
          return { success: false };
      }
    } catch (error) {
      console.error(`   ✗ Sync error for ${change.entity_id}:`, error);
      return { success: false };
    }
  }
  
  private async syncDocument(change: PendingChange): Promise<{ success: boolean; conflict?: Conflict }> {
    try {
      switch (change.operation) {
        case 'create':
          // Create document on server
          const createResult = await apiDocument.createDocument({
            workspace_id: change.data.workspaceId,
            title: change.data.title,
            content: change.data.content || '',
            content_type: 'markdown',
            folder_id: change.data.folderId || null
          });
          
          // Update IndexedDB with real ID from server
          const offlineDoc = await offlineDB.documents.get(change.entity_id);
          if (offlineDoc) {
            // Replace temp ID with real ID in IndexedDB
            await offlineDB.documents.delete(change.entity_id);
            await offlineDB.documents.put({
              ...offlineDoc,
              id: createResult.id,
              remote_version: 1,
              pending_changes: false,
              last_synced: new Date().toISOString()
            });
            
            // CRITICAL: Convert pending UPDATEs from old temp ID to new real ID
            console.log(`   🔍 Checking for pending updates with old ID: ${change.entity_id}`);
            const pendingUpdates = await offlineDB.pending_changes
              .where('entity_id').equals(change.entity_id)
              .and(c => c.operation === 'update')
              .toArray();
            
            if (pendingUpdates.length > 0) {
              console.log(`   🔄 Converting ${pendingUpdates.length} pending updates from ${change.entity_id} → ${createResult.id}`);
              for (const update of pendingUpdates) {
                console.log(`      ↳ Converting pending change ${update.id}`);
                await offlineDB.pending_changes.update(update.id, {
                  entity_id: createResult.id
                });
              }
              console.log(`   ✅ All ${pendingUpdates.length} pending updates converted`);
            } else {
              console.log(`   ℹ️ No pending updates to convert`);
            }
          }
          
          console.log(`   ✓ Document created: ${createResult.id}`);
          
          // Notify frontend to update ID
          window.dispatchEvent(new CustomEvent('document-synced', {
            detail: { oldId: change.entity_id, newId: createResult.id, doc: createResult }
          }));
          
          return { success: true };
          
        case 'update':
          // Check if document exists locally
          const localDoc = await offlineDB.documents.get(change.entity_id);
          if (!localDoc) {
            console.warn(`   ⚠️ Document ${change.entity_id} not found in IndexedDB (may have been converted to new ID)`);
            return { success: true }; // Consider it "successful" (cleaned up)
          }
          
          // Build update payload
          const updatePayload: any = {};
          if (change.data.title !== undefined) updatePayload.title = change.data.title;
          if (change.data.content !== undefined) updatePayload.content = change.data.content;
          if (change.data.folderId !== undefined) updatePayload.folder_id = change.data.folderId;
          if (change.data.starred !== undefined) updatePayload.is_starred = change.data.starred;
          
          // OPTIMISTIC SYNC: Try PATCH first, only GET if it fails
          try {
            await apiDocument.updateDocument(change.entity_id, updatePayload);
            
            // Success - update IndexedDB
            await offlineDB.documents.update(change.entity_id, {
              pending_changes: false,
              last_synced: new Date().toISOString(),
              remote_version: (localDoc.remote_version || 0) + 1
            });
            
            console.log(`   ✓ Document updated: ${change.entity_id}`);
            return { success: true };
            
          } catch (error: any) {
            // If 404, document doesn't exist - convert to CREATE
            if (error.response?.status === 404 || error.message?.includes('404')) {
              console.warn(`   ⚠️ Document ${change.entity_id} not found on server (404), converting to CREATE`);
              
              const createResult = await apiDocument.createDocument({
                workspace_id: localDoc.workspaceId,
                title: change.data.title || localDoc.title,
                content: change.data.content || localDoc.content,
                content_type: 'markdown',
                folder_id: change.data.folderId || localDoc.folderId || null
              });
              
              // Update IndexedDB with real ID
              await offlineDB.documents.delete(change.entity_id);
              await offlineDB.documents.put({
                ...localDoc,
                id: createResult.id,
                title: createResult.title,
                content: createResult.content,
                remote_version: 1,
                pending_changes: false,
                last_synced: new Date().toISOString()
              });
              
              // Convert OTHER pending changes to use new ID
              await offlineDB.pending_changes
                .where('entity_id').equals(change.entity_id)
                .modify({ entity_id: createResult.id });
              
              console.log(`   ✓ Document created (was 404): ${createResult.id}`);
              
              window.dispatchEvent(new CustomEvent('document-synced', {
                detail: { oldId: change.entity_id, newId: createResult.id, doc: createResult }
              }));
              
              return { success: true };
            }
            
            // If 409 Conflict, fetch remote and detect conflict
            if (error.response?.status === 409) {
              console.warn(`   ⚠️ Conflict (409) for ${change.entity_id}, fetching remote version`);
              
              const remoteDoc = await apiDocument.getDocument(change.entity_id);
              const remoteUpdated = new Date(remoteDoc.updated_at).getTime();
              const lastSynced = localDoc.last_synced ? new Date(localDoc.last_synced).getTime() : 0;
              
              if (remoteUpdated > lastSynced && remoteDoc.content !== localDoc.content) {
                const conflict: Conflict = {
                  id: `conflict_${change.entity_id}_${Date.now()}`,
                  documentId: change.entity_id,
                  localVersion: {
                    content: localDoc.content,
                    updatedAt: localDoc.updated_at,
                    version: localDoc.local_version
                  },
                  remoteVersion: {
                    content: remoteDoc.content,
                    updatedAt: remoteDoc.updated_at,
                    version: remoteDoc.version || 1
                  },
                  type: 'content'
                };
                
                console.warn(`   ⚠️ Conflict confirmed for ${change.entity_id}`);
                return { success: false, conflict };
              }
            }
            
            // Other error - rethrow
            console.error(`   ✗ Update failed for ${change.entity_id}:`, error);
            throw error;
          }
          
        case 'delete':
          // Delete document on server
          await apiDocument.deleteDocument(change.entity_id);
          console.log(`   ✓ Document deleted: ${change.entity_id}`);
          return { success: true };
          
        default:
          console.error(`Unknown operation: ${change.operation}`);
          return { success: false };
      }
    } catch (error) {
      console.error(`Document sync failed:`, error);
      return { success: false };
    }
  }
  
  private async syncFolder(change: PendingChange): Promise<{ success: boolean; conflict?: Conflict }> {
    try {
      switch (change.operation) {
        case 'create':
          // Create folder on server
          const createResult = await apiFolder.createFolder({
            workspace_id: change.data.workspaceId,
            name: change.data.name,
            icon: change.data.icon || '📁',
            parent_id: change.data.parentId || null
          });
          
          // Update IndexedDB with real ID from server
          const offlineFolder = await offlineDB.folders.get(change.entity_id);
          if (offlineFolder) {
            await offlineDB.folders.delete(change.entity_id);
            await offlineDB.folders.put({
              id: createResult.id,
              workspace_id: createResult.workspace_id,
              parent_id: createResult.parent_id,
              name: createResult.name,
              icon: createResult.icon,
              position: createResult.position,
              created_at: createResult.created_at,
              updated_at: createResult.updated_at,
              last_synced: new Date().toISOString(),
              pending_changes: false
            });
          }
          
          // Convert any OTHER pending changes (updates, deletes) to use new ID
          await offlineDB.pending_changes
            .where('entity_id').equals(change.entity_id)
            .modify({ entity_id: createResult.id });
          
          console.log(`   ✓ Folder created: ${createResult.id} (old temp ID: ${change.entity_id})`);
          
          // Notify UI to update folder ID
          window.dispatchEvent(new CustomEvent('folder-synced', {
            detail: { oldId: change.entity_id, newId: createResult.id, folder: createResult }
          }));
          
          return { success: true };
          
        case 'update':
          // Try PATCH first (optimistic sync)
          try {
            await apiFolder.updateFolder(change.entity_id, change.data);
            
            // Update IndexedDB sync status
            await offlineDB.folders.update(change.entity_id, {
              pending_changes: false,
              last_synced: new Date().toISOString()
            });
            
            console.log(`   ✓ Folder updated: ${change.entity_id}`);
            return { success: true };
          } catch (error: any) {
            // If 404, folder doesn't exist - skip this update
            if (error.response?.status === 404 || error.message?.includes('404')) {
              console.warn(`   ⚠️ Folder ${change.entity_id} not found (404), skipping update`);
              return { success: true }; // Consider it "successful" (cleaned up)
            }
            throw error; // Re-throw other errors
          }
          
        case 'delete':
          // Delete folder on server
          await apiFolder.deleteFolder(change.entity_id);
          
          // Remove from IndexedDB
          await offlineDB.folders.delete(change.entity_id);
          
          console.log(`   ✓ Folder deleted: ${change.entity_id}`);
          return { success: true };
          
        default:
          return { success: false };
      }
    } catch (error) {
      console.error(`Folder sync failed:`, error);
      return { success: false };
    }
  }
  
  private async syncWorkspace(change: PendingChange): Promise<{ success: boolean; conflict?: Conflict }> {
    // Workspace operations are typically immediate (online-only)
    // This is here for completeness but rarely used
    console.log(`   ⚠️ Workspace sync not implemented (should be online-only)`);
    return { success: true };
  }
  
  private async handleSyncFailure(change: PendingChange): Promise<void> {
    const retryCount = change.retry_count + 1;
    
    if (retryCount >= this.MAX_RETRIES) {
      // Max retries reached, mark as permanently failed
      console.error(`❌ Change ${change.id} failed after ${this.MAX_RETRIES} retries`);
      
      // Update with error
      await offlineDB.pending_changes.update(change.id, {
        retry_count: retryCount,
        last_error: 'Max retries exceeded'
      });
    } else {
      // Increment retry count
      await offlineDB.pending_changes.update(change.id, {
        retry_count: retryCount,
        last_error: 'Sync failed, will retry'
      });
      
      console.log(`⚠️ Change ${change.id} will retry (attempt ${retryCount}/${this.MAX_RETRIES})`);
    }
  }
  
  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in sync event listener:', error);
      }
    });
  }
  
  // ==========================================================================
  // Cleanup
  // ==========================================================================
  
  destroy(): void {
    this.stopAutoSync();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
    console.log('🔄 SyncManager destroyed');
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * @deprecated
 * SyncManager is deprecated. Yjs handles sync automatically.
 * This instance is kept for backward compatibility only.
 */
export const syncManager = new SyncManager();

// ⚠️ DEPRECATED: Auto-sync disabled (Yjs handles sync automatically)
// syncManager.startAutoSync(30000);


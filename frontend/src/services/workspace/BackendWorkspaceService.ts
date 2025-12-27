/**
 * Backend Workspace Service
 * 
 * Manages workspaces, folders, and documents for authenticated users.
 * 
 * ARCHITECTURE:
 * - Storage: Backend API (FastAPI) + IndexedDB cache (offline support)
 * - IDs: UUIDs (backend generates, we use as-is)
 * - Multi-workspace: Yes (unlimited)
 * - Sync: Manual sync (per local_first.md)
 * - Offline: IndexedDB cache for offline access
 * 
 * SYNC STRATEGY (per local_first.md):
 * - Local save: Mandatory (IndexedDB cache)
 * - Cloud sync: Manual only (user clicks "Sync")
 * - Offline mode: Full CRUD via IndexedDB cache
 * - Online mode: API calls + IndexedDB cache
 * 
 * ID HANDLING:
 * - Backend generates UUIDs server-side
 * - We store them as-is (no remapping)
 * - For optimistic UI: Generate temp ID, replace after API response
 * - IndexedDB cache uses backend UUIDs
 */

import Dexie, { Table } from 'dexie';
import { workspaceService, folderService, documentService } from '@/services/api';
import { authService } from '@/services/api';
import { generateDocumentId } from '@/utils/id-generator';
import { selectiveSyncService } from '@/services/sync/SelectiveSyncService';
import { dispatchSyncBackendReady, EventNames } from '@/events/EventRegistry';
import type {
  Workspace,
  Folder,
  DocumentMeta,
  CreateWorkspaceInput,
  CreateFolderInput,
  CreateDocumentInput,
  UpdateWorkspaceInput,
  UpdateFolderInput,
  UpdateDocumentInput,
} from './types';
import type { Workspace as ApiWorkspace, Document as ApiDocument } from '@/types/api.types';
import type { Folder as ApiFolder } from '@/services/api/FolderService';

// ============================================================================
// IndexedDB Schema (Cache)
// ============================================================================

class BackendCacheDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  folders!: Table<Folder, string>;
  documents!: Table<DocumentMeta, string>;
  settings!: Table<{ key: string; value: any }, string>;
  workspaceMappings!: Table<{ localId: string; cloudId: string; name: string }, string>; // Local → Cloud ID mapping

  constructor() {
    super('MDReaderBackendCache');
    
    this.version(1).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      folders: 'id, workspaceId, parentId, name, position',
      documents: 'id, workspaceId, folderId, title, type, starred, lastOpenedAt',
      settings: 'key',
      workspaceMappings: 'localId, cloudId, name', // Index by localId and cloudId
    });
  }
}

const cacheDb = new BackendCacheDatabase();

// ============================================================================
// Backend Workspace Service
// ============================================================================

export class BackendWorkspaceService {
  private currentWorkspaceId: string | null = null;
  private isInitialized = false;
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Backend service: Online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Backend service: Offline');
    });
    
    // Listen for logout to reset state
    window.addEventListener(EventNames.AUTH_LOGOUT, () => {
      console.log('🚪 [BackendWorkspaceService] Logout detected, resetting state...');
      this.reset();
    });
  }

  /**
   * Reset service state on logout
   * Clears all cached data and resets initialization flag
   */
  reset(): void {
    this.currentWorkspaceId = null;
    this.isInitialized = false;
    console.log('✅ [BackendWorkspaceService] State reset');
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize - Load workspaces from backend or cache
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        console.log('⚠️ User not authenticated, skipping backend workspace init');
        return;
      }

      // Try to load from backend (if online)
      if (this.isOnline) {
        try {
          await this.syncWorkspaces();
        } catch (error) {
          console.warn('⚠️ Failed to sync workspaces from backend, using cache:', error);
        }
      }

      // Load from cache
      const workspaces = await cacheDb.workspaces.orderBy('createdAt').toArray();
      
      if (workspaces.length === 0) {
        // Create default workspace if none exist
        console.log('📝 Creating default workspace...');
        const newWorkspace = await this.createDefaultWorkspace();
        this.currentWorkspaceId = newWorkspace.id;
      } else {
        // Load last active workspace
        const lastWorkspaceId = await this.getSetting('lastWorkspaceId');
        if (lastWorkspaceId && workspaces.find(w => w.id === lastWorkspaceId)) {
          this.currentWorkspaceId = lastWorkspaceId;
        } else {
          this.currentWorkspaceId = workspaces[0].id;
        }
        console.log(`📦 Loaded ${workspaces.length} workspace(s) from cache`);
      }

      // 🔥 SYNC DOCUMENTS: After loading workspaces, sync documents for current workspace
      if (this.currentWorkspaceId && this.isOnline) {
        try {
          console.log(`🔄 Syncing documents for workspace: ${this.currentWorkspaceId}`);
          await this.syncDocuments(this.currentWorkspaceId);
        } catch (error) {
          console.warn('⚠️ Failed to sync documents from backend, using cache:', error);
        }
      }

      this.isInitialized = true;
      console.log('✅ Backend workspace service initialized');
      
      // Emit event for listeners waiting for backend to be ready
      dispatchSyncBackendReady();
    } catch (error) {
      console.error('❌ Failed to initialize backend workspace service:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   * Returns true if initialized OR if user is not authenticated (guest mode)
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Assert that service is initialized before performing operations
   * Throws error if called before init() completes
   * 
   * @throws Error if not initialized and authenticated
   */
  private assertInitialized(operation: string): void {
    // Allow operations if not authenticated (guest mode doesn't use this service)
    if (!authService.isAuthenticated()) {
      return;
    }
    
    if (!this.isInitialized) {
      throw new Error(
        `BackendWorkspaceService.${operation}() called before init(). ` +
        `Ensure SyncContext has initialized the service.`
      );
    }
  }

  /**
   * Create default workspace for authenticated user
   * Named "Cloud Workspace" to differentiate from local workspace
   */
  private async createDefaultWorkspace(): Promise<Workspace> {
    const input: CreateWorkspaceInput = {
      name: 'Cloud Workspace',
      icon: '☁️',
      description: 'Your cloud workspace (synced to backend)',
    };

    return this.createWorkspace(input);
  }

  /**
   * Sync workspaces from backend
   */
  private async syncWorkspaces(): Promise<void> {
    try {
      const apiWorkspaces = await workspaceService.listWorkspaces();
      
      // 🔥 FIX: Handle different response formats
      let workspacesArray: ApiWorkspace[] = [];
      
      if (Array.isArray(apiWorkspaces)) {
        // Direct array response
        workspacesArray = apiWorkspaces;
      } else if (apiWorkspaces && typeof apiWorkspaces === 'object') {
        // Paginated response with items property
        if (Array.isArray((apiWorkspaces as any).items)) {
          workspacesArray = (apiWorkspaces as any).items;
        } else if ((apiWorkspaces as any).items === undefined && Object.keys(apiWorkspaces).length > 0) {
          // Single workspace object
          workspacesArray = [apiWorkspaces as ApiWorkspace];
        }
      }
      
      console.log(`📦 API returned ${workspacesArray.length} workspace(s)`);
      
      // Map to our format and cache
      const workspaces: Workspace[] = workspacesArray.map((w: ApiWorkspace) => this.mapApiWorkspace(w));
      
      // Update cache
      await cacheDb.workspaces.clear();
      if (workspaces.length > 0) {
        await cacheDb.workspaces.bulkAdd(workspaces);
      }
      
      console.log(`✅ Synced ${workspaces.length} workspace(s) from backend`);
    } catch (error) {
      console.error('❌ Failed to sync workspaces:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Map API workspace to our format
   */
  private mapApiWorkspace(apiWorkspace: ApiWorkspace): Workspace {
    return {
      id: apiWorkspace.id,
      name: apiWorkspace.name,
      icon: '💻', // Default (backend doesn't have icon yet)
      description: apiWorkspace.description,
      createdAt: apiWorkspace.created_at,
      updatedAt: apiWorkspace.updated_at,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      version: 1, // Backend uses version field for optimistic locking
    };
  }

  /**
   * Map API folder to our format
   */
  private mapApiFolder(apiFolder: ApiFolder): Folder {
    return {
      id: apiFolder.id,
      workspaceId: apiFolder.workspace_id,
      name: apiFolder.name,
      icon: apiFolder.icon || '📁',
      parentId: apiFolder.parent_id || null,
      position: apiFolder.position || 0,
      isExpanded: apiFolder.is_expanded || false,
      createdAt: apiFolder.created_at,
      updatedAt: apiFolder.updated_at,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * Map API document to our format
   */
  private mapApiDocument(apiDoc: ApiDocument): DocumentMeta {
    const content = (apiDoc as any).content || '';
    const yjsStateB64 = (apiDoc as any).yjs_state_b64 || undefined;
    const yjsVersion = (apiDoc as any).yjs_version || 0;
    
    // 🔥 DEBUG: Log content mapping
    if (!content && apiDoc.id) {
      console.warn(`⚠️ [mapApiDocument] Document ${apiDoc.id} (${apiDoc.title}) has NO content from API`);
    } else {
      console.log(`✅ [mapApiDocument] Document ${apiDoc.id} (${apiDoc.title}) has content: ${content.substring(0, 50)}...`);
    }
    
    // 🔥 BUG FIX #4: Map yjs_state_b64 from API to enable binary hydration
    if (yjsStateB64) {
      console.log(`🧬 [mapApiDocument] Document ${apiDoc.id} has Yjs binary (${yjsStateB64.length} chars b64, v${yjsVersion})`);
    }
    
    return {
      id: apiDoc.id,
      workspaceId: apiDoc.workspace_id,
      folderId: (apiDoc as any).folder_id || null,
      title: apiDoc.title,
      type: apiDoc.content_type === 'markdown' ? 'markdown' : 'markdown', // Extend later
      content,  // 🔥 CRITICAL: Include content from backend
      starred: (apiDoc as any).is_starred || false, // Backend returns is_starred
      tags: (apiDoc as any).tags || [], // Backend returns tags array
      createdAt: apiDoc.created_at,
      updatedAt: apiDoc.updated_at,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      version: apiDoc.version || 1,
      yjsVersion,         // 🔥 BUG FIX #4: Map Yjs version
      yjsStateB64,        // 🔥 BUG FIX #4: Map Yjs binary state
    };
  }

  /**
   * Get setting from cache
   */
  private async getSetting(key: string): Promise<string | null> {
    const setting = await cacheDb.settings.get(key);
    return setting?.value || null;
  }

  /**
   * Set setting in cache
   */
  private async setSetting(key: string, value: any): Promise<void> {
    await cacheDb.settings.put({ key, value });
  }

  // ==========================================================================
  // Workspace Methods
  // ==========================================================================

  /**
   * Get all workspaces
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    this.assertInitialized('getAllWorkspaces');
    
    // Return from cache (always up-to-date after sync)
    const workspaces = await cacheDb.workspaces.orderBy('createdAt').toArray();
    
    // 🔥 FIX: Filter out temp workspaces that failed to sync
    // If we have temp workspaces and we're online, try to sync them
    const tempWorkspaces = workspaces.filter(w => w.id.startsWith('temp_'));
    const realWorkspaces = workspaces.filter(w => !w.id.startsWith('temp_'));
    
    if (tempWorkspaces.length > 0 && this.isOnline) {
      console.warn(`⚠️ Found ${tempWorkspaces.length} temp workspace(s), attempting to sync...`);
      // Try to sync temp workspaces (they should have been synced already, but retry)
      for (const tempWs of tempWorkspaces) {
        try {
          // Try to create on backend
          const apiWorkspace = await workspaceService.createWorkspace({
            name: tempWs.name,
            description: tempWs.description,
          });
          
          const realWorkspace = this.mapApiWorkspace(apiWorkspace);
          realWorkspace.icon = tempWs.icon;
          
          // Replace temp with real
          await cacheDb.workspaces.delete(tempWs.id);
          await cacheDb.workspaces.add(realWorkspace);
          
          // Update current workspace if needed
          if (this.currentWorkspaceId === tempWs.id) {
            this.currentWorkspaceId = realWorkspace.id;
          }
          
          // Create default folders
          await this.createDefaultFolders(realWorkspace.id);
          
          realWorkspaces.push(realWorkspace);
          console.log(`✅ Synced temp workspace "${tempWs.name}" → ${realWorkspace.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync temp workspace "${tempWs.name}":`, error);
          // Keep temp workspace for now
          realWorkspaces.push(tempWs);
        }
      }
    }
    
    return realWorkspaces.length > 0 ? realWorkspaces : workspaces; // Return real workspaces if any, otherwise all
  }

  /**
   * Get current workspace
   */
  async getCurrentWorkspace(): Promise<Workspace | null> {
    // No guard needed - safe to return null if not initialized
    if (!this.currentWorkspaceId) return null;
    return cacheDb.workspaces.get(this.currentWorkspaceId) || null;
  }

  /**
   * Create workspace
   */
  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    this.assertInitialized('createWorkspace');
    
    const now = new Date().toISOString();
    
    // Optimistic create (for offline support)
    const optimisticWorkspace: Workspace = {
      id: `temp_${Date.now()}`, // Temp ID, will be replaced
      name: input.name,
      icon: input.icon || '💻',
      description: input.description,
      createdAt: now,
      updatedAt: now,
      syncStatus: this.isOnline ? 'syncing' : 'local',
      version: 1,
    };

    // Add to cache immediately (optimistic UI)
    await cacheDb.workspaces.add(optimisticWorkspace);
    
    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        const apiWorkspace = await workspaceService.createWorkspace({
          name: input.name,
          description: input.description,
        });
        
        // Replace optimistic workspace with real one
        const realWorkspace = this.mapApiWorkspace(apiWorkspace);
        realWorkspace.icon = input.icon || '💻'; // Preserve icon
        
        await cacheDb.workspaces.delete(optimisticWorkspace.id);
        await cacheDb.workspaces.add(realWorkspace);
        
        // Update current workspace if it was the temp one
        if (this.currentWorkspaceId === optimisticWorkspace.id) {
          this.currentWorkspaceId = realWorkspace.id;
        }
        
        // 🔥 CREATE DEFAULT FOLDERS after workspace is created
        await this.createDefaultFolders(realWorkspace.id);
        
        console.log('✅ Workspace created:', realWorkspace.name);
        return realWorkspace;
      } catch (error) {
        console.error('❌ Failed to create workspace on backend:', error);
        // Keep optimistic workspace (will sync later)
        optimisticWorkspace.syncStatus = 'local';
        await cacheDb.workspaces.update(optimisticWorkspace.id, { syncStatus: 'local' });
        
        // Create default folders even if offline (optimistic)
        await this.createDefaultFolders(optimisticWorkspace.id, true);
        
        return optimisticWorkspace;
      }
    }
    
    // Offline: Create default folders optimistically
    await this.createDefaultFolders(optimisticWorkspace.id, true);
    
    return optimisticWorkspace;
  }

  /**
   * Create default folders for a workspace
   */
  private async createDefaultFolders(workspaceId: string, optimistic: boolean = false): Promise<void> {
    const folders: CreateFolderInput[] = [
      {
        workspaceId,
        name: '🚀 Getting Started',
        icon: '🚀',
        parentId: null,
      },
      {
        workspaceId,
        name: '⚡ Quick Notes',
        icon: '⚡',
        parentId: null,
      },
    ];

    try {
      // Create folders via API (if online and not optimistic)
      if (this.isOnline && !optimistic) {
        for (const folderInput of folders) {
          try {
            await this.createFolder(folderInput);
          } catch (error) {
            console.error(`❌ Failed to create folder "${folderInput.name}":`, error);
            // Continue with other folders
          }
        }
        console.log(`✅ Created ${folders.length} default folders for workspace`);
      } else {
        // Optimistic create (offline mode)
        for (const folderInput of folders) {
          const optimisticFolder: Folder = {
            id: `temp_${Date.now()}_${Math.random()}`,
            workspaceId: folderInput.workspaceId,
            name: folderInput.name,
            icon: folderInput.icon || '📁',
            parentId: folderInput.parentId || null,
            position: folders.indexOf(folderInput),
            isExpanded: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'local',
            version: 1,
          };
          await cacheDb.folders.add(optimisticFolder);
        }
        console.log(`✅ Created ${folders.length} default folders (optimistic) for workspace`);
      }
    } catch (error) {
      console.error('❌ Failed to create default folders:', error);
      // Don't throw - folder creation failure shouldn't break workspace creation
    }
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const existing = await cacheDb.workspaces.get(id);
    if (!existing) throw new Error(`Workspace not found: ${id}`);

    const updated: Workspace = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      syncStatus: this.isOnline ? 'syncing' : 'local',
    };

    // Update cache immediately
    await cacheDb.workspaces.update(id, updated);

    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        await workspaceService.updateWorkspace(id, {
          name: input.name,
          description: input.description,
        });
        
        updated.syncStatus = 'synced';
        updated.lastSyncedAt = new Date().toISOString();
        await cacheDb.workspaces.update(id, updated);
      } catch (error) {
        console.error('❌ Failed to update workspace on backend:', error);
        updated.syncStatus = 'local';
        await cacheDb.workspaces.update(id, updated);
      }
    }

    return updated;
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    // Delete from cache immediately
    await cacheDb.workspaces.delete(id);
    
    // Delete folders and documents in this workspace
    await cacheDb.folders.where('workspaceId').equals(id).delete();
    await cacheDb.documents.where('workspaceId').equals(id).delete();
    
    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        await workspaceService.deleteWorkspace(id);
        console.log('✅ Workspace deleted from backend');
      } catch (error) {
        console.error('❌ Failed to delete workspace on backend:', error);
        // Already deleted from cache, will sync later
      }
    }
    
    // Clear current workspace if it was deleted
    if (this.currentWorkspaceId === id) {
      const workspaces = await this.getAllWorkspaces();
      this.currentWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
    }
  }

  /**
   * Switch workspace
   */
  async switchWorkspace(id: string): Promise<void> {
    const workspace = await cacheDb.workspaces.get(id);
    if (!workspace) throw new Error(`Workspace not found: ${id}`);
    
    this.currentWorkspaceId = id;
    await this.setSetting('lastWorkspaceId', id);
    
    // 🔥 SYNC DOCUMENTS: Sync documents from backend when switching workspaces
    if (this.isOnline && authService.isAuthenticated()) {
      try {
        console.log(`🔄 Syncing documents for workspace: ${workspace.name}`);
        await this.syncDocuments(id);
      } catch (error) {
        console.warn('⚠️ Failed to sync documents when switching workspace, using cache:', error);
      }
    }
    
    console.log(`✅ Switched to workspace: ${workspace.name}`);
  }

  // ==========================================================================
  // Folder Methods
  // ==========================================================================

  /**
   * Get folders for workspace
   */
  async getFolders(workspaceId?: string): Promise<Folder[]> {
    this.assertInitialized('getFolders');
    
    const targetWorkspaceId = workspaceId || this.currentWorkspaceId;
    if (!targetWorkspaceId) return [];
    
    // Return from cache
    return cacheDb.folders
      .where('workspaceId')
      .equals(targetWorkspaceId)
      .sortBy('position');
  }

  /**
   * Create folder
   */
  async createFolder(input: CreateFolderInput): Promise<Folder> {
    this.assertInitialized('createFolder');
    
    const now = new Date().toISOString();
    
    // Optimistic create
    const optimisticFolder: Folder = {
      id: `temp_${Date.now()}`,
      workspaceId: input.workspaceId,
      name: input.name,
      icon: input.icon || '📁',
      parentId: input.parentId || null,
      position: 0, // Will be set by backend
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
      syncStatus: this.isOnline ? 'syncing' : 'local',
      version: 1,
    };

    // Add to cache immediately
    await cacheDb.folders.add(optimisticFolder);
    
    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        const apiFolder = await folderService.createFolder(input.workspaceId, {
          name: input.name,
          icon: input.icon,
          parent_id: input.parentId || null,
        });
        
        // Replace optimistic folder with real one
        const realFolder = this.mapApiFolder(apiFolder);
        
        await cacheDb.folders.delete(optimisticFolder.id);
        await cacheDb.folders.add(realFolder);
        
        console.log('✅ Folder created:', realFolder.name);
        return realFolder;
      } catch (error) {
        console.error('❌ Failed to create folder on backend:', error);
        optimisticFolder.syncStatus = 'local';
        await cacheDb.folders.update(optimisticFolder.id, { syncStatus: 'local' });
        return optimisticFolder;
      }
    }
    
    return optimisticFolder;
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, input: UpdateFolderInput): Promise<Folder> {
    const existing = await cacheDb.folders.get(id);
    if (!existing) throw new Error(`Folder not found: ${id}`);

    const updated: Folder = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      syncStatus: this.isOnline ? 'syncing' : 'local',
    };

    // Update cache immediately
    await cacheDb.folders.update(id, updated);

    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        await folderService.updateFolder(id, existing.workspaceId, {
          name: input.name,
          icon: input.icon,
          parent_id: input.parentId,
          position: input.position,
          is_expanded: input.isExpanded,
        });
        
        updated.syncStatus = 'synced';
        updated.lastSyncedAt = new Date().toISOString();
        await cacheDb.folders.update(id, updated);
      } catch (error) {
        console.error('❌ Failed to update folder on backend:', error);
        updated.syncStatus = 'local';
        await cacheDb.folders.update(id, updated);
      }
    }

    return updated;
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    const existing = await cacheDb.folders.get(id);
    if (!existing) throw new Error(`Folder not found: ${id}`);
    
    // Delete from cache immediately
    await cacheDb.folders.delete(id);
    
    // Delete child folders and documents
    await cacheDb.folders.where('parentId').equals(id).delete();
    await cacheDb.documents.where('folderId').equals(id).delete();
    
    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        await folderService.deleteFolder(id, existing.workspaceId, true); // cascade=true
        console.log('✅ Folder deleted from backend');
      } catch (error) {
        console.error('❌ Failed to delete folder on backend:', error);
      }
    }
  }

  // ==========================================================================
  // Document Methods
  // ==========================================================================

  /**
   * Get documents for workspace
   * 
   * LOCAL-FIRST: Returns from cache. If online and authenticated, syncs from backend first.
   */
  async getDocuments(workspaceId?: string): Promise<DocumentMeta[]> {
    this.assertInitialized('getDocuments');
    
    const targetWorkspaceId = workspaceId || this.currentWorkspaceId;
    if (!targetWorkspaceId) return [];
    
    // 🔥 FIX: DON'T sync on every getDocuments call (it's called on every keystroke!)
    // The list endpoint doesn't return content anyway, so syncing here is useless
    // Content should only be fetched when:
    // 1. Explicitly opening a document (getDocument)
    // 2. Explicitly saving to cloud (pushDocument)
    // 3. Explicitly pulling from cloud (pullDocument)
    
    // Just return from cache
    return cacheDb.documents
      .where('workspaceId')
      .equals(targetWorkspaceId)
      .sortBy('updatedAt');
  }

  /**
   * Get a single document by ID
   * 🔥 FIX: Smart caching - prefer local if newer, fetch from backend if missing/stale
   */
  async getDocument(id: string): Promise<DocumentMeta | null> {
    this.assertInitialized('getDocument');
    
    try {
      // Try cache first
      const cachedDoc = await cacheDb.documents.get(id);
      
      console.log(`🔍 [getDocument] Cache check for ${id}:`, {
        found: !!cachedDoc,
        syncStatus: cachedDoc?.syncStatus,
        hasContent: !!cachedDoc?.content,
        contentLength: cachedDoc?.content?.length || 0,
        updatedAt: cachedDoc?.updatedAt
      });
      
      // If in cache AND has content, check if it's local-only or needs sync
      if (cachedDoc) {
        // If local-only or pending sync, ALWAYS use cache (it's the source of truth)
        if (cachedDoc.syncStatus === 'local' || cachedDoc.syncStatus === 'pending') {
          console.log(`✅ [getDocument] Using local cache (${cachedDoc.syncStatus}): ${id}, content: ${cachedDoc.content?.length || 0} chars`);
          return cachedDoc;
        }
        
        // If synced and has content, use cache
        if (cachedDoc.content) {
          console.log(`✅ [getDocument] Using synced cache: ${id}, content: ${cachedDoc.content?.length || 0} chars`);
          return cachedDoc;
        }
      }
      
      // If authenticated and online, try to fetch from backend (only if not local-only or pending)
      // 🔥 FIX: Don't fetch from backend if we have local changes pending sync
      if (this.isOnline && authService.isAuthenticated() && 
          cachedDoc?.syncStatus !== 'local' && 
          cachedDoc?.syncStatus !== 'pending') {
        try {
          // 🔥 LOCAL-FIRST: Backend now accepts our IDs, so ID should be the same!
          console.log(`📥 [getDocument] Fetching from backend: ${id}`);
          const apiDoc = await documentService.getDocument(id);
          const fullDoc = this.mapApiDocument(apiDoc);
          
          // Only update cache if backend version is newer OR cache has no content
          if (!cachedDoc || !cachedDoc.content || new Date(fullDoc.updatedAt) > new Date(cachedDoc.updatedAt)) {
            await cacheDb.documents.put(fullDoc);
            console.log(`✅ [getDocument] Updated cache from backend: ${id}, content: ${fullDoc.content?.length || 0} chars`);
            return fullDoc;
          } else {
            console.log(`✅ [getDocument] Cache is newer, keeping local: ${id}`);
            return cachedDoc;
          }
        } catch (error) {
          console.warn(`⚠️ [getDocument] Failed to fetch from backend, using cache:`, error);
          // Fall back to cache even if it has no content
          return cachedDoc || null;
        }
      }
      
      // Offline or not authenticated - return cache (even if no content)
      return cachedDoc || null;
    } catch (error) {
      console.warn('⚠️ Failed to get document:', error);
      return null;
    }
  }

  /**
   * Create document
   * 
   * LOCAL-FIRST: Creates document ONLY in IndexedDB (local).
   * Per local_first.md: "Local Save is Mandatory, Cloud Save is Voluntary"
   * User must explicitly sync via "Push to Cloud" button.
   */
  async createDocument(input: CreateDocumentInput): Promise<DocumentMeta> {
    this.assertInitialized('createDocument');
    
    const now = new Date().toISOString();
    
    // Generate UUID for document (local-first: IDs generated client-side)
    const docId = input.id || generateDocumentId();
    
    // Create document locally ONLY (per local_first.md section 5.1)
    const localDoc: DocumentMeta = {
      id: docId,
      workspaceId: input.workspaceId,
      folderId: input.folderId || null,
      title: input.title,
      type: input.type,
      content: input.content || '',  // 🔥 CRITICAL: Store initial content
      starred: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local', // ✅ LOCAL-FIRST: Always 'local' until user explicitly syncs
      version: 1,
    };

    // Save to IndexedDB cache (local storage)
    await cacheDb.documents.add(localDoc);
    
    console.log('✅ Document created locally:', localDoc.title, `(syncStatus: ${localDoc.syncStatus})`);
    return localDoc;
  }

  /**
   * Update document
   * 
   * LOCAL-FIRST: Updates document ONLY in IndexedDB (local).
   * Per local_first.md: Auto-save is to IndexedDB only.
   * If document was previously synced, mark as 'pending' sync.
   * User must explicitly sync via "Push to Cloud" button.
   */
  async updateDocument(id: string, input: UpdateDocumentInput): Promise<DocumentMeta> {
    this.assertInitialized('updateDocument');
    
    const existing = await cacheDb.documents.get(id);
    if (!existing) throw new Error(`Document not found: ${id}`);

    // Determine sync status based on previous state
    // If was synced, mark as 'pending' (needs sync)
    // If was local, keep as 'local'
    const syncStatus = existing.syncStatus === 'synced' ? 'pending' : 'local';

    const updated: DocumentMeta = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      syncStatus, // ✅ LOCAL-FIRST: Never auto-sync
    };

    // Update cache immediately (local save is mandatory per local_first.md)
    await cacheDb.documents.put(updated);

    console.log('✅ Document updated locally:', id, `(syncStatus: ${syncStatus})`);
    return updated;
  }

  /**
   * Update document sync status (for sync operations)
   */
  async updateDocumentSyncStatus(
    id: string,
    syncStatus: 'local' | 'synced' | 'syncing' | 'conflict' | 'pending',
    lastSyncedAt?: string
  ): Promise<void> {
    const existing = await cacheDb.documents.get(id);
    if (!existing) throw new Error(`Document not found: ${id}`);

    await cacheDb.documents.update(id, {
      syncStatus,
      lastSyncedAt: lastSyncedAt || new Date().toISOString(),
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    this.assertInitialized('deleteDocument');
    
    // Delete from cache immediately
    await cacheDb.documents.delete(id);
    
    // Try to sync with backend (if online)
    if (this.isOnline) {
      try {
        await documentService.deleteDocument(id);
        console.log('✅ Document deleted from backend');
      } catch (error) {
        console.error('❌ Failed to delete document on backend:', error);
      }
    }
  }

  // ==========================================================================
  // Sync Methods
  // ==========================================================================

  /**
   * Manual sync (per local_first.md: manual sync only)
   */
  async sync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync: offline');
    }

    console.log('🔄 Starting manual sync...');
    
    // Sync workspaces
    await this.syncWorkspaces();
    
    // Sync folders for current workspace
    if (this.currentWorkspaceId) {
      await this.syncFolders(this.currentWorkspaceId);
    }
    
    // Sync documents for current workspace
    if (this.currentWorkspaceId) {
      await this.syncDocuments(this.currentWorkspaceId);
    }
    
    console.log('✅ Manual sync complete');
  }

  /**
   * Sync folders from backend
   */
  private async syncFolders(workspaceId: string): Promise<void> {
    try {
      const apiFolders = await folderService.listFolders(workspaceId);
      const folders: Folder[] = apiFolders.map(f => this.mapApiFolder(f));
      
      // Update cache (delete old, add new)
      await cacheDb.folders.where('workspaceId').equals(workspaceId).delete();
      await cacheDb.folders.bulkAdd(folders);
      
      console.log(`✅ Synced ${folders.length} folder(s) from backend`);
    } catch (error) {
      console.error('❌ Failed to sync folders:', error);
      throw error;
    }
  }

  /**
   * Sync documents from backend
   * 
   * LOCAL-FIRST: Merges backend documents with local documents.
   * - Keeps local-only documents (syncStatus === 'local')
   * - Updates synced documents with backend data
   * - Adds new documents from backend that don't exist locally
   */
  private async syncDocuments(workspaceId: string): Promise<void> {
    try {
      const apiDocs = await documentService.listDocuments(workspaceId);
      
      // 🔥 DEBUG: Log what API returns
      console.log(`📥 [syncDocuments] Received ${apiDocs.length} documents from API`);
      if (apiDocs.length > 0) {
        const firstDoc = apiDocs[0] as any;
        console.log(`📥 [syncDocuments] First doc has content field?`, 'content' in firstDoc, firstDoc.content?.substring(0, 50));
      }
      
      const backendDocuments: DocumentMeta[] = apiDocs.map(d => this.mapApiDocument(d));
      
      // Get existing local documents for this workspace
      const localDocuments = await cacheDb.documents
        .where('workspaceId')
        .equals(workspaceId)
        .toArray();
      
      // Create a map of backend documents by ID
      const backendDocMap = new Map(backendDocuments.map(d => [d.id, d]));
      
      // Keep local-only documents (not synced yet)
      const localOnlyDocs = localDocuments.filter(d => d.syncStatus === 'local');
      
      // Update synced documents with backend data (if they exist on backend)
      const documentsToUpdate: DocumentMeta[] = [];
      const documentsToAdd: DocumentMeta[] = [];
      
      for (const backendDoc of backendDocuments) {
        const localDoc = localDocuments.find(d => d.id === backendDoc.id);
        if (localDoc) {
          // Document exists locally - update with backend data but preserve local changes if newer
          const localUpdatedAt = new Date(localDoc.updatedAt);
          const backendUpdatedAt = new Date(backendDoc.updatedAt);
          
          if (localDoc.syncStatus === 'local' && localUpdatedAt > backendUpdatedAt) {
            // Local version is newer - keep local version but mark as 'pending' sync
            documentsToUpdate.push({
              ...localDoc,
              syncStatus: 'pending', // Needs to be synced
            });
          } else {
            // Backend version is newer or same - use backend version
            documentsToUpdate.push(backendDoc);
          }
        } else {
          // New document from backend - add it
          documentsToAdd.push(backendDoc);
        }
      }
      
      // Delete documents that no longer exist on backend (but NEVER delete local-only ones)
      const backendDocIds = new Set(backendDocuments.map(d => d.id));
      const docsToDelete = localDocuments.filter(
        d => !backendDocIds.has(d.id) && d.syncStatus !== 'local' && d.syncStatus !== 'pending'
      );
      
      if (docsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${docsToDelete.length} document(s) that no longer exist on backend (but keeping ${localOnlyDocs.length} local-only)`);
        await cacheDb.documents.bulkDelete(docsToDelete.map(d => d.id));
      }
      
      // Update existing documents
      if (documentsToUpdate.length > 0) {
        await cacheDb.documents.bulkPut(documentsToUpdate);
      }
      
      // Add new documents from backend
      if (documentsToAdd.length > 0) {
        await cacheDb.documents.bulkAdd(documentsToAdd);
      }
      
      // 🔥 CRITICAL: Ensure local-only documents are preserved (they're already in cache, but verify)
      // Local-only documents are NOT deleted, NOT updated, and NOT added - they just stay as-is
      const finalDocs = await cacheDb.documents.where('workspaceId').equals(workspaceId).toArray();
      const finalLocalOnly = finalDocs.filter(d => d.syncStatus === 'local');
      
      if (finalLocalOnly.length !== localOnlyDocs.length) {
        console.warn(`⚠️ Local-only document count mismatch: expected ${localOnlyDocs.length}, found ${finalLocalOnly.length}`);
      }
      
      const totalDocs = finalDocs.length;
      console.log(`✅ Synced documents: ${documentsToUpdate.length} updated, ${documentsToAdd.length} added, ${localOnlyDocs.length} local-only preserved (total: ${totalDocs})`);
    } catch (error) {
      console.error('❌ Failed to sync documents:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backendWorkspaceService = new BackendWorkspaceService();


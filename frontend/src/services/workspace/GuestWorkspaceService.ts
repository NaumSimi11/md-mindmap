/**
 * Guest Workspace Service
 * 
 * Manages workspaces, folders, and documents for unauthenticated users.
 * 
 * ARCHITECTURE:
 * - Storage: IndexedDB (robust, large capacity, survives page refresh)
 * - IDs: UUIDs (ws_, fld_, doc_ prefixes)
 * - Multi-workspace: Yes (user can create unlimited workspaces)
 * - Sync: Local-only (no backend sync)
 * - Migration: Seamless to authenticated user (same UUIDs)
 * 
 * GUEST USER SCENARIOS:
 * 
 * 1. First Visit (New Guest)
 *    - Generate guest user ID (guest_{uuid})
 *    - Assign fun badge (💫 Visionary, 🚀 Explorer, etc.)
 *    - Create default workspace with 2 folders (Inbox, Quick Notes)
 *    - Store in IndexedDB
 * 
 * 2. Returning Guest (Same Browser)
 *    - Load guest user from IndexedDB
 *    - Load all workspaces
 *    - Restore last active workspace
 *    - Increment session count
 * 
 * 3. Guest Creates Workspace
 *    - Generate UUID (ws_{uuid})
 *    - Create with default folders
 *    - Store in IndexedDB
 *    - Switch to new workspace
 * 
 * 4. Guest Creates Document
 *    - Generate UUID (doc_{uuid})
 *    - Store metadata in IndexedDB
 *    - Store content in Yjs IndexedDB (separate)
 * 
 * 5. Guest Switches Workspace
 *    - Update current workspace ID
 *    - Load folders/documents for new workspace
 *    - Update UI
 * 
 * 6. Guest Clears Data (Privacy)
 *    - Delete all workspaces
 *    - Delete all folders
 *    - Delete all documents
 *    - Delete guest user
 *    - Clear IndexedDB
 * 
 * 7. Guest → Authenticated (Migration)
 *    - Export all data with UUIDs
 *    - Send to backend
 *    - Backend accepts UUIDs (no remapping needed)
 *    - Clear local IndexedDB after successful sync
 */

import Dexie, { Table } from 'dexie';
import idGenerator from '@/utils/id-generator';
import type {
  Workspace,
  Folder,
  DocumentMeta,
  GuestUser,
  CreateWorkspaceInput,
  CreateFolderInput,
  CreateDocumentInput,
  UpdateWorkspaceInput,
  UpdateFolderInput,
  UpdateDocumentInput,
} from './types';

// ============================================================================
// IndexedDB Schema
// ============================================================================

class GuestDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  folders!: Table<Folder, string>;
  documents!: Table<DocumentMeta, string>;
  guestUser!: Table<GuestUser, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('MDReaderGuest');
    
    this.version(1).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      folders: 'id, workspaceId, parentId, name, position',
      documents: 'id, workspaceId, folderId, title, type, starred, lastOpenedAt',
      guestUser: 'id, createdAt, lastSeenAt',
      settings: 'key',
    });
  }
}

const db = new GuestDatabase();

// ============================================================================
// Guest User Badges (Fun Identifiers)
// ============================================================================

const GUEST_BADGES = [
  '💫 Visionary',
  '🚀 Explorer',
  '🎨 Creator',
  '📚 Scholar',
  '🌟 Dreamer',
  '🔥 Maverick',
  '🌈 Innovator',
  '⚡ Catalyst',
  '🎯 Achiever',
  '🌊 Navigator',
  '🎭 Storyteller',
  '🔮 Mystic',
  '🏔️ Pioneer',
  '🌸 Cultivator',
  '⚔️ Warrior',
];

function getRandomBadge(): string {
  return GUEST_BADGES[Math.floor(Math.random() * GUEST_BADGES.length)];
}

// ============================================================================
// Guest Workspace Service
// ============================================================================

export class GuestWorkspaceService {
  private currentWorkspaceId: string | null = null;
  private guestUser: GuestUser | null = null;
  private isInitialized = false;

  /**
   * Initialize service
   * - Load or create guest user
   * - Load or create default workspace
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ GuestWorkspaceService already initialized');
      return;
    }

    console.log('🔵 GuestWorkspaceService.init()');

    try {
      // Load or create guest user
      await this.initGuestUser();

      // Load or create default workspace
      await this.initWorkspaces();

      this.isInitialized = true;
      console.log('✅ GuestWorkspaceService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize GuestWorkspaceService:', error);
      throw error;
    }
  }

  /**
   * Initialize guest user
   */
  private async initGuestUser(): Promise<void> {
    // Try to load existing guest user
    const users = await db.guestUser.toArray();
    
    if (users.length > 0) {
      // Returning guest
      this.guestUser = users[0];
      this.guestUser.sessionCount++;
      this.guestUser.lastSeenAt = new Date().toISOString();
      await db.guestUser.put(this.guestUser);
      
      console.log(`👋 Welcome back, ${this.guestUser.badge}! (Session #${this.guestUser.sessionCount})`);
    } else {
      // New guest
      const now = new Date().toISOString();
      this.guestUser = {
        id: idGenerator.guest(),
        badge: getRandomBadge(),
        sessionCount: 1,
        createdAt: now,
        lastSeenAt: now,
      };
      await db.guestUser.add(this.guestUser);
      
      console.log(`🎉 Welcome, ${this.guestUser.badge}!`);
    }
  }

  /**
   * Initialize workspaces
   */
  private async initWorkspaces(): Promise<void> {
    const workspaces = await db.workspaces.toArray();
    
    if (workspaces.length === 0) {
      // Create default workspace
      console.log('🆕 Creating default workspace...');
      const workspace = await this.createDefaultWorkspace();
      this.currentWorkspaceId = workspace.id;
    } else {
      // Load last active workspace
      const lastWorkspaceId = await this.getSetting('lastWorkspaceId');
      if (lastWorkspaceId && workspaces.find(w => w.id === lastWorkspaceId)) {
        this.currentWorkspaceId = lastWorkspaceId;
      } else {
        this.currentWorkspaceId = workspaces[0].id;
      }
      console.log(`📦 Loaded ${workspaces.length} workspace(s)`);
    }
  }

  /**
   * Create default workspace with initial folders
   * Named "Local Workspace" to differentiate from cloud workspace
   */
  private async createDefaultWorkspace(): Promise<Workspace> {
    const now = new Date().toISOString();
    
    const workspace: Workspace = {
      id: idGenerator.workspace(),
      name: 'Local Workspace',
      icon: '💻',
      description: 'Your local workspace (not synced to cloud)',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
      version: 1,
    };
    
    await db.workspaces.add(workspace);
    
    // Create default folders
    const folders: Folder[] = [
      {
        id: idGenerator.folder(),
        workspaceId: workspace.id,
        name: 'Getting Started',
        icon: '🚀',
        parentId: null,
        position: 0,
        isExpanded: true,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
        version: 1,
      },
      {
        id: idGenerator.folder(),
        workspaceId: workspace.id,
        name: 'Quick Notes',
        icon: '⚡',
        parentId: null,
        position: 1,
        isExpanded: true,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
        version: 1,
      },
    ];
    
    await db.folders.bulkAdd(folders);
    
    console.log(`✅ Created workspace: ${workspace.name} with ${folders.length} folders`);
    return workspace;
  }

  // ==========================================================================
  // Guest User Methods
  // ==========================================================================

  /**
   * Get current guest user
   */
  getGuestUser(): GuestUser | null {
    return this.guestUser;
  }

  // ==========================================================================
  // Workspace Methods
  // ==========================================================================

  /**
   * Get all workspaces
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    return db.workspaces.orderBy('createdAt').toArray();
  }

  /**
   * Get current workspace
   */
  async getCurrentWorkspace(): Promise<Workspace | null> {
    if (!this.currentWorkspaceId) return null;
    return db.workspaces.get(this.currentWorkspaceId) || null;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    return db.workspaces.get(id) || null;
  }

  /**
   * Create workspace
   */
  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const now = new Date().toISOString();
    
    const workspace: Workspace = {
      id: idGenerator.workspace(),
      name: input.name,
      icon: input.icon || '📁',
      description: input.description,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
      version: 1,
    };
    
    await db.workspaces.add(workspace);
    
    // Create default folder
    const folder: Folder = {
      id: idGenerator.folder(),
      workspaceId: workspace.id,
      name: 'Getting Started',
      icon: '🚀',
      parentId: null,
      position: 0,
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
      version: 1,
    };
    
    await db.folders.add(folder);
    
    console.log(`✅ Created workspace: ${workspace.name}`);
    return workspace;
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<void> {
    const workspace = await db.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`);
    }
    
    const updates: Partial<Workspace> = {
      ...input,
      updatedAt: new Date().toISOString(),
      version: workspace.version + 1,
    };
    
    await db.workspaces.update(id, updates);
    console.log(`✅ Updated workspace: ${id}`);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    // Delete all folders in workspace
    await db.folders.where('workspaceId').equals(id).delete();
    
    // Delete all documents in workspace
    await db.documents.where('workspaceId').equals(id).delete();
    
    // Delete workspace
    await db.workspaces.delete(id);
    
    // If this was current workspace, switch to another
    if (this.currentWorkspaceId === id) {
      const workspaces = await db.workspaces.toArray();
      this.currentWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
      if (this.currentWorkspaceId) {
        await this.setSetting('lastWorkspaceId', this.currentWorkspaceId);
      }
    }
    
    console.log(`✅ Deleted workspace: ${id}`);
  }

  /**
   * Switch to workspace
   */
  async switchWorkspace(id: string): Promise<void> {
    const workspace = await db.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`);
    }
    
    this.currentWorkspaceId = id;
    await this.setSetting('lastWorkspaceId', id);
    
    console.log(`✅ Switched to workspace: ${workspace.name}`);
  }

  // ==========================================================================
  // Folder Methods
  // ==========================================================================

  /**
   * Get all folders in workspace
   */
  async getFolders(workspaceId?: string): Promise<Folder[]> {
    const wsId = workspaceId || this.currentWorkspaceId;
    if (!wsId) return [];
    
    return db.folders
      .where('workspaceId').equals(wsId)
      .sortBy('position');
  }

  /**
   * Get folder by ID
   */
  async getFolder(id: string): Promise<Folder | null> {
    return db.folders.get(id) || null;
  }

  /**
   * Create folder
   */
  async createFolder(input: CreateFolderInput): Promise<Folder> {
    const now = new Date().toISOString();
    
    // Get max position for ordering
    const siblings = await db.folders
      .where('workspaceId').equals(input.workspaceId)
      .and(f => f.parentId === (input.parentId || null))
      .toArray();
    
    const maxPosition = siblings.reduce((max, f) => Math.max(max, f.position), -1);
    
    const folder: Folder = {
      id: idGenerator.folder(),
      workspaceId: input.workspaceId,
      name: input.name,
      icon: input.icon || '📁',
      parentId: input.parentId || null,
      position: maxPosition + 1,
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
      version: 1,
    };
    
    await db.folders.add(folder);
    console.log(`✅ Created folder: ${folder.name}`);
    return folder;
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, input: UpdateFolderInput): Promise<void> {
    const folder = await db.folders.get(id);
    if (!folder) {
      throw new Error(`Folder ${id} not found`);
    }
    
    const updates: Partial<Folder> = {
      ...input,
      updatedAt: new Date().toISOString(),
      version: folder.version + 1,
    };
    
    await db.folders.update(id, updates);
    console.log(`✅ Updated folder: ${id}`);
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    // Move documents to parent folder or root
    const folder = await db.folders.get(id);
    if (folder) {
      await db.documents
        .where('folderId').equals(id)
        .modify({ folderId: folder.parentId });
    }
    
    // Delete folder
    await db.folders.delete(id);
    console.log(`✅ Deleted folder: ${id}`);
  }

  // ==========================================================================
  // Document Methods
  // ==========================================================================

  /**
   * Get all documents in workspace
   */
  async getDocuments(workspaceId?: string): Promise<DocumentMeta[]> {
    const wsId = workspaceId || this.currentWorkspaceId;
    if (!wsId) return [];
    
    return db.documents
      .where('workspaceId').equals(wsId)
      .reverse()
      .sortBy('updatedAt');
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<DocumentMeta | null> {
    return db.documents.get(id) || null;
  }

  /**
   * Create document
   */
  async createDocument(input: CreateDocumentInput): Promise<DocumentMeta> {
    const now = new Date().toISOString();
    
    const document: DocumentMeta = {
      id: idGenerator.document(),
      workspaceId: input.workspaceId,
      folderId: input.folderId || null,
      title: input.title,
      type: input.type,
      content: input.content || '',  // 🔥 Store content in IndexedDB
      starred: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
      version: 1,
    };
    
    await db.documents.add(document);
    console.log(`✅ Created document: ${document.title} (${document.content.length} chars)`);
    return document;
  }

  /**
   * Update document
   */
  async updateDocument(id: string, input: UpdateDocumentInput): Promise<void> {
    let document = await db.documents.get(id);
    if (!document) {
      // Auto-create fallback: fill in best guess for missing fields.
      document = {
        id,
        workspaceId: input.workspaceId || 'unknown',
        folderId: input.folderId || null,
        title: input.title || 'Untitled',
        type: 'markdown',
        content: input.content || '',
        starred: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'local',
        version: 1,
      };
      await db.documents.add(document);
      console.log(`✅ Auto-created missing document in update: ${id}`);
      return;
    }

    const updates: Partial<DocumentMeta> = {
      ...input,
      updatedAt: new Date().toISOString(),
      version: document.version + 1,
    };

    await db.documents.update(id, updates);
    const contentInfo = input.content !== undefined ? ` (content: ${input.content.length} chars)` : '';
    console.log(`✅ Updated document: ${id}${contentInfo}`);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id);
    console.log(`✅ Deleted document: ${id}`);
  }

  /**
   * Mark document as opened (for recents)
   */
  async markDocumentOpened(id: string): Promise<void> {
    await db.documents.update(id, {
      lastOpenedAt: new Date().toISOString(),
    });
  }

  // ==========================================================================
  // Settings (Internal)
  // ==========================================================================

  private async getSetting(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  private async setSetting(key: string, value: any): Promise<void> {
    await db.settings.put({ key, value });
  }

  // ==========================================================================
  // Migration & Export
  // ==========================================================================

  /**
   * Export all data for migration to authenticated user
   */
  async exportForMigration() {
    return {
      guestUser: this.guestUser,
      workspaces: await db.workspaces.toArray(),
      folders: await db.folders.toArray(),
      documents: await db.documents.toArray(),
    };
  }

  /**
   * Clear all guest data (after successful migration or privacy reset)
   */
  async clearAllData(): Promise<void> {
    await db.workspaces.clear();
    await db.folders.clear();
    await db.documents.clear();
    await db.guestUser.clear();
    await db.settings.clear();
    
    this.currentWorkspaceId = null;
    this.guestUser = null;
    this.isInitialized = false;
    
    console.log('✅ All guest data cleared');
  }

  // ==========================================================================
  // Migration Helpers (for localStorage → IndexedDB migration)
  // ==========================================================================

  /**
   * Add workspace directly (for migration only - bypasses validation)
   * @internal Used by migration script
   */
  async addWorkspaceRaw(workspace: Workspace): Promise<void> {
    await db.workspaces.add(workspace);
  }

  /**
   * Add folder directly (for migration only - bypasses validation)
   * @internal Used by migration script
   */
  async addFolderRaw(folder: Folder): Promise<void> {
    await db.folders.add(folder);
  }

  /**
   * Add document directly (for migration only - bypasses validation)
   * @internal Used by migration script
   */
  async addDocumentRaw(document: DocumentMeta): Promise<void> {
    await db.documents.add(document);
  }
}

// Export singleton instance
export const guestWorkspaceService = new GuestWorkspaceService();


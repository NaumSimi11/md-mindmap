/**
 * GuestWorkspaceService (LEGACY - DEPRECATED)
 * 
 * ⚠️ **DEPRECATED**: This service has been replaced by the IndexedDB-based
 * GuestWorkspaceService at `@/services/workspace/GuestWorkspaceService`.
 * 
 * This file is kept for reference only. DO NOT USE IN NEW CODE.
 * 
 * Migration: Data is automatically migrated from localStorage → IndexedDB
 * on app initialization (see `migrateToIndexedDB.ts`).
 * 
 * Old Architecture (localStorage):
 * - Workspace metadata: localStorage
 * - Folder structure: localStorage
 * - Document metadata + content: localStorage
 * 
 * New Architecture (IndexedDB):
 * - All data: IndexedDB (better scalability, no 5MB limit)
 * - See: frontend/src/services/workspace/GuestWorkspaceService.ts
 */

import type { SyncMetadata } from '@/types/sync.types';

export interface GuestWorkspace {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  sync: SyncMetadata;
}

export interface GuestFolder {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  workspaceId: string;
  position: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
  sync: SyncMetadata;
}

export interface GuestDocumentMeta {
  id: string;
  title: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  content?: string; // 🔥 Content stored in localStorage (not Yjs anymore)
  folderId: string | null;
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  sync: SyncMetadata;
}

const GUEST_WORKSPACES_KEY = 'mdreader:guest:workspaces'; // All workspaces
const GUEST_CURRENT_WORKSPACE_KEY = 'mdreader:guest:current-workspace-id'; // Currently active workspace ID
const GUEST_FOLDERS_KEY = 'mdreader:guest:folders'; // All folders across all workspaces
const GUEST_DOCUMENTS_KEY = 'mdreader:guest:documents'; // All documents across all workspaces

// Legacy keys (for migration)
const LEGACY_GUEST_WORKSPACE_KEY = 'mdreader-guest-workspace';
const LEGACY_GUEST_FOLDERS_KEY = 'mdreader-guest-folders';
const LEGACY_GUEST_DOCUMENTS_KEY = 'mdreader-guest-documents';

class GuestWorkspaceService {
  private workspaces: GuestWorkspace[] = []; // All workspaces
  private workspace: GuestWorkspace | null = null; // Current workspace
  private folders: GuestFolder[] = [];
  private documents: GuestDocumentMeta[] = [];

  /**
   * Initialize guest workspaces (migrate from legacy if needed)
   */
  init(): void {
    
    // Try loading new format
    const savedWorkspaces = localStorage.getItem(GUEST_WORKSPACES_KEY);
    const currentWorkspaceId = localStorage.getItem(GUEST_CURRENT_WORKSPACE_KEY);
    
    if (savedWorkspaces) {
      // Load all workspaces
      this.workspaces = JSON.parse(savedWorkspaces);
      
      // Set current workspace
      if (currentWorkspaceId) {
        this.workspace = this.workspaces.find(w => w.id === currentWorkspaceId) || null;
      }
      
      // Fallback to first workspace if current not found
      if (!this.workspace && this.workspaces.length > 0) {
        this.workspace = this.workspaces[0];
        localStorage.setItem(GUEST_CURRENT_WORKSPACE_KEY, this.workspace.id);
      }
      
      this.loadFolders();
      this.loadDocuments();
    } else {
      // Try migrating from legacy format
      const legacyWorkspace = localStorage.getItem(LEGACY_GUEST_WORKSPACE_KEY);
      
      if (legacyWorkspace) {
        this.workspace = JSON.parse(legacyWorkspace);
        
        // Ensure UUID and sync metadata
        if (this.workspace.id === 'guest-workspace') {
          this.workspace.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        if (!this.workspace.sync) {
          this.workspace.sync = { status: 'local', localVersion: 1 };
        }
        
        this.workspaces = [this.workspace];
        this.loadFolders();
        this.loadDocuments();
        this.saveAll(); // Save in new format
        
      } else {
        // Create new default workspace
        this.createDefaultWorkspace();
      }
    }
    
    
  }

  /**
   * Create default workspace with initial folder structure
   */
  private createDefaultWorkspace(): void {
    const now = new Date().toISOString();
    
    // Create workspace with UUID
    this.workspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'My Workspace',
      icon: '💻',
      createdAt: now,
      updatedAt: now,
      sync: {
        status: 'local',
        localVersion: 1,
      },
    };
    
    this.workspaces = [this.workspace];
    
    // Create default folders
    this.folders = [
      {
        id: 'folder-quick-notes',
        name: 'Quick Notes',
        icon: '📝',
        parentId: null,
        workspaceId: this.workspace.id,
        position: 0,
        isExpanded: true,
        createdAt: now,
        updatedAt: now,
        sync: {
          status: 'local',
          localVersion: 1,
        },
      },
      {
        id: 'folder-projects',
        name: 'Projects',
        icon: '📂',
        parentId: null,
        workspaceId: this.workspace.id,
        position: 1,
        isExpanded: true,
        createdAt: now,
        updatedAt: now,
        sync: {
          status: 'local',
          localVersion: 1,
        },
      },
    ];
    
    this.documents = [];
    
    // Save to localStorage
    this.save();
    
  }

  /**
   * Get current workspace
   */
  getWorkspace(): GuestWorkspace | null {
    return this.workspace;
  }

  /**
   * Rename workspace
   */
  renameWorkspace(newName: string): void {
    if (!this.workspace) {
      console.warn('⚠️ No workspace to rename');
      return;
    }

    if (!newName || newName.trim() === '') {
      console.warn('⚠️ Workspace name cannot be empty');
      return;
    }

    this.workspace.name = newName.trim();
    this.workspace.updatedAt = new Date().toISOString();
    this.save();
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): GuestWorkspace[] {
    return this.workspaces;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: { name: string; icon: string; description?: string }): Promise<GuestWorkspace> {
    const now = new Date().toISOString();
    
    const newWorkspace: GuestWorkspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      icon: data.icon,
      createdAt: now,
      updatedAt: now,
      sync: {
        status: 'local',
        localVersion: 1,
      },
    };
    
    this.workspaces.push(newWorkspace);
    this.saveAll();
    
    return newWorkspace;
  }

  /**
   * Switch to a different workspace
   */
  async switchWorkspace(workspaceId: string): Promise<void> {
    const targetWorkspace = this.workspaces.find(w => w.id === workspaceId);
    
    if (!targetWorkspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    this.workspace = targetWorkspace;
    localStorage.setItem(GUEST_CURRENT_WORKSPACE_KEY, workspaceId);
    
    // Reload folders and documents for this workspace
    this.loadFolders();
    this.loadDocuments();
    
  }

  /**
   * Get all folders
   */
  getFolders(): GuestFolder[] {
    return this.folders;
  }

  /**
   * Get folders by parent
   */
  getFoldersByParent(parentId: string | null): GuestFolder[] {
    return this.folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get folder by ID
   */
  getFolder(folderId: string): GuestFolder | undefined {
    return this.folders.find(f => f.id === folderId);
  }

  /**
   * Create new folder
   */
  createFolder(name: string, icon: string = '📁', parentId: string | null = null): GuestFolder {
    if (!this.workspace) {
      throw new Error('No guest workspace initialized');
    }

    const siblings = this.folders.filter(f => f.parentId === parentId);
    const position = siblings.length;

    const folder: GuestFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      icon,
      parentId,
      workspaceId: this.workspace.id,
      position,
      isExpanded: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sync: {
        status: 'local',
        localVersion: 1,
      },
    };

    this.folders.push(folder);
    this.save();

    return folder;
  }

  /**
   * Update folder
   */
  updateFolder(folderId: string, updates: Partial<Omit<GuestFolder, 'id' | 'workspaceId' | 'createdAt'>>): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error(`Folder ${folderId} not found`);
    }

    Object.assign(folder, updates, { updatedAt: new Date().toISOString() });
    this.save();

  }

  /**
   * Delete folder (cascade delete documents inside)
   */
  deleteFolder(folderId: string, cascade: boolean = false): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return;

    if (cascade) {
      // Delete all documents in this folder
      this.documents = this.documents.filter(d => d.folderId !== folderId);
      
      // Recursively delete child folders
      const childFolders = this.folders.filter(f => f.parentId === folderId);
      childFolders.forEach(child => this.deleteFolder(child.id, true));
    } else {
      // Move documents to root
      this.documents.forEach(d => {
        if (d.folderId === folderId) {
          d.folderId = null;
        }
      });
      
      // Move child folders to parent
      this.folders.forEach(f => {
        if (f.parentId === folderId) {
          f.parentId = folder.parentId;
        }
      });
    }

    this.folders = this.folders.filter(f => f.id !== folderId);
    this.save();

  }

  /**
   * Get documents for a workspace (or current workspace if not specified)
   */
  getDocuments(workspaceId?: string): GuestDocumentMeta[] {
    const targetWorkspaceId = workspaceId || this.workspace?.id;
    if (!targetWorkspaceId) {
      return [];
    }
    return this.documents.filter(d => d.workspaceId === targetWorkspaceId);
  }

  /**
   * Get all documents (alias for compatibility)
   */
  getAllDocuments(): GuestDocumentMeta[] {
    return this.documents;
  }

  /**
   * Get document by ID
   */
  getDocument(documentId: string): GuestDocumentMeta | undefined {
    return this.documents.find(d => d.id === documentId);
  }

  /**
   * Get documents by folder
   */
  getDocumentsByFolder(folderId: string | null): GuestDocumentMeta[] {
    return this.documents.filter(d => d.folderId === folderId);
  }

  /**
   * Create document (metadata + content stored in localStorage)
   */
  createDocument(
    id: string,
    title: string,
    type: 'markdown' | 'mindmap' | 'presentation',
    folderId: string | null = null
  ): GuestDocumentMeta {
    if (!this.workspace) {
      throw new Error('No guest workspace initialized');
    }

    const doc: GuestDocumentMeta = {
      id,
      title,
      type,
      folderId,
      workspaceId: this.workspace.id,
      starred: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sync: {
        status: 'local',
        localVersion: 1,
      },
    };

    this.documents.push(doc);
    this.save();

    return doc;
  }

  /**
   * Update document metadata
   */
  updateDocument(documentId: string, updates: Partial<Omit<GuestDocumentMeta, 'id' | 'workspaceId' | 'createdAt'>>): void {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
    this.save();

  }

  /**
   * Delete document (metadata + content removed from localStorage)
   */
  deleteDocument(documentId: string): void {
    this.documents = this.documents.filter(d => d.id !== documentId);
    this.save();

  }

  /**
   * Move document to folder
   */
  moveDocument(documentId: string, targetFolderId: string | null): void {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    doc.folderId = targetFolderId;
    doc.updatedAt = new Date().toISOString();
    this.save();

  }

  /**
   * Load folders from localStorage
   */
  private loadFolders(): void {
    const saved = localStorage.getItem(GUEST_FOLDERS_KEY);
    if (saved) {
      this.folders = JSON.parse(saved);
      // Ensure sync metadata exists (backward compatibility)
      this.folders = this.folders.map(f => ({
        ...f,
        sync: f.sync || { status: 'local', localVersion: 1 },
      }));
    }
  }

  /**
   * Load documents from localStorage
   */
  private loadDocuments(): void {
    const saved = localStorage.getItem(GUEST_DOCUMENTS_KEY);
    if (saved) {
      this.documents = JSON.parse(saved);
      // Ensure sync metadata exists (backward compatibility)
      this.documents = this.documents.map(d => ({
        ...d,
        sync: d.sync || { status: 'local', localVersion: 1 },
      }));
    }
  }

  /**
   * Save to localStorage
   */
  private save(): void {
    // Update current workspace in workspaces array
    if (this.workspace) {
      const index = this.workspaces.findIndex(w => w.id === this.workspace!.id);
      if (index >= 0) {
        this.workspaces[index] = this.workspace;
      } else {
        this.workspaces.push(this.workspace);
      }
      localStorage.setItem(GUEST_CURRENT_WORKSPACE_KEY, this.workspace.id);
    }
    
    this.saveAll();
  }
  
  /**
   * Save all workspaces, folders, and documents
   */
  private saveAll(): void {
    localStorage.setItem(GUEST_WORKSPACES_KEY, JSON.stringify(this.workspaces));
    localStorage.setItem(GUEST_FOLDERS_KEY, JSON.stringify(this.folders));
    localStorage.setItem(GUEST_DOCUMENTS_KEY, JSON.stringify(this.documents));
  }

  /**
   * Clear all guest data (for migration or reset)
   */
  clear(): void {
    this.workspaces = [];
    this.workspace = null;
    this.folders = [];
    this.documents = [];
    
    localStorage.removeItem(GUEST_WORKSPACES_KEY);
    localStorage.removeItem(GUEST_CURRENT_WORKSPACE_KEY);
    localStorage.removeItem(GUEST_FOLDERS_KEY);
    localStorage.removeItem(GUEST_DOCUMENTS_KEY);
    
    // Also clear legacy keys
    localStorage.removeItem(LEGACY_GUEST_WORKSPACE_KEY);
    localStorage.removeItem(LEGACY_GUEST_FOLDERS_KEY);
    localStorage.removeItem(LEGACY_GUEST_DOCUMENTS_KEY);
    
  }

  /**
   * Export guest data for migration to cloud
   */
  exportForMigration() {
    return {
      workspace: this.workspace,
      folders: this.folders,
      documents: this.documents,
    };
  }
}

// Singleton instance
export const guestWorkspaceService = new GuestWorkspaceService();


/**
 * WorkspaceService - Manage folders and documents in a workspace
 * 
 * @deprecated This service is deprecated and replaced by:
 * - GuestWorkspaceService: For unauthenticated users (localStorage)
 * - BackendWorkspaceService: For authenticated users (FastAPI backend)
 * - Yjs IndexedDB: For document content storage
 * 
 * This file is kept temporarily for backward compatibility.
 * Will be removed in v2.0.0 (estimated: Q1 2026)
 * 
 * Migration Guide:
 * - Guest mode: Use GuestWorkspaceService
 * - Auth mode: Use BackendWorkspaceService
 * - Content: Use Yjs (via useYjsDocument hook)
 * 
 * Legacy features (DEPRECATED):
 * - Folder hierarchy
 * - Document CRUD operations
 * - Search functionality
 * - Recent documents tracking
 * - Favorites/starred items
 * - Hybrid storage (localStorage for web, file system for desktop)
 */

import { storageService } from '../storage/StorageService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  icon: string; // Emoji
  folders: Folder[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  parentId: string | null; // null = root folder
  workspaceId: string;
  order: number; // For custom ordering
  expanded: boolean; // UI state: is folder expanded?
  createdAt: Date;
}

export interface Document {
  id: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  title: string;
  content: string; // Markdown or JSON string
  folderId: string | null; // null = root level
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;
  metadata: {
    wordCount?: number;
    slideCount?: number;
    nodeCount?: number;
    lastEditedBy?: string;
  };
}

// ============================================================================
// WorkspaceService Class
// ============================================================================

export class WorkspaceService {
  private storageKey = 'md-workspace';
  private currentWorkspace: Workspace | null = null;

  constructor() {
    this.init();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private init(): void {
    const existing = this.loadFromStorage();
    if (existing) {
      this.currentWorkspace = existing;
    } else {
      this.currentWorkspace = this.createDefaultWorkspace();
      this.saveToStorage();
    }
  }

  private loadFromStorage(): Workspace | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        parsed.folders = parsed.folders.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
        }));
        parsed.documents = parsed.documents.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          lastOpenedAt: d.lastOpenedAt ? new Date(d.lastOpenedAt) : undefined,
        }));
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
    return null;
  }

  private saveToStorage(): void {
    if (!this.currentWorkspace) return;
    
    try {
      this.currentWorkspace.updatedAt = new Date();
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentWorkspace));
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }

  private createDefaultWorkspace(): Workspace {
    return {
      id: `workspace-${Date.now()}`,
      name: 'My Workspace',
      icon: '🚀',
      folders: [
        {
          id: `folder-${Date.now()}-1`,
          name: 'Personal',
          icon: '👤',
          parentId: null,
          workspaceId: `workspace-${Date.now()}`,
          order: 0,
          expanded: true,
          createdAt: new Date(),
        },
        {
          id: `folder-${Date.now()}-2`,
          name: 'Work',
          icon: '💼',
          parentId: null,
          workspaceId: `workspace-${Date.now()}`,
          order: 1,
          expanded: true,
          createdAt: new Date(),
        },
      ],
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ==========================================================================
  // Workspace Methods
  // ==========================================================================

  getCurrentWorkspace(): Workspace {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }
    return this.currentWorkspace;
  }

  updateWorkspace(updates: Partial<Workspace>): void {
    if (!this.currentWorkspace) return;
    
    this.currentWorkspace = {
      ...this.currentWorkspace,
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage();
  }

  // ==========================================================================
  // Folder Methods
  // ==========================================================================

  createFolder(name: string, parentId: string | null = null, icon: string = '📁'): Folder {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }

    const folder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      icon,
      parentId,
      workspaceId: this.currentWorkspace.id,
      order: this.currentWorkspace.folders.filter(f => f.parentId === parentId).length,
      expanded: true,
      createdAt: new Date(),
    };

    this.currentWorkspace.folders.push(folder);
    this.saveToStorage();

    return folder;
  }

  deleteFolder(folderId: string): void {
    if (!this.currentWorkspace) return;

    // Move documents in this folder to parent
    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (folder) {
      this.currentWorkspace.documents.forEach(doc => {
        if (doc.folderId === folderId) {
          doc.folderId = folder.parentId;
        }
      });
    }

    // Delete folder and all subfolders
    const foldersToDelete = this.getFolderAndSubfolders(folderId);
    this.currentWorkspace.folders = this.currentWorkspace.folders.filter(
      f => !foldersToDelete.includes(f.id)
    );

    this.saveToStorage();
  }

  renameFolder(folderId: string, newName: string): void {
    if (!this.currentWorkspace) return;

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (folder) {
      folder.name = newName;
      this.saveToStorage();
    }
  }

  updateFolderIcon(folderId: string, newIcon: string): void {
    if (!this.currentWorkspace) return;

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (folder) {
      folder.icon = newIcon;
      this.saveToStorage();
    }
  }

  toggleFolderExpanded(folderId: string): void {
    if (!this.currentWorkspace) return;

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (folder) {
      folder.expanded = !folder.expanded;
      this.saveToStorage();
    }
  }

  moveFolder(folderId: string, newParentId: string | null): void {
    if (!this.currentWorkspace) return;

    // Prevent moving a folder into itself or its descendants
    const descendants = this.getFolderAndSubfolders(folderId);
    if (newParentId && descendants.includes(newParentId)) {
      console.warn('Cannot move folder into itself or its descendants');
      return;
    }

    const folder = this.currentWorkspace.folders.find(f => f.id === folderId);
    if (folder) {
      folder.parentId = newParentId;
      this.saveToStorage();
    }
  }

  private getFolderAndSubfolders(folderId: string): string[] {
    if (!this.currentWorkspace) return [];

    const result = [folderId];
    const children = this.currentWorkspace.folders.filter(f => f.parentId === folderId);
    
    for (const child of children) {
      result.push(...this.getFolderAndSubfolders(child.id));
    }
    
    return result;
  }

  getFolderTree(): Folder[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.folders.filter(f => f.parentId === null);
  }

  getSubfolders(parentId: string): Folder[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  // ==========================================================================
  // Document Methods
  // ==========================================================================

  async createDocument(
    type: Document['type'],
    title: string,
    content: string = '',
    folderId: string | null = null
  ): Promise<Document> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }

    const document: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      content,
      folderId,
      workspaceId: this.currentWorkspace.id,
      starred: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    };

    // Save content to hybrid storage (file system on desktop, localStorage on web)
    if (storageService.isDesktop() && storageService.hasWorkspace()) {
      try {
        await storageService.saveDocument(document.id, content, title);
      } catch (error) {
        console.error('Failed to save document to file system:', error);
        // Fall back to localStorage
      }
    }

    this.currentWorkspace.documents.push(document);
    this.saveToStorage();

    return document;
  }

  getDocument(documentId: string): Document | undefined {
    if (!this.currentWorkspace) return undefined;
    return this.currentWorkspace.documents.find(d => d.id === documentId);
  }

  async getDocumentWithContent(documentId: string): Promise<Document | undefined> {
    const doc = this.getDocument(documentId);
    if (!doc) return undefined;

    // On desktop with workspace, load content from file system
    if (storageService.isDesktop() && storageService.hasWorkspace()) {
      try {
        const fileData = await storageService.loadDocument(documentId);
        if (fileData) {
          // Return document with fresh content from file
          return {
            ...doc,
            content: fileData.content,
          };
        }
      } catch (error) {
        console.error('Failed to load document from file system:', error);
      }
    }

    // Fall back to in-memory content
    return doc;
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    if (!this.currentWorkspace) return;

    const doc = this.currentWorkspace.documents.find(d => d.id === documentId);
    if (doc) {
      Object.assign(doc, updates);
      doc.updatedAt = new Date();

      // Save content to hybrid storage if content was updated
      if (updates.content !== undefined && storageService.isDesktop() && storageService.hasWorkspace()) {
        try {
          await storageService.saveDocument(documentId, updates.content, doc.title);
        } catch (error) {
          console.error('Failed to save document to file system:', error);
        }
      }

      this.saveToStorage();
      // Document updated (removed log to reduce console noise)
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.currentWorkspace) return;

    // Delete from hybrid storage
    if (storageService.isDesktop() && storageService.hasWorkspace()) {
      try {
        await storageService.deleteDocument(documentId);
      } catch (error) {
        console.error('Failed to delete document from file system:', error);
      }
    }

    this.currentWorkspace.documents = this.currentWorkspace.documents.filter(
      d => d.id !== documentId
    );
    this.saveToStorage();
  }

  moveDocument(documentId: string, folderId: string | null): void {
    if (!this.currentWorkspace) return;

    const doc = this.currentWorkspace.documents.find(d => d.id === documentId);
    if (doc) {
      doc.folderId = folderId;
      this.saveToStorage();
    }
  }

  toggleStar(documentId: string): void {
    if (!this.currentWorkspace) return;

    const doc = this.currentWorkspace.documents.find(d => d.id === documentId);
    if (doc) {
      doc.starred = !doc.starred;
      this.saveToStorage();
    }
  }

  markDocumentOpened(documentId: string): void {
    if (!this.currentWorkspace) return;

    const doc = this.currentWorkspace.documents.find(d => d.id === documentId);
    if (doc) {
      doc.lastOpenedAt = new Date();
      this.saveToStorage();
    }
  }

  getDocumentsInFolder(folderId: string | null): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents
      .filter(d => d.folderId === folderId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getAllDocuments(): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents;
  }

  getStarredDocuments(): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents
      .filter(d => d.starred)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getRecentDocuments(limit: number = 10): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents
      .filter(d => d.lastOpenedAt)
      .sort((a, b) => {
        const aTime = a.lastOpenedAt?.getTime() || 0;
        const bTime = b.lastOpenedAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  // ==========================================================================
  // Search Methods
  // ==========================================================================

  searchDocuments(query: string): Document[] {
    if (!this.currentWorkspace || !query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return this.currentWorkspace.documents.filter(doc => {
      // Search in title
      if (doc.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in content (for markdown)
      if (doc.type === 'markdown' && doc.content.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in tags
      if (doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      return false;
    }).sort((a, b) => {
      // Prioritize title matches
      const aInTitle = a.title.toLowerCase().includes(lowerQuery);
      const bInTitle = b.title.toLowerCase().includes(lowerQuery);
      if (aInTitle && !bInTitle) return -1;
      if (!aInTitle && bInTitle) return 1;
      
      // Then sort by update date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  searchByType(type: Document['type']): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents.filter(d => d.type === type);
  }

  searchByTags(tags: string[]): Document[] {
    if (!this.currentWorkspace) return [];
    return this.currentWorkspace.documents.filter(doc =>
      tags.some(tag => doc.tags.includes(tag))
    );
  }

  // ==========================================================================
  // Statistics & Utilities
  // ==========================================================================

  getWorkspaceStats() {
    if (!this.currentWorkspace) {
      return {
        totalDocuments: 0,
        totalFolders: 0,
        markdownDocs: 0,
        mindmaps: 0,
        presentations: 0,
        starredDocs: 0,
      };
    }

    return {
      totalDocuments: this.currentWorkspace.documents.length,
      totalFolders: this.currentWorkspace.folders.length,
      markdownDocs: this.currentWorkspace.documents.filter(d => d.type === 'markdown').length,
      mindmaps: this.currentWorkspace.documents.filter(d => d.type === 'mindmap').length,
      presentations: this.currentWorkspace.documents.filter(d => d.type === 'presentation').length,
      starredDocs: this.currentWorkspace.documents.filter(d => d.starred).length,
    };
  }

  // ==========================================================================
  // Import/Export (for migration)
  // ==========================================================================

  importDocument(doc: Partial<Document>): Document {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }

    const document: Document = {
      id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: doc.type || 'markdown',
      title: doc.title || 'Untitled',
      content: doc.content || '',
      folderId: doc.folderId || null,
      workspaceId: this.currentWorkspace.id,
      starred: doc.starred || false,
      tags: doc.tags || [],
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
      lastOpenedAt: doc.lastOpenedAt,
      metadata: doc.metadata || {},
    };

    this.currentWorkspace.documents.push(document);
    this.saveToStorage();

    return document;
  }

  exportWorkspace(): Workspace {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }
    return JSON.parse(JSON.stringify(this.currentWorkspace));
  }

  // ==========================================================================
  // Desktop File System Integration
  // ==========================================================================

  async selectDesktopWorkspaceFolder(): Promise<string | null> {
    if (!storageService.isDesktop()) {
      console.warn('Workspace folder selection only available in desktop mode');
      return null;
    }

    const path = await storageService.selectWorkspaceFolder();
    if (path) {
      // Automatically sync after selecting
      await this.syncDesktopFolder();
    }
    return path;
  }

  async listDesktopFiles() {
    if (!storageService.isDesktop() || !storageService.hasWorkspace()) {
      return [];
    }

    return await storageService.listWorkspaceFiles();
  }

  async syncDesktopFolder(): Promise<number> {
    // Import existing .md files from the selected desktop folder
    if (!storageService.isDesktop() || !storageService.hasWorkspace()) {
      console.warn('Sync only available in desktop mode with workspace selected');
      return 0;
    }


    try {
      // Get all files from workspace folder
      const files = await storageService.listWorkspaceFiles();
      
      // Filter for .md files only (not directories)
      const mdFiles = files.filter(f => 
        !f.is_directory && f.name.toLowerCase().endsWith('.md')
      );

      let importedCount = 0;

      // Import each .md file
      for (const file of mdFiles) {
        // Check if already imported (by file path)
        const existingDoc = this.currentWorkspace?.documents.find(
          d => d.metadata.filePath === file.path
        );

        if (!existingDoc) {
          // Load file content
          const content = await storageService.loadFileByPath(file.path);
          if (content !== null) {
            // Extract title from filename (remove .md extension)
            const title = file.name.replace(/\.md$/i, '');
            
            // Import the file
            await this.importExternalFile(title, content, file.path);
            importedCount++;
          }
        }
      }

      return importedCount;
    } catch (error) {
      console.error('❌ Failed to sync desktop folder:', error);
      return 0;
    }
  }

  async importExternalFile(
    title: string, 
    content: string, 
    filePath: string
  ): Promise<Document> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }

    const document: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'markdown',
      title,
      content,
      folderId: null, // Root level
      workspaceId: this.currentWorkspace.id,
      starred: false,
      tags: ['imported'], // Tag as imported
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        filePath, // Store original file path
        isExternal: true, // Mark as external file
        wordCount: content.split(/\s+/).length,
      },
    };

    this.currentWorkspace.documents.push(document);
    this.saveToStorage();

    return document;
  }

  getDesktopWorkspacePath(): string | null {
    return storageService.getWorkspacePath();
  }

  isDesktopMode(): boolean {
    return storageService.isDesktop();
  }

  hasDesktopWorkspace(): boolean {
    return storageService.hasWorkspace();
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  clearWorkspace(): void {
    localStorage.removeItem(this.storageKey);
    this.currentWorkspace = this.createDefaultWorkspace();
    this.saveToStorage();
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();


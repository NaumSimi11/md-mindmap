/**
 * Backend Workspace Service
 * Connects workspace management to the FastAPI backend
 */

import { workspaceService as apiWorkspace, documentService as apiDocument } from '@/services/api';
import type { Workspace as ApiWorkspace, Document as ApiDocument } from '@/types/api.types';
import { authService } from '@/services/api';

// Local types (keeping UI-friendly structure)
export interface Document {
  id: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  title: string;
  content: string;
  folderId: string | null;
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;
  metadata: Record<string, any>;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BackendWorkspaceService {
  private currentWorkspace: Workspace | null = null;
  private workspaces: Workspace[] = [];
  private documents: Document[] = [];
  private isInitialized = false;

  /**
   * Initialize - Load workspaces from backend
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('⚠️ User not authenticated, skipping workspace init');
        return;
      }

      // Fetch workspaces from backend
      const response = await apiWorkspace.listWorkspaces();
      console.log('📦 API Response:', response);
      
      // Extract workspaces from paginated response
      const workspacesArray = (response as any).workspaces || [];
      console.log('📦 Workspaces array:', workspacesArray);
      
      if (workspacesArray.length === 0) {
        // Create default workspace if user has none
        console.log('📝 Creating default workspace...');
        const newWorkspace = await apiWorkspace.createWorkspace({
          name: 'My Workspace',
          description: 'Your personal workspace',
        });
        console.log('📦 New workspace created:', newWorkspace);
        
        this.currentWorkspace = this.mapApiWorkspace(newWorkspace);
        this.workspaces = [this.currentWorkspace];
        console.log('📦 Mapped workspace:', this.currentWorkspace);
      } else {
        // Use first workspace as current
        this.workspaces = workspacesArray.map(w => this.mapApiWorkspace(w));
        this.currentWorkspace = this.workspaces[0];
        console.log('📦 Current workspace:', this.currentWorkspace);
      }

      // Load documents for current workspace
      if (this.currentWorkspace) {
        await this.loadDocuments(this.currentWorkspace.id);
      }

      this.isInitialized = true;
      console.log('✅ Backend workspace initialized:', this.currentWorkspace?.name);
    } catch (error) {
      console.error('❌ Failed to initialize workspace:', error);
      throw error;
    }
  }

  /**
   * Map API workspace to local format
   */
  private mapApiWorkspace(apiWorkspace: ApiWorkspace): Workspace {
    return {
      id: apiWorkspace.id,
      name: apiWorkspace.name,
      description: apiWorkspace.description,
      icon: '🚀', // Default icon (can be extended later)
      createdAt: new Date(apiWorkspace.created_at),
      updatedAt: new Date(apiWorkspace.updated_at),
    };
  }

  /**
   * Map API document to local format
   */
  private mapApiDocument(apiDoc: ApiDocument): Document {
    return {
      id: apiDoc.id,
      type: apiDoc.content_type === 'markdown' ? 'markdown' : 'markdown', // Extend later for mindmap/presentation
      title: apiDoc.title,
      content: apiDoc.content,
      folderId: null, // Folders not implemented in backend yet
      workspaceId: apiDoc.workspace_id,
      starred: false, // Extend later
      tags: [], // Extend later
      createdAt: new Date(apiDoc.created_at),
      updatedAt: new Date(apiDoc.updated_at),
      lastOpenedAt: undefined,
      metadata: {
        version: apiDoc.version,
        createdBy: apiDoc.created_by,
      },
    };
  }

  /**
   * Load documents from backend
   */
  private async loadDocuments(workspaceId: string): Promise<void> {
    try {
      const response = await apiDocument.listDocuments(workspaceId);
      // Extract documents from paginated response
      const docsArray = (response as any).documents || [];
      this.documents = docsArray.map((d: any) => this.mapApiDocument(d));
      console.log(`✅ Loaded ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Failed to load documents:', error);
      this.documents = [];
    }
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded. Call init() first.');
    }
    return this.currentWorkspace;
  }

  /**
   * Get all workspaces
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.workspaces;
  }

  /**
   * Switch to different workspace
   */
  async switchWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    this.currentWorkspace = workspace;
    await this.loadDocuments(workspaceId);
    console.log('✅ Switched to workspace:', workspace.name);
  }

  /**
   * Create new document
   */
  async createDocument(
    type: Document['type'],
    title: string,
    content: string = '',
    folderId: string | null = null
  ): Promise<Document> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace loaded');
    }

    try {
      const apiDoc = await apiDocument.createDocument({
        workspace_id: this.currentWorkspace.id,
        title,
        content,
        content_type: 'markdown', // For now, always markdown
      });

      const doc = this.mapApiDocument(apiDoc);
      this.documents.push(doc);
      
      console.log('✅ Document created:', title);
      return doc;
    } catch (error) {
      console.error('❌ Failed to create document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  getDocument(documentId: string): Document | undefined {
    return this.documents.find(d => d.id === documentId);
  }

  /**
   * Get document with fresh content from backend
   */
  async getDocumentWithContent(documentId: string): Promise<Document | undefined> {
    try {
      const apiDoc = await apiDocument.getDocument(documentId);
      const doc = this.mapApiDocument(apiDoc);
      
      // Update local cache
      const index = this.documents.findIndex(d => d.id === documentId);
      if (index >= 0) {
        this.documents[index] = doc;
      }
      
      return doc;
    } catch (error) {
      console.error('❌ Failed to fetch document:', error);
      return this.getDocument(documentId);
    }
  }

  /**
   * Update document
   */
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      // Prepare API update
      const apiUpdates: any = {};
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.content !== undefined) apiUpdates.content = updates.content;

      // Send to backend
      const apiDoc = await apiDocument.updateDocument(documentId, apiUpdates);
      
      // Update local cache
      const doc = this.mapApiDocument(apiDoc);
      const index = this.documents.findIndex(d => d.id === documentId);
      if (index >= 0) {
        this.documents[index] = doc;
      }
      
      console.log('✅ Document updated');
    } catch (error) {
      console.error('❌ Failed to update document:', error);
      throw error;
    }
  }

  /**
   * Auto-save document (debounced)
   */
  autoSave(documentId: string, content: string, delay: number = 2000): void {
    apiDocument.autoSave(documentId, content, delay);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiDocument.deleteDocument(documentId);
      this.documents = this.documents.filter(d => d.id !== documentId);
      console.log('✅ Document deleted');
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      throw error;
    }
  }

  /**
   * Get all documents in current workspace
   */
  getAllDocuments(): Document[] {
    return this.documents;
  }

  /**
   * Get documents in folder (not implemented in backend yet)
   */
  getDocumentsInFolder(folderId: string | null): Document[] {
    return this.documents.filter(d => d.folderId === folderId);
  }

  /**
   * Get starred documents
   */
  getStarredDocuments(): Document[] {
    return this.documents.filter(d => d.starred);
  }

  /**
   * Get recent documents
   */
  getRecentDocuments(limit: number = 10): Document[] {
    return [...this.documents]
      .filter(d => d.lastOpenedAt)
      .sort((a, b) => {
        const aTime = a.lastOpenedAt?.getTime() || 0;
        const bTime = b.lastOpenedAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  /**
   * Search documents
   */
  searchDocuments(query: string): Document[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return this.documents.filter(doc => {
      return (
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Mark document as opened
   */
  markDocumentOpened(documentId: string): void {
    const doc = this.documents.find(d => d.id === documentId);
    if (doc) {
      doc.lastOpenedAt = new Date();
    }
  }

  /**
   * Toggle star
   */
  toggleStar(documentId: string): void {
    const doc = this.documents.find(d => d.id === documentId);
    if (doc) {
      doc.starred = !doc.starred;
      // TODO: Persist to backend when star feature is added
    }
  }

  /**
   * Get workspace stats
   */
  getWorkspaceStats() {
    return {
      totalDocuments: this.documents.length,
      totalFolders: 0, // Not implemented yet
      markdownDocs: this.documents.filter(d => d.type === 'markdown').length,
      mindmaps: this.documents.filter(d => d.type === 'mindmap').length,
      presentations: this.documents.filter(d => d.type === 'presentation').length,
      starredDocs: this.documents.filter(d => d.starred).length,
    };
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const backendWorkspaceService = new BackendWorkspaceService();


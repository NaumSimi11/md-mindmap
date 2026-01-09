/**
 * TauriWorkspaceService
 * 
 * Manages workspace, folders, and documents using the file system (Desktop mode).
 * All documents are stored as .md files on disk.
 * 
 * Architecture:
 * - Workspace: Real directory on file system
 * - Folders: Real subdirectories
 * - Documents: Real .md files
 * - Metadata: Stored in .mdreader/ folder (hidden)
 */

import { invoke } from '@tauri-apps/api/core';
import type { FileMetadata } from './WorkspaceInitializer';
import * as Y from 'yjs';

export interface TauriWorkspace {
  id: string;
  name: string;
  path: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface TauriFolder {
  id: string;
  name: string;
  path: string;
  icon: string;
  parentId: string | null;
  workspaceId: string;
  position: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TauriDocument {
  id: string;
  title: string;
  path: string; // Full file path
  type: 'markdown' | 'mindmap' | 'presentation';
  folderId: string | null;
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}

class TauriWorkspaceService {
  private workspacePath: string | null = null;
  private workspace: TauriWorkspace | null = null;
  private folders: TauriFolder[] = [];
  private documents: TauriDocument[] = [];
  private metadataPath: string | null = null;

  /**
   * Initialize service with workspace path
   */
  init(workspacePath: string): void {
    
    this.workspacePath = workspacePath;
    this.metadataPath = `${workspacePath}/.mdreader`;
    
    // Create workspace object
    const folderName = workspacePath.split('/').pop() || 'MDReader';
    this.workspace = {
      id: 'tauri-workspace',
      name: folderName,
      path: workspacePath,
      icon: '🖥️',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Load folders and documents from file system
    this.loadFromFileSystem();
  }

  /**
   * Load folders and documents from file system
   */
  private async loadFromFileSystem(): Promise<void> {
    if (!this.workspacePath) {
      console.error('❌ No workspace path set');
      return;
    }

    try {
      // List all contents
      const contents = await invoke<FileMetadata[]>('list_workspace_contents', { 
        directory_path: this.workspacePath 
      });

      // Separate folders and files
      const folderContents = contents.filter(f => f.is_directory);
      const fileContents = contents.filter(f => !f.is_directory && f.name.endsWith('.md'));

      // Map to folders
      this.folders = folderContents.map((f, index) => ({
        id: this.pathToId(f.path),
        name: f.name,
        path: f.path,
        icon: this.getDefaultFolderIcon(f.name),
        parentId: null, // TODO: Support nested folders
        workspaceId: this.workspace!.id,
        position: index,
        isExpanded: true,
        createdAt: f.modified,
        updatedAt: f.modified,
      }));

      // Map to documents
      this.documents = fileContents.map(f => ({
        id: this.pathToId(f.path),
        title: f.name.replace('.md', ''),
        path: f.path,
        type: 'markdown' as const,
        folderId: this.getFolderIdFromPath(f.path),
        workspaceId: this.workspace!.id,
        starred: false, // TODO: Load from metadata
        tags: [],
        createdAt: f.modified,
        updatedAt: f.modified,
      }));

    } catch (error) {
      console.error('❌ Failed to load from file system:', error);
    }
  }

  /**
   * Get current workspace
   */
  getWorkspace(): TauriWorkspace | null {
    return this.workspace;
  }

  /**
   * Get all folders
   */
  getFolders(): TauriFolder[] {
    return this.folders;
  }

  /**
   * Get all documents
   */
  getDocuments(): TauriDocument[] {
    return this.documents;
  }

  /**
   * Create a new folder
   */
  async createFolder(data: { name: string; icon?: string; parentId?: string }): Promise<TauriFolder> {
    if (!this.workspacePath) {
      throw new Error('Workspace not initialized');
    }

    const folderPath = `${this.workspacePath}/${data.name}`;
    
    // Create directory on file system
    await invoke('create_directory', { path: folderPath });
    
    const folder: TauriFolder = {
      id: this.pathToId(folderPath),
      name: data.name,
      path: folderPath,
      icon: data.icon || '📁',
      parentId: data.parentId || null,
      workspaceId: this.workspace!.id,
      position: this.folders.length,
      isExpanded: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.folders.push(folder);
    
    return folder;
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, updates: Partial<TauriFolder>): Promise<void> {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // If renaming, rename the directory
    if (updates.name && updates.name !== folder.name) {
      const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
      const newPath = `${parentPath}/${updates.name}`;
      
      await invoke('rename_directory', { 
        old_path: folder.path, 
        new_path: newPath 
      });
      
      folder.path = newPath;
    }

    Object.assign(folder, updates, { updatedAt: new Date().toISOString() });
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string, cascade: boolean = false): Promise<void> {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Delete directory from file system
    await invoke('delete_directory', { 
      path: folder.path, 
      recursive: cascade 
    });
    
    // Remove from memory
    this.folders = this.folders.filter(f => f.id !== folderId);
    
    if (cascade) {
      // Also remove documents in this folder
      this.documents = this.documents.filter(d => d.folderId !== folderId);
    }
    
  }

  /**
   * Create a new document
   */
  async createDocument(data: {
    title: string;
    type: 'markdown' | 'mindmap' | 'presentation';
    folderId?: string;
    content?: string;
  }): Promise<TauriDocument> {
    if (!this.workspacePath) {
      throw new Error('Workspace not initialized');
    }

    // Determine file path
    let filePath: string;
    const fileName = this.sanitizeFileName(data.title) + '.md';
    
    if (data.folderId) {
      const folder = this.folders.find(f => f.id === data.folderId);
      if (folder) {
        filePath = `${folder.path}/${fileName}`;
      } else {
        filePath = `${this.workspacePath}/${fileName}`;
      }
    } else {
      filePath = `${this.workspacePath}/${fileName}`;
    }

    // Create file on file system
    const content = data.content || `# ${data.title}\n\n`;
    await invoke('save_document_to_file', { 
      file_path: filePath, 
      content 
    });

    const document: TauriDocument = {
      id: this.pathToId(filePath),
      title: data.title,
      path: filePath,
      type: data.type,
      folderId: data.folderId || null,
      workspaceId: this.workspace!.id,
      starred: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documents.push(document);

    return document;
  }

  /**
   * Update document content
   */
  async updateDocumentContent(documentId: string, content: string): Promise<void> {
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Save to file system
    await invoke('save_document_to_file', { 
      file_path: document.path, 
      content 
    });

    document.updatedAt = new Date().toISOString();
  }

  /**
   * Update document metadata (title, starred, etc.)
   */
  async updateDocument(documentId: string, updates: Partial<TauriDocument>): Promise<void> {
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // If title changed, rename the file
    if (updates.title && updates.title !== document.title) {
      const parentPath = document.path.substring(0, document.path.lastIndexOf('/'));
      const newFileName = this.sanitizeFileName(updates.title) + '.md';
      const newPath = `${parentPath}/${newFileName}`;
      
      await invoke('rename_file', { 
        old_path: document.path, 
        new_path: newPath 
      });
      
      document.path = newPath;
    }

    Object.assign(document, updates, { updatedAt: new Date().toISOString() });
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from file system
    await invoke('delete_file', { file_path: document.path });

    this.documents = this.documents.filter(d => d.id !== documentId);
  }

  /**
   * Load document content from file
   */
  async loadDocumentContent(documentId: string): Promise<string> {
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    try {
      const content = await invoke<string>('load_document_from_file', { 
        file_path: document.path 
      });
      return content;
    } catch (error) {
      console.error('❌ Failed to load document:', error);
      return '';
    }
  }

  /**
   * Sync Yjs document to file system
   */
  async syncYjsToFile(documentId: string, ydoc: Y.Doc): Promise<void> {
    const ytext = ydoc.getText('content');
    const content = ytext.toString();
    
    await this.updateDocumentContent(documentId, content);
  }

  /**
   * Helper: Convert file path to ID
   */
  private pathToId(path: string): string {
    // Use base64 encoding of path as ID
    return btoa(path).replace(/[^a-zA-Z0-9]/g, '-');
  }

  /**
   * Helper: Get folder ID from document path
   */
  private getFolderIdFromPath(path: string): string | null {
    const parentDir = path.substring(0, path.lastIndexOf('/'));
    
    // If parent is workspace root, no folder
    if (parentDir === this.workspacePath) {
      return null;
    }

    // Find folder with matching path
    const folder = this.folders.find(f => f.path === parentDir);
    return folder ? folder.id : null;
  }

  /**
   * Helper: Get default folder icon
   */
  private getDefaultFolderIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('note')) return '📝';
    if (lower.includes('project')) return '📂';
    if (lower.includes('work')) return '💼';
    if (lower.includes('personal')) return '👤';
    return '📁';
  }

  /**
   * Helper: Sanitize file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 100);
  }

  /**
   * Refresh from file system
   */
  async refresh(): Promise<void> {
    await this.loadFromFileSystem();
  }
}

// Singleton instance
export const tauriWorkspaceService = new TauriWorkspaceService();


// Hybrid Storage Service
// Works on BOTH web (localStorage) and desktop (Tauri file system)

import { isDesktop } from '../../utils/platform';

// Type definitions for Tauri commands
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: any) => Promise<any>;
      };
    };
  }
}

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  modified: string;
  is_directory: boolean;
}

export interface WorkspaceConfig {
  workspace_path: string;
  recent_files: string[];
  last_opened?: string;
}

// ========================================
// STORAGE SERVICE
// ========================================

class StorageService {
  private isDesktopMode: boolean;
  private workspacePath: string | null = null;

  constructor() {
    this.isDesktopMode = isDesktop();
    this.loadWorkspaceConfig();
  }

  // ========================================
  // WORKSPACE MANAGEMENT
  // ========================================

  async selectWorkspaceFolder(): Promise<string | null> {
    if (!this.isDesktopMode) {
      throw new Error('Workspace folder selection only available in desktop mode');
    }

    try {
      const path = await this.invoke<string>('select_workspace_folder');
      this.workspacePath = path;
      await this.saveWorkspaceConfig();
      return path;
    } catch (error) {
      console.error('Failed to select workspace folder:', error);
      return null;
    }
  }

  async listWorkspaceFiles(): Promise<FileMetadata[]> {
    if (!this.isDesktopMode) {
      throw new Error('Workspace file listing only available in desktop mode');
    }

    if (!this.workspacePath) {
      throw new Error('No workspace folder selected');
    }

    try {
      return await this.invoke<FileMetadata[]>('list_workspace_files', {
        workspacePath: this.workspacePath,
      });
    } catch (error) {
      console.error('Failed to list workspace files:', error);
      return [];
    }
  }

  getWorkspacePath(): string | null {
    return this.workspacePath;
  }

  // ========================================
  // DOCUMENT OPERATIONS
  // ========================================

  async saveDocument(id: string, content: string, title: string): Promise<void> {
    if (this.isDesktopMode && this.workspacePath) {
      // Desktop: Save to file system
      const fileName = this.sanitizeFileName(title);
      const filePath = `${this.workspacePath}/${fileName}`;
      
      try {
        await this.invoke('save_document_to_file', {
          filePath,
          content,
        });
        
        // Also save metadata to localStorage for quick access
        this.saveDocumentMetadata(id, {
          title,
          filePath,
          lastModified: Date.now(),
        });
      } catch (error) {
        console.error('Failed to save document to file:', error);
        throw error;
      }
    } else {
      // Web: Save to localStorage
      const key = `doc_${id}`;
      localStorage.setItem(key, JSON.stringify({
        id,
        title,
        content,
        lastModified: Date.now(),
      }));
    }
  }

  async loadDocument(id: string): Promise<{ title: string; content: string } | null> {
    if (this.isDesktopMode && this.workspacePath) {
      // Desktop: Load from file system
      const metadata = this.getDocumentMetadata(id);
      if (!metadata || !metadata.filePath) {
        return null;
      }

      try {
        const content = await this.invoke<string>('load_document_from_file', {
          filePath: metadata.filePath,
        });

        return {
          title: metadata.title,
          content,
        };
      } catch (error) {
        console.error('Failed to load document from file:', error);
        return null;
      }
    } else {
      // Web: Load from localStorage
      const key = `doc_${id}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      try {
        const parsed = JSON.parse(data);
        return {
          title: parsed.title,
          content: parsed.content,
        };
      } catch (error) {
        console.error('Failed to parse document:', error);
        return null;
      }
    }
  }

  async loadFileByPath(filePath: string): Promise<string | null> {
    if (!this.isDesktopMode) {
      throw new Error('File loading by path only available in desktop mode');
    }

    try {
      const content = await this.invoke<string>('load_document_from_file', {
        filePath,
      });
      return content;
    } catch (error) {
      console.error('Failed to load file:', error);
      return null;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    if (this.isDesktopMode && this.workspacePath) {
      // Desktop: Delete from file system
      const metadata = this.getDocumentMetadata(id);
      if (metadata && metadata.filePath) {
        try {
          await this.invoke('delete_file', {
            filePath: metadata.filePath,
          });
          this.deleteDocumentMetadata(id);
        } catch (error) {
          console.error('Failed to delete document file:', error);
          throw error;
        }
      }
    } else {
      // Web: Delete from localStorage
      const key = `doc_${id}`;
      localStorage.removeItem(key);
    }
  }

  async createNewDocument(title: string): Promise<string> {
    const id = this.generateId();

    if (this.isDesktopMode && this.workspacePath) {
      // Desktop: Create file
      const fileName = this.sanitizeFileName(title);
      
      try {
        const filePath = await this.invoke<string>('create_new_file', {
          workspacePath: this.workspacePath,
          fileName,
        });

        this.saveDocumentMetadata(id, {
          title,
          filePath,
          lastModified: Date.now(),
        });

        return id;
      } catch (error) {
        console.error('Failed to create new document file:', error);
        throw error;
      }
    } else {
      // Web: Create in localStorage
      await this.saveDocument(id, `# ${title}\n\nStart writing...`, title);
      return id;
    }
  }

  // ========================================
  // WORKSPACE CONFIG
  // ========================================

  private async saveWorkspaceConfig(): Promise<void> {
    if (!this.isDesktopMode) return;

    const config: WorkspaceConfig = {
      workspace_path: this.workspacePath || '',
      recent_files: this.getRecentFiles(),
      last_opened: this.getLastOpened(),
    };

    try {
      await this.invoke('save_workspace_config', { config });
    } catch (error) {
      console.error('Failed to save workspace config:', error);
    }
  }

  private async loadWorkspaceConfig(): Promise<void> {
    if (!this.isDesktopMode) return;

    try {
      const config = await this.invoke<WorkspaceConfig | null>('load_workspace_config');
      if (config) {
        this.workspacePath = config.workspace_path;
      }
    } catch (error) {
      console.error('Failed to load workspace config:', error);
    }
  }

  // ========================================
  // METADATA HELPERS (localStorage)
  // ========================================

  private saveDocumentMetadata(id: string, metadata: any): void {
    const key = `doc_meta_${id}`;
    localStorage.setItem(key, JSON.stringify(metadata));
  }

  private getDocumentMetadata(id: string): any {
    const key = `doc_meta_${id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private deleteDocumentMetadata(id: string): void {
    const key = `doc_meta_${id}`;
    localStorage.removeItem(key);
  }

  private getRecentFiles(): string[] {
    // TODO: Implement recent files tracking
    return [];
  }

  private getLastOpened(): string | undefined {
    // TODO: Implement last opened tracking
    return undefined;
  }

  // ========================================
  // UTILITIES
  // ========================================

  private sanitizeFileName(title: string): string {
    // Remove invalid characters and limit length
    let fileName = title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);

    if (!fileName) {
      fileName = 'untitled';
    }

    return `${fileName}.md`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async invoke<T>(command: string, args?: any): Promise<T> {
    if (!window.__TAURI__) {
      throw new Error('Tauri is not available');
    }

    return window.__TAURI__.core.invoke(command, args);
  }

  // ========================================
  // PUBLIC API
  // ========================================

  isDesktop(): boolean {
    return this.isDesktopMode;
  }

  hasWorkspace(): boolean {
    return this.isDesktopMode && this.workspacePath !== null;
  }
}

// Export singleton instance
export const storageService = new StorageService();

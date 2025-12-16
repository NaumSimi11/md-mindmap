/**
 * FileWatcherService
 * 
 * Watches workspace directory for external file changes
 * (e.g., edits made in VS Code, Obsidian, etc.)
 * 
 * Features:
 * - Auto-reload changed files
 * - Show notifications for external changes
 * - Integrate with Yjs for conflict resolution
 * - Refresh workspace on folder changes
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isDesktop } from '@/utils/platform';
import * as Y from 'yjs';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';

export interface FileChangeEvent {
  path: string;
  event_type: 'created' | 'modified' | 'deleted';
  timestamp: string;
}

export interface FileMetadata {
  path: string;
  size: number;
  modified: string;
  is_file: boolean;
  is_dir: boolean;
}

class FileWatcherService {
  private unlistenFn: UnlistenFn | null = null;
  private watchedPath: string | null = null;
  private openDocuments: Map<string, string> = new Map(); // documentId -> filePath
  private changeHandlers: Array<(event: FileChangeEvent) => void> = [];
  private notificationQueue: FileChangeEvent[] = [];
  private processingNotification = false;

  /**
   * Start watching a directory
   */
  async startWatching(workspacePath: string): Promise<void> {
    if (!isDesktop()) {
      console.log('🌐 Web mode: File watching not available');
      return;
    }

    if (this.watchedPath === workspacePath && this.unlistenFn) {
      console.log('👀 Already watching:', workspacePath);
      return;
    }

    // Stop previous watcher
    if (this.unlistenFn) {
      await this.stopWatching();
    }

    try {
      console.log('👀 Starting file watcher for:', workspacePath);

      // Start watching in Rust backend
      await invoke('watch_directory', { 
        directory_path: workspacePath 
      });

      // Listen for file change events
      this.unlistenFn = await listen<FileChangeEvent>('file-changed', (event) => {
        this.handleFileChange(event.payload);
      });

      this.watchedPath = workspacePath;
      console.log('✅ File watcher started');

    } catch (error) {
      console.error('❌ Failed to start file watcher:', error);
      throw error;
    }
  }

  /**
   * Stop watching
   */
  async stopWatching(): Promise<void> {
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }

    if (this.watchedPath) {
      try {
        await invoke('stop_watching', { 
          directory_path: this.watchedPath 
        });
      } catch (error) {
        console.error('⚠️ Error stopping watcher:', error);
      }
      this.watchedPath = null;
    }

    console.log('🛑 File watcher stopped');
  }

  /**
   * Register a document as open
   */
  registerOpenDocument(documentId: string, filePath: string): void {
    this.openDocuments.set(documentId, filePath);
    console.log(`📝 Registered open document: ${documentId} -> ${filePath}`);
  }

  /**
   * Unregister a document
   */
  unregisterOpenDocument(documentId: string): void {
    this.openDocuments.delete(documentId);
    console.log(`📝 Unregistered document: ${documentId}`);
  }

  /**
   * Add a change handler
   */
  onFileChange(handler: (event: FileChangeEvent) => void): () => void {
    this.changeHandlers.push(handler);
    return () => {
      const index = this.changeHandlers.indexOf(handler);
      if (index > -1) {
        this.changeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Handle file change event
   */
  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    console.log('📁 File change detected:', event);

    // Notify all handlers
    this.changeHandlers.forEach(handler => handler(event));

    // Check if this file is currently open
    const documentId = this.getDocumentIdByPath(event.path);

    if (documentId && event.event_type === 'modified') {
      // File is open and was modified externally
      await this.handleExternalModification(documentId, event.path);
    } else if (event.event_type === 'created') {
      // New file created - could trigger workspace refresh
      this.queueNotification(event);
    } else if (event.event_type === 'deleted') {
      // File deleted - show notification
      this.queueNotification(event);
    }
  }

  /**
   * Handle external modification of an open document
   */
  private async handleExternalModification(documentId: string, filePath: string): Promise<void> {
    console.log('🔄 External modification detected for open document:', documentId);

    try {
      // Get the Yjs document
      const docInfo = yjsDocumentManager.getDocumentInfo(documentId);
      
      if (!docInfo) {
        console.warn('⚠️ No Yjs document found for:', documentId);
        return;
      }

      // Read the updated file content
      const newContent = await invoke<string>('load_document_from_file', { 
        file_path: filePath 
      });

      // Get current content from Yjs
      const ytext = docInfo.ydoc.getText('content');
      const currentContent = ytext.toString();

      // Check if content actually changed
      if (newContent === currentContent) {
        console.log('✅ Content unchanged, skipping update');
        return;
      }

      // Update Yjs document (this will trigger editor update)
      docInfo.ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, newContent);
      });

      console.log('✅ Document reloaded from file system');

      // Show notification
      this.showNotification({
        title: 'File Updated',
        message: `Document was modified externally and reloaded`,
        type: 'info',
      });

    } catch (error) {
      console.error('❌ Failed to reload document:', error);
      this.showNotification({
        title: 'Reload Failed',
        message: `Could not reload external changes: ${error}`,
        type: 'error',
      });
    }
  }

  /**
   * Get document ID by file path
   */
  private getDocumentIdByPath(filePath: string): string | null {
    for (const [docId, path] of this.openDocuments.entries()) {
      if (path === filePath) {
        return docId;
      }
    }
    return null;
  }

  /**
   * Queue a notification
   */
  private queueNotification(event: FileChangeEvent): void {
    this.notificationQueue.push(event);
    this.processNotificationQueue();
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.processingNotification || this.notificationQueue.length === 0) {
      return;
    }

    this.processingNotification = true;

    while (this.notificationQueue.length > 0) {
      const event = this.notificationQueue.shift()!;
      
      const fileName = event.path.split('/').pop() || event.path;
      const message = this.getNotificationMessage(event.event_type, fileName);
      
      this.showNotification({
        title: 'Workspace Changed',
        message,
        type: 'info',
      });

      // Wait a bit before showing next notification
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processingNotification = false;
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(eventType: string, fileName: string): string {
    switch (eventType) {
      case 'created':
        return `New file detected: ${fileName}`;
      case 'modified':
        return `File modified: ${fileName}`;
      case 'deleted':
        return `File deleted: ${fileName}`;
      default:
        return `File changed: ${fileName}`;
    }
  }

  /**
   * Show notification (to be implemented with toast library)
   */
  private showNotification(options: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }): void {
    console.log(`📢 [${options.type.toUpperCase()}] ${options.title}: ${options.message}`);
    
    // TODO: Integrate with toast notification library (e.g., sonner, react-hot-toast)
    // For now, just log
    // toast[options.type](options.message, { title: options.title });
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    if (!isDesktop()) {
      return null;
    }

    try {
      const metadata = await invoke<FileMetadata>('get_file_metadata', { 
        file_path: filePath 
      });
      return metadata;
    } catch (error) {
      console.error('❌ Failed to get file metadata:', error);
      return null;
    }
  }

  /**
   * Check if file has been modified externally
   */
  async hasExternalChanges(documentId: string, lastKnownModified: string): Promise<boolean> {
    const filePath = this.openDocuments.get(documentId);
    if (!filePath) {
      return false;
    }

    const metadata = await this.getFileMetadata(filePath);
    if (!metadata) {
      return false;
    }

    return metadata.modified !== lastKnownModified;
  }
}

// Singleton instance
export const fileWatcherService = new FileWatcherService();


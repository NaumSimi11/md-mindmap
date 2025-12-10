/**
 * Document Service
 * Handles document CRUD operations
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Document, DocumentCreate, DocumentUpdate, DocumentVersion } from '@/types/api.types';

export class DocumentService {
  /**
   * List documents in a workspace
   */
  async listDocuments(workspaceId: string): Promise<Document[]> {
    return apiClient.get<Document[]>(API_ENDPOINTS.documents.list(workspaceId));
  }

  /**
   * Create a new document
   */
  async createDocument(data: DocumentCreate): Promise<Document> {
    // Backend expects workspace_id as query param
    const endpoint = `${API_ENDPOINTS.documents.create}?workspace_id=${data.workspace_id}`;
    return apiClient.post<Document>(endpoint, data);
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document> {
    return apiClient.get<Document>(API_ENDPOINTS.documents.get(id));
  }

  /**
   * Update document
   */
  async updateDocument(id: string, data: DocumentUpdate): Promise<Document> {
    return apiClient.patch<Document>(API_ENDPOINTS.documents.update(id), data);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.documents.delete(id));
  }

  /**
   * Get document versions
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return apiClient.get<DocumentVersion[]>(API_ENDPOINTS.documents.versions(documentId));
  }

  /**
   * Restore document to a specific version
   */
  async restoreVersion(documentId: string, versionId: string): Promise<Document> {
    return apiClient.post<Document>(API_ENDPOINTS.documents.restore(documentId, versionId));
  }

  /**
   * Auto-save document (debounced)
   */
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private lastSavedContent: Map<string, string> = new Map();

  autoSave(documentId: string, content: string, delay: number = 2000): void {
    // Check if content has changed since last save
    const lastContent = this.lastSavedContent.get(documentId);
    if (lastContent === content) {
      return; // Skip if no change
    }

    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        // Double-check content hasn't changed to what was last saved
        if (this.lastSavedContent.get(documentId) === content) {
          return;
        }

        await this.updateDocument(documentId, { content });
        this.lastSavedContent.set(documentId, content);
        console.log('✅ Document auto-saved');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, delay);
  }

  /**
   * Cancel pending auto-save
   */
  cancelAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  /**
   * Clear saved content cache (useful when document is deleted or closed)
   */
  clearSavedContent(documentId: string): void {
    this.lastSavedContent.delete(documentId);
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;


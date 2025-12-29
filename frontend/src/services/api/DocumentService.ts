/**
 * Document Service
 * Handles document CRUD operations
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { extractUUID } from '@/utils/id-generator';
import type { Document, DocumentCreate, DocumentUpdate, DocumentVersion } from '@/types/api.types';

export class DocumentService {
  /**
   * List documents in a workspace
   * Returns paginated response, extracts items array
   */
  async listDocuments(workspaceId: string): Promise<Document[]> {
    // Strip prefix from workspace ID before sending to backend
    const wsId = extractUUID(workspaceId);
    const response = await apiClient.get<any>(API_ENDPOINTS.documents.list(wsId));
    
    // Handle paginated response: { items: [], total, page, page_size, has_more }
    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }
    // Fallback: if response is already an array (backward compatibility)
    if (Array.isArray(response)) {
      return response;
    }
    // If neither, return empty array
    console.warn('⚠️ Unexpected document list response format:', response);
    return [];
  }

  /**
   * List documents explicitly shared with the current user (doc-only access),
   * and restricted documents where the user has an explicit doc share.
   *
   * CRITICAL: This is a VIEW (not a workspace container).
   */
  async listSharedWithMe(): Promise<Document[]> {
    const response = await apiClient.get<any>(`/api/v1/documents/shared-with-me`);
    
    // Handle paginated response: { items: [], total, page, page_size, has_more }
    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }
    // Fallback: if response is already an array
    if (Array.isArray(response)) {
      return response;
    }
    // If neither, return empty array
    console.warn('⚠️ Unexpected shared-with-me response format:', response);
    return [];
  }

  /**
   * Create a new document
   */
  async createDocument(data: DocumentCreate & { id?: string; folder_id?: string; is_starred?: boolean; tags?: string[] }): Promise<Document> {
    // Backend expects workspace_id as query param (strip prefix if present)
    const workspaceId = extractUUID(data.workspace_id);
    const endpoint = `${API_ENDPOINTS.documents.create}?workspace_id=${workspaceId}`;
    
    // 🔥 FIX: Build payload from data object directly (avoid duplicate fields)
    // SelectiveSyncService already builds complete payload, so just pass it through
    const payload: any = {
      ...data,
      content: data.content || '',
      content_type: data.content_type || 'markdown',
    };
    
    // Remove workspace_id from payload (it's in query string)
    delete payload.workspace_id;
    
    // Strip prefixes from IDs if present
    if (payload.id) {
      payload.id = extractUUID(payload.id);
    }
    if (payload.folder_id) {
      payload.folder_id = extractUUID(payload.folder_id);
    }
    
    return apiClient.post<Document>(endpoint, payload);
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document> {
    // Strip prefix from ID before sending to backend
    const documentId = extractUUID(id);
    return apiClient.get<Document>(API_ENDPOINTS.documents.get(documentId));
  }

  /**
   * Update document
   */
  async updateDocument(id: string, data: DocumentUpdate & { folder_id?: string; is_starred?: boolean; tags?: string[] }): Promise<Document> {
    // Strip prefix from ID before sending to backend
    const documentId = extractUUID(id);
    
    // Strip prefix from folder_id if present
    const payload: any = {
      ...data,
    };
    
    if (data.folder_id) {
      payload.folder_id = extractUUID(data.folder_id);
    }
    
    return apiClient.patch<Document>(API_ENDPOINTS.documents.update(documentId), payload);
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

  autoSave(documentId: string, content: string, delay: number = 1000): void {
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


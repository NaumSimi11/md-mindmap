/**
 * DocumentVersionService - API client for document version operations
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string;
  change_summary: string | null;
  word_count: number;
  created_by_id: string | null;
  created_at: string;
}

export interface DocumentVersionListResponse {
  versions: DocumentVersion[];
  total: number;
}

class DocumentVersionService {
  /**
   * Get all versions for a document
   */
  async getVersions(documentId: string): Promise<DocumentVersionListResponse> {
    return apiClient.get<DocumentVersionListResponse>(API_ENDPOINTS.documents.versions(documentId));
  }

  /**
   * Get specific version
   */
  async getVersion(documentId: string, versionNumber: number): Promise<DocumentVersion> {
    return apiClient.get<DocumentVersion>(`/api/v1/documents/${documentId}/versions/${versionNumber}`);
  }

  /**
   * Restore a previous version (creates new version with old content)
   */
  async restoreVersion(documentId: string, versionNumber: number): Promise<any> {
    return apiClient.post(`/api/v1/documents/${documentId}/restore/${versionNumber}`, {});
  }
}

export const documentVersionService = new DocumentVersionService();


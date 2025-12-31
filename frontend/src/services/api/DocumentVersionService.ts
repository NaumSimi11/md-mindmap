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
   * Get all versions for a document (uses snapshots API)
   */
  async getVersions(documentId: string): Promise<DocumentVersionListResponse> {
    try {
      const response = await apiClient.get<any>(`/api/v1/documents/${documentId}/snapshots`);
      // Transform snapshots to versions format
      const versions: DocumentVersion[] = response.snapshots.map((snapshot: any, index: number) => ({
        id: snapshot.id,
        document_id: documentId,
        version_number: index + 1, // Convert to version numbers
        title: `Version ${index + 1}`,
        content: '', // Content loaded separately if needed
        change_summary: snapshot.note || null,
        word_count: Math.floor(snapshot.size_bytes / 20), // Rough estimate
        created_by_id: snapshot.created_by,
        created_at: snapshot.created_at
      }));

      return {
        versions: versions.reverse(), // Most recent first
        total: versions.length
      };
    } catch (error) {
      console.error('Failed to load document snapshots:', error);
      throw error;
    }
  }

  /**
   * Get specific version (snapshot)
   */
  async getVersion(documentId: string, versionNumber: number): Promise<DocumentVersion> {
    try {
      // Get all snapshots and find by version number
      const response = await this.getVersions(documentId);
      const version = response.versions.find(v => v.version_number === versionNumber);

      if (!version) {
        throw new Error(`Version ${versionNumber} not found`);
      }

      // Try to load content from snapshot download
      try {
        const snapshotData = await apiClient.get(`/api/v1/documents/${documentId}/snapshots/${version.id}/download`, {
          responseType: 'arraybuffer'
        });
        // Note: Content would need to be decoded from yjs_state binary
        // For now, return metadata only
        return version;
      } catch (contentError) {
        console.warn('Could not load snapshot content:', contentError);
        return version;
      }
    } catch (error) {
      console.error('Failed to get version:', error);
      throw error;
    }
  }

  /**
   * Restore a previous version (creates new document from snapshot)
   */
  async restoreVersion(documentId: string, versionNumber: number): Promise<any> {
    try {
      // Get all snapshots and find by version number
      const response = await this.getVersions(documentId);
      const version = response.versions.find(v => v.version_number === versionNumber);

      if (!version) {
        throw new Error(`Version ${versionNumber} not found`);
      }

      // Use snapshot restore API
      const restoreResponse = await apiClient.post(`/api/v1/documents/${documentId}/snapshots/${version.id}/restore`, {
        action: 'new_document',
        title: `Restored from Version ${versionNumber}`,
        force: false
      });

      return restoreResponse;
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  }
}

export const documentVersionService = new DocumentVersionService();


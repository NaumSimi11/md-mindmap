/**
 * Snapshots API Client
 * =====================
 * 
 * Client for version history / snapshot management.
 * Consumes backend APIs from Phase 3.
 * 
 * CRITICAL:
 * - Snapshots are WRITE-ONLY artifacts
 * - Client never applies CRDT ops directly
 * - Backend is authoritative for restore safety
 * - Overwrite restore requires owner + backup + force
 */

import { apiClient, type ApiError } from './ApiClient';
import { API_CONFIG } from '@/config/api.config';

// ============================================================================
// Types
// ============================================================================

export type SnapshotType = 'auto' | 'manual' | 'restore-backup';
export type RestoreAction = 'new_document' | 'overwrite';

export interface Snapshot {
  id: string;
  document_id: string;
  created_by: string | null;
  created_at: string;
  type: SnapshotType;
  note: string | null;
  size_bytes: number | null;
  html_preview: string | null;
}

export interface RestoreResult {
  success: boolean;
  action: RestoreAction;
  new_document_id?: string | null;
  message: string;
  warning?: string | null;
}

export interface RestoreConflict {
  success: false;
  error: string;
  reason: 'provider_active';
  suggested_action: 'restore_as_new';
  active_connections?: number;
}

// ============================================================================
// API Client
// ============================================================================

export class SnapshotsClient {
  /**
   * List snapshots for document
   * 
   * Permission: Viewer+ can list
   * 
   * @param documentId - Document ID
   * @param limit - Maximum snapshots to return (default: 50)
   * @param offset - Pagination offset (default: 0)
   * @returns Snapshots and pagination info
   */
  static async listSnapshots(
    documentId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    snapshots: Snapshot[];
    total: number;
    limit: number;
    offset: number;
  }> {
    return apiClient.get(
      `/api/v1/documents/${documentId}/snapshots?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Get snapshot metadata
   * 
   * Permission: Viewer+ can get
   * 
   * @param documentId - Document ID
   * @param snapshotId - Snapshot ID
   * @returns Snapshot metadata
   */
  static async getSnapshot(
    documentId: string,
    snapshotId: string
  ): Promise<Snapshot> {
    return apiClient.get(`/api/v1/documents/${documentId}/snapshots/${snapshotId}`);
  }

  /**
   * Download snapshot binary (yjs_state)
   * 
   * Permission: Viewer+ can download
   * 
   * @param documentId - Document ID
   * @param snapshotId - Snapshot ID
   * @returns Binary blob
   */
  static async downloadSnapshot(
    documentId: string,
    snapshotId: string
  ): Promise<Blob> {
    // ApiClient is JSON-oriented; use fetch for binary download
    const token = localStorage.getItem('auth_token');
    const url = `${API_CONFIG.baseUrl}/api/v1/documents/${documentId}/snapshots/${snapshotId}/download`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resp.ok) {
      // Best-effort parse
      let msg = resp.statusText || 'Failed to download snapshot';
      try {
        const data = await resp.json();
        msg = data?.detail || msg;
      } catch {}
      throw new Error(msg);
    }
    return resp.blob();
  }

  /**
   * Restore snapshot (CRDT-safe)
   * 
   * Permission:
   * - new_document: Editor+ can restore as new
   * - overwrite: Owner ONLY
   * 
   * CRITICAL:
   * - Default action is 'new_document' (safe)
   * - Frontend sends action + force flag ONLY
   * - Backend handles backup creation and validation
   * - Backend may return 409 if provider is active
   * 
   * @param documentId - Document ID
   * @param snapshotId - Snapshot ID to restore
   * @param action - Restore action (new_document or overwrite)
   * @param title - Title for new document (optional for new_document)
   * @param force - Force overwrite (explicit confirmation for overwrite)
   * @returns Restore result or conflict
   */
  static async restoreSnapshot(
    documentId: string,
    snapshotId: string,
    action: RestoreAction = 'new_document',
    title?: string | null,
    force: boolean = false
  ): Promise<RestoreResult | RestoreConflict> {
    try {
      return await apiClient.post(
        `/api/v1/documents/${documentId}/snapshots/${snapshotId}/restore`,
        { action, title, force }
      );
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 409) {
        const detail = (apiErr as any)?.details?.detail || (apiErr as any)?.details || {};
        return {
          success: false,
          error: detail?.message || apiErr.message || 'Document may have active collaborators',
          reason: 'provider_active',
          suggested_action: 'restore_as_new',
          active_connections: detail?.active_connections,
        } as RestoreConflict;
      }
      throw err;
    }
  }

  /**
   * Create manual snapshot
   * 
   * Permission: Editor+ can create
   * 
   * @param documentId - Document ID
   * @param yjsStateBase64 - Base64-encoded yjs_state (from client)
   * @param note - Optional user note
   * @param htmlPreview - Optional HTML preview
   * @param type - Snapshot type (default: 'manual')
   * @returns Created snapshot
   */
  static async createManualSnapshot(
    documentId: string,
    yjsStateBase64: string,
    note?: string | null,
    htmlPreview?: string | null,
    type: SnapshotType = 'manual'
  ): Promise<{
    success: boolean;
    snapshot_id: string;
    created_at: string;
    size_bytes: number;
  }> {
    return apiClient.post(
      `/api/v1/documents/${documentId}/snapshots`,
      {
        yjs_state_base64: yjsStateBase64,
        note,
        html_preview: htmlPreview,
        type,
      }
    );
  }

}


/**
 * STEP 5: Snapshot Backend Client
 * 
 * Handles communication with backend snapshot API.
 * Backend is a DUMB STORE - no merging, no conflicts, no decisions.
 */

import type { SnapshotPayload } from './serializeYjs';

/**
 * Send snapshot to backend
 * 
 * Backend MUST:
 * - Store snapshots blindly
 * - Never merge
 * - Never diff
 * - Never resolve conflicts
 * - Never push content to clients
 */
export async function pushSnapshot(payload: SnapshotPayload): Promise<boolean> {
  try {
    console.log('☁️ [Snapshot] Pushing to backend:', payload.documentId);
    
    const response = await fetch(`/api/v1/documents/${payload.documentId}/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        yjs_state: payload.yjsState, // base64-encoded binary
        html: payload.html, // optional, for preview/search
        updated_at: new Date(payload.updatedAt).toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Snapshot push failed: ${response.status}`);
    }
    
    console.log('✅ [Snapshot] Pushed successfully:', payload.documentId);
    return true;
  } catch (error) {
    console.error('❌ [Snapshot] Push failed:', error);
    return false;
  }
}

/**
 * Fetch snapshot from backend (for restore ONLY)
 * 
 * RESTORE RULE (CRITICAL):
 * Cloud snapshots are used ONLY when:
 * - IndexedDB is empty
 * - Yjs XmlFragment is empty
 * - User explicitly requests restore
 * 
 * Never automatic during collaboration.
 */
export async function fetchSnapshot(documentId: string): Promise<SnapshotPayload | null> {
  try {
    console.log('☁️ [Snapshot] Fetching from backend:', documentId);
    
    const response = await fetch(`/api/v1/documents/${documentId}/snapshot`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('ℹ️ [Snapshot] No snapshot found:', documentId);
        return null;
      }
      throw new Error(`Snapshot fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      documentId,
      yjsState: data.yjs_state,
      html: data.html,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  } catch (error) {
    console.error('❌ [Snapshot] Fetch failed:', error);
    return null;
  }
}

/**
 * Get auth token from local storage
 */
function getAuthToken(): string {
  const authData = localStorage.getItem('auth');
  if (!authData) return '';
  
  try {
    const parsed = JSON.parse(authData);
    return parsed.accessToken || '';
  } catch {
    return '';
  }
}


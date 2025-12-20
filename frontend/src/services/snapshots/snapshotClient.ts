/**
 * STEP 5: Snapshot Backend Client
 * 
 * Handles communication with backend snapshot API.
 * Backend is a DUMB STORE - no merging, no conflicts, no decisions.
 * 
 * Reliability:
 * - Failed snapshots are queued for retry (FailedSnapshotStore)
 * - Exponential backoff with jitter
 * - Circuit breaker after N failures
 * - Auto-resume on network recovery
 */

import type { SnapshotPayload } from './serializeYjs';
import { API_CONFIG } from '@/config/api.config';
import { FailedSnapshotStore } from './FailedSnapshotStore';

/**
 * Send snapshot to backend
 * 
 * Backend MUST:
 * - Store snapshots blindly
 * - Never merge
 * - Never diff
 * - Never resolve conflicts
 * - Never push content to clients
 * 
 * Reliability:
 * - On failure, snapshot is queued for retry (FailedSnapshotStore)
 * - Retries happen automatically with exponential backoff
 * - Circuit breaker prevents infinite retry loops
 */
export async function pushSnapshot(payload: SnapshotPayload): Promise<boolean> {
  try {
    // Convert guest IDs to cloud IDs before pushing
    let cloudId = payload.documentId;
    if (cloudId.startsWith('doc_')) {
      cloudId = cloudId.slice(4); // Remove 'doc_' prefix
      console.log(`🔄 [Snapshot] Converting guest ID to cloud ID: ${payload.documentId} → ${cloudId}`);
    }
    
    console.log('☁️ [Snapshot] Pushing to backend:', cloudId);
    
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/documents/${cloudId}/snapshot`, {
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
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    console.log('✅ [Snapshot] Pushed successfully:', cloudId);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Snapshot] Push failed:', errorMsg);
    
    // Queue for retry (with durability guarantee)
    try {
      await FailedSnapshotStore.add(payload, errorMsg);
      console.log(`📥 [Snapshot] Queued for retry: ${payload.documentId}`);
    } catch (queueError) {
      console.error('💥 [Snapshot] CRITICAL: Failed to queue snapshot for retry:', queueError);
      // This is a critical failure - snapshot is lost unless Yjs state is still in IndexedDB
    }
    
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
    
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/documents/${documentId}/snapshot`, {
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
 * Retry all failed snapshots that are due for retry
 * 
 * Called by:
 * - Periodic retry timer
 * - Network recovery event
 * - Manual "Force Sync" button
 */
export async function retryFailedSnapshots(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const dueSnapshots = await FailedSnapshotStore.getDueForRetry();
  
  if (dueSnapshots.length === 0) {
    return { attempted: 0, succeeded: 0, failed: 0 };
  }
  
  console.log(`🔄 [Snapshot] Retrying ${dueSnapshots.length} failed snapshots...`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const failedSnapshot of dueSnapshots) {
    try {
      // Reconstruct payload from stored snapshot
      const payload: SnapshotPayload = {
        documentId: failedSnapshot.documentId,
        yjsState: failedSnapshot.yjsState,
        html: failedSnapshot.html,
        updatedAt: failedSnapshot.updatedAt,
      };
      
      // Try pushing again (without queueing if it fails - already queued)
      const success = await pushSnapshotDirect(payload);
      
      // Update retry status
      await FailedSnapshotStore.updateAfterRetry(
        failedSnapshot.id,
        success,
        success ? undefined : 'Retry failed'
      );
      
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ [Snapshot] Retry error for ${failedSnapshot.documentId}:`, error);
      await FailedSnapshotStore.updateAfterRetry(
        failedSnapshot.id,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      failed++;
    }
  }
  
  console.log(`✅ [Snapshot] Retry complete: ${succeeded} succeeded, ${failed} failed`);
  
  return {
    attempted: dueSnapshots.length,
    succeeded,
    failed,
  };
}

/**
 * Push snapshot directly (internal use - doesn't queue failures)
 * Used by retry logic to avoid double-queueing
 */
async function pushSnapshotDirect(payload: SnapshotPayload): Promise<boolean> {
  try {
    let cloudId = payload.documentId;
    if (cloudId.startsWith('doc_')) {
      cloudId = cloudId.slice(4);
    }
    
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/documents/${cloudId}/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        yjs_state: payload.yjsState,
        html: payload.html,
        updated_at: new Date(payload.updatedAt).toISOString(),
      }),
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get auth token from local storage
 */
function getAuthToken(): string {
  // Token is stored directly as 'auth_token' (see ApiClient.ts)
  return localStorage.getItem('auth_token') || '';
}


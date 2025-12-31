/**
 * STEP 5: Snapshot Backend Client
 * 
 * Handles communication with backend snapshot API.
 * Backend is a DUMB STORE - no merging, no conflicts, no decisions.
 * 
 * TWO TYPES OF SNAPSHOTS:
 * 1. Live snapshot (POST /snapshot singular) - Updates document's current yjs_state
 * 2. History snapshot (POST /snapshots plural) - Creates version history entry
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
import { authService } from '@/services/api/AuthService';

// Track last history snapshot time per document to throttle
const lastHistorySnapshotTime: Map<string, number> = new Map();
const HISTORY_SNAPSHOT_INTERVAL_MS = 60000; // 1 minute minimum between history snapshots

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
    // 🚫 Guest / logged-out mode: never talk to snapshot backend
    if (!authService.isAuthenticated()) {
      console.log('📴 [Snapshot] Skipping push - user not authenticated (guest/offline mode)');
      // Do NOT queue in FailedSnapshotStore in guest mode; cloud backup is disabled
      return false;
    }
    
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
      // 404 means the document doesn't exist on backend yet (e.g., local-only doc)
      // Treat this as non-retryable: log and drop, do NOT queue for retry.
      if (response.status === 404) {
        console.warn('ℹ️ [Snapshot] Backend returned 404 (document not found). Dropping snapshot without retry.', {
          documentId: payload.documentId,
          cloudId,
        });
        return false;
      }
      
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    console.log('✅ [Snapshot] Pushed successfully:', cloudId);
    
    // Also create a history snapshot (throttled to avoid spamming)
    await maybeCreateHistorySnapshot(cloudId, payload.yjsState, payload.html);
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Snapshot] Push failed:', errorMsg);
    
    // Queue for retry (with durability guarantee), but ONLY for non-404 failures.
    if (!errorMsg.startsWith('HTTP 404')) {
      try {
        await FailedSnapshotStore.add(payload, errorMsg);
        console.log(`📥 [Snapshot] Queued for retry: ${payload.documentId}`);
      } catch (queueError) {
        console.error('💥 [Snapshot] CRITICAL: Failed to queue snapshot for retry:', queueError);
        // This is a critical failure - snapshot is lost unless Yjs state is still in IndexedDB
      }
    } else {
      console.log('ℹ️ [Snapshot] Not queueing 404 failure for retry (document missing).');
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
  // 🚫 Guest / logged-out mode: don't hammer backend with old failed snapshots
  if (!authService.isAuthenticated()) {
    console.log('📴 [Snapshot] Skipping retry - user not authenticated (guest/offline mode)');
    return { attempted: 0, succeeded: 0, failed: 0 };
  }
  
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
    // Same guard as pushSnapshot: never call backend when logged out
    if (!authService.isAuthenticated()) {
      console.log('📴 [Snapshot] Skipping direct push - user not authenticated (guest/offline mode)');
      return false;
    }
    
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
    
    if (!response.ok) {
      // 404 is non-retryable for old snapshots: document never existed or was deleted.
      // Treat as "handled" so FailedSnapshotStore will drop this entry.
      if (response.status === 404) {
        console.warn('ℹ️ [Snapshot] Direct push returned 404 (document not found). Dropping from retry queue.', {
          documentId: payload.documentId,
          cloudId,
        });
        return true;
      }
      return false;
    }
    
    return true;
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

/**
 * Create a history snapshot (for version history panel)
 * Throttled to avoid creating too many entries
 */
async function maybeCreateHistorySnapshot(
  documentId: string,
  yjsStateBase64: string,
  htmlPreview?: string
): Promise<void> {
  const now = Date.now();
  const lastTime = lastHistorySnapshotTime.get(documentId) || 0;
  
  // Throttle: only create history snapshot every HISTORY_SNAPSHOT_INTERVAL_MS
  if (now - lastTime < HISTORY_SNAPSHOT_INTERVAL_MS) {
    console.log(`⏱️ [Snapshot] Skipping history snapshot (throttled): ${documentId}`);
    return;
  }
  
  try {
    console.log(`📚 [Snapshot] Creating history snapshot: ${documentId}`);
    
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/documents/${documentId}/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        yjs_state_base64: yjsStateBase64,
        note: null, // Auto-saved snapshot
        html_preview: htmlPreview || null,
        type: 'auto', // Auto-generated (not manual)
      }),
    });
    
    if (response.ok) {
      lastHistorySnapshotTime.set(documentId, now);
      console.log(`✅ [Snapshot] History snapshot created: ${documentId}`);
    } else {
      // Don't throw - this is a nice-to-have feature
      console.warn(`⚠️ [Snapshot] History snapshot failed (${response.status}): ${documentId}`);
    }
  } catch (error) {
    // Silently fail - history snapshots are nice-to-have
    console.warn('⚠️ [Snapshot] History snapshot error:', error);
  }
}

/**
 * Force create a history snapshot (for manual "Save Snapshot" button)
 */
export async function createManualHistorySnapshot(
  documentId: string,
  yjsStateBase64: string,
  note?: string,
  htmlPreview?: string
): Promise<boolean> {
  if (!authService.isAuthenticated()) {
    console.log('📴 [Snapshot] Cannot create manual snapshot - not authenticated');
    return false;
  }
  
  // Normalize document ID
  let cloudId = documentId;
  if (cloudId.startsWith('doc_')) {
    cloudId = cloudId.slice(4);
  }
  
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n📸 ========== API CALL START [${timestamp}] ==========`);
    console.log(`📸 [${timestamp}] Creating manual history snapshot for: ${cloudId}`);
    console.log(`📸 [${timestamp}] Note:`, note || 'Manual snapshot');
    console.log(`📸 [${timestamp}] Yjs state base64 length:`, yjsStateBase64?.length || 0);
    console.log(`📸 [${timestamp}] HTML preview length:`, htmlPreview?.length || 0);
    console.log(`📸 [${timestamp}] HTML preview sample:`, htmlPreview?.substring(0, 100));
    console.log(`📸 [${timestamp}] Has HTML preview:`, !!htmlPreview);
    
    const payload = {
      yjs_state_base64: yjsStateBase64,
      note: note || 'Manual snapshot',
      html_preview: htmlPreview || null,
      type: 'manual',
    };
    
    console.log(`📦 [${new Date().toISOString()}] Payload structure:`, {
      yjs_state_base64: `[${yjsStateBase64.length} chars]`,
      note: payload.note,
      html_preview: htmlPreview ? `[${htmlPreview.length} chars]` : 'NULL',
      type: payload.type,
      html_preview_is_null: payload.html_preview === null,
      html_preview_is_undefined: payload.html_preview === undefined,
      html_preview_value: htmlPreview
    });
    
    console.log(`🌐 [${new Date().toISOString()}] Making POST request to:`, `${API_CONFIG.baseUrl}/api/v1/documents/${cloudId}/snapshots`);
    
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/documents/${cloudId}/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`📡 [${new Date().toISOString()}] Response status:`, response.status, response.statusText);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`✅ [${new Date().toISOString()}] Response data:`, responseData);
      console.log(`✅ [${new Date().toISOString()}] Manual history snapshot created successfully!`);
      lastHistorySnapshotTime.set(cloudId, Date.now());
      console.log(`📸 ========== API CALL END [${new Date().toISOString()}] ==========\n`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ [${new Date().toISOString()}] Manual snapshot failed (${response.status}):`, error);
      console.log(`📸 ========== API CALL END (FAILED) [${new Date().toISOString()}] ==========\n`);
      return false;
    }
  } catch (error) {
    console.error(`💥 [${new Date().toISOString()}] Manual snapshot error:`, error);
    console.log(`📸 ========== API CALL END (ERROR) [${new Date().toISOString()}] ==========\n`);
    return false;
  }
}


/**
 * Failed Snapshot Store - Persistent queue for failed durability snapshots
 * 
 * CRITICAL INVARIANT:
 * - Failed snapshots are WRITE-ONLY (push to backend)
 * - They are NEVER applied to Yjs documents
 * - They represent backup failures, not sync state
 * 
 * Retry Strategy:
 * - Exponential backoff: 1s → 2s → 4s → 8s → 16s (max)
 * - Jitter: ±20% randomization to prevent thundering herd
 * - Circuit breaker: Pause after 5 consecutive failures
 * - Auto-resume on network recovery
 */

import { offlineDB } from '@/services/offline/OfflineDatabase';
import type { FailedSnapshot } from '@/services/offline/OfflineDatabase';
import type { SnapshotPayload } from './serializeYjs';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  MAX_RETRIES: 5,              // Circuit breaker threshold
  BASE_DELAY_MS: 1000,         // Initial retry delay (1 second)
  MAX_DELAY_MS: 16000,         // Maximum retry delay (16 seconds)
  JITTER_PERCENT: 0.2,         // ±20% randomization
  CLEANUP_THRESHOLD_DAYS: 7,   // Delete failed snapshots older than 7 days
};

// ============================================================================
// Exponential Backoff Calculation
// ============================================================================

/**
 * Calculate next retry delay with exponential backoff and jitter
 * 
 * Formula: delay = min(baseDelay * 2^retryCount, maxDelay) * (1 ± jitter)
 */
function calculateBackoff(retryCount: number): number {
  const exponentialDelay = CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount);
  const cappedDelay = Math.min(exponentialDelay, CONFIG.MAX_DELAY_MS);
  
  // Add jitter (±20%)
  const jitter = (Math.random() * 2 - 1) * CONFIG.JITTER_PERCENT;
  const finalDelay = cappedDelay * (1 + jitter);
  
  return Math.floor(finalDelay);
}

// ============================================================================
// Failed Snapshot Store API
// ============================================================================

export class FailedSnapshotStore {
  /**
   * Add failed snapshot to retry queue
   */
  static async add(payload: SnapshotPayload, error: string): Promise<void> {
    const now = Date.now();
    const failedSnapshot: FailedSnapshot = {
      id: crypto.randomUUID(),
      documentId: payload.documentId,
      yjsState: payload.yjsState,
      html: payload.html,
      updatedAt: payload.updatedAt,
      failedAt: now,
      retryCount: 0,
      lastError: error,
      nextRetryAt: now + calculateBackoff(0), // Schedule first retry
    };
    
    await offlineDB.failed_snapshots.add(failedSnapshot);
    
    console.log(`📥 [FailedSnapshotStore] Queued failed snapshot: ${payload.documentId}`);
    console.log(`   Next retry in: ${calculateBackoff(0)}ms`);
  }
  
  /**
   * Get all snapshots ready for retry (nextRetryAt <= now)
   */
  static async getDueForRetry(): Promise<FailedSnapshot[]> {
    const now = Date.now();
    return offlineDB.failed_snapshots
      .where('nextRetryAt')
      .belowOrEqual(now)
      .toArray();
  }
  
  /**
   * Update failed snapshot after retry attempt
   */
  static async updateAfterRetry(
    id: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    if (success) {
      // Retry succeeded - remove from queue
      await offlineDB.failed_snapshots.delete(id);
      console.log(`✅ [FailedSnapshotStore] Snapshot retry succeeded, removed from queue: ${id}`);
      return;
    }
    
    // Retry failed - increment counter and schedule next retry
    const snapshot = await offlineDB.failed_snapshots.get(id);
    if (!snapshot) {
      console.warn(`⚠️ [FailedSnapshotStore] Snapshot not found: ${id}`);
      return;
    }
    
    const newRetryCount = snapshot.retryCount + 1;
    
    if (newRetryCount >= CONFIG.MAX_RETRIES) {
      // Circuit breaker triggered - keep in queue but don't schedule retry
      await offlineDB.failed_snapshots.update(id, {
        retryCount: newRetryCount,
        lastError: error || 'Unknown error',
        nextRetryAt: Date.now() + (1000 * 60 * 60), // Retry in 1 hour (paused state)
      });
      
      console.error(`🚨 [FailedSnapshotStore] Circuit breaker triggered for: ${snapshot.documentId}`);
      console.error(`   Failed ${newRetryCount} times, pausing retries`);
      return;
    }
    
    // Schedule next retry with exponential backoff
    const nextDelay = calculateBackoff(newRetryCount);
    await offlineDB.failed_snapshots.update(id, {
      retryCount: newRetryCount,
      lastError: error || 'Unknown error',
      nextRetryAt: Date.now() + nextDelay,
    });
    
    console.warn(`⚠️ [FailedSnapshotStore] Retry failed (${newRetryCount}/${CONFIG.MAX_RETRIES}): ${snapshot.documentId}`);
    console.warn(`   Next retry in: ${(nextDelay / 1000).toFixed(1)}s`);
  }
  
  /**
   * Get count of pending retries
   */
  static async getPendingCount(): Promise<number> {
    return offlineDB.failed_snapshots.count();
  }
  
  /**
   * Get count of snapshots in circuit breaker state (retryCount >= MAX_RETRIES)
   */
  static async getCircuitBreakerCount(): Promise<number> {
    const all = await offlineDB.failed_snapshots.toArray();
    return all.filter(s => s.retryCount >= CONFIG.MAX_RETRIES).length;
  }
  
  /**
   * Get all failed snapshots for a specific document
   */
  static async getByDocument(documentId: string): Promise<FailedSnapshot[]> {
    return offlineDB.failed_snapshots
      .where('documentId')
      .equals(documentId)
      .toArray();
  }
  
  /**
   * Reset circuit breaker for all snapshots (e.g., on network recovery)
   */
  static async resetCircuitBreaker(): Promise<void> {
    const circuitBreakerSnapshots = await offlineDB.failed_snapshots
      .filter(s => s.retryCount >= CONFIG.MAX_RETRIES)
      .toArray();
    
    if (circuitBreakerSnapshots.length === 0) {
      return;
    }
    
    console.log(`🔄 [FailedSnapshotStore] Resetting circuit breaker for ${circuitBreakerSnapshots.length} snapshots`);
    
    for (const snapshot of circuitBreakerSnapshots) {
      await offlineDB.failed_snapshots.update(snapshot.id, {
        retryCount: 0,
        nextRetryAt: Date.now(), // Retry immediately
      });
    }
  }
  
  /**
   * Clean up old failed snapshots (older than threshold)
   */
  static async cleanup(): Promise<void> {
    const thresholdMs = CONFIG.CLEANUP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - thresholdMs;
    
    const oldSnapshots = await offlineDB.failed_snapshots
      .where('failedAt')
      .below(cutoffTime)
      .toArray();
    
    if (oldSnapshots.length === 0) {
      return;
    }
    
    console.log(`🧹 [FailedSnapshotStore] Cleaning up ${oldSnapshots.length} old failed snapshots`);
    
    await offlineDB.failed_snapshots
      .where('failedAt')
      .below(cutoffTime)
      .delete();
  }
  
  /**
   * Get statistics for diagnostics
   */
  static async getStats(): Promise<{
    total: number;
    dueForRetry: number;
    circuitBreaker: number;
    oldestFailure: Date | null;
  }> {
    const all = await offlineDB.failed_snapshots.toArray();
    const dueForRetry = all.filter(s => s.nextRetryAt <= Date.now()).length;
    const circuitBreaker = all.filter(s => s.retryCount >= CONFIG.MAX_RETRIES).length;
    const oldestFailure = all.length > 0
      ? new Date(Math.min(...all.map(s => s.failedAt)))
      : null;
    
    return {
      total: all.length,
      dueForRetry,
      circuitBreaker,
      oldestFailure,
    };
  }
  
  /**
   * Clear all failed snapshots (for testing)
   */
  static async clearAll(): Promise<void> {
    await offlineDB.failed_snapshots.clear();
    console.log('🗑️ [FailedSnapshotStore] Cleared all failed snapshots');
  }
}


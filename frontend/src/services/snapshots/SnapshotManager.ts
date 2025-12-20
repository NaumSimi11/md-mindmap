/**
 * STEP 5: Snapshot Manager
 * 
 * Orchestrates durability snapshots with strict rules:
 * - Reads ONLY from Yjs (never TipTap)
 * - Debounced (≥3s inactivity)
 * - Event-based triggers (not edit-based)
 * - Never writes back to Yjs
 * 
 * Reliability (Task 1):
 * - Failed snapshots queued for retry
 * - Exponential backoff with jitter
 * - Network recovery listener
 * - Circuit breaker protection
 */

import * as Y from 'yjs';
import { createSnapshotPayload } from './serializeYjs';
import { pushSnapshot, retryFailedSnapshots } from './snapshotClient';
import { FailedSnapshotStore } from './FailedSnapshotStore';
import { syncNotificationService } from '@/services/notifications/SyncNotificationService';

interface SnapshotManagerOptions {
  documentId: string;
  ydoc: Y.Doc;
  debounceMs?: number; // default 3000ms (3 seconds)
  isAuthenticated: boolean;
}

export class SnapshotManager {
  private documentId: string;
  private ydoc: Y.Doc;
  private debounceMs: number;
  private isAuthenticated: boolean;
  
  private debounceTimer: NodeJS.Timeout | null = null;
  private isDestroyed: boolean = false;
  private updateListener: ((update: Uint8Array, origin: any) => void) | null = null;
  
  // Task 1: Track sync status for UI
  private lastSyncedAt: Date | null = null;
  private lastSyncSuccess: boolean = true;
  
  // Task 6: Adaptive debounce for performance
  private readonly MIN_DEBOUNCE_MS = 2000;  // 2 seconds
  private readonly MAX_DEBOUNCE_MS = 10000; // 10 seconds
  private lastEditTimestamp: number = 0;
  private editCount: number = 0;
  private adaptiveDebounceWindowMs: number = 5000; // 5 second window to measure edit frequency
  
  constructor(options: SnapshotManagerOptions) {
    this.documentId = options.documentId;
    this.ydoc = options.ydoc;
    this.debounceMs = options.debounceMs || 3000; // 3 seconds default
    this.isAuthenticated = options.isAuthenticated;
    
    if (this.isAuthenticated) {
      this.attachListeners();
      console.log(`📸 [Snapshot] Manager initialized for ${this.documentId} (debounce: ${this.debounceMs}ms)`);
    } else {
      console.log(`📴 [Snapshot] Disabled for guest mode: ${this.documentId}`);
    }
  }
  
  /**
   * RULE 2: SNAPSHOT TRIGGER IS EVENT-BASED, NOT EDIT-BASED
   * 
   * Trigger on:
   * ✅ Yjs update events (debounced)
   * ✅ Visibility change (tab hidden)
   * ✅ App background / unload
   * 
   * NOT on:
   * ❌ Every keystroke
   * ❌ TipTap onUpdate
   * ❌ Provider events
   */
  private attachListeners() {
    // Trigger 1: Yjs update events (debounced)
    this.updateListener = (update: Uint8Array, origin: any) => {
      // Ignore updates from providers (those are already synced)
      if (origin === 'provider') return;
      
      this.scheduleSnapshot();
    };
    
    this.ydoc.on('update', this.updateListener);
    
    // Trigger 2: Visibility change (tab hidden)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Trigger 3: App unload
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }
  
  /**
   * Calculate adaptive debounce based on edit frequency
   * Task 6: Fast edits = longer debounce, slow edits = shorter debounce
   */
  private getAdaptiveDebounce(): number {
    const now = Date.now();
    
    // Track edit frequency
    if (now - this.lastEditTimestamp < this.adaptiveDebounceWindowMs) {
      this.editCount++;
    } else {
      // Reset count after window expires
      this.editCount = 1;
    }
    
    this.lastEditTimestamp = now;
    
    // Calculate adaptive delay
    // More edits in window = longer debounce (avoid spamming backend)
    // Fewer edits = shorter debounce (faster backup)
    const editFrequency = this.editCount / (this.adaptiveDebounceWindowMs / 1000); // edits per second
    
    let adaptiveDelay: number;
    
    if (editFrequency > 2) {
      // Fast editing (>2 edits/sec) - use longer debounce
      adaptiveDelay = this.MAX_DEBOUNCE_MS;
    } else if (editFrequency > 1) {
      // Moderate editing (1-2 edits/sec) - use medium debounce
      adaptiveDelay = 5000;
    } else {
      // Slow editing (<1 edit/sec) - use shorter debounce
      adaptiveDelay = this.MIN_DEBOUNCE_MS;
    }
    
    return Math.max(this.MIN_DEBOUNCE_MS, Math.min(adaptiveDelay, this.MAX_DEBOUNCE_MS));
  }

  /**
   * Schedule snapshot with adaptive debouncing
   * RULE 3: DEBOUNCE HARD (≥2-10s, adaptive)
   * Task 6: Now adapts to edit frequency
   */
  private scheduleSnapshot() {
    if (this.isDestroyed || !this.isAuthenticated) return;
    
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Task 6: Use adaptive debounce based on edit frequency
    const adaptiveDelay = this.getAdaptiveDebounce();
    
    // Schedule new snapshot after adaptive debounce period
    this.debounceTimer = setTimeout(() => {
      this.executeSnapshot();
    }, adaptiveDelay);
  }
  
  /**
   * Execute snapshot (reads from Yjs ONLY)
   * RULE 1: SNAPSHOTS READ FROM Yjs ONLY
   */
  private async executeSnapshot() {
    if (this.isDestroyed || !this.isAuthenticated) return;
    
    try {
      console.log(`📸 [Snapshot] Creating durability snapshot for ${this.documentId}`);
      
      // Read from Yjs (NOT TipTap)
      const payload = createSnapshotPayload(
        this.documentId,
        this.ydoc,
        true // include HTML for preview/search
      );
      
      // Push to backend (dumb store)
      // On failure, snapshot is automatically queued for retry
      const success = await pushSnapshot(payload);
      
      // Track sync status for UI (Task 2)
      this.lastSyncSuccess = success;
      if (success) {
        this.lastSyncedAt = new Date();
        console.log(`✅ [Snapshot] Backed up: ${this.documentId}`);
      } else {
        console.warn(`⚠️ [Snapshot] Backup failed (queued for retry): ${this.documentId}`);
      }
    } catch (error) {
      this.lastSyncSuccess = false;
      console.error(`❌ [Snapshot] Error for ${this.documentId}:`, error);
    }
  }
  
  /**
   * Handle tab visibility change (save when hidden)
   */
  private handleVisibilityChange = () => {
    if (document.hidden && !this.isDestroyed && this.isAuthenticated) {
      console.log(`👁️ [Snapshot] Tab hidden, forcing snapshot: ${this.documentId}`);
      // Clear debounce and snapshot immediately
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.executeSnapshot();
    }
  };
  
  /**
   * Handle app unload (save before closing)
   */
  private handleBeforeUnload = () => {
    if (!this.isDestroyed && this.isAuthenticated) {
      console.log(`🚪 [Snapshot] App closing, forcing snapshot: ${this.documentId}`);
      // Use synchronous approach for unload (can't use async)
      // Note: Modern browsers may not allow this, but we try
      this.executeSnapshot();
    }
  };
  
  /**
   * Force snapshot (explicit user action)
   */
  public async forceSnapshot(): Promise<boolean> {
    if (!this.isAuthenticated) {
      console.warn(`⚠️ [Snapshot] Cannot force snapshot in guest mode`);
      return false;
    }
    
    console.log(`🔄 [Snapshot] Force snapshot requested: ${this.documentId}`);
    
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Execute immediately
    await this.executeSnapshot();
    return true;
  }
  
  /**
   * Get sync status for UI (Task 2)
   */
  public getSyncStatus(): {
    lastSyncedAt: Date | null;
    lastSyncSuccess: boolean;
  } {
    return {
      lastSyncedAt: this.lastSyncedAt,
      lastSyncSuccess: this.lastSyncSuccess,
    };
  }
  
  /**
   * Cleanup (remove listeners, clear timers)
   */
  public destroy() {
    if (this.isDestroyed) return;
    
    console.log(`🧹 [Snapshot] Destroying manager for ${this.documentId}`);
    
    this.isDestroyed = true;
    
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Remove Yjs listener
    if (this.updateListener) {
      this.ydoc.off('update', this.updateListener);
      this.updateListener = null;
    }
    
    // Remove browser listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }
}

// ============================================================================
// Global Retry Manager (Task 1 & 3)
// ============================================================================

/**
 * Global manager for retry logic
 * Runs periodically and on network recovery
 * 
 * Task 4: Notifies users when circuit breaker triggers or recovers
 */
class GlobalRetryManager {
  private static instance: GlobalRetryManager | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private readonly RETRY_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
  
  // Task 4: Track circuit breaker state for notifications
  private previousCircuitBreakerCount: number = 0;
  private wasInCircuitBreaker: boolean = false;
  
  private constructor() {
    this.startRetryTimer();
    this.attachNetworkRecoveryListener();
    this.startCleanupTimer(); // Task 6: Periodic cleanup
    console.log('🔄 [GlobalRetryManager] Initialized');
  }
  
  static getInstance(): GlobalRetryManager {
    if (!this.instance) {
      this.instance = new GlobalRetryManager();
    }
    return this.instance;
  }
  
  /**
   * Start periodic retry timer (with circuit breaker detection)
   * Task 4: Detects circuit breaker triggers and recoveries
   */
  private startRetryTimer() {
    this.retryTimer = setInterval(async () => {
      try {
        // Check circuit breaker state BEFORE retry
        const statsBefore = await FailedSnapshotStore.getStats();
        const circuitBreakerCountBefore = statsBefore.circuitBreaker;
        
        // Perform retry
        const result = await retryFailedSnapshots();
        
        // Check circuit breaker state AFTER retry
        const statsAfter = await FailedSnapshotStore.getStats();
        const circuitBreakerCountAfter = statsAfter.circuitBreaker;
        
        // Task 4: Detect NEW circuit breaker triggers
        if (circuitBreakerCountAfter > this.previousCircuitBreakerCount) {
          console.warn(`🚨 [GlobalRetryManager] Circuit breaker triggered: ${circuitBreakerCountAfter} snapshot(s) in circuit breaker state`);
          syncNotificationService.notifyCircuitBreakerTriggered('global');
          this.wasInCircuitBreaker = true;
        }
        
        // Task 4: Detect recovery (circuit breaker count decreased)
        if (this.wasInCircuitBreaker && circuitBreakerCountAfter === 0) {
          console.log(`✅ [GlobalRetryManager] Sync recovered from circuit breaker`);
          syncNotificationService.notifyRecovery();
          this.wasInCircuitBreaker = false;
        }
        
        // Task 4: Soft warning for high pending count (not yet circuit breaker)
        if (statsAfter.total > 3 && circuitBreakerCountAfter === 0 && !this.wasInCircuitBreaker) {
          // Only notify if count increased significantly
          if (statsAfter.total > this.previousCircuitBreakerCount + 2) {
            syncNotificationService.notifyPendingSnapshots(statsAfter.total);
          }
        }
        
        // Update tracking state
        this.previousCircuitBreakerCount = circuitBreakerCountAfter;
        
      } catch (error) {
        console.error('❌ [GlobalRetryManager] Retry error:', error);
      }
    }, this.RETRY_CHECK_INTERVAL_MS);
  }
  
  /**
   * Network recovery listener (Task 3 & 4)
   * Resets circuit breaker and notifies user on recovery
   */
  private attachNetworkRecoveryListener() {
    window.addEventListener('online', async () => {
      console.log('🌐 [GlobalRetryManager] Network recovered, resetting circuit breakers and retrying...');
      
      try {
        // Reset circuit breaker for paused snapshots
        await FailedSnapshotStore.resetCircuitBreaker();
        
        // Immediate retry attempt
        const result = await retryFailedSnapshots();
        
        if (result.attempted > 0) {
          console.log(`✅ [GlobalRetryManager] Network recovery: ${result.succeeded}/${result.attempted} snapshots backed up`);
        }
        
        // Task 4: If any snapshots succeeded after network recovery, notify user
        if (result.succeeded > 0 && this.wasInCircuitBreaker) {
          syncNotificationService.notifyRecovery();
          this.wasInCircuitBreaker = false;
          this.previousCircuitBreakerCount = 0;
        }
      } catch (error) {
        console.error('❌ [GlobalRetryManager] Network recovery error:', error);
      }
    });
    
    console.log('🌐 [GlobalRetryManager] Network recovery listener attached');
  }
  
  /**
   * Task 6: Periodic cleanup of old failed snapshots
   * Runs once per hour to prevent queue from growing indefinitely
   */
  private startCleanupTimer() {
    const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    
    setInterval(async () => {
      try {
        console.log('🧹 [GlobalRetryManager] Running periodic cleanup...');
        await FailedSnapshotStore.cleanup();
      } catch (error) {
        console.error('❌ [GlobalRetryManager] Cleanup error:', error);
      }
    }, CLEANUP_INTERVAL_MS);
    
    console.log('🧹 [GlobalRetryManager] Cleanup timer started (runs every 1 hour)');
  }

  /**
   * Force immediate retry (for "Force Sync" button)
   */
  async forceRetry(): Promise<void> {
    console.log('🔄 [GlobalRetryManager] Manual retry requested');
    await retryFailedSnapshots();
  }
  
  /**
   * Get pending snapshot count for UI badge
   */
  async getPendingCount(): Promise<number> {
    return FailedSnapshotStore.getPendingCount();
  }
  
  /**
   * Cleanup (for testing)
   */
  destroy() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

// Initialize global retry manager on module load
const globalRetryManager = GlobalRetryManager.getInstance();

/**
 * Export for manual retry (Force Sync button)
 */
export async function forceRetryAll(): Promise<void> {
  await globalRetryManager.forceRetry();
}

/**
 * Get pending snapshot count (for UI badge)
 */
export async function getPendingSnapshotCount(): Promise<number> {
  return globalRetryManager.getPendingCount();
}


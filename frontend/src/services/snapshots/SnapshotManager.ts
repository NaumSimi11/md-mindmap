/**
 * STEP 5: Snapshot Manager
 * 
 * Orchestrates cloud snapshots with strict rules:
 * - Reads ONLY from Yjs (never TipTap)
 * - Debounced (≥3s inactivity)
 * - Event-based triggers (not edit-based)
 * - Never writes back to Yjs
 */

import * as Y from 'yjs';
import { createSnapshotPayload } from './serializeYjs';
import { pushSnapshot } from './snapshotClient';

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
   * Schedule snapshot with debouncing
   * RULE 3: DEBOUNCE HARD (≥2-5s)
   */
  private scheduleSnapshot() {
    if (this.isDestroyed || !this.isAuthenticated) return;
    
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Schedule new snapshot after debounce period
    this.debounceTimer = setTimeout(() => {
      this.executeSnapshot();
    }, this.debounceMs);
  }
  
  /**
   * Execute snapshot (reads from Yjs ONLY)
   * RULE 1: SNAPSHOTS READ FROM Yjs ONLY
   */
  private async executeSnapshot() {
    if (this.isDestroyed || !this.isAuthenticated) return;
    
    try {
      console.log(`📸 [Snapshot] Creating snapshot for ${this.documentId}`);
      
      // Read from Yjs (NOT TipTap)
      const payload = createSnapshotPayload(
        this.documentId,
        this.ydoc,
        true // include HTML for preview/search
      );
      
      // Push to backend (dumb store)
      const success = await pushSnapshot(payload);
      
      if (success) {
        console.log(`✅ [Snapshot] Saved for ${this.documentId}`);
      } else {
        console.warn(`⚠️ [Snapshot] Failed for ${this.documentId}`);
      }
    } catch (error) {
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


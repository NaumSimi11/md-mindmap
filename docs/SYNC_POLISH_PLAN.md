# Background Sync Polish Plan
**Status**: Production-Ready Foundation → Polish for Enterprise  
**Date**: December 20, 2025

---

## 🎯 Current State Analysis

### ✅ What's Working (Strong Foundation)

1. **Real-time Collaboration**
   - HocuspocusProvider + Hocuspocus server = WORKING
   - CRDT conflict resolution via Yjs
   - Multi-user presence & cursors
   - Sub-100ms latency

2. **Local-First Architecture**
   - IndexedDB persistence (offline editing)
   - Yjs binary as source of truth
   - No data loss on refresh/crash

3. **Cloud Durability**
   - Snapshot system (debounced 3s)
   - PostgreSQL backend storage
   - Push-only during collaboration (correct!)

4. **UI Components**
   - `SyncStatusIcon` - basic status display
   - `ModernSyncStatusIcon` - styled version
   - `SyncStatusIndicator` - comprehensive component
   - States: `local | synced | syncing | modified | conflict | error | pending | offline`

5. **Error Handling**
   - Network online/offline detection
   - `ConnectionStateMachine` with retry logic
   - Basic error logging

---

## 🔧 Areas Needing Polish

### 1. **Failed Snapshot Recovery** ⚠️ CRITICAL
**Problem**: Snapshots fail silently with only `console.warn`  
**Impact**: Users don't know their work isn't backed up  

**Current Code:**
```typescript
// snapshotClient.ts:52
if (!response.ok) {
  throw new Error(`Snapshot push failed: ${response.status}`);
}
// ... catch block
console.error('❌ [Snapshot] Push failed:', error);
return false; // ❌ No retry, no queue, no user notification
```

**Solution**:
- [ ] Add persistent queue for failed snapshots (IndexedDB)
- [ ] Implement exponential backoff retry (1s, 2s, 4s, 8s, 16s max)
- [ ] Retry on network recovery (`navigator.onLine` event)
- [ ] Show toast notification on persistent failure (>5 retries)
- [ ] Display "unsaved changes" badge in UI

---

### 2. **User-Facing Sync Status** 📊 HIGH PRIORITY
**Problem**: Sync status exists but not prominently displayed  
**Impact**: Users don't have visibility into sync health  

**Current State**:
- Components exist but usage unclear
- No "last synced" timestamp visible
- No real-time sync progress indication

**Solution**:
- [ ] Add prominent sync indicator to editor header
- [ ] Show "Last synced: X seconds ago" timestamp
- [ ] Animate icon during active sync
- [ ] Show sync badge count (pending changes)
- [ ] Add tooltip with detailed status

**Mockup**:
```
┌────────────────────────────────────────────┐
│ Document Title         [✓ Saved 3s ago] ⓘ │
└────────────────────────────────────────────┘
       Hover tooltip:
       - Local: Synced ✓
       - Cloud: Synced ✓
       - Network: Online
       - Last sync: 3 seconds ago
```

---

### 3. **Network Resilience** 🌐 MEDIUM PRIORITY
**Problem**: No automatic recovery from transient failures  
**Impact**: User must manually refresh to resume sync  

**Current State**:
- `navigator.onLine` detection exists
- No automatic retry on network recovery
- No exponential backoff in `SnapshotManager`

**Solution**:
- [ ] Listen to `online` event → trigger immediate sync
- [ ] Exponential backoff: 1s → 2s → 4s → 8s → 16s (max)
- [ ] Jitter to prevent thundering herd (±20% random)
- [ ] Circuit breaker: pause retries after 5 consecutive failures
- [ ] Resume automatically when network recovers

---

### 4. **Performance Optimization** ⚡ LOW PRIORITY
**Problem**: Good baseline (3s debounce) but could be smarter  
**Impact**: Minor - only affects high-frequency edits  

**Current State**:
- Fixed 3-second debounce
- No batching across multiple documents
- No prioritization

**Solution**:
- [ ] Adaptive debounce: shorter for idle docs (1s), longer for active (5s)
- [ ] Batch snapshots for multiple docs in single request
- [ ] Prioritize active document over background docs
- [ ] Compress Yjs binary before network transfer (gzip)

---

### 5. **Error Reporting & Diagnostics** 🔍 MEDIUM PRIORITY
**Problem**: Errors logged to console but not accessible to users  
**Impact**: Hard to debug sync issues in production  

**Current State**:
- Good console logging
- No user-accessible error log
- No error analytics/telemetry

**Solution**:
- [ ] Add sync health panel (Settings → Sync Status)
- [ ] Show last 10 sync attempts (success/failure)
- [ ] Display detailed error messages
- [ ] Copy diagnostic info to clipboard
- [ ] Add "Force Sync Now" button

**Mockup**:
```
┌─ Sync Health ────────────────────────────┐
│ Status: ✓ Healthy                        │
│ Last sync: 3 seconds ago                 │
│ Network: Online (127ms latency)          │
│                                          │
│ Recent Activity:                         │
│ • 10:42:15 - Snapshot pushed (28 bytes) │
│ • 10:42:12 - Snapshot pushed (24 bytes) │
│ • 10:42:09 - Snapshot failed (Network)  │
│                                          │
│ [Force Sync Now] [Copy Diagnostics]     │
└──────────────────────────────────────────┘
```

---

### 6. **Conflict Resolution UI** ⚙️ LOW PRIORITY (Already Handled by CRDT)
**Status**: Yjs handles conflicts automatically  
**Impact**: None - works correctly  

**Note**: CRDTs don't create conflicts in the traditional sense. All edits merge automatically. Only display info if user requests it.

---

## 📋 Implementation Priority

### Phase 1: Critical (Week 1)
1. **Failed Snapshot Queue & Retry**
   - IndexedDB queue for failed snapshots
   - Exponential backoff retry
   - Network recovery trigger
   - User notification on persistent failure

2. **Prominent Sync Status Display**
   - Header sync indicator
   - "Last synced" timestamp
   - Animated sync progress
   - Detailed tooltip

### Phase 2: High (Week 2)
3. **Network Resilience**
   - Auto-retry on `online` event
   - Circuit breaker pattern
   - Smart backoff with jitter

4. **Error Diagnostics Panel**
   - Sync health dashboard
   - Recent activity log
   - Force sync button
   - Copy diagnostics

### Phase 3: Nice-to-Have (Week 3)
5. **Performance Optimization**
   - Adaptive debounce
   - Batch snapshots
   - Binary compression

---

## 🎨 Visual Design Requirements

### Sync Status Indicator (Header)
**Specs**:
- Position: Top-right of editor, next to user avatar
- Size: 32x32px
- States:
  - Syncing: Yellow spinner (animate)
  - Synced: Green checkmark (fade in)
  - Error: Red exclamation (pulse)
  - Offline: Gray cloud-off icon
- Tooltip: Hover for details (100ms delay)

### Toast Notifications
**Specs**:
- Position: Bottom-right corner
- Duration: 4 seconds (auto-dismiss)
- Dismissible: Yes (X button)
- Types:
  - Success: Green background
  - Warning: Yellow background
  - Error: Red background

### Sync Health Panel
**Specs**:
- Location: Settings → Advanced → Sync Health
- Size: 600x400px modal
- Scrollable activity log (last 50 events)
- Export diagnostics as JSON

---

## 📊 Success Metrics

### User-Facing
- **Sync Visibility**: 100% of users see sync status
- **Error Awareness**: <1% of users experience silent failures
- **Recovery Time**: <10s from network outage to full sync

### Technical
- **Retry Success Rate**: >95% of failed snapshots eventually succeed
- **P50 Sync Latency**: <500ms from edit to snapshot push
- **P99 Sync Latency**: <3s from edit to snapshot push

### Monitoring
- Track failed snapshot count (alert if >100/hour)
- Track retry success rate (alert if <90%)
- Track sync latency percentiles (alert if P99 >5s)

---

## 🚀 Quick Wins (Do First)

These require <1 hour each and provide immediate value:

1. **Show "Last Synced" Timestamp**
   - Add `lastSyncedAt` to `SnapshotManager`
   - Display in header: "Saved 3s ago"
   - Uses existing `SyncStatusIndicator`

2. **Toast on Persistent Error**
   - After 3 failed retries, show toast
   - Message: "Unable to sync. Changes saved locally."
   - Already have toast system in place

3. **Animate Sync Icon**
   - Use existing `animate-spin` on `syncing` state
   - Already implemented in `ModernSyncStatusIcon`

4. **Force Sync Button**
   - Call `SnapshotManager.executeSnapshot()` immediately
   - Add to document menu (⋮ icon)

---

## 🛠️ Technical Implementation Notes

### Failed Snapshot Queue (IndexedDB Schema)
```typescript
interface FailedSnapshot {
  id: string; // UUID
  documentId: string;
  payload: SnapshotPayload;
  failedAt: number; // timestamp
  retryCount: number;
  lastError: string;
  nextRetryAt: number; // timestamp
}

// Dexie table
failedSnapshots: '++id, documentId, nextRetryAt'
```

### Exponential Backoff Formula
```typescript
function calculateBackoff(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 16000; // 16 seconds
  const jitter = Math.random() * 0.4 - 0.2; // ±20%
  
  const delay = Math.min(
    baseDelay * Math.pow(2, retryCount),
    maxDelay
  );
  
  return delay * (1 + jitter);
}
```

### Network Recovery Hook
```typescript
window.addEventListener('online', async () => {
  console.log('🌐 Network recovered, retrying failed snapshots...');
  await retryAllFailedSnapshots();
});
```

---

## 📝 Testing Checklist

Before deploying sync polish:

- [ ] Test with airplane mode (offline → online transition)
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with intermittent network (random drops)
- [ ] Test with 500 error from backend
- [ ] Test with 401 (auth expired)
- [ ] Test with concurrent edits from multiple browsers
- [ ] Test with browser crash/force quit
- [ ] Test with 1000+ character document
- [ ] Test with 50+ snapshots queued
- [ ] Verify no memory leaks (24h stress test)

---

## 🎯 Final State (After Polish)

### User Experience
✅ Always visible sync status  
✅ Clear "last synced" timestamp  
✅ Automatic recovery from errors  
✅ Notifications for persistent issues  
✅ Diagnostic tools for debugging  

### Technical Excellence
✅ Zero silent failures  
✅ 95%+ retry success rate  
✅ <500ms P50 sync latency  
✅ Graceful degradation (offline → online)  
✅ Production-grade error handling  

---

**Status**: Ready for implementation  
**Estimated Effort**: 3 weeks (1 dev)  
**Priority**: High (foundational for enterprise use)


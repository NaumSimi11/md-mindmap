# Sync Writer Scopes Documentation
**MDReader Local-First Architecture**  
**Last Updated**: December 19, 2025  
**Status**: Production Reference

---

## Purpose

This document clarifies the **distinct scopes** of the two cloud writers in MDReader's sync architecture, preventing confusion and ensuring correct usage.

---

## The Two Cloud Writers

MDReader has **two coordinated cloud writers** that operate in different scopes:

### 1. SelectiveSyncService (REST API Writer)
**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

### 2. Hocuspocus WebSocket (Real-Time Writer)
**File**: `hocuspocus-server/server.js`

---

## Scope Comparison

| Aspect | SelectiveSyncService | Hocuspocus WebSocket |
|--------|---------------------|---------------------|
| **Protocol** | REST API (HTTP) | WebSocket (WSS) |
| **Trigger** | User action ("Push to Cloud" button) | Automatic (on document edit) |
| **Active When** | Document closed OR offline-to-online | Document open in editor |
| **Frequency** | On-demand (manual) | Real-time (every keystroke) |
| **Use Case** | Batch sync, offline reconciliation | Live collaboration |
| **Conflict Detection** | 409 + pull + merge + retry | CRDT automatic merge |
| **User Visible** | Yes (button, explicit action) | No (invisible background) |
| **Network State** | Works when going online | Requires sustained connection |

---

## Decision Tree: Which Writer Handles What?

```
┌─────────────────────────────────────────┐
│  User Edits Document                    │
└───────────┬─────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │ Is document   │
    │ open in       │──── NO ──────┐
    │ editor?       │              │
    └───────┬───────┘              │
            │                      │
           YES                     │
            │                      │
            ▼                      ▼
    ┌───────────────┐      ┌──────────────┐
    │ Is user       │      │ Edits stored │
    │ authenticated │      │ in IndexedDB │
    │ + online?     │      │ (local only) │
    └───────┬───────┘      └──────────────┘
            │                      │
           YES                     │
            │                      │
            ▼                      │
    ┌───────────────┐              │
    │ HOCUSPOCUS    │              │
    │ Real-time     │              │
    │ WebSocket     │              │
    │ writes to     │              │
    │ PostgreSQL    │              │
    └───────────────┘              │
                                   │
                                   │
            ┌──────────────────────┘
            │
            ▼
    ┌───────────────┐
    │ User clicks   │
    │ "Push to      │
    │ Cloud" later  │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ SELECTIVE     │
    │ SYNC SERVICE  │
    │ REST API      │
    │ writes to     │
    │ PostgreSQL    │
    └───────────────┘
```

---

## Detailed Scenarios

### Scenario A: Real-Time Collaboration (Hocuspocus)

**Conditions:**
- User is authenticated
- Document is open in editor
- Network is online
- WebSocket connected

**Flow:**
1. User types "Hello" in editor
2. TipTap → Yjs CRDT generates operation
3. Yjs → WebSocket Provider sends update
4. Hocuspocus server receives update
5. Hocuspocus writes to PostgreSQL `yjs_state` (increments `yjs_version`)
6. Hocuspocus broadcasts to other connected peers
7. Peers apply update via CRDT merge

**Writer**: **Hocuspocus** (automatic, invisible)

**Files Involved:**
- `frontend/src/services/yjs/YjsDocumentManager.ts:102-126` (WebSocket provider setup)
- `hocuspocus-server/server.js` (WebSocket server)

---

### Scenario B: Offline Editing → Push to Cloud (SelectiveSyncService)

**Conditions:**
- User was offline (or guest mode)
- Document edited locally
- User goes online and clicks "Push to Cloud"

**Flow:**
1. User edits document offline → stored in IndexedDB (y-indexeddb)
2. User goes online
3. User clicks "Push to Cloud" button
4. SelectiveSyncService.pushDocument() called
5. Extract Yjs binary: `Y.encodeStateAsUpdate(ydoc)`
6. Base64 encode binary
7. Serialize Yjs → markdown (for cache)
8. POST/PATCH to `/api/v1/documents`
9. Backend checks `yjs_version` (optimistic locking)
10. If version matches: Write to PostgreSQL, increment `yjs_version`
11. If version mismatch: Return 409 → trigger pull-merge-retry

**Writer**: **SelectiveSyncService** (manual, explicit)

**Files Involved:**
- `frontend/src/services/sync/SelectiveSyncService.ts:371-568` (pushDocument)
- `backendv2/app/routers/documents.py` (REST API)
- `backendv2/app/services/document_service.py` (business logic)

---

### Scenario C: Document Closed, Background Sync Needed (SelectiveSyncService)

**Conditions:**
- User edited document A, then closed it
- User opens document B
- Document A has unsaved changes in IndexedDB
- User wants to sync document A

**Flow:**
1. Document A is closed (no WebSocket connection)
2. Hocuspocus **CANNOT** sync (requires open document)
3. User must click "Push to Cloud" on document A in sidebar
4. SelectiveSyncService handles sync (same as Scenario B)

**Writer**: **SelectiveSyncService** (manual)

**Why Hocuspocus doesn't work here:**
- WebSocket provider only active when document is open in editor
- Closing document destroys WebSocket provider
- Background sync requires REST API

---

### Scenario D: Concurrent Edits from Two Devices (Both Writers)

**Conditions:**
- Device A: Document open, Hocuspocus active
- Device B: Document closed, SelectiveSyncService used

**Flow:**
1. Device A types "Hello" → Hocuspocus writes (version 10 → 11)
2. Device B clicks "Push to Cloud" with local changes (expects version 10)
3. SelectiveSyncService sends expected_yjs_version: 10
4. Backend checks: current version is 11 (mismatch!)
5. Backend returns 409 Conflict
6. SelectiveSyncService detects 409
7. SelectiveSyncService calls pullDocument()
8. Pull fetches version 11 state
9. Yjs applies update: `Y.applyUpdate(ydoc, remoteState)`
10. CRDT merge: Device B now has "Hello" + local changes
11. SelectiveSyncService retries push with expected_yjs_version: 11
12. Backend accepts (version matches), writes version 12

**Writers**: **Both** (coordinated via `yjs_version` optimistic locking)

**Key Point**: Both writers use the same concurrency control mechanism, so conflicts are detected and resolved automatically.

---

## Coordination Mechanism

Both writers coordinate via **optimistic locking** using `yjs_version`:

```sql
-- Backend check (in DocumentService)
if expected_yjs_version != current_yjs_version:
    return 409 Conflict

-- On success:
UPDATE documents
SET yjs_state = new_state,
    yjs_version = yjs_version + 1
WHERE id = document_id
```

**This ensures:**
- No lost writes (concurrent edits detected)
- Deterministic convergence (CRDT merge)
- No race conditions (atomic version check + update)

---

## When to Use Which Writer

### Use SelectiveSyncService When:
- ✅ Pushing offline edits to cloud
- ✅ Syncing closed documents
- ✅ Batch syncing multiple documents
- ✅ User wants explicit control ("Push to Cloud")
- ✅ Document is not currently open

### Use Hocuspocus When:
- ✅ Real-time collaboration (multiple users editing)
- ✅ Document is open in editor
- ✅ Want automatic sync (no user action needed)
- ✅ Low-latency updates required

### Don't Use Either When:
- ❌ Offline mode (no network) → writes stay in IndexedDB
- ❌ Guest mode (not authenticated) → local-only

---

## Common Misunderstandings

### ❌ Myth: "SelectiveSyncService and Hocuspocus conflict with each other"
**✅ Reality**: They coordinate via `yjs_version` optimistic locking. If both try to write simultaneously, one gets 409 and pulls latest, then retries. Eventual consistency guaranteed.

### ❌ Myth: "If Hocuspocus is active, SelectiveSyncService is disabled"
**✅ Reality**: Both can be active. SelectiveSyncService handles closed documents, Hocuspocus handles open documents. They don't interfere.

### ❌ Myth: "Hocuspocus syncs all documents in the background"
**✅ Reality**: Hocuspocus only syncs **open** documents. Closed documents require SelectiveSyncService.

### ❌ Myth: "SelectiveSyncService is legacy, will be removed"
**✅ Reality**: SelectiveSyncService is essential for batch sync and offline-to-online reconciliation. Both writers are production-critical.

---

## Code References

### SelectiveSyncService Entry Points

| Function | Purpose | File |
|----------|---------|------|
| `pushDocument()` | Upload local changes to cloud | `SelectiveSyncService.ts:371-568` |
| `pullDocument()` | Download cloud changes to local | `SelectiveSyncService.ts:576-682` |
| `handleConflict()` | 409 handler (pull + merge + retry) | `SelectiveSyncService.ts:494-515` |

### Hocuspocus Entry Points

| Function | Purpose | File |
|----------|---------|------|
| `getDocument()` | Initialize WebSocket provider | `YjsDocumentManager.ts:58-163` |
| `onUpdate()` | Yjs update handler | `y-websocket` library |
| `hocuspocus.handleConnection()` | WebSocket server handler | `hocuspocus-server/server.js` |

---

## Testing Guidelines

### How to Test SelectiveSyncService
1. Create document offline
2. Edit document
3. Close document (important!)
4. Go online
5. Click "Push to Cloud" in sidebar
6. Verify: Document appears on other device after refresh

### How to Test Hocuspocus
1. Login on Device A
2. Login on Device B
3. Open same document on both devices
4. Type on Device A
5. Verify: Text appears on Device B in real-time (< 1 second)

### How to Test Coordination
1. Edit document on Device A (online, document open) → Hocuspocus writes
2. Edit same document on Device B (offline) → Local writes only
3. Device B goes online, clicks "Push to Cloud" → SelectiveSyncService attempts write
4. Verify: 409 Conflict detected
5. Verify: SelectiveSyncService pulls latest
6. Verify: CRDT merge produces correct combined result
7. Verify: Retry succeeds

---

## Maintenance Notes

### If You Need to Add a New Sync Path
⚠️ **DO NOT** create a third writer. Use existing writers:
- For real-time sync: Enhance Hocuspocus
- For batch sync: Enhance SelectiveSyncService

### If You Need to Modify Sync Logic
⚠️ **ALWAYS** maintain `yjs_version` optimistic locking:
- Read current `yjs_version` before write
- Send `expected_yjs_version` in request
- Handle 409 with pull-merge-retry
- Never skip version check

---

## Summary

**SelectiveSyncService**: Manual, batch, offline-to-online, closed documents  
**Hocuspocus**: Automatic, real-time, online-only, open documents  
**Coordination**: `yjs_version` optimistic locking  
**Conflicts**: Automatic CRDT merge  
**Result**: Eventual consistency, no data loss

Both writers are production-critical and serve different purposes. They are **complementary**, not redundant.

---

**End of Documentation**  
**Questions?** See `docs/LOCAL_FIRST_SYNC_ARCHITECTURE_AUDIT.md` for full architecture details.


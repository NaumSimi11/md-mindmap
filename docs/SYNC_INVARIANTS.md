# Sync Invariants

**Status:** Canonical Reference  
**Purpose:** Define immutable rules for synchronization  
**Audience:** All engineers touching sync, sidebar, or editor code  
**Last Updated:** December 2025

---

## Purpose

This document defines invariants that MUST ALWAYS hold true in the MDReader sync system. Violating any invariant constitutes a critical bug and may result in data loss, UI corruption, or security breach.

---

## Invariant Format

Each invariant is specified as:

- **INVARIANT:** The rule that must always be true
- **RATIONALE:** Why this rule exists
- **FAILURE MODE IF VIOLATED:** What breaks if this rule is violated
- **ENFORCEMENT:** How the system ensures this rule holds

---

## Source-of-Truth Hierarchy

### INVARIANT 1.1: CRDT is Canonical for Content

**INVARIANT:**  
The CRDT state (Yjs document) is the ONLY canonical source of truth for document content. HTML, Markdown, and plain text are derived artifacts.

**RATIONALE:**
- CRDT guarantees conflict-free merge
- HTML/Markdown cannot be reliably merged
- Derived artifacts may be stale or inconsistent

**FAILURE MODE IF VIOLATED:**
- Content divergence between replicas
- User edits lost during sync
- Merge conflicts that cannot be resolved

**ENFORCEMENT:**
- Backend stores only CRDT state (bytea columns)
- Export operations generate HTML/MD on-demand from CRDT
- Import operations convert to CRDT before storing

---

### INVARIANT 1.2: IndexedDB is Source of Truth for Local State

**INVARIANT:**  
For a given browser+user, IndexedDB is the authoritative source for document list, metadata, and sync status. Server is consulted only for explicit push/pull operations.

**RATIONALE:**
- Local-first architecture requires local persistence
- Offline operation must be fully functional
- Server is optional, not required

**FAILURE MODE IF VIOLATED:**
- Sidebar shows incorrect documents after refresh
- Sync status icons are wrong
- Offline editing breaks

**ENFORCEMENT:**
- `WorkspaceContext` loads from `GuestWorkspaceService` (reads IndexedDB)
- `BackendWorkspaceService` is used only for push/pull (explicit user action)
- No automatic backend queries on page load

---

### INVARIANT 1.3: WorkspaceContext.documents is Local Index

**INVARIANT:**  
`WorkspaceContext.documents` array is the single source of truth for the sidebar document list. It is populated from IndexedDB on load and updated only by explicit local operations.

**RATIONALE:**
- Sidebar must be fast (no network roundtrips)
- Multiple components read `documents` array (must be consistent)
- Refreshing from backend would cause duplication or loss

**FAILURE MODE IF VIOLATED:**
- Sidebar shows duplicate documents
- Documents disappear after refresh
- Newly created documents not visible

**ENFORCEMENT:**
- `WorkspaceContext` initializes `documents` from `GuestWorkspaceService.listDocuments()`
- `createDocument()` appends to `documents` array
- `deleteDocument()` removes from `documents` array
- `refreshDocuments()` is NEVER called after sync operations

---

## Local Index Responsibilities

### INVARIANT 2.1: All Documents Have Stable IDs

**INVARIANT:**  
Every document in `WorkspaceContext.documents` MUST have a non-null, non-empty `id` field (UUID). Documents without IDs are invalid.

**RATIONALE:**
- IDs are used for routing (open document by ID)
- IDs are used for sync (map local to cloud)
- IDs are used for deduplication (detect duplicates)

**FAILURE MODE IF VIOLATED:**
- Cannot open document (routing fails)
- Cannot sync document (no mapping)
- Duplicate documents in sidebar (no dedup key)

**ENFORCEMENT:**
- `createDocument()` generates UUID if not provided
- Development-mode assertion checks all documents have IDs
- TypeScript type `Document` requires `id: string` (non-nullable)

---

### INVARIANT 2.2: Document IDs are Immutable

**INVARIANT:**  
Once a document is created with ID `X`, that ID NEVER changes. The document may be synced to cloud (gaining a `cloudId`), but the local `id` remains `X`.

**RATIONALE:**
- Changing IDs breaks routing (URLs become invalid)
- Changing IDs breaks IndexedDB lookups (orphaned data)
- Changing IDs breaks sync mappings (lose link to cloud)

**FAILURE MODE IF VIOLATED:**
- User opens document, gets 404 after sync
- IndexedDB has orphaned CRDT state
- Duplicate documents (old ID + new ID both in sidebar)

**ENFORCEMENT:**
- `id` field is never reassigned after creation
- `updateDocument()` does not allow `id` in update payload
- Sync stores `cloudId` separately (does not overwrite `id`)

---

### INVARIANT 2.3: cloudId Links Local to Remote

**INVARIANT:**  
If `document.sync.cloudId` is set, it MUST match the `id` field in the backend database. This is the stable link between local and cloud replicas.

**RATIONALE:**
- Push/pull operations require mapping local ↔ cloud
- Prevents duplicate uploads (check if cloudId exists before POST)
- Enables incremental sync (PATCH to cloudId)

**FAILURE MODE IF VIOLATED:**
- Document pushed multiple times (no dedup)
- Updates sent to wrong document (data corruption)
- Sync status incorrect (thinks synced but not)

**ENFORCEMENT:**
- `SelectiveSyncService.pushDocument()` sets `cloudId` after successful POST
- `cloudId` is persisted to IndexedDB immediately
- `cloudId` is immutable once set (never changes)

---

## Sidebar Invariants

### INVARIANT 3.1: Sidebar Reads ONLY from WorkspaceContext

**INVARIANT:**  
The sidebar component (`WorkspaceSidebar.tsx`) MUST read the document list ONLY from `WorkspaceContext.documents`. It MUST NOT query backend or IndexedDB directly.

**RATIONALE:**
- Single source of truth (consistency)
- Avoids race conditions (multiple queries in flight)
- Enables optimistic updates (sidebar updates immediately)

**FAILURE MODE IF VIOLATED:**
- Sidebar shows stale data (out of sync with context)
- Sidebar shows duplicates (merged backend + context data)
- UI flickers (multiple re-renders from different sources)

**ENFORCEMENT:**
- `WorkspaceSidebar` uses `useWorkspace()` hook
- No direct API calls in sidebar component
- No direct IndexedDB queries in sidebar component

---

### INVARIANT 3.2: Sync Icons Reflect Durable State

**INVARIANT:**  
Sync status icons (local disk, syncing, cloud) MUST reflect the `syncStatus` field stored in IndexedDB. Icons MUST persist across browser refresh.

**RATIONALE:**
- User needs to know which documents are backed up
- Transient UI state is misleading (looks synced, but not)
- Persistent state enables offline-first workflow

**FAILURE MODE IF VIOLATED:**
- Icons show "local" after refresh, even though document is synced
- User re-uploads already-synced documents (duplicates)
- User loses trust in sync indicators

**ENFORCEMENT:**
- `syncStatus` is stored in `DocumentMeta` (IndexedDB)
- `WorkspaceContext` loads `syncStatus` from IndexedDB on init
- `document-sync-status-changed` event updates IndexedDB + context
- Sidebar reads `doc.sync.status` directly (no recomputation)

---

### INVARIANT 3.3: No Background Sidebar Refresh After Sync

**INVARIANT:**  
After a successful push-to-cloud operation, the system MUST NOT call `refreshDocuments()` or re-query the backend to update the sidebar.

**RATIONALE:**
- Backend query may return partial data (race condition)
- Duplicate append if backend response merged with local
- Sync status already updated via event (no refresh needed)

**FAILURE MODE IF VIOLATED:**
- Sidebar shows duplicate documents after push
- Sidebar flickers (removes then re-adds documents)
- Sync status resets to incorrect value

**ENFORCEMENT:**
- `SelectiveSyncService.pushDocument()` does NOT call `refreshDocuments()`
- `WorkspaceSidebar.handlePushToCloud()` does NOT call `refreshDocuments()`
- Document mutations trigger events only (no refresh)

---

## Editor Invariants

### INVARIANT 4.1: Editor Loads from Yjs IndexedDB Provider

**INVARIANT:**  
The TipTap editor MUST load document content from the Yjs IndexedDB provider (`y-indexeddb`). It MUST NOT load from backend API or separate IndexedDB table.

**RATIONALE:**
- Yjs state is canonical (see INVARIANT 1.1)
- y-indexeddb automatically syncs editor ↔ IndexedDB
- Separate load path causes divergence

**FAILURE MODE IF VIOLATED:**
- Editor shows stale content (old HTML from backend)
- User edits lost (overwritten by stale load)
- Yjs state out of sync with displayed content

**ENFORCEMENT:**
- Editor initializes with `new Y.Doc()`
- `IndexeddbPersistence` provider attached to `Y.Doc`
- No `editor.setContent(htmlFromBackend)` calls

---

### INVARIANT 4.2: Editor Generates CRDT Operations Only

**INVARIANT:**  
All editor changes (typing, formatting, deletions) MUST generate Yjs operations. The system MUST NOT store HTML diffs or text deltas separately.

**RATIONALE:**
- CRDT guarantees conflict-free merge
- HTML diffs cannot be merged reliably
- Storing both CRDT + HTML creates divergence

**FAILURE MODE IF VIOLATED:**
- Content merge conflicts in collaborative editing
- Local edits lost during sync
- Divergent replicas that cannot converge

**ENFORCEMENT:**
- `y-prosemirror` binding installed (auto-generates Yjs ops)
- No manual `doc.setContent()` calls (bypasses CRDT)
- Backend stores only CRDT state (no HTML storage)

---

### INVARIANT 4.3: Editor Sync Status is Independent of Sidebar

**INVARIANT:**  
The editor's sync status indicator (if present) MUST read from the same source as the sidebar (`WorkspaceContext.documents[id].sync.status`). It MUST NOT compute sync status independently.

**RATIONALE:**
- User sees consistent status across UI
- Prevents confusion (sidebar says "synced", editor says "local")
- Single computation point (easier to debug)

**FAILURE MODE IF VIOLATED:**
- Sidebar shows cloud icon, editor shows local icon
- User unsure if document is backed up
- User performs redundant sync operations

**ENFORCEMENT:**
- Editor subscribes to `WorkspaceContext` (same source as sidebar)
- Editor does NOT compute sync status from Yjs state
- Editor does NOT compare timestamps or hashes

---

## Sync Status Semantics

### INVARIANT 5.1: Sync Status Values are Exhaustive

**INVARIANT:**  
`syncStatus` MUST be one of exactly four values: `'local' | 'syncing' | 'synced' | 'error'`. No other values are allowed.

**RATIONALE:**
- Finite state machine (predictable transitions)
- UI can handle all cases (no undefined behavior)
- TypeScript enforcement (compile-time check)

**FAILURE MODE IF VIOLATED:**
- UI shows incorrect icon (unknown status)
- State machine transitions break (unexpected state)
- Sync logic errors (unhandled case)

**ENFORCEMENT:**
- TypeScript type: `type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'`
- Runtime validation on IndexedDB load (fallback to 'local' if invalid)
- State machine transition function (only allows valid transitions)

---

### INVARIANT 5.2: Sync Status Transitions are Sequential

**INVARIANT:**  
Sync status transitions MUST follow this state machine:

```
local → syncing → synced
local → syncing → error → syncing (retry)
synced → syncing → synced (update)
```

Invalid transitions (e.g., `local → synced` without `syncing`) are forbidden.

**RATIONALE:**
- `syncing` state prevents duplicate uploads (idempotency)
- User sees progress (loading spinner)
- Debugging easier (clear transition log)

**FAILURE MODE IF VIOLATED:**
- Duplicate uploads (skip syncing check)
- UI confusion (instant sync, no feedback)
- Race conditions (multiple syncs in parallel)

**ENFORCEMENT:**
- `SelectiveSyncService` uses state machine helper
- State transitions logged (audit trail)
- Invalid transitions throw error (fail fast)

---

### INVARIANT 5.3: Sync Status Persists Across Sessions

**INVARIANT:**  
`syncStatus` MUST be stored in IndexedDB and MUST be restored on page reload. Transient state (in-memory only) is forbidden.

**RATIONALE:**
- User needs to know sync state after restart
- Prevents re-upload of synced documents
- Enables offline-first workflow (know what needs sync)

**FAILURE MODE IF VIOLATED:**
- All documents show "local" after refresh (even if synced)
- User re-uploads everything (wasted bandwidth, quota)
- Sync state lost on crash/refresh

**ENFORCEMENT:**
- `DocumentMeta` schema includes `syncStatus` field
- `GuestWorkspaceService.updateDocument()` writes to IndexedDB
- `WorkspaceContext` initialization reads from IndexedDB (no defaults)

---

## Push-to-Cloud Rules

### INVARIANT 6.1: Push is Explicit User Action Only

**INVARIANT:**  
Documents MUST be pushed to cloud ONLY when the user explicitly clicks "Push to Cloud" button. No automatic push on create, edit, or login.

**RATIONALE:**
- Local-first: user controls when data leaves device
- Privacy: user may not want all documents in cloud
- Bandwidth: user on metered connection

**FAILURE MODE IF VIOLATED:**
- Privacy violation (documents uploaded without consent)
- Bandwidth waste (large documents uploaded automatically)
- Quota exhaustion (user hits storage limit unexpectedly)

**ENFORCEMENT:**
- `createDocument()` sets `syncStatus = 'local'` (never auto-push)
- Editor edits do NOT trigger push
- Login does NOT trigger background push
- Only `handlePushToCloud()` calls `SelectiveSyncService.pushDocument()`

---

### INVARIANT 6.2: Push is Idempotent

**INVARIANT:**  
Pushing the same document multiple times MUST NOT create duplicates. Second push MUST update (PATCH) the existing cloud document.

**RATIONALE:**
- User may click "Push" multiple times (network delay, impatience)
- Retry logic may re-attempt failed push
- Duplicates cause confusion and quota waste

**FAILURE MODE IF VIOLATED:**
- Multiple copies of same document in cloud
- Quota exceeded (duplicate storage)
- Sync confusion (which copy is canonical?)

**ENFORCEMENT:**
- Backend uses UPSERT (insert or update based on ID)
- `cloudId` is checked before push (if set, use PATCH; if not, use POST)
- Backend `document_id` primary key prevents duplicate inserts

---

### INVARIANT 6.3: Push Updates Local Sync State Immediately

**INVARIANT:**  
After successful push, the system MUST immediately:
1. Set `syncStatus = 'synced'`
2. Set `cloudId = response.id`
3. Set `lastSyncedAt = response.updated_at`
4. Persist to IndexedDB
5. Dispatch `document-sync-status-changed` event

All steps MUST complete before returning control to user.

**RATIONALE:**
- Sync status must be durable (survive refresh)
- UI must update immediately (user feedback)
- Next push must know cloudId (use PATCH, not POST)

**FAILURE MODE IF VIOLATED:**
- Sync status shows "local" after successful push
- Next push creates duplicate (no cloudId, uses POST again)
- Refresh resets sync status (not persisted)

**ENFORCEMENT:**
- `SelectiveSyncService.pushDocument()` updates IndexedDB in same function
- No early returns before IndexedDB write
- Event dispatch is last step (ensures data persisted first)

---

## Auto-Sync Constraints

### INVARIANT 7.1: Auto-Sync is Disabled by Default

**INVARIANT:**  
The "Auto-save to cloud" toggle MUST default to OFF. User must explicitly enable it.

**RATIONALE:**
- Local-first principle (user controls cloud sync)
- Privacy (user may not want auto-upload)
- Bandwidth (user may be offline or metered)

**FAILURE MODE IF VIOLATED:**
- Privacy violation (documents uploaded without consent)
- Quota exceeded (all documents auto-uploaded)
- User confusion (unexpected cloud storage usage)

**ENFORCEMENT:**
- User settings default: `autoSaveToCloud: false`
- No auto-sync on login (even if previously enabled)
- Toggle state persisted in user preferences (not per-document)

---

### INVARIANT 7.2: Auto-Sync Requires Authentication

**INVARIANT:**  
Auto-sync MUST NOT run for guest users. It requires valid JWT token and active network connection.

**RATIONALE:**
- Guest users have no cloud account (nowhere to sync)
- Authentication required for backend write operations
- Prevents quota abuse (anonymous uploads)

**FAILURE MODE IF VIOLATED:**
- Guest documents uploaded to wrong account (security breach)
- Backend rejects uploads (401 Unauthorized spam)
- User confusion (thinks synced but not)

**ENFORCEMENT:**
- `SelectiveSyncService` checks `isAuthenticated` before sync
- Auto-sync toggle disabled in UI for guest users
- Backend validates JWT on every upload (defense in depth)

---

### INVARIANT 7.3: Auto-Sync Debounces Edits

**INVARIANT:**  
If auto-sync is enabled, the system MUST debounce edits (wait for 5 seconds of inactivity before syncing). It MUST NOT sync on every keystroke.

**RATIONALE:**
- Bandwidth efficiency (avoid 100 uploads per paragraph)
- Backend load (avoid 100 requests per minute)
- User experience (no sync spinner flashing constantly)

**FAILURE MODE IF VIOLATED:**
- Backend overload (too many requests)
- User quota exhausted rapidly
- Poor UX (constant "syncing" indicator)

**ENFORCEMENT:**
- Yjs update handler uses debounce (5000ms)
- Only final state synced (not intermediate keystrokes)
- Sync canceled if user navigates away mid-debounce

---

## Offline → Online Transition Rules

### INVARIANT 8.1: Reconnection Does NOT Auto-Push

**INVARIANT:**  
When network connection is restored, the system MUST NOT automatically push all local-only documents to cloud.

**RATIONALE:**
- User may have intentionally kept documents local
- Bandwidth consideration (large documents on mobile)
- Privacy (user consent required)

**FAILURE MODE IF VIOLATED:**
- Surprise upload of private documents
- Bandwidth exceeded (large uploads on metered connection)
- Quota exceeded (all documents uploaded at once)

**ENFORCEMENT:**
- Network reconnection event does NOT trigger `pushDocument()`
- WebSocket reconnection syncs only already-synced documents
- User must manually push local documents (explicit action)

---

### INVARIANT 8.2: Synced Documents Auto-Reconnect

**INVARIANT:**  
Documents with `syncStatus = 'synced'` MUST automatically reconnect to collaboration server when network is restored.

**RATIONALE:**
- User expects collaboration to resume automatically
- Already-synced documents have cloudId (safe to reconnect)
- No privacy concern (already in cloud)

**FAILURE MODE IF VIOLATED:**
- Collaboration broken (user edits offline, peer edits online, no merge)
- User must manually refresh to resume collaboration
- Data loss (offline edits not sent to server)

**ENFORCEMENT:**
- `y-websocket` provider auto-reconnects on network restore
- `SelectiveSyncService` re-establishes WebSocket for synced docs
- Exponential backoff (1s, 2s, 4s, 8s, max 30s)

---

### INVARIANT 8.3: Offline Edits Queue Locally

**INVARIANT:**  
When offline, all edits MUST be persisted to IndexedDB immediately (via `y-indexeddb` provider). No edits held in memory only.

**RATIONALE:**
- Browser crash loses in-memory edits
- IndexedDB survives crash/refresh
- User expects edits to persist offline

**FAILURE MODE IF VIOLATED:**
- Data loss (browser crash loses edits)
- User frustration (typed paragraph, lost on refresh)
- Trust erosion (app unreliable)

**ENFORCEMENT:**
- `y-indexeddb` provider auto-saves (500ms debounce)
- No manual save button required
- IndexedDB writes confirmed before UI update

---

## Login / Logout Effects

### INVARIANT 9.1: Login Does NOT Mutate Local Documents

**INVARIANT:**  
When user logs in, the system MUST NOT modify, delete, or sync any local documents. Local documents remain local until explicit user action.

**RATIONALE:**
- Local-first principle (local data is canonical)
- User may have multiple accounts (wrong account uploaded)
- Privacy (user may not want documents in cloud)

**FAILURE MODE IF VIOLATED:**
- Documents uploaded to wrong account
- Privacy violation (local documents leaked)
- Data loss (local documents overwritten by backend)

**ENFORCEMENT:**
- Login flow does NOT call `pushDocument()`
- Login flow does NOT call `refreshDocuments()` with backend merge
- User must manually push each document (explicit consent)

---

### INVARIANT 9.2: Login Enables Backend Discovery

**INVARIANT:**  
After login, the system MAY query backend for workspaces and documents. However, backend documents MUST NOT overwrite local documents with same ID.

**RATIONALE:**
- User may have created documents offline under same workspace
- Local CRDT state is canonical (backend may be stale)
- Overwrite causes data loss

**FAILURE MODE IF VIOLATED:**
- Local edits lost (overwritten by stale backend data)
- CRDT state divergence (local vs backend)
- Sync confusion (which version is correct?)

**ENFORCEMENT:**
- Backend documents are merged, not replaced
- If local document has same ID, compare timestamps (keep newer)
- User prompted to resolve conflicts (manual merge)

---

### INVARIANT 9.3: Logout Does NOT Delete Local Data

**INVARIANT:**  
When user logs out, the system MUST NOT delete any local documents from IndexedDB. Local data persists.

**RATIONALE:**
- User may want to continue editing offline
- User may log back in later (data should be there)
- Data loss is unacceptable (logout is not "delete all")

**FAILURE MODE IF VIOLATED:**
- Data loss (all work lost on logout)
- User panic (documents disappeared)
- Trust erosion (users afraid to log out)

**ENFORCEMENT:**
- Logout clears JWT token only (not IndexedDB)
- `GuestWorkspaceService` remains functional after logout
- User can continue editing in guest mode

---

## Forbidden Sync Patterns

### FORBIDDEN 1: Backend Query in Render Loop

**PATTERN:**  
Calling `BackendWorkspaceService` API methods inside React component render or `useEffect` without proper dependency control.

**WHY FORBIDDEN:**
- Infinite loop (render → query → state update → render)
- Backend overload (100 requests per second)
- UI freeze (synchronous API calls block render)

**SAFE ALTERNATIVE:**
- Load data once on mount (empty dependency array)
- Use `WorkspaceContext` (pre-loaded data)
- Use event-driven updates (dispatch events, not queries)

**EXAMPLE (FORBIDDEN):**
```typescript
function Sidebar() {
    const [docs, setDocs] = useState([])
    
    useEffect(() => {
        BackendWorkspaceService.listDocuments(workspaceId).then(setDocs)
    }) // ❌ NO DEPENDENCY ARRAY - RUNS EVERY RENDER
    
    return <div>{docs.map(...)}</div>
}
```

**EXAMPLE (SAFE):**
```typescript
function Sidebar() {
    const { documents } = useWorkspace() // ✅ READS FROM CONTEXT
    return <div>{documents.map(...)}</div>
}
```

---

### FORBIDDEN 2: Merge Backend Response with Local State

**PATTERN:**  
After calling backend API, merging response with `WorkspaceContext.documents` array (e.g., `setDocuments([...local, ...backend])`).

**WHY FORBIDDEN:**
- Creates duplicates (same document appears twice)
- Overwrites local state (backend may be stale)
- Sync status reset (backend doesn't know local sync status)

**SAFE ALTERNATIVE:**
- Use backend response ONLY for explicit pull operations
- Never merge on page load or refresh
- Use events to update specific documents (not bulk replace)

**EXAMPLE (FORBIDDEN):**
```typescript
async function refreshDocuments() {
    const backendDocs = await BackendWorkspaceService.listDocuments(workspaceId)
    const localDocs = await GuestWorkspaceService.listDocuments(workspaceId)
    setDocuments([...localDocs, ...backendDocs]) // ❌ MERGE CREATES DUPLICATES
}
```

**EXAMPLE (SAFE):**
```typescript
async function loadDocuments() {
    const localDocs = await GuestWorkspaceService.listDocuments(workspaceId)
    setDocuments(localDocs) // ✅ SINGLE SOURCE OF TRUTH
}
```

---

### FORBIDDEN 3: Compute Sync Status from CRDT State

**PATTERN:**  
Comparing Yjs state vectors or timestamps to determine if document is synced (e.g., `localStateVector === backendStateVector`).

**WHY FORBIDDEN:**
- Requires backend query (defeats local-first)
- Race condition (state changes during comparison)
- Unreliable (network delay, clock skew)

**SAFE ALTERNATIVE:**
- Read `syncStatus` from IndexedDB (durable, authoritative)
- Update `syncStatus` only during explicit sync operations
- Never recompute or infer sync status

**EXAMPLE (FORBIDDEN):**
```typescript
function computeSyncStatus(docId) {
    const localVector = Y.encodeStateVector(ydoc)
    const backendVector = await fetchStateVector(docId) // ❌ NETWORK QUERY
    return localVector === backendVector ? 'synced' : 'local'
}
```

**EXAMPLE (SAFE):**
```typescript
function getSyncStatus(docId) {
    const doc = WorkspaceContext.documents.find(d => d.id === docId)
    return doc.sync.status // ✅ READ FROM STORED STATE
}
```

---

### FORBIDDEN 4: Auto-Sync on Document Create

**PATTERN:**  
Immediately pushing a newly created document to backend in `createDocument()` function.

**WHY FORBIDDEN:**
- Violates local-first (user didn't consent to upload)
- Privacy violation (document uploaded before user edits)
- Bandwidth waste (empty document uploaded)

**SAFE ALTERNATIVE:**
- Create document locally only
- Set `syncStatus = 'local'`
- User manually pushes when ready

**EXAMPLE (FORBIDDEN):**
```typescript
async function createDocument(title) {
    const doc = await GuestWorkspaceService.createDocument({ title })
    await SelectiveSyncService.pushDocument(doc.id) // ❌ AUTO-PUSH
    return doc
}
```

**EXAMPLE (SAFE):**
```typescript
async function createDocument(title) {
    const doc = await GuestWorkspaceService.createDocument({ title })
    setDocuments(prev => [...prev, doc]) // ✅ LOCAL ONLY
    return doc
}
```

---

### FORBIDDEN 5: Sync Status Override on Load

**PATTERN:**  
Overwriting `syncStatus` field when loading documents from IndexedDB (e.g., defaulting all to 'local').

**WHY FORBIDDEN:**
- Loses durable sync state (shows "local" even if synced)
- User re-uploads already-synced documents
- Sync icons wrong after refresh

**SAFE ALTERNATIVE:**
- Preserve `syncStatus` as stored in IndexedDB
- Only default to 'local' if field is missing (migration case)
- Never recompute or override stored value

**EXAMPLE (FORBIDDEN):**
```typescript
const docs = await GuestWorkspaceService.listDocuments(workspaceId)
return docs.map(doc => ({
    ...doc,
    sync: { status: 'local' } // ❌ OVERWRITE STORED STATE
}))
```

**EXAMPLE (SAFE):**
```typescript
const docs = await GuestWorkspaceService.listDocuments(workspaceId)
return docs.map(doc => ({
    ...doc,
    sync: doc.syncStatus 
        ? { status: doc.syncStatus, cloudId: doc.cloudId }
        : { status: 'local' } // ✅ PRESERVE OR DEFAULT IF MISSING
}))
```

---

## Enforcement and Testing

### Development-Mode Checks

**Required Assertions:**
1. All documents have non-null IDs (checked in `useEffect`)
2. `syncStatus` is one of allowed values (TypeScript + runtime)
3. `cloudId` is UUID or null (regex validation)
4. No duplicate document IDs in `documents` array (Set size check)

**Implementation:**
```typescript
if (process.env.NODE_ENV === 'development') {
    useEffect(() => {
        documents.forEach(doc => {
            if (!doc.id) {
                console.error('[INVARIANT] Document without id', doc)
            }
            if (!['local', 'syncing', 'synced', 'error'].includes(doc.sync.status)) {
                console.error('[INVARIANT] Invalid sync status', doc)
            }
        })
        
        const ids = new Set(documents.map(d => d.id))
        if (ids.size !== documents.length) {
            console.error('[INVARIANT] Duplicate document IDs detected')
        }
    }, [documents])
}
```

### Integration Tests

**Required Test Cases:**
1. Create document → refresh → document still in sidebar
2. Push to cloud → refresh → sync status remains 'synced'
3. Login → local documents remain local (not auto-pushed)
4. Logout → local documents remain in IndexedDB
5. Offline edit → online → edit syncs to collaborators
6. Duplicate push → no duplicate documents in backend

**Test Framework:** Playwright (full browser environment with IndexedDB)

### Audit Process

**Quarterly Review:**
1. Grep codebase for forbidden patterns
2. Review all `refreshDocuments()` call sites (should be zero after sync)
3. Review all `BackendWorkspaceService` call sites (should be explicit user actions only)
4. Review all IndexedDB write paths (ensure sync status persisted)

**Pre-Deployment:**
1. Run all integration tests (must pass 100%)
2. Manual test: Create → Edit → Push → Refresh (5-step flow)
3. Manual test: Guest → Login → Logout → Guest (4-step flow)

---

## Version History

**v1.0** - December 2025 - Initial invariants (based on bug fixes)

---

## References

- `ARCHITECTURE.md` - System architecture
- `CRDT.md` - CRDT implementation details
- Bug reports: Duplicate key violation, sidebar disappearance, sync icon persistence

---

**Violation Reporting:**  
If you discover an invariant violation, file a P0 bug immediately. Invariant violations are critical defects.

**Contact:** sync-team@mdreader.com


# MDReader Architecture

**Status:** Canonical Reference  
**Audience:** Engineers, Security Auditors, Contributors  
**Last Updated:** December 2025

---

## Purpose

This document defines the architecture of MDReader: a local-first collaborative document editor with conflict-free synchronization and optional cloud persistence.

---

## System Invariants

These are non-negotiable laws. Violating any invariant constitutes architectural failure.

**INVARIANT 1: Local-First Operation**  
The system must remain fully operational without network connectivity. All document creation, editing, and storage operations must succeed locally before any network synchronization occurs.

**INVARIANT 2: CRDT as Canonical State**  
Document content is represented as a Conflict-Free Replicated Data Type. The CRDT state is the single source of truth. HTML, Markdown, and plain text are derived artifacts and are never authoritative.

**INVARIANT 3: Eventual Consistency**  
When multiple replicas receive the same set of operations, they must converge to identical state regardless of operation order or timing. No manual conflict resolution is required for content.

**INVARIANT 4: Append-Only History**  
Document history is immutable. Revert operations create new versions; they never modify or delete existing history. Audit trails are write-only.

**INVARIANT 5: Zero-Trust Security**  
The backend trusts no client assertion. All operations are authenticated and authorized server-side. Permissions are evaluated on every request.

**INVARIANT 6: Bounded Storage Growth**  
The system must prevent unbounded database growth through automatic compaction and garbage collection. Hard limits are enforced at 100MB per document.

**INVARIANT 7: Deterministic Collaboration**  
Identical CRDT states must produce identical rendered output. No race conditions exist in merge logic.

---

## Architecture Overview

MDReader is a three-tier system:

```
┌─────────────────────────────────────────┐
│  Client                                 │
│  - CRDT engine (local state)            │
│  - IndexedDB (persistent local storage) │
│  - Editor (render CRDT to UI)           │
└──────────────┬──────────────────────────┘
               │
               │ (WebSocket + REST)
               │
┌──────────────▼──────────────────────────┐
│  Backend                                │
│  - Metadata API (workspaces, folders)   │
│  - CRDT state storage (PostgreSQL)      │
│  - Collaboration server (WebSocket)     │
└──────────────┬──────────────────────────┘
               │
               │
┌──────────────▼──────────────────────────┐
│  Storage                                │
│  - PostgreSQL (metadata + CRDT binary)  │
│  - Redis (sessions, presence, cache)    │
│  - S3 (attachments)                     │
└─────────────────────────────────────────┘
```

---

## Canonical Data Flow

### Document Content Representation

**Layer 1: CRDT State (Canonical)**

Document content exists as a Yjs CRDT document. This is a binary state vector containing:
- Document structure (paragraphs, headings, lists, tables)
- Text content with formatting marks
- Node-level metadata (unique IDs, timestamps)

**Layer 2: Snapshot + Updates (Persistent)**

The CRDT state is persisted in two forms:

1. **Snapshot:** A compressed checkpoint of full CRDT state at time T
2. **Updates:** Incremental operations applied since snapshot

Current state reconstruction:
```
Current_State = Snapshot(T) + Updates[T+1...T+N]
```

**Layer 3: Derived Artifacts (Non-Canonical)**

For preview, export, and search, the system generates:
- HTML (for in-browser rendering)
- Markdown (for export)
- Plain text (for search indexing)

These are computed from CRDT state and are never used as input.

### Write Path

```
User types → Editor generates operation → CRDT applies operation
                                              ↓
                                      IndexedDB persists
                                              ↓
                                    (if online + authenticated)
                                              ↓
                                      WebSocket sends update
                                              ↓
                                      Server persists to DB
                                              ↓
                                    Server broadcasts to peers
```

### Read Path

```
User opens document → Load from IndexedDB
                           ↓
                    (if online + authenticated)
                           ↓
                    Connect WebSocket
                           ↓
                    Sync with server
                           ↓
                    Receive peer updates
```

---

## State Transitions

### Authentication States

**GUEST**
- No user account
- Documents stored in local IndexedDB only
- No cloud synchronization
- No collaboration

**AUTHENTICATED**
- Valid JWT access token
- Documents can be pushed to cloud
- Collaboration enabled
- Cross-device sync available

Transition: `GUEST → AUTHENTICATED` occurs on login. Local documents are NOT automatically uploaded; user must explicitly push each document.

### Network States

**OFFLINE**
- No network connectivity
- All operations succeed locally
- Changes queued for later sync
- IndexedDB remains writable

**ONLINE (Solo)**
- Network available
- WebSocket disconnected or no collaborators
- Background sync to server
- No real-time updates

**ONLINE (Collaborative)**
- Network available
- WebSocket connected
- One or more peers editing same document
- Real-time bidirectional sync active

Transition logic:
```
OFFLINE → ONLINE: Detect network, attempt WebSocket connection
ONLINE → OFFLINE: Connection failure, fall back to local-only
ONLINE (Solo) → ONLINE (Collaborative): Another user joins document
ONLINE (Collaborative) → ONLINE (Solo): Last peer disconnects
```

### Document Sync States

**LOCAL_ONLY**
- Document exists in IndexedDB
- No server record
- No `cloudId` assigned
- Editable, full functionality

**SYNCING**
- Upload or download in progress
- Transient state (typically < 2 seconds)
- Document remains editable

**SYNCED**
- Local and server states match
- `cloudId` assigned
- Both replicas current

**ERROR**
- Sync operation failed
- Document remains local
- Retry scheduled with exponential backoff

No "CONFLICT" state exists for content (CRDT guarantees merge). Metadata conflicts (title, folder) are resolved via optimistic locking and user prompt.

---

## Local-First Guarantees

### What the Local Client Guarantees

1. **Durability:** All edits persisted to IndexedDB survive browser close, crash, or refresh.

2. **Availability:** Document editing never blocks on network or server availability.

3. **Low Latency:** Operations apply immediately to local state (< 16ms, one frame).

4. **Offline Undo/Redo:** Full undo history maintained in-memory for current session.

### What the Local Client Does NOT Guarantee

1. **Cross-Device Sync:** Local-only documents are not accessible from other devices until explicitly pushed to cloud.

2. **Backup:** Local IndexedDB is not backed up. Device loss or browser data clear results in data loss for unpushed documents.

3. **Version History:** Snapshots exist only server-side. Local client has current state only.

4. **Collaboration:** Requires active WebSocket connection to server. Offline edits are not visible to peers until reconnect.

---

## Cloud Responsibilities vs Local Responsibilities

### Local Client Responsibilities

- CRDT operation generation and application
- IndexedDB persistence
- Editor rendering
- Offline queue management
- User authentication token storage

### Cloud Backend Responsibilities

- CRDT state persistence and compaction
- WebSocket message routing for collaboration
- Metadata storage (workspaces, folders, permissions)
- Version snapshot generation
- Authentication and authorization
- Search indexing

### Shared Responsibilities

**Conflict-Free Merge:**
- CRDT algorithm runs identically on client and server
- Both must produce same result for same operations

**Permission Enforcement:**
- Server enforces (authoritative)
- Client caches for UI (optimistic, non-authoritative)

---

## Collaboration Lifecycle

### Connection Establishment

```
1. Client: Open document (local operation, always succeeds)
2. Client: Connect WebSocket to server (if authenticated and online)
3. Server: Verify JWT token
4. Server: Check user has view permission for document
5. Server: If unauthorized → reject connection (403)
6. Server: Load latest CRDT state from database
7. Server: Send state vector to client
8. Client: Compute missing updates
9. Client: Send missing updates to server
10. Server: Apply updates, broadcast to other clients
11. Collaboration active
```

### Update Propagation

```
User A types → CRDT operation generated
                      ↓
              IndexedDB save (local)
                      ↓
              WebSocket send (if connected)
                      ↓
              Server receives
                      ↓
              Server validates permission
                      ↓
              Server persists to database
                      ↓
              Server broadcasts to User B, C, D (if connected)
                      ↓
              Peers apply operation
                      ↓
              All replicas converge to same state
```

### Disconnection Handling

```
Connection lost → Client detects within 1 second
                       ↓
               Queue operations locally
                       ↓
               Retry connection (exponential backoff: 1s, 2s, 4s, 8s, max 30s)
                       ↓
               (on reconnect)
                       ↓
               Send queued operations
                       ↓
               Receive missed operations from server
                       ↓
               CRDT merge (automatic, conflict-free)
                       ↓
               Resume real-time sync
```

---

## Versioning Model

### Version Number: `content_version`

A monotonically increasing integer representing user-facing document versions.

**Increment Triggers:**
- Auto-snapshot (every 50 operations OR 5 minutes, whichever comes first)
- Manual snapshot (user clicks "Create Snapshot")
- AI-generated change (after patch applied)
- Pre-restore backup (before version restore operation)

**Properties:**
- Sequential: 1, 2, 3, 4, ... (no gaps)
- User-visible: Shown in version history UI
- Immutable: Once assigned, never changes

**NOT Used:**
- Optimistic locking (separate `meta_version` field for metadata)
- CRDT versioning (separate internal `snapshot_version`)

### Restore Semantics

Restoring version N to a document at version M creates:

1. Version M+1: Automatic backup of current state (hidden by default)
2. Version M+2: Restored content from version N (this becomes current)

History is append-only. Version N remains in history and can be restored again.

### Snapshot vs Update Storage

**Snapshot:** Full CRDT state at a point in time (compressed binary).

**Update:** Incremental CRDT operation since last snapshot.

Current state is always: `Latest_Snapshot + All_Updates_Since_Snapshot`

**Compaction:** When updates accumulate beyond threshold (500 operations OR 5MB OR 24 hours), the system:
1. Materializes current state (snapshot + updates)
2. Compresses and stores as new snapshot
3. Deletes old updates (they are now redundant)

This prevents unbounded database growth.

---

## Compaction and Garbage Collection

### Compaction Trigger Conditions

Compaction initiates when ANY condition is met:

- 500 incremental updates accumulated since last snapshot
- 5MB of update data accumulated
- 24 hours elapsed since last snapshot

### Compaction Process

```
1. Acquire distributed lock on document (Redis lock, 10-second TTL)
2. Load latest snapshot from database
3. Load all updates since that snapshot
4. Apply updates to reconstruct current CRDT state
5. Compress CRDT state (gzip, level 6)
6. Store as new snapshot (version++)
7. Delete old updates from database
8. Update compaction metadata
9. Release lock
```

**Concurrent Edit Handling:**

During compaction (lock held), incoming edits:
- Are queued server-side
- Are applied after compaction completes
- Client experiences no blocking or errors

**Performance Target:** < 5 seconds for typical document (10,000 words).

### Garbage Collection Policy

**Updates:** Deleted immediately after compaction (redundant with new snapshot).

**Snapshots:** Retained up to 100 most recent per document. Older snapshots marked as archived (soft delete). User can pin snapshots to prevent deletion.

**Audit Logs:** Partitioned by month. Retention: 90 days for operational logs, 7 years for compliance logs.

---

## Failure Modes and System Behavior

### Client-Side Failures

**Browser Crash**
- State: All edits since last IndexedDB persist committed are lost (< 500ms window)
- Recovery: On restart, load from IndexedDB, resume from last checkpoint
- Data Loss: Minimal (< 1 second of edits)

**IndexedDB Quota Exceeded**
- State: Browser storage full, cannot save locally
- Behavior: Block further edits, prompt user to free space or push to cloud
- Recovery: User deletes local documents or upgrades browser quota

**WebSocket Disconnection**
- State: Real-time sync unavailable
- Behavior: Continue editing locally, queue operations
- Recovery: Auto-reconnect with exponential backoff, sync queued operations

### Server-Side Failures

**Database Unavailable**
- State: Cannot persist new edits or load documents from server
- Behavior: Client continues operating locally (local-first)
- Recovery: When database returns, sync queued operations
- Data Loss: None (client has all data)

**WebSocket Server Unavailable**
- State: Collaboration unavailable
- Behavior: Client operates in solo mode (no real-time sync)
- Recovery: Client retries connection, resumes collaboration on success
- Data Loss: None (CRDT merge on reconnect)

**Compaction Failure**
- State: Database continues growing (updates not deleted)
- Behavior: System logs error, retries next cycle
- Recovery: Manual compaction trigger or automatic retry
- Data Loss: None (updates remain until successfully compacted)

### Concurrent Edit Conflicts

**Content Conflict**
- State: Two users edit same text simultaneously
- Behavior: CRDT merge algorithm produces deterministic result
- User Action: None required (automatic)

**Metadata Conflict**
- State: Two users rename document simultaneously
- Behavior: Optimistic locking detects version mismatch
- User Action: Server rejects second write (409 Conflict), user sees merge dialog

### Data Corruption

**Invalid CRDT State**
- State: Database contains malformed Yjs binary
- Behavior: Document fails to load, error logged
- Recovery: Restore from previous snapshot (version N-1)
- Data Loss: Edits since last good snapshot

**Compaction Corruption**
- State: Compaction produces different state than snapshot + updates
- Behavior: Validation check fails, compaction aborted
- Recovery: Retry compaction, alert operations team if persistent
- Data Loss: None (original snapshot + updates remain)

---

## Security Model

### Authentication

**Token Type:** JWT (JSON Web Token)

**Token Lifetime:**
- Access token: 15 minutes
- Refresh token: 30 days (stored server-side in Redis)

**Storage:**
- Access token: Memory only (not persisted)
- Refresh token: localStorage (HttpOnly not feasible for SPA)

**Rotation:** Automatic refresh before access token expiration.

### Authorization

**Permission Evaluation Order:**

1. Is user the document owner? → Grant full access
2. Does user have document-specific permission? → Use that
3. Is user a workspace member? → Use workspace role
4. Is document public? → Grant view-only
5. Default: Deny access

**Workspace Roles:**
- Owner: Full control (delete workspace, manage members, all documents)
- Editor: Create/edit documents, cannot manage members
- Viewer: Read-only access to all documents

**Document Permissions (override workspace role):**
- Admin: Full control over document
- Edit: Read/write content
- Comment: Read + add comments (future)
- View: Read-only

**Enforcement:**
- REST API: Every endpoint checks permission before execution
- WebSocket: Permission checked on connection and on every operation
- Background jobs: Permission checked before export/import

### Data Protection

**Encryption at Rest:**
- PostgreSQL: Transparent Data Encryption enabled
- S3: Server-Side Encryption (SSE-KMS)
- Redis: Not encrypted (ephemeral session data only)

**Encryption in Transit:**
- All connections use TLS 1.3
- WebSocket connections use WSS (WebSocket Secure)

**Tenant Isolation:**
- Row-Level Security enforced in PostgreSQL
- Every query scoped by `workspace_id`
- No cross-tenant data leakage possible

**Audit Trail:**
- All user actions logged (immutable, append-only)
- All AI actions logged separately
- Retention: 90 days operational, 7 years compliance

### Semantic Indexing Security (Cross-Workspace Leakage Prevention)

**GUARANTEE:** Users can NEVER access embeddings, search results, or semantic content from workspaces they do not have permission to access.

**Threat Model:**

Cross-workspace leakage occurs when:
1. Embeddings are indexed without workspace context
2. Search queries omit workspace permission checks
3. Background jobs process documents across workspace boundaries
4. Cached results bypass permission filtering

**Attack Scenarios:**
- User searches for "confidential" → sees snippets from other workspaces
- User queries similar documents → receives recommendations from private workspaces
- Malicious user crafts query to probe for existence of documents in other workspaces

#### Explicit Guarantees

**GUARANTEE 1: Workspace Scoping on Every Query**

All semantic search queries MUST include `workspace_id` in the WHERE clause. No exceptions.

**Enforcement:**
- Database: Row-Level Security (RLS) policy on `document_embeddings` table
- Application: Helper function `searchEmbeddings(workspace_id, query)` enforces scoping
- API: Middleware validates `workspace_id` matches user's workspace membership

**SQL Policy:**
```sql
-- Enable Row-Level Security
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access embeddings from their workspaces
CREATE POLICY workspace_isolation ON document_embeddings
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Insert must match workspace membership
CREATE POLICY workspace_isolation_insert ON document_embeddings
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = current_setting('app.current_user_id')::uuid
        )
    );
```

**Application-Level Enforcement:**
```python
async def search_embeddings(user_id: UUID, workspace_id: UUID, query_vector: list[float]):
    # 1. Verify user has access to workspace (defense in depth)
    if not await workspace_service.has_access(user_id, workspace_id):
        raise PermissionError("User does not have access to workspace")
    
    # 2. Set RLS context (PostgreSQL uses this for policy evaluation)
    await db.execute("SET app.current_user_id = $1", [str(user_id)])
    
    # 3. Query with explicit workspace filter (double defense)
    results = await db.query("""
        SELECT document_id, content_snippet, 
               embedding <=> $1::vector AS distance
        FROM document_embeddings
        WHERE workspace_id = $2  -- MANDATORY workspace scoping
          AND embedding <=> $1::vector < 0.3  -- Similarity threshold
        ORDER BY distance
        LIMIT 10
    """, [query_vector, workspace_id])
    
    return results
```

**GUARANTEE 2: No Cross-Workspace Batch Operations**

Background jobs, rebuild tasks, and batch indexing MUST process documents one workspace at a time.

**Rationale:**
- Prevents accidental mixing of embeddings
- Enables per-workspace rate limiting
- Simplifies permission checks (single workspace context)

**Enforcement:**
```python
async def rebuild_embeddings_job(workspace_id: UUID):
    """
    SAFE: Rebuild embeddings for a SINGLE workspace.
    This function is called once per workspace.
    """
    documents = await db.query(
        "SELECT id, content FROM documents WHERE workspace_id = $1",
        [workspace_id]
    )
    
    for doc in documents:
        embedding = await generate_embedding(doc.content)
        await db.execute("""
            INSERT INTO document_embeddings (document_id, workspace_id, embedding)
            VALUES ($1, $2, $3)
            ON CONFLICT (document_id) DO UPDATE SET embedding = EXCLUDED.embedding
        """, [doc.id, workspace_id, embedding])  # workspace_id explicitly set

# FORBIDDEN: Global rebuild (no workspace scoping)
async def rebuild_all_embeddings():
    """
    UNSAFE: Do NOT implement this function.
    Always scope by workspace_id.
    """
    raise NotImplementedError("Global rebuild is forbidden for security reasons")
```

**GUARANTEE 3: Embedding Storage Includes Workspace ID**

Every row in `document_embeddings` table MUST have a non-null `workspace_id` foreign key.

**Schema:**
```sql
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,  -- OpenAI ada-002 dimension
    content_snippet TEXT NOT NULL,    -- First 500 chars for preview
    indexed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_embeddings_workspace (workspace_id),
    INDEX idx_embeddings_vector USING ivfflat (embedding vector_cosine_ops),
    
    -- Constraints
    UNIQUE (document_id),  -- One embedding per document
    CHECK (workspace_id IS NOT NULL)  -- MANDATORY workspace scoping
);
```

**Enforcement:**
- Database constraint: `workspace_id NOT NULL`
- Foreign key: `REFERENCES workspaces(id)` ensures workspace exists
- Cascade delete: If workspace deleted, embeddings deleted

**GUARANTEE 4: Permission Check Before Search**

API endpoints MUST verify user has workspace access BEFORE executing semantic search.

**API Implementation:**
```python
@router.post("/api/v1/workspaces/{workspace_id}/search")
async def search_workspace(
    workspace_id: UUID,
    query: SearchQuery,
    current_user: User = Depends(get_current_user)
):
    # 1. Permission check (BEFORE search execution)
    membership = await workspace_service.get_membership(current_user.id, workspace_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 2. Generate query embedding
    query_vector = await embedding_service.embed_text(query.text)
    
    # 3. Search with workspace scoping (RLS + explicit filter)
    results = await search_embeddings(current_user.id, workspace_id, query_vector)
    
    # 4. Additional document-level permission filter
    # (RLS handles workspace, this handles document-specific permissions)
    filtered_results = [
        r for r in results
        if await document_service.has_permission(current_user.id, r.document_id, "view")
    ]
    
    return filtered_results
```

#### Failure Modes

**FAILURE MODE 1: Forgotten workspace_id in Query**

**Example (UNSAFE):**
```sql
-- BUG: No workspace_id filter
SELECT document_id, embedding <=> $1::vector AS distance
FROM document_embeddings
ORDER BY distance
LIMIT 10;
```

**Impact:**
- Returns results from ALL workspaces (massive privacy breach)
- User sees content from workspaces they don't have access to
- Compliance violation (GDPR, data access breach)

**Detection:**
- Code review: Reject any query without workspace_id
- Static analysis: Lint rule flags `FROM document_embeddings` without `WHERE workspace_id`
- Monitoring: Alert if query returns > 1000 results (likely missing filter)

**Mitigation:**
- RLS policy prevents this (defense in depth)
- If RLS disabled for admin queries, require explicit `BYPASS_RLS` flag

**FAILURE MODE 2: Cached Results Without Permission Check**

**Example (UNSAFE):**
```python
# BUG: Cache key doesn't include workspace_id
cache_key = f"search:{query_text}"
cached = redis.get(cache_key)
if cached:
    return cached  # May return results from different workspace!
```

**Impact:**
- User A searches "budget" → caches results from Workspace X
- User B searches "budget" → gets User A's cached results (wrong workspace)
- Privacy breach (User B sees Workspace X data)

**Safe Pattern:**
```python
# SAFE: Cache key includes workspace_id
cache_key = f"search:{workspace_id}:{query_text}"
cached = redis.get(cache_key)
if cached:
    # Still verify user has access to workspace (cache poisoning defense)
    if not await has_access(user_id, workspace_id):
        raise PermissionError()
    return cached
```

**FAILURE MODE 3: Background Job Processes All Workspaces**

**Example (UNSAFE):**
```python
# BUG: Rebuilds embeddings globally, no workspace scoping
async def rebuild_all():
    documents = await db.query("SELECT id, content FROM documents")
    for doc in documents:
        embedding = await generate_embedding(doc.content)
        await db.execute(
            "INSERT INTO document_embeddings (document_id, embedding) VALUES ($1, $2)",
            [doc.id, embedding]  # Missing workspace_id!
        )
```

**Impact:**
- Embeddings inserted without workspace_id (violates constraint, query fails)
- If constraint is nullable (worse), embeddings have NULL workspace_id
- Search results leak across workspaces

**Safe Pattern:**
```python
# SAFE: Iterate workspaces, rebuild one at a time
async def rebuild_all():
    workspaces = await db.query("SELECT id FROM workspaces")
    for workspace in workspaces:
        await rebuild_embeddings_job(workspace.id)  # Scoped function
```

#### Hard Rules for Rebuild Jobs

**RULE 1: One Workspace Per Job**

Background jobs MUST accept `workspace_id` parameter. No global rebuild functions.

**RULE 2: Workspace ID in Insert**

Every embedding insert MUST include `workspace_id` (either from document lookup or parameter).

**RULE 3: Rate Limiting Per Workspace**

Rate limits apply per workspace (not globally). Prevents one workspace from blocking others.

**Implementation:**
```python
RATE_LIMIT = 100  # embeddings per minute per workspace

async def rebuild_embeddings_job(workspace_id: UUID):
    # Rate limiter scoped to workspace
    limiter = RateLimiter(f"rebuild:{workspace_id}", RATE_LIMIT)
    
    documents = await db.query(
        "SELECT id, content FROM documents WHERE workspace_id = $1",
        [workspace_id]
    )
    
    for doc in documents:
        await limiter.acquire()  # Wait if rate limit exceeded
        embedding = await generate_embedding(doc.content)
        await store_embedding(doc.id, workspace_id, embedding)
```

**RULE 4: Workspace Deletion Cascades**

When workspace is deleted, all embeddings for that workspace MUST be deleted (cascade).

**Schema:**
```sql
ALTER TABLE document_embeddings
ADD CONSTRAINT fk_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
```

**RULE 5: Audit Rebuild Operations**

Every rebuild job MUST log: workspace_id, user_who_triggered, documents_processed, timestamp.

```python
await audit_log.write({
    "action": "rebuild_embeddings",
    "workspace_id": workspace_id,
    "user_id": current_user.id,
    "documents_processed": len(documents),
    "timestamp": datetime.now()
})
```

#### SQL Examples

**SAFE Queries:**

```sql
-- SAFE: Search within workspace (RLS + explicit filter)
SELECT d.id, d.title, e.content_snippet,
       e.embedding <=> $1::vector AS similarity
FROM document_embeddings e
JOIN documents d ON e.document_id = d.id
WHERE e.workspace_id = $2  -- Explicit workspace filter
  AND e.embedding <=> $1::vector < 0.3
ORDER BY similarity
LIMIT 10;

-- SAFE: Insert embedding with workspace_id
INSERT INTO document_embeddings (document_id, workspace_id, embedding, content_snippet)
SELECT id, workspace_id, $2::vector, substring(content, 1, 500)
FROM documents
WHERE id = $1;

-- SAFE: Count embeddings per workspace (admin query)
SELECT workspace_id, COUNT(*) AS embedding_count
FROM document_embeddings
GROUP BY workspace_id;

-- SAFE: Rebuild embeddings for single workspace
DELETE FROM document_embeddings WHERE workspace_id = $1;
INSERT INTO document_embeddings (document_id, workspace_id, embedding, content_snippet)
SELECT d.id, d.workspace_id, generate_embedding(d.content), substring(d.content, 1, 500)
FROM documents d
WHERE d.workspace_id = $1;
```

**UNSAFE Queries (FORBIDDEN):**

```sql
-- UNSAFE: No workspace filter (RLS will block, but explicit filter is required)
SELECT document_id, embedding <=> $1::vector AS similarity
FROM document_embeddings
ORDER BY similarity LIMIT 10;
-- VIOLATION: Missing workspace_id in WHERE clause

-- UNSAFE: Insert without workspace_id
INSERT INTO document_embeddings (document_id, embedding)
VALUES ($1, $2);
-- VIOLATION: workspace_id is required (constraint will fail)

-- UNSAFE: Cross-workspace query (RLS will block, but attempt is suspicious)
SELECT d.title, e.content_snippet
FROM document_embeddings e
JOIN documents d ON e.document_id = d.id
WHERE d.title LIKE '%confidential%'  -- No workspace filter
ORDER BY e.indexed_at DESC;
-- VIOLATION: Attempts to access all workspaces

-- UNSAFE: Update embedding without workspace check
UPDATE document_embeddings
SET embedding = $2
WHERE document_id = $1;
-- VIOLATION: Should verify workspace_id matches user's workspace

-- UNSAFE: Global delete (admin must explicitly disable RLS)
DELETE FROM document_embeddings;
-- VIOLATION: Deletes across all workspaces (RLS will prevent, but suspicious)
```

#### Monitoring and Alerts

**Metrics to Track:**
- Queries without workspace_id filter (should be 0)
- RLS policy violations (logged and alerted)
- Search result count > 1000 (likely missing filter)
- Embedding inserts without workspace_id (constraint prevents, but alert on attempt)

**Alerts:**
```python
# Alert if search returns results from multiple workspaces
results = await search_embeddings(...)
workspace_ids = set(r.workspace_id for r in results)
if len(workspace_ids) > 1:
    alert("CRITICAL: Cross-workspace leakage detected in search results")

# Alert if RLS policy blocked a query
if "RLS policy violation" in db.last_error:
    alert("WARNING: RLS policy prevented unauthorized access")
```

#### Security Audit Checklist

**Before Deployment:**
1. ✅ RLS policies enabled on `document_embeddings` table
2. ✅ All search queries include `workspace_id` in WHERE clause
3. ✅ All embedding inserts include `workspace_id` foreign key
4. ✅ Background jobs accept `workspace_id` parameter (no global rebuild)
5. ✅ API endpoints check workspace membership before search
6. ✅ Cache keys include `workspace_id` (no cross-workspace cache pollution)
7. ✅ Foreign key cascade delete configured (workspace deletion cleans embeddings)

**Quarterly Review:**
1. Grep codebase for `FROM document_embeddings` without `WHERE workspace_id`
2. Review all background jobs (ensure workspace scoping)
3. Test: Create embedding in Workspace A, attempt to access from Workspace B (should fail)
4. Test: Delete workspace, verify embeddings cascade deleted
5. Audit logs: Check for RLS policy violations (investigate any occurrences)

---

## AI Integration

### Constraints

**AI Never Edits Silently:**
- All AI-generated changes are proposals (patches)
- User must preview and approve before application
- User can reject or modify before accepting

**Patch Protocol:**
- AI generates structured operations (insert, delete, replace)
- Operations reference stable node identifiers (not line numbers)
- Patches include base state vector for concurrency control

**Concurrency Handling:**
- If document changed between patch generation and application, patch is rejected
- User must regenerate patch with current state
- Optionally: AI can rebase patch (if `rebase_allowed: true`)

### Provenance

**Operational Blame:**
- Every CRDT update records author (human user or AI agent)
- Audit log stores: prompt hash, model used, tokens consumed, timestamp
- 100% accurate attribution at update granularity

**Line-Level Blame (Approximate):**
- Computed by diffing snapshots (git-style)
- Accuracy bounded by snapshot frequency (5-minute intervals)
- Shows last editor per line (if multiple editors, shows most recent)

### Safety

**Rate Limiting:**
- 50 AI prompts per hour per user
- Token quota enforced (100K tokens/month per user)

**Cost Control:**
- Token usage tracked per request
- User notified at 80% quota
- Blocked at 100% quota

**Data Redaction:**
- API keys, passwords, emails redacted from prompts before logging
- PII not sent to third-party LLM APIs (enterprise tier with zero retention)

---

## Search and Indexing

### Search Scope

**What is Indexed:**
- Document titles
- Document content (plain text extracted from CRDT)
- Document tags

**What is NOT Indexed:**
- Attachments (images, PDFs)
- Comments (future feature)
- Audit logs

### Index Update Trigger

Indexing occurs:
- On document creation (immediate)
- On document update (debounced: max once per 60 seconds)
- On manual reindex request (admin operation)

### Permission Filtering

Search results are filtered at query time:
- User can only see documents they have view permission for
- Workspace membership checked
- Document-level permissions checked

No pre-filtered indexes exist (too expensive to maintain per-user).

---

## Workspace and Folder Model

### Hierarchy

```
User
 └─ Workspace (owner or member)
     ├─ Folder (optional, hierarchical)
     │   └─ Document
     └─ Document (root-level, no folder)
```

### Workspace Semantics

**Workspace:**
- Owned by one user
- Can have multiple members (via invitation)
- Deletion cascades to all folders and documents
- Cannot be transferred (owner is immutable)

**Folder:**
- Optional grouping mechanism
- Can be nested (parent-child hierarchy)
- No permission model (inherits workspace permissions)
- Soft delete (recoverable for 30 days)

**Document:**
- Must belong to exactly one workspace
- Optionally assigned to one folder
- Can override workspace permissions (document-level permissions)
- Soft delete (recoverable for 30 days)

### Cross-Workspace Linking

Not supported. Documents in Workspace A cannot reference documents in Workspace B. This enforces tenant isolation and simplifies permission model.

---

## Offline Editing Guarantees

### What Works Offline

- Create new documents
- Edit existing documents (any content type)
- Delete documents (soft delete, local-only)
- Undo/redo (current session only)
- Export to Markdown (if document already loaded)

### What Does NOT Work Offline

- Push to cloud (requires network)
- Collaboration (requires WebSocket)
- Version history (requires server)
- Search (requires index, may be stale)
- Import (requires server-side processing)
- AI features (requires server-side LLM)

### Offline-to-Online Transition

When network returns:

1. Client detects connectivity (navigator.onLine + WebSocket probe)
2. Client attempts WebSocket reconnection
3. Client sends all queued CRDT updates
4. Server applies updates (automatic merge, no conflicts)
5. Server sends any missed updates from peers
6. Client applies incoming updates
7. Both replicas converge to same state (eventual consistency)

No user action required. No conflict resolution dialogs for content (CRDT guarantees merge).

---

## Explicit Non-Goals

### What This System Does NOT Do

**Real-Time Presence Beyond Active Editors**

The system tracks who is actively editing a document (via WebSocket connection). It does NOT track:
- Who is viewing a workspace but not editing
- Who is online but idle
- User status (online/offline/away)

**Rich Permissions (ACLs, Groups, Teams)**

The permission model is intentionally simple: Owner/Editor/Viewer at workspace level, Admin/Edit/Comment/View at document level. It does NOT support:
- User groups or teams
- Conditional permissions (e.g., "view if tag=public")
- Delegation (e.g., "Alice can grant Bob permission")

**End-to-End Encryption**

Documents are encrypted at rest (database-level) and in transit (TLS). They are NOT end-to-end encrypted. The server can read document content. This is required for:
- Server-side search indexing
- AI processing
- Version snapshot generation

**Multi-Document Transactions**

The system does NOT support atomic operations across multiple documents. Each document has independent CRDT state. If an operation must modify documents A and B together, the client must issue separate operations and handle partial failure.

**Branching or Forking**

Version history is linear. The system does NOT support:
- Creating branches from version N
- Merging branches back together
- Forking a document into independent copies with shared history

**Arbitrary File Attachments**

Images are supported (uploaded to S3, referenced in document). Arbitrary files (PDFs, ZIPs, videos) are NOT supported. Reason: No content indexing, no preview, unclear permission model.

**Offline Collaboration**

CRDT guarantees eventual consistency when replicas reconnect. It does NOT support:
- Peer-to-peer sync (client-to-client without server)
- Bluetooth or local network sync
- USB drive sync

All collaboration requires server mediation.

**Custom CRDT Algorithms**

The system uses Yjs (state-based CRDT with operation-based sync). It does NOT support:
- Pluggable CRDT implementations
- Switching algorithms mid-document
- Hybrid OT (Operational Transformation) approaches

**Time-Travel Debugging**

Version history allows restoring snapshots. It does NOT support:
- Arbitrary replay of operations
- Fine-grained stepping (operation-by-operation)
- Causal debugging (why did this change happen?)

Audit logs provide who/when, but not full replay capability.

---

## Performance Targets

### Latency

- **Local edit to screen:** < 16ms (one frame at 60fps)
- **IndexedDB persist:** < 100ms (asynchronous, does not block UI)
- **WebSocket round-trip:** < 200ms (p95)
- **Server CRDT persist:** < 100ms (p95, asynchronous)
- **Version snapshot generation:** < 3 seconds (background job)
- **Compaction:** < 5 seconds (locks document briefly)

### Throughput

- **Concurrent editors per document:** 100 users
- **Operations per second per document:** 1,000 ops/sec
- **WebSocket connections per server:** 10,000 connections
- **Documents per workspace:** No hard limit (practical: 10,000)

### Storage

- **Max document size:** 100MB uncompressed CRDT state (hard limit)
- **Max updates between compaction:** 1,000 updates (triggers compaction)
- **Max snapshots per document:** 100 retained (older archived)
- **IndexedDB quota:** Browser-dependent (typically 50-100GB)

### Scalability

- **Horizontal scaling:** WebSocket servers scale horizontally (Redis pub/sub for cross-instance sync)
- **Database scaling:** PostgreSQL read replicas for search, primary for writes
- **Storage scaling:** S3 for attachments (unlimited)

---

## Monitoring and Observability

### Health Checks

**Client:**
- IndexedDB write success rate (target: 99.9%)
- WebSocket connection success rate (target: 95%)
- CRDT operation application errors (target: < 0.1%)

**Server:**
- WebSocket connections active (alert if > 80% capacity)
- Database connection pool usage (alert if > 80%)
- Compaction job success rate (target: 99%)
- API endpoint latency (p95 < 200ms)

### Logging

**Client:**
- Errors: Logged to console + sent to backend (sampled)
- Warnings: Logged to console only
- Info: Disabled in production

**Server:**
- All HTTP requests: Method, path, status, latency, user_id
- All WebSocket events: Connect, disconnect, message count
- All CRDT operations: Document_id, operation_count, author_id
- All failures: Full stack trace, context

**Audit Trail:**
- User actions: Create, update, delete, share, export
- AI actions: Prompt, patch, apply, reject, cost
- Permission changes: Grant, revoke, role change

Retention: 90 days operational logs, 7 years audit logs.

---

## Disaster Recovery

### Backup Strategy

**PostgreSQL:**
- Continuous replication to standby (RPO: < 1 second)
- Daily snapshot to S3 (retention: 30 days)
- Point-in-time recovery available (within 7 days)

**Redis:**
- AOF (Append-Only File) enabled (fsync every second)
- RDB snapshot every 6 hours
- Not critical (ephemeral session data, can rebuild)

**S3:**
- Versioning enabled (retain 30 versions)
- Cross-region replication (async)
- Lifecycle policy: Archive to Glacier after 90 days

### Recovery Time Objective (RTO)

- **Database failure:** < 1 hour (failover to standby)
- **WebSocket server failure:** < 5 minutes (automatic failover)
- **S3 failure:** < 1 hour (switch to replica region)
- **Complete region failure:** < 4 hours (failover to DR region)

### Recovery Point Objective (RPO)

- **Database:** < 1 second (continuous replication)
- **Redis:** < 1 second (AOF)
- **S3:** < 5 minutes (cross-region replication delay)

---

## Deployment Model

**Single-Region Primary:**
- All writes to one region (strong consistency)
- Read replicas in other regions (eventual consistency)
- WebSocket servers in multiple regions (route to nearest)

**Multi-Region Failover:**
- Standby region with database replica
- Failover is manual (requires DNS update)
- Typical downtime: 30-60 minutes

**Blue-Green Deployment:**
- Two identical environments (blue=current, green=new)
- Deploy to green, test, switch traffic
- Rollback: switch traffic back to blue

**Database Migrations:**
- Zero-downtime migrations (additive changes only)
- Two-phase deploy: 1) Add column (compatible), 2) Use column (requires rollout)
- Rollback plan required for every migration

---

## Compliance and Privacy

**GDPR:**
- Right to access: User can export all data (ZIP file)
- Right to erasure: User can delete account (anonymize audit logs)
- Right to rectification: User can update personal data
- Right to portability: Export in Markdown (open format)

**Data Residency:**
- User data stored in region specified at signup
- No cross-region data transfer (except for backup)

**Data Retention:**
- Active documents: Indefinite
- Soft-deleted documents: 30 days, then permanent delete
- Audit logs: 7 years (compliance requirement)
- User accounts: Deleted immediately on request (after 30-day grace period)

**Third-Party Data Processing:**
- AI providers (OpenAI, Anthropic): Zero data retention (enterprise tier)
- Monitoring (Datadog, Sentry): Sampled logs, 30-day retention
- Email (SendGrid): Transactional only, no marketing

---

## Version History

**v1.0** - December 2025 - Initial architecture (current system)  
**v2.0** - December 2025 - CRDT migration architecture (this document)

---

## Document Maintenance

**Review Cadence:** Quarterly or after major architectural changes

**Change Process:**
1. Propose change (RFC document)
2. Review by engineering leads
3. Approve or reject
4. Update ARCHITECTURE.md
5. Communicate to team

**Contact:** architecture-team@mdreader.com

---

*This document describes the architecture as it should be built, not necessarily as it currently exists. See deployment documentation for migration status.*


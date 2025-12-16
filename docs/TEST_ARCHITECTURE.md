# MDReader Test Architecture

**Role:** Principal Test Architect & Distributed Systems Auditor  
**Status:** Canonical Test Specification  
**Version:** 1.0 (Aligned with Architecture v2.1)  
**Last Updated:** December 2025

---

## Purpose

This document defines the complete testing strategy for MDReader. Its purpose is NOT to validate happy paths, but to **PROVE ARCHITECTURAL INVARIANTS** and **DETECT VIOLATIONS** under adversarial conditions.

**Core Principle:** If a test assumption is not explicitly guaranteed by the architecture documents, the test MUST FAIL or be REMOVED.

---

## Testing Philosophy

### We Are Not QA

We are **architectural law enforcement**. Our tests:

- Prove invariants hold under chaos
- Break assumptions before users do
- Detect silent corruption before it spreads
- Prevent regression of fixed bugs
- Ensure the system cannot lie to the user

### Adversarial Assumptions

We assume:
- **Network:** Fails mid-operation, reorders packets, duplicates messages
- **Race Conditions:** Multiple tabs, multiple users, human + AI concurrent edits
- **Partial State:** IndexedDB corruption, incomplete writes, browser crashes
- **Malicious Actors:** Permission bypass attempts, cross-workspace probes
- **Time:** Clock skew, delayed operations, expired tokens

### Success Criteria

This test suite is successful ONLY IF:

✅ A regression like "editor shows content but sidebar is empty" is **impossible**  
✅ Silent data loss is **detectable** (tests fail loudly)  
✅ CRDT divergence is **caught** before production  
✅ AI misuse is **blocked** (no silent mutations)  
✅ Sync lies are **exposed** (status reflects reality)  

---

## Reference Architecture (Authoritative)

**All tests MUST align with:**
- `ARCHITECTURE.md` - System architecture
- `CRDT.md` - CRDT implementation
- `AI_PATCH_PROTOCOL.md` - AI editing protocol
- `SYNC_INVARIANTS.md` - Sync invariants

**If a behavior is not defined in these documents, it is NOT TESTED (or test must fail).**

---

## Test Strategy Overview

### Testing Layers (All Required)

| Layer | Purpose | Test Types | Failure Detection |
|-------|---------|------------|-------------------|
| **1. State & Invariants** | Prove architectural laws | Property tests, assertions | Invariant violation |
| **2. Local-First** | Prove offline operation | E2E, multi-tab, crash recovery | Backend dependency |
| **3. Sync & Transitions** | Prove state transitions | State machine tests, chaos | Incorrect sync status |
| **4. CRDT Convergence** | Prove eventual consistency | Chaos tests, fuzz tests | Divergence |
| **5. Version History** | Prove history integrity | Snapshot tests, restore tests | History corruption |
| **6. AI Patch Protocol** | Prove AI safety | Schema validation, rejection tests | Silent mutation |
| **7. Permissions** | Prove security | Adversarial tests, bypass attempts | Cross-workspace leakage |
| **8. Import/Export** | Prove transformation integrity | Round-trip tests, fidelity tests | Data loss |
| **9. Performance & Limits** | Prove graceful degradation | Load tests, limit tests | Silent truncation |
| **10. Observability** | Prove failure visibility | Error injection, UI state checks | Silent failures |

### Test Distribution

```
Unit Tests (Fast, Deterministic):          40%
Integration Tests (DB, IndexedDB):         30%
E2E Tests (Playwright, Full Browser):      20%
Chaos Tests (Network, Concurrency):        10%
```

### Coverage Targets

- **Line Coverage:** 80% minimum (enforced)
- **Branch Coverage:** 70% minimum (enforced)
- **Invariant Coverage:** 100% (every invariant must have at least one test)
- **Failure Mode Coverage:** 100% (every documented failure mode must be tested)

---

## Test Matrix

### Feature × Risk × Test Type

| Feature | Critical Risk | Test Type | Test ID |
|---------|--------------|-----------|---------|
| **Local Index** | Sidebar disappears after refresh | E2E-001 | Create → Refresh → Assert present |
| **Local Index** | Duplicate documents in sidebar | E2E-002 | Push → Refresh → Assert no duplicates |
| **CRDT State** | Content divergence | CHAOS-001 | Multi-tab edit → Assert convergence |
| **CRDT State** | Offline edits lost | E2E-003 | Edit offline → Close → Reopen → Assert content |
| **Sync Status** | Icon shows "synced" but not pushed | E2E-004 | Push fail → Assert icon = "error" |
| **Sync Status** | Icon shows "local" after push | E2E-005 | Push success → Refresh → Assert icon = "synced" |
| **AI Patch** | AI mutates without approval | AI-001 | Generate patch → Assert no CRDT change |
| **AI Patch** | Invalid patch accepted | AI-002 | Send malformed JSON → Assert rejected |
| **Permissions** | Cross-workspace document access | SEC-001 | User A reads Workspace B → Assert 403 |
| **Permissions** | Embedding leakage | SEC-002 | Search in Workspace A → Assert no Workspace B results |
| **Version History** | Restore corrupts state | VER-001 | Restore v10 → Assert content matches snapshot |
| **Version History** | content_version skips | VER-002 | Create snapshots → Assert monotonic sequence |
| **Compaction** | State vector mismatch | CRDT-001 | Compact → Reconstruct → Assert identical state |
| **Offline → Online** | Auto-push without consent | E2E-006 | Reconnect → Assert no backend POST |
| **Login** | Local documents uploaded | E2E-007 | Guest docs → Login → Assert docs remain local |
| **Logout** | IndexedDB cleared | E2E-008 | Logout → Assert IndexedDB still has documents |

---

## Layer 1: State & Invariant Tests

### Purpose

Prove that architectural invariants hold at all times. These are **property tests** that assert fundamental truths about the system.

### Invariants to Test

#### INVARIANT-001: Local Index Completeness

**Property:** If a document exists in IndexedDB, it MUST exist in `WorkspaceContext.documents`.

**Test:**
```typescript
test('INVARIANT-001: Local index completeness', async () => {
    // Arrange: Create document via GuestWorkspaceService (writes to IndexedDB)
    const docId = await guestWorkspaceService.createDocument({
        workspaceId,
        title: 'Test Doc',
        type: 'markdown'
    })
    
    // Act: Load workspace context (reads from IndexedDB)
    const { documents } = await loadWorkspaceContext(workspaceId)
    
    // Assert: Document in IndexedDB MUST be in local index
    const docInIndex = documents.find(d => d.id === docId)
    expect(docInIndex).toBeDefined()
    expect(docInIndex.title).toBe('Test Doc')
})
```

**Failure Mode:** If violated, documents exist in storage but are invisible in UI (ghost documents).

---

#### INVARIANT-002: Document ID Immutability

**Property:** A document's `id` NEVER changes after creation, even after sync.

**Test:**
```typescript
test('INVARIANT-002: Document ID immutability', async () => {
    // Arrange: Create document
    const doc = await createDocument('Test')
    const originalId = doc.id
    
    // Act: Push to cloud (may assign cloudId)
    await selectiveSyncService.pushDocument(doc.id)
    
    // Assert: Local ID unchanged
    const updatedDoc = await guestWorkspaceService.getDocument(originalId)
    expect(updatedDoc.id).toBe(originalId)
    
    // Assert: cloudId is separate field
    expect(updatedDoc.cloudId).toBeDefined()
    expect(updatedDoc.cloudId).not.toBe(originalId)
})
```

**Failure Mode:** If violated, routing breaks (URLs invalid), IndexedDB orphaned.

---

#### INVARIANT-003: CRDT is Canonical

**Property:** Editor content MUST match CRDT state. HTML is derived, never canonical.

**Test:**
```typescript
test('INVARIANT-003: CRDT is canonical', async () => {
    // Arrange: Create document with CRDT content
    const ydoc = new Y.Doc()
    const yText = ydoc.getText('prosemirror')
    yText.insert(0, 'Hello World')
    
    // Persist CRDT to IndexedDB
    await persistYjsState(docId, Y.encodeStateAsUpdate(ydoc))
    
    // Act: Load editor (should read from CRDT, not HTML)
    const editor = await loadEditor(docId)
    
    // Assert: Editor content matches CRDT
    expect(editor.getText()).toBe('Hello World')
    
    // Assert: No backend HTML load
    expect(mockBackendAPI.loadHTML).not.toHaveBeenCalled()
})
```

**Failure Mode:** If violated, content divergence, offline edits lost.

---

#### INVARIANT-004: Sync Status Durability

**Property:** `syncStatus` MUST persist across browser refresh.

**Test:**
```typescript
test('INVARIANT-004: Sync status durability', async () => {
    // Arrange: Create and push document
    const doc = await createDocument('Test')
    await pushToCloud(doc.id)
    
    // Verify synced status
    let loadedDoc = await guestWorkspaceService.getDocument(doc.id)
    expect(loadedDoc.syncStatus).toBe('synced')
    
    // Act: Simulate browser refresh (reload from IndexedDB)
    await reloadWorkspaceContext()
    
    // Assert: Sync status still 'synced'
    loadedDoc = await guestWorkspaceService.getDocument(doc.id)
    expect(loadedDoc.syncStatus).toBe('synced')
    
    // Assert: Icon in sidebar shows cloud (not local disk)
    const sidebarIcon = getSyncIcon(doc.id)
    expect(sidebarIcon).toBe('cloud')
})
```

**Failure Mode:** If violated, icons reset to "local" after refresh, user re-uploads.

---

#### INVARIANT-005: content_version Monotonicity

**Property:** `content_version` MUST be strictly increasing (no gaps, no decrements).

**Test:**
```typescript
test('INVARIANT-005: content_version monotonicity', async () => {
    // Arrange: Create document (version 0)
    const doc = await createDocument('Test')
    expect(doc.contentVersion).toBe(0)
    
    // Act: Create snapshots
    await createSnapshot(doc.id) // Manual snapshot
    let updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(1)
    
    await createSnapshot(doc.id)
    updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(2)
    
    // Assert: Versions form sequence [0, 1, 2] (no gaps)
    const versions = await listVersions(doc.id)
    const versionNumbers = versions.map(v => v.contentVersion).sort()
    
    for (let i = 0; i < versionNumbers.length; i++) {
        expect(versionNumbers[i]).toBe(i)
    }
})
```

**Failure Mode:** If violated, version history is inconsistent, restore may fail.

---

#### INVARIANT-006: Forbidden State Detection

**Property:** System MUST reject documents with NULL `id`.

**Test:**
```typescript
test('INVARIANT-006: Reject documents without ID', async () => {
    // Arrange: Attempt to create document without ID
    const invalidDoc = {
        title: 'Test',
        workspaceId,
        // id is missing (FORBIDDEN)
    }
    
    // Act & Assert: Creation must fail or assign ID
    const result = await guestWorkspaceService.createDocument(invalidDoc)
    
    // Assert: ID was assigned (never null)
    expect(result.id).toBeDefined()
    expect(result.id).not.toBeNull()
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
})

test('INVARIANT-006: Detect documents without ID in index', async () => {
    // Arrange: Load workspace context
    const { documents } = await loadWorkspaceContext(workspaceId)
    
    // Assert: Every document has ID (development mode assertion)
    documents.forEach(doc => {
        expect(doc.id).toBeDefined()
        expect(doc.id).not.toBeNull()
    })
})
```

**Failure Mode:** If violated, routing fails, sidebar crashes, sync impossible.

---

### Property Tests (Generative)

**Property:** For all valid document operations, invariants hold.

```typescript
import { fc } from 'fast-check'

test('PROPERTY: Document operations preserve invariants', () => {
    fc.assert(
        fc.property(
            fc.record({
                title: fc.string({ minLength: 1, maxLength: 100 }),
                content: fc.string({ maxLength: 1000 }),
                type: fc.constantFrom('markdown', 'richtext', 'canvas')
            }),
            async (docData) => {
                // Act: Create document with random valid data
                const doc = await createDocument(docData.title, docData.content)
                
                // Assert: Invariants hold
                expect(doc.id).toBeDefined() // INVARIANT-006
                
                const inIndex = await isInLocalIndex(doc.id)
                expect(inIndex).toBe(true) // INVARIANT-001
                
                const ydoc = await loadYjsState(doc.id)
                const editorContent = ydoc.getText('prosemirror').toString()
                expect(editorContent).toBe(docData.content) // INVARIANT-003
            }
        ),
        { numRuns: 100 } // 100 random test cases
    )
})
```

---

## Layer 2: Local-First Behavior Tests

### Purpose

Prove the system operates fully offline without backend dependency.

### TEST-LF-001: Create → Edit → Refresh → Reopen (Offline)

**Scenario:** User creates document, edits, closes browser, reopens (all offline).

```typescript
test('LF-001: Offline document lifecycle', async ({ page, context }) => {
    // Arrange: Go offline
    await context.setOffline(true)
    
    // Act 1: Create document
    await page.goto('http://localhost:3000')
    await page.click('[data-testid="new-document"]')
    await page.fill('[data-testid="document-title"]', 'Offline Doc')
    
    // Assert: Document in sidebar (without backend call)
    await expect(page.locator('text=Offline Doc')).toBeVisible()
    
    // Act 2: Edit content
    await page.click('[data-testid="editor"]')
    await page.keyboard.type('This is offline content')
    
    // Wait for IndexedDB persist (500ms debounce)
    await page.waitForTimeout(600)
    
    // Act 3: Close and reopen browser
    await context.close()
    const newContext = await browser.newContext()
    await newContext.setOffline(true)
    const newPage = await newContext.newPage()
    await newPage.goto('http://localhost:3000')
    
    // Assert: Document still in sidebar
    await expect(newPage.locator('text=Offline Doc')).toBeVisible()
    
    // Assert: Content preserved
    await newPage.click('text=Offline Doc')
    const editorContent = await newPage.locator('[data-testid="editor"]').textContent()
    expect(editorContent).toContain('This is offline content')
    
    // Assert: No backend calls made
    expect(mockBackendAPI.getAllRequests()).toHaveLength(0)
})
```

**Failure Mode:** Backend dependency, data loss on offline operation.

---

### TEST-LF-002: Browser Crash → State Restored

**Scenario:** Browser crashes mid-edit, state restores from IndexedDB.

```typescript
test('LF-002: Crash recovery', async ({ page, context }) => {
    // Arrange: Create document and edit
    const doc = await createDocument('Crash Test')
    await openEditor(page, doc.id)
    await page.keyboard.type('Content before crash')
    await page.waitForTimeout(600) // Wait for IndexedDB write
    
    // Act: Simulate crash (hard close, no cleanup)
    await context.close() // Does NOT run unload handlers
    
    // Reopen immediately (no time for sync)
    const newContext = await browser.newContext()
    const newPage = await newContext.newPage()
    await newPage.goto('http://localhost:3000')
    
    // Assert: Document in sidebar
    await expect(newPage.locator(`text=${doc.title}`)).toBeVisible()
    
    // Assert: Content restored from IndexedDB
    await newPage.click(`text=${doc.title}`)
    const content = await newPage.locator('[data-testid="editor"]').textContent()
    expect(content).toBe('Content before crash')
})
```

**Failure Mode:** Data loss on crash (< 500ms window acceptable per architecture).

---

### TEST-LF-003: IndexedDB Corruption Simulation

**Scenario:** Partial IndexedDB data (simulate corruption).

```typescript
test('LF-003: Graceful degradation on IndexedDB corruption', async () => {
    // Arrange: Create document
    const doc = await createDocument('Test')
    
    // Act: Corrupt IndexedDB (delete document meta, keep CRDT state)
    const db = await openIndexedDB('MDReaderGuest')
    await db.delete('documents', doc.id) // Meta deleted
    // CRDT state remains in 'yjs' table
    
    // Load workspace context
    const { documents } = await loadWorkspaceContext(workspaceId)
    
    // Assert: Document NOT in sidebar (meta missing)
    expect(documents.find(d => d.id === doc.id)).toBeUndefined()
    
    // But: CRDT state still accessible (orphaned but recoverable)
    const yjsState = await db.get('yjs', doc.id)
    expect(yjsState).toBeDefined()
    
    // User-visible behavior: Document not shown, but data not lost
    // Recovery: Re-sync from backend will restore meta
})
```

**Failure Mode:** Silent corruption, user unaware of data loss.

---

### TEST-LF-004: Multiple Tabs Editing Same Document Offline

**Scenario:** User opens same document in two tabs, edits both offline.

```typescript
test('LF-004: Multi-tab offline editing', async ({ browser }) => {
    // Arrange: Create document
    const doc = await createDocument('Multi-Tab Test')
    
    // Open two tabs
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    await context1.setOffline(true)
    await context2.setOffline(true)
    
    // Both tabs open same document
    await page1.goto(`http://localhost:3000/editor/${doc.id}`)
    await page2.goto(`http://localhost:3000/editor/${doc.id}`)
    
    // Act: Edit in both tabs
    await page1.locator('[data-testid="editor"]').fill('Edit from Tab 1')
    await page2.locator('[data-testid="editor"]').fill('Edit from Tab 2')
    
    await page1.waitForTimeout(600)
    await page2.waitForTimeout(600)
    
    // Assert: Both tabs see merged CRDT state (eventual consistency)
    // Yjs cross-tab sync via BroadcastChannel
    const content1 = await page1.locator('[data-testid="editor"]').textContent()
    const content2 = await page2.locator('[data-testid="editor"]').textContent()
    
    // Both tabs converge to same state
    expect(content1).toBe(content2)
    
    // State includes both edits (CRDT merge)
    expect(content1).toContain('Tab 1')
    expect(content1).toContain('Tab 2')
})
```

**Failure Mode:** Last-write-wins (data loss), tabs diverge.

---

## Layer 3: Sync & Transition Tests

### Purpose

Prove state transitions are correct and sync status reflects reality.

### TEST-SYNC-001: Offline → Online (No Auto-Push)

**Property:** Reconnection MUST NOT auto-push local documents.

```typescript
test('SYNC-001: Reconnect does not auto-push', async ({ page, context }) => {
    // Arrange: Create document offline
    await context.setOffline(true)
    const doc = await createDocument('Local Doc')
    
    // Act: Go online
    await context.setOffline(false)
    await page.waitForTimeout(2000) // Wait for reconnection
    
    // Assert: No POST /documents (no auto-push)
    const postRequests = mockBackendAPI.getRequests('POST', '/api/v1/documents')
    expect(postRequests).toHaveLength(0)
    
    // Assert: Document still shows "local" icon
    const icon = await getSyncIcon(page, doc.id)
    expect(icon).toBe('local-disk')
})
```

**Failure Mode:** Privacy violation (documents uploaded without consent).

---

### TEST-SYNC-002: Manual Push Updates Sync Status

**Property:** After successful push, `syncStatus` MUST be 'synced' and persist.

```typescript
test('SYNC-002: Push updates sync status durably', async ({ page }) => {
    // Arrange: Create document
    const doc = await createDocument('Test')
    
    // Act: Push to cloud
    await page.click(`[data-testid="push-${doc.id}"]`)
    await page.waitForResponse(resp => resp.url().includes('/documents') && resp.status() === 201)
    
    // Assert: Icon immediately shows "cloud"
    await expect(page.locator(`[data-testid="sync-icon-${doc.id}"]`)).toHaveAttribute('data-status', 'synced')
    
    // Act: Refresh page
    await page.reload()
    
    // Assert: Icon still shows "cloud" (durable)
    await expect(page.locator(`[data-testid="sync-icon-${doc.id}"]`)).toHaveAttribute('data-status', 'synced')
    
    // Assert: IndexedDB has syncStatus = 'synced'
    const docMeta = await guestWorkspaceService.getDocument(doc.id)
    expect(docMeta.syncStatus).toBe('synced')
})
```

**Failure Mode:** Icon resets to "local" after refresh (SYNC_INVARIANTS violation).

---

### TEST-SYNC-003: Failed Push Shows Error Status

**Property:** If push fails, `syncStatus` MUST be 'error' (not 'synced').

```typescript
test('SYNC-003: Failed push shows error', async ({ page }) => {
    // Arrange: Create document
    const doc = await createDocument('Test')
    
    // Mock backend failure
    mockBackendAPI.mockResponse('POST', '/api/v1/documents', { status: 500 })
    
    // Act: Attempt push
    await page.click(`[data-testid="push-${doc.id}"]`)
    await page.waitForTimeout(1000)
    
    // Assert: Icon shows "error" (not "cloud")
    const icon = await getSyncIcon(page, doc.id)
    expect(icon).toBe('error')
    
    // Assert: Toast notification shown
    await expect(page.locator('text=Push failed')).toBeVisible()
    
    // Assert: IndexedDB has syncStatus = 'error'
    const docMeta = await guestWorkspaceService.getDocument(doc.id)
    expect(docMeta.syncStatus).toBe('error')
    
    // Assert: Document remains editable (not corrupted)
    await openEditor(page, doc.id)
    await page.keyboard.type('Still editable')
    expect(await getEditorContent(page)).toContain('Still editable')
})
```

**Failure Mode:** False success indication, user thinks synced but not.

---

### TEST-SYNC-004: Guest → Logged-In (Documents Remain Local)

**Property:** Login MUST NOT auto-push guest documents.

```typescript
test('SYNC-004: Login does not upload local documents', async ({ page }) => {
    // Arrange: Create documents as guest
    const doc1 = await createDocument('Guest Doc 1')
    const doc2 = await createDocument('Guest Doc 2')
    
    // Act: Login
    await page.click('[data-testid="login"]')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('[type="submit"]')
    await page.waitForURL('/dashboard')
    
    // Assert: No POST /documents (no auto-upload)
    const postRequests = mockBackendAPI.getRequests('POST', '/api/v1/documents')
    expect(postRequests).toHaveLength(0)
    
    // Assert: Documents still in sidebar with "local" icon
    await expect(page.locator(`text=${doc1.title}`)).toBeVisible()
    await expect(page.locator(`text=${doc2.title}`)).toBeVisible()
    
    const icon1 = await getSyncIcon(page, doc1.id)
    const icon2 = await getSyncIcon(page, doc2.id)
    expect(icon1).toBe('local-disk')
    expect(icon2).toBe('local-disk')
})
```

**Failure Mode:** Privacy violation, quota exceeded, wrong account upload.

---

### TEST-SYNC-005: Logout Does Not Delete Local Data

**Property:** Logout MUST preserve IndexedDB documents.

```typescript
test('SYNC-005: Logout preserves local documents', async ({ page }) => {
    // Arrange: Create documents while logged in
    await login(page)
    const doc = await createDocument('Test Doc')
    
    // Act: Logout
    await page.click('[data-testid="logout"]')
    await page.waitForURL('/login')
    
    // Assert: IndexedDB still has document
    const docMeta = await guestWorkspaceService.getDocument(doc.id)
    expect(docMeta).toBeDefined()
    expect(docMeta.title).toBe('Test Doc')
    
    // Assert: Can still edit as guest
    await page.goto(`/editor/${doc.id}`)
    await page.keyboard.type('Guest edit after logout')
    expect(await getEditorContent(page)).toContain('Guest edit after logout')
})
```

**Failure Mode:** Data loss on logout (user panic, trust erosion).

---

## Layer 4: CRDT Convergence & Chaos Tests

### Purpose

Prove CRDT guarantees hold under adversarial network conditions.

### TEST-CRDT-001: Multi-Tab Concurrent Edits Converge

**Property:** Two tabs editing same document MUST converge to identical state.

```typescript
test('CRDT-001: Multi-tab convergence', async ({ browser }) => {
    // Arrange: Open same document in two tabs
    const doc = await createDocument('Convergence Test')
    
    const page1 = await browser.newPage()
    const page2 = await browser.newPage()
    
    await page1.goto(`/editor/${doc.id}`)
    await page2.goto(`/editor/${doc.id}`)
    
    // Act: Concurrent edits
    await Promise.all([
        page1.locator('[data-testid="editor"]').pressSequentially('Alice writes this'),
        page2.locator('[data-testid="editor"]').pressSequentially('Bob writes this')
    ])
    
    // Wait for CRDT sync (cross-tab via BroadcastChannel)
    await page1.waitForTimeout(1000)
    await page2.waitForTimeout(1000)
    
    // Assert: Both tabs converge to same state
    const content1 = await getEditorContent(page1)
    const content2 = await getEditorContent(page2)
    
    expect(content1).toBe(content2) // CRDT convergence
    
    // Both edits present (no data loss)
    expect(content1).toContain('Alice')
    expect(content1).toContain('Bob')
})
```

**Failure Mode:** Divergence, last-write-wins, data loss.

---

### TEST-CRDT-002: Out-of-Order Update Delivery

**Property:** Updates applied out-of-order MUST converge.

```typescript
test('CRDT-002: Out-of-order updates converge', async () => {
    // Arrange: Create 3 CRDT updates
    const ydoc1 = new Y.Doc()
    const ydoc2 = new Y.Doc()
    
    const text1 = ydoc1.getText('content')
    const text2 = ydoc2.getText('content')
    
    // Generate updates
    text1.insert(0, 'A')
    const updateA = captureUpdate(ydoc1)
    
    text1.insert(1, 'B')
    const updateB = captureUpdate(ydoc1)
    
    text1.insert(2, 'C')
    const updateC = captureUpdate(ydoc1)
    
    // Act: Apply updates OUT OF ORDER (C, A, B)
    Y.applyUpdate(ydoc2, updateC)
    Y.applyUpdate(ydoc2, updateA)
    Y.applyUpdate(ydoc2, updateB)
    
    // Assert: Final state is correct (ABC)
    expect(text2.toString()).toBe('ABC')
    
    // Assert: State vectors match (convergence)
    const sv1 = Y.encodeStateVector(ydoc1)
    const sv2 = Y.encodeStateVector(ydoc2)
    expect(sv1).toEqual(sv2)
})
```

**Failure Mode:** Corruption, incorrect merge, non-deterministic state.

---

### TEST-CRDT-003: Duplicate Update Delivery (Idempotence)

**Property:** Applying same update twice MUST be idempotent (no effect on second apply).

```typescript
test('CRDT-003: Duplicate updates are idempotent', async () => {
    // Arrange: Create document with update
    const ydoc1 = new Y.Doc()
    const ydoc2 = new Y.Doc()
    
    ydoc1.getText('content').insert(0, 'Hello')
    const update = Y.encodeStateAsUpdate(ydoc1)
    
    // Act: Apply update twice
    Y.applyUpdate(ydoc2, update)
    const stateAfterFirst = Y.encodeStateAsUpdate(ydoc2)
    
    Y.applyUpdate(ydoc2, update) // Duplicate
    const stateAfterSecond = Y.encodeStateAsUpdate(ydoc2)
    
    // Assert: State unchanged (idempotent)
    expect(stateAfterFirst).toEqual(stateAfterSecond)
})
```

**Failure Mode:** Duplicate text, corruption, divergence.

---

### TEST-CRDT-004: Network Partition → Reconnect → Merge

**Property:** Edits during partition MUST merge on reconnect.

```typescript
test('CRDT-004: Partition recovery', async ({ browser, context }) => {
    // Arrange: Two users collaborating
    const doc = await createDocument('Collab Doc')
    await pushToCloud(doc.id)
    
    const page1 = await browser.newPage() // User A
    const page2 = await browser.newPage() // User B
    
    await page1.goto(`/editor/${doc.id}`)
    await page2.goto(`/editor/${doc.id}`)
    
    // Act 1: Partition (disconnect User A)
    await page1.context().setOffline(true)
    
    // Act 2: User A edits offline
    await page1.locator('[data-testid="editor"]').fill('Alice offline edit')
    await page1.waitForTimeout(600)
    
    // Act 3: User B edits online
    await page2.locator('[data-testid="editor"]').fill('Bob online edit')
    await page2.waitForTimeout(600)
    
    // Act 4: Reconnect User A
    await page1.context().setOffline(false)
    await page1.waitForTimeout(2000) // Wait for sync
    
    // Assert: Both users see merged state
    const contentA = await getEditorContent(page1)
    const contentB = await getEditorContent(page2)
    
    expect(contentA).toBe(contentB) // Convergence
    expect(contentA).toContain('Alice')
    expect(contentA).toContain('Bob')
})
```

**Failure Mode:** Offline edits lost, conflict dialog, last-write-wins.

---

### TEST-CHAOS-001: Reconnection Storm

**Property:** 100 clients reconnecting simultaneously MUST NOT corrupt state.

```typescript
test('CHAOS-001: Reconnection storm', async () => {
    // Arrange: Create document
    const doc = await createDocument('Storm Test')
    await pushToCloud(doc.id)
    
    // Simulate 100 clients connecting
    const clients = []
    for (let i = 0; i < 100; i++) {
        const ydoc = new Y.Doc()
        const provider = new WebsocketProvider('ws://localhost:1234', doc.id, ydoc)
        clients.push({ ydoc, provider })
    }
    
    // Wait for all to connect
    await Promise.all(clients.map(c => c.provider.whenSynced))
    
    // Act: All clients edit simultaneously
    await Promise.all(clients.map((c, i) => {
        c.ydoc.getText('content').insert(0, `Client ${i} `)
    }))
    
    // Wait for convergence
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Assert: All clients have same state
    const states = clients.map(c => c.ydoc.getText('content').toString())
    const firstState = states[0]
    
    states.forEach(state => {
        expect(state).toBe(firstState) // All converged
    })
    
    // Assert: No client crashed
    expect(clients.every(c => c.provider.wsconnected)).toBe(true)
})
```

**Failure Mode:** Server overload, state divergence, crashes.

---

## Layer 5: Version History & Restore Tests

### Purpose

Prove version history is immutable and restore is correct.

### TEST-VER-001: Snapshot content_version Increments

**Property:** Each snapshot MUST increment `content_version` by 1.

```typescript
test('VER-001: Snapshot increments content_version', async () => {
    // Arrange: Create document
    const doc = await createDocument('Version Test')
    expect(doc.contentVersion).toBe(0)
    
    // Act: Create snapshots
    await createSnapshot(doc.id)
    let updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(1)
    
    await createSnapshot(doc.id)
    updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(2)
    
    await createSnapshot(doc.id)
    updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(3)
    
    // Assert: Versions are [0, 1, 2, 3] (no gaps)
    const versions = await listVersions(doc.id)
    expect(versions.map(v => v.contentVersion)).toEqual([0, 1, 2, 3])
})
```

**Failure Mode:** Version gaps, non-monotonic sequence, history corruption.

---

### TEST-VER-002: Restore Creates Exactly One New Version

**Property:** Restoring version N to current version M MUST create version M+1 only.

```typescript
test('VER-002: Restore creates single new version', async () => {
    // Arrange: Create document with versions
    const doc = await createDocument('Restore Test')
    
    await editDocument(doc.id, 'Version 1 content')
    await createSnapshot(doc.id) // v1
    
    await editDocument(doc.id, 'Version 2 content')
    await createSnapshot(doc.id) // v2
    
    await editDocument(doc.id, 'Version 3 content')
    await createSnapshot(doc.id) // v3
    
    // Current version: 3
    expect((await getDocument(doc.id)).contentVersion).toBe(3)
    
    // Act: Restore version 1
    await restoreVersion(doc.id, 1)
    
    // Assert: New version 4 created (current)
    const updated = await getDocument(doc.id)
    expect(updated.contentVersion).toBe(4)
    
    // Assert: Content matches version 1
    const content = await getDocumentContent(doc.id)
    expect(content).toBe('Version 1 content')
    
    // Assert: Version 1 still exists in history (not deleted)
    const v1 = await getVersion(doc.id, 1)
    expect(v1).toBeDefined()
    
    // Assert: Total versions: [0, 1, 2, 3, 4]
    const versions = await listVersions(doc.id)
    expect(versions).toHaveLength(5)
})
```

**Failure Mode:** Multiple versions created, version deleted, history corrupted.

---

### TEST-VER-003: Restore Content Matches Snapshot Exactly

**Property:** Restored content MUST be bitwise identical to snapshot.

```typescript
test('VER-003: Restore exact content match', async () => {
    // Arrange: Create document with specific content
    const doc = await createDocument('Exact Match Test')
    const originalContent = 'This is the original content with special chars: 你好, émojis 🎉'
    
    await editDocument(doc.id, originalContent)
    await createSnapshot(doc.id) // v1
    
    // Edit further
    await editDocument(doc.id, 'Different content')
    await createSnapshot(doc.id) // v2
    
    // Act: Restore v1
    await restoreVersion(doc.id, 1)
    
    // Assert: Content exactly matches original (byte-for-byte)
    const restoredContent = await getDocumentContent(doc.id)
    expect(restoredContent).toBe(originalContent)
    
    // Assert: CRDT state matches snapshot
    const currentState = await getCRDTState(doc.id)
    const snapshotState = await getSnapshotState(doc.id, 1)
    expect(currentState).toEqual(snapshotState)
})
```

**Failure Mode:** Partial restore, encoding corruption, data loss.

---

### TEST-VER-004: History is Immutable

**Property:** Existing versions MUST NOT be modified or deleted during restore.

```typescript
test('VER-004: History immutability', async () => {
    // Arrange: Create versions
    const doc = await createDocument('Immutable Test')
    
    await editDocument(doc.id, 'v1')
    await createSnapshot(doc.id)
    
    await editDocument(doc.id, 'v2')
    await createSnapshot(doc.id)
    
    // Get version hashes before restore
    const v1Before = await getVersion(doc.id, 1)
    const v2Before = await getVersion(doc.id, 2)
    
    // Act: Restore v1
    await restoreVersion(doc.id, 1)
    
    // Assert: v1 and v2 unchanged (immutable)
    const v1After = await getVersion(doc.id, 1)
    const v2After = await getVersion(doc.id, 2)
    
    expect(v1After.snapshotHash).toBe(v1Before.snapshotHash)
    expect(v2After.snapshotHash).toBe(v2Before.snapshotHash)
    expect(v1After.createdAt).toEqual(v1Before.createdAt)
    expect(v2After.createdAt).toEqual(v2Before.createdAt)
})
```

**Failure Mode:** History rewritten, versions deleted, timestamps changed.

---

## Layer 6: AI Patch Protocol Tests

### Purpose

Prove AI cannot mutate documents without explicit user approval.

### TEST-AI-001: Patch Generation Does Not Mutate Document

**Property:** Generating a patch MUST NOT change CRDT state.

```typescript
test('AI-001: Patch generation is read-only', async () => {
    // Arrange: Create document
    const doc = await createDocument('AI Test')
    await editDocument(doc.id, 'Original content')
    
    const stateBefore = await getCRDTState(doc.id)
    
    // Act: Generate AI patch
    const patch = await aiService.generatePatch(doc.id, 'Add a conclusion')
    
    // Assert: CRDT state unchanged
    const stateAfter = await getCRDTState(doc.id)
    expect(stateAfter).toEqual(stateBefore)
    
    // Assert: Patch is proposal only (not applied)
    expect(patch.status).toBeUndefined() // Not yet applied
    expect(patch.operations).toBeDefined() // Operations proposed
})
```

**Failure Mode:** Silent mutation, user unaware of AI edits.

---

### TEST-AI-002: Invalid Schema Rejects Patch

**Property:** Patch with missing required fields MUST be rejected.

```typescript
test('AI-002: Schema validation rejects invalid patch', async () => {
    // Arrange: Create document
    const doc = await createDocument('Schema Test')
    
    // Act: Send invalid patch (missing patch_id)
    const invalidPatch = {
        document_id: doc.id,
        // patch_id is missing (REQUIRED)
        operations: [{ type: 'insert', anchor: { type: 'node_id', node_id: 'abc' }, content: 'text' }]
    }
    
    // Assert: Rejection
    await expect(aiService.applyPatch(invalidPatch)).rejects.toThrow('Schema validation failed')
    
    // Assert: Document unchanged
    const content = await getDocumentContent(doc.id)
    expect(content).not.toContain('text')
})
```

**Failure Mode:** Malformed patch corrupts document.

---

### TEST-AI-003: Base State Vector Mismatch Rejects Patch

**Property:** If document changed since patch generation, patch MUST be rejected (if rebase not allowed).

```typescript
test('AI-003: Conflict detection via state vector', async () => {
    // Arrange: Create document and generate patch
    const doc = await createDocument('Conflict Test')
    await editDocument(doc.id, 'Initial content')
    
    const baseStateVector = await getCurrentStateVector(doc.id)
    
    const patch = {
        patch_id: uuid(),
        document_id: doc.id,
        base_state_vector: baseStateVector,
        rebase_allowed: false,
        operations: [{ type: 'insert', anchor: { type: 'node_id', node_id: 'xyz', offset: 0 }, content: 'AI addition' }]
    }
    
    // Act: User edits document (state vector advances)
    await editDocument(doc.id, 'User made changes')
    
    // Attempt to apply patch
    const result = await aiService.applyPatch(patch)
    
    // Assert: Rejected due to divergence
    expect(result.status).toBe('rejected_conflict')
    
    // Assert: Document shows user's edit, not AI's
    const content = await getDocumentContent(doc.id)
    expect(content).toContain('User made changes')
    expect(content).not.toContain('AI addition')
})
```

**Failure Mode:** Patch applied despite divergence, corrupts user edits.

---

### TEST-AI-004: AI Attribution in Audit Log

**Property:** Applied AI patch MUST be logged with full provenance.

```typescript
test('AI-004: AI patch audit trail', async () => {
    // Arrange: Create document and patch
    const doc = await createDocument('Audit Test')
    const patch = await aiService.generatePatch(doc.id, 'Add summary')
    
    // Act: User approves and applies patch
    await aiService.applyPatch(patch, { approved_by: currentUser.id })
    
    // Assert: Audit log entry created
    const auditLog = await db.query('SELECT * FROM ai_audit_log WHERE patch_id = $1', [patch.patch_id])
    expect(auditLog).toHaveLength(1)
    
    const entry = auditLog[0]
    expect(entry.user_id).toBe(currentUser.id)
    expect(entry.model_name).toBe('claude-sonnet-4.5')
    expect(entry.status).toBe('applied')
    expect(entry.patch_json).toBeDefined()
    
    // Assert: CRDT update records AI as author
    const crdtUpdate = await db.query('SELECT * FROM document_crdt_updates WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1', [doc.id])
    expect(crdtUpdate[0].author_type).toBe('ai_agent')
})
```

**Failure Mode:** No audit trail, cannot track AI changes.

---

## Layer 7: Permission & Security Tests

### Purpose

Prove permissions are enforced server-side and cross-workspace leakage is impossible.

### TEST-SEC-001: Unauthorized Document Access Blocked

**Property:** User MUST NOT access documents from workspaces they're not a member of.

```typescript
test('SEC-001: Cross-workspace access denied', async () => {
    // Arrange: Create workspace and document (User A)
    const workspaceA = await createWorkspace('Workspace A', userA.id)
    const docA = await createDocument('Private Doc', workspaceA.id)
    
    // Act: User B attempts to access (not a member)
    const result = await apiClient.getDocument(docA.id, { auth: userB.token })
    
    // Assert: 403 Forbidden
    expect(result.status).toBe(403)
    expect(result.body.error).toContain('Access denied')
    
    // Assert: No content leaked in error message
    expect(result.body).not.toContain('Private Doc')
})
```

**Failure Mode:** Information disclosure, privacy breach.

---

### TEST-SEC-002: Embedding Search Cross-Workspace Leakage

**Property:** Semantic search MUST NOT return results from other workspaces.

```typescript
test('SEC-002: Embedding search workspace isolation', async () => {
    // Arrange: Create documents in two workspaces
    const workspaceA = await createWorkspace('Workspace A', userA.id)
    const workspaceB = await createWorkspace('Workspace B', userB.id)
    
    await createDocument('Confidential Budget', workspaceA.id, 'Workspace A confidential budget data')
    await createDocument('Budget Planning', workspaceB.id, 'Workspace B budget planning')
    
    // Wait for indexing
    await rebuildEmbeddings(workspaceA.id)
    await rebuildEmbeddings(workspaceB.id)
    
    // Act: User A searches in Workspace A
    const results = await apiClient.searchWorkspace(workspaceA.id, 'budget', { auth: userA.token })
    
    // Assert: Only Workspace A results returned
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('Confidential Budget')
    
    // Assert: Workspace B content NOT in results
    expect(results.find(r => r.title.includes('Planning'))).toBeUndefined()
})
```

**Failure Mode:** Cross-workspace leakage, compliance violation.

---

### TEST-SEC-003: Row-Level Security Enforced

**Property:** PostgreSQL RLS MUST prevent cross-workspace queries.

```typescript
test('SEC-003: RLS prevents cross-workspace access', async () => {
    // Arrange: Set PostgreSQL RLS context (User A)
    await db.execute('SET app.current_user_id = $1', [userA.id])
    
    // User A is member of Workspace A only
    const workspaceA = await createWorkspace('Workspace A', userA.id)
    const workspaceB = await createWorkspace('Workspace B', userB.id)
    
    await createDocument('Doc A', workspaceA.id)
    await createDocument('Doc B', workspaceB.id)
    
    // Act: Query without explicit workspace filter (RLS should enforce)
    const results = await db.query('SELECT * FROM documents') // No WHERE clause
    
    // Assert: Only Workspace A documents returned (RLS enforced)
    expect(results).toHaveLength(1)
    expect(results[0].workspace_id).toBe(workspaceA.id)
    
    // Assert: Workspace B document NOT returned
    expect(results.find(r => r.workspace_id === workspaceB.id)).toBeUndefined()
})
```

**Failure Mode:** RLS bypass, unauthorized data access.

---

## Layer 8: Import/Export Tests

### Purpose

Prove import/export preserves CRDT state and metadata.

### TEST-IMPORT-001: Markdown Round-Trip

**Property:** Export → Import MUST preserve content.

```typescript
test('IMPORT-001: Markdown round-trip', async () => {
    // Arrange: Create document with formatted content
    const doc = await createDocument('Export Test')
    const originalContent = `
# Heading 1
**Bold text**
*Italic text*
[Link](https://example.com)
    `
    await editDocument(doc.id, originalContent)
    
    // Act: Export to Markdown
    const markdown = await exportService.exportMarkdown(doc.id)
    
    // Import as new document
    const importedDoc = await importService.importMarkdown(markdown, workspaceId)
    
    // Assert: Content matches
    const importedContent = await getDocumentContent(importedDoc.id)
    expect(importedContent.trim()).toBe(originalContent.trim())
    
    // Assert: CRDT state valid
    const ydoc = await loadYjsState(importedDoc.id)
    expect(ydoc.getText('prosemirror').toString()).toBeTruthy()
})
```

**Failure Mode:** Data loss, formatting corruption.

---

## Layer 9: Performance & Limit Tests

### Purpose

Prove system degrades gracefully under load.

### TEST-PERF-001: Large Document Limit Enforced

**Property:** Documents exceeding 100MB MUST be rejected.

```typescript
test('PERF-001: Document size limit enforced', async () => {
    // Arrange: Create large content (> 100MB)
    const largeContent = 'A'.repeat(101 * 1024 * 1024) // 101 MB
    
    // Act: Attempt to save
    const result = await editDocument(docId, largeContent)
    
    // Assert: Rejected
    expect(result.error).toContain('Document too large')
    expect(result.maxSize).toBe(100 * 1024 * 1024)
    
    // Assert: User warned in UI
    await expect(page.locator('text=Document size limit exceeded')).toBeVisible()
})
```

**Failure Mode:** Database bloat, performance degradation.

---

## Layer 10: Observability & Failure Visibility Tests

### Purpose

Prove every failure is observable to the user.

### TEST-OBS-001: Network Failure Shows Error

**Property:** Network failure MUST show user-visible error (not silent failure).

```typescript
test('OBS-001: Network failure is visible', async ({ page, context }) => {
    // Arrange: Create document
    const doc = await createDocument('Visibility Test')
    
    // Act: Attempt push with network down
    await context.setOffline(true)
    await page.click(`[data-testid="push-${doc.id}"]`)
    
    // Assert: Error toast shown
    await expect(page.locator('text=Network error')).toBeVisible({ timeout: 2000 })
    
    // Assert: Sync icon shows error
    const icon = await getSyncIcon(page, doc.id)
    expect(icon).toBe('error')
    
    // Assert: Retry button available
    await expect(page.locator(`[data-testid="retry-${doc.id}"]`)).toBeVisible()
})
```

**Failure Mode:** Silent failure, user thinks synced but not.

---

## Test Implementation: Code Examples

### Playwright E2E Test Structure

```typescript
// tests/e2e/sync-invariants.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Sync Invariants', () => {
    test.beforeEach(async ({ page }) => {
        // Clear IndexedDB before each test
        await page.goto('/')
        await page.evaluate(() => {
            indexedDB.deleteDatabase('MDReaderGuest')
            indexedDB.deleteDatabase('MDReaderCache')
        })
    })
    
    test('INVARIANT-004: Sync status persists', async ({ page }) => {
        // Test implementation from Layer 1
    })
    
    test('LF-001: Offline lifecycle', async ({ page, context }) => {
        // Test implementation from Layer 2
    })
})
```

### CRDT Property Test (fast-check)

```typescript
// tests/unit/crdt-properties.test.ts

import { fc } from 'fast-check'
import * as Y from 'yjs'

describe('CRDT Properties', () => {
    test('Commutativity: Order of operations does not matter', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
                (operations) => {
                    const ydoc1 = new Y.Doc()
                    const ydoc2 = new Y.Doc()
                    
                    // Apply operations in original order
                    operations.forEach(op => ydoc1.getText('content').insert(0, op))
                    
                    // Apply operations in shuffled order
                    const shuffled = [...operations].sort(() => Math.random() - 0.5)
                    shuffled.forEach(op => ydoc2.getText('content').insert(0, op))
                    
                    // Assert: Both converge (same state vector)
                    const sv1 = Y.encodeStateVector(ydoc1)
                    const sv2 = Y.encodeStateVector(ydoc2)
                    expect(sv1).toEqual(sv2)
                }
            ),
            { numRuns: 100 }
        )
    })
})
```

### Chaos Test Harness

```typescript
// tests/chaos/network-chaos.ts

import { ChaosMonkey } from './chaos-monkey'

describe('Network Chaos Tests', () => {
    let chaos: ChaosMonkey
    
    beforeEach(() => {
        chaos = new ChaosMonkey({
            packetLoss: 0.1, // 10% packet loss
            latency: { min: 50, max: 500 }, // 50-500ms latency
            reorder: 0.05, // 5% packet reorder
            duplicate: 0.03 // 3% duplicate packets
        })
    })
    
    test('CHAOS-001: Reconnection storm', async () => {
        chaos.enableForWebSocket('ws://localhost:1234')
        
        // Test implementation from Layer 4
        // ChaosMonkey intercepts WebSocket traffic and injects failures
    })
})
```

---

## Negative Test Cases (Must Fail)

### TEST-NEG-001: Backend Query in Render Loop

**Expected:** Test MUST FAIL (infinite loop, backend overload).

```typescript
test('NEG-001: Backend query in render causes failure', async ({ page }) => {
    // Arrange: Mock backend to track request count
    let requestCount = 0
    await page.route('**/api/v1/documents', route => {
        requestCount++
        route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    
    // Act: Render component that queries backend in useEffect without deps
    await page.goto('/dashboard')
    
    // Wait for requests to accumulate
    await page.waitForTimeout(5000)
    
    // Assert: Excessive requests (indicates infinite loop)
    expect(requestCount).toBeGreaterThan(100) // EXPECTED TO FAIL if bug exists
    
    // This test SHOULD fail in code review (forbidden pattern)
})
```

### TEST-NEG-002: Merge Backend with Local State

**Expected:** Test MUST FAIL (duplicate documents in sidebar).

```typescript
test('NEG-002: Merging backend response creates duplicates', async ({ page }) => {
    // Arrange: Create local document
    const localDoc = await createDocument('Local Doc')
    
    // Mock backend to return same document
    await mockBackend.mockResponse('GET', '/api/v1/documents', {
        body: [{ id: localDoc.id, title: 'Local Doc', workspace_id: workspaceId }]
    })
    
    // Act: Call refreshDocuments (FORBIDDEN PATTERN)
    await page.evaluate(() => {
        // Simulates forbidden merge:
        // setDocuments([...local, ...backend])
    })
    
    // Assert: Duplicate in sidebar
    const sidebarItems = await page.locator('[data-testid^="doc-"]').count()
    expect(sidebarItems).toBeGreaterThan(1) // EXPECTED TO FAIL (duplicate)
})
```

---

## Coverage Gaps (Explicitly Listed)

### Gaps in Current Architecture

1. **WebSocket Reconnection Edge Cases**
   - **Gap:** Architecture does not specify behavior when WebSocket reconnects during compaction.
   - **Risk:** Queued operations may be lost or duplicated.
   - **Test:** CANNOT write test (undefined behavior).
   - **Action:** Architecture team must define reconnection-during-compaction semantics.

2. **Multi-Device Conflict Resolution**
   - **Gap:** If user edits on Device A (offline) and Device B (offline) with same workspace, what happens on sync?
   - **Risk:** CRDT merges content, but metadata (title, folder) uses last-write-wins (conflict).
   - **Test:** Partial (can test CRDT merge, cannot test metadata resolution).
   - **Action:** Define metadata conflict resolution policy.

3. **Compaction Failure Recovery**
   - **Gap:** If compaction fails mid-process, how is state recovered?
   - **Risk:** Orphaned updates, snapshot corruption.
   - **Test:** CANNOT fully test (requires database transaction rollback simulation).
   - **Action:** Architecture team must define rollback strategy.

4. **AI Patch Rebase Algorithm**
   - **Gap:** Rebase algorithm is not fully specified (how are anchors adjusted?).
   - **Risk:** Rebased patch may apply incorrectly.
   - **Test:** CANNOT test (algorithm undefined).
   - **Action:** AI team must provide rebase algorithm specification.

5. **Rate Limiting Enforcement**
   - **Gap:** Rate limits specified (50 AI prompts/hour), but enforcement mechanism undefined.
   - **Risk:** User bypasses rate limit via API.
   - **Test:** Partial (can test happy path, cannot test bypass attempts).
   - **Action:** Backend team must implement rate limiter with key strategy.

---

## Test Execution Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:coverage
      # Fail if coverage < 80%
      - run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: mdreader_test
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
  
  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:chaos
```

### Local Development

```bash
# Run fast unit tests (< 1 min)
npm run test:unit

# Run integration tests (< 5 min)
npm run test:integration

# Run E2E tests (< 10 min)
npm run test:e2e

# Run chaos tests (< 15 min)
npm run test:chaos

# Run all tests (< 30 min)
npm run test:all

# Run specific invariant test
npm run test -- --grep "INVARIANT-001"
```

---

## Success Metrics

### Test Suite Health

- **All tests pass:** 100% (non-negotiable)
- **Flaky test rate:** < 1% (tests must be deterministic)
- **Test execution time:** < 30 minutes (entire suite)
- **Coverage:** > 80% line, > 70% branch

### Regression Prevention

- **Bug recurrence rate:** 0% (every fixed bug gets a test)
- **Invariant violation detection:** 100% (every invariant has test)
- **Silent failure detection:** 100% (observability tests pass)

### Test Maintenance

- **Test update cadence:** Every architecture change triggers test review
- **Broken test resolution:** < 24 hours (tests block deploy)
- **Test documentation:** 100% (every test has purpose comment)

---

## Appendix: Test Naming Convention

### Format

```
TEST-{LAYER}-{NUMBER}: {Invariant or Property}
```

**Examples:**
- `TEST-INVARIANT-001: Local index completeness`
- `TEST-LF-001: Offline document lifecycle`
- `TEST-SYNC-001: Reconnect does not auto-push`
- `TEST-CRDT-001: Multi-tab convergence`
- `TEST-AI-001: Patch generation is read-only`
- `TEST-SEC-001: Cross-workspace access denied`

### Test File Organization

```
tests/
├── unit/
│   ├── invariants/
│   │   ├── local-index.test.ts
│   │   ├── sync-status.test.ts
│   │   └── crdt-canonical.test.ts
│   ├── crdt/
│   │   ├── convergence.test.ts
│   │   └── properties.test.ts
│   └── services/
│       ├── guest-workspace.test.ts
│       └── selective-sync.test.ts
├── integration/
│   ├── sync/
│   │   ├── push-pull.test.ts
│   │   └── state-transitions.test.ts
│   ├── version-history/
│   │   ├── snapshots.test.ts
│   │   └── restore.test.ts
│   └── ai/
│       ├── patch-protocol.test.ts
│       └── audit-trail.test.ts
├── e2e/
│   ├── local-first.spec.ts
│   ├── sync-invariants.spec.ts
│   ├── collaboration.spec.ts
│   └── permissions.spec.ts
└── chaos/
    ├── network-chaos.ts
    ├── reconnection-storm.ts
    └── concurrent-edits.ts
```

---

## Review and Approval

**Test Architecture Owner:** Principal Test Architect  
**Reviewers Required:**
- Backend Architecture Lead
- Frontend Architecture Lead
- Security Team Lead
- Product Team (UX implications)

**Review Frequency:** Quarterly or after major architecture changes

**Contact:** test-architecture@mdreader.com

---

**Document Version:** 1.0  
**Last Reviewed:** December 2025  
**Next Review:** March 2026

---

## Final Directive

This test suite enforces **architectural law**. Every test must:

1. **Map to an architectural guarantee** (documented in ARCHITECTURE.md, CRDT.md, etc.)
2. **Fail loudly** when invariant is violated (no silent corruption)
3. **Be deterministic** (no flakiness, reproducible failures)
4. **Prove correctness** under adversarial conditions (not just happy paths)

**If an assumption is not guaranteed by architecture, the test must fail or be removed.**

We assume the system is **hostile to correctness**. Our job is to **prove it right**.


## Option A – Stabilization Plan

### 0. Goal of Option A

**Goal**: Stabilize the current system (no visible duplicates, no noisy guest behavior, no new bad mappings) **without a rewrite**.

We’ll do this by:

- **Fixing read paths** (sidebar + workspace views).
- **Guarding write paths** (mapping creation).
- **Centralizing canonical key logic**.
- **Adding lightweight invariants / logging** so we can see if anything still goes wrong.

---

### 1. Phase 0 – Preparation & Baseline

#### 1.1 Snapshot current behavior

- **Actions**
  - Run existing frontend tests and note:
    - Any failures already present.
  - Capture screenshots / short videos of:
    - Duplicate docs after login/push.
    - Same docs visible in multiple workspaces (if reproducible).
    - Guest mode spam (403 + snapshot circuit breakers).

- **Why**
  - Gives a hard “before” reference.
  - Helps validate that Option A changes **actually improve** behavior.

---

### 2. Phase 1 – Canonical Key Utility (Guardrail 5)

**Goal**: Make “canonical identity” a **single, shared function**, so all dedup/merge code uses the same rules.

#### 2.1 Introduce canonical key helpers (no call sites yet)

New helpers (e.g. `identity.ts`, pseudo‑code):

```ts
// Strip doc_ prefix if present, otherwise return as-is
export function extractUuid(id: string): string {
  // implementation TBD
}

export function getCanonicalDocKey(metaOrDoc: {
  id: string;
  sync?: { cloudId?: string } | undefined;
  cloudId?: string;
}): string {
  const cloudId = metaOrDoc.cloudId ?? metaOrDoc.sync?.cloudId;
  if (cloudId) return extractUuid(cloudId);
  return extractUuid(metaOrDoc.id);
}

export function getCanonicalWorkspaceKey(ws: { id: string; cloudId?: string }): string {
  // likely just extractUuid(ws.id) now, but we centralize it
  return extractUuid(ws.id);
}
```

- **Constraints**
  - Pure functions, no side‑effects.
  - Unit tests that cover:
    - `doc_<uuid> → <uuid>`
    - `<uuid> → <uuid>`
    - `cloudId` present vs absent.

- **Proof / benefit**
  - This is the single place where identity normalization lives.
  - If we change how we normalize IDs later, there’s one file to touch.

---

### 3. Phase 2 – Sidebar Dedup in `WorkspaceContext.refreshDocuments` (Step 1)

**Goal**: Within a workspace, never show two entries for the same logical doc.

#### 3.1 Replace raw‑id merge with canonical‑key merge

Current pattern (simplified):

```ts
setDocuments(prev => {
  const map = new Map<string, Document>();
  prev.forEach(d => map.set(d.id, d));
  mappedDocs.forEach(d => {
    const existing = map.get(d.id);
    map.set(d.id, { ...existing, ...d });
  });
  return Array.from(map.values());
});
```

**Change**:

- Use `getCanonicalDocKey` for both `prev` and incoming docs:
  - Seed map by `canonicalKey` instead of `id`.
  - Incoming docs override metadata for that `canonicalKey`.
- When writing back to `Document.id`:
  - Keep the canonical form (`extractUuid(id)`), **not** the prefixed variant.

#### 3.2 Add dev‑only invariant check

After recomputing `documents[]` for the current workspace:

- In `NODE_ENV === 'development'`, assert:
  - No two docs share the same `getCanonicalDocKey`.
  - Log a detailed error if it happens (IDs, titles, syncStatus).

#### 3.3 Feature alignment

- **Local‑first**:
  - Local‑only docs still appear; we just normalize their id shape.
- **Push/Pull**:
  - Cloud docs overwrite/merge metadata for the same `canonicalKey`.
- **Sharing**:
  - Document ids used for sharing remain canonical UUIDs or are normalized consistently.

#### 3.4 Proof

Because we’re keying the map by `canonicalKey`, any combination of:

- `doc_<uuid> + <uuid>`
- `<uuid> + <uuid>`
- guest + backend variants with same `cloudId`

will collapse into a single entry.

---

### 4. Phase 3 – Workspace UI Dedup (Step 2 + Guardrail 5 for workspaces)

**Goal**: Prevent “same cloud workspace” from appearing multiple times in the sidebar.

#### 4.1 Normalize workspace list in `WorkspaceContext` init

When building `workspaces[]` in `WorkspaceContext`:

- Build a `Map<canonicalWorkspaceKey, Workspace>`:
  - **Key**: `getCanonicalWorkspaceKey(ws)`.
  - **Value**: the chosen canonical workspace meta (e.g. prefer `syncStatus='synced'` or last updated).
- Log in dev if:
  - Two or more `Workspace` entries share the same canonical key.
- Resulting `workspaces[]` is `Array.from(map.values())`.

#### 4.2 Workspace switch

- Ensure `switchWorkspace` only accepts canonical keys:
  - When user selects a workspace in the sidebar:
    - Map click → canonical key (already normalized).
    - `currentWorkspace` is always a canonical workspace.

#### 4.3 Feature alignment

- **Guest mode**:
  - Local “Local Workspace” still works; if there’s a second identical clone mapping to the same cloud id, it will be hidden/merged.
- **Cloud workspaces**:
  - If multiple locals mapped to the same cloud workspace previously, user now sees **one**.

#### 4.4 Proof

It becomes structurally impossible for two workspace rows with the same canonical workspace id to be in `workspaces[]`.

---

### 5. Phase 4 – Guest Mode Gating (Step 3 – mostly done, formalized)

**Goal**: Guest mode is clean, quiet, and does not create or retry cloud artifacts.

#### 5.1 Confirm and extend auth guards

Already added:

- In `snapshotClient.pushSnapshot` / `retryFailedSnapshots` / `pushSnapshotDirect`:
  - `if (!authService.isAuthenticated()) return false / { attempted: 0, ... }`.
- In `WorkspaceMembersClient.getUserWorkspaces`:
  - If not authenticated, return `{ data: [], total: 0 }`.

Extend the same pattern to any remaining auth‑required APIs that can fire in guest mode:

- e.g. document list endpoints, share‑related endpoints invoked by background UI components.

#### 5.2 Dev‑only invariant

For any `apiClient` call:

- In dev, log a warning if we hit certain “authenticated‑only” endpoints while `authService.isAuthenticated() === false`.

#### 5.3 Feature alignment

- **Local‑first**:
  - Guest docs continue to be created and edited purely locally.
- **Cloud features**:
  - Cloud workspace/doc/sharing UIs stay disabled or clearly gated while logged out.

#### 5.4 Proof

Even if structural identity is still messy behind the scenes, guest mode cannot **add more bad cloud rows** or keep hammering the backend.

---

### 6. Phase 5 – Mapping Injectivity (Guardrail 4)

**Goal**: Stop generating new bad mappings; we’re not just hiding issues, we’re **preventing** new ones.

#### 6.1 `WorkspaceMappingDb` injectivity

In `SelectiveSyncService.storeWorkspaceMapping` (or equivalent):

- Before writing `{ localId, cloudId }`:
  - Query: `findByCanonicalId(cloudId)` (i.e. `mappings.where('cloudId').equals(cloudId)`).
  - If there’s an existing mapping with `localId_other !== localId`:
    - **Do NOT** write a new mapping.
    - Log a structured warning:  
      `"WorkspaceMapping conflict: localId X and localId Y both want cloudId C"`.
    - Decide a safe behavior (short‑term Option A):
      - Reuse existing mapping’s canonical local in internal logic.
      - Or refuse the push with a user‑visible error (“Workspace already exists; please use existing one”).

This is ~5–10 lines plus logs, not a redesign.

#### 6.2 Proof

Once this is in place, the “two locals → one cloud workspace” pattern cannot be **created anew**.  
Existing conflicts still need migration, but the mess will not grow.

#### 6.3 `DocumentMappingDb` injectivity

Similarly, in `storeDocumentMapping(localId, cloudId)`:

- Before `put`:
  - Query by `cloudId`.
  - If found with different `localId_other`:
    - Don’t create a second mapping.
    - Either:
      - Merge metadata in a controlled way, or
      - Raise a clear error (`console.error` + user feedback for that specific push).

#### 6.4 Feature alignment

- **Sync UX**:
  - If we detect conflicting mappings, we can:
    - Surface: “This document is already synced from another copy; please open that one instead.”
  - This is better than silently letting both bind to the same cloud doc.

#### 6.5 Proof

Prevents the system from silently binding multiple local docs to the same cloud doc id and then relying on dedup UI to hide the problem.

---

### 7. Phase 6 – Dev Invariants & Tests

#### 7.1 Dev invariants

- **Documents per workspace**:
  - At any point in dev, assert:
    - For `documentsByWorkspace[workspaceId]`, `getCanonicalDocKey(doc)` is unique.
- **Workspaces**:
  - `getCanonicalWorkspaceKey(ws)` is unique across `workspaces[]`.

If these fire:

- Log the document/workspace ids, titles, and mapping info so we can see what edge case we hit.

#### 7.2 Targeted tests

- Unit tests for:
  - `getCanonicalDocKey`, `getCanonicalWorkspaceKey`.
  - New injectivity guards (workspace + document mappings).
- Integration tests for:
  - Guest create → login → push → refresh:
    - Assert **one** sidebar entry only.
  - Two local workspaces with same name attempting to map to same cloud workspace:
    - Assert only one mapping row exists; UI shows only one.

---

### 8. Phase 7 – Rollout Strategy

#### 8.1 Feature‑flag critical changes (optional but safe)

- Introduce a flag like `IDENTITY_FIXES_ENABLED`:
  - Wrap new merges + injectivity logic behind it.
  - Enable in dev, then staging, then production.

#### 8.2 Monitoring

- Temporarily store counts in localStorage or logs:
  - How often injectivity guards fire.
  - How often sidebar dedup would have collapsed two different raw ids.

This will show how much “bad” state existed and ensure that after some time, new occurrences drop to zero.

---

### 9. Summary of Option A Plan

- **Step 1**: Central canonical key utility (docs/workspaces) + tests.
- **Step 2**: Use canonical key in `refreshDocuments` to dedup sidebar docs (with dev invariants).
- **Step 3**: Normalize & dedup workspaces in `WorkspaceContext` via canonical workspace key.
- **Step 4**: Harden guest mode gating (snapshots / workspace calls / any remaining auth‑required paths).
- **Step 5**: Add injectivity checks to workspace and document mappings (no new multi‑mappings).
- **Step 6**: Add dev‑only invariants and a few targeted tests to catch regressions.
- **Step 7**: Roll out behind a flag if desired; monitor logs for residual edge cases.



testing scenarios : 
Here’s a focused stress‑test checklist you can walk through to validate Option A.
I’ll group by scenario, with concrete steps and what you should expect to see.
1. Fresh profile – no legacy data
Goal: Prove core flows don’t create new structural bugs.
Setup
New browser profile or clear:
IndexedDB for all mdreader DBs.
localStorage keys: auth_token, refresh_token, user, mdreader:*.
Start frontend + backend + hocuspocus.
Guest only
Open /workspace (not logged in).
Create 3 docs in Local Workspace with distinct titles.
Hard refresh the page.
Expect:
Sidebar still shows exactly 3 docs, all with “Local” status.
No 403/401/404 in console coming from /api/v1/* (only static asset logs).
Guest → Login → Push (single doc)
With the same profile:
Log in (via your normal flow).
In Local Workspace, open one of the guest docs (e.g. Doc A).
Use your “Push/Save to Cloud” action for that doc.
Now:
Hard refresh /workspace.
Navigate into Naum Workspace (or whichever cloud workspace is active).
Expect:
In the cloud workspace sidebar:
Exactly one entry for Doc A (no Doc A × 2).
Its sync badge should be “Synced” or equivalent after a refresh.
In Local Workspace:
Doc A may still exist as a local doc, but it should not appear twice anywhere.
Guest → Login → Push (multiple docs)
Back in Local Workspace (still same profile):
Create 2 more guest docs (Doc B, Doc C).
Push both to cloud.
Hard refresh.
Expect:
Cloud workspace sidebar shows 1 row each for Doc A, Doc B, Doc C.
No duplicate rows with the same title/id in any workspace.
2. “Dirty” profile – many old local docs
Goal: See how Option A behaves with lots of pre‑existing guest data.
Setup
Use your current profile where you already had a lot of legacy guest docs.
Do not clear IndexedDB or localStorage.
Login & open main workspace
Log in.
Open your primary workspace (Naum Workspace).
Do not press manual “Refresh” yet.
Expect:
Some docs may initially show as “Local”.
This is the old init path still catching up.
Run a manual refresh
Trigger your “Refresh” within the workspace (whatever calls refreshDocuments()).
Expect:
Some previously hidden docs may appear now (old guest docs that were not in backend).
Synced docs should flip to “Synced” once backend data is merged.
Within this workspace, you should not see duplicate rows for the same document id:
No obvious doc_<uuid> + bare <uuid> entries for the same logical doc.
Check for structural duplicates
In dev console, search for logs:
[WorkspaceContext] Duplicate canonical document key after backend merge
[WorkspaceContext] Duplicate canonical workspace key after merge
Expect:
These should not appear; if they do, note the logged ids/titles (we’ve hit a remaining edge case).
3. Multi‑workspace mapping stress test
Goal: Make sure “many local → one cloud” mappings are prevented.
Setup
In guest mode or logged in, create:
Local WS 1, Local WS 2 (two distinct workspaces).
In Local WS 1, create Doc WS1.
In Local WS 2, create Doc WS2.
Push from Local WS 1
Log in.
In Local WS 1, push Doc WS1 to cloud.
This will create a cloud workspace (e.g. Naum Workspace or another name).
Try to push from Local WS 2 into “same” cloud workspace
In Local WS 2, try to push Doc WS2.
If you guide it to the same cloud workspace (same name/slug), the mapping layer will try to reuse that workspace.
Expect (Option A behavior):
Console may log:
⚠️ WorkspaceMapping conflict detected. Skipping new mapping.
Local WS 2 remains a local‑only workspace; the cloud workspace does not suddenly mirror both sets of docs.
In the cloud workspace, only Doc WS1 is present unless you explicitly sync Doc WS2 via the canonical workspace.
Verify sidebar
Switch between:
Cloud workspace.
Local WS 1.
Local WS 2.
Expect:
Cloud workspace shows only its own docs.
Local WS 2 docs are not duplicated into the cloud workspace’s sidebar.
4. New docs while logged in (refresh behavior)
Goal: Ensure docs created while logged in don’t vanish on reload.
Logged in, cloud workspace selected
Ensure Naum Workspace (or another cloud workspace) is active.
Create a doc: Cloud New Doc X.
Confirm it appears in the sidebar.
Hard refresh
Reload the browser tab (Cmd+R / F5).
Once WorkspaceContext is initialized:
Open the same workspace.
Expect:
Cloud New Doc X is still in the sidebar even if not pushed yet.
This is the new “init merges guest+backend docs” behavior.
If you then push it to cloud and refresh again, its sync badge should show the new status.
5. Guest gating & API noise
Goal: Make sure guest mode is quiet and doesn’t hit auth‑required APIs.
Browser with cleared auth (auth_token removed)
Make sure you’re logged out.
Open /workspace and create/edit several docs.
Console inspection
Filter network to api/v1.
Expect:
No calls to:
/api/v1/users/me/*
/api/v1/documents/*/snapshot
/api/v1/workspaces/* (except where explicitly allowed).
Filter console to warnings:
You should see no GET without auth token for endpoint that usually requires auth from ApiClient.
6. Snapshot queue behavior
Goal: Confirm Option A doesn’t generate new stuck snapshots and can drain old ones.
With backend running
Log in.
Edit a synced doc; wait for snapshot attempts.
Expect:
Snapshot logs show successful pushes (no new 404s for valid cloud docs).
For old entries
If you previously had 70+ snapshot entries in circuit breaker:
Let the app run a bit (so GlobalRetryManager executes retryFailedSnapshots()).
Watch the logs:
404s should now be logged as “dropping from retry queue”, not re‑queued.
Optionally run FailedSnapshotStore.getStats() from console (if you expose it in dev) to see total decreasing over time.
No new circuit breaker spam
After some time editing normally with backend healthy:
You should not see new 🚨 [GlobalRetryManager] Circuit breaker triggered messages growing in count.
7. Sharing / members endpoint
Goal: Confirm the /documents/{id}/members 422 is gone.
Logged in, cloud doc
Open a doc that has been pushed or is in a cloud workspace.
Open the Share UI (or whatever triggers SharesClient.listMembers).
Console / Network
Network: /api/v1/documents/{uuid}/members:
The documentId path segment should be a bare UUID (no doc_ prefix).
Console:
You should not see:
document_id: Input should be a valid UUID.
8. Regression checks for duplicates
Goal: Re‑verify that the original classes of bugs don’t reappear.
Doc‑level duplicates
Repeat the original reproduction:
Guest create → login → push → refresh documents.
Expect:
One row per logical doc in the sidebar.
Check dev console:
No “Duplicate canonical document key after backend/guest/cloud init merge” logs.
Workspace‑level duplicates
Create several workspaces, push some, log out/in a few times.
Expect:
Sidebar’s workspace selector shows each logical workspace only once.
No “Duplicate canonical workspace key after merge” in console.
If you walk through these scenarios and they all behave as expected (even if the messy profile surfaces many old docs), Option A is doing exactly what we designed it to: no new structural bugs, no silent duplication, and guest/cloud boundaries behaving predictably.


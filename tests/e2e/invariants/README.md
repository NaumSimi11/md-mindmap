# Architectural Invariant Tests

**Purpose:** Enforce MDReader Architecture v2.1 through automated testing.  
**Role:** Principal Test Engineer - Architectural Law Enforcement  
**Date:** December 2025

---

## What Are Invariant Tests?

Invariant tests are NOT feature tests. They prove that **architectural guarantees** defined in the specification documents always hold true.

**If an invariant test fails, the architecture is violated.**

---

## Test Structure

### Group A: Local-First Invariants
**File:** `local-first.spec.ts`  
**Tests:** 4 tests  
**Status:** ✅ ALL IMPLEMENTED

Proves the system operates fully offline without backend dependency.

- ✅ LF-001: Create document offline → visible in sidebar
- ✅ LF-002: Refresh page → document still visible (no backend call)
- ✅ LF-003: Editor content matches local index (CRDT canonical)
- ✅ LF-004: No backend requests required for local operations

**Architecture Reference:**
- `ARCHITECTURE.md` - INVARIANT 1 (Local-First Operation)
- `SYNC_INVARIANTS.md` - INVARIANT 1.2, 1.3, 4.1

---

### Group B: Sidebar / Editor Consistency
**File:** `sidebar-editor-consistency.spec.ts`  
**Tests:** 4 tests  
**Status:** ✅ ALL IMPLEMENTED

Proves sidebar and editor state are consistent and derived from same source.

- ✅ SE-001: Editor open implies sidebar entry exists
- ✅ SE-002: Sidebar entry click loads editor without network
- ✅ SE-003: No document duplication after refresh
- ✅ SE-004: Document ID is immutable across operations

**Architecture Reference:**
- `SYNC_INVARIANTS.md` - INVARIANT 1.1, 3.1, 2.2
- `CRDT.md` - CRDT as Canonical State

---

### Group C: Sync Status Truthfulness
**File:** `sync-status-truthfulness.spec.ts`  
**Tests:** 5 tests  
**Status:** ⚠️ 2 IMPLEMENTED, 3 BLOCKED

Proves sync status always reflects reality and persists correctly.

- ✅ SS-001: New document shows "local" status (not synced)
- ✅ SS-002: Sync status persists across refresh
- ❌ SS-003: **[BLOCKED]** Failed push MUST NOT mark synced
- ❌ SS-004: **[BLOCKED]** Successful push MUST update sync state
- ❌ SS-005: **[BLOCKED]** Push requires explicit user action (no auto-push)

**Blocker:** Requires authentication + push-to-cloud functionality

**Architecture Reference:**
- `SYNC_INVARIANTS.md` - INVARIANT 5.1, 5.2, 5.3, 6.1, 6.2, 6.3

---

### Group D: Guest → Auth Transition
**File:** `guest-auth-transition.spec.ts`  
**Tests:** 5 tests  
**Status:** ❌ ALL BLOCKED

Proves guest documents persist correctly across authentication state changes.

- ❌ GA-001: **[BLOCKED]** Guest documents remain after login
- ❌ GA-002: **[BLOCKED]** Login does NOT auto-push local documents
- ❌ GA-003: **[BLOCKED]** Logout does NOT delete local data
- ❌ GA-004: **[BLOCKED]** No document duplication on login
- ❌ GA-005: **[BLOCKED]** Guest mode functional after logout

**Blocker:** Authentication flow not stable

**Architecture Reference:**
- `SYNC_INVARIANTS.md` - INVARIANT 9.1, 9.2, 9.3

---

### Group E: Negative Cases
**File:** `negative-cases.spec.ts`  
**Tests:** 6 tests  
**Status:** ⚠️ 4 IMPLEMENTED, 2 BLOCKED

Proves the system degrades gracefully under failure conditions.

- ✅ NEG-001: Kill backend → app still usable
- ✅ NEG-002: Block network → edits preserved
- ✅ NEG-003: Browser crash → state recoverable
- ❌ NEG-004: **[BLOCKED]** Backend 500 error → sync status reflects failure
- ❌ NEG-005: **[BLOCKED]** Network timeout → graceful degradation
- ✅ NEG-006: Concurrent multi-tab edits → no data loss

**Blocker:** NEG-004, NEG-005 require authentication

**Architecture Reference:**
- `ARCHITECTURE.md` - Failure Modes section
- `TEST_ARCHITECTURE.md` - Layer 10 (Observability)

---

## Test Coverage Summary

| Group | Total Tests | Implemented | Blocked | Coverage |
|-------|-------------|-------------|---------|----------|
| **A: Local-First** | 4 | 4 | 0 | 100% ✅ |
| **B: Sidebar/Editor** | 4 | 4 | 0 | 100% ✅ |
| **C: Sync Status** | 5 | 2 | 3 | 40% ⚠️ |
| **D: Guest → Auth** | 5 | 0 | 5 | 0% ❌ |
| **E: Negative Cases** | 6 | 4 | 2 | 67% ⚠️ |
| **TOTAL** | **24** | **14** | **10** | **58%** |

---

## Blockers

### Primary Blocker: Authentication

**10 tests blocked** due to unstable authentication flow.

**Evidence:**
- Existing test `e2e/import-document.spec.ts` has `.fail()` tests
- Comments mention "refresh persistence flow not stable yet"
- Login/logout UI may not be fully implemented

**To Unblock:**
1. Stabilize login flow (JWT storage, state persistence)
2. Stabilize logout flow (state cleanup, guest mode restoration)
3. Implement push-to-cloud UI (manual sync button)
4. Implement backend document API (POST, GET, PATCH)

---

## Running Tests

### Run All Invariant Tests
```bash
npx playwright test tests/e2e/invariants/
```

### Run Specific Group
```bash
# Group A: Local-First
npx playwright test tests/e2e/invariants/local-first.spec.ts

# Group B: Sidebar/Editor Consistency
npx playwright test tests/e2e/invariants/sidebar-editor-consistency.spec.ts

# Group C: Sync Status (includes skipped tests)
npx playwright test tests/e2e/invariants/sync-status-truthfulness.spec.ts

# Group D: Guest → Auth (all skipped)
npx playwright test tests/e2e/invariants/guest-auth-transition.spec.ts

# Group E: Negative Cases
npx playwright test tests/e2e/invariants/negative-cases.spec.ts
```

### Run Only Implemented Tests (Skip Blocked)
```bash
npx playwright test tests/e2e/invariants/ --grep-invert "BLOCKED"
```

---

## Test Rules

### ✅ ALLOWED

- Test what is ALREADY implemented
- Enforce architectural invariants
- Use `.skip()` for blocked tests with clear explanation
- Reference architecture documents in comments
- Use `await page.waitForTimeout()` up to 500ms

### ❌ FORBIDDEN

- Test future features (auto-sync, backend merge)
- Test UI cosmetics (button colors, layouts)
- Use `.fail()` (test must pass or be skipped)
- Use timing hacks > 500ms
- Assume backend availability
- Assume sidebar discovery refreshes state

---

## Test Naming Convention

```
{GROUP}-{NUMBER}: {Invariant Description}
```

**Examples:**
- `LF-001: Create document offline → visible in sidebar`
- `SE-001: Editor open implies sidebar entry exists`
- `SS-001: New document shows "local" status`
- `GA-001: Guest documents remain after login`
- `NEG-001: Kill backend → app still usable`

**Format:**
- LF = Local-First
- SE = Sidebar/Editor
- SS = Sync Status
- GA = Guest/Auth
- NEG = Negative Cases

---

## Architecture Alignment

Every test maps to specific architecture sections:

| Test | Architecture Document | Section |
|------|----------------------|---------|
| LF-* | ARCHITECTURE.md | INVARIANT 1 (Local-First) |
| LF-* | SYNC_INVARIANTS.md | Section 1, 2 (Source of Truth) |
| SE-* | SYNC_INVARIANTS.md | Section 3 (Sidebar Invariants) |
| SE-* | SYNC_INVARIANTS.md | Section 4 (Editor Invariants) |
| SS-* | SYNC_INVARIANTS.md | Section 5, 6 (Sync Status, Push Rules) |
| GA-* | SYNC_INVARIANTS.md | Section 9 (Login/Logout Effects) |
| NEG-* | ARCHITECTURE.md | Failure Modes section |

---

## When Tests Fail

**If an invariant test fails:**

1. **DO NOT disable the test**
2. **DO NOT change the test to pass**
3. **FIX THE CODE** to comply with architecture
4. **If architecture is wrong**, update architecture docs first, then update test

**Test failure = Architecture violation**

---

## Contributing

### Adding New Invariant Tests

1. Identify architectural invariant (from ARCHITECTURE.md or SYNC_INVARIANTS.md)
2. Determine which group (A, B, C, D, or E)
3. Write test with clear invariant name
4. Reference architecture section in comments
5. If blocked, use `.skip()` with explanation

### Unblocking Blocked Tests

1. Verify blocker is resolved (e.g., auth is stable)
2. Remove `.skip()`
3. Implement test logic
4. Verify test passes
5. Update coverage in this README

---

## Architecture References

**Authoritative Documents:**
- `docs/ARCHITECTURE.md` - System architecture
- `docs/CRDT.md` - CRDT implementation
- `docs/SYNC_INVARIANTS.md` - 19 sync invariants
- `docs/AI_PATCH_PROTOCOL.md` - AI safety (not tested yet)
- `docs/TEST_ARCHITECTURE.md` - Test strategy

---

## Contact

**Test Architecture Owner:** Principal Test Engineer  
**Last Updated:** December 2025  
**Review Frequency:** After every architecture change

---

## Appendix: Deleted Tests

See `docs/TEST_AUDIT_REPORT.md` for list of deleted tests that violated architecture v2.1.

**Deleted Files:**
- `e2e/import-document.spec.ts` (10 tests - all invalid)
- `frontend/e2e/mindmap-critical.spec.ts` (1 test - out of scope)

**Deleted Tests from `e2e/paste-and-diagrams.spec.ts`:**
- 8 feature tests (not architectural invariants)

**Kept Tests:**
- `e2e/ws-guest-no-hocuspocus.spec.ts` - Guest mode WebSocket invariant
- 1 test from paste-and-diagrams (offline persistence)


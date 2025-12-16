# PHASE 1: Test Audit Report

**Date:** December 2025  
**Auditor:** Principal Test Engineer  
**Architecture Version:** v2.1

---

## Executive Summary

**Total Tests Found:** 4 test files, 21 individual tests  
**Valid Tests:** 2 tests (9.5%)  
**Invalid Tests:** 8 tests (38%)  
**Obsolete Tests:** 0 tests  
**Feature Tests (Out of Scope):** 11 tests (52.5%)

**Recommendation:** DELETE 8 tests, KEEP 2 tests, MOVE 11 tests to feature test suite.

---

## Test File Classification

### ✅ **VALID: `e2e/ws-guest-no-hocuspocus.spec.ts`**

**Status:** VALID - Aligned with Architecture v2.1

**Tests:**
1. `guest mode should not open Hocuspocus websocket`

**Rationale:**
- Tests explicit architectural constraint from SYNC_INVARIANTS.md
- Proves guest mode operates without backend/collaboration dependency
- Maps to: INVARIANT 7.2 (Auto-Sync Requires Authentication)

**Action:** KEEP

---

### ⚠️ **MIXED: `e2e/paste-and-diagrams.spec.ts`**

**Total Tests:** 10  
**Valid:** 1  
**Invalid:** 7  
**Feature Tests:** 2

#### **VALID TEST:**

**✅ Test: "MUST persist content after paste"**
- **Status:** VALID
- **Maps to:** INVARIANT 2.1 (CRDT is Canonical), LOCAL-FIRST guarantees
- **Proves:** Offline edit persistence via IndexedDB
- **Action:** KEEP (but move to invariants folder)

#### **INVALID TESTS (DELETE):**

**❌ Test: "MUST paste large markdown files"**
- **Reason:** Tests UI feature (paste handler), not architectural invariant
- **Not Guaranteed By:** Architecture does not specify paste behavior
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST render mermaid diagrams from paste"**
- **Reason:** Tests feature (Mermaid rendering), not invariant
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST insert diagram via button"**
- **Reason:** UI feature test (button click), not architectural constraint
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST preserve diagrams on mode switch"**
- **Reason:** Tests mode switching (not defined in architecture)
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST NOT lose content on rapid mode switching"**
- **Reason:** Tests edge case of undefined behavior (mode switching)
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST handle very large paste (10KB+)"**
- **Reason:** Tests paste feature, not architectural limit (100MB doc limit)
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST NOT paste as code block"**
- **Reason:** Regression test for UI bug, not architectural invariant
- **Action:** DELETE or MOVE to feature tests

**❌ Test: "MUST NOT block Yjs updates"**
- **Reason:** Placeholder test (no actual assertion), tests undefined behavior
- **Action:** DELETE

---

### ❌ **INVALID: `e2e/import-document.spec.ts`**

**Total Tests:** 10  
**Valid:** 0  
**Invalid:** 8  
**Feature Tests:** 2

#### **INVALID TESTS (DELETE ALL):**

**❌ Test: "should import markdown file and display content"**
- **Reason:** Tests import feature (not core architectural invariant)
- **Violation:** Assumes specific UI flow (`import-document-button`)
- **Architecture Says:** Import is future feature (IMPORT/EXPORT section)
- **Action:** DELETE (import not part of v2.1 current implementation)

**❌ Test: "should generate outline from imported document"**
- **Reason:** Tests outline generation (feature, not invariant)
- **Action:** DELETE

**❌ Test: "should scroll to heading when clicked in outline"**
- **Reason:** UI feature test, marked as `.fail()` (known broken)
- **Action:** DELETE (test author admits it's broken)

**❌ Test: "should persist content after page refresh"**
- **Reason:** DUPLICATE of valid test in paste-and-diagrams.spec.ts
- **Additional Issue:** Marked as `.fail()` (known broken)
- **Action:** DELETE (duplicate + broken)

**❌ Test: "should delete imported document with custom dialog"**
- **Reason:** Tests delete UI flow (feature test)
- **Action:** DELETE

**❌ Test: "should handle special characters in imported documents"**
- **Reason:** Tests character encoding (feature test)
- **Action:** DELETE

**❌ Test: "should handle empty markdown files gracefully"**
- **Reason:** Tests edge case handling (not architectural invariant)
- **Action:** DELETE

**❌ Test: "should import multiple documents without conflicts"**
- **Reason:** Tests multi-import (feature), marked as `.fail()` (broken)
- **Action:** DELETE (broken test for unimplemented feature)

---

### ⚠️ **OUT OF SCOPE: `frontend/e2e/mindmap-critical.spec.ts`**

**Total Tests:** 1  
**Valid:** 0  
**Feature Tests:** 1

**❌ Test: "mindmap button exists and is clickable"**
- **Reason:** UI feature test (button existence)
- **Not Architectural:** Architecture does not mandate mindmap feature
- **Action:** MOVE to feature test suite (not architectural invariant test)

---

## Deletion List

### Files to Delete Entirely

1. `e2e/import-document.spec.ts` (all 10 tests invalid)
2. `frontend/e2e/mindmap-critical.spec.ts` (out of scope)

### Tests to Delete from `e2e/paste-and-diagrams.spec.ts`

Delete these specific tests:
- ❌ "MUST paste large markdown files"
- ❌ "MUST render mermaid diagrams from paste"
- ❌ "MUST insert diagram via button"
- ❌ "MUST preserve diagrams on mode switch"
- ❌ "MUST NOT lose content on rapid mode switching"
- ❌ "MUST handle very large paste (10KB+)"
- ❌ "MUST NOT paste as code block"
- ❌ "MUST NOT block Yjs updates"

**Keep Only:**
- ✅ "MUST persist content after paste" (move to invariants folder)

---

## Tests to Keep

### 1. `e2e/ws-guest-no-hocuspocus.spec.ts`
- **Status:** VALID
- **Action:** Move to `tests/e2e/invariants/guest-mode.spec.ts`

### 2. From `e2e/paste-and-diagrams.spec.ts`
- **Test:** "MUST persist content after paste"
- **Action:** Extract and move to `tests/e2e/invariants/offline-persistence.spec.ts`

---

## Architecture Violations Summary

### Violation #1: Testing Undefined Behavior

**Tests violating:**
- All import-document tests (import not in v2.1 current implementation)
- Mode switching tests (mode switching not defined in architecture)
- Outline click-to-scroll (admitted broken by test author)

**Architectural Principle Violated:**
> "If something is undefined: → FAIL THE TEST → REPORT THE GAP"

**Fix:** DELETE these tests. If import is implemented later, write tests then.

---

### Violation #2: Feature Tests Masquerading as Invariants

**Tests violating:**
- Paste handler tests (paste is UI feature, not invariant)
- Mermaid diagram tests (rendering is feature, not architectural constraint)
- Mindmap button test (UI feature)

**Architectural Principle Violated:**
> "This is NOT feature testing. This is NOT UI cosmetics testing."

**Fix:** MOVE to separate feature test suite or DELETE.

---

### Violation #3: Broken Tests Marked as `.fail()`

**Tests violating:**
- "should scroll to heading when clicked in outline" (.fail())
- "should persist content after page refresh" (.fail())
- "should import multiple documents without conflicts" (.fail())

**Architectural Principle Violated:**
> "Tests must fail if invariants are violated. Tests must not rely on timing hacks."

**Fix:** DELETE. Never commit `.fail()` tests to invariant suite.

---

### Violation #4: Timing Hacks

**Tests violating:**
- All tests use `await page.waitForTimeout(500)` to `await page.waitForTimeout(3000)`
- Multiple tests use `waitForTimeout` > 500ms (violates rules)

**Rule Violated:**
> "No sleeps longer than 500ms"

**Fix:** Rewrite with proper await patterns (network idle, element visibility).

---

## Missing Invariant Tests

Based on SYNC_INVARIANTS.md, these critical tests are MISSING:

### LOCAL-FIRST INVARIANTS (MISSING)
1. ❌ Create document offline → visible in sidebar
2. ❌ Refresh page → document still visible (no backend call)
3. ❌ Editor content matches local index (WorkspaceContext.documents)
4. ❌ Document with NULL id is rejected (INVARIANT-006)

### SYNC STATUS INVARIANTS (MISSING)
1. ❌ Failed push MUST NOT mark synced
2. ❌ Successful push MUST update sync state
3. ❌ Sync status survives refresh (durable)
4. ❌ Push to cloud requires explicit user action (no auto-push)

### GUEST → AUTH TRANSITION (MISSING)
1. ❌ Guest documents remain after login
2. ❌ Login does not auto-push local documents
3. ❌ Logout does not delete local documents

### SIDEBAR / EDITOR CONSISTENCY (MISSING)
1. ❌ Editor open implies sidebar entry exists
2. ❌ Sidebar entry click loads editor without network
3. ❌ No "ghost editor" states (content in editor but not in sidebar)

### NEGATIVE CASES (MISSING)
1. ❌ Kill backend → app still usable
2. ❌ Block network → edits preserved
3. ❌ Simulate backend 500 → sync status reflects failure

---

## Recommendations

### Immediate Actions (PHASE 1)

1. **DELETE 2 files entirely:**
   - `e2e/import-document.spec.ts`
   - `frontend/e2e/mindmap-critical.spec.ts`

2. **DELETE 8 tests from `e2e/paste-and-diagrams.spec.ts`:**
   - Keep only 1 test: "MUST persist content after paste"

3. **MOVE 2 valid tests to new structure:**
   - `tests/e2e/invariants/guest-mode.spec.ts`
   - `tests/e2e/invariants/offline-persistence.spec.ts`

### Next Actions (PHASE 2)

4. **IMPLEMENT 18+ missing invariant tests** (see Missing Invariant Tests section)

5. **CREATE new test structure:**
   ```
   tests/e2e/invariants/
   ├── local-first.spec.ts           (Group A)
   ├── sidebar-editor-consistency.spec.ts (Group B)
   ├── sync-status-truthfulness.spec.ts   (Group C)
   ├── guest-auth-transition.spec.ts      (Group D)
   └── negative-cases.spec.ts             (Group E)
   ```

---

## Compliance Metrics

**Before Audit:**
- Tests aligned with v2.1: 2/21 (9.5%)
- Tests enforcing invariants: 2/21 (9.5%)
- Tests covering architecture gaps: 0/21 (0%)

**After Phase 1 (Deletion):**
- Tests remaining: 2/21 (9.5%)
- Tests aligned with v2.1: 2/2 (100%)

**After Phase 2 (Implementation):**
- Target: 20+ invariant tests
- Target coverage: 100% of SYNC_INVARIANTS.md
- Target: All architectural guarantees proven

---

## Sign-Off

This audit identifies 19 tests (90.5%) as non-compliant with Architecture v2.1.

**Auditor:** Principal Test Engineer  
**Date:** December 2025  
**Next Review:** After Phase 2 implementation

---

## Appendix: Architecture References

**Tests MUST align with:**
- `docs/ARCHITECTURE.md` - System invariants (7 defined)
- `docs/CRDT.md` - CRDT guarantees (5 apply, 5 do not apply)
- `docs/SYNC_INVARIANTS.md` - 19 sync invariants (0% covered)
- `docs/AI_PATCH_PROTOCOL.md` - AI safety (not tested)

**Current Coverage:** 10.5% (2 of 19 sync invariants)

**Target Coverage:** 100% (all invariants)


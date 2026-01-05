# Landing Page Import Bug Analysis & E2E Test Plan

## 🔴 Problem Statement

**Symptom**: When importing a file from the landing page and navigating to edit it, the editor shows:
- ✅ **Outline is visible** (headings are parsed and shown in sidebar)
- ❌ **Editor content is empty** (no text visible in the WYSIWYG editor)

This indicates that:
- Document metadata is loaded correctly (title, content in Dexie)
- Outline generation works (reads from document metadata)
- Yjs hydration failed or content wasn't written to the correct Yjs instance

## 🔍 Root Cause Analysis

### Current Flow (Broken)

1. **Landing Page Import** (`AILandingPage.tsx:284-346`)
   ```
   User selects file
   → createDocument('markdown', title, content)  // Creates in Dexie
   → Creates NEW Y.Doc() instance (NOT via YjsDocumentManager)
   → Writes HTML to _init_markdown field
   → Persists to IndexedDB with normalized ID
   → Destroys persistence provider
   → Navigates to /workspace/doc/{id}/edit
   ```

2. **Editor Loading** (`Workspace.tsx:196-242`)
   ```
   Navigate to /workspace/doc/{id}/edit
   → backendGetDocument(documentId)  // Gets from Dexie
   → DocumentDataContext.getDocument()
   → yjsHydrationService.hydrateDocument()  // Tries to hydrate
   → useYjsDocument(documentId)  // Creates NEW Yjs instance via YjsDocumentManager
   → useTipTapEditor()  // Reads from _init_markdown
   ```

### Critical Issues Identified

#### Issue #1: Duplicate Yjs Instances
- **Landing page** creates Yjs doc A (manual `new Y.Doc()`, writes to `_init_markdown`)
- **Editor** creates Yjs doc B (via `YjsDocumentManager.getDocument()`)
- These are **different instances** - content in A is not visible in B
- Landing page's Yjs instance is destroyed after persistence, so content is lost

#### Issue #2: ID Normalization Race Condition
- Landing page normalizes ID: `doc.id.startsWith('doc_') ? doc.id.slice(4) : doc.id`
- YjsDocumentManager also normalizes ID in `useYjsDocument`
- But landing page writes to IndexedDB with normalized ID
- Editor reads from IndexedDB with normalized ID
- **Timing issue**: Landing page writes, destroys provider, then editor reads - might miss the write

#### Issue #3: Hydration Service Conflict
- Landing page manually writes to `_init_markdown`
- Hydration service also writes to `_init_markdown` (line 138-142 in `YjsHydrationService.ts`)
- Hydration service checks if fragment is populated (line 89-102)
- If IndexedDB hasn't synced yet, hydration sees empty doc and overwrites
- If IndexedDB has synced, hydration skips (but content might be in wrong instance)

#### Issue #4: IndexedDB Persistence Timing
- Landing page: `persistence.once('synced', resolve)` then `persistence.destroy()`
- This ensures write completes, but destroys the provider
- Editor creates NEW provider for same document ID
- New provider might not see the previous write if:
  - IndexedDB transaction hasn't committed
  - Different Yjs instance (different Y.Doc object)
  - Race condition between destroy and new provider creation

#### Issue #5: Missing Hydration Call
- Landing page does NOT call `yjsHydrationService.hydrateDocument()`
- It manually writes to Yjs, but uses a different instance
- Editor's `DocumentDataContext.getDocument()` calls hydration
- But by then, the landing page's Yjs instance is gone
- Hydration tries to write to editor's Yjs instance, but might be too late or conflict

### Why Outline Works But Content Doesn't

- **Outline**: Reads from `document.content` (Dexie metadata) - ✅ Works
- **Editor**: Reads from Yjs `_init_markdown` field - ❌ Empty because:
  - Content was written to wrong Yjs instance (landing page's instance)
  - Editor's Yjs instance is empty
  - Hydration didn't run or ran too late

## 📋 E2E Test Plan

### Test Suite: `landing-page-import.spec.ts`

#### Test 1: Basic Import Flow
**ID**: `L-IMP-001`  
**Description**: Import .md file from landing page, navigate to editor, verify content appears

**Steps**:
1. Navigate to `/` (landing page)
2. Click "Open File" button or use file input
3. Select a test fixture file (`e2e/fixtures/simple.md`)
4. Wait for document creation
5. Verify navigation to `/workspace/doc/{id}/edit`
6. Wait for editor to load
7. **Assert**: Editor content contains "Hello World" (from fixture)
8. **Assert**: Outline shows "Hello World" heading
9. **Assert**: Editor is not empty (has text content)

**Expected Result**: Content visible in editor, outline shows headings

**Failure Modes**:
- Editor empty but outline shows headings → Yjs hydration failed
- Navigation fails → Document creation failed
- Editor never loads → Yjs instance creation failed

---

#### Test 2: Import with Headings
**ID**: `L-IMP-002`  
**Description**: Import file with multiple headings, verify all appear in editor and outline

**Steps**:
1. Navigate to `/`
2. Import `e2e/fixtures/special-chars.md` (has headings, emojis, code blocks)
3. Navigate to editor
4. **Assert**: Editor contains "Test 🚀" heading
5. **Assert**: Editor contains "Features" heading
6. **Assert**: Outline shows all headings (H1, H2)
7. **Assert**: Code block is rendered correctly

**Expected Result**: All content visible, outline matches content

**Failure Modes**:
- Headings in outline but not in editor → Yjs hydration issue
- Code blocks missing → Markdown conversion issue

---

#### Test 3: Import Multiple Files
**ID**: `L-IMP-003`  
**Description**: Import multiple files sequentially, verify each opens correctly

**Steps**:
1. Navigate to `/`
2. Import `simple.md`
3. Navigate to editor, verify content
4. Navigate back to landing page
5. Import `special-chars.md`
6. Navigate to editor, verify content
7. **Assert**: Each document opens with correct content
8. **Assert**: No content mixing between documents

**Expected Result**: Each import creates separate document with correct content

**Failure Modes**:
- Second import shows first document's content → ID collision
- Content from both files mixed → Yjs instance reuse bug

---

#### Test 4: Import After Refresh
**ID**: `L-IMP-004`  
**Description**: Import file, refresh page, verify content persists

**Steps**:
1. Navigate to `/`
2. Import `simple.md`
3. Navigate to editor
4. Verify content is visible
5. Refresh page (F5)
6. Wait for editor to reload
7. **Assert**: Content still visible after refresh
8. **Assert**: Outline still shows headings

**Expected Result**: Content persists across refresh (IndexedDB persistence works)

**Failure Modes**:
- Content lost after refresh → IndexedDB write failed
- Editor empty but outline works → Yjs hydration after refresh failed

---

#### Test 5: Import Large File
**ID**: `L-IMP-005`  
**Description**: Import large markdown file, verify performance and content

**Steps**:
1. Navigate to `/`
2. Import large test file (10KB+ markdown)
3. Measure time to navigate to editor
4. **Assert**: Navigation completes within 2 seconds
5. **Assert**: All content visible in editor
6. **Assert**: Outline shows all headings (even if many)

**Expected Result**: Large files import and display correctly

**Failure Modes**:
- Timeout during import → Performance issue
- Partial content visible → Yjs write incomplete

---

#### Test 6: Import with Special Characters
**ID**: `L-IMP-006`  
**Description**: Import file with emojis, special chars, verify rendering

**Steps**:
1. Navigate to `/`
2. Import `special-chars.md` (has emojis, code blocks, special chars)
3. Navigate to editor
4. **Assert**: Emojis render correctly (🚀, ✅, ❌)
5. **Assert**: Code blocks are formatted
6. **Assert**: Special characters preserved

**Expected Result**: All special content renders correctly

**Failure Modes**:
- Emojis missing → Encoding issue
- Code blocks broken → Markdown conversion issue

---

#### Test 7: Import Then Edit
**ID**: `L-IMP-007`  
**Description**: Import file, edit content, verify changes persist

**Steps**:
1. Navigate to `/`
2. Import `simple.md`
3. Navigate to editor
4. Verify content is visible
5. Type additional text in editor
6. Wait for autosave (3 seconds)
7. Refresh page
8. **Assert**: Original content + edits are visible
9. **Assert**: Changes persisted to IndexedDB

**Expected Result**: Edits persist correctly

**Failure Modes**:
- Edits lost → Yjs sync issue
- Original content lost → Hydration overwrite bug

---

#### Test 8: Import While Offline
**ID**: `L-IMP-008`  
**Description**: Import file while offline, verify local-first behavior

**Steps**:
1. Set browser to offline mode
2. Navigate to `/`
3. Import `simple.md`
4. Navigate to editor
5. **Assert**: Content visible (works offline)
6. **Assert**: Document saved locally (IndexedDB)
7. Go online
8. **Assert**: Document still accessible

**Expected Result**: Import works offline, content persists

**Failure Modes**:
- Import fails offline → Network dependency bug
- Content lost when going online → Sync conflict

---

#### Test 9: Import Then Navigate Away and Back
**ID**: `L-IMP-009`  
**Description**: Import file, navigate away, come back, verify content

**Steps**:
1. Navigate to `/`
2. Import `simple.md`
3. Navigate to editor
4. Verify content
5. Navigate to `/workspace` (home)
6. Click on imported document in sidebar
7. **Assert**: Content still visible
8. **Assert**: Outline still shows headings

**Expected Result**: Content persists when navigating away and back

**Failure Modes**:
- Content lost when navigating back → Yjs instance cleanup bug
- Editor shows wrong document → Document selection bug

---

#### Test 10: Import with Drag & Drop
**ID**: `L-IMP-010`  
**Description**: Import file via drag & drop on landing page

**Steps**:
1. Navigate to `/`
2. Drag `simple.md` onto MDFileDropZone
3. Wait for file analysis
4. Click "Start Editing" or similar action
5. Navigate to editor
6. **Assert**: Content visible in editor
7. **Assert**: Outline shows headings

**Expected Result**: Drag & drop import works same as file picker

**Failure Modes**:
- Drag & drop doesn't trigger → Event handler bug
- Content missing after drag & drop → Same hydration issue

---

### Test Fixtures Required

1. `e2e/fixtures/simple.md` - Basic markdown with headings
2. `e2e/fixtures/special-chars.md` - Emojis, code blocks, special chars
3. `e2e/fixtures/large.md` - Large file (10KB+) for performance test
4. `e2e/fixtures/headings-only.md` - Multiple heading levels

### Test Helpers Needed

```typescript
// landing-page-helpers.ts
export class LandingPageHelper {
  async importFile(page: Page, filePath: string): Promise<string> {
    // Click import button, select file, wait for navigation
    // Returns document ID
  }
  
  async waitForEditorContent(page: Page, expectedText: string): Promise<void> {
    // Wait for editor to load and contain expected text
  }
  
  async verifyOutline(page: Page, expectedHeadings: string[]): Promise<void> {
    // Verify outline shows all expected headings
  }
}
```

### Debugging Checklist

When tests fail, check:

1. **Console Logs**:
   - `[Import] Document created` - Document created in Dexie?
   - `[YjsHydration] Normalized ID` - ID normalization correct?
   - `[YjsHydration] From markdown` - Hydration ran?
   - `[STEP 4] Loading hydrated content` - TipTap read from Yjs?

2. **IndexedDB**:
   - Check `mdreader-{normalizedId}` database
   - Verify `_init_markdown` field has content
   - Check document metadata in Dexie

3. **Yjs Instances**:
   - Verify YjsDocumentManager has correct instance
   - Check if multiple instances exist for same ID
   - Verify instance has content in `_init_markdown`

4. **Timing**:
   - Check if hydration runs before editor loads
   - Verify IndexedDB sync completes before hydration check
   - Check if navigation happens before content is written

### Expected Fix Strategy

1. **Remove manual Yjs creation from landing page**
   - Use `yjsHydrationService.hydrateDocument()` instead
   - Let YjsDocumentManager handle instance creation
   - Ensure hydration happens before navigation

2. **Fix ID normalization**
   - Use consistent normalization everywhere
   - Ensure landing page and editor use same normalized ID

3. **Fix hydration timing**
   - Wait for IndexedDB sync before checking if doc is empty
   - Ensure hydration completes before editor reads content

4. **Add proper error handling**
   - Log when hydration fails
   - Retry hydration if content missing
   - Show user-friendly error if import fails

## 📊 Test Coverage Matrix

| Test ID | Landing Page | Editor Load | Content Visible | Outline Works | Persistence | Offline |
|---------|-------------|-------------|-----------------|--------------|-------------|---------|
| L-IMP-001 | ✅ | ✅ | ✅ | ✅ | - | - |
| L-IMP-002 | ✅ | ✅ | ✅ | ✅ | - | - |
| L-IMP-003 | ✅ | ✅ | ✅ | ✅ | - | - |
| L-IMP-004 | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| L-IMP-005 | ✅ | ✅ | ✅ | ✅ | - | - |
| L-IMP-006 | ✅ | ✅ | ✅ | ✅ | - | - |
| L-IMP-007 | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| L-IMP-008 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| L-IMP-009 | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| L-IMP-010 | ✅ | ✅ | ✅ | ✅ | - | - |

## 🎯 Success Criteria

All tests must pass:
- ✅ Content visible in editor after import
- ✅ Outline shows correct headings
- ✅ Content persists across refresh
- ✅ Multiple imports work correctly
- ✅ No content mixing between documents
- ✅ Works offline
- ✅ Performance acceptable (<2s for import + navigation)

## 📝 Notes

- This bug has been reported multiple times, indicating it's a critical issue
- The problem is in the landing page import flow, not the workspace import flow
- Workspace import (ImportDocumentButton) has hydration fix, but landing page doesn't
- Need to align landing page import with workspace import flow


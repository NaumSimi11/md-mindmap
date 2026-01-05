# 🚀 **E2E Pre-Commit Testing Plan**

## 📋 **Current Pre-Commit Setup (WORKING ✅)**

**What runs now on `git commit` via `./test-critical.sh`:**

| Test | File | Duration | Status |
|------|------|----------|--------|
| Paste Persistence | `e2e/paste-and-diagrams.spec.ts` | ~3s | ✅ PASSING |
| Import + Display | `e2e/import-flow.spec.ts:21` | ~4s | ✅ PASSING |
| Import + Persist | `e2e/import-flow.spec.ts:54` | ~5s | ✅ PASSING |

**Total: 3 tests in ~12 seconds**

---

## 🔧 **Bug Fix Applied (Jan 5, 2026)**

**Issue:** Imported documents showed content in outline but editor was empty.

**Root Cause:** 
- `useTipTapEditor` hook wasn't properly waiting for editor view to mount
- XmlFragment check needed before attempting to set content

**Fix Applied:**
1. Added robust retry mechanism in `useTipTapEditor.ts`
2. Added XmlFragment existence check before setting content
3. Improved logging for debugging hydration flow

---

## 🎯 **Test Suite Details**

### **1. ✅ PASTE PERSISTENCE (Passing)**
```bash
# Test File: e2e/paste-and-diagrams.spec.ts
# Test: "MUST persist content after paste"
# Duration: ~3s
# Purpose: Ensures CRDT data survives browser refresh
```

### **2. ✅ IMPORT FUNCTIONALITY (Passing)**
```bash
# Test File: e2e/import-flow.spec.ts
# Test: "MUST import markdown file and show content in editor"
# Duration: ~4s
# Purpose: Most used feature - import documents from file system
```

### **3. ✅ IMPORT PERSISTENCE (Passing)**
```bash
# Test File: e2e/import-flow.spec.ts
# Test: "MUST persist imported content after refresh"
# Duration: ~5s
# Purpose: Imported content survives page refresh
```

---

## 📁 **Import Test Implementation**

Create file: `frontend/e2e/import-flow.spec.ts`

```typescript
/**
 * IMPORT FLOW TEST
 *
 * Tests the most critical user journey: importing documents
 * Should run on every commit to prevent regressions
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Import Flow - Critical User Journey', () => {
  test.beforeEach(async ({ page, storage }) => {
    await page.goto('/workspace');
    await storage.clearAll(); // Clean state
  });

  test('MUST import file and show content in editor', async ({ page, workspace, editor }) => {
    // ✅ Step 1: Wait for workspace to load
    await workspace.waitForWorkspace();

    // ✅ Step 2: Click import button
    console.log('📁 Clicking import button...');
    await page.click('[data-testid="import-document-button"]');

    // ✅ Step 3: Upload test file (simple.md contains "Hello World")
    console.log('📤 Uploading test file...');
    const fileInput = page.locator('input[type="file"][accept*=".md"]');
    await fileInput.setInputFiles('e2e/fixtures/simple.md');  // Path relative to project root

    // ✅ Step 4: Wait for file processing and auto-navigation
    console.log('⏳ Waiting for document creation and navigation...');
    await page.waitForURL('**/workspace/doc/**/edit', { timeout: 15000 });

    // ✅ Step 5: Wait for editor to load
    console.log('📝 Waiting for editor to load...');
    await editor.waitForEditor();

    // ✅ Step 6: Wait for content hydration (critical!)
    console.log('💧 Waiting for content to hydrate...');
    await page.waitForTimeout(3000); // Give hydration time

    // ✅ Step 7: Verify content appears in editor
    console.log('🔍 Checking editor content...');
    const editorContent = await editor.getEditorContent();
    console.log('📄 Editor content:', editorContent);

    expect(editorContent).toContain('Hello World');
    expect(editorContent).toContain('This is a simple test document');

    console.log('✅ IMPORT TEST PASSED: Content loaded successfully');
  });

  test('MUST handle import errors gracefully', async ({ page, workspace }) => {
    await workspace.waitForWorkspace();

    // Try importing unsupported file type
    await page.click('[data-testid="import-document-button"]');
    const fileInput = page.locator('input[type="file"]');

    // Create a fake unsupported file
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should show error and not crash
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    // Should contain error content
    await expect(toast).toContainText('Unsupported file type');
  });
});
```

---

## 📁 **Basic Editor Test Implementation**

Create file: `frontend/e2e/editor-basics.spec.ts`

```typescript
/**
 * EDITOR BASICS TEST
 *
 * Tests fundamental editor functionality
 * Should run on every commit
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Editor Basics - Core Functionality', () => {
  test.beforeEach(async ({ page, storage }) => {
    await page.goto('/workspace');
    await storage.clearAll();
  });

  test('MUST create document and edit content', async ({ page, workspace, editor }) => {
    await workspace.waitForWorkspace();

    // Create document
    await workspace.createDocument('Editor Test', 'markdown');
    await editor.waitForEditor();

    // Type content
    const testContent = 'This is a test of basic editor functionality.';
    await editor.typeInEditor(testContent);

    // Verify content appears
    const content = await editor.getEditorContent();
    expect(content).toContain(testContent);

    // Refresh and verify persistence
    await page.reload();
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });

    const refreshedContent = await editor.getEditorContent();
    expect(refreshedContent).toContain(testContent);
  });
});
```

---

## 🛠 **How to Run and See the Tests**

### **Option 1: Run Pre-commit Tests Manually**

```bash
# Run the current pre-commit test (paste only)
./test-paste.sh

# Or run the test directly
npx playwright test e2e/paste-and-diagrams.spec.ts --headed --slowMo=1000
```

### **Option 2: Run Tests with Visual Feedback**

```bash
# Run tests in UI mode (see step-by-step execution)
npm run test:e2e:ui

# Or run specific test file
npx playwright test e2e/paste-and-diagrams.spec.ts --ui
```

### **Option 3: Run Tests in Browser (Debug Mode)**

```bash
# Run test in browser with dev tools
npx playwright test e2e/paste-and-diagrams.spec.ts --debug

# Or run and record video
npx playwright test e2e/paste-and-diagrams.spec.ts --video=on
```

### **Option 4: Watch Test Execution Live**

```bash
# Run with slow motion and screenshots
npx playwright test e2e/paste-and-diagrams.spec.ts --headed --slowMo=2000 --screenshot=on
```

### **Option 5: See Test Results and Traces**

```bash
# Generate HTML report after test run
npx playwright show-report

# Or run with tracing
npx playwright test e2e/paste-and-diagrams.spec.ts --trace=on
```

---

## 🔧 **Updating the Pre-commit Hook**

### **Current Hook** (`.git/hooks/pre-commit`)

```bash
#!/bin/bash

echo "🔒 Running pre-commit E2E tests..."

# Check if dev server is running
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "⚠️  Dev server not running - skipping tests"
    echo "   (Run manually: ./test-critical.sh)"
    exit 0
fi

# Run critical tests (paste + import + editor)
./test-critical.sh

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED - Critical tests failed"
    echo "   Fix the issues and try again"
    exit 1
fi

echo "✅ Pre-commit tests passed"
exit 0
```

### **New Test Script** (`test-critical.sh`)

```bash
#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║      CRITICAL E2E TESTS - PRE-COMMIT          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "🔍 Checking if dev server is running..."
if ! curl -s http://localhost:5174 > /dev/null; then
    echo "❌ Dev server not running on http://localhost:5174"
    echo "   Run: npm run dev"
    exit 1
fi
echo "✅ Dev server is running"
echo ""

# Run critical tests in parallel for speed
echo "🧪 Running critical tests..."
echo ""

npx playwright test \
  e2e/paste-and-diagrams.spec.ts \
  e2e/import-flow.spec.ts \
  e2e/editor-basics.spec.ts \
  --workers=3 \
  --reporter=list

# Check results
if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ✅ ALL CRITICAL TESTS PASSED ✅      ║"
    echo "║                                                ║"
    echo "║   Core functionality is working correctly!    ║"
    echo "║   Safe to commit.                             ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 0
else
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ❌ CRITICAL TESTS FAILED ❌           ║"
    echo "║                                                ║"
    echo "║   DO NOT COMMIT!                              ║"
    echo "║   Fix the broken core functionality first.    ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 1
fi
```

---

## 🎬 **Test Execution Preview**

### **What You'll See When Tests Run:**

```
🔒 Running pre-commit E2E tests...
🔍 Checking if dev server is running...
✅ Dev server is running

🧪 Running critical tests...

Running 3 tests using 3 workers
  ✓ paste-and-diagrams.spec.ts: "MUST persist content after paste" (12.3s)
  ✓ import-flow.spec.ts: "MUST import file and show content in editor" (15.7s)
  ✓ editor-basics.spec.ts: "MUST create document and edit content" (8.9s)

✅ ALL CRITICAL TESTS PASSED ✅
Core functionality is working correctly!
Safe to commit.
```

### **With `--headed` flag, you'll see:**
- Browser opens and navigates to `/workspace`
- Click on "New Document" button
- Fill document title
- Click "Create Blank Markdown"
- Wait for editor to load
- Paste content using clipboard simulation
- Browser refreshes
- Content appears again ✅

---

## 📊 **Test Coverage Strategy**

### **Pre-commit Tests (Fast, Critical)**
- ✅ Paste persistence (CRDT invariant)
- ✅ Import functionality (most used feature)
- ✅ Basic editor (core functionality)
- **Total time:** ~30-40 seconds

### **Full E2E Suite (CI/PR)**
- All current E2E tests (auth, guest, sync flows)
- Performance tests
- Cross-browser tests
- **Total time:** 3-5 minutes

### **Unit Tests (CI/PR)**
- Component tests
- Service tests
- Utility tests
- **Total time:** 1-2 minutes

---

## 🚀 **Quick Implementation**

**To add import test to pre-commit:**

1. **Create the test file:**
   ```bash
   # Create frontend/e2e/import-flow.spec.ts with the code above
   ```

2. **Update pre-commit hook:**
   ```bash
   # Edit .git/hooks/pre-commit to run test-critical.sh instead of test-paste.sh
   ```

3. **Create test-critical.sh:**
   ```bash
   # Create the script above to run all three critical tests
   ```

**Result:** Every commit will test the 3 most critical user journeys in ~30 seconds.

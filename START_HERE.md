# ⚡ START HERE - Your Exact Next Steps

**Stop reading. Start executing. This is your linear checklist.**

---

## Step 1: Install Testing Tools (2 minutes)

Copy-paste these commands:

```bash
# Core testing
npm install -D @playwright/test @vitest/ui @vitest/browser

# React testing
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Playwright browsers
npx playwright install chromium
```

**Wait for install to finish. Then continue.**

---

## Step 2: Add Test Scripts to package.json (1 minute)

Open `package.json` and add these scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Save the file. Then continue.**

---

## Step 3: Create Playwright Config (1 minute)

Create a new file `playwright.config.ts` in your project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

**Save the file. Then continue.**

---

## Step 4: Write Your First Test (2 minutes)

Create a new folder and file: `e2e/mindmap-critical.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('mindmap button exists and opens modal', async ({ page }) => {
  // Go to workspace
  await page.goto('http://localhost:5173/workspace');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Look for mindmap button
  const mindmapButton = page.getByRole('button', { name: /mindmap/i });
  
  // Test 1: Button exists
  await expect(mindmapButton).toBeVisible();
  console.log('✅ Mindmap button found!');
  
  // Test 2: Button is clickable
  await expect(mindmapButton).toBeEnabled();
  console.log('✅ Mindmap button is enabled!');
  
  console.log('🎉 Critical test passed - your mindmap integration is intact!');
});
```

**Save the file. Then continue.**

---

## Step 5: Start Dev Server (1 minute)

Open Terminal 1:

```bash
npm run dev
```

**Leave this terminal running. Open a new terminal. Then continue.**

---

## Step 6: Run Your First Test (1 minute)

Open Terminal 2 and run:

```bash
npm run test:e2e:ui
```

This will:
1. Open Playwright's UI
2. Show your test
3. Click the green play button
4. Watch it run

**Expected result:**
```
✅ Mindmap button found!
✅ Mindmap button is enabled!
🎉 Critical test passed
```

**If you see this → Continue to Step 7**

**If test fails → Stop and tell me what error you see**

---

## Step 7: Celebrate (10 seconds)

You just:
- ✅ Installed testing tools
- ✅ Wrote your first E2E test
- ✅ Verified mindmap integration works
- ✅ Created your safety net

**Now you're ready to refactor.**

---

## Step 8: Your First Refactoring Task (Week 1)

Now that tests are running, here's your FIRST refactoring task:

### Task: Create Zustand Store for UI State

**Why this first?**
- Low risk (UI state only)
- No business logic
- Easy to test
- Easy to rollback

**What you'll do:**

1. Create `src/stores/editorUIStore.ts`
2. Move sidebar/modal state to Zustand
3. Test it
4. Use it in ONE component
5. If it works → expand usage
6. If it breaks → revert

**Time: 3-4 hours**

---

## Step 9: Create the Zustand Store (Copy-Paste)

Create `src/stores/editorUIStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface EditorUIState {
  // Sidebar & Modal State
  isSidebarOpen: boolean;
  activeModal: 'ai' | 'diagram' | 'settings' | 'export' | null;
  isMinimized: boolean;
  
  // Actions
  toggleSidebar: () => void;
  openModal: (modal: EditorUIState['activeModal']) => void;
  closeModal: () => void;
  toggleMinimized: () => void;
}

export const useEditorUIStore = create<EditorUIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isSidebarOpen: false,
        activeModal: null,
        isMinimized: false,
        
        // Actions
        toggleSidebar: () => set((state) => ({ 
          isSidebarOpen: !state.isSidebarOpen 
        })),
        
        openModal: (modal) => set({ activeModal: modal }),
        
        closeModal: () => set({ activeModal: null }),
        
        toggleMinimized: () => set((state) => ({ 
          isMinimized: !state.isMinimized 
        })),
      }),
      { name: 'editor-ui-store' }
    )
  )
);
```

**Save the file. Then continue.**

---

## Step 10: Test the Store

Create `src/stores/__tests__/editorUIStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorUIStore } from '../editorUIStore';

describe('editorUIStore', () => {
  beforeEach(() => {
    // Reset store
    useEditorUIStore.setState({
      isSidebarOpen: false,
      activeModal: null,
      isMinimized: false,
    });
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useEditorUIStore.getState();
    
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(false);
    
    toggleSidebar();
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(true);
    
    toggleSidebar();
    expect(useEditorUIStore.getState().isSidebarOpen).toBe(false);
  });

  it('should open modal', () => {
    const { openModal } = useEditorUIStore.getState();
    
    openModal('ai');
    expect(useEditorUIStore.getState().activeModal).toBe('ai');
  });

  it('should close modal', () => {
    const { openModal, closeModal } = useEditorUIStore.getState();
    
    openModal('ai');
    closeModal();
    expect(useEditorUIStore.getState().activeModal).toBe(null);
  });
});
```

**Save the file. Then continue.**

---

## Step 11: Run the Store Test

Open Terminal 3:

```bash
npm run test:watch
```

**Expected result:**
```
✅ editorUIStore > should toggle sidebar
✅ editorUIStore > should open modal
✅ editorUIStore > should close modal

Tests: 3 passed (3)
```

**If you see this → Continue to Step 12**

**If tests fail → Stop and tell me what error**

---

## Step 12: Use the Store in One Component (Smallest Change)

Open `src/components/editor/WYSIWYGEditor.tsx`

Find this line (around line 1293):
```typescript
const [showAISidebar, setShowAISidebar] = useState(false);
```

**Change it to:**
```typescript
// OLD: const [showAISidebar, setShowAISidebar] = useState(false);
// NEW: Use Zustand store
const { isSidebarOpen, toggleSidebar } = useEditorUIStore();
```

Add import at top:
```typescript
import { useEditorUIStore } from '@/stores/editorUIStore';
```

Find where `setShowAISidebar` is used (around line 2779):
```typescript
// OLD:
onToggle={() => setShowAISidebar(!showAISidebar)}

// NEW:
onToggle={toggleSidebar}
```

And change the prop (around line 2778):
```typescript
// OLD:
isOpen={showAISidebar}

// NEW:
isOpen={isSidebarOpen}
```

**Save the file.**

---

## Step 13: Test It Manually

1. Go to http://localhost:5173/workspace
2. Create a new document
3. Click "AI Assistant" button
4. Sidebar should open
5. Click close button
6. Sidebar should close

**Does it work?**
- ✅ YES → Continue to Step 14
- ❌ NO → Stop and tell me what broke

---

## Step 14: Run E2E Test Again

Back in Terminal 2 (Playwright UI), click the green play button again.

**Expected result:**
```
✅ Mindmap button found!
✅ Mindmap button is enabled!
🎉 Critical test passed
```

**If this STILL passes → YOU DID IT! Continue to Step 15**

**If it fails → We broke something, revert the changes**

---

## Step 15: Commit Your First Refactoring

```bash
git add .
git commit -m "refactor(week1): add Zustand store for editor UI state

- Create editorUIStore with sidebar/modal state
- Add unit tests (3 tests, all passing)
- Migrate showAISidebar to use store
- E2E tests still passing (mindmap integration intact)
"
```

---

## Step 16: What You Just Accomplished

✅ Installed testing tools
✅ Created your first E2E test (mindmap protection)
✅ Created Zustand store
✅ Wrote unit tests
✅ Made your first refactoring
✅ Verified nothing broke
✅ Committed safely

**This is the refactoring loop:**
1. Write test
2. Make change
3. Tests auto-run
4. If pass → commit
5. If fail → fix or revert
6. Repeat

---

## Step 17: Next Steps (After This)

You've completed **10%** of Week 1. Next:

1. Migrate more state to Zustand:
   - `activeModal` state
   - `isMinimized` state
   - `showKeyboardShortcuts` state

2. Add more tests as you go

3. Keep E2E test running (Terminal 2)

4. Keep unit tests running (Terminal 3)

**Time for full Week 1: ~3 days**

---

## Your 3 Terminals (Keep These Running)

```
Terminal 1: npm run dev          (Dev server)
Terminal 2: npm run test:e2e:ui  (E2E tests - Playwright)
Terminal 3: npm run test:watch   (Unit tests - Vitest)
```

**Never close these. They're your safety net.**

---

## If Something Breaks

### E2E Test Fails:
```bash
# See what broke
Look at Playwright UI in Terminal 2
Check the screenshots
Fix the code
Re-run test
```

### Unit Test Fails:
```bash
# See what broke
Look at Terminal 3
Read the error
Fix the code
Test re-runs automatically
```

### Mindmap Button Breaks:
```bash
# Emergency: Revert immediately
git revert HEAD

# Then debug:
# What did you change?
# Did you touch Workspace.tsx? (OFF LIMITS)
# Did you touch UnifiedDiagramModal.tsx? (OFF LIMITS)
```

---

## The Golden Rule

> **"If tests aren't running, stop coding."**

If Terminal 2 or 3 isn't showing green checks, you're flying blind.

---

## When You're Ready for Week 2

After you finish Week 1 (Zustand store migration):

1. Read Week 2 in `REFACTORING_PLAN_V2.md`
2. Week 2 = Merge the two AI sidebars
3. Follow the same loop: test → change → verify → commit

---

## Summary: What to Do RIGHT NOW

```bash
# 1. Install (Terminal 1)
npm install -D @playwright/test @vitest/ui @testing-library/react

# 2. Install browsers
npx playwright install chromium

# 3. Create playwright.config.ts (copy from Step 3 above)

# 4. Create e2e/mindmap-critical.spec.ts (copy from Step 4 above)

# 5. Start dev server (Terminal 1)
npm run dev

# 6. Run E2E test (Terminal 2)
npm run test:e2e:ui

# 7. Create Zustand store (copy from Step 9 above)

# 8. Create store test (copy from Step 10 above)

# 9. Run unit tests (Terminal 3)
npm run test:watch

# 10. Make first change (Step 12 above)

# 11. Test manually (Step 13)

# 12. Commit (Step 15)

# 13. Keep going (migrate more state)
```

**Time: 30 minutes to get to first commit**

---

## Questions?

**"What if install fails?"**
→ Tell me the error

**"What if tests fail?"**
→ Tell me the error

**"What if I break something?"**
→ `git revert HEAD`

**"What do I do after Week 1?"**
→ Read Week 2 in `REFACTORING_PLAN_V2.md`

---

**NOW GO EXECUTE STEP 1. STOP READING AND START TYPING.** ⚡


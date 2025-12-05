# 🚀 Refactoring Quickstart: Your 5-Minute Setup

> **TL;DR**: Set up continuous testing in 5 commands, then refactor with confidence.

---

## Step 1: Install (2 minutes)

```bash
# Core testing tools
npm install -D @playwright/test @vitest/ui @vitest/browser

# React testing
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Playwright browsers
npx playwright install chromium

# Optional: Visual regression
npm install -D chromatic
```

---

## Step 2: Configure (Copy-Paste)

### Update `vitest.config.ts`:

Add this to your existing config:

```typescript
export default defineConfig({
  // ... existing config ...
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    watch: true, // ← Enable watch mode
    ui: true,    // ← Enable UI
  },
});
```

### Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

---

## Step 3: Add Scripts to `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:watch": "playwright test --ui",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## Step 4: Your First Test (Critical Flow)

Create `e2e/mindmap-integration.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('mindmap button works', async ({ page }) => {
  await page.goto('/workspace');
  
  // Create new doc
  await page.getByRole('button', { name: /new document/i }).click();
  
  // Type content
  await page.locator('.ProseMirror').click();
  await page.keyboard.type('# Test\n## Subtopic');
  
  // Click mindmap button
  await page.getByRole('button', { name: /mindmap/i }).click();
  
  // Verify modal opens
  await expect(page.getByRole('dialog')).toBeVisible();
  
  console.log('✅ Mindmap integration works!');
});
```

---

## Step 5: Start Testing (The Magic)

Open **3 terminals**:

```bash
# Terminal 1: Dev server
npm run dev
```

```bash
# Terminal 2: Unit tests (watch mode)
npm run test:watch
```

```bash
# Terminal 3: E2E tests (UI mode)
npm run test:e2e:watch
```

---

## The Refactoring Loop

```
┌──────────────────────────────────────────┐
│  1. Make a change                        │
│     (extract component, refactor, etc)   │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  2. Unit tests auto-run                  │
│     Watch mode catches changes instantly │
└──────────────┬───────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
      PASS ✅      FAIL ❌
         │           │
         │     ┌─────┴─────┐
         │     │ Fix now!  │
         │     └─────┬─────┘
         │           │
         └───────┬───┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  3. Commit                               │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  4. Run E2E tests                        │
│     npm run test:e2e                     │
└──────────────┬───────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
      PASS ✅      FAIL ❌
         │           │
         │     ┌─────┴─────┐
         │     │ Fix now!  │
         │     └─────┬─────┘
         │           │
         └───────┬───┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  5. Push                                 │
│     git push                             │
└──────────────────────────────────────────┘
```

---

## The Golden Rules

1. **Tests always running** - If they're not, start them
2. **Fix failures immediately** - Don't accumulate debt
3. **Test mindmap button daily** - It's your canary
4. **Commit when tests pass** - Not before
5. **Visual test before push** - Keep it beautiful

---

## Quick Commands Reference

```bash
# Start watching (do this first!)
npm run test:watch        # Unit tests
npm run test:e2e:watch    # E2E tests

# Run once (for commits)
npm run test:all          # Everything

# Debug failing tests
npm run test:ui           # Unit tests with UI
npm run test:e2e:debug    # E2E tests in debug mode

# Visual regression
npm run test:visual       # Check for UI changes
npm run test:visual:update # Accept new UI
```

---

## What Success Looks Like

```
Terminal Output:

✅ Unit tests: 47 passed (2.3s)
✅ E2E tests: 12 passed (15s)
✅ Visual tests: No changes detected

Git Status:
 M src/hooks/useEditorSetup.ts
 A src/hooks/__tests__/useEditorSetup.test.ts

Ready to commit? YES ✅
```

---

## Emergency: Tests Failing?

### Unit test fails:
```bash
npm run test:ui  # See what failed visually
# Fix the code
# Tests re-run automatically
```

### E2E test fails:
```bash
npm run test:e2e:headed  # See browser
# Look at screenshots in test-results/
# Fix the code
npm run test:e2e  # Re-run
```

### Visual test fails:
```bash
# Check the diff
ls playwright-report/

# Is change intentional?
npm run test:visual:update  # If YES
# Fix CSS                   # If NO
```

---

## Week 1 Checklist

Before you start refactoring Week 1 (Zustand store):

- [ ] All tests installed
- [ ] 3 terminals open (dev, unit, e2e)
- [ ] Tests are running
- [ ] Mindmap button test passes
- [ ] You understand the refactoring loop

**If all checked → Start refactoring!**

---

## The Philosophy

> **"Tests are not documentation of what the code does.  
> Tests are documentation of what the code SHOULD do.  
> When they fail, reality diverged from expectations.  
> Fix reality immediately."**

---

## Next Steps

1. ✅ Install tools (done above)
2. ✅ Configure (done above)
3. ✅ Write first test (done above)
4. **→ Run `npm run test:watch` and `npm run test:e2e:watch`**
5. **→ Open `REFACTORING_PLAN_V2.md` and start Week 1**

---

**Now you're ready. Go refactor with confidence. The tests have your back.** 🚀


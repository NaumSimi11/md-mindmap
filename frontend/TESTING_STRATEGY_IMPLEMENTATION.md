# 🧪 Testing Strategy: Refactor Without Breaking Shit

> **Philosophy**: "Tests are your safety net. Without them, refactoring is just breaking things with extra steps."

---

## TL;DR - What You Need

```bash
# 1. Install testing tools
npm install -D @playwright/test @vitest/ui playwright-chromatic

# 2. Run tests continuously while refactoring
npm run test:watch     # Unit tests in terminal
npm run test:ui        # Unit tests with UI
npm run test:e2e:watch # E2E tests in watch mode

# 3. Before committing
npm run test:all       # Run everything
npm run test:visual    # Check for visual regressions
```

**That's it. Keep tests running, refactor confidently.**

---

## Part 1: The Testing Pyramid (Your 3-Layer Defense)

```
        /\
       /  \        ← E2E Tests (10%)
      /____\         "Does the whole app work?"
     /      \
    /        \     ← Integration Tests (30%)
   /__________\      "Do components work together?"
  /            \
 /   UNIT (60%) \  ← Unit Tests
/________________\   "Does this function work?"
```

### What Each Layer Does

| Layer | What | Tool | Speed | When to Run |
|-------|------|------|-------|-------------|
| **Unit** | Functions, hooks, stores | Vitest | ⚡ <100ms | Every file save |
| **Integration** | Component + state + API | Vitest Browser | 🏃 <1s | Every commit |
| **E2E** | Full user journeys | Playwright | 🐢 <10s | Before push |
| **Visual** | UI looks correct | Playwright + Chromatic | 🐌 <30s | Before push |

---

## Part 2: Setup (Copy-Paste This)

### Step 1: Install Everything

```bash
# Core testing
npm install -D @playwright/test @vitest/ui @vitest/browser

# Providers for browser testing
npm install -D playwright @playwright/browser-chromium @playwright/browser-firefox @playwright/browser-webkit

# React testing utilities
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Visual regression (optional but recommended)
npm install -D chromatic

# TipTap testing utilities
npm install -D @tiptap/pm
```

### Step 2: Configure Vitest (Unit + Integration)

Create `vitest.config.ts` (already exists, update it):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Globals
    globals: true,
    
    // Environment
    environment: 'jsdom', // For component tests
    
    // Setup file
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    
    // Watch options
    watch: true, // Enable watch mode by default
    
    // UI (for visual test running)
    ui: true,
    open: false, // Don't auto-open browser
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 2,
    
    // Timeout
    testTimeout: 10000, // 10 seconds
    
    // Browser mode for component testing
    browser: {
      enabled: false, // Enable only when needed
      name: 'chromium',
      provider: 'playwright',
      headless: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 3: Configure Playwright (E2E + Visual)

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Parallel execution
  fullyParallel: true,
  
  // Fail build on CI if tests are flaky
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Shared settings
  use: {
    // Base URL
    baseURL: 'http://localhost:5173',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Video
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes
  },
});
```

### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    
    "// ===== UNIT TESTS =====": "",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    
    "// ===== E2E TESTS =====": "",
    "test:e2e": "playwright test",
    "test:e2e:watch": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    
    "// ===== VISUAL TESTS =====": "",
    "test:visual": "playwright test --grep '@visual'",
    "test:visual:update": "playwright test --grep '@visual' --update-snapshots",
    
    "// ===== ALL TESTS =====": "",
    "test:all": "npm run test:run && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e && npm run test:visual"
  }
}
```

---

## Part 3: Write Your First Tests

### 3.1 Unit Test Example (Zustand Store)

```typescript
// src/stores/__tests__/editorUIStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorUIStore } from '../editorUIStore';

describe('editorUIStore', () => {
  beforeEach(() => {
    // Reset store before each test
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
    
    openModal('diagram');
    expect(useEditorUIStore.getState().activeModal).toBe('diagram');
  });

  it('should close modal', () => {
    const { openModal, closeModal } = useEditorUIStore.getState();
    
    openModal('ai');
    expect(useEditorUIStore.getState().activeModal).toBe('ai');
    
    closeModal();
    expect(useEditorUIStore.getState().activeModal).toBe(null);
  });
});
```

### 3.2 Component Test Example (Toolbar Button)

```typescript
// src/components/editor/toolbar/__tests__/ToolbarButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolbarButton } from '../ToolbarButton';
import { Bold } from 'lucide-react';

describe('ToolbarButton', () => {
  it('should render button with icon', () => {
    const action = {
      icon: Bold,
      label: 'Bold',
      action: vi.fn(),
      isActive: false,
    };

    render(<ToolbarButton action={action} />);
    
    const button = screen.getByRole('button', { name: /bold/i });
    expect(button).toBeInTheDocument();
  });

  it('should call action when clicked', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();
    
    const action = {
      icon: Bold,
      label: 'Bold',
      action: mockAction,
      isActive: false,
    };

    render(<ToolbarButton action={action} />);
    
    const button = screen.getByRole('button', { name: /bold/i });
    await user.click(button);
    
    expect(mockAction).toHaveBeenCalledOnce();
  });

  it('should show active state', () => {
    const action = {
      icon: Bold,
      label: 'Bold',
      action: vi.fn(),
      isActive: true,
    };

    render(<ToolbarButton action={action} />);
    
    const button = screen.getByRole('button', { name: /bold/i });
    expect(button).toHaveClass('bg-primary'); // or whatever your active class is
  });

  it('should be disabled when specified', () => {
    const action = {
      icon: Bold,
      label: 'Bold',
      action: vi.fn(),
      isActive: false,
      isDisabled: true,
    };

    render(<ToolbarButton action={action} />);
    
    const button = screen.getByRole('button', { name: /bold/i });
    expect(button).toBeDisabled();
  });
});
```

### 3.3 Integration Test Example (Editor Hook)

```typescript
// src/hooks/__tests__/useEditorSetup.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEditorSetup } from '../useEditorSetup';

describe('useEditorSetup', () => {
  it('should initialize editor with content', async () => {
    const { result } = renderHook(() =>
      useEditorSetup({
        content: '<p>Hello World</p>',
        onUpdate: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.getHTML()).toContain('Hello World');
  });

  it('should call onUpdate when content changes', async () => {
    const mockOnUpdate = vi.fn();
    
    const { result } = renderHook(() =>
      useEditorSetup({
        content: '<p>Initial</p>',
        onUpdate: mockOnUpdate,
      })
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    // Make a change
    result.current?.commands.setContent('<p>Updated</p>');

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should support all required extensions', async () => {
    const { result } = renderHook(() =>
      useEditorSetup({
        content: '',
        onUpdate: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const editor = result.current!;
    
    // Check for key extensions
    expect(editor.isActive('bold')).toBeDefined();
    expect(editor.isActive('italic')).toBeDefined();
    expect(editor.isActive('table')).toBeDefined();
    expect(editor.isActive('taskList')).toBeDefined();
  });
});
```

### 3.4 E2E Test Example (Mindmap Flow)

```typescript
// e2e/mindmap-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Editor → Mindmap Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    // Create new document
    await page.getByRole('button', { name: /new document/i }).click();
    await page.getByRole('textbox', { name: /title/i }).fill('Test Document');
    await page.getByRole('button', { name: /create/i }).click();
  });

  test('should open mindmap modal from editor', async ({ page }) => {
    // Type some content
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('# Project Plan\n## Phase 1\n## Phase 2');
    
    // Click mindmap button
    await page.getByRole('button', { name: /mindmap/i }).click();
    
    // Verify modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/quick insert/i)).toBeVisible();
    await expect(page.getByText(/ai generate/i)).toBeVisible();
    await expect(page.getByText(/open studio/i)).toBeVisible();
  });

  test('should quick insert mermaid diagram', async ({ page }) => {
    // Type content
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('# Main Topic\n## Subtopic 1\n## Subtopic 2');
    
    // Open mindmap modal
    await page.getByRole('button', { name: /mindmap/i }).click();
    
    // Click Quick Insert
    await page.getByRole('button', { name: /quick insert/i }).click();
    
    // Wait for mermaid code to be inserted
    await expect(page.locator('.ProseMirror')).toContainText('```mermaid');
    await expect(page.locator('.ProseMirror')).toContainText('Main Topic');
  });

  test('should switch to mindmap studio', async ({ page }) => {
    // Type content
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('# Project\n## Task 1\n## Task 2');
    
    // Open mindmap modal
    await page.getByRole('button', { name: /mindmap/i }).click();
    
    // Click Open Studio
    await page.getByRole('button', { name: /open studio/i }).click();
    
    // Verify URL changed
    await expect(page).toHaveURL(/\/workspace\/doc\/[^/]+\/mindmap/);
    
    // Verify mindmap studio loaded
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should persist changes when returning from mindmap', async ({ page }) => {
    // Type content
    const originalContent = '# Original Content\n## Section 1';
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(originalContent);
    
    // Switch to mindmap
    await page.getByRole('button', { name: /mindmap/i }).click();
    await page.getByRole('button', { name: /open studio/i }).click();
    
    // Wait for mindmap to load
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // Go back to editor
    await page.goBack();
    
    // Verify content persisted
    await expect(page.locator('.ProseMirror')).toContainText('Original Content');
    await expect(page.locator('.ProseMirror')).toContainText('Section 1');
  });
});
```

### 3.5 Visual Regression Test Example

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests @visual', () => {
  test('editor should look correct', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: /new document/i }).click();
    
    // Wait for editor to load
    await expect(page.locator('.ProseMirror')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('editor-empty.png', {
      fullPage: true,
      mask: [
        page.locator('.timestamp'), // Mask dynamic content
        page.locator('.user-avatar'),
      ],
    });
  });

  test('toolbar should look correct', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: /new document/i }).click();
    
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();
    
    // Screenshot just the toolbar
    await expect(toolbar).toHaveScreenshot('toolbar.png', {
      animations: 'disabled',
    });
  });

  test('mindmap studio should look correct', async ({ page }) => {
    await page.goto('/workspace');
    // Create doc and navigate to mindmap
    // ... setup code ...
    
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // Wait for layout to stabilize
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mindmap-studio.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow some diff for animations
    });
  });

  test('AI sidebar should look correct', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: /new document/i }).click();
    
    // Open AI sidebar
    await page.getByRole('button', { name: /ai assistant/i }).click();
    
    const sidebar = page.locator('[data-testid="ai-sidebar"]');
    await expect(sidebar).toBeVisible();
    
    await expect(sidebar).toHaveScreenshot('ai-sidebar.png', {
      mask: [
        page.locator('.typing-indicator'), // Mask animations
      ],
    });
  });
});
```

---

## Part 4: The Continuous Testing Workflow

### The Golden Rule

**"If tests aren't running, you're not refactoring—you're guessing."**

### Your Daily Workflow

#### Terminal Setup (3 terminals)

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Unit tests (watch mode)
npm run test:watch

# Terminal 3: E2E tests (UI mode)
npm run test:e2e:watch
```

#### What You See

```
┌─────────────────────────────────────────────┐
│ Terminal 1: Dev Server                      │
│ > vite dev                                  │
│   VITE v5.4.19  ready in 234 ms            │
│   ➜  Local:   http://localhost:5173/       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Terminal 2: Unit Tests (Vitest)            │
│ PASS  src/stores/__tests__/editorUIStore   │
│ PASS  src/hooks/__tests__/useEditorSetup   │
│ PASS  src/components/toolbar/__tests__/... │
│                                             │
│ Tests: 47 passed (47)                       │
│ Time:  2.34s                                │
│                                             │
│ Watching for changes...                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Terminal 3: E2E Tests (Playwright)         │
│ Running 3 tests using 1 worker             │
│ ✓ mindmap-integration.spec.ts:12 (5s)     │
│ ✓ mindmap-integration.spec.ts:34 (3s)     │
│ ✓ mindmap-integration.spec.ts:56 (4s)     │
│                                             │
│ 3 passed (12s)                              │
│                                             │
│ Press 'r' to re-run tests                   │
└─────────────────────────────────────────────┘
```

### The Refactoring Loop

```
1. Make a change (extract component)
   ↓
2. Unit tests re-run automatically ← Watch mode catches it
   ↓
3. Tests pass? ✅ Continue
   Tests fail? ❌ Fix immediately
   ↓
4. Commit
   ↓
5. Run E2E tests (npm run test:e2e)
   ↓
6. Tests pass? ✅ Push
   Tests fail? ❌ Fix immediately
```

### Key Principle: **Fail Fast**

```
BAD WORKFLOW ❌                  GOOD WORKFLOW ✅
┌─────────────┐                 ┌─────────────┐
│ Refactor    │                 │ Start tests │
│ for 4 hours │                 │             │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ↓                               ↓
┌─────────────┐                 ┌─────────────┐
│ Run tests   │                 │ Refactor 1  │
│             │                 │ component   │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ↓                               ↓
┌─────────────┐                 ┌─────────────┐
│ 37 tests    │                 │ Tests re-run│
│ FAILED 😱   │                 │ PASS ✅     │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ↓                               ↓
┌─────────────┐                 ┌─────────────┐
│ Debug for   │                 │ Commit      │
│ 2 more hrs  │                 │ Immediately │
└─────────────┘                 └─────────────┘

Time to fix: 6 hours            Time to fix: 0 seconds
Frustration: Maximum            Frustration: Zero
```

---

## Part 5: Visual Regression Testing (Keep It Beautiful)

### Why Visual Testing Matters

Your app needs to look "fking awesome" (your words). Visual regression tests catch:
- Broken CSS
- Layout shifts
- Color changes
- Font issues
- Spacing problems
- Animation glitches

### Setup Chromatic (Recommended)

```bash
# Install
npm install -D chromatic

# Set up (get token from chromatic.com)
npx chromatic --project-token=<your-token>

# Add to package.json
{
  "scripts": {
    "test:visual": "chromatic --exit-zero-on-changes"
  }
}
```

### Alternative: Playwright Visual Testing

```typescript
// e2e/visual/components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests @visual', () => {
  test('button styles', async ({ page }) => {
    await page.goto('/design-system/buttons');
    
    const button = page.getByRole('button', { name: /primary/i });
    await expect(button).toHaveScreenshot('button-primary.png');
    
    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot('button-primary-hover.png');
    
    // Active state
    await button.click();
    await expect(button).toHaveScreenshot('button-primary-active.png');
  });

  test('dark mode vs light mode', async ({ page }) => {
    // Light mode
    await page.goto('/workspace');
    await expect(page).toHaveScreenshot('workspace-light.png');
    
    // Switch to dark mode
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    // Dark mode
    await expect(page).toHaveScreenshot('workspace-dark.png');
  });
});
```

### Update Snapshots

```bash
# When you intentionally change design
npm run test:visual:update

# Or in Playwright
npx playwright test --update-snapshots
```

---

## Part 6: CI/CD Integration (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  visual-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run visual tests
        run: npm run test:visual
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## Part 7: The Pre-Commit Checklist

### Before Every Commit

```bash
# 1. Run unit tests
npm run test:run

# 2. Run E2E for changed features
npm run test:e2e -- mindmap-integration.spec.ts

# 3. Check visual changes (if UI changed)
npm run test:visual

# 4. If all pass → commit
git add .
git commit -m "refactor: extract toolbar hook"
```

### Automate with Husky (Optional)

```bash
# Install
npm install -D husky lint-staged

# Initialize
npx husky init

# Create pre-commit hook
echo "npm run test:run" > .husky/pre-commit
```

---

## Part 8: The Emergency "Tests Are Failing" Guide

### When Unit Tests Fail

```bash
# 1. See what failed
npm run test:run

# 2. Run specific test
npm run test -- src/stores/__tests__/editorUIStore.test.ts

# 3. Debug in UI mode
npm run test:ui

# 4. Fix the issue

# 5. Re-run
npm run test:run
```

### When E2E Tests Fail

```bash
# 1. Run in headed mode (see what's happening)
npm run test:e2e:headed

# 2. Debug specific test
npm run test:e2e:debug -- -g "should open mindmap modal"

# 3. Check screenshots in test-results/
ls test-results/

# 4. Fix the issue

# 5. Re-run
npm run test:e2e
```

### When Visual Tests Fail

```bash
# 1. Check the diff images
ls playwright-report/

# 2. If change is intentional, update snapshots
npm run test:visual:update

# 3. If change is NOT intentional, fix CSS

# 4. Re-run
npm run test:visual
```

---

## Part 9: Test Coverage Goals

### Week-by-Week Targets

| Week | New Code | Test Coverage | E2E Tests |
|------|----------|---------------|-----------|
| 1 | Zustand store | 100% (easy) | 0 |
| 2 | AI sidebar merge | 70% | 5 new |
| 3 | Toolbar extraction | 80% | 2 new |
| 4 | Editor hook | 90% | 3 new |
| 5 | Feature modules | 60% (just integration) | 5 new |
| 6 | EditorLayout | 70% | 10 total |

### Critical Tests (Must Have Before Week 6)

```typescript
// These tests MUST pass before deleting WYSIWYGEditor
describe('Critical Flow Tests', () => {
  test('Editor → Mindmap → Editor (round-trip)');
  test('Editor → Slides → Editor (round-trip)');
  test('AI works in editor');
  test('AI works in mindmap');
  test('Toolbar all buttons work');
  test('Keyboard shortcuts work');
  test('Save and load document');
  test('Context folders work');
  test('Diagrams render');
  test('Tables work');
});
```

---

## Part 10: Metrics Dashboard (Optional but Awesome)

### Track Your Progress

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

### What Good Looks Like

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files              |   72.5  |   65.3   |   71.2  |   73.1
 stores/               |   95.2  |   88.7   |   94.1  |   95.8
  editorUIStore.ts     |   100   |   100    |   100   |   100
 hooks/                |   88.3  |   75.4   |   85.2  |   89.1
  useEditorSetup.ts    |   91.2  |   82.1   |   88.9  |   92.3
 components/toolbar/   |   65.7  |   58.2   |   63.4  |   66.1
  ToolbarButton.tsx    |   82.1  |   75.0   |   80.0  |   83.3
```

---

## Conclusion: Your Testing Manifesto

1. **Tests run continuously** - Not "before commit," WHILE working
2. **Fail fast** - Catch issues in seconds, not hours
3. **Visual tests matter** - Your app is beautiful, keep it that way
4. **E2E tests are critical** - Especially the mindmap integration
5. **Coverage is a guide** - Not a religion, but aim for 70%+

**The Rule:**
> "If you're refactoring without running tests, you're not refactoring. You're just hoping."

---

## Next Steps

```bash
# 1. Set up testing (copy configs above)
# 2. Write your first test
# 3. Start watching
npm run test:watch

# 4. Refactor with confidence
# 5. Commit when tests pass
# 6. Repeat
```

**Now go refactor without breaking shit. The tests have your back.**


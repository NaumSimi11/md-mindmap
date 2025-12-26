# 🧪 End-to-End Testing Plan

**Date**: December 26, 2025  
**Status**: Comprehensive Plan  
**Goal**: Ensure core workflows are regression-proof for future development

---

## Executive Summary

This plan covers **40+ E2E tests** across 2 major modes:
- **Guest Mode (Logged Off)**: 15 tests
- **Authenticated Mode (Logged In)**: 25 tests

**Tech Stack**: Playwright (already configured)  
**Existing Tests**: 7 spec files (partial coverage)  
**Gap**: Authentication tests are `test.skip()` - BLOCKED until unblocked

---

## 📍 Current State

### What Exists
```
playwright.config.ts          # Root config (port 5174)
frontend/playwright.config.ts # Frontend config
tests/e2e/invariants/         # 5 invariant test files
e2e/                          # 2 additional test files
```

### Test Categories Already Present
| File | Status | Coverage |
|------|--------|----------|
| `local-first.spec.ts` | ✅ Active | Document creation offline, persistence |
| `sidebar-editor-consistency.spec.ts` | ✅ Active | UI consistency |
| `sync-status-truthfulness.spec.ts` | ⚠️ Partial | 2 active, 3 skipped |
| `guest-auth-transition.spec.ts` | ❌ All skipped | Blocked on auth |
| `negative-cases.spec.ts` | ⚠️ Partial | Error handling |

### What's Missing
1. **Authenticated workflows** - all skipped
2. **Workspace management** - not tested
3. **Document import/export** - not tested
4. **Push to cloud** - not tested
5. **Email invitations** - not tested
6. **Collaboration** - not tested

---

## 🏗️ Test Architecture

```
tests/
└── e2e/
    ├── fixtures/                    # Test data
    │   ├── test-user.json          # Auth credentials
    │   ├── sample-documents/       # Import test files
    │   └── expected-exports/       # Export validation
    │
    ├── helpers/                     # Reusable utilities
    │   ├── auth.helper.ts          # Login/logout helpers
    │   ├── document.helper.ts      # Document CRUD helpers
    │   ├── workspace.helper.ts     # Workspace helpers
    │   └── api-mock.helper.ts      # Backend mocking
    │
    ├── guest/                       # Logged Off Tests
    │   ├── document-crud.spec.ts
    │   ├── workspace-crud.spec.ts
    │   ├── document-import.spec.ts
    │   ├── document-export.spec.ts
    │   └── offline-persistence.spec.ts
    │
    ├── authenticated/               # Logged In Tests
    │   ├── auth-flow.spec.ts
    │   ├── document-crud.spec.ts
    │   ├── workspace-crud.spec.ts
    │   ├── push-to-cloud.spec.ts
    │   ├── document-import.spec.ts
    │   ├── document-export.spec.ts
    │   └── collaboration/
    │       ├── email-invites.spec.ts
    │       └── real-time-collab.spec.ts
    │
    └── invariants/                  # Existing invariant tests
        └── ... (keep existing)
```

---

## 📋 Test Specifications

### Phase 1: Guest Mode (Logged Off)

#### 1.1 Document CRUD (`guest/document-crud.spec.ts`)

```typescript
test.describe('Guest Document CRUD', () => {
  test('G-DOC-001: Create new document via modal', async ({ page }) => {
    // 1. Click "New Document" button
    // 2. Fill title
    // 3. Select "Blank Markdown"
    // 4. Assert: Editor opens
    // 5. Assert: Document in sidebar
    // 6. Assert: Sync status = 'local'
  });

  test('G-DOC-002: Edit document content', async ({ page }) => {
    // 1. Create document
    // 2. Type content in editor
    // 3. Wait for auto-save (1s)
    // 4. Refresh page
    // 5. Assert: Content persists
  });

  test('G-DOC-003: Rename document', async ({ page }) => {
    // 1. Create document
    // 2. Click document title (inline edit)
    // 3. Change title
    // 4. Assert: Sidebar updates
    // 5. Refresh
    // 6. Assert: New title persists
  });

  test('G-DOC-004: Delete document', async ({ page }) => {
    // 1. Create document
    // 2. Right-click → Delete
    // 3. Confirm deletion
    // 4. Assert: Document removed from sidebar
    // 5. Assert: Cannot navigate to document
  });

  test('G-DOC-005: Star/unstar document', async ({ page }) => {
    // 1. Create document
    // 2. Click star icon
    // 3. Assert: Star filled
    // 4. Refresh
    // 5. Assert: Still starred
  });

  test('G-DOC-006: Switch between documents', async ({ page }) => {
    // 1. Create 3 documents
    // 2. Add unique content to each
    // 3. Click doc 1 → Assert content A
    // 4. Click doc 2 → Assert content B
    // 5. Click doc 3 → Assert content C
    // 6. Assert: No content mixing
  });
});
```

#### 1.2 Workspace CRUD (`guest/workspace-crud.spec.ts`)

```typescript
test.describe('Guest Workspace CRUD', () => {
  test('G-WS-001: Create new workspace', async ({ page }) => {
    // 1. Open workspace dropdown
    // 2. Click "Create Workspace"
    // 3. Fill name
    // 4. Submit
    // 5. Assert: New workspace selected
    // 6. Assert: Empty document list
  });

  test('G-WS-002: Switch between workspaces', async ({ page }) => {
    // 1. Create workspace A with doc A
    // 2. Create workspace B with doc B
    // 3. Switch to A → Assert doc A visible
    // 4. Switch to B → Assert doc B visible
    // 5. Assert: No document mixing
  });

  test('G-WS-003: Rename workspace', async ({ page }) => {
    // 1. Create workspace
    // 2. Open settings
    // 3. Change name
    // 4. Save
    // 5. Assert: Dropdown shows new name
  });

  test('G-WS-004: Workspace persists across refresh', async ({ page }) => {
    // 1. Create workspace with documents
    // 2. Refresh
    // 3. Assert: Same workspace selected
    // 4. Assert: Documents visible
  });
});
```

#### 1.3 Document Import (`guest/document-import.spec.ts`)

```typescript
test.describe('Guest Document Import', () => {
  test('G-IMP-001: Import single .md file', async ({ page }) => {
    // 1. Click import button
    // 2. Upload sample.md
    // 3. Assert: Document created
    // 4. Assert: Content matches file
  });

  test('G-IMP-002: Import multiple .md files', async ({ page }) => {
    // 1. Click import button
    // 2. Upload 3 files
    // 3. Assert: 3 documents created
    // 4. Assert: All content correct
  });

  test('G-IMP-003: Import preserves formatting', async ({ page }) => {
    // 1. Import file with headers, lists, code
    // 2. Assert: Formatting preserved in editor
  });

  test('G-IMP-004: Drag-and-drop import', async ({ page }) => {
    // 1. Drag file onto sidebar
    // 2. Assert: Document created
  });
});
```

#### 1.4 Document Export/Download (`guest/document-export.spec.ts`)

```typescript
test.describe('Guest Document Export', () => {
  test('G-EXP-001: Download as Markdown', async ({ page }) => {
    // 1. Create document with content
    // 2. Click export → Markdown
    // 3. Assert: Download triggered
    // 4. Assert: File content matches editor
  });

  test('G-EXP-002: Download as HTML', async ({ page }) => {
    // 1. Create document
    // 2. Click export → HTML
    // 3. Assert: Valid HTML file
  });

  test('G-EXP-003: Download as PDF', async ({ page }) => {
    // 1. Create document
    // 2. Click export → PDF
    // 3. Assert: PDF generated
  });

  test('G-EXP-004: Export preserves formatting', async ({ page }) => {
    // 1. Create document with rich content
    // 2. Export as Markdown
    // 3. Re-import
    // 4. Assert: Identical content
  });
});
```

---

### Phase 2: Authenticated Mode (Logged In)

#### 2.1 Authentication Flow (`authenticated/auth-flow.spec.ts`)

```typescript
test.describe('Authentication Flow', () => {
  test('A-AUTH-001: Login with valid credentials', async ({ page }) => {
    // 1. Navigate to login
    // 2. Enter email/password
    // 3. Submit
    // 4. Assert: Redirected to workspace
    // 5. Assert: User menu shows name
    // 6. Assert: Guest docs still visible
  });

  test('A-AUTH-002: Login persists across refresh', async ({ page }) => {
    // 1. Login
    // 2. Refresh
    // 3. Assert: Still logged in
    // 4. Assert: User menu shows name
  });

  test('A-AUTH-003: Logout clears session', async ({ page }) => {
    // 1. Login
    // 2. Click logout
    // 3. Assert: Back to guest mode
    // 4. Assert: Local documents preserved
    // 5. Assert: No auth token in storage
  });

  test('A-AUTH-004: Invalid login shows error', async ({ page }) => {
    // 1. Navigate to login
    // 2. Enter wrong password
    // 3. Assert: Error message shown
    // 4. Assert: Still on login page
  });

  test('A-AUTH-005: Signup flow', async ({ page }) => {
    // 1. Navigate to signup
    // 2. Fill form
    // 3. Submit
    // 4. Assert: Account created
    // 5. Assert: Auto-logged in
  });
});
```

#### 2.2 Push to Cloud (`authenticated/push-to-cloud.spec.ts`)

```typescript
test.describe('Push to Cloud', () => {
  test('A-PUSH-001: Push single document to cloud', async ({ page }) => {
    // 1. Login
    // 2. Create local document
    // 3. Click "Push to Cloud" button
    // 4. Assert: Sync status changes to 'syncing'
    // 5. Assert: Sync status changes to 'synced'
    // 6. Assert: POST /api/v1/documents called
  });

  test('A-PUSH-002: Pushed document persists in cloud', async ({ page }) => {
    // 1. Login
    // 2. Push document
    // 3. Logout
    // 4. Login again
    // 5. Assert: Document visible from cloud
    // 6. Assert: Content matches
  });

  test('A-PUSH-003: Push updates content to cloud', async ({ page }) => {
    // 1. Login
    // 2. Push document
    // 3. Edit content
    // 4. Push again
    // 5. Assert: PATCH /api/v1/documents called
    // 6. Assert: Cloud has updated content
  });

  test('A-PUSH-004: Push creates workspace if needed', async ({ page }) => {
    // 1. Login
    // 2. Create local workspace + document
    // 3. Push document
    // 4. Assert: POST /api/v1/workspaces called
    // 5. Assert: Document in new workspace
  });

  test('A-PUSH-005: Failed push shows error, stays local', async ({ page }) => {
    // 1. Login
    // 2. Create document
    // 3. Mock backend 500 error
    // 4. Attempt push
    // 5. Assert: Error toast shown
    // 6. Assert: Sync status != 'synced'
  });

  test('A-PUSH-006: Batch sync on login', async ({ page }) => {
    // 1. Create 5 local documents (guest)
    // 2. Login
    // 3. Wait for batch sync
    // 4. Assert: All 5 documents synced (if auto-push enabled)
    // 5. OR Assert: All 5 remain local (if manual push)
  });
});
```

#### 2.3 Document CRUD (Authenticated) (`authenticated/document-crud.spec.ts`)

```typescript
test.describe('Authenticated Document CRUD', () => {
  test('A-DOC-001: Create document (synced by default?)', async ({ page }) => {
    // 1. Login
    // 2. Create document
    // 3. Assert: Document created
    // 4. Assert: Sync status matches expected behavior
  });

  test('A-DOC-002: Edit cloud document', async ({ page }) => {
    // 1. Login
    // 2. Create and push document
    // 3. Edit content
    // 4. Assert: Changes saved to cloud
    // 5. Logout + Login → Content persists
  });

  test('A-DOC-003: Delete cloud document', async ({ page }) => {
    // 1. Login
    // 2. Create and push document
    // 3. Delete document
    // 4. Assert: DELETE /api called
    // 5. Logout + Login → Document gone
  });

  test('A-DOC-004: Switch between local and cloud docs', async ({ page }) => {
    // 1. Login
    // 2. Have 2 local, 2 cloud docs
    // 3. Switch between all 4
    // 4. Assert: Correct content for each
  });
});
```

#### 2.4 Workspace CRUD (Authenticated) (`authenticated/workspace-crud.spec.ts`)

```typescript
test.describe('Authenticated Workspace CRUD', () => {
  test('A-WS-001: Create cloud workspace', async ({ page }) => {
    // 1. Login
    // 2. Create workspace
    // 3. Assert: Workspace in dropdown
    // 4. Logout + Login → Workspace persists
  });

  test('A-WS-002: Switch workspace loads correct docs', async ({ page }) => {
    // 1. Login
    // 2. Create 2 workspaces with docs
    // 3. Switch between them
    // 4. Assert: Correct documents load
  });

  test('A-WS-003: Rename cloud workspace', async ({ page }) => {
    // 1. Login
    // 2. Create workspace
    // 3. Rename via settings
    // 4. Assert: Name updated
    // 5. Logout + Login → Name persists
  });
});
```

#### 2.5 Email Invitations (`authenticated/collaboration/email-invites.spec.ts`)

```typescript
test.describe('Email Invitations', () => {
  test('A-INV-001: Send document invite', async ({ page }) => {
    // 1. Login
    // 2. Create and push document
    // 3. Open Share modal
    // 4. Enter email address
    // 5. Select role (editor/viewer)
    // 6. Click Send
    // 7. Assert: POST /api/v1/documents/{id}/invite called
    // 8. Assert: Success toast shown
  });

  test('A-INV-002: Invite form validates email', async ({ page }) => {
    // 1. Login
    // 2. Open Share modal
    // 3. Enter invalid email
    // 4. Assert: Validation error
  });

  test('A-INV-003: Can select role for invite', async ({ page }) => {
    // 1. Login
    // 2. Open Share modal
    // 3. Assert: Role dropdown has options
    // 4. Select "Viewer"
    // 5. Send invite
    // 6. Assert: role=viewer in request
  });

  test('A-INV-004: Only owner/admin sees invite form', async ({ page }) => {
    // Setup: User is viewer on shared doc
    // 1. Open Share modal
    // 2. Assert: Invite form NOT visible
  });
});
```

#### 2.6 Real-Time Collaboration (`authenticated/collaboration/real-time-collab.spec.ts`)

```typescript
test.describe('Real-Time Collaboration', () => {
  test('A-COLLAB-001: Two users see same document', async ({ browser }) => {
    // 1. User A creates and shares document
    // 2. User B opens same document (new context)
    // 3. Assert: Both see same content
  });

  test('A-COLLAB-002: Edits sync in real-time', async ({ browser }) => {
    // 1. User A and B open same document
    // 2. User A types "Hello"
    // 3. Assert: User B sees "Hello" within 2s
  });

  test('A-COLLAB-003: Presence indicators shown', async ({ browser }) => {
    // 1. User A and B open same document
    // 2. Assert: User A sees B's cursor/avatar
    // 3. Assert: User B sees A's cursor/avatar
  });

  test('A-COLLAB-004: Concurrent edits merge', async ({ browser }) => {
    // 1. User A and B open same document
    // 2. User A types at start
    // 3. User B types at end (simultaneously)
    // 4. Assert: Both edits present, no conflict
  });
});
```

---

## 🔧 Test Helpers

### `helpers/auth.helper.ts`

```typescript
import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
  name: 'Test User'
};

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/workspace');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/');
}

export async function ensureLoggedOut(page: Page) {
  // Clear auth state
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  });
}
```

### `helpers/document.helper.ts`

```typescript
import { Page, expect } from '@playwright/test';

export async function createDocument(page: Page, title: string) {
  await page.click('[data-testid="new-document"]');
  await page.fill('[data-testid="document-title-input"]', title);
  await page.click('[data-testid="create-blank-markdown"]');
  await page.waitForSelector('[data-testid="editor-container"]');
}

export async function typeInEditor(page: Page, content: string) {
  await page.click('.ProseMirror');
  await page.keyboard.type(content);
  await page.waitForTimeout(1000); // Wait for auto-save
}

export async function getEditorContent(page: Page): Promise<string> {
  return page.textContent('.ProseMirror') ?? '';
}

export async function selectDocumentInSidebar(page: Page, title: string) {
  const doc = page.locator('[data-testid^="document-item-"]').filter({ hasText: title });
  await doc.click();
  await page.waitForSelector('.ProseMirror');
}
```

---

## 📊 Test Data IDs (Required)

The following `data-testid` attributes must exist in the UI:

### Sidebar & Navigation
- `[data-testid="workspace-sidebar"]`
- `[data-testid="new-document"]`
- `[data-testid="document-item-{slug}"]`
- `[data-testid="workspace-dropdown"]`
- `[data-testid="create-workspace"]`

### Document Modal
- `[data-testid="document-title-input"]`
- `[data-testid="create-blank-markdown"]`

### Editor
- `[data-testid="editor-container"]`
- `[data-testid="sync-status-icon"]`
- `[data-testid="push-to-cloud-button"]`
- `[data-testid="share-button"]`

### Auth
- `[data-testid="login-button"]`
- `[data-testid="logout-button"]`
- `[data-testid="email-input"]`
- `[data-testid="password-input"]`
- `[data-testid="user-menu"]`

### Share Modal
- `[data-testid="share-modal"]`
- `[data-testid="invite-email-input"]`
- `[data-testid="invite-role-select"]`
- `[data-testid="send-invite-button"]`

### Export
- `[data-testid="export-dropdown"]`
- `[data-testid="export-markdown"]`
- `[data-testid="export-html"]`
- `[data-testid="export-pdf"]`

---

## ⚡ Implementation Phases

### Phase 1: Foundation (Week 1)
| Task | Status |
|------|--------|
| Add missing `data-testid` attributes to UI | TODO |
| Create `helpers/` directory with utilities | TODO |
| Implement Guest Document CRUD tests | TODO |
| Implement Guest Workspace CRUD tests | TODO |

### Phase 2: Import/Export (Week 2)
| Task | Status |
|------|--------|
| Implement Document Import tests | TODO |
| Implement Document Export tests | TODO |
| Add test fixtures (sample .md files) | TODO |

### Phase 3: Authentication (Week 3)
| Task | Status |
|------|--------|
| Create test user in database | TODO |
| Implement auth helpers | TODO |
| Unblock `guest-auth-transition.spec.ts` | TODO |
| Implement Auth Flow tests | TODO |

### Phase 4: Cloud Sync (Week 4)
| Task | Status |
|------|--------|
| Implement Push to Cloud tests | TODO |
| Unblock `sync-status-truthfulness.spec.ts` | TODO |
| Implement Authenticated CRUD tests | TODO |

### Phase 5: Collaboration (Week 5)
| Task | Status |
|------|--------|
| Implement Email Invite tests | TODO |
| Implement Real-Time Collaboration tests | TODO |
| Setup multi-browser test fixtures | TODO |

---

## 🏃 Running Tests

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/guest/document-crud.spec.ts

# Run with UI (debug mode)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Run specific test by name
npx playwright test -g "G-DOC-001"
```

### CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backendv2 && pip install -r requirements.txt
      
      - name: Start services
        run: |
          docker-compose up -d
          cd backendv2 && uvicorn app.main:app --port 7001 &
          cd frontend && npm run dev -- --port 5174 &
          sleep 10
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📈 Coverage Goals

| Category | Tests | Priority |
|----------|-------|----------|
| Guest Document CRUD | 6 | P0 |
| Guest Workspace CRUD | 4 | P0 |
| Document Import | 4 | P1 |
| Document Export | 4 | P1 |
| Authentication | 5 | P0 |
| Push to Cloud | 6 | P0 |
| Auth Document CRUD | 4 | P1 |
| Auth Workspace CRUD | 3 | P1 |
| Email Invites | 4 | P1 |
| Real-Time Collab | 4 | P2 |
| **Total** | **44** | - |

### Success Criteria

- ✅ All P0 tests pass before merge
- ✅ All P1 tests pass before release
- ✅ P2 tests are nice-to-have
- ✅ Zero flaky tests (retry = 0 locally)
- ✅ < 5 minute total runtime

---

## 🔄 Maintenance

### When to Update Tests

1. **New Feature** → Add tests for it
2. **Bug Fix** → Add regression test
3. **UI Change** → Update selectors
4. **API Change** → Update assertions

### Test Naming Convention

```
{SCOPE}-{CATEGORY}-{NUMBER}: {Description}

Examples:
G-DOC-001: Create new document via modal
A-PUSH-003: Push updates content to cloud
A-INV-002: Invite form validates email
```

### Flaky Test Protocol

1. Mark with `test.fixme()`
2. Create issue with reproduction steps
3. Fix within 1 sprint
4. Remove `test.fixme()` after fix

---

## Appendix: Test Matrix

| Feature | Guest | Auth | Cloud | Collab |
|---------|-------|------|-------|--------|
| Create Document | ✅ | ✅ | ✅ | - |
| Edit Document | ✅ | ✅ | ✅ | ✅ |
| Delete Document | ✅ | ✅ | ✅ | - |
| Create Workspace | ✅ | ✅ | ✅ | - |
| Switch Workspace | ✅ | ✅ | - | - |
| Import .md | ✅ | ✅ | - | - |
| Export .md | ✅ | ✅ | - | - |
| Push to Cloud | - | ✅ | ✅ | - |
| Send Invite | - | ✅ | ✅ | - |
| Real-Time Edit | - | - | - | ✅ |
| Presence | - | - | - | ✅ |


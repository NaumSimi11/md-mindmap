/**
 * Playwright Test Fixtures
 * 
 * Custom fixtures for MDReader E2E tests including:
 * - Page objects for common flows
 * - Test data helpers
 * - Authentication utilities
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// =============================================================================
// TEST DATA
// =============================================================================

/** Test user credentials (from backendv2/scripts/create_test_users.py) */
export const TEST_USERS = {
  naum: {
    email: 'naum@example.com',
    username: 'naum',
    password: 'Kozuvcanka#1',
    fullName: 'Naum',
  },
  john: {
    email: 'john@example.com',
    username: 'john',
    password: 'TestPassword123!',
    fullName: 'John Doe',
  },
  ljubisha: {
    email: 'ljubisha@example.com',
    username: 'ljubisha',
    password: 'TestPassword456!',
    fullName: 'Ljubisha',
  },
} as const;

export type TestUser = keyof typeof TEST_USERS;

// =============================================================================
// PAGE HELPERS
// =============================================================================

/**
 * Helper class for authentication flows
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /** Navigate to login page */
  async goToLogin() {
    await this.page.goto('/login');
    await this.page.waitForSelector('[data-testid="login-email-input"]');
  }

  /** Navigate to signup page */
  async goToSignup() {
    await this.page.goto('/signup');
    await this.page.waitForSelector('[data-testid="signup-email-input"]');
  }

  /** Login with credentials */
  async login(email: string, password: string) {
    await this.goToLogin();
    await this.page.fill('[data-testid="login-email-input"]', email);
    await this.page.fill('[data-testid="login-password-input"]', password);
    await this.page.click('[data-testid="login-submit-button"]');
    // Wait for navigation to workspace
    await this.page.waitForURL('**/workspace**', { timeout: 15000 });
    // Wait a bit for state to settle
    await this.page.waitForTimeout(500);
  }

  /** Login with a test user */
  async loginAsTestUser(user: TestUser) {
    const { email, password } = TEST_USERS[user];
    await this.login(email, password);
  }

  /** Signup with credentials */
  async signup(fullName: string, username: string, email: string, password: string) {
    await this.goToSignup();
    await this.page.fill('[data-testid="signup-fullname-input"]', fullName);
    await this.page.fill('[data-testid="signup-username-input"]', username);
    await this.page.fill('[data-testid="signup-email-input"]', email);
    await this.page.fill('[data-testid="signup-password-input"]', password);
    await this.page.fill('[data-testid="signup-confirm-password-input"]', password);
    await this.page.click('[data-testid="signup-submit-button"]');
    // Wait for navigation to workspace
    await this.page.waitForURL('**/workspace**', { timeout: 15000 });
  }

  /** Check if user is logged in - checks the actual token key used by the app */
  async isLoggedIn(): Promise<boolean> {
    return await this.page.evaluate(() => {
      // The app stores token as 'auth_token' (see ApiClient.ts line 30)
      return !!localStorage.getItem('auth_token');
    });
  }

  /** Logout (clear storage) */
  async logout() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.reload();
  }
}

/**
 * Helper class for workspace/document operations
 */
export class WorkspaceHelper {
  constructor(private page: Page) {}

  /** Wait for workspace to load with better error handling */
  async waitForWorkspace(timeout = 15000) {
    try {
      await this.page.waitForSelector('[data-testid="workspace-sidebar"]', { timeout });
    } catch {
      // If sidebar not found, we might be on a different page - try navigating
      await this.page.goto('/workspace');
      await this.page.waitForSelector('[data-testid="workspace-sidebar"]', { timeout: 10000 });
    }
  }

  /** Get current workspace name */
  async getCurrentWorkspaceName(): Promise<string> {
    const element = this.page.locator('[data-testid="current-workspace-name"]');
    return await element.innerText();
  }

  /** Open workspace switcher */
  async openWorkspaceSwitcher() {
    await this.page.click('[data-testid="workspace-switcher-trigger"]');
  }

  /** Switch to a workspace by slug */
  async switchToWorkspace(slug: string) {
    await this.openWorkspaceSwitcher();
    await this.page.click(`[data-testid="workspace-item-${slug}"]`);
    // Wait for workspace to load
    await this.page.waitForTimeout(500);
  }

  /** Create a new document */
  async createDocument(title: string, type: 'markdown' | 'mindmap' | 'presentation' = 'markdown') {
    // Dismiss any modals that might be open
    await this.dismissModals();
    
    // Click new document button
    await this.page.click('[data-testid="new-document"]');
    
    // Wait for modal
    await this.page.waitForSelector('[data-testid="document-title-input"]', { timeout: 5000 });
    
    // Fill title
    await this.page.fill('[data-testid="document-title-input"]', title);
    
    // Select type and create
    await this.page.click(`[data-testid="create-blank-${type}"]`);
    
    // Wait for editor to load
    await this.page.waitForSelector('[data-testid="editor-container"]', { timeout: 15000 });
  }

  /** Click on a document in the sidebar */
  async selectDocument(slug: string) {
    // Dismiss any modals first
    await this.dismissModals();
    
    // Try to find the document with a flexible slug match
    const exactMatch = this.page.locator(`[data-testid="document-item-${slug}"]`);
    const partialMatch = this.page.locator(`[data-testid^="document-item-"][data-testid*="${slug}"]`);
    
    if (await exactMatch.count() > 0) {
      await exactMatch.click();
    } else if (await partialMatch.count() > 0) {
      await partialMatch.first().click();
    } else {
      // Fall back to clicking by title text
      await this.page.click(`text="${slug.replace(/-/g, ' ')}"`);
    }
    
    await this.page.waitForSelector('[data-testid="editor-container"]', { timeout: 10000 });
  }

  /** Dismiss any open modals */
  async dismissModals() {
    // Check for modal overlay and try to close it
    const modal = this.page.locator('.fixed.inset-0.bg-black\\/50');
    if (await modal.count() > 0) {
      // Try pressing Escape to close
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
    }
  }

  /** Get list of visible documents */
  async getDocumentList(): Promise<string[]> {
    await this.page.waitForTimeout(500); // Let sidebar update
    const items = this.page.locator('[data-testid^="document-item-"]');
    const count = await items.count();
    const slugs: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await items.nth(i).getAttribute('data-testid');
      if (testId) {
        slugs.push(testId.replace('document-item-', ''));
      }
    }
    return slugs;
  }

  /** Push current document to cloud */
  async pushDocumentToCloud(slug: string) {
    // Open document menu
    await this.page.click(`[data-testid="document-menu-${slug}"]`);
    // Click push to cloud
    await this.page.click(`[data-testid="push-to-cloud-${slug}"]`);
    // Wait for sync
    await this.page.waitForTimeout(2000);
  }
}

/**
 * Helper class for editor operations
 */
export class EditorHelper {
  constructor(private page: Page) {}

  /** Wait for editor to be ready */
  async waitForEditor(timeout = 10000) {
    await this.page.waitForSelector('[data-testid="editor-container"]', { timeout });
    // Give Yjs time to initialize
    await this.page.waitForTimeout(500);
  }

  /** Type content into the WYSIWYG editor */
  async typeInEditor(content: string) {
    // Click to focus the editor - try multiple selectors
    const editorSelectors = [
      '[data-testid="wysiwyg-editor"] .ProseMirror',
      '[data-testid="wysiwyg-editor"]',
      '.ProseMirror',
      '[data-testid="editor-container"] .ProseMirror'
    ];
    
    for (const selector of editorSelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        await element.click();
        break;
      }
    }
    
    // Type content
    await this.page.keyboard.type(content);
    // Wait for autosave
    await this.page.waitForTimeout(500);
  }

  /** Get content from the editor */
  async getEditorContent(): Promise<string> {
    // Get text content from the ProseMirror editor
    return await this.page.evaluate(() => {
      const selectors = [
        '[data-testid="wysiwyg-editor"] .ProseMirror',
        '.ProseMirror',
        '[data-testid="editor-container"] .ProseMirror'
      ];
      for (const selector of selectors) {
        const editor = document.querySelector(selector);
        if (editor) return editor.textContent || '';
      }
      return '';
    });
  }

  /** Get sync status */
  async getSyncStatus(): Promise<string | null> {
    const indicator = this.page.locator('[data-testid="sync-status-indicator"]');
    if (await indicator.count() === 0) return null;
    return await indicator.getAttribute('data-sync-status');
  }

  /** Wait for sync status to be a specific value */
  async waitForSyncStatus(status: string, timeout = 10000) {
    await this.page.waitForSelector(
      `[data-testid="sync-status-indicator"][data-sync-status="${status}"]`,
      { timeout }
    );
  }

  /** Clear editor content */
  async clearEditor() {
    await this.page.click('[data-testid="wysiwyg-editor"]');
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Backspace');
  }
}

/**
 * Helper for browser storage operations
 */
export class StorageHelper {
  constructor(private page: Page) {}

  /** Clear all browser storage */
  async clearAll() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Clear IndexedDB
    await this.page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    });
  }

  /** Get localStorage item */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /** Set localStorage item */
  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
  }
}

// =============================================================================
// CUSTOM TEST FIXTURE
// =============================================================================

interface TestFixtures {
  auth: AuthHelper;
  workspace: WorkspaceHelper;
  editor: EditorHelper;
  storage: StorageHelper;
}

/**
 * Extended test with MDReader-specific fixtures
 */
export const test = base.extend<TestFixtures>({
  auth: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },
  workspace: async ({ page }, use) => {
    await use(new WorkspaceHelper(page));
  },
  editor: async ({ page }, use) => {
    await use(new EditorHelper(page));
  },
  storage: async ({ page }, use) => {
    await use(new StorageHelper(page));
  },
});

// Re-export expect for convenience
export { expect };

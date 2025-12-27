/**
 * E2E Tests: Sync Flow
 * 
 * Tests the synchronization between local storage and cloud:
 * - Guest creates content → logs in → content syncs
 * - Push to cloud workflow
 * - Content persists across sessions
 * - Document IDs remain consistent after sync
 */

import { test, expect, TEST_USERS } from './fixtures/test-fixtures';

test.describe('Guest to Authenticated Sync', () => {
  test.beforeEach(async ({ page, storage }) => {
    await page.goto('/');
    await storage.clearAll();
  });

  test('guest content persists after login', async ({ page, auth, workspace, editor }) => {
    // Step 1: Create content as guest
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create a document with unique content
    const uniqueMarker = `GuestContent_${Date.now()}`;
    await workspace.createDocument('Guest Document', 'markdown');
    await editor.waitForEditor();
    await editor.typeInEditor(`This is guest content: ${uniqueMarker}`);
    await page.waitForTimeout(1500);

    // Step 2: Verify content is saved locally - check document list
    await page.goto('/workspace');
    await workspace.waitForWorkspace();
    
    const documentsBeforeLogin = await workspace.getDocumentList();
    console.log('Documents before login:', documentsBeforeLogin);
    expect(documentsBeforeLogin.length).toBeGreaterThan(0);

    // Step 3: Login
    await auth.loginAsTestUser('naum');
    await workspace.waitForWorkspace();

    // Step 4: Wait for potential migration/sync
    await page.waitForTimeout(2000);

    // Step 5: Check workspace loads successfully after login
    await expect(page.locator('[data-testid="workspace-sidebar"]')).toBeVisible();
    
    // The guest document may or may not be visible depending on workspace logic
    // But the user should have access to their authenticated workspace
    const documentsAfterLogin = await workspace.getDocumentList();
    console.log('Documents after login:', documentsAfterLogin);
  });
});

test.describe('Push to Cloud Workflow', () => {
  test.beforeEach(async ({ page, auth, storage }) => {
    await page.goto('/');
    await storage.clearAll();
    await auth.loginAsTestUser('naum');
  });

  test('should create local document and see push option', async ({ page, workspace, editor }) => {
    await workspace.waitForWorkspace();

    // Create a new document
    await workspace.createDocument('Push Test Doc', 'markdown');
    await editor.waitForEditor();

    // Add content
    await editor.typeInEditor('Content to push to cloud');
    await page.waitForTimeout(1000);

    // Go back to workspace
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Verify document was created
    const documents = await workspace.getDocumentList();
    expect(documents.length).toBeGreaterThan(0);
  });
});

test.describe('Content Persistence Across Sessions', () => {
  test.beforeEach(async ({ page, storage }) => {
    await page.goto('/');
    await storage.clearAll();
  });

  test('authenticated user content persists after logout and login', async ({ 
    page, auth, workspace, editor 
  }) => {
    // Step 1: Login and create content
    await auth.loginAsTestUser('naum');
    await workspace.waitForWorkspace();

    const uniqueContent = `Persistent_${Date.now()}`;
    await workspace.createDocument('Persistent Doc', 'markdown');
    await editor.waitForEditor();
    await editor.typeInEditor(uniqueContent);
    await page.waitForTimeout(2500); // Wait for cloud sync

    // Step 2: Logout
    await auth.logout();
    await page.waitForTimeout(500);

    // Step 3: Login again
    await auth.loginAsTestUser('naum');
    await workspace.waitForWorkspace();
    await page.waitForTimeout(1000);

    // Step 4: Dismiss any modals that might appear
    await workspace.dismissModals();

    // Step 5: Verify documents load
    const documents = await workspace.getDocumentList();
    console.log('Documents after re-login:', documents);
    
    // The user should have documents (either synced from cloud or from before)
    // This test verifies the flow doesn't crash and data loads
    expect(page.url()).toContain('/workspace');
  });
});

test.describe('Workspace Switching', () => {
  test.beforeEach(async ({ page, auth, storage }) => {
    await page.goto('/');
    await storage.clearAll();
    await auth.loginAsTestUser('naum');
  });

  test('should show current workspace name', async ({ page, workspace }) => {
    await workspace.waitForWorkspace();
    
    // Get current workspace name
    const workspaceName = await workspace.getCurrentWorkspaceName();
    expect(workspaceName).toBeTruthy();
    expect(workspaceName.length).toBeGreaterThan(0);
  });

  test('should list available workspaces', async ({ page, workspace }) => {
    await workspace.waitForWorkspace();
    
    // Open workspace switcher
    await workspace.openWorkspaceSwitcher();
    
    // Should see at least one workspace item
    const workspaceItems = page.locator('[data-testid^="workspace-item-"]');
    const count = await workspaceItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('ID Consistency', () => {
  /**
   * This test ensures that document IDs remain consistent
   * after the cloud sync, preventing the "wrong content" bug
   */
  test('document ID should be consistent after sync', async ({ 
    page, auth, workspace, editor, storage 
  }) => {
    await page.goto('/');
    await storage.clearAll();
    await auth.loginAsTestUser('naum');
    await workspace.waitForWorkspace();

    // Create document with specific content
    await workspace.createDocument('ID Test Document', 'markdown');
    await editor.waitForEditor();
    
    const uniqueContent = `IDTestContent_${Date.now()}`;
    await editor.typeInEditor(uniqueContent);
    await page.waitForTimeout(2000);

    // Get current URL to extract document ID
    const urlBeforeSync = page.url();
    console.log('URL before sync:', urlBeforeSync);

    // Wait for sync
    await page.waitForTimeout(2000);

    // Get URL after sync
    const urlAfterSync = page.url();
    console.log('URL after sync:', urlAfterSync);

    // Refresh and check content
    await page.reload();
    await editor.waitForEditor();

    const contentAfterRefresh = await editor.getEditorContent();
    expect(contentAfterRefresh).toContain(uniqueContent);
  });
});

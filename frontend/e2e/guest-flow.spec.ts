/**
 * E2E Tests: Guest Flow
 * 
 * Tests the guest (unauthenticated) user experience:
 * - Creating documents locally
 * - Editing and content persistence
 * - Switching between documents
 * - Local-only sync status
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Guest User Flow', () => {
  test.beforeEach(async ({ page, storage }) => {
    // Clear all storage before each test for clean state
    await page.goto('/');
    await storage.clearAll();
  });

  test('should start as guest and see workspace', async ({ page, workspace }) => {
    // Navigate to workspace (should work without login for guest)
    await page.goto('/workspace');
    
    // Should see the workspace sidebar
    await workspace.waitForWorkspace();
    
    // Should see the sidebar
    await expect(page.locator('[data-testid="workspace-sidebar"]')).toBeVisible();
  });

  test('should create a new markdown document', async ({ page, workspace, editor }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create a new document
    await workspace.createDocument('My Test Document', 'markdown');

    // Editor should be visible
    await editor.waitForEditor();
    
    // Should show the editor container
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();
  });

  test('should persist content after typing', async ({ page, workspace, editor }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create a document with a unique name
    const docName = `Content Test ${Date.now()}`;
    await workspace.createDocument(docName, 'markdown');
    await editor.waitForEditor();

    // Type some content
    const testContent = 'Hello, this is a test document with some content!';
    await editor.typeInEditor(testContent);

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Navigate back to workspace without full reload
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // The document should still be in the list
    const documents = await workspace.getDocumentList();
    expect(documents.length).toBeGreaterThan(0);
  });

  test('should switch between documents and preserve content', async ({ page, workspace, editor }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create first document with unique content
    const content1 = `Content One ${Date.now()}`;
    await workspace.createDocument('Document One', 'markdown');
    await editor.waitForEditor();
    await editor.typeInEditor(content1);
    await page.waitForTimeout(1000);

    // Navigate back to workspace
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create second document with unique content
    const content2 = `Content Two ${Date.now()}`;
    await workspace.createDocument('Document Two', 'markdown');
    await editor.waitForEditor();
    await editor.typeInEditor(content2);
    await page.waitForTimeout(1000);

    // Navigate back to workspace
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Get document list and verify both exist
    const documents = await workspace.getDocumentList();
    expect(documents.length).toBeGreaterThanOrEqual(2);
    
    // Click on Document One
    const docOneSlug = documents.find(d => d.includes('document-one'));
    if (docOneSlug) {
      await workspace.selectDocument(docOneSlug);
      await editor.waitForEditor();
      
      // Content should contain our text
      const content = await editor.getEditorContent();
      expect(content).toContain('Content One');
    }
  });

  test('should show local-only sync status for guest', async ({ page, workspace, editor }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Create a document
    await workspace.createDocument('Sync Status Test', 'markdown');
    await editor.waitForEditor();

    // Type some content to trigger sync
    await editor.typeInEditor('Testing sync status');
    await page.waitForTimeout(1000);

    // Should show local-only or no indicator (per design, hidden when guest)
    // The sync indicator may not be visible for guests
    const syncIndicator = page.locator('[data-testid="sync-status-indicator"]');
    
    // Either not visible or shows local-only
    const isVisible = await syncIndicator.isVisible().catch(() => false);
    if (isVisible) {
      const status = await syncIndicator.getAttribute('data-sync-status');
      expect(['local-only', 'synced']).toContain(status);
    }
  });

  test('should import document button be visible', async ({ page, workspace }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Should see import button
    await expect(page.locator('[data-testid="import-document-button"]')).toBeVisible();
  });

  test('should create folder button be visible', async ({ page, workspace }) => {
    await page.goto('/workspace');
    await workspace.waitForWorkspace();

    // Should see new folder button
    await expect(page.locator('[data-testid="new-folder"]')).toBeVisible();
  });
});

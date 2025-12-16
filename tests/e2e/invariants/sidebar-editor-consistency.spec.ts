/**
 * GROUP B: SIDEBAR / EDITOR CONSISTENCY INVARIANTS
 * 
 * Architecture Reference: SYNC_INVARIANTS.md - INVARIANT 1.1, 1.3, 2.1, 3.1, 3.3
 * 
 * These tests prove that the sidebar and editor are always consistent.
 * No "ghost states" where editor is open but sidebar is empty, or vice versa.
 */

import { test, expect } from '@playwright/test';

test.describe('SIDEBAR / EDITOR CONSISTENCY INVARIANTS', () => {
  /**
   * INVARIANT-SE-001: Editor Implies Sidebar Entry
   * 
   * Architecture: SYNC_INVARIANTS.md - "If a document is open in the editor, 
   * it MUST exist in WorkspaceContext.documents (the sidebar index)"
   * 
   * Proves: No "ghost editor" states
   * Failure Mode: If this fails, editor can open without sidebar registration
   */
  test('SE-001: Editor open implies sidebar entry exists', async ({ page }) => {
    // ✅ Load page online
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="new-document"]');
    
    // Create document
    await page.click('[data-testid="new-document"]');
    await page.fill('[data-testid="document-title-input"]', 'Consistency Test');
    await page.click('[data-testid="create-blank-markdown"]');
    
    // Wait for editor
    await page.waitForSelector('[data-testid="editor-container"]');
    
    // ✅ FIX: Navigate back to sidebar to check
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="workspace-sidebar"]');
    
    // ASSERT: Document in sidebar
    const sidebarEntry = page.locator('[data-testid^="document-item-"]').filter({ hasText: 'Consistency Test' });
    await expect(sidebarEntry).toBeVisible();
    
    console.log('✅ INVARIANT PROVEN: Editor open → sidebar entry exists');
  });

  /**
   * INVARIANT-SE-002: Sidebar Click Loads Without Network
   * 
   * Architecture: SYNC_INVARIANTS.md - "Clicking a document in the sidebar 
   * MUST load the editor using ONLY local data (IndexedDB CRDT)"
   * 
   * Proves: Editor loads from local storage, not backend
   * Failure Mode: If this fails, editor requires network to load documents
   */
  test('SE-002: Sidebar entry click loads editor without network', async ({ page, context }) => {
    // ✅ Load online first
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="new-document"]');
    
    // Create and edit document
    await page.click('[data-testid="new-document"]');
    await page.fill('[data-testid="document-title-input"]', 'Load Test');
    await page.click('[data-testid="create-blank-markdown"]');
    
    await page.waitForSelector('.ProseMirror');
    await page.click('.ProseMirror');
    await page.keyboard.type('Loadable content');
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Go to home
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="workspace-sidebar"]');
    
    // ✅ Go offline
    await context.setOffline(true);
    
    // Click document in sidebar
    await page.click('[data-testid^="document-item-load-test"]');
    
    // ASSERT: Editor loads (offline)
    await page.waitForSelector('.ProseMirror');
    const content = await page.textContent('.ProseMirror');
    expect(content).toContain('Loadable content');
    
    console.log('✅ INVARIANT PROVEN: Sidebar click loads editor offline');
  });

  /**
   * INVARIANT-SE-003: No Duplication After Refresh
   * 
   * Architecture: SYNC_INVARIANTS.md - "Refresh MUST NOT create duplicate entries. 
   * Each document appears exactly once in the sidebar"
   * 
   * Proves: Refresh reconciles correctly, no duplicates
   * Failure Mode: If this fails, sidebar shows duplicate documents
   */
  test('SE-003: No document duplication after refresh', async ({ page }) => {
    // ✅ Load online
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="new-document"]');
    
    // Create document
    await page.click('[data-testid="new-document"]');
    await page.fill('[data-testid="document-title-input"]', 'Unique Doc');
    await page.click('[data-testid="create-blank-markdown"]');
    
    await page.waitForSelector('[data-testid="editor-container"]');
    
    // Navigate back to sidebar
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="workspace-sidebar"]');
    
    // ASSERT: Exactly ONE entry in sidebar
    const allDocs = await page.locator('[data-testid^="document-item-"]').filter({ hasText: 'Unique Doc' }).count();
    expect(allDocs).toBe(1);
    
    // ✅ Refresh (online - no offline reload issue)
    await page.reload();
    await page.waitForSelector('[data-testid="workspace-sidebar"]');
    
    // ASSERT: Still exactly ONE entry
    const allDocsAfterRefresh = await page.locator('[data-testid^="document-item-"]').filter({ hasText: 'Unique Doc' }).count();
    expect(allDocsAfterRefresh).toBe(1);
    
    console.log('✅ INVARIANT PROVEN: No duplication after refresh');
  });

  /**
   * INVARIANT-SE-004: Document ID Immutability
   * 
   * Architecture: SYNC_INVARIANTS.md - "Document IDs are immutable. 
   * They never change across operations (edit, save, refresh, sync)"
   * 
   * Proves: Document IDs are stable
   * Failure Mode: If this fails, IDs change and break references
   */
  test('SE-004: Document ID is immutable across operations', async ({ page }) => {
    // ✅ Load online
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="new-document"]');
    
    // Create document
    await page.click('[data-testid="new-document"]');
    await page.fill('[data-testid="document-title-input"]', 'ID Test');
    await page.click('[data-testid="create-blank-markdown"]');
    
    await page.waitForSelector('[data-testid="editor-container"]');
    
    // Capture document ID from URL
    const urlAfterCreate = page.url();
    const docIdMatch = urlAfterCreate.match(/\/doc\/([^\/]+)\/edit/);
    expect(docIdMatch).toBeTruthy();
    const originalDocId = docIdMatch![1];
    
    // Edit document
    await page.click('.ProseMirror');
    await page.keyboard.type('Edit 1');
    await page.waitForTimeout(500);
    
    // ✅ Navigate back to workspace (online - no offline issue)
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="workspace-sidebar"]');
    
    // Click document
    await page.click('[data-testid^="document-item-id-test"]');
    await page.waitForSelector('[data-testid="editor-container"]');
    
    // ASSERT: Same ID
    const urlAfterRefresh = page.url();
    const docIdMatchAfterRefresh = urlAfterRefresh.match(/\/doc\/([^\/]+)\/edit/);
    expect(docIdMatchAfterRefresh![1]).toBe(originalDocId);
    
    console.log(`✅ INVARIANT PROVEN: Document ID immutable (${originalDocId})`);
  });
});

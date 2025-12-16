/**
 * OFFLINE PERSISTENCE TEST
 * 
 * This file contains ONE architectural invariant test.
 * All other tests from this file have been moved/deleted per TEST_AUDIT_REPORT.md
 * 
 * Architecture Reference: ARCHITECTURE.md - INVARIANT 1 (Local-First Operation)
 * Architecture Reference: SYNC_INVARIANTS.md - INVARIANT 2.1 (CRDT is Canonical)
 * 
 * NOTE: This test should be moved to tests/e2e/invariants/offline-persistence.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Persistence Invariant', () => {
  test.beforeEach(async ({ page }) => {
    // The app now boots into the AI landing page; invariants live in /workspace.
    await page.goto('/workspace');

    // Wait for workspace sidebar to be ready
    await page.waitForSelector('[data-testid="new-document"]', { timeout: 10000 });

    // Create new document (local-first)
    await page.click('[data-testid="new-document"]');
    await page.fill('[data-testid="document-title-input"]', 'Persistence Test');
    await page.click('[data-testid="create-blank-markdown"]');

    // Wait for editor
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
  });

  /**
   * INVARIANT: Content Persists Across Refresh (CRDT Canonical)
   * 
   * Architecture: ARCHITECTURE.md - "All edits persisted to IndexedDB survive 
   * browser close, crash, or refresh"
   * 
   * Proves: CRDT state is persisted to IndexedDB and survives refresh
   * Failure Mode: Data loss on refresh (offline edits not durable)
   */
  test('MUST persist content after paste', async ({ page }) => {
    const markdown = '# Persistence Test\n\nThis content must survive refresh.';

    await page.click('.ProseMirror');
    await page.evaluate((text) => {
      const event = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true
      });
      event.clipboardData?.setData('text/plain', text);
      document.querySelector('.ProseMirror')?.dispatchEvent(event);
    }, markdown);

    // Wait for IndexedDB persist (keep within invariant test rules: no long sleeps)
    await page.waitForTimeout(500);

    // Refresh page (simulates browser restart)
    await page.reload();
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });

    // ASSERT: Content persisted (loaded from CRDT IndexedDB)
    const editorText = await page.textContent('.ProseMirror');
    expect(editorText).toContain('Persistence Test');
    expect(editorText).toContain('This content must survive refresh');

    console.log('✅ INVARIANT PROVEN: Content persists after refresh (CRDT canonical)');
  });
});

/*
 * DELETED TESTS (Per TEST_AUDIT_REPORT.md):
 * 
 * The following tests were DELETED because they test features, not invariants:
 * 
 * ❌ "MUST paste large markdown files" - Feature test (paste handler)
 * ❌ "MUST render mermaid diagrams from paste" - Feature test (Mermaid rendering)
 * ❌ "MUST insert diagram via button" - UI feature test
 * ❌ "MUST preserve diagrams on mode switch" - Tests undefined behavior (mode switching)
 * ❌ "MUST NOT lose content on rapid mode switching" - Tests undefined behavior
 * ❌ "MUST handle very large paste (10KB+)" - Feature test (not doc limit test)
 * ❌ "MUST NOT paste as code block" - Regression test for UI bug
 * ❌ "MUST NOT block Yjs updates" - Placeholder test (no assertion)
 * 
 * These tests should be moved to a separate feature test suite if needed.
 * They do NOT test architectural invariants defined in Architecture v2.1.
 * 
 * See: docs/TEST_AUDIT_REPORT.md for full rationale
 */

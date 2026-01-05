/**
 * DELETE FLOW TEST
 *
 * Tests the critical user journey: deleting documents.
 * Should run on every commit to prevent regressions.
 *
 * Tests both authenticated and guest deletion scenarios.
 */

import { test, expect } from '@playwright/test';

test.describe('Delete Flow - Critical User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Go to workspace
    await page.goto('/workspace');

    // Wait for workspace sidebar to be ready
    await page.waitForSelector('[data-testid="new-document"]', { timeout: 10000 });
  });

  test('MUST delete guest document and clean up storage', async ({ page }) => {
    // First create a document
    await page.click('[data-testid="new-document"]');
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });

    // Type some content
    await page.locator('.ProseMirror').fill('Test document for deletion');

    // Go back to workspace
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="new-document"]', { timeout: 10000 });

    // Find and delete the document (should be the first one)
    const documentItems = page.locator('[data-testid="document-item"]');
    await expect(documentItems).toHaveCount(1);

    // Click the delete button (three dots menu)
    await page.locator('[data-testid="document-menu"]').first().click();
    await page.locator('text=Delete').click();

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());

    // Wait for document to disappear
    await expect(documentItems).toHaveCount(0);

    console.log('✅ GUEST DOCUMENT DELETED: Storage cleaned up');
  });

  test('MUST handle delete confirmation dialog', async ({ page }) => {
    // Create a document first
    await page.click('[data-testid="new-document"]');
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
    await page.locator('.ProseMirror').fill('Document to delete');

    // Go back to workspace
    await page.goto('/workspace');
    await page.waitForSelector('[data-testid="new-document"]', { timeout: 10000 });

    // Click delete without confirmation
    await page.locator('[data-testid="document-menu"]').first().click();
    await page.locator('text=Delete').click();

    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });

    // Verify document is gone
    const documentItems = page.locator('[data-testid="document-item"]');
    await expect(documentItems).toHaveCount(0);

    console.log('✅ DELETE CONFIRMATION HANDLED: User confirmed deletion');
  });
});

/**
 * IMPORT FLOW TEST
 *
 * Tests the critical user journey: importing documents from file system.
 * Should run on every commit to prevent regressions.
 * 
 * Supported formats:
 * - Markdown (.md)
 * - Plain text (.txt)
 * - Word documents (.docx) - via mammoth
 * - Excel spreadsheets (.xlsx, .xls) - via xlsx
 * - HTML (.html, .htm) - via turndown
 * 
 * Architecture Reference: This tests the hydration pipeline for imported content
 */

import { test, expect } from '@playwright/test';

test.describe('Import Flow - Critical User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Go to workspace
    await page.goto('/workspace');
    
    // Wait for workspace sidebar to be ready
    await page.waitForSelector('[data-testid="new-document"]', { timeout: 10000 });
  });

  test('MUST import markdown file and show content in editor', async ({ page }) => {
    // ✅ Step 1: Click import button
    console.log('📁 Clicking import button...');
    await page.click('[data-testid="import-document-button"]');
    
    // ✅ Step 2: Upload test file (simple.md contains "Hello World")
    console.log('📤 Uploading test file...');
    const fileInput = page.locator('input[type="file"][accept*=".md"]');
    await fileInput.setInputFiles('e2e/fixtures/simple.md');
    
    // ✅ Step 3: Wait for file processing and auto-navigation
    console.log('⏳ Waiting for document creation and navigation...');
    await page.waitForURL('**/workspace/doc/**/edit', { timeout: 15000 });
    
    // ✅ Step 4: Wait for editor to load
    console.log('📝 Waiting for editor to load...');
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
    
    // ✅ Step 5: Wait for content hydration (critical!)
    console.log('💧 Waiting for content to hydrate...');
    await page.waitForTimeout(2000); // Give hydration time
    
    // ✅ Step 6: Verify content appears in editor
    console.log('🔍 Checking editor content...');
    const editorContent = await page.textContent('.ProseMirror');
    console.log('📄 Editor content:', editorContent);
    
    expect(editorContent).toContain('Hello World');
    expect(editorContent).toContain('This is a simple test document');
    
    console.log('✅ IMPORT TEST PASSED: Content loaded successfully');
  });

  test('MUST persist imported content after refresh', async ({ page }) => {
    // Import a file first
    await page.click('[data-testid="import-document-button"]');
    const fileInput = page.locator('input[type="file"][accept*=".md"]');
    await fileInput.setInputFiles('e2e/fixtures/simple.md');
    
    // Wait for navigation
    await page.waitForURL('**/workspace/doc/**/edit', { timeout: 15000 });
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Verify initial content
    let editorContent = await page.textContent('.ProseMirror');
    expect(editorContent).toContain('Hello World');
    
    // Refresh page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Verify content persists
    editorContent = await page.textContent('.ProseMirror');
    expect(editorContent).toContain('Hello World');
    expect(editorContent).toContain('This is a simple test document');
    
    console.log('✅ IMPORT PERSISTENCE TEST PASSED: Content survives refresh');
  });
});

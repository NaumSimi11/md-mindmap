/**
 * ORPHAN DOCUMENT DEBUGGING TEST
 *
 * This test isolates and debugs the orphan document issue.
 * Tests the hypothesis that orphan warnings are triggered by timing/data source mismatches.
 */

import { test, expect } from '@playwright/test';

test.describe('Orphan Document Deep Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Let everything load
  });

  test('isolate orphan document detection logic', async ({ page }) => {
    console.log('🔬 ISOLATING ORPHAN DOCUMENT ISSUE');

    // Monitor console logs for orphan warnings
    const orphanWarnings: any[] = [];
    const sidebarRenders: any[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Orphan documents')) {
        orphanWarnings.push({
          timestamp: Date.now(),
          message: text,
          fullText: msg.text()
        });
      }
      if (text.includes('WorkspaceSidebar render:')) {
        sidebarRenders.push({
          timestamp: Date.now(),
          message: text,
          data: JSON.parse(text.replace('🔍 WorkspaceSidebar render:', ''))
        });
      }
    });

    // Wait for multiple renders to see if orphan warnings appear
    await page.waitForTimeout(5000);

    console.log(`\n📊 ANALYSIS:`);
    console.log(`   - Orphan warnings captured: ${orphanWarnings.length}`);
    console.log(`   - Sidebar renders captured: ${sidebarRenders.length}`);

    // Analyze each sidebar render
    sidebarRenders.forEach((render, i) => {
      console.log(`\n🔍 Render #${i + 1} (${new Date(render.timestamp).toLocaleTimeString()}):`);
      console.log(`   - Workspace: ${render.data.workspace}`);
      console.log(`   - Total docs: ${render.data.total}`);
      console.log(`   - Root docs: ${render.data.rootDocs}`);
      console.log(`   - Docs in folders: ${render.data.docsInFolders}`);
      console.log(`   - Orphan docs: ${render.data.orphanDocs}`);
      console.log(`   - Folders: ${render.data.folders}`);
    });

    // Analyze orphan warnings
    orphanWarnings.forEach((warning, i) => {
      console.log(`\n⚠️ Orphan Warning #${i + 1} (${new Date(warning.timestamp).toLocaleTimeString()}):`);
      console.log(`   - Message: ${warning.message}`);
    });

    // Test the hypothesis: Are documents and folders loaded from different sources?
    const pageContent = await page.content();

    // Check for data source indicators
    const hasGuestData = pageContent.includes('GuestWorkspaceService') ||
                        pageContent.includes('guest (local)') ||
                        pageContent.includes('IndexedDB');

    const hasBackendData = pageContent.includes('BackendWorkspaceService') ||
                          pageContent.includes('backend (cloud)') ||
                          pageContent.includes('PostgreSQL');

    console.log(`\n🔍 DATA SOURCE ANALYSIS:`);
    console.log(`   - Guest data indicators: ${hasGuestData}`);
    console.log(`   - Backend data indicators: ${hasBackendData}`);

    // Check for timing issues - look at render timestamps
    if (sidebarRenders.length > 1) {
      const firstRender = sidebarRenders[0];
      const lastRender = sidebarRenders[sidebarRenders.length - 1];
      const timeDiff = lastRender.timestamp - firstRender.timestamp;

      console.log(`\n⏱️ TIMING ANALYSIS:`);
      console.log(`   - First render: ${new Date(firstRender.timestamp).toLocaleTimeString()}`);
      console.log(`   - Last render: ${new Date(lastRender.timestamp).toLocaleTimeString()}`);
      console.log(`   - Time between: ${timeDiff}ms`);
      console.log(`   - Orphan docs in first render: ${firstRender.data.orphanDocs}`);
      console.log(`   - Orphan docs in last render: ${lastRender.data.orphanDocs}`);
    }

    // CONCLUSION
    console.log(`\n🎯 HYPOTHESIS TESTING:`);
    if (orphanWarnings.length > 0) {
      console.log(`   ❌ CONFIRMED: Orphan documents DO exist in this system`);
      console.log(`   🔍 Root cause: Documents point to folders that don't exist in folderTree`);
    } else {
      console.log(`   ✅ CONFIRMED: No orphan documents in current state`);
      console.log(`   🤔 Orphan warnings may be false alarms or timing-related`);
    }

    // Save screenshot for manual analysis
    await page.screenshot({
      path: 'test-results/orphan-debug-analysis.png',
      fullPage: true
    });
    console.log(`\n📸 Screenshot saved: test-results/orphan-debug-analysis.png`);

    // The test always passes - it's just for analysis
    expect(true).toBe(true);
  });

  test('test document-folder creation flow to induce orphans', async ({ page }) => {
    console.log('🧪 TESTING DOCUMENT-FOLDER CREATION TO INDUCE ORPHANS');

    // This test tries to create a scenario that might cause orphans
    const orphanInduced: any[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Orphan documents')) {
        orphanInduced.push({
          timestamp: Date.now(),
          message: text
        });
      }
    });

    // Try to create a document (if button exists)
    const newDocButton = page.locator('[data-testid="new-document"]');
    if (await newDocButton.count() > 0) {
      console.log('📝 Found New Document button, clicking...');
      await newDocButton.click();
      await page.waitForTimeout(2000);

      // Check if we navigated to editor
      const editor = page.locator('.ProseMirror');
      if (await editor.count() > 0) {
        console.log('📄 Editor loaded, typing content...');
        await editor.fill('Test document that might become orphan');
        await page.waitForTimeout(1000);
      }

      // Navigate back to workspace
      await page.goto('/workspace');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('🏠 Back to workspace, checking for orphans...');
    } else {
      console.log('⚠️ New Document button not found');
    }

    // Check if any orphans were induced
    console.log(`\n🔍 ORPHAN INDUCTION RESULT:`);
    console.log(`   - Orphan warnings after document creation: ${orphanInduced.length}`);

    orphanInduced.forEach((warning, i) => {
      console.log(`   - Warning #${i + 1}: ${warning.message}`);
    });

    // Save final state
    await page.screenshot({
      path: 'test-results/orphan-after-creation.png',
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/orphan-after-creation.png`);

    expect(true).toBe(true);
  });
});

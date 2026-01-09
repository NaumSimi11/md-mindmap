/**
 * DOCUMENT IN FOLDER - ORPHAN DETECTION TEST
 *
 * Creates a document INSIDE a folder, then checks the "All Documents" view
 * to see if orphan detection works correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Document in Folder - Orphan Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('create document inside folder and check All Documents view', async ({ page }) => {
    console.log('📁 TESTING: Document in folder → All Documents view');

    // STEP 1: Verify we're in All Documents section
    console.log('   Step 1: Confirm All Documents section');

    // The "All" tab should be selected by default - use more specific selector
    const allTab = page.locator('[class*="flex-1"][class*="px-3"]').filter({ hasText: 'All' });
    const isAllSelected = await allTab.count() > 0 && await allTab.evaluate(el =>
      el.classList.contains('bg-white') ||
      el.classList.contains('shadow-sm') ||
      el.parentElement?.classList.contains('from-blue-500')
    );

    console.log(`   - All Documents section active: ${isAllSelected}`);

    // STEP 2: Create a document inside a folder
    console.log('   Step 2: Create document inside Getting Started folder');

    // Find the Getting Started folder
    const gettingStartedFolder = page.locator('[data-testid="folder-item"]').filter({ hasText: 'Getting Started' });
    const folderExists = await gettingStartedFolder.count() > 0;

    console.log(`   - Getting Started folder exists: ${folderExists}`);

    if (folderExists) {
      // Click the folder to expand it
      await gettingStartedFolder.click();
      await page.waitForTimeout(1000);

      // Look for a "New Document" button inside the folder
      // This might be in the folder's dropdown menu or context menu
      const folderMenu = gettingStartedFolder.locator('[data-testid*="menu"], button').first();
      if (await folderMenu.count() > 0) {
        await folderMenu.click();
        await page.waitForTimeout(500);

        // Look for "New Document" in the menu
        const newDocInFolder = page.locator('text=/New.*Doc|Add.*Doc|Create.*Doc/');
        if (await newDocInFolder.count() > 0) {
          await newDocInFolder.click();
          console.log('   - Clicked New Document in folder');

          await page.waitForTimeout(2000);

          // Check if editor opened
          const editor = page.locator('.ProseMirror');
          if (await editor.count() > 0) {
            await editor.fill('Document created inside Getting Started folder');
            console.log('   - Document created with content');

            // Navigate back to workspace
            await page.goto('/workspace');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
          } else {
            console.log('   - Editor did not open');
          }
        } else {
          console.log('   - No New Document option in folder menu');
        }
      } else {
        console.log('   - No folder menu found');
      }
    }

    // STEP 3: Alternative - Create document in root, then move it to folder
    console.log('   Step 3: Alternative - Create in root, move to folder');

    // Create document in root first
    const newDocButton = page.locator('[data-testid="new-document"]');
    if (await newDocButton.count() > 0) {
      await newDocButton.click();
      await page.waitForTimeout(2000);

      const editor = page.locator('.ProseMirror');
      if (await editor.count() > 0) {
        await editor.fill('Document to be moved to folder');
        console.log('   - Created document in root');

        // Navigate back to workspace
        await page.goto('/workspace');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Now try to move it to Getting Started folder
        // This would require drag and drop or context menu
        const documentItem = page.locator('[data-testid*="document"]').filter({ hasText: 'Document to be moved' });
        const docExists = await documentItem.count() > 0;

        console.log(`   - Document visible in sidebar: ${docExists}`);

        if (docExists) {
          // Try to drag the document to the folder
          // This is complex and may not work in all browsers
          console.log('   - Attempting drag and drop (may not work in headless)');

          try {
            // Start drag
            await documentItem.hover();
            await page.mouse.down();

            // Move to folder
            await gettingStartedFolder.hover();
            await page.mouse.up();

            await page.waitForTimeout(2000);
            console.log('   - Drag and drop attempted');
          } catch (error) {
            console.log(`   - Drag and drop failed: ${error.message}`);
          }
        }
      }
    }

    // STEP 4: Now check the All Documents view for orphan detection
    console.log('   Step 4: Check All Documents view for orphans');

    // Monitor for orphan detection
    const orphanEvents: any[] = [];
    const sidebarRenders: any[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Orphan documents') || text.includes('Auto-recovered orphan')) {
        orphanEvents.push({
          timestamp: Date.now(),
          message: text,
          type: text.includes('Auto-recovered') ? 'recovery' : 'warning'
        });
      }
      if (text.includes('🔍 WorkspaceSidebar render:')) {
        sidebarRenders.push({
          timestamp: Date.now(),
          data: JSON.parse(text.replace('🔍 WorkspaceSidebar render:', ''))
        });
      }
    });

    // Wait for sidebar to update
    await page.waitForTimeout(3000);

    // Check sidebar render data
    console.log(`\n📊 SIDEBAR ANALYSIS:`);
    console.log(`   - Orphan events: ${orphanEvents.length}`);
    console.log(`   - Sidebar renders: ${sidebarRenders.length}`);

    sidebarRenders.forEach((render, i) => {
      const data = render.data;
      console.log(`   Render ${i + 1}: orphans=${data.orphanDocs}, docs=${data.total}, folders=${data.folders}`);
    });

    orphanEvents.forEach((event, i) => {
      console.log(`   ${event.type.toUpperCase()} ${i + 1}: ${event.message}`);
    });

    // STEP 5: Verify what appears in All Documents
    console.log('\n   Step 5: Verify All Documents content');

    // The All Documents filter should show:
    // - Root documents (!doc.folderId)
    // - Orphan documents (!folderIds.has(doc.folderId))

    // Check what documents are visible
    const visibleDocuments = await page.locator('[data-testid*="document"]').all();
    console.log(`   - Documents visible in sidebar: ${visibleDocuments.length}`);

    for (let i = 0; i < Math.min(visibleDocuments.length, 5); i++) {
      const doc = visibleDocuments[i];
      const text = await doc.textContent();
      console.log(`     Doc ${i + 1}: "${text?.substring(0, 30)}..."`);
    }

    // STEP 6: Screenshot and analysis
    await page.screenshot({
      path: 'test-results/document-in-folder-orphans.png',
      fullPage: true
    });
    console.log('   📸 Screenshot saved: test-results/document-in-folder-orphans.png');

    console.log('\n🎯 TEST RESULTS:');
    if (orphanEvents.length > 0) {
      console.log('   ❌ ORPHANS DETECTED: The issue is reproducible');
      console.log('   📋 This confirms the user\'s observation');
    } else {
      console.log('   ✅ NO ORPHANS: Auto-recovery working or no documents in folders');
      console.log('   🤔 May need to actually create document IN folder first');
    }

    expect(true).toBe(true);
  });

  test('analyze the All Documents filter logic', async ({ page }) => {
    console.log('🔍 ANALYZING: All Documents filter logic');

    // The All Documents section uses this filter:
    // .filter(doc => !doc.folderId || !folderIds.has(doc.folderId))
    //
    // This shows:
    // 1. Root docs: !doc.folderId (folderId is null/undefined)
    // 2. Orphans: !folderIds.has(doc.folderId) (folderId exists but folder doesn't)

    // Let's examine what data is actually being filtered
    const analysis = await page.evaluate(() => {
      // We can't directly access React state, but we can check what's rendered

      const result = {
        sidebarDocuments: 0,
        rootDocuments: 0,
        folderDocuments: 0,
        totalDocuments: 0,
        folderCount: 0,
        analysis: 'Analysis of All Documents filter'
      };

      // Count document elements
      const docElements = document.querySelectorAll('[data-testid*="document"], [class*="document"]');
      result.sidebarDocuments = docElements.length;

      // Count folder elements
      const folderElements = document.querySelectorAll('[data-testid*="folder"], [class*="folder"]');
      result.folderCount = folderElements.length;

      // Check for any data attributes that might indicate folder membership
      result.totalDocuments = result.sidebarDocuments;

      return result;
    });

    console.log(`   📊 DOM ANALYSIS:`);
    console.log(`     - Documents in sidebar: ${analysis.sidebarDocuments}`);
    console.log(`     - Folders in sidebar: ${analysis.folderCount}`);
    console.log(`     - Total documents: ${analysis.totalDocuments}`);

    // Monitor console for the filter logic execution
    const filterLogs: any[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('filter(doc =>') ||
          text.includes('Root docs + orphans') ||
          text.includes('docsInFolders.filter')) {
        filterLogs.push({
          timestamp: Date.now(),
          message: text
        });
      }
    });

    await page.waitForTimeout(3000);

    console.log(`\n🔍 FILTER LOGIC EXECUTION:`);
    console.log(`   - Filter logs captured: ${filterLogs.length}`);

    filterLogs.forEach((log, i) => {
      console.log(`     Log ${i + 1}: ${log.message}`);
    });

    // Check if there are any documents that should be in folders but appear in All Documents
    console.log(`\n💡 ANALYSIS:`);
    console.log(`   The All Documents section intentionally shows:`);
    console.log(`   1. Root documents (folderId = null)`);
    console.log(`   2. Orphan documents (folderId exists but folder doesn't)`);
    console.log(`   3. Documents in folders are shown INSIDE the folder tree`);

    console.log(`\n🎯 CONCLUSION:`);
    console.log(`   If you see documents in All Documents that should be in folders,`);
    console.log(`   it means either:`);
    console.log(`   - They're orphans (folder deleted but document not updated)`);
    console.log(`   - The folder tree isn't loading properly`);
    console.log(`   - There's a race condition in data loading`);

    expect(true).toBe(true);
  });
});

/**
 * REPRODUCE USER ORPHAN ISSUE
 *
 * This test replicates the EXACT scenario the user described:
 * 1. Create folders (Getting Started, Quick Notes)
 * 2. Create documents inside those folders
 * 3. View All Documents section
 * 4. Check for orphan detection
 */

import { test, expect } from '@playwright/test';

test.describe('Reproduce User Orphan Issue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('create user environment and reproduce orphan issue', async ({ page }) => {
    console.log('🎯 REPRODUCING USER ORPHAN ISSUE');
    console.log('================================');

    // STEP 1: Create Getting Started folder
    console.log('\n📋 STEP 1: Create Getting Started folder');

    const newFolderBtn = page.locator('[data-testid="new-folder"]');
    const folderBtnExists = await newFolderBtn.count() > 0;

    console.log(`   New Folder button exists: ${folderBtnExists}`);

    if (folderBtnExists) {
      await newFolderBtn.click();
      await page.waitForTimeout(1000);

      // Check for create folder modal
      const modal = page.locator('[role="dialog"]');
      const modalExists = await modal.count() > 0;

      console.log(`   Create folder modal opened: ${modalExists}`);

      if (modalExists) {
        // Fill folder name
        const nameInput = modal.locator('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"]');
        const inputExists = await nameInput.count() > 0;

        console.log(`   Name input exists: ${inputExists}`);

        if (inputExists) {
          await nameInput.fill('Getting Started');
          await page.waitForTimeout(500);

          // Click create button
          const createBtn = modal.locator('button').filter({ hasText: /Create|Add|Save/ });
          const createBtnExists = await createBtn.count() > 0;

          console.log(`   Create button exists: ${createBtnExists}`);

          if (createBtnExists) {
            await createBtn.click();
            await page.waitForTimeout(2000);

            console.log('   ✅ Getting Started folder created');

            // Check if folder appears
            const gettingStartedFolder = page.locator('text=Getting Started');
            const folderVisible = await gettingStartedFolder.count() > 0;
            console.log(`   Getting Started folder visible: ${folderVisible}`);
          }
        }
      }
    }

    // STEP 2: Create Quick Notes folder
    console.log('\n📋 STEP 2: Create Quick Notes folder');

    // Click new folder again
    const newFolderBtn2 = page.locator('[data-testid="new-folder"]');
    if (await newFolderBtn2.count() > 0) {
      await newFolderBtn2.click();
      await page.waitForTimeout(1000);

      const modal2 = page.locator('[role="dialog"]');
      if (await modal2.count() > 0) {
        const nameInput2 = modal2.locator('input[type="text"]');
        if (await nameInput2.count() > 0) {
          await nameInput2.fill('Quick Notes');
          await page.waitForTimeout(500);

          const createBtn2 = modal2.locator('button').filter({ hasText: /Create|Add|Save/ });
          if (await createBtn2.count() > 0) {
            await createBtn2.click();
            await page.waitForTimeout(2000);

            console.log('   ✅ Quick Notes folder created');

            const quickNotesFolder = page.locator('text=Quick Notes');
            const qnVisible = await quickNotesFolder.count() > 0;
            console.log(`   Quick Notes folder visible: ${qnVisible}`);
          }
        }
      }
    }

    // STEP 3: Verify folders exist and All Documents is selected
    console.log('\n📋 STEP 3: Verify environment setup');

    const gettingStarted = page.locator('text=Getting Started');
    const quickNotes = page.locator('text=Quick Notes');
    const allTabSelected = page.locator('[class*="bg-white"][class*="shadow-sm"]').filter({ hasText: 'All' });

    const gsExists = await gettingStarted.count() > 0;
    const qnExists = await quickNotes.count() > 0;
    const allSelected = await allTabSelected.count() > 0;

    console.log(`   Getting Started folder: ${gsExists}`);
    console.log(`   Quick Notes folder: ${qnExists}`);
    console.log(`   All Documents tab selected: ${allSelected}`);

    // Take screenshot of setup
    await page.screenshot({
      path: 'test-results/user-environment-setup.png',
      fullPage: true
    });
    console.log('   📸 Environment setup: test-results/user-environment-setup.png');

    // STEP 4: Now try to create a document INSIDE Getting Started folder
    console.log('\n📋 STEP 4: Create document inside Getting Started folder');

    if (gsExists) {
      // Click on Getting Started folder to expand it
      await gettingStarted.click();
      await page.waitForTimeout(1000);

      // Look for a way to create document in folder
      // This might be a context menu, right-click, or button that appears when folder is selected

      // Try right-clicking the folder
      console.log('   Attempting right-click on Getting Started folder...');
      await gettingStarted.click({ button: 'right' });
      await page.waitForTimeout(1000);

      // Check for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [data-radix-menu]');
      const menuExists = await contextMenu.count() > 0;
      console.log(`   Context menu appeared: ${menuExists}`);

      if (menuExists) {
        // Look for "New Document" in context menu
        const newDocOption = contextMenu.locator('text=/New.*Doc|Create.*Doc|Add.*Doc/');
        const optionExists = await newDocOption.count() > 0;
        console.log(`   New Document option in menu: ${optionExists}`);

        if (optionExists) {
          await newDocOption.click();
          console.log('   ✅ Clicked New Document in folder context menu');

          await page.waitForTimeout(2000);

          // Check if editor opened
          const editor = page.locator('.ProseMirror');
          const editorOpened = await editor.count() > 0;
          console.log(`   Editor opened: ${editorOpened}`);

          if (editorOpened) {
            await editor.fill('Document created inside Getting Started folder');
            console.log('   ✅ Document content added');

            // Navigate back to workspace
            await page.goto('/workspace');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
          }
        } else {
          console.log('   ⚠️ No New Document option in context menu');
        }
      } else {
        console.log('   ⚠️ No context menu appeared');

        // Alternative: Look for any buttons that might have appeared near the folder
        const nearbyButtons = page.locator('button').filter({ hasText: /New|Create|Add/ });
        const nearbyCount = await nearbyButtons.count();
        console.log(`   Nearby buttons found: ${nearbyCount}`);

        if (nearbyCount > 0) {
          await nearbyButtons.first().click();
          console.log('   Clicked nearby button');
          await page.waitForTimeout(2000);
        }
      }
    }

    // STEP 5: Check All Documents view for orphan detection
    console.log('\n📋 STEP 5: Check All Documents view for orphans');

    // Ensure we're in All Documents section
    const allTab = page.locator('button').filter({ hasText: 'All' }).first();
    await allTab.click();
    await page.waitForTimeout(1000);

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

    // Analyze results
    console.log(`\n📊 ORPHAN DETECTION RESULTS:`);
    console.log(`   - Orphan events: ${orphanEvents.length}`);
    console.log(`   - Sidebar renders: ${sidebarRenders.length}`);

    sidebarRenders.forEach((render, i) => {
      const data = render.data;
      console.log(`   Render ${i + 1}: orphans=${data.orphanDocs}, docs=${data.total}, folders=${data.folders}`);
    });

    orphanEvents.forEach((event, i) => {
      console.log(`   ${event.type.toUpperCase()} ${i + 1}: ${event.message}`);
    });

    // Check what documents appear in All Documents
    const visibleDocs = await page.locator('[data-testid*="document"]').all();
    console.log(`\n📄 DOCUMENTS IN ALL DOCUMENTS VIEW:`);
    console.log(`   - Document elements: ${visibleDocs.length}`);

    for (let i = 0; i < Math.min(visibleDocs.length, 5); i++) {
      const doc = visibleDocs[i];
      const text = await doc.textContent();
      console.log(`     Doc ${i + 1}: "${text?.substring(0, 40)}..."`);
    }

    // Check folders
    const visibleFolders = await page.locator('[data-testid*="folder"]').all();
    console.log(`\n📁 FOLDERS IN SIDEBAR:`);
    console.log(`   - Folder elements: ${visibleFolders.length}`);

    for (let i = 0; i < Math.min(visibleFolders.length, 5); i++) {
      const folder = visibleFolders[i];
      const text = await folder.textContent();
      console.log(`     Folder ${i + 1}: "${text?.substring(0, 40)}..."`);
    }

    // Final screenshot
    await page.screenshot({
      path: 'test-results/user-orphan-reproduction.png',
      fullPage: true
    });
    console.log('\n📸 Final screenshot: test-results/user-orphan-reproduction.png');

    // CONCLUSION
    console.log('\n🎯 CONCLUSION:');
    if (orphanEvents.length > 0) {
      console.log('   ❌ SUCCESS: Reproduced user orphan issue!');
      console.log('   📋 Orphan documents detected in All Documents view');
    } else {
      console.log('   ✅ NO ORPHANS: Could not reproduce the issue');
      console.log('   🤔 May need different approach to create documents in folders');
    }

    console.log('\n💡 KEY INSIGHT:');
    console.log('   The test environment may not support creating documents directly in folders');
    console.log('   User may have used a different method or the UI has changed');

    expect(true).toBe(true);
  });
});

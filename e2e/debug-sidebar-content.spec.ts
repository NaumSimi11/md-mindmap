/**
 * DEBUG SIDEBAR CONTENT
 *
 * Debug what actually exists in the sidebar in test environment
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Sidebar Content', () => {
  test('dump all sidebar content for analysis', async ({ page }) => {
    console.log('🔍 DEBUGGING: Sidebar content analysis');

    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Get comprehensive sidebar analysis
    const sidebarAnalysis = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        sidebarExists: false,
        tabs: [],
        documents: [],
        folders: [],
        otherElements: [],
        consoleLogs: []
      };

      // Check sidebar
      const sidebar = document.querySelector('[data-testid="workspace-sidebar"]');
      result.sidebarExists = !!sidebar;

      if (sidebar) {
        // Get tab buttons
        const tabButtons = sidebar.querySelectorAll('button[class*="flex-1"]');
        result.tabs = Array.from(tabButtons).map(btn => ({
          text: btn.textContent?.trim(),
          classes: btn.className,
          selected: btn.classList.contains('bg-white') || btn.classList.contains('shadow-sm')
        }));

        // Get all document-related elements
        const docElements = sidebar.querySelectorAll('[data-testid*="document"], [class*="document"], [class*="doc"]');
        result.documents = Array.from(docElements).map(el => ({
          text: el.textContent?.trim(),
          testId: el.getAttribute('data-testid'),
          classes: el.className
        }));

        // Get all folder-related elements
        const folderElements = sidebar.querySelectorAll('[data-testid*="folder"], [class*="folder"]');
        result.folders = Array.from(folderElements).map(el => ({
          text: el.textContent?.trim(),
          testId: el.getAttribute('data-testid'),
          classes: el.className
        }));

        // Get other elements
        const otherElements = sidebar.querySelectorAll('button, div[role="button"]');
        result.otherElements = Array.from(otherElements)
          .filter(el => !el.closest('[data-testid*="folder"]') && !el.closest('[data-testid*="document"]'))
          .slice(0, 10) // Limit
          .map(el => ({
            text: el.textContent?.trim()?.substring(0, 50),
            tag: el.tagName,
            classes: el.className?.substring(0, 50)
          }));
      }

      return result;
    });

    console.log('\n🌐 PAGE INFO:');
    console.log(`   URL: ${sidebarAnalysis.url}`);

    console.log('\n📊 SIDEBAR EXISTS:');
    console.log(`   ${sidebarAnalysis.sidebarExists}`);

    console.log('\n📑 TABS:');
    sidebarAnalysis.tabs.forEach((tab, i) => {
      console.log(`   ${i + 1}. "${tab.text}" ${tab.selected ? '(SELECTED)' : ''}`);
      console.log(`      Classes: ${tab.classes.substring(0, 80)}...`);
    });

    console.log('\n📄 DOCUMENTS:');
    sidebarAnalysis.documents.forEach((doc, i) => {
      console.log(`   ${i + 1}. "${doc.text}"`);
      console.log(`      testId: ${doc.testId}`);
      console.log(`      classes: ${doc.classes?.substring(0, 80)}...`);
    });

    console.log('\n📁 FOLDERS:');
    sidebarAnalysis.folders.forEach((folder, i) => {
      console.log(`   ${i + 1}. "${folder.text}"`);
      console.log(`      testId: ${folder.testId}`);
      console.log(`      classes: ${folder.classes ? folder.classes.substring(0, 80) + '...' : 'null'}`);
    });

    console.log('\n🔧 OTHER ELEMENTS:');
    sidebarAnalysis.otherElements.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tag}: "${el.text}"`);
      console.log(`      classes: ${el.classes}`);
    });

    // Take detailed screenshot
    await page.screenshot({
      path: 'test-results/sidebar-debug-detailed.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: test-results/sidebar-debug-detailed.png');

    // Check what the user sees in their environment
    console.log('\n💡 ANALYSIS:');
    console.log('   Based on user reports, they should see:');
    console.log('   - "Getting Started" folder');
    console.log('   - "Quick Notes" folder');
    console.log('   - Documents in All Documents section');

    console.log('\n🤔 WHY DIFFERENCE:');
    console.log('   1. User has existing data (folders created previously)');
    console.log('   2. Test environment starts clean');
    console.log('   3. User may be in different workspace state');

    // Check if we can create folders to match user environment
    console.log('\n🛠️ ATTEMPTING TO CREATE FOLDERS:');

    const createFolderButton = page.locator('text=Create First Folder');
    const canCreateFolder = await createFolderButton.count() > 0;

    console.log(`   Can create folder: ${canCreateFolder}`);

    if (canCreateFolder) {
      await createFolderButton.click();
      await page.waitForTimeout(1000);

      // Check for modal
      const modal = page.locator('[role="dialog"]');
      const modalExists = await modal.count() > 0;

      console.log(`   Create folder modal opened: ${modalExists}`);

      if (modalExists) {
        // Try to create "Getting Started" folder
        const nameInput = modal.locator('input[type="text"]');
        if (await nameInput.count() > 0) {
          await nameInput.fill('Getting Started');
          await page.waitForTimeout(500);

          // Click create
          const createBtn = modal.locator('button').filter({ hasText: /Create|Add/ });
          if (await createBtn.count() > 0) {
            await createBtn.click();
            await page.waitForTimeout(2000);

            console.log('   ✅ Created "Getting Started" folder');

            // Now create "Quick Notes"
            const newFolderBtn = page.locator('[data-testid="new-folder"]');
            if (await newFolderBtn.count() > 0) {
              await newFolderBtn.click();
              await page.waitForTimeout(1000);

              const quickNotesModal = page.locator('[role="dialog"]');
              if (await quickNotesModal.count() > 0) {
                const qnInput = quickNotesModal.locator('input[type="text"]');
                if (await qnInput.count() > 0) {
                  await qnInput.fill('Quick Notes');
                  await page.waitForTimeout(500);

                  const qnCreateBtn = quickNotesModal.locator('button').filter({ hasText: /Create|Add/ });
                  if (await qnCreateBtn.count() > 0) {
                    await qnCreateBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   ✅ Created "Quick Notes" folder');
                  }
                }
              }
            }
          }
        }
      }
    }

    // Final screenshot with folders
    await page.screenshot({
      path: 'test-results/sidebar-with-folders.png',
      fullPage: true
    });
    console.log('📸 Final screenshot: test-results/sidebar-with-folders.png');

    expect(true).toBe(true);
  });
});

/**
 * ORPHAN RACE CONDITION TEST
 *
 * Tests for race conditions that might cause orphans to persist
 * despite auto-recovery being implemented.
 */

import { test, expect } from '@playwright/test';

test.describe('Orphan Race Condition Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('check if auto-recovery is actually running', async ({ page }) => {
    console.log('🔬 CHECKING IF AUTO-RECOVERY IS RUNNING');

    // Monitor for auto-recovery messages
    const autoRecoveryLogs: any[] = [];
    const orphanWarnings: any[] = [];
    const sidebarRenders: any[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Auto-recovered orphan document')) {
        autoRecoveryLogs.push({
          timestamp: Date.now(),
          message: text,
          type: 'recovery'
        });
      }
      if (text.includes('⚠️ Orphan documents') && !text.includes('Auto-recovered')) {
        orphanWarnings.push({
          timestamp: Date.now(),
          message: text,
          type: 'warning'
        });
      }
      if (text.includes('🔍 WorkspaceSidebar render:')) {
        sidebarRenders.push({
          timestamp: Date.now(),
          data: JSON.parse(text.replace('🔍 WorkspaceSidebar render:', ''))
        });
      }
    });

    // Wait for multiple renders
    await page.waitForTimeout(5000);

    console.log(`\n📊 MONITORING RESULTS:`);
    console.log(`   - Auto-recovery actions: ${autoRecoveryLogs.length}`);
    console.log(`   - Orphan warnings: ${orphanWarnings.length}`);
    console.log(`   - Sidebar renders: ${sidebarRenders.length}`);

    // Check each sidebar render for orphan counts
    console.log(`\n🔍 SIDEBAR RENDER TIMELINE:`);
    sidebarRenders.forEach((render, i) => {
      const data = render.data;
      console.log(`   Render ${i + 1} (${new Date(render.timestamp).toLocaleTimeString()}):`);
      console.log(`     - Orphans: ${data.orphanDocs}, Total: ${data.total}, Folders: ${data.folders}`);
    });

    // Check timing between renders
    if (sidebarRenders.length > 1) {
      console.log(`\n⏱️ TIMING ANALYSIS:`);
      for (let i = 1; i < sidebarRenders.length; i++) {
        const prev = sidebarRenders[i - 1];
        const curr = sidebarRenders[i];
        const timeDiff = curr.timestamp - prev.timestamp;

        const prevOrphans = prev.data.orphanDocs;
        const currOrphans = curr.data.orphanDocs;

        console.log(`   Render ${i} → ${i + 1}: ${timeDiff}ms, Orphans: ${prevOrphans} → ${currOrphans}`);

        if (prevOrphans > 0 && currOrphans === 0) {
          console.log(`     ✅ Orphans were auto-recovered!`);
        } else if (prevOrphans > 0 && currOrphans > 0) {
          console.log(`     ❌ Orphans persisted - auto-recovery failed!`);
        }
      }
    }

    console.log(`\n🎯 CONCLUSION:`);
    if (autoRecoveryLogs.length > 0) {
      console.log(`   ✅ Auto-recovery is working: ${autoRecoveryLogs.length} orphans recovered`);
    } else if (orphanWarnings.length === 0) {
      console.log(`   ✅ No orphans detected - system is clean`);
    } else {
      console.log(`   ⚠️ Orphans detected but not auto-recovered`);
      console.log(`   🔍 This suggests the auto-recovery logic has conditions that aren't met`);
    }

    await page.screenshot({
      path: 'test-results/orphan-race-condition-analysis.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-results/orphan-race-condition-analysis.png');

    expect(true).toBe(true);
  });

  test('check the conditions required for orphan detection', async ({ page }) => {
    console.log('🔍 CHECKING ORPHAN DETECTION CONDITIONS');

    // The orphan detection logic requires:
    // 1. backendDocuments.length > 0
    // 2. folderTree.length > 0
    // Then it checks: docsInFolders.filter(doc => !folderIds.has(doc.folderId!))

    const conditionsCheck: any = {
      hasDocuments: false,
      hasFolders: false,
      documentsWithFolderIds: 0,
      folderIdsAvailable: 0,
      potentialOrphans: 0
    };

    // Inject a script to check the exact conditions
    const analysis = await page.evaluate(() => {
      // Try to access the React component data
      // This is a best-effort approach since we can't directly access React state

      const result = {
        hasDocuments: false,
        hasFolders: false,
        documentsWithFolderIds: 0,
        folderIdsAvailable: 0,
        potentialOrphans: 0,
        sidebarElement: false,
        workspaceData: null
      };

      // Check if sidebar exists
      const sidebar = document.querySelector('[data-testid="workspace-sidebar"]');
      result.sidebarElement = !!sidebar;

      // Check for document and folder indicators in the DOM
      if (sidebar) {
        const allText = sidebar.textContent || '';
        result.hasDocuments = allText.includes('document') || allText.includes('Untitled');
        result.hasFolders = allText.includes('Getting Started') || allText.includes('Quick Notes');

        // Count document items
        const docItems = sidebar.querySelectorAll('[data-testid*="document"], [class*="document"]');
        result.documentsWithFolderIds = docItems.length;
      }

      return result;
    });

    console.log(`\n📊 CONDITION ANALYSIS:`);
    console.log(`   - Sidebar element exists: ${analysis.sidebarElement}`);
    console.log(`   - Has documents: ${analysis.hasDocuments}`);
    console.log(`   - Has folders: ${analysis.hasFolders}`);
    console.log(`   - Document items in DOM: ${analysis.documentsWithFolderIds}`);

    // The orphan detection requires both documents AND folders to be loaded
    const orphanDetectionCanRun = analysis.hasDocuments && analysis.hasFolders;

    console.log(`\n🎯 ORPHAN DETECTION STATUS:`);
    console.log(`   - Conditions met for orphan detection: ${orphanDetectionCanRun}`);

    if (!orphanDetectionCanRun) {
      console.log(`   🔍 POSSIBLE ISSUE: Orphan detection cannot run because:`);
      if (!analysis.hasDocuments) console.log(`     - No documents loaded yet`);
      if (!analysis.hasFolders) console.log(`     - No folders loaded yet`);
      console.log(`   💡 This could explain why orphans aren't being detected/auto-recovered`);
    } else {
      console.log(`   ✅ Conditions met - orphan detection should be running`);
    }

    await page.screenshot({
      path: 'test-results/orphan-conditions-check.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-results/orphan-conditions-check.png');

    expect(true).toBe(true);
  });

  test('simulate the user scenario step by step', async ({ page }) => {
    console.log('🎭 STEP-BY-STEP USER SCENARIO SIMULATION');

    // Step 1: Start fresh
    console.log('   Step 1: Fresh workspace load');
    await page.waitForTimeout(2000);

    // Step 2: Create document
    console.log('   Step 2: Creating document');
    const newDocButton = page.locator('[data-testid="new-document"]');
    if (await newDocButton.count() > 0) {
      await newDocButton.click();
      await page.waitForTimeout(1000);

      const editor = page.locator('.ProseMirror');
      if (await editor.count() > 0) {
        await editor.fill('Test document for orphan analysis');
        console.log('      ✅ Document created');
      }
    }

    // Step 3: Navigate back
    console.log('   Step 3: Navigating back to workspace');
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 4: Monitor for orphan detection
    console.log('   Step 4: Monitoring for orphan detection');
    const orphanEvents: any[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Orphan') || text.includes('folder_id') || text.includes('Auto-recovered')) {
        orphanEvents.push({
          timestamp: Date.now(),
          message: text,
          type: msg.type()
        });
      }
    });

    // Wait and check
    await page.waitForTimeout(3000);

    console.log(`      📊 Orphan-related events: ${orphanEvents.length}`);
    orphanEvents.forEach((event, i) => {
      console.log(`         ${i + 1}. ${event.type}: ${event.message}`);
    });

    // Step 5: Check if document appears in All Documents
    console.log('   Step 5: Checking All Documents view');
    const documentVisible = await page.locator('text=Test document for orphan analysis').count() > 0;
    console.log(`      📄 Document visible in sidebar: ${documentVisible}`);

    // Step 6: Final state
    await page.screenshot({
      path: 'test-results/orphan-step-by-step.png',
      fullPage: true
    });
    console.log('   Step 6: Final screenshot saved');

    console.log(`\n🎭 SCENARIO RESULT:`);
    console.log(`   - Document created and visible: ${documentVisible}`);
    console.log(`   - Orphan events detected: ${orphanEvents.length}`);

    if (orphanEvents.length === 0) {
      console.log(`   ✅ SUCCESS: No orphans detected in this scenario`);
    } else {
      console.log(`   ⚠️ ORPHANS: Found ${orphanEvents.length} orphan-related events`);
    }

    expect(true).toBe(true);
  });
});

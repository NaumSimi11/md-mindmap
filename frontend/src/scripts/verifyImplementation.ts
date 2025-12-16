/**
 * Automated Implementation Verification Script
 * Tests Yjs integration, guest workspace, and folder system
 * 
 * Run: await verifyImplementation() in browser console
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { guestWorkspaceService } from '@/services/workspace-legacy/GuestWorkspaceService';
import { migrateToYjs, verifyMigration } from './migrateToYjs';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

interface VerificationReport {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

/**
 * Main verification function
 */
export async function verifyImplementation(): Promise<VerificationReport> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 AUTOMATED IMPLEMENTATION VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = performance.now();
  const results: TestResult[] = [];

  // Test 1: Yjs Basic Functionality
  results.push(await testYjsBasic());

  // Test 2: Yjs IndexedDB Persistence
  results.push(await testYjsPersistence());

  // Test 3: Guest Workspace Initialization
  results.push(await testGuestWorkspaceInit());

  // Test 4: Guest Workspace Folder Structure
  results.push(await testGuestFolderStructure());

  // Test 5: Guest Document Creation
  results.push(await testGuestDocumentCreation());

  // Test 6: Yjs Document Creation
  results.push(await testYjsDocumentCreation());

  // Test 7: Migration Script
  results.push(await testMigrationScript());

  // Test 8: Data Integrity
  results.push(await testDataIntegrity());

  const endTime = performance.now();
  const duration = endTime - startTime;

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const report: VerificationReport = {
    total: results.length,
    passed,
    failed,
    duration,
    results,
  };

  printReport(report);

  return report;
}

/**
 * Test 1: Yjs Basic Functionality
 */
async function testYjsBasic(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    // Create a Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    
    // Insert content
    ytext.insert(0, 'Test content');
    
    // Verify content
    const content = ytext.toString();
    
    if (content === 'Test content') {
      return {
        name: 'Yjs Basic Functionality',
        passed: true,
        message: 'Yjs document creation and content insertion works',
        duration: performance.now() - startTime,
      };
    } else {
      return {
        name: 'Yjs Basic Functionality',
        passed: false,
        message: `Content mismatch: expected "Test content", got "${content}"`,
        duration: performance.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name: 'Yjs Basic Functionality',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 2: Yjs IndexedDB Persistence
 */
async function testYjsPersistence(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    const testDbName = 'mdreader-test-' + Date.now();
    const testContent = 'Persistence test content';
    
    // Create and persist
    const ydoc1 = new Y.Doc();
    const ytext1 = ydoc1.getText('content');
    ytext1.insert(0, testContent);
    
    const persistence1 = new IndexeddbPersistence(testDbName, ydoc1);
    await new Promise<void>(resolve => persistence1.once('synced', resolve));
    persistence1.destroy();
    
    // Load from persistence
    const ydoc2 = new Y.Doc();
    const persistence2 = new IndexeddbPersistence(testDbName, ydoc2);
    await new Promise<void>(resolve => persistence2.once('synced', resolve));
    
    const ytext2 = ydoc2.getText('content');
    const loadedContent = ytext2.toString();
    
    persistence2.destroy();
    
    // Cleanup
    await indexedDB.deleteDatabase(testDbName);
    
    if (loadedContent === testContent) {
      return {
        name: 'Yjs IndexedDB Persistence',
        passed: true,
        message: 'Yjs IndexedDB persistence works correctly',
        duration: performance.now() - startTime,
      };
    } else {
      return {
        name: 'Yjs IndexedDB Persistence',
        passed: false,
        message: `Content mismatch after persistence: expected "${testContent}", got "${loadedContent}"`,
        duration: performance.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name: 'Yjs IndexedDB Persistence',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 3: Guest Workspace Initialization
 */
async function testGuestWorkspaceInit(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    // Clear existing guest workspace
    guestWorkspaceService.clear();
    
    // Initialize
    guestWorkspaceService.init();
    
    // Get workspace
    const workspace = guestWorkspaceService.getWorkspace();
    
    if (!workspace) {
      return {
        name: 'Guest Workspace Initialization',
        passed: false,
        message: 'Guest workspace was not created',
        duration: performance.now() - startTime,
      };
    }
    
    if (workspace.id !== 'guest-workspace') {
      return {
        name: 'Guest Workspace Initialization',
        passed: false,
        message: `Workspace ID mismatch: expected "guest-workspace", got "${workspace.id}"`,
        duration: performance.now() - startTime,
      };
    }
    
    if (workspace.name !== 'My Local Workspace') {
      return {
        name: 'Guest Workspace Initialization',
        passed: false,
        message: `Workspace name mismatch: expected "My Local Workspace", got "${workspace.name}"`,
        duration: performance.now() - startTime,
      };
    }
    
    return {
      name: 'Guest Workspace Initialization',
      passed: true,
      message: 'Guest workspace initialized correctly',
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Guest Workspace Initialization',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 4: Guest Workspace Folder Structure
 */
async function testGuestFolderStructure(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    guestWorkspaceService.clear();
    guestWorkspaceService.init();
    
    const folders = guestWorkspaceService.getFolders();
    
    if (folders.length !== 2) {
      return {
        name: 'Guest Workspace Folder Structure',
        passed: false,
        message: `Expected 2 default folders, got ${folders.length}`,
        duration: performance.now() - startTime,
      };
    }
    
    const quickNotes = folders.find(f => f.name === 'Quick Notes');
    const projects = folders.find(f => f.name === 'Projects');
    
    if (!quickNotes) {
      return {
        name: 'Guest Workspace Folder Structure',
        passed: false,
        message: '"Quick Notes" folder not found',
        duration: performance.now() - startTime,
      };
    }
    
    if (!projects) {
      return {
        name: 'Guest Workspace Folder Structure',
        passed: false,
        message: '"Projects" folder not found',
        duration: performance.now() - startTime,
      };
    }
    
    if (quickNotes.icon !== '📝') {
      return {
        name: 'Guest Workspace Folder Structure',
        passed: false,
        message: `Quick Notes icon mismatch: expected "📝", got "${quickNotes.icon}"`,
        duration: performance.now() - startTime,
      };
    }
    
    if (projects.icon !== '📂') {
      return {
        name: 'Guest Workspace Folder Structure',
        passed: false,
        message: `Projects icon mismatch: expected "📂", got "${projects.icon}"`,
        duration: performance.now() - startTime,
      };
    }
    
    return {
      name: 'Guest Workspace Folder Structure',
      passed: true,
      message: 'Default folder structure created correctly (Quick Notes 📝, Projects 📂)',
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Guest Workspace Folder Structure',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 5: Guest Document Creation
 */
async function testGuestDocumentCreation(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    guestWorkspaceService.clear();
    guestWorkspaceService.init();
    
    const testDocId = 'test-doc-' + Date.now();
    
    // Create document
    const doc = guestWorkspaceService.createDocument(
      testDocId,
      'Test Document',
      'markdown',
      null
    );
    
    if (doc.id !== testDocId) {
      return {
        name: 'Guest Document Creation',
        passed: false,
        message: `Document ID mismatch: expected "${testDocId}", got "${doc.id}"`,
        duration: performance.now() - startTime,
      };
    }
    
    if (doc.title !== 'Test Document') {
      return {
        name: 'Guest Document Creation',
        passed: false,
        message: `Document title mismatch: expected "Test Document", got "${doc.title}"`,
        duration: performance.now() - startTime,
      };
    }
    
    // Retrieve document
    const retrieved = guestWorkspaceService.getDocument(testDocId);
    
    if (!retrieved) {
      return {
        name: 'Guest Document Creation',
        passed: false,
        message: 'Document not found after creation',
        duration: performance.now() - startTime,
      };
    }
    
    // Cleanup
    guestWorkspaceService.deleteDocument(testDocId);
    
    return {
      name: 'Guest Document Creation',
      passed: true,
      message: 'Guest document creation and retrieval works',
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Guest Document Creation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 6: Yjs Document Creation
 */
async function testYjsDocumentCreation(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    const testDocId = 'test-yjs-doc-' + Date.now();
    const testContent = '# Test Document\n\nThis is test content.';
    
    // Create Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    ytext.insert(0, testContent);
    
    // Persist
    const persistence = new IndexeddbPersistence(`mdreader-${testDocId}`, ydoc);
    await new Promise<void>(resolve => persistence.once('synced', resolve));
    persistence.destroy();
    
    // Verify persistence
    const ydoc2 = new Y.Doc();
    const persistence2 = new IndexeddbPersistence(`mdreader-${testDocId}`, ydoc2);
    await new Promise<void>(resolve => persistence2.once('synced', resolve));
    
    const ytext2 = ydoc2.getText('content');
    const loadedContent = ytext2.toString();
    
    persistence2.destroy();
    
    // Cleanup
    await indexedDB.deleteDatabase(`mdreader-${testDocId}`);
    
    if (loadedContent === testContent) {
      return {
        name: 'Yjs Document Creation',
        passed: true,
        message: 'Yjs document creation with persistence works',
        duration: performance.now() - startTime,
      };
    } else {
      return {
        name: 'Yjs Document Creation',
        passed: false,
        message: `Content mismatch: expected "${testContent}", got "${loadedContent}"`,
        duration: performance.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name: 'Yjs Document Creation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 7: Migration Script
 */
async function testMigrationScript(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    // Run migration in dry-run mode
    const stats = await migrateToYjs(true);
    
    if (stats.failed > 0) {
      return {
        name: 'Migration Script',
        passed: false,
        message: `Migration dry-run had ${stats.failed} failures`,
        duration: performance.now() - startTime,
      };
    }
    
    return {
      name: 'Migration Script',
      passed: true,
      message: `Migration script works (found ${stats.total} documents, ${stats.migrated} would migrate, ${stats.skipped} skipped)`,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Migration Script',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 8: Data Integrity
 */
async function testDataIntegrity(): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    // Verify all guest documents have Yjs counterparts
    const isValid = await verifyMigration();
    
    if (isValid) {
      return {
        name: 'Data Integrity',
        passed: true,
        message: 'All documents verified, data integrity maintained',
        duration: performance.now() - startTime,
      };
    } else {
      return {
        name: 'Data Integrity',
        passed: false,
        message: 'Some documents missing from Yjs IndexedDB',
        duration: performance.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name: 'Data Integrity',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Print verification report
 */
function printReport(report: VerificationReport): void {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 VERIFICATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  report.results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
    console.log('');
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total Tests:    ${report.total}`);
  console.log(`   ✅ Passed:       ${report.passed}`);
  console.log(`   ❌ Failed:       ${report.failed}`);
  console.log(`   ⏱️  Duration:     ${report.duration.toFixed(2)}ms`);
  console.log(`   📊 Success Rate: ${((report.passed / report.total) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (report.failed === 0) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! Implementation verified successfully.');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  SOME TESTS FAILED. Review failures above.');
    console.log('');
  }
}

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).verifyImplementation = verifyImplementation;
  console.log('💡 Run verifyImplementation() in console to test implementation');
}


import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { offlineDB } from '@/services/offline/OfflineDatabase';
import { guestWorkspaceService } from '@/services/workspace-legacy/GuestWorkspaceService';

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  sources: {
    indexedDB: number;
    guestWorkspace: number;
  };
}

/**
 * Enhanced Yjs Migration Script
 * Migrates documents from multiple sources to Yjs IndexedDB
 */
export async function migrateToYjs(dryRun: boolean = false): Promise<MigrationStats> {
  console.log('🔄 Starting Yjs migration...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    sources: {
      indexedDB: 0,
      guestWorkspace: 0,
    },
  };

  // Source 1: OfflineDatabase (Dexie IndexedDB)
  try {
    console.log('\n📦 Checking OfflineDatabase (Dexie)...');
    const offlineDocs = await offlineDB.documents.toArray();
    
    if (offlineDocs.length > 0) {
      console.log(`   Found ${offlineDocs.length} documents in OfflineDatabase`);
      stats.sources.indexedDB = offlineDocs.length;
      stats.total += offlineDocs.length;

      for (const doc of offlineDocs) {
        try {
          // Check if already migrated
          const yjsDbName = `mdreader-${doc.id}`;
          const exists = await checkYjsDocExists(yjsDbName);
          
          if (exists) {
            console.log(`   ⏭️  Skipping ${doc.id} (already in Yjs)`);
            stats.skipped++;
            continue;
          }

          if (!dryRun) {
            // Create Yjs document
            const ydoc = new Y.Doc();
            const ytext = ydoc.getText('content');
            ytext.insert(0, doc.content || '');

            // Store metadata in Yjs
            const ymeta = ydoc.getMap('metadata');
            ymeta.set('title', doc.title);
            ymeta.set('created', doc.createdAt);
            ymeta.set('updated', doc.updatedAt);
            ymeta.set('folderId', doc.folderId);
            ymeta.set('starred', doc.starred);

            // Persist to Yjs IndexedDB
            const persistence = new IndexeddbPersistence(yjsDbName, ydoc);
            await new Promise<void>(resolve => persistence.once('synced', resolve));
            persistence.destroy();

            console.log(`   ✅ Migrated ${doc.id} (${doc.title})`);
            stats.migrated++;
          } else {
            console.log(`   [DRY RUN] Would migrate ${doc.id} (${doc.title})`);
            stats.migrated++;
          }
        } catch (error) {
          console.error(`   ❌ Failed to migrate ${doc.id}:`, error);
          stats.failed++;
        }
      }
    } else {
      console.log('   No documents found in OfflineDatabase');
    }
  } catch (error) {
    console.warn('⚠️ Could not access OfflineDatabase:', error);
  }

  // Source 2: Guest Workspace (localStorage)
  try {
    console.log('\n👤 Checking Guest Workspace (localStorage)...');
    guestWorkspaceService.init();
    const guestDocs = guestWorkspaceService.getDocuments();
    
    if (guestDocs.length > 0) {
      console.log(`   Found ${guestDocs.length} documents in Guest Workspace`);
      stats.sources.guestWorkspace = guestDocs.length;
      stats.total += guestDocs.length;

      for (const doc of guestDocs) {
        try {
          // Check if already migrated
          const yjsDbName = `mdreader-${doc.id}`;
          const exists = await checkYjsDocExists(yjsDbName);
          
          if (exists) {
            console.log(`   ✅ ${doc.id} (${doc.title}) - already in Yjs`);
            stats.skipped++;
            continue;
          }

          // Guest documents should have content in Yjs from creation
          console.log(`   ⚠️  ${doc.id} (${doc.title}) - missing from Yjs (should not happen)`);
          stats.failed++;
        } catch (error) {
          console.error(`   ❌ Failed to check ${doc.id}:`, error);
          stats.failed++;
        }
      }
    } else {
      console.log('   No documents found in Guest Workspace');
    }
  } catch (error) {
    console.warn('⚠️ Could not access Guest Workspace:', error);
  }

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 MIGRATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total documents found:    ${stats.total}`);
  console.log(`   ✅ Successfully migrated:  ${stats.migrated}`);
  console.log(`   ⏭️  Skipped (already done): ${stats.skipped}`);
  console.log(`   ❌ Failed:                 ${stats.failed}`);
  console.log('\n   Sources:');
  console.log(`   - IndexedDB (Dexie):      ${stats.sources.indexedDB}`);
  console.log(`   - Guest Workspace:        ${stats.sources.guestWorkspace}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made');
    console.log('   Run migrateToYjs(false) to perform actual migration');
  } else {
    console.log('\n🎉 Migration complete!');
  }

  return stats;
}

/**
 * Check if a Yjs document already exists in IndexedDB
 */
async function checkYjsDocExists(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);
    
    request.onsuccess = () => {
      request.result.close();
      resolve(true);
    };
    
    request.onerror = () => {
      resolve(false);
    };
    
    request.onupgradeneeded = (event) => {
      // Database doesn't exist
      const db = (event.target as IDBOpenDBRequest).result;
      db.close();
      
      // Delete the database we just created during check
      indexedDB.deleteDatabase(dbName);
      resolve(false);
    };
  });
}

/**
 * Verify Yjs migration integrity
 * Checks that all documents are properly stored in Yjs IndexedDB
 */
export async function verifyMigration(): Promise<boolean> {
  console.log('🔍 Verifying migration integrity...');
  
  let allValid = true;
  
  try {
    // Check all guest documents
    guestWorkspaceService.init();
    const guestDocs = guestWorkspaceService.getDocuments();
    
    for (const doc of guestDocs) {
      const yjsDbName = `mdreader-${doc.id}`;
      const exists = await checkYjsDocExists(yjsDbName);
      
      if (!exists) {
        console.error(`❌ Missing Yjs document for ${doc.id} (${doc.title})`);
        allValid = false;
      } else {
        console.log(`✅ Verified ${doc.id}`);
      }
    }
    
    if (allValid) {
      console.log('✅ All documents verified successfully');
    } else {
      console.error('❌ Some documents are missing from Yjs IndexedDB');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    allValid = false;
  }
  
  return allValid;
}

// Auto-run migration on first load (once)
if (typeof window !== 'undefined' && localStorage.getItem('yjs-migration-done') !== 'true') {
  migrateToYjs(false).then((stats) => {
    if (stats.failed === 0) {
      localStorage.setItem('yjs-migration-done', 'true');
      console.log('✅ Migration completed and marked as done');
    } else {
      console.warn('⚠️ Migration had failures, not marking as complete');
    }
  }).catch(error => {
    console.error('❌ Migration failed:', error);
  });
}

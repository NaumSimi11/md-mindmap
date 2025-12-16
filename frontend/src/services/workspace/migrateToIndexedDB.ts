/**
 * localStorage → IndexedDB Migration
 * 
 * Migrates guest workspace data from localStorage to IndexedDB.
 * This is a one-time migration that runs automatically on app initialization.
 * 
 * Migration Flow:
 * 1. Check if migration already done (setting in IndexedDB)
 * 2. Load data from localStorage (legacy keys)
 * 3. Transform to new format
 * 4. Save to IndexedDB
 * 5. Mark migration complete
 * 6. Optional: Clear localStorage (keep for backup initially)
 */

import { guestWorkspaceService } from './GuestWorkspaceService';
import type { Workspace, Folder, DocumentMeta } from './types';

// Legacy localStorage keys
const LEGACY_WORKSPACES_KEY = 'mdreader:guest:workspaces';
const LEGACY_FOLDERS_KEY = 'mdreader:guest:folders';
const LEGACY_DOCUMENTS_KEY = 'mdreader:guest:documents';
const LEGACY_CURRENT_WORKSPACE_KEY = 'mdreader:guest:current-workspace-id';

// Even older legacy keys (for backward compatibility)
const OLDER_WORKSPACE_KEY = 'mdreader-guest-workspace';
const OLDER_FOLDERS_KEY = 'mdreader-guest-folders';
const OLDER_DOCUMENTS_KEY = 'mdreader-guest-documents';

// Migration status key
const MIGRATION_COMPLETE_KEY = 'localStorage_to_indexeddb_migration_complete';

interface LegacyWorkspace {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  sync?: {
    status: 'local';
    localVersion: number;
  };
}

interface LegacyFolder {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  workspaceId: string;
  position: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
  sync?: {
    status: 'local';
    localVersion: number;
  };
}

interface LegacyDocument {
  id: string;
  title: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  content?: string;
  folderId: string | null;
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  sync?: {
    status: 'local';
    localVersion: number;
  };
}

/**
 * Check if migration has already been completed
 */
async function isMigrationComplete(): Promise<boolean> {
  try {
    const setting = await guestWorkspaceService.getSetting(MIGRATION_COMPLETE_KEY);
    return setting === true;
  } catch (error) {
    return false;
  }
}

/**
 * Load workspaces from localStorage
 */
function loadLegacyWorkspaces(): LegacyWorkspace[] {
  // Try new legacy format first
  const saved = localStorage.getItem(LEGACY_WORKSPACES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('❌ Failed to parse legacy workspaces:', error);
    }
  }
  
  // Try older format (single workspace)
  const oldSaved = localStorage.getItem(OLDER_WORKSPACE_KEY);
  if (oldSaved) {
    try {
      const workspace = JSON.parse(oldSaved);
      return [workspace];
    } catch (error) {
      console.error('❌ Failed to parse older workspace:', error);
    }
  }
  
  return [];
}

/**
 * Load folders from localStorage
 */
function loadLegacyFolders(): LegacyFolder[] {
  const saved = localStorage.getItem(LEGACY_FOLDERS_KEY) || localStorage.getItem(OLDER_FOLDERS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('❌ Failed to parse legacy folders:', error);
    }
  }
  return [];
}

/**
 * Load documents from localStorage
 */
function loadLegacyDocuments(): LegacyDocument[] {
  const saved = localStorage.getItem(LEGACY_DOCUMENTS_KEY) || localStorage.getItem(OLDER_DOCUMENTS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('❌ Failed to parse legacy documents:', error);
    }
  }
  return [];
}

/**
 * Transform legacy data to new format
 */
function transformWorkspace(legacy: LegacyWorkspace): Workspace {
  return {
    id: legacy.id,
    name: legacy.name,
    icon: legacy.icon || '💻',
    description: undefined,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    syncStatus: 'local',
    lastSyncedAt: undefined,
    version: legacy.sync?.localVersion || 1,
  };
}

function transformFolder(legacy: LegacyFolder): Folder {
  return {
    id: legacy.id,
    workspaceId: legacy.workspaceId,
    name: legacy.name,
    icon: legacy.icon || '📁',
    parentId: legacy.parentId,
    position: legacy.position || 0,
    isExpanded: legacy.isExpanded ?? true,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    syncStatus: 'local',
    lastSyncedAt: undefined,
    version: legacy.sync?.localVersion || 1,
  };
}

function transformDocument(legacy: LegacyDocument): DocumentMeta {
  return {
    id: legacy.id,
    workspaceId: legacy.workspaceId,
    folderId: legacy.folderId,
    title: legacy.title,
    type: legacy.type,
    content: legacy.content || '',  // 🔥 Migrate content!
    starred: legacy.starred || false,
    tags: legacy.tags || [],
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    lastOpenedAt: legacy.lastOpenedAt,
    syncStatus: 'local',
    lastSyncedAt: undefined,
    version: legacy.sync?.localVersion || 1,
  };
}

/**
 * Perform the migration
 */
export async function migrateLocalStorageToIndexedDB(): Promise<void> {
  try {
    console.log('🔄 Checking for localStorage → IndexedDB migration...');
    
    // Check if already migrated
    const alreadyMigrated = await isMigrationComplete();
    if (alreadyMigrated) {
      console.log('✅ Migration already completed');
      return;
    }
    
    // Load legacy data
    const legacyWorkspaces = loadLegacyWorkspaces();
    const legacyFolders = loadLegacyFolders();
    const legacyDocuments = loadLegacyDocuments();
    
    // Check if there's any data to migrate
    if (legacyWorkspaces.length === 0 && legacyFolders.length === 0 && legacyDocuments.length === 0) {
      console.log('ℹ️ No legacy data found, skipping migration');
      await guestWorkspaceService.setSetting(MIGRATION_COMPLETE_KEY, true);
      return;
    }
    
    console.log('📦 Found legacy data:');
    console.log(`   - ${legacyWorkspaces.length} workspace(s)`);
    console.log(`   - ${legacyFolders.length} folder(s)`);
    console.log(`   - ${legacyDocuments.length} document(s)`);
    
    let migratedWorkspaces = 0;
    let migratedFolders = 0;
    let migratedDocuments = 0;
    
    // Migrate workspaces
    for (const legacyWorkspace of legacyWorkspaces) {
      try {
        const workspace = transformWorkspace(legacyWorkspace);
        
        // Check if workspace already exists in IndexedDB
        const existing = await guestWorkspaceService.getWorkspace(workspace.id);
        if (!existing) {
          // Use raw add method (bypasses validation, preserves IDs)
          await guestWorkspaceService.addWorkspaceRaw(workspace);
          migratedWorkspaces++;
          console.log(`   ✅ Migrated workspace: ${workspace.name}`);
        } else {
          console.log(`   ⏭️ Workspace already exists: ${workspace.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to migrate workspace ${legacyWorkspace.id}:`, error);
      }
    }
    
    // Migrate folders
    for (const legacyFolder of legacyFolders) {
      try {
        const folder = transformFolder(legacyFolder);
        
        // Check if folder already exists
        const existing = await guestWorkspaceService.getFolder(folder.id);
        if (!existing) {
          await guestWorkspaceService.addFolderRaw(folder);
          migratedFolders++;
          console.log(`   ✅ Migrated folder: ${folder.name}`);
        } else {
          console.log(`   ⏭️ Folder already exists: ${folder.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to migrate folder ${legacyFolder.id}:`, error);
      }
    }
    
    // Migrate documents
    for (const legacyDocument of legacyDocuments) {
      try {
        const document = transformDocument(legacyDocument);
        
        // Check if document already exists
        const existing = await guestWorkspaceService.getDocument(document.id);
        if (!existing) {
          await guestWorkspaceService.addDocumentRaw(document);
          migratedDocuments++;
          console.log(`   ✅ Migrated document: ${document.title} (${document.content.length} chars)`);
        } else {
          console.log(`   ⏭️ Document already exists: ${document.title}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to migrate document ${legacyDocument.id}:`, error);
      }
    }
    
    // Mark migration complete
    await guestWorkspaceService.setSetting(MIGRATION_COMPLETE_KEY, true);
    
    console.log('✅ Migration complete:');
    console.log(`   - Migrated ${migratedWorkspaces} workspace(s)`);
    console.log(`   - Migrated ${migratedFolders} folder(s)`);
    console.log(`   - Migrated ${migratedDocuments} document(s)`);
    
    // Don't clear localStorage yet (keep as backup for 1-2 versions)
    console.log('ℹ️ localStorage data kept as backup');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Clear localStorage after successful migration (optional, run manually)
 */
export function clearLegacyLocalStorage(): void {
  console.log('🧹 Clearing legacy localStorage...');
  
  localStorage.removeItem(LEGACY_WORKSPACES_KEY);
  localStorage.removeItem(LEGACY_FOLDERS_KEY);
  localStorage.removeItem(LEGACY_DOCUMENTS_KEY);
  localStorage.removeItem(LEGACY_CURRENT_WORKSPACE_KEY);
  
  localStorage.removeItem(OLDER_WORKSPACE_KEY);
  localStorage.removeItem(OLDER_FOLDERS_KEY);
  localStorage.removeItem(OLDER_DOCUMENTS_KEY);
  
  console.log('✅ Legacy localStorage cleared');
}


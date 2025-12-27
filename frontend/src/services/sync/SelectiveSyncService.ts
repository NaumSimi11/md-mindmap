/**
 * Selective Sync Service
 * 
 * Handles push/pull operations for documents, folders, and workspaces
 * Following Google Drive model: local-first, user decides what syncs
 * 
 * Architecture:
 * - Local storage: IndexedDB + localStorage (always)
 * - Cloud storage: FastAPI backend (selective)
 * - User controls: Push to Cloud, Pull from Cloud, Keep Local
 */

import { workspaceService as apiWorkspace, documentService as apiDocument, folderService as apiFolder, authService } from '@/services/api';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { backendWorkspaceService } from '@/services/workspace';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { serializeYjsToHtml } from '@/services/snapshots/serializeYjs';
import { extractUuid, toCloudId, toLocalDocId as toLocalId } from '@/utils/id';
import { htmlToMarkdown } from '@/utils/markdownConversion';
import Dexie from 'dexie';
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';
import type { DocumentMeta, Workspace, Folder } from '@/services/workspace/types';
import type { SyncResult, SyncStatus } from '@/types/sync.types';

// Re-export for backward compatibility with external imports
export { toCloudId, toLocalId };

// ============================================================================
// Workspace ID Mapping Database (Local → Cloud ID mapping)
// ============================================================================

class WorkspaceMappingDatabase extends Dexie {
  mappings!: Dexie.Table<{ localId: string; cloudId: string; name: string; createdAt: string }, string>;

  constructor() {
    super('MDReaderWorkspaceMappings');
    this.version(1).stores({
      mappings: 'localId, cloudId, name',
    });
  }
}

class DocumentMappingDatabase extends Dexie {
  mappings!: Dexie.Table<{ localId: string; cloudId: string; createdAt: string }, string>;

  constructor() {
    super('MDReaderDocumentMappings');
    this.version(1).stores({
      mappings: 'localId, cloudId',
    });
  }
}

// In non-browser environments (tests / SSR), IndexedDB may not exist.
// Dexie requires IndexedDB at module-init time, so we fall back to an in-memory mapping store.
type WorkspaceMappingRow = { localId: string; cloudId: string; name: string; createdAt: string };
type DocumentMappingRow = { localId: string; cloudId: string; createdAt: string };

type WhereClause<T> = { equals: (value: any) => { first: () => Promise<T | undefined> } };
type SimpleTable<T extends { localId: string }> = {
  where: (field: keyof T) => WhereClause<T>;
  put: (row: T) => Promise<string>;
  get: (localId: string) => Promise<T | undefined>;
};

function createInMemoryTable<T extends { localId: string }>(): SimpleTable<T> {
  const byLocal = new Map<string, T>();
  return {
    where: (field: keyof T) => ({
      equals: (value: any) => ({
        first: async () => {
          for (const row of byLocal.values()) {
            if ((row as any)[field] === value) return row;
          }
          return undefined;
        },
      }),
    }),
    put: async (row: T) => {
      byLocal.set(row.localId, row);
      return row.localId;
    },
    get: async (localId: string) => byLocal.get(localId),
  };
}

const canUseDexie = typeof (globalThis as any).indexedDB !== 'undefined';

const mappingDb: { mappings: SimpleTable<WorkspaceMappingRow> } = canUseDexie
  ? new WorkspaceMappingDatabase()
  : { mappings: createInMemoryTable<WorkspaceMappingRow>() };

const documentMappingDb: { mappings: SimpleTable<DocumentMappingRow> } = canUseDexie
  ? new DocumentMappingDatabase()
  : { mappings: createInMemoryTable<DocumentMappingRow>() };

export class SelectiveSyncService {
  /**
   * Store workspace ID mapping (local → cloud)
   */
  private async storeWorkspaceMapping(localId: string, cloudId: string, name: string): Promise<void> {
    try {
      // Injectivity guard: avoid multiple locals mapping to the same cloudId
      const existingForCloud = await mappingDb.mappings.where('cloudId').equals(cloudId).first();
      if (existingForCloud && existingForCloud.localId !== localId) {
        console.warn('⚠️ WorkspaceMapping conflict detected. Skipping new mapping.', {
          requestedLocalId: localId,
          existingLocalId: existingForCloud.localId,
          cloudId,
          name,
        });
        // Do not overwrite the existing mapping; reuse existing local elsewhere
        return;
      }

      await mappingDb.mappings.put({
        localId,
        cloudId,
        name,
        createdAt: new Date().toISOString(),
      });
      console.log(`📝 Stored workspace mapping: ${localId} → ${cloudId}`);
    } catch (error) {
      console.warn('⚠️ Failed to store workspace mapping:', error);
      // Non-fatal - continue without mapping
    }
  }

  /**
   * Get cloud workspace ID from local workspace ID (using mapping)
   * Public method so WorkspaceContext can use it
   */
  async getCloudWorkspaceId(localId: string): Promise<string | null> {
    try {
      const mapping = await mappingDb.mappings.get(localId);
      return mapping?.cloudId || null;
    } catch (error) {
      console.warn('⚠️ Failed to get workspace mapping:', error);
      return null;
    }
  }

  /**
   * Store document ID mapping (local → cloud)
   */
  private async storeDocumentMapping(localId: string, cloudId: string): Promise<void> {
    try {
      // Injectivity guard: avoid multiple locals mapping to the same cloudId
      const existingForCloud = await documentMappingDb.mappings.where('cloudId').equals(cloudId).first();
      if (existingForCloud && existingForCloud.localId !== localId) {
        console.warn('⚠️ DocumentMapping conflict detected. Skipping new mapping.', {
          requestedLocalId: localId,
          existingLocalId: existingForCloud.localId,
          cloudId,
        });
        // Do not overwrite existing mapping; higher-level logic should treat this as "same logical doc"
        return;
      }

      await documentMappingDb.mappings.put({
        localId,
        cloudId,
        createdAt: new Date().toISOString(),
      });
      console.log(`📝 Stored document mapping: ${localId} → ${cloudId}`);
    } catch (error) {
      console.warn('⚠️ Failed to store document mapping:', error);
      // Non-fatal - continue without mapping
    }
  }

  /**
   * Get cloud document ID from local document ID (using mapping)
   * Public method so BackendWorkspaceService can use it
   */
  async getCloudDocumentId(localId: string): Promise<string | null> {
    try {
      const mapping = await documentMappingDb.mappings.get(localId);
      return mapping?.cloudId || null;
    } catch (error) {
      console.warn('⚠️ Failed to get document mapping:', error);
      return null;
    }
  }

  /**
   * Ensure workspace exists on cloud (create if needed)
   * Handles 409 conflicts (workspace already exists with same slug)
   * Returns cloud workspace ID (may differ from local ID)
   */
  private async ensureWorkspaceExists(workspaceId: string, localWorkspace: Workspace | null): Promise<string> {
    const cleanWorkspaceId = extractUuid(workspaceId);
    
    // 🔥 Check if we already have a mapping for this workspace
    const existingMapping = await this.getCloudWorkspaceId(workspaceId);
    if (existingMapping) {
      console.log(`✅ Using existing workspace mapping: ${workspaceId} → ${existingMapping}`);
      return existingMapping;
    }
    
    // ✅ FIX: Skip GET probe, go straight to POST with conflict handling
    // This eliminates the noisy GET 404 → POST 409 → GET 200 flow
        const workspaceName = localWorkspace?.name || 'Local Workspace';
        const workspaceDescription = localWorkspace?.description || '';
        
        try {
      // Attempt to create workspace (backend UPSERT will handle if exists)
          const cloudWorkspace = await apiWorkspace.createWorkspace({
            name: workspaceName,
            description: workspaceDescription,
          });
          
          const cloudWorkspaceId = extractUuid(cloudWorkspace.id);
          console.log('✅ Workspace created on cloud:', cloudWorkspace.name, `(cloud ID: ${cloudWorkspaceId})`);
          
          // 🔥 Store mapping: local workspace ID → cloud workspace ID
          await this.storeWorkspaceMapping(workspaceId, cloudWorkspaceId, workspaceName);
          
          return cloudWorkspaceId;
        } catch (createError: any) {
          // Handle 409 Conflict - workspace already exists (maybe with different ID but same slug)
          const isConflict = createError.status === 409 || 
                            createError.response?.status === 409 ||
                            createError.message?.toLowerCase().includes('already exists') ||
                            createError.message?.toLowerCase().includes('slug');
          
          if (isConflict) {
            console.log('⚠️ Workspace already exists (409 conflict), finding existing workspace...');
            
            // List all workspaces and find the one with matching name
            try {
              const allWorkspaces = await apiWorkspace.listWorkspaces();
              
              // Handle paginated response: { items: [], total, ... } or direct array
              const workspacesArray: any[] = Array.isArray(allWorkspaces) 
                ? allWorkspaces 
                : ((allWorkspaces as any).items || []);
              
              const matchingWorkspace = workspacesArray.find(
                (ws: any) => ws.name?.toLowerCase() === workspaceName.toLowerCase()
              );
              
              if (matchingWorkspace) {
                const cloudWorkspaceId = extractUuid(matchingWorkspace.id);
                console.log('✅ Found existing workspace:', matchingWorkspace.name, `(cloud ID: ${cloudWorkspaceId})`);
                
                // 🔥 Store mapping: local workspace ID → cloud workspace ID
                await this.storeWorkspaceMapping(workspaceId, cloudWorkspaceId, workspaceName);
                
                return cloudWorkspaceId;
              } else {
                // Workspace exists but we can't find it - use first workspace as fallback
                if (workspacesArray.length > 0) {
                  const fallbackWorkspace = workspacesArray[0];
                  const cloudWorkspaceId = extractUuid(fallbackWorkspace.id);
                  console.log('⚠️ Using first available workspace as fallback:', fallbackWorkspace.name);
                  
                  // Store mapping
                  await this.storeWorkspaceMapping(workspaceId, cloudWorkspaceId, fallbackWorkspace.name);
                  
                  return cloudWorkspaceId;
                } else {
                  throw new Error('Workspace conflict but no workspaces found');
                }
              }
            } catch (listError: any) {
              console.error('❌ Failed to list workspaces:', listError);
              throw new Error(`Workspace already exists but could not retrieve it: ${createError.message}`);
            }
          } else {
          // Other creation error (not a conflict)
            console.error('❌ Failed to create workspace:', createError);
            throw new Error(`Failed to create workspace: ${createError.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Ensure folder exists on cloud (create if needed)
   * Handles nested folders by ensuring parent folders exist first
   */
  private async ensureFolderExists(
    folderId: string | null | undefined, 
    workspaceId: string,
    localFolder: Folder | null
  ): Promise<string | undefined> {
    if (!folderId) {
      return undefined; // Document is in root
    }
    
    const cleanFolderId = extractUuid(folderId);
    const cleanWorkspaceId = extractUuid(workspaceId);
    
    // ✅ FIX 3: Skip GET endpoint (backend doesn't support it)
    // Use POST-only approach with best-effort creation
    
    if (!localFolder) {
      console.warn('⚠️ No local folder metadata, skipping folder sync');
      return undefined; // Don't block document push
    }
    
    try {
      const folderName = localFolder.name || 'Untitled Folder';
      const folderIcon = localFolder.icon || '📁';
        let parentId: string | null = null;
        
      // Handle parent folder recursively (best-effort)
      if (localFolder.parentId) {
          try {
            const folders = await backendWorkspaceService.getFolders(workspaceId);
            const parentFolder = folders.find(f => f.id === localFolder.parentId);
            
            if (parentFolder) {
              const cloudParentId = await this.ensureFolderExists(
                localFolder.parentId,
                workspaceId,
                parentFolder
              );
              parentId = cloudParentId || null;
            }
          } catch (parentError) {
          console.warn('⚠️ Parent folder sync failed, creating folder at root:', parentError);
          // Continue without parent
        }
      }
      
      // Try POST (backend handles duplicates with UPSERT)
      try {
        const cloudFolder = await apiFolder.createFolder(cleanWorkspaceId, {
          name: folderName,
          icon: folderIcon,
          parent_id: parentId,
        });
        
        console.log('✅ Folder synced to cloud:', cloudFolder.name);
        return extractUuid(cloudFolder.id);
      } catch (createError: any) {
        // If parent not found, retry at root
        const isParentError = createError.message?.toLowerCase().includes('parent') ||
                            createError.message?.toLowerCase().includes('folder not found');
        
        if (isParentError && parentId) {
          console.log('⚠️ Parent not found, creating folder at root...');
          const cloudFolder = await apiFolder.createFolder(cleanWorkspaceId, {
            name: folderName,
            icon: folderIcon,
            parent_id: null,
          });
          
          console.log('✅ Folder synced to cloud (at root):', cloudFolder.name);
          return extractUuid(cloudFolder.id);
        }
        
        // Folder sync failed, but don't block document push
        console.warn('⚠️ Folder sync failed (non-fatal):', createError.message);
        return undefined;
      }
    } catch (error: any) {
      // All folder sync failures are non-fatal
      console.warn('⚠️ Folder sync failed (non-fatal):', error.message);
      return undefined; // Don't block document push
    }
  }

  /**
   * 🔥 FIX A: Serialize content directly from Yjs (single source of truth)
   * - Read ONLY from Yjs
   * - Return markdown string (empty string allowed)
   * 
   * 🔥 BUG FIX: This function now:
   * 1. First checks if Yjs doc exists in memory (editor should have it open)
   * 2. Falls back to creating/loading from IndexedDB (not recommended for push)
   * 3. Logs detailed debug info for troubleshooting
   */
  private serializeFromYjs(documentId: string): string {
    try {
      // 🔥 IMPORTANT: First try to get EXISTING instance (should be in memory if editor is open)
      let instance = yjsDocumentManager.getDocumentInstance(documentId);
      
      if (!instance) {
        console.warn(`⚠️ [serializeFromYjs] No Yjs instance in memory for ${documentId}, creating new...`);
        instance = yjsDocumentManager.getDocument(documentId, { enableWebSocket: false });
      }
      
      if (!instance || !instance.ydoc) {
        throw new Error('Cannot push without Yjs doc');
      }

      // 🔥 DEBUG: Log Yjs document state
      const fragment = instance.ydoc.getXmlFragment('content');
      console.log(`🔍 [serializeFromYjs] Yjs doc state for ${documentId}:`, {
        fragmentLength: fragment.length,
        isInitialized: instance.isInitialized,
        hasWebSocket: !!instance.websocketProvider,
        firstChild: fragment.length > 0 ? fragment.toArray()[0]?.constructor?.name : 'none',
      });

      // Serialize to HTML from Yjs fragment, then convert to markdown for backend
      const html = serializeYjsToHtml(instance.ydoc);
      
      if (!html) {
        console.warn(`⚠️ [serializeFromYjs] No HTML from Yjs for ${documentId} - document may be empty`);
        return '';
      }

      const markdown = htmlToMarkdown(html);
      console.log(`✅ [serializeFromYjs] Serialized ${markdown.length} chars for ${documentId}`);
      return markdown;
    } catch (error: any) {
      console.error('❌ [FIX A] Failed to serialize from Yjs:', error?.message || error);
      throw error;
    }
  }

  /**
   * Extract Yjs binary and encode to base64 (Side-effect free)
   */
  private extractYjsBinaryBase64(documentId: string): string | null {
    try {
      const binary = yjsDocumentManager.getYjsBinarySnapshot(documentId);
      if (!binary) return null;
      return buffer.toBase64(binary);
    } catch (error) {
      console.warn('⚠️ [Dual-Write] Failed to extract Yjs binary:', error);
      return null;
    }
  }

  /**
   * Push document to cloud
   * 
   * LOCAL-FIRST: Pushes local document to backend API.
   * Per local_first.md section 5.2: "Push to Cloud" explicit action.
   * 
   * Cascading creation:
   * 1. Ensure workspace exists (create if needed)
   * 2. Ensure folder exists if document is in folder (create if needed)
   * 3. Create/update document
   */
  async pushDocument(documentId: string, liveContent?: string, retryCount = 0): Promise<SyncResult> {
    try {
      // Precondition: User must be authenticated to push to cloud
      if (!authService.isAuthenticated()) {
        console.warn('⚠️ [pushDocument] Called without authentication. Login required to sync to cloud.');
        return {
          success: false,
          status: 'error',
          error: 'Not authenticated. Please login to sync documents to the cloud.',
        };
      }
      
      // 🔥 BUG FIX #8: Normalize document ID for Yjs (same as useYjsDocument.ts)
      // Yjs stores documents without "doc_" prefix, but IndexedDB uses "doc_" prefix
      const normalizedDocId = documentId.startsWith('doc_') 
        ? documentId.slice(4) 
        : documentId;
      
      console.log(`🔧 [pushDocument] ID normalization: ${documentId} → ${normalizedDocId}`);
      
      // 🔥 FIX A: Read content ONLY from Yjs (single source of truth)
      const contentToSave = this.serializeFromYjs(normalizedDocId);

      // 🔥 PHASE 2: Dual-write Yjs binary
      const yjsStateB64 = this.extractYjsBinaryBase64(normalizedDocId);

      // Get local metadata from guest service (title/workspace/folder), but do NOT use it for content
      let localDoc: DocumentMeta | undefined;
      try {
        localDoc = await guestWorkspaceService.getDocument(documentId) || undefined;
      } catch (err) {
        console.warn('⚠️ [pushDocument] Failed to get local metadata from guest service:', err);
      }

      if (!localDoc) {
        return {
          success: false,
          status: 'error',
          error: 'Document metadata not found locally',
        };
      }

      console.log('☁️ Pushing document to cloud:', localDoc.title);

      // Get current workspace ID (required for creation)
      const currentWorkspace = await backendWorkspaceService.getCurrentWorkspace();
      const workspaceId = localDoc.workspaceId || currentWorkspace?.id;
      
      if (!workspaceId) {
        return {
          success: false,
          status: 'error',
          error: 'No workspace found. Please select a workspace first.',
        };
      }

      // Get workspace and folder info from local storage for cascading creation
      // 🔥 BUG FIX: Always check BOTH services to get the latest workspace name
      // Guest service has the authoritative local workspace info (user renames happen there)
      let localWorkspace: Workspace | null = null;
      
      // 1. First try guest service (has authoritative local workspace data including user renames)
      const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
      localWorkspace = guestWorkspaces.find(w => w.id === workspaceId) || null;
      
      if (localWorkspace) {
        console.log(`✅ [pushDocument] Found workspace in guest service: ${localWorkspace.name}`);
      } else {
        // 2. Fallback to backend cache
        const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
        localWorkspace = allWorkspaces.find(w => w.id === workspaceId) || null;
        
        if (localWorkspace) {
          console.log(`✅ [pushDocument] Found workspace in backend cache: ${localWorkspace.name}`);
        } else if (currentWorkspace) {
          // 3. Last fallback: current workspace
          localWorkspace = currentWorkspace;
          console.log(`⚠️ [pushDocument] Using current workspace as fallback: ${localWorkspace?.name}`);
        }
      }
      
      // Get folder info if document is in a folder
      let localFolder: Folder | null = null;
      if (localDoc.folderId) {
        try {
          const folders = await backendWorkspaceService.getFolders(workspaceId);
          localFolder = folders.find(f => f.id === localDoc.folderId) || null;
        } catch (error) {
          console.warn('⚠️ Could not load folders for cascading creation:', error);
        }
      }

      // 🔥 CASCADING CREATION: Ensure workspace exists first
      const cloudWorkspaceId = await this.ensureWorkspaceExists(workspaceId, localWorkspace);
      
      // 🔥 CASCADING CREATION: Ensure folder exists if document is in a folder
      const cloudFolderId = await this.ensureFolderExists(localDoc.folderId, cloudWorkspaceId, localFolder);

      // Decide create vs patch using local mapping only (WRITE-ONLY)
      const mappedCloudId = await this.getCloudDocumentId(documentId);
      const shouldPatch = !!mappedCloudId;

      // Track response for sync state update
      let syncedDoc: any = null;

      try {
        if (shouldPatch) {
          // PATCH existing cloud document
          const updatePayload: any = {
            title: localDoc.title,
            folder_id: localDoc.folderId || undefined,
            is_starred: localDoc.starred,
            tags: localDoc.tags,
            content: contentToSave,
            yjs_state_b64: yjsStateB64,
            expected_yjs_version: localDoc.yjsVersion,
          };

          console.log(`☁️ [pushDocument] PATCH to cloud: ${toCloudId(mappedCloudId)} (yjs_version: ${localDoc.yjsVersion || 0}, binary: ${yjsStateB64?.length || 0} chars)`);
          syncedDoc = await apiDocument.updateDocument(toCloudId(mappedCloudId), updatePayload);
        } else {
          // POST create new cloud document
          const createPayload: any = {
            id: toCloudId(documentId),
            workspace_id: cloudWorkspaceId,
            title: localDoc.title,
            content_type: 'markdown',
            folder_id: cloudFolderId || null,
            is_starred: localDoc.starred,
            tags: localDoc.tags,
            content: contentToSave,
            yjs_state_b64: yjsStateB64,
          };

          console.log('☁️ [pushDocument] POST to cloud:', createPayload.title, `(binary: ${yjsStateB64?.length || 0} chars)`);
          syncedDoc = await apiDocument.createDocument(createPayload);
          const returnedLocalId = toLocalId(syncedDoc.id);

          // Store mapping after successful creation
          await this.storeDocumentMapping(documentId, returnedLocalId);
          
          // Dispatch event if ID changed (for rare ID mismatch cases)
          if (returnedLocalId !== documentId) {
            window.dispatchEvent(new CustomEvent('document-synced', {
              detail: { oldId: documentId, newId: returnedLocalId, doc: syncedDoc }
            }));
          }
        }
      } catch (error: any) {
        // 🔥 PHASE 3: 409 Conflict Handling (Optimistic Concurrency)
        const isConflict = error.status === 409 || error.response?.status === 409 || 
                          (error.message && error.message.includes('409'));
        
        if (isConflict && retryCount === 0) {
          console.warn(`⚠️ [409 Conflict] Concurrency conflict for ${documentId}. Expected version ${localDoc.yjsVersion || 0} failed. Triggering pull-merge-retry...`);
          
          // 1. Pull the latest state from cloud
          const pullResult = await this.pullDocument(documentId);
          if (pullResult.success) {
            console.log(`✅ [Conflict Resolve] Pull successful, retrying push for ${documentId}...`);
            // 2. Retry the push once (Yjs merge happened inside pullDocument -> applyUpdate)
            return this.pushDocument(documentId, liveContent, 1);
          } else {
            console.error(`❌ [Conflict Resolve] Pull failed for ${documentId}:`, pullResult.error);
            return pullResult;
          }
        }
        
        // Re-throw if not a conflict or if already retried
        throw error;
      }

      // ✅ FIX 2: Update sync state in local index (IndexedDB)
      // This makes sync state DURABLE across refreshes
      try {
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'synced',
          cloudId: syncedDoc?.id, // Store backend document ID
          lastSyncedAt: syncedDoc?.updated_at || new Date().toISOString(),
          yjsVersion: syncedDoc?.yjs_version, // Store canonical version
          yjsStateB64: syncedDoc?.yjs_state_b64, // 🔥 BUG FIX #5: Store binary state
        });

        // 🔥 BUG FIX #5: Also cache in BackendWorkspaceService for immediate access
        // When user selects the document after push, backend cache must have it!
        if (isAuthenticated) {
          const { backendWorkspaceService } = await import('@/services/workspace/BackendWorkspaceService');
          const backendDoc = await backendWorkspaceService.getDocument(syncedDoc!.id);
          console.log(`✅ [pushDocument] Cached in backend service: ${syncedDoc!.id}`);
        }

        // Dispatch event to update WorkspaceContext state (UI only)
        window.dispatchEvent(new CustomEvent('document-sync-status-changed', {
          detail: {
            documentId,
            syncStatus: 'synced',
            cloudId: syncedDoc?.id,
            lastSyncedAt: syncedDoc?.updated_at || new Date().toISOString(),
            yjsVersion: syncedDoc?.yjs_version,
            yjsStateB64: syncedDoc?.yjs_state_b64,
          }
        }));

        console.log(`✅ [pushDocument] Sync state persisted to IndexedDB: local → synced (v${syncedDoc?.yjs_version || 0})`);
      } catch (updateError) {
        console.warn('⚠️ [pushDocument] Failed to update sync state:', updateError);
        // Non-fatal - document is still synced to cloud
      }

      // 🔥 BUG FIX #3: Clear local Yjs storage to force re-hydration from cloud
      // This fixes content loss after push (local Yjs state becomes stale)
      try {
        const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
        
        // Force destroy in-memory instance (even if editor is using it)
        yjsDocumentManager.destroyDocument(documentId);
        console.log(`🧹 [pushDocument] Destroyed in-memory Yjs document`);
        
        // Clear IndexedDB persistence
        await yjsDocumentManager.clearDocumentStorage(documentId);
        console.log(`🧹 [pushDocument] Cleared local Yjs storage, next open will hydrate from cloud`);
        
        // Emit event to tell editor to reload if this document is currently open
        window.dispatchEvent(new CustomEvent('document-pushed-to-cloud', {
          detail: { 
            documentId,
            cloudId: syncedDoc?.id,
            message: 'Document synced to cloud! Reloading fresh content...'
          }
        }));
      } catch (clearError) {
        console.warn('⚠️ [pushDocument] Failed to clear Yjs storage:', clearError);
        // Non-fatal - document is still synced, but might have stale local state
      }

      return {
        success: true,
        status: 'synced',
      };
    } catch (error: any) {
      console.error('❌ Failed to push document:', error);
      
      // Provide user-friendly error message
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('CORS') ||
          errorMessage.includes('ERR_FAILED') ||
          errorMessage.includes('500')) {
        errorMessage = 'Backend server error. Please check if the backend is running and CORS is configured correctly.';
      }
      
      return {
        success: false,
        status: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Pull document from cloud
   * 
   * Downloads cloud document to local cache (if it exists on cloud but not locally,
   * or if cloud version is newer).
   */
  async pullDocument(documentId: string): Promise<SyncResult> {
    try {
      // Precondition: User must be authenticated to pull from cloud
      if (!authService.isAuthenticated()) {
        console.warn('⚠️ [pullDocument] Called without authentication. Login required to sync from cloud.');
        return {
          success: false,
          status: 'error',
          error: 'Not authenticated. Please login to sync documents from the cloud.',
        };
      }

      console.log('📥 Pulling document from cloud:', documentId);

      // Fetch from cloud
      console.log(`📥 [FIX 13] Fetching document from cloud: ${documentId} (sending ${toCloudId(documentId)})`);
      const cloudDoc: any = await apiDocument.getDocument(toCloudId(documentId));

      // 🔥 PHASE 3: Apply Yjs binary state if available
      if (cloudDoc.yjs_state_b64) {
        try {
          const binary = buffer.fromBase64(cloudDoc.yjs_state_b64);
          const instance = yjsDocumentManager.getDocument(documentId, { enableWebSocket: false });
          if (instance && instance.ydoc) {
            console.log(`🔄 [Pull] Applying remote Yjs state to local doc ${documentId} (${binary.byteLength} bytes)`);
            Y.applyUpdate(instance.ydoc, binary, 'remote-pull');
          }
        } catch (error) {
          console.warn(`⚠️ [Pull] Failed to apply Yjs binary for ${documentId}:`, error);
        }
      }

      // Get local document from BackendWorkspaceService cache
      const allDocs = await backendWorkspaceService.getDocuments();
      const localDoc = allDocs.find(d => d.id === documentId);

      if (localDoc) {
        // Check for conflicts
        const cloudUpdatedAt = new Date(cloudDoc.updated_at);
        const localUpdatedAt = new Date(localDoc.updatedAt);

        if (localUpdatedAt > cloudUpdatedAt) {
          // Local is newer - conflict!
          return {
            success: false,
            status: 'conflict',
            error: 'Local version is newer',
            conflictData: {
              localUpdatedAt,
              cloudUpdatedAt,
            },
          };
        }

        // Update local document with cloud data
        await backendWorkspaceService.updateDocument(documentId, {
          title: cloudDoc.title,
          folderId: cloudDoc.folder_id || null,
          starred: cloudDoc.is_starred || false,
          tags: cloudDoc.tags || [],
        });
        
        // Update sync status (including canonical Yjs version)
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'synced',
          cloudId: cloudDoc.id,
          lastSyncedAt: cloudDoc.updated_at,
          yjsVersion: cloudDoc.yjs_version,
        });
      } else {
        // Create local document from cloud data
        await backendWorkspaceService.createDocument({
          id: documentId,
          workspaceId: cloudDoc.workspace_id,
          title: cloudDoc.title,
          type: cloudDoc.content_type === 'markdown' ? 'markdown' : 'markdown',
          folderId: cloudDoc.folder_id || null,
        });

        // Update with cloud metadata
        await backendWorkspaceService.updateDocument(documentId, {
          starred: cloudDoc.is_starred || false,
          tags: cloudDoc.tags || [],
        });
        
        // Update sync status (including canonical Yjs version)
        await guestWorkspaceService.updateDocument(documentId, {
          syncStatus: 'synced',
          cloudId: cloudDoc.id,
          lastSyncedAt: cloudDoc.updated_at,
          yjsVersion: cloudDoc.yjs_version,
        });
      }

      console.log('✅ Document pulled from cloud:', cloudDoc.title);

      return {
        success: true,
        status: 'synced',
      };
    } catch (error: any) {
      console.error('❌ Failed to pull document:', error);
      return {
        success: false,
        status: 'error',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Push folder to cloud
   */
  async pushFolder(folderId: string): Promise<SyncResult> {
    try {
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          status: 'error',
          error: 'Not authenticated',
        };
      }

      const localFolder = await guestWorkspaceService.getFolder(folderId);
      if (!localFolder) {
        return {
          success: false,
          status: 'error',
          error: 'Folder not found locally',
        };
      }

      console.log('☁️ Pushing folder to cloud:', localFolder.name);

      // Check if folder exists on cloud
      try {
        await apiFolder.getFolder(folderId, localFolder.workspaceId);
        
        // Update existing folder
        await apiFolder.updateFolder(folderId, localFolder.workspaceId, {
          name: localFolder.name,
          color: undefined, // Can be extended later
        });

        console.log('✅ Folder updated on cloud:', localFolder.name);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Create new folder
          await apiFolder.createFolder(localFolder.workspaceId, {
            name: localFolder.name,
            parent_id: localFolder.parentId || undefined,
            color: undefined,
          });

          console.log('✅ Folder created on cloud:', localFolder.name);
        } else {
          throw error;
        }
      }

      // Update local sync status (flat fields, not nested)
      guestWorkspaceService.updateFolder(folderId, {
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
      });

      return {
        success: true,
        status: 'synced',
      };
    } catch (error: any) {
      console.error('❌ Failed to push folder:', error);
      return {
        success: false,
        status: 'error',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Push entire workspace (all folders + documents)
   */
  async pushWorkspace(workspaceId: string): Promise<SyncResult> {
    try {
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          status: 'error',
          error: 'Not authenticated',
        };
      }

      console.log('☁️ Pushing entire workspace to cloud...');

      // Push all folders first (to maintain hierarchy)
      const folders = await guestWorkspaceService.getFolders();
      for (const folder of folders) {
        await this.pushFolder(folder.id);
      }

      // Push all documents
      const documents = await guestWorkspaceService.getDocuments();
      for (const doc of documents) {
        await this.pushDocument(doc.id);
      }

      console.log('✅ Workspace pushed to cloud');

      return {
        success: true,
        status: 'synced',
      };
    } catch (error: any) {
      console.error('❌ Failed to push workspace:', error);
      return {
        success: false,
        status: 'error',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Mark document as local-only (prevent future syncs)
   */
  async markAsLocalOnly(documentId: string): Promise<void> {
    const localDoc = await guestWorkspaceService.getDocument(documentId);
    if (localDoc) {
      guestWorkspaceService.updateDocument(documentId, {
        syncStatus: 'local',
      });
      console.log('💾 Document marked as local-only:', localDoc.title);
    }
  }

  /**
   * Get sync status for a document
   */
  async getSyncStatus(documentId: string): Promise<SyncStatus> {
    const doc = await guestWorkspaceService.getDocument(documentId);
    // Prefer canonical metadata field `syncStatus` (newer), fall back to legacy nested `sync.status`.
    return (doc as any)?.syncStatus || (doc as any)?.sync?.status || 'local';
  }
}

// Export singleton
export const selectiveSyncService = new SelectiveSyncService();

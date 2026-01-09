/**
 * Entity ID Unification Service
 * 
 * Single source of truth for ID management across the system.
 * After sync, cloud IDs become the canonical IDs everywhere.
 * 
 * Handles:
 * - Workspace ID unification (local → cloud)
 * - Folder ID unification (local → cloud)
 * - Document ID unification (local → cloud)
 * 
 * @see ID_UNIFICATION_DESIGN.md for full documentation
 */

import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';

// ============================================================================
// Types
// ============================================================================

export interface UnifyResult {
  success: boolean;
  changes: number;
  details: {
    workspace?: boolean;
    folders?: number;
    documents?: number;
    localStorage?: boolean;
  };
}

const LAST_WORKSPACE_KEY = 'mdreader_last_workspace';

// ============================================================================
// Entity ID Unification Service
// ============================================================================

class EntityIdUnificationService {
  
  // ==========================================================================
  // WORKSPACE ID UNIFICATION
  // ==========================================================================
  
  /**
   * Replace local workspace ID with cloud ID everywhere.
   * Delegates to GuestWorkspaceService and also updates localStorage.
   */
  async unifyWorkspaceId(localId: string, cloudId: string): Promise<UnifyResult> {
    if (localId === cloudId) {
      console.log(`ℹ️ [Unify] Workspace IDs already match: ${localId}`);
      return { success: true, changes: 0, details: {} };
    }
    
    console.log(`🔄 [Unify] Workspace: ${localId} → ${cloudId}`);
    
    const result: UnifyResult = {
      success: false,
      changes: 0,
      details: {
        workspace: false,
        folders: 0,
        documents: 0,
        localStorage: false,
      }
    };
    
    try {
      // 1. Delegate to GuestWorkspaceService
      const wsResult = await guestWorkspaceService.replaceWorkspaceIdWithCloudId(localId, cloudId);
      
      result.details.workspace = wsResult.workspace;
      result.details.folders = wsResult.folders;
      result.details.documents = wsResult.documents;
      result.changes = (wsResult.workspace ? 1 : 0) + wsResult.folders + wsResult.documents;
      
      // 2. Update localStorage
      const lastWs = localStorage.getItem(LAST_WORKSPACE_KEY);
      if (lastWs === localId) {
        localStorage.setItem(LAST_WORKSPACE_KEY, cloudId);
        result.details.localStorage = true;
        result.changes++;
        console.log(`  ✅ Updated localStorage.LAST_WORKSPACE_KEY`);
      }
      
      // 3. Verify
      const verified = await guestWorkspaceService.verifyWorkspaceIdReplacement(localId, cloudId);
      result.success = wsResult.success && verified;
      
      if (result.success) {
        console.log(`✅ [Unify] Workspace unification complete:`, result);
      } else {
        console.warn(`⚠️ [Unify] Workspace unification verification failed`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ [Unify] Workspace unification failed:`, error);
      result.success = false;
      return result;
    }
  }
  
  // ==========================================================================
  // FOLDER ID UNIFICATION
  // ==========================================================================
  
  /**
   * Replace local folder ID with cloud ID everywhere.
   * Delegates to GuestWorkspaceService.replaceFolderIdWithVerification()
   */
  async unifyFolderId(localId: string, cloudId: string): Promise<UnifyResult> {
    if (localId === cloudId) {
      console.log(`ℹ️ [Unify] Folder IDs already match: ${localId}`);
      return { success: true, changes: 0, details: {} };
    }
    
    console.log(`🔄 [Unify] Folder: ${localId} → ${cloudId}`);
    
    const success = await guestWorkspaceService.replaceFolderIdWithVerification(
      localId,
      cloudId,
      3 // max retries
    );
    
    return {
      success,
      changes: success ? 1 : 0,
      details: {},
    };
  }
  
  // ==========================================================================
  // DOCUMENT ID UNIFICATION
  // ==========================================================================
  
  /**
   * Replace local document ID with cloud ID everywhere.
   * Delegates to GuestWorkspaceService and clears Yjs storage.
   */
  async unifyDocumentId(localId: string, cloudId: string): Promise<UnifyResult> {
    if (localId === cloudId) {
      console.log(`ℹ️ [Unify] Document IDs already match: ${localId}`);
      return { success: true, changes: 0, details: {} };
    }
    
    console.log(`🔄 [Unify] Document: ${localId} → ${cloudId}`);
    
    try {
      // 1. Delegate to GuestWorkspaceService
      const docResult = await guestWorkspaceService.replaceDocumentIdWithCloudId(localId, cloudId);
      
      if (!docResult.success) {
        return { success: false, changes: 0, details: {} };
      }
      
      // 2. Clear old Yjs storage - next open will hydrate from cloud
      try {
        const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
        
        // Normalize both IDs (remove doc_ prefix if present)
        const normalizedLocal = localId.startsWith('doc_') ? localId.slice(4) : localId;
        const normalizedCloud = cloudId.startsWith('doc_') ? cloudId.slice(4) : cloudId;
        
        if (normalizedLocal !== normalizedCloud) {
          await yjsDocumentManager.clearDocumentStorage(localId);
          console.log(`  ✅ Cleared old Yjs storage for ${localId}`);
        }
      } catch (yjsError) {
        console.warn(`  ⚠️ Could not update Yjs storage:`, yjsError);
        // Non-fatal - document will be re-hydrated from cloud
      }
      
      return { success: true, changes: 1, details: {} };
      
    } catch (error) {
      console.error(`❌ [Unify] Document unification failed:`, error);
      return { success: false, changes: 0, details: {} };
    }
  }
  
  // ==========================================================================
  // FULL SYNC UNIFICATION
  // ==========================================================================
  
  /**
   * Unify all IDs for a document and its parent entities.
   * Called after pushDocument() succeeds.
   * 
   * Order matters:
   * 1. Workspace first (folders/docs reference it)
   * 2. Folders second (docs reference them)
   * 3. Documents last
   */
  async unifyAfterSync(
    localDocId: string,
    cloudDocId: string,
    localFolderId: string | null,
    cloudFolderId: string | null,
    localWorkspaceId: string,
    cloudWorkspaceId: string
  ): Promise<{ success: boolean; workspaceUnified: boolean; folderUnified: boolean; documentUnified: boolean }> {
    console.log('🔄 [Unify] Starting full unification after sync...');
    console.log('  Local IDs:', { workspace: localWorkspaceId, folder: localFolderId, document: localDocId });
    console.log('  Cloud IDs:', { workspace: cloudWorkspaceId, folder: cloudFolderId, document: cloudDocId });
    
    let workspaceUnified = false;
    let folderUnified = false;
    let documentUnified = false;
    
    try {
      // 1. Unify workspace FIRST
      if (localWorkspaceId !== cloudWorkspaceId) {
        const wsResult = await this.unifyWorkspaceId(localWorkspaceId, cloudWorkspaceId);
        workspaceUnified = wsResult.success;
      } else {
        workspaceUnified = true;
      }
      
      // 2. Unify folder SECOND (if exists)
      console.log('🔍 [Unify] Folder check:', {
        localFolderId,
        cloudFolderId,
        needsUnification: localFolderId && cloudFolderId && localFolderId !== cloudFolderId,
      });
      
      if (localFolderId && cloudFolderId && localFolderId !== cloudFolderId) {
        console.log('🔄 [Unify] Unifying folder IDs...');
        const folderResult = await this.unifyFolderId(localFolderId, cloudFolderId);
        folderUnified = folderResult.success;
        console.log('📁 [Unify] Folder unification result:', { success: folderResult.success, changes: folderResult.changes });
      } else {
        const reason = !localFolderId ? 'no local folder' : 
                       !cloudFolderId ? 'no cloud folder' : 
                       'IDs already match';
        console.log(`ℹ️ [Unify] Skipping folder unification: ${reason}`);
        folderUnified = true; // No folder or already unified
      }
      
      // 3. Unify document LAST
      if (localDocId !== cloudDocId) {
        const docResult = await this.unifyDocumentId(localDocId, cloudDocId);
        documentUnified = docResult.success;
      } else {
        documentUnified = true;
      }
      
      const allSuccess = workspaceUnified && folderUnified && documentUnified;
      
      if (allSuccess) {
        console.log('✅ [Unify] Full unification complete');
        
        // 🔥 CRITICAL: Dispatch event to reload React state with new IDs
        // This ensures WorkspaceDataContext, DocumentDataContext, and useBackendFolders
        // all pick up the unified IDs
        window.dispatchEvent(new CustomEvent('ids-unified', {
          detail: {
            workspaceId: cloudWorkspaceId,
            folderId: cloudFolderId,
            documentId: cloudDocId,
          }
        }));
        
        // Also trigger workspace reload specifically
        window.dispatchEvent(new CustomEvent('workspace-ids-changed', {
          detail: {
            oldWorkspaceId: localWorkspaceId,
            newWorkspaceId: cloudWorkspaceId,
          }
        }));
        
        console.log('📢 [Unify] Dispatched reload events');
      } else {
        console.warn('⚠️ [Unify] Partial unification:', { workspaceUnified, folderUnified, documentUnified });
      }
      
      return { success: allSuccess, workspaceUnified, folderUnified, documentUnified };
      
    } catch (error) {
      console.error('❌ [Unify] Full unification failed:', error);
      return { success: false, workspaceUnified, folderUnified, documentUnified };
    }
  }
  
}

// Singleton export
export const entityIdUnificationService = new EntityIdUnificationService();


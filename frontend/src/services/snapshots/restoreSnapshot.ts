/**
 * STEP 5: Snapshot Restore
 * 
 * RESTORE RULE (CRITICAL):
 * Cloud snapshots are used ONLY when:
 * - IndexedDB is empty
 * - Yjs XmlFragment is empty
 * - User explicitly requests restore
 * 
 * Never automatic during collaboration.
 */

import * as Y from 'yjs';
import { fetchSnapshot } from './snapshotClient';
import { base64ToBinary } from './serializeYjs';

/**
 * Check if restore is safe (all gates pass)
 */
export function canRestore(ydoc: Y.Doc): boolean {
  const fragment = ydoc.getXmlFragment('content');
  
  // Gate 1: Yjs must be empty
  if (fragment.length > 0) {
    console.log('⚠️ [Restore] Blocked: Yjs already has content');
    return false;
  }
  
  // Gate 2: IndexedDB check (implicit - if IndexedDB had content, Yjs would too)
  // This is handled by the IndexeddbPersistence provider automatically
  
  return true;
}

/**
 * Restore snapshot from cloud (EXPLICIT USER ACTION ONLY)
 * 
 * @param documentId - Document to restore
 * @param ydoc - Yjs document instance
 * @returns true if restored, false if blocked or failed
 */
export async function restoreFromSnapshot(
  documentId: string,
  ydoc: Y.Doc
): Promise<boolean> {
  // GATE: Check if restore is safe
  if (!canRestore(ydoc)) {
    console.warn('❌ [Restore] Blocked: Document is not empty');
    return false;
  }
  
  try {
    console.log('☁️ [Restore] Fetching snapshot from backend:', documentId);
    
    // Fetch snapshot from backend
    const snapshot = await fetchSnapshot(documentId);
    
    if (!snapshot) {
      console.log('ℹ️ [Restore] No snapshot found:', documentId);
      return false;
    }
    
    console.log('🔄 [Restore] Applying snapshot to Yjs:', documentId);
    
    // Decode base64 → binary
    const binary = base64ToBinary(snapshot.yjsState);
    
    // Apply to Yjs document
    Y.applyUpdate(ydoc, binary);
    
    console.log('✅ [Restore] Snapshot applied successfully:', documentId);
    return true;
  } catch (error) {
    console.error('❌ [Restore] Failed:', error);
    return false;
  }
}

/**
 * Preview snapshot without applying (for UI preview)
 */
export async function previewSnapshot(documentId: string): Promise<string | null> {
  try {
    const snapshot = await fetchSnapshot(documentId);
    
    if (!snapshot || !snapshot.html) {
      return null;
    }
    
    return snapshot.html;
  } catch (error) {
    console.error('❌ [Preview] Failed:', error);
    return null;
  }
}


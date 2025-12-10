/**
 * useConflicts - Manage document conflicts
 * 
 * Listens to sync events and tracks conflicts for current document.
 */

import { useState, useEffect } from 'react';
import { syncManager, type Conflict, type SyncEvent } from '@/services/offline/SyncManager';
import { offlineDB } from '@/services/offline/OfflineDatabase';
import { documentService as apiDocument } from '@/services/api';

export function useConflicts(documentId: string | null) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  
  // Listen for conflicts
  useEffect(() => {
    const handleSyncEvent = (event: SyncEvent) => {
      if (event.type === 'conflict_detected' && event.data?.conflictDetails) {
        const newConflicts = event.data.conflictDetails.filter(
          (c: Conflict) => !documentId || c.documentId === documentId
        );
        setConflicts(prev => [...prev, ...newConflicts]);
      }
      
      if (event.type === 'sync_completed' && event.data?.conflictDetails) {
        const newConflicts = event.data.conflictDetails.filter(
          (c: Conflict) => !documentId || c.documentId === documentId
        );
        if (newConflicts.length > 0) {
          setConflicts(prev => [...prev, ...newConflicts]);
        }
      }
    };
    
    const unsubscribe = syncManager.addEventListener(handleSyncEvent);
    return unsubscribe;
  }, [documentId]);
  
  // Resolve conflict
  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote') => {
    setIsResolving(true);
    
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }
      
      // Apply resolution
      if (resolution === 'local') {
        // Keep local version - push to server
        await apiDocument.updateDocument(conflict.documentId, {
          content: conflict.localVersion.content
        });
        
        // Update IndexedDB
        await offlineDB.documents.update(conflict.documentId, {
          pending_changes: false,
          last_synced: new Date().toISOString()
        });
        
        console.log('✅ Conflict resolved: Kept local version');
      } else {
        // Use remote version - update local
        await offlineDB.documents.update(conflict.documentId, {
          content: conflict.remoteVersion.content,
          updated_at: conflict.remoteVersion.updatedAt,
          pending_changes: false,
          last_synced: new Date().toISOString()
        });
        
        console.log('✅ Conflict resolved: Used remote version');
      }
      
      // Remove conflict from queue
      const pendingChanges = await offlineDB.pending_changes
        .where('entity_id')
        .equals(conflict.documentId)
        .toArray();
      
      for (const change of pendingChanges) {
        await offlineDB.pending_changes.delete(change.id);
      }
      
      // Remove from state
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  };
  
  // Dismiss conflict (hide but don't resolve)
  const dismissConflict = (conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };
  
  // Get conflicts for current document
  const currentConflicts = documentId 
    ? conflicts.filter(c => c.documentId === documentId)
    : conflicts;
  
  return {
    conflicts: currentConflicts,
    hasConflicts: currentConflicts.length > 0,
    isResolving,
    resolveConflict,
    dismissConflict
  };
}


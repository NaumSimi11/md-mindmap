/**
 * Document Data Context
 * ======================
 * 
 * Pure document state management
 * NO workspace logic, NO UI
 * Just documents: list, get, create, update, delete, refresh
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useSync } from './SyncContext';
import { useWorkspaceData } from './WorkspaceDataContext';
import { backendWorkspaceService, guestWorkspaceService } from '@/services/workspace';
import type { DocumentMeta } from '@/services/workspace/types';
import { yjsHydrationService } from '@/services/yjs/YjsHydrationService';
import { getCanonicalDocKey } from '@/utils/identity';
import { authService } from '@/services/api';
import * as buffer from 'lib0/buffer';

// Legacy Document type (for compatibility)
export interface Document {
  id: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  title: string;
  content: string;
  folderId: string | null;
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;
  metadata: Record<string, any>;
  sync: {
    status: 'local' | 'synced' | 'syncing' | 'pending' | 'conflict';
    cloudId?: string;
    lastSyncedAt?: Date;
    cloudVersion?: number;
    localVersion?: number;
    yjsVersion?: number;
    yjsStateB64?: string;
  };
}

/**
 * Map DocumentMeta to Document with validation and defaults
 * 
 * Handles:
 * - Missing/undefined fields with safe defaults
 * - Invalid date strings (returns current date)
 * - Undefined arrays (returns empty array)
 * - Undefined syncStatus (defaults to 'local')
 */
function mapDocumentMetaToDocument(meta: DocumentMeta | any): Document {
  // Safe date parsing - returns current date if invalid
  const parseDate = (dateValue: string | Date | undefined | null): Date => {
    if (!dateValue) return new Date();
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Safe optional date parsing - returns undefined if invalid/missing
  const parseOptionalDate = (dateValue: string | Date | undefined | null): Date | undefined => {
    if (!dateValue) return undefined;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  return {
    id: meta.id || '',
    type: meta.type || 'markdown',
    title: meta.title || 'Untitled',
    content: meta.content || '',
    folderId: meta.folderId ?? null,
    workspaceId: meta.workspaceId || '',
    starred: meta.starred ?? false,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    createdAt: parseDate(meta.createdAt),
    updatedAt: parseDate(meta.updatedAt),
    lastOpenedAt: parseOptionalDate(meta.lastOpenedAt),
    metadata: meta.metadata || {},
    sync: {
      status: meta.syncStatus || 'local',
      cloudId: meta.cloudId,
      lastSyncedAt: parseOptionalDate(meta.lastSyncedAt),
      localVersion: meta.version ?? 1,
      yjsVersion: meta.yjsVersion,
      yjsStateB64: meta.yjsStateB64,
    },
  };
}

interface DocumentDataContextType {
  /** All documents in current workspace */
  documents: Document[];
  
  /** Get document by ID (with content) */
  getDocument: (documentId: string) => Promise<Document | undefined>;
  
  /** Create new document */
  createDocument: (
    type: Document['type'], 
    title: string, 
    content?: string, 
    folderId?: string | null
  ) => Promise<Document>;
  
  /** Update document */
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  
  /** Delete document */
  deleteDocument: (documentId: string) => Promise<void>;
  
  /** Refresh documents for current workspace */
  refreshDocuments: () => Promise<void>;
  
  /** Auto-save document (called by editor) */
  autoSaveDocument: (documentId: string, content: string) => void;
}

const DocumentDataContext = createContext<DocumentDataContextType | null>(null);

export function DocumentDataProvider({ children }: { children: ReactNode }) {
  const { shouldUseBackendService } = useSync();
  const { currentWorkspace } = useWorkspaceData();
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Track if first guest document created (for UI explainer)
  const hasShownFirstDocExplainer = useRef(false);

  // Refresh documents when workspace switches
  const refreshDocuments = useCallback(async () => {
    if (!currentWorkspace) {
      setDocuments([]);
      return;
    }
    
    try {
      const isLocalOnly = currentWorkspace.syncStatus === 'local';
      
      console.log('🔄 [DocumentData] Refreshing for workspace:', currentWorkspace.name, {
        isLocalOnly,
        shouldUseBackendService,
      });
      
      // Authenticated + cloud workspace: Load from backend AND merge local docs
      if (shouldUseBackendService && !isLocalOnly) {
        // Check for workspace ID mapping (local → cloud)
        let workspaceIdToFetch = currentWorkspace.id;
        try {
          const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
          const cloudWorkspaceId = await selectiveSyncService.getCloudWorkspaceId(currentWorkspace.id);
          if (cloudWorkspaceId && cloudWorkspaceId !== currentWorkspace.id) {
            console.log(`🆔 [DocumentData] Workspace mapping: ${currentWorkspace.id} → ${cloudWorkspaceId}`);
            workspaceIdToFetch = cloudWorkspaceId;
          }
        } catch (err) {
          console.warn('⚠️ [DocumentData] Failed to check workspace mapping:', err);
        }
        
        // 🔥 BUG FIX #6: Load BOTH backend and guest docs, then merge
        // Guest docs might have been pushed to cloud but not yet in backend cache
        const [backendDocs, guestDocs] = await Promise.all([
          backendWorkspaceService.getDocuments(workspaceIdToFetch),
          guestWorkspaceService.getDocuments(currentWorkspace.id),
        ]);
        
        console.log(`📥 [DocumentData] Loaded ${backendDocs.length} backend doc(s), ${guestDocs.length} guest doc(s)`);
        
        if (backendDocs.length > 0 || guestDocs.length > 0) {
          const backendMapped = backendDocs.map(mapDocumentMetaToDocument);
          const guestMapped = guestDocs.map((d: any) => mapDocumentMetaToDocument(d));
          
          // Merge: Backend docs take precedence over guest docs
          const map = new Map<string, Document>();
          
          // 1. Add guest docs first
          guestMapped.forEach(d => {
            const key = getCanonicalDocKey({ id: d.id, sync: d.sync });
            map.set(key, d);
          });
          
          // 2. Overlay backend docs (they win)
          backendMapped.forEach(d => {
            const key = getCanonicalDocKey({ id: d.id, sync: d.sync });
            const existing = map.get(key);
            map.set(key, { ...existing, ...d });
          });
          
          const merged = Array.from(map.values());
          
          // Dev invariant check
          if (process.env.NODE_ENV === 'development') {
            const seen = new Set<string>();
            for (const doc of merged) {
              const key = getCanonicalDocKey({ id: doc.id, sync: doc.sync });
              if (seen.has(key)) {
                console.error('[DocumentData] Duplicate canonical key:', {
                  key,
                  docs: merged
                    .filter(d => getCanonicalDocKey({ id: d.id, sync: d.sync }) === key)
                    .map(d => ({ id: d.id, title: d.title, sync: d.sync })),
                });
                break;
              }
              seen.add(key);
            }
          }
          
          setDocuments(merged);
          return;
        }
        
        console.log('⚠️ [DocumentData] No backend or guest docs found');
        setDocuments([]);
        return;
      }
      
      // Guest mode OR local-only workspace: Use guest service
      const docs = await guestWorkspaceService.getDocuments(currentWorkspace.id);
      console.log(`📥 [DocumentData] Loaded ${docs.length} guest doc(s)`);
      
      // 🔥 BUG FIX #6: Preserve actual sync status from guest IndexedDB
      // Don't hardcode 'local' - use the real syncStatus (could be 'synced' after push)
      const mappedDocs = docs.map((d: any) => mapDocumentMetaToDocument(d));
      
      // Merge with existing docs by canonical key
      setDocuments(prev => {
        const map = new Map<string, Document>();

        prev.forEach(d => {
          const key = getCanonicalDocKey({ id: d.id, sync: d.sync });
          map.set(key, d);
        });

        mappedDocs.forEach(d => {
          const key = getCanonicalDocKey({
            id: d.id,
            sync: { cloudId: (d.sync as any)?.cloudId },
          });
          const existing = map.get(key);
          map.set(key, { ...existing, ...d });
        });

        const merged = Array.from(map.values());

        // Dev invariant check
        if (process.env.NODE_ENV === 'development') {
          const seen = new Set<string>();
          for (const doc of merged) {
            const key = getCanonicalDocKey({ id: doc.id, sync: doc.sync });
            if (seen.has(key)) {
              console.error('[DocumentData] Duplicate canonical key:', {
                key,
                docs: merged
                  .filter(d => getCanonicalDocKey({ id: d.id, sync: d.sync }) === key)
                  .map(d => ({ id: d.id, title: d.title, sync: d.sync })),
              });
              break;
            }
            seen.add(key);
          }
        }

        return merged;
      });
    } catch (err) {
      console.error('❌ [DocumentData] Refresh failed:', err);
    }
  }, [currentWorkspace, shouldUseBackendService]);

  // 🔥 FIX: Auto-load documents when workspace is set (initial load + switches)
  useEffect(() => {
    if (currentWorkspace) {
      console.log('🔄 [DocumentData] Workspace changed, loading documents:', currentWorkspace.name);
      refreshDocuments();
    }
  }, [currentWorkspace, refreshDocuments]);

  // Listen for workspace switch events (kept for explicit manual refresh)
  useEffect(() => {
    const handleWorkspaceSwitched = () => {
      refreshDocuments();
    };
    
    const handleWorkspaceCreated = () => {
      refreshDocuments();
    };

    window.addEventListener('workspace:switched', handleWorkspaceSwitched);
    window.addEventListener('workspace:created', handleWorkspaceCreated);
    
    return () => {
      window.removeEventListener('workspace:switched', handleWorkspaceSwitched);
      window.removeEventListener('workspace:created', handleWorkspaceCreated);
    };
  }, [refreshDocuments]);

  // Listen for document sync events
  useEffect(() => {
    const handleDocumentSynced = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { oldId, newId, doc } = customEvent.detail;
      
      console.log(`🔄 [DocumentData] Document synced: ${oldId} → ${newId}`);
      
      const mappedDoc: Document = {
        id: doc.id,
        type: 'markdown',
        title: doc.title,
        content: doc.content,
        folderId: doc.folder_id || null,
        workspaceId: doc.workspace_id,
        starred: doc.is_starred || false,
        tags: doc.tags || [],
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
        lastOpenedAt: doc.last_opened_at ? new Date(doc.last_opened_at) : undefined,
        metadata: {},
        sync: {
          status: 'synced',
          lastSyncedAt: new Date(),
          yjsVersion: doc.yjs_version,
          yjsStateB64: doc.yjs_state_b64,
        }
      };
      
      // Remove old ID and deduplicate new ID
      setDocuments(prev => {
        const filtered = prev.filter(d => d.id !== oldId && d.id !== newId);
        return [...filtered, mappedDoc];
      });
    };
    
    const handleSyncStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { documentId, syncStatus, cloudId, lastSyncedAt, yjsVersion, yjsStateB64 } = customEvent.detail;
      
      console.log(`✅ [DocumentData] Sync status changed: ${documentId} → ${syncStatus}`);
      
      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          return {
            ...doc,
            sync: {
              status: syncStatus,
              cloudId,
              lastSyncedAt: lastSyncedAt ? new Date(lastSyncedAt) : new Date(),
              yjsVersion,
              yjsStateB64,
            }
          };
        }
        return doc;
      }));
    };
    
    const handleOfflineDataLoaded = async () => {
      console.log('🔄 [DocumentData] Offline data loaded, refreshing...');
      if (currentWorkspace) {
        await refreshDocuments();
      }
    };
    
    // 🔥 NEW: Listen for batch sync completion
    const handleBatchSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { totalOps, totalSuccessful, totalFailed } = customEvent.detail;
      
      console.log(`🎉 [DocumentData] Batch sync complete: ${totalSuccessful}/${totalOps} successful`);
      
      // Refresh documents to show updated sync status
      if (totalSuccessful > 0) {
        refreshDocuments();
      }
    };
    
    window.addEventListener('document-synced', handleDocumentSynced);
    window.addEventListener('document-sync-status-changed', handleSyncStatusChanged);
    window.addEventListener('offline-data-loaded', handleOfflineDataLoaded);
    window.addEventListener('batch-sync-complete', handleBatchSyncComplete);
    
    return () => {
      window.removeEventListener('document-synced', handleDocumentSynced);
      window.removeEventListener('document-sync-status-changed', handleSyncStatusChanged);
      window.removeEventListener('offline-data-loaded', handleOfflineDataLoaded);
      window.removeEventListener('batch-sync-complete', handleBatchSyncComplete);
    };
  }, [currentWorkspace, refreshDocuments]);

  // Get document (with content and Yjs hydration)
  const getDocument = useCallback(async (documentId: string): Promise<Document | undefined> => {
    let document: Document | undefined;
    
    if (!shouldUseBackendService) {
      // Guest mode: Get from guest service
      const guestDoc = await guestWorkspaceService.getDocument(documentId);
      document = guestDoc ? mapDocumentMetaToDocument(guestDoc) : undefined;
    } else {
      // Authenticated mode: Check guest first (for pre-login docs)
      const guestDoc = await guestWorkspaceService.getDocument(documentId);
      
      if (guestDoc) {
        console.log(`✅ [DocumentData] Found in guest service: ${documentId}`);
        
        // 🔥 BUG FIX #1: Skip backend calls for local-only or pending documents
        if (guestDoc.syncStatus === 'local' || guestDoc.syncStatus === 'pending') {
          console.log(`✅ [DocumentData] Local-only doc (${guestDoc.syncStatus}), skipping backend fetch`);
          document = mapDocumentMetaToDocument(guestDoc);
          // Skip to hydration
        } 
        // Check if pushed to cloud
        else if (guestDoc.cloudId && guestDoc.syncStatus === 'synced') {
          console.log(`🔄 [DocumentData] Loading cloud version: ${guestDoc.cloudId}`);
          
          const cloudDoc = await backendWorkspaceService.getDocument(guestDoc.cloudId);
          if (cloudDoc) {
            const mappedDoc = mapDocumentMetaToDocument(cloudDoc);
            (mappedDoc as any).__redirectToCloudId = guestDoc.cloudId;
            document = mappedDoc;
          } else {
            document = mapDocumentMetaToDocument(guestDoc);
          }
        } else {
          // Check for cloud version without mapping (for docs that might have been synced)
          const possibleCloudId = documentId.startsWith('doc_') 
            ? documentId.slice(4) 
            : documentId;
          const cloudDoc = await backendWorkspaceService.getDocument(possibleCloudId)
            .catch(() => null);
          
          if (cloudDoc) {
            console.log(`🔄 [DocumentData] Found cloud version: ${possibleCloudId}`);
            // Update guest doc with mapping
            await guestWorkspaceService.updateDocument(documentId, {
              cloudId: possibleCloudId,
              syncStatus: 'synced',
            });
            
            const mappedDoc = mapDocumentMetaToDocument(cloudDoc);
            (mappedDoc as any).__redirectToCloudId = possibleCloudId;
            document = mappedDoc;
          } else {
            document = mapDocumentMetaToDocument(guestDoc);
          }
        }
      } else {
        // Not in guest service, try backend
        const doc = await backendWorkspaceService.getDocument(documentId);
        
        if (doc) {
          const mappedDoc = mapDocumentMetaToDocument(doc);
          
          // Update in-memory array
          setDocuments(prev => {
            const newKey = getCanonicalDocKey({
              id: mappedDoc.id,
              sync: mappedDoc.sync,
            });

            let found = false;
            const updated = prev.map(d => {
              const existingKey = getCanonicalDocKey({
                id: d.id,
                sync: d.sync,
              });

              if (!found && existingKey === newKey) {
                found = true;
                return { ...d, ...mappedDoc };
              }

              return d;
            });

            if (!found) {
              updated.push(mappedDoc);
            }

            return updated;
          });

          document = mappedDoc;
        }
      }
    }
    
    // Hydrate Yjs document
    if (document) {
      await yjsHydrationService.hydrateDocument(
        documentId,
        document.content,
        document.sync.yjsStateB64,
        shouldUseBackendService
      );
    }

    // 🔥 OPTIMIZATION: Return existing document from array for object reference stability
    // This prevents WYSIWYGEditor from re-rendering when document data hasn't actually changed
    if (document) {
      const existingDoc = documents.find(d => d.id === document.id);
      if (existingDoc) {
        // Check if the key properties are the same (avoid expensive deep comparison)
        const keyPropsSame = existingDoc.title === document.title &&
                            existingDoc.content === document.content &&
                            existingDoc.syncStatus === document.syncStatus;
        if (keyPropsSame) {
          return existingDoc; // Return stable reference from documents array
        }
      }
    }

    return document;
  }, [shouldUseBackendService, documents]);

  // Create document
  const createDocument = useCallback(async (
    type: Document['type'],
    title: string,
    content: string = '',
    folderId: string | null = null
  ): Promise<Document> => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }
    
    console.log('🔵 [DocumentData] Creating document:', { type, title, folderId });
    
    // 🔥 LOCAL-FIRST: Always create in guest service first
    const authCheck = authService.isAuthenticated();
    if (!authCheck && !hasShownFirstDocExplainer.current) {
      // Emit event for UI explainer
      const existingDocs = await guestWorkspaceService.getDocuments();
      if (existingDocs.length === 0) {
        hasShownFirstDocExplainer.current = true;
        window.dispatchEvent(new CustomEvent('first-guest-document-created', {
          detail: { title }
        }));
      }
    }
    
    const guestDoc = await guestWorkspaceService.createDocument({
      workspaceId: currentWorkspace.id,
      title,
      type,
      folderId,
      content, // pass initial content through to guest service
    });
    
    const doc: Document = {
      id: guestDoc.id,
      type: guestDoc.type,
      title: guestDoc.title,
      content: guestDoc.content || content || '',
      folderId: guestDoc.folderId,
      workspaceId: guestDoc.workspaceId,
      starred: guestDoc.starred,
      tags: guestDoc.tags,
      createdAt: new Date(guestDoc.createdAt),
      updatedAt: new Date(guestDoc.updatedAt),
      lastOpenedAt: guestDoc.lastOpenedAt ? new Date(guestDoc.lastOpenedAt) : undefined,
      metadata: {},
      sync: { 
        status: guestDoc.syncStatus || 'local', 
        localVersion: guestDoc.version || 1 
      }
    };
    
    // Register in document list
    setDocuments(prev => {
      if (prev.some(d => d.id === doc.id)) return prev;
      return [...prev, doc];
    });
    
    console.log('✅ [DocumentData] Document created:', doc.title);
    return doc;
  }, [currentWorkspace, shouldUseBackendService]);

  // Update document
  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<Document>
  ) => {
    const existingDoc = documents.find(d => d.id === documentId);
    const isLocalDocument = existingDoc?.sync?.status === 'local' || 
                           (!existingDoc && !shouldUseBackendService);
    
    // Try guest service first
    if (!shouldUseBackendService || isLocalDocument) {
      try {
        await guestWorkspaceService.updateDocument(documentId, updates as any);
        setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
        return;
      } catch (error: any) {
        if (error.message?.includes('not found') && shouldUseBackendService) {
          // Fall through to backend
        } else {
          throw error;
        }
      }
    }
    
    // Try backend service
    try {
      const updateInput: any = {};
      if (updates.title !== undefined) updateInput.title = updates.title;
      if (updates.folderId !== undefined) updateInput.folderId = updates.folderId;
      if (updates.starred !== undefined) updateInput.starred = updates.starred;
      if (updates.tags !== undefined) updateInput.tags = updates.tags;
      
      await backendWorkspaceService.updateDocument(documentId, updateInput);
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        // Try guest service as last resort
        try {
          await guestWorkspaceService.updateDocument(documentId, updates as any);
          setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
        } catch (guestError) {
          throw new Error(`Document not found: ${documentId}`);
        }
      } else {
        throw error;
      }
    }
  }, [shouldUseBackendService, documents]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    // 🔥 FIX: Route deletion based on document properties, not just auth status
    // Find the document to check its properties
    const existingDoc = documents.find(d => d.id === documentId);
    
    // Determine if this is a local-only document:
    // 1. Has 'doc_' prefix (guest document ID format)
    // 2. OR sync.status is 'local' or 'pending'
    const isLocalOnlyDoc = documentId.startsWith('doc_') || 
                          existingDoc?.sync?.status === 'local' || 
                          existingDoc?.sync?.status === 'pending';
    
    // Guest mode OR local-only document → use guest service (hard delete)
    if (!shouldUseBackendService || isLocalOnlyDoc) {
      console.log(`🗑️ [DocumentData] Deleting local document: ${documentId}`);
      try {
        await guestWorkspaceService.deleteDocument(documentId);
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        console.log(`✅ [DocumentData] Local document deleted: ${documentId}`);
      } catch (error) {
        console.error(`❌ [DocumentData] Failed to delete local document:`, error);
        throw error;
      }
      return;
    }
    
    // Backend document → use backend service (soft delete)
    console.log(`🗑️ [DocumentData] Deleting backend document: ${documentId}`);
    try {
      await backendWorkspaceService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      console.log(`✅ [DocumentData] Backend document deleted: ${documentId}`);
    } catch (error) {
      console.error(`❌ [DocumentData] Failed to delete backend document:`, error);
      // 🔥 FIX: Don't update UI if backend deletion failed
      throw error;
    }
  }, [shouldUseBackendService, documents]);

  // Auto-save document
  const autoSaveDocument = useCallback(async (documentId: string, content: string) => {
    console.log(`💾 [DocumentData] Auto-save: ${documentId}, ${content.length} chars`);
    
    // Get binary state for dual-write
    const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
    const binary = yjsDocumentManager.getYjsBinarySnapshot(documentId);
    const yjsStateB64 = binary ? buffer.toBase64(binary) : undefined;

    // Guest mode: Save to IndexedDB
    if (!shouldUseBackendService) {
      guestWorkspaceService.updateDocument(documentId, { 
        content,
        yjsStateB64,
      });
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, content, updatedAt: new Date(), sync: { ...doc.sync, yjsStateB64 } }
          : doc
      ));
      
      console.log(`✅ [DocumentData] Saved to guest IndexedDB: ${content.length} chars`);
      return;
    }
    
    // Authenticated mode: Save to backend cache
    const docs = await backendWorkspaceService.getDocuments();
    const docExists = docs.some(d => d.id === documentId);
    
    if (docExists) {
      try {
        await backendWorkspaceService.updateDocument(documentId, { 
          content,
          yjsStateB64,
        });
        
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, content, updatedAt: new Date(), sync: { ...doc.sync, yjsStateB64 } }
            : doc
        ));
        
        console.log(`✅ [DocumentData] Saved to backend cache: ${content.length} chars`);
      } catch (err) {
        console.warn('⚠️ [DocumentData] Failed to save to cache:', err);
      }
    } else {
      console.log('ℹ️ [DocumentData] Document not in cache yet');
    }
  }, [shouldUseBackendService]);

  // Development invariant checks
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    documents.forEach(doc => {
      if (!doc.id) {
        console.error('[INVARIANT] Document without id:', doc);
      }
      if (!doc.workspaceId) {
        console.error('[INVARIANT] Document without workspaceId:', doc);
      }
      
      const duplicates = documents.filter(d => d.id === doc.id);
      if (duplicates.length > 1) {
        console.error('[INVARIANT] Duplicate document IDs:', doc.id, duplicates);
      }
    });
  }, [documents]);

  return (
    <DocumentDataContext.Provider
      value={{
        documents,
        getDocument,
        createDocument,
        updateDocument,
        deleteDocument,
        refreshDocuments,
        autoSaveDocument,
      }}
    >
      {children}
    </DocumentDataContext.Provider>
  );
}

export function useDocumentData() {
  const context = useContext(DocumentDataContext);
  if (!context) {
    throw new Error('useDocumentData must be used within DocumentDataProvider');
  }
  return context;
}


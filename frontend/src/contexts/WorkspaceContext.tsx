/**
 * WorkspaceContext - Shared workspace state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { backendWorkspaceService, guestWorkspaceService } from '@/services/workspace';
import type { Workspace as WorkspaceType, DocumentMeta } from '@/services/workspace/types';
import { syncManager } from '@/services/offline/SyncManager';
import { authService } from '@/services/api';
import { markdownToHtml } from '@/utils/markdownConversion';
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';
import { getCanonicalDocKey, getCanonicalWorkspaceKey } from '@/utils/identity';

// Type alias for consistency with existing code
type Workspace = WorkspaceType;

// Legacy Document type (for compatibility with existing components)
interface Document {
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
    status: 'local' | 'synced' | 'syncing' | 'conflict';
    cloudId?: string;
    lastSyncedAt?: Date;
    cloudVersion?: number;
    localVersion?: number;
    yjsVersion?: number;
    yjsStateB64?: string;
  };
}

// Map DocumentMeta to Document (content is in Yjs, not in metadata)
function mapDocumentMetaToDocument(meta: DocumentMeta | any): Document {
  return {
    id: meta.id,
    type: meta.type,
    title: meta.title,
    content: meta.content || '', // 🔥 Preserve content from IndexedDB (guest mode) or backend
    folderId: meta.folderId,
    workspaceId: meta.workspaceId,
    starred: meta.starred,
    tags: meta.tags,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    lastOpenedAt: meta.lastOpenedAt ? new Date(meta.lastOpenedAt) : undefined,
    metadata: {},
    sync: {
      status: meta.syncStatus,
      cloudId: meta.cloudId,
      lastSyncedAt: meta.lastSyncedAt ? new Date(meta.lastSyncedAt) : undefined,
      localVersion: meta.version,
      yjsVersion: meta.yjsVersion,
      yjsStateB64: meta.yjsStateB64,
    },
  };
}

// Map WorkspaceType to legacy Workspace format
function mapWorkspaceType(ws: WorkspaceType): any {
  return {
    id: ws.id,
    name: ws.name,
    icon: ws.icon,
    description: ws.description,
    createdAt: new Date(ws.createdAt),
    updatedAt: new Date(ws.updatedAt),
    sync: {
      status: ws.syncStatus,
      lastSyncedAt: ws.lastSyncedAt ? new Date(ws.lastSyncedAt) : undefined,
      cloudVersion: ws.version,
      localVersion: ws.version,
    },
  };
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  // Reload prompt state when external file changes are detected
  reloadPrompt: {
    documentId: string;
    filePath: string;
    changeCount: number;
    timestamp: number;
  } | null;
  
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  createWorkspace: (data: { name: string; description: string; icon: string }) => Promise<Workspace>;
  createDocument: (type: Document['type'], title: string, content?: string, folderId?: string | null) => Promise<Document>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocument: (documentId: string) => Promise<Document | undefined>;  // 🔥 Now async!
  refreshDocuments: () => Promise<void>;
  autoSaveDocument: (documentId: string, content: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LAST_WORKSPACE_KEY = 'mdreader:last-workspace-id';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initCounter, setInitCounter] = useState(0); // Force re-init counter
  const [reloadPrompt, setReloadPrompt] = useState<{
    documentId: string;
    filePath: string;
    changeCount: number;
    timestamp: number;
  } | null>(null);
  
  // 🔥 BLOCKING ACTION 1: Guest document migration prompt
  const [guestDocumentPrompt, setGuestDocumentPrompt] = useState<{
    count: number;
    workspaceId: string;
  } | null>(null);
  
  // 🔥 BLOCKING ACTION 3: Guest mode explainer toast
  const [showGuestExplainer, setShowGuestExplainer] = useState(false);

  // Initialize on auth
  // 🔥 FIX 11: Auth epoch gate to prevent triple-initialization
  const initEpochRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // 🔥 FIX 11: Auth epoch gate - prevent duplicate initialization
      const authCheck = authService.isAuthenticated();
      const userId = user?.id || 'guest';
      const epoch = authCheck ? `auth:${userId}` : 'guest';
      
      if (initEpochRef.current === epoch) {
        console.log('[WorkspaceContext] 🛑 [FIX 11] Init skipped (already initialized for this epoch):', epoch);
        return;
      }
      
      console.log('🔵 [FIX 11] WorkspaceContext init triggered:', { 
        epoch,
        previousEpoch: initEpochRef.current,
        isAuthenticated,           // React state (may be stale)
        authCheck,                 // Direct check (always current)
        hasUser: !!user, 
        userId: user?.id,
        email: user?.email,
        username: user?.username,
        authLoading,
        initCounter 
      });
      
      // 🔥 FIX: Check auth state directly (bypass React state timing)
      const hasUserDirect = !!user || authCheck;
      
      // Wait for auth to finish loading (but only on initial load)
      if (authLoading && !authCheck) {
        console.log('⏳ Waiting for auth to finish loading...', { authLoading });
        setIsLoading(false);
        return;
      }
      
      // 🔥 FIX: Use direct auth check OR React state (whichever is true)
      // This handles the race condition where React state hasn't updated yet
      const shouldUseBackend = authCheck || isAuthenticated;
      
      if (!shouldUseBackend) {
        console.log('🌐 Guest mode: Loading guest workspaces', { 
          isAuthenticated, 
          authCheck,
          'using': 'guest'
        });
        
        // Load ALL guest workspaces (NEW service with UUIDs)
        const allWorkspaces = await guestWorkspaceService.getAllWorkspaces();
        setWorkspaces(allWorkspaces as any);
        
        // Load current workspace
        const guestWs = await guestWorkspaceService.getCurrentWorkspace();
        if (guestWs) {
          setCurrentWorkspace(guestWs as any);
          
          // Load guest documents for CURRENT workspace only
          const guestDocs = await guestWorkspaceService.getDocuments(guestWs.id);
          setDocuments(guestDocs as any);
          
          console.log('✅ Guest workspaces loaded:', allWorkspaces.length, 'total, current:', guestWs.name, `(${guestDocs.length} docs for this workspace)`);
        } else {
          console.warn('⚠️ No current guest workspace found');
        }
        
        setIsLoading(false);
        return;
      }
      
      // 🔥 FIX: If authenticated but no user object yet, wait a bit for React state to catch up
      if (!user && authCheck) {
        console.log('⏳ Authenticated but user object not ready yet, waiting 100ms...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Re-check after delay
        if (!user) {
          console.log('⚠️ Still no user object after delay, proceeding with auth check');
          // Continue anyway - backend service will handle auth
        }
      }
      
      if (!user && !authCheck) {
        console.log('⚠️ No user object and not authenticated, waiting...', { user });
        setIsLoading(false);
        return;
      }

      try {
        const userInfo = user ? (user.username || user.email) : 'authenticated user';
        console.log('🔄 Initializing workspace for authenticated user:', userInfo, {
          'React isAuthenticated': isAuthenticated,
          'Direct auth check': authCheck,
          'Has user object': !!user
        });
        setIsLoading(true);
        
        // ✅ LOCAL-FIRST: Load BOTH guest workspaces (local) AND backend workspaces (cloud)
        // Per local_first.md section 8.2: "Migration = Sync. Merge local and cloud data."
        
        // 1. Load guest workspaces (local IndexedDB - MDReaderGuest)
        const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
        console.log(`📦 Loaded ${guestWorkspaces.length} guest workspace(s) from local IndexedDB`);
        
        // 2. Initialize backend service and load cloud workspaces
        await backendWorkspaceService.init();
        const backendWorkspaces = await backendWorkspaceService.getAllWorkspaces();
        console.log(`☁️ Loaded ${backendWorkspaces.length} backend workspace(s) from cloud/cache`);
        
        // 3. Merge workspaces (guest + backend) using canonical workspace key
        // Guest workspaces are marked as 'local' (not synced)
        // Backend workspaces are marked as 'synced' (from cloud)
        const guestMapped = guestWorkspaces.map(ws => ({
          ...mapWorkspaceType(ws as any),
          syncStatus: 'local' as const, // ✅ Mark guest workspaces as local-only
          sync: {
            status: 'local' as const,
            localVersion: (ws as any).version || 1,
            cloudVersion: undefined,
          },
        }));
        
        const backendMapped = backendWorkspaces.map(mapWorkspaceType);
        
        // Combine and deduplicate by canonical workspace key
        const workspaceMap = new Map<string, any>();
        
        // Add guest workspaces first (local)
        guestMapped.forEach(ws => {
          const key = getCanonicalWorkspaceKey({ id: ws.id });
          const existing = workspaceMap.get(key);
          workspaceMap.set(key, existing ?? ws);
        });
        
        // Add backend workspaces (cloud) - override guest metadata when same canonical key
        backendMapped.forEach(ws => {
          const key = getCanonicalWorkspaceKey({ id: ws.id });
          const existing = workspaceMap.get(key);
          workspaceMap.set(key, {
            ...existing,
            ...ws,
          });
        });
        
        const allWorkspaces = Array.from(workspaceMap.values());

        if (process.env.NODE_ENV === 'development') {
          // Dev-only invariant: no duplicate canonical workspace keys
          const seen = new Set<string>();
          for (const ws of allWorkspaces) {
            const key = getCanonicalWorkspaceKey({ id: ws.id });
            if (seen.has(key)) {
              // eslint-disable-next-line no-console
              console.error('[WorkspaceContext] Duplicate canonical workspace key after merge', {
                key,
                workspaces: allWorkspaces
                  .filter(w => getCanonicalWorkspaceKey({ id: w.id }) === key)
                  .map(w => ({ id: w.id, name: w.name, syncStatus: w.syncStatus })),
              });
              break;
            }
            seen.add(key);
          }
        }

        setWorkspaces(allWorkspaces);
        
        console.log(`✅ Merged workspaces: ${guestMapped.length} local + ${backendMapped.length} cloud = ${allWorkspaces.length} total`);
        console.log(`   - Local-only (can push to cloud): ${guestMapped.length}`);
        console.log(`   - Synced to cloud: ${backendMapped.length}`);

        // 4. Load current workspace (prefer last used, or first available)
        const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
        let workspace = allWorkspaces.find(w => w.id === lastWorkspaceId) || allWorkspaces[0];

        if (workspace) {
          // Set workspace in context
          setCurrentWorkspace(workspace);
          
          // Determine which service to use based on sync status
          const isLocalOnly = workspace.syncStatus === 'local';
          
          if (isLocalOnly) {
            // Load from guest service (local IndexedDB)
            console.log('📂 Loading local workspace:', workspace.name);
            await guestWorkspaceService.switchWorkspace(workspace.id);
            const docs = await guestWorkspaceService.getDocuments(workspace.id);
            // ✅ FIX: Don't overwrite sync state from IndexedDB
            const mappedDocs = docs.map(mapDocumentMetaToDocument);
            setDocuments(mappedDocs);
            console.log(`✅ Loaded ${mappedDocs.length} local document(s) from guest service`);
          } else {
            // Load from backend service (cloud/cache) AND merge with any local-only docs for this workspace
            console.log('☁️ Loading cloud workspace:', workspace.name);
            const workspaceType = backendWorkspaces.find(w => w.id === workspace.id);
            if (workspaceType) {
              await backendWorkspaceService.switchWorkspace(workspaceType.id);
              const backendDocs = await backendWorkspaceService.getDocuments(workspaceType.id);
              const backendMapped = backendDocs.map(mapDocumentMetaToDocument);

              // Also load any guest docs that belong to this workspace id (local-first)
              let guestMappedForWorkspace: Document[] = [];
              try {
                const guestDocsForWorkspace = await guestWorkspaceService.getDocuments(workspace.id);
                guestMappedForWorkspace = guestDocsForWorkspace.map(mapDocumentMetaToDocument);
                console.log(`📥 Loaded ${guestMappedForWorkspace.length} local document(s) for cloud workspace from guest service`);
              } catch (guestErr) {
                console.warn('⚠️ Failed to load guest documents for cloud workspace:', guestErr);
              }

              // Merge guest + backend docs by canonical doc key
              const docMap = new Map<string, Document>();

              // Seed with guest docs (local-only truth)
              guestMappedForWorkspace.forEach(d => {
                const key = getCanonicalDocKey({ id: d.id, sync: d.sync });
                const existing = docMap.get(key);
                docMap.set(key, existing ?? d);
              });

              // Overlay backend docs (cloud truth where available)
              backendMapped.forEach(d => {
                const key = getCanonicalDocKey({ id: d.id, sync: d.sync });
                const existing = docMap.get(key);
                docMap.set(key, {
                  ...existing,
                  ...d,
                });
              });

              const mergedDocs = Array.from(docMap.values());

              if (process.env.NODE_ENV === 'development') {
                const seen = new Set<string>();
                for (const doc of mergedDocs) {
                  const key = getCanonicalDocKey({ id: doc.id, sync: doc.sync });
                  if (seen.has(key)) {
                    // eslint-disable-next-line no-console
                    console.error('[WorkspaceContext] Duplicate canonical document key after cloud init merge', {
                      key,
                      docs: mergedDocs
                        .filter(d => getCanonicalDocKey({ id: d.id, sync: d.sync }) === key)
                        .map(d => ({ id: d.id, title: d.title, sync: d.sync })),
                    });
                    break;
                  }
                  seen.add(key);
                }
              }

              setDocuments(mergedDocs);
              console.log(`✅ Loaded ${mergedDocs.length} document(s) for cloud workspace (guest+backend merged)`);
            }
          }
          
          localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
          
          console.log('✅ Workspace context initialized:', workspace.name);
          console.log('📊 Final state:', {
            workspaces: allWorkspaces.length,
            currentWorkspace: workspace.name,
            documents: documents.length,
            isLocalOnly,
          });
        } else {
          console.warn('⚠️ No workspace found for user');
        }
      } catch (err: any) {
        console.error('❌ Workspace init failed:', err);
        setError(err.message || 'Failed to load workspaces');
      } finally {
        // 🔥 FIX 11: Mark this epoch as initialized
        const authCheck = authService.isAuthenticated();
        const userId = user?.id || 'guest';
        const epoch = authCheck ? `auth:${userId}` : 'guest';
        initEpochRef.current = epoch;
        console.log('✅ [FIX 11] Epoch locked:', epoch);
        
        setIsLoading(false);
        console.log('✅ WorkspaceContext initialization complete (isLoading = false)');
      }
    };

    init();
  }, [isAuthenticated, user, authLoading, user?.id, initCounter]); // Include initCounter to force re-init
  
  // Listen for login events to FORCE re-init
  useEffect(() => {
    const handleLoginSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const loginUser = customEvent.detail?.user;
      console.log('🔔 Login event detected, FORCING workspace re-init for user:', loginUser?.username || loginUser?.email);
      
      // 🔥 FIX: Wait a bit for React state to update, then force re-init
      // This ensures isAuthenticated and user state are ready
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify auth is actually set
      const authCheck = authService.isAuthenticated();
      console.log('🔍 Post-login auth check:', {
        'Direct auth check': authCheck,
        'Has login user': !!loginUser,
        'React isAuthenticated': isAuthenticated,
        'React user': !!user
      });
      
      if (authCheck) {
        // 🔥 BLOCKING ACTION 1: Check for guest documents before re-init
        try {
          const guestDocs = await guestWorkspaceService.getDocuments();
          if (guestDocs.length > 0) {
            const currentWs = await guestWorkspaceService.getCurrentWorkspace();
            console.log(`📋 Found ${guestDocs.length} guest documents after login`);
            setGuestDocumentPrompt({
              count: guestDocs.length,
              workspaceId: currentWs?.id || '',
            });
          }
        } catch (error) {
          console.warn('⚠️ Failed to check guest documents:', error);
        }
        
        // Force re-init by incrementing counter
        setInitCounter(prev => prev + 1);
        console.log('✅ Forcing workspace re-init after login');
      } else {
        console.warn('⚠️ Login event received but auth check failed, retrying...');
        // Retry once more after another delay
        setTimeout(() => {
          if (authService.isAuthenticated()) {
            setInitCounter(prev => prev + 1);
          }
        }, 200);
      }
    };
    
    window.addEventListener('auth:login', handleLoginSuccess);
    return () => window.removeEventListener('auth:login', handleLoginSuccess);
  }, [isAuthenticated, user]); // Include dependencies to access latest state
  
  // Listen for document sync events (when offline docs get real IDs from backend)
  useEffect(() => {
    const handleDocumentSynced = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { oldId, newId, doc } = customEvent.detail;
      
      console.log(`🔄 Document synced: ${oldId} → ${newId}`);
      
      // Map the API doc to our Document type
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
      
      // Note: Backend service manages its own state via IndexedDB cache
      // No need to manually update internal state
      
      // Update context state
      setDocuments(prev => {
        // Remove the old temp ID document AND any existing with new ID (dedup)
        const filtered = prev.filter(d => d.id !== oldId && d.id !== newId);
        
        console.log(`📊 Sync event: ${prev.length} docs → removing ${oldId} and ${newId} → ${filtered.length} → adding ${newId}`);
        
        // Add the new one
        return [...filtered, mappedDoc];
      });
    };
    
    // ✅ FIX 2: Listen for sync status changes (after push to cloud)
    const handleSyncStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { documentId, syncStatus, cloudId, lastSyncedAt, yjsVersion, yjsStateB64 } = customEvent.detail;
      
      console.log(`✅ [FIX 2] Document sync status changed: ${documentId} → ${syncStatus} (v${yjsVersion || 0})`);
      
      // Update only the sync status of the existing document
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
      console.log('🔄 Offline data loaded event, refreshing documents...');
      if (currentWorkspace) {
        const docs = await backendWorkspaceService.getDocuments(currentWorkspace.id);
        const mappedDocs = docs.map(mapDocumentMetaToDocument);
        setDocuments(mappedDocs);
        console.log(`✅ Refreshed: ${mappedDocs.length} documents`);
      }
    };
    
    window.addEventListener('document-synced', handleDocumentSynced);
    window.addEventListener('document-sync-status-changed', handleSyncStatusChanged);
    window.addEventListener('offline-data-loaded', handleOfflineDataLoaded);
    
    return () => {
      window.removeEventListener('document-synced', handleDocumentSynced);
      window.removeEventListener('document-sync-status-changed', handleSyncStatusChanged);
      window.removeEventListener('offline-data-loaded', handleOfflineDataLoaded);
    };
  }, []);

  // 🔥 BLOCKING ACTION 3: Listen for first guest document creation
  useEffect(() => {
    const handleFirstGuestDoc = () => {
      setShowGuestExplainer(true);
      // Auto-hide after 8 seconds
      setTimeout(() => setShowGuestExplainer(false), 8000);
    };
    
    window.addEventListener('first-guest-document-created', handleFirstGuestDoc);
    return () => window.removeEventListener('first-guest-document-created', handleFirstGuestDoc);
  }, []);
  
  // Subscribe to external file change events (do not reload here - UI only)
  useEffect(() => {
    // Lazy import to avoid tauri runtime errors in web
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { fileWatcherService } = await import('@/services/tauri/FileWatcherService');
        unsub = fileWatcherService.onExternalFileChange((event) => {
          // event: { documentId, filePath, count, lastModified }
          setReloadPrompt(prev => {
            if (prev && prev.documentId === event.documentId) {
              return {
                documentId: event.documentId,
                filePath: event.filePath,
                changeCount: prev.changeCount + event.count,
                timestamp: Date.now(),
              };
            }
            return {
              documentId: event.documentId,
              filePath: event.filePath,
              changeCount: event.count,
              timestamp: Date.now(),
            };
          });
        });
      } catch (err) {
        // FileWatcherService might not exist on web; ignore
        console.warn('⚠️ FileWatcherService not available:', err);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);
  
  /**
   * Snapshot current Yjs state vector (minimal provenance) before reload.
   * Stores snapshot in localStorage with metadata for debugging.
   */
  const snapshotBeforeReload = useCallback(async (documentId: string, opts: { reason: string; filePath: string; timestamp?: number }) => {
    try {
      const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
      const info = yjsDocumentManager.getDocumentInfo(documentId);
      const ts = opts.timestamp || Date.now();
      if (!info) {
        console.warn('⚠️ snapshotBeforeReload: no ydoc for', documentId);
        // Still log provenance
        const meta = { documentId, timestamp: ts, reason: opts.reason, filePath: opts.filePath, vector: null };
        localStorage.setItem(`mdreader:snapshot:${documentId}:${ts}`, JSON.stringify(meta));
        console.log('🔖 Snapshot recorded (no ydoc):', meta);
        return;
      }

      // Encode state vector
      const stateVector = Y.encodeStateVector(info.ydoc);
      // Base64 encode for storage
      const base64 = typeof window !== 'undefined' ? btoa(String.fromCharCode(...Array.from(stateVector))) : Buffer.from(stateVector).toString('base64');

      const meta = {
        documentId,
        timestamp: ts,
        reason: opts.reason,
        filePath: opts.filePath,
        vector: base64,
      };

      // Persist to localStorage for now
      try {
        localStorage.setItem(`mdreader:snapshot:${documentId}:${ts}`, JSON.stringify(meta));
      } catch (e) {
        console.warn('⚠️ snapshotBeforeReload: failed to persist snapshot to localStorage', e);
      }

      console.log('🔖 Snapshot recorded:', { documentId, timestamp: ts, reason: opts.reason, filePath: opts.filePath });
    } catch (err) {
      console.error('❌ snapshotBeforeReload failed:', err);
    }
  }, []);
  
  // ✅ FIX 5: Dev-mode invariant check for document integrity
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    documents.forEach(doc => {
      if (!doc.id) {
        console.error('[INVARIANT VIOLATION] Document without id:', doc);
      }
      if (!doc.workspaceId) {
        console.error('[INVARIANT VIOLATION] Document without workspaceId:', doc);
      }
      // Check for duplicate IDs
      const duplicates = documents.filter(d => d.id === doc.id);
      if (duplicates.length > 1) {
        console.error('[INVARIANT VIOLATION] Duplicate document IDs:', doc.id, duplicates);
      }
    });
  }, [documents]);

  const switchWorkspace = useCallback(async (workspace: Workspace) => {
    try {
      console.log('🔄 [Context] Switching workspace:', workspace.name, workspace.id);
      setIsLoading(true);
      
      // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
      const isLocalOnly = workspace.syncStatus === 'local';
      
      // 🔥 FIX: Check auth directly (bypass React state timing)
      const authCheck = authService.isAuthenticated();
      const shouldUseBackend = authCheck || isAuthenticated;
      
      console.log('🔵 switchWorkspace called:', {
        'React isAuthenticated': isAuthenticated,
        'Direct auth check': authCheck,
        'Workspace sync status': workspace.syncStatus,
        'Is local-only': isLocalOnly,
        'Using': isLocalOnly ? 'guest (local)' : shouldUseBackend ? 'backend (cloud)' : 'guest',
        'Workspace ID': workspace.id
      });
      
      // Guest mode OR local-only workspace: Use guest service
      if (!shouldUseBackend || isLocalOnly) {
        console.log('📂 Loading local workspace:', workspace.name, isLocalOnly ? '(local-only)' : '(guest mode)');
        await guestWorkspaceService.switchWorkspace(workspace.id);
        
        // Load documents for THIS workspace only
        const docs = await guestWorkspaceService.getDocuments(workspace.id);
        const mappedDocs = docs.map((d: any) => ({
          ...mapDocumentMetaToDocument(d),
          sync: { status: 'local' as const, localVersion: 1 },
        }));
        
        setCurrentWorkspace({...workspace});
        setDocuments(mappedDocs);
        localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
        console.log('✅ Local workspace switched:', workspace.name, `(${mappedDocs.length} docs for this workspace)`);
        return;
      }
      
      // Authenticated mode + synced workspace: Use backend service
      console.log('☁️ Loading cloud workspace:', workspace.name);
      await backendWorkspaceService.switchWorkspace(workspace.id);
      
      // Load documents for THIS workspace only
      const docs = await backendWorkspaceService.getDocuments(workspace.id);
      const mappedDocs = docs.map(mapDocumentMetaToDocument);
      
      setCurrentWorkspace({...workspace});
      setDocuments(mappedDocs);
      localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
      console.log('✅ Cloud workspace switched:', workspace.name, `(${mappedDocs.length} docs for this workspace)`);
    } catch (err) {
      console.error('❌ [Context] Switch failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentWorkspace]);

  const createWorkspace = useCallback(async (data: { name: string; description: string; icon: string }) => {
    // 🔥 FIX: Check auth directly (bypass React state timing)
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;
    
    console.log('🔵 createWorkspace called:', {
      'React isAuthenticated': isAuthenticated,
      'Direct auth check': authCheck,
      'Using': shouldUseBackend ? 'backend' : 'guest'
    });
    
    // Guest mode: Use guest service
    if (!shouldUseBackend) {
      console.log('🌐 Guest mode: Creating workspace in IndexedDB');
      const newWorkspace = await guestWorkspaceService.createWorkspace({
        name: data.name,
        icon: data.icon,
        description: data.description
      });
      
      // Switch to new workspace
      await guestWorkspaceService.switchWorkspace(newWorkspace.id);
      
      // Load workspaces and documents for NEW workspace
      const allWorkspaces = await guestWorkspaceService.getAllWorkspaces();
      const docs = await guestWorkspaceService.getDocuments(newWorkspace.id);
      
      setWorkspaces(allWorkspaces as any);
      setCurrentWorkspace(newWorkspace as any);
      setDocuments(docs as any); // Clear old docs, show only new workspace docs
      
      console.log('✅ Guest workspace created:', newWorkspace.name, `(${docs.length} docs)`);
      return newWorkspace as any;
    }
    
    // Authenticated mode: Use new backend service
    console.log('🔐 Backend mode: Creating workspace via API');
    const newWorkspace = await backendWorkspaceService.createWorkspace({
      name: data.name,
      icon: data.icon,
      description: data.description,
    });
    
    const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
    const mappedWorkspaces = allWorkspaces.map(mapWorkspaceType);
    const mappedNewWorkspace = mapWorkspaceType(newWorkspace);
    
    setWorkspaces(mappedWorkspaces);
    
    // Load documents for NEW workspace
    const docs = await backendWorkspaceService.getDocuments(newWorkspace.id);
    const mappedDocs = docs.map(mapDocumentMetaToDocument);
    
    setCurrentWorkspace(mappedNewWorkspace);
    setDocuments(mappedDocs);
    
    console.log('✅ Backend workspace created:', newWorkspace.name, `(${mappedDocs.length} docs)`);
    return mappedNewWorkspace;
  }, [switchWorkspace, isAuthenticated]);

  const createDocument = useCallback(async (type: Document['type'], title: string, content: string = '', folderId: string | null = null) => {
    if (!currentWorkspace) {
      console.error('❌ Cannot create document: No workspace loaded');
      throw new Error('No workspace selected. Please wait for workspace to load.');
    }
    
    console.log('🔵 WorkspaceContext.createDocument() called:', { type, title, folderId, currentWorkspace: currentWorkspace?.name });
    
    // 🔥 LOCAL-FIRST: ALWAYS create documents locally using guest service
    // Regardless of auth status, documents are LOCAL until explicitly synced to cloud
    console.log('📝 LOCAL-FIRST: Creating document in local IndexedDB (MDReaderGuest)');
    
    // 🔥 BLOCKING ACTION 3: Show guest mode explainer on first document creation
    const authCheck = authService.isAuthenticated();
    if (!authCheck) {
      const existingDocs = await guestWorkspaceService.getDocuments();
      if (existingDocs.length === 0) {
        // First document creation in guest mode
        console.log('💡 First guest document - showing explainer');
        // Emit event that UI can listen to
        window.dispatchEvent(new CustomEvent('first-guest-document-created', {
          detail: { title }
        }));
      }
    }
    
      const guestDoc = await guestWorkspaceService.createDocument({
        workspaceId: currentWorkspace.id,
        title,
        type,
        folderId
      });
      
    // Map to Document type (content will be in Yjs, not here)
      const doc: Document = {
        id: guestDoc.id,
        type: guestDoc.type,
        title: guestDoc.title,
        content: '', // Content is in Yjs, not here
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
      
    // 🔥 CRITICAL: Register document in local index (sidebar depends on this)
    setDocuments(prev => {
      // Prevent duplicates
      if (prev.some(d => d.id === doc.id)) return prev;
      return [...prev, doc];
    });
    
    console.log('✅ Document created locally and registered in sidebar index:', doc.title, `(id: ${doc.id}, folderId: ${folderId})`);
    return doc;
  }, [currentWorkspace, isAuthenticated]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    // Check if document exists in current documents list to determine which service to use
    const existingDoc = documents.find(d => d.id === documentId);
    const isLocalDocument = existingDoc?.sync?.status === 'local' || 
                           (!existingDoc && !isAuthenticated);
    
    // Guest mode OR local document: Use guest service
    if (!isAuthenticated || isLocalDocument) {
      try {
        await guestWorkspaceService.updateDocument(documentId, updates as any);
        setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
        return;
      } catch (error: any) {
        // If document not found in guest service and authenticated, try backend service
        if (error.message?.includes('not found') && isAuthenticated) {
          console.log('⚠️ Document not found in guest service, trying backend service...');
          // Fall through to backend service below
        } else {
          throw error;
        }
      }
    }
    
    // Authenticated mode: Use new backend service
    try {
      const updateInput: any = {};
      if (updates.title !== undefined) updateInput.title = updates.title;
      if (updates.folderId !== undefined) updateInput.folderId = updates.folderId;
      if (updates.starred !== undefined) updateInput.starred = updates.starred;
      if (updates.tags !== undefined) updateInput.tags = updates.tags;
      
      await backendWorkspaceService.updateDocument(documentId, updateInput);
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
    } catch (error: any) {
      // If document not found in backend, try guest service (might be local-only)
      if (error.message?.includes('not found')) {
        console.log('⚠️ Document not found in backend service, trying guest service...');
        try {
          await guestWorkspaceService.updateDocument(documentId, updates as any);
          setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...updates } : d));
        } catch (guestError) {
          throw new Error(`Document not found in either service: ${documentId}`);
        }
      } else {
        throw error;
      }
    }
  }, [isAuthenticated, documents]);

  const deleteDocument = useCallback(async (documentId: string) => {
    // Guest mode: Use guest service
    if (!isAuthenticated) {
      await guestWorkspaceService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      return;
    }
    
    // Authenticated mode: Use new backend service
    await backendWorkspaceService.deleteDocument(documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  }, [isAuthenticated]);

  // 🔥 STAGE 1: SOFT FLIP - PREFER YJS BINARY FOR HYDRATION
  // This function writes initial content into a Yjs document EXACTLY ONCE
  // ✅ Location: WorkspaceContext (data layer, not view layer)
  // ✅ Priority: Yjs Binary > Markdown Cache
  // ✅ Gate: fragment.length === 0 (ONLY allowed check)
  // 
  // 🛡️ CRITICAL INVARIANT (Yjs Rule):
  //    Never apply snapshots while HocuspocusProvider is active
  //    Snapshots are WRITE-ONLY during live collaboration
  //    Snapshots can only be APPLIED when:
  //    - Cold load (no provider attached)
  //    - Offline mode (provider disconnected)
  //    - Document closed (provider destroyed)
  const hydrateYjsDocument = async (documentId: string, markdown: string, yjsStateB64?: string) => {
    // 1. Get Yjs document from manager
    const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
    const instance = yjsDocumentManager.getDocument(documentId, {
      enableWebSocket: false,
      isAuthenticated: authService.isAuthenticated(),
    });
    
    const { ydoc } = instance;
    
    // 2. THE HYDRATION GATE (ONLY ALLOWED CHECK)
    const fragment = ydoc.getXmlFragment('content');
    const isFragmentPopulated = fragment.length > 0;

    // 🛡️ CRITICAL INVARIANT: Never apply snapshots while HocuspocusProvider is active
    // Applying updates during live sync can corrupt the CRDT state
    if (instance.websocketProvider) {
      console.warn('⚠️ [INVARIANT] Skipping hydration - HocuspocusProvider is active:', documentId);
      console.warn('   📖 Rule: Snapshots are WRITE-ONLY during live collaboration');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      if (yjsStateB64 && isFragmentPopulated) {
        console.error('❌ [INVARIANT VIOLATION] Attempted to hydrate from binary on a non-empty Yjs doc!');
      }
    }

    if (isFragmentPopulated) {
      console.log('ℹ️ [STEP 4] Yjs document already has content, skipping hydration:', documentId);
      return;
    }

    // 3. APPLY YJS BINARY (AUTHORITATIVE)
    if (yjsStateB64) {
      console.log('🧬 [STEP 4] [STAGE 2 ENFORCEMENT] Hydrating from binary truth:', documentId, `(${yjsStateB64.length} chars b64)`);
      try {
        const binary = buffer.fromBase64(yjsStateB64);
        Y.applyUpdate(ydoc, binary, 'initial-hydration');
        console.log('✅ [STEP 4] Binary truth established. Markdown fallback will be ignored.');
        return; // ✅ ENFORCED: Do not fall back to markdown if binary exists
      } catch (error) {
        console.warn('⚠️ [STEP 4] Binary hydration failed, falling back to legacy markdown:', error);
        // Fall through to markdown only on error
      }
    }
    
    // 4. FALLBACK TO MARKDOWN
    if (!markdown) return;
    
    if (process.env.NODE_ENV === 'development') {
      if (yjsStateB64) {
        console.error('❌ [INVARIANT VIOLATION] Markdown hydration attempted on Yjs-authoritative document (this should have been caught by the binary path return)');
      }
    }

    console.log('🧬 [STEP 4] [LEGACY] Hydrating Yjs document from markdown fallback:', documentId);
    
    try {
      // Step 1: Convert Markdown → HTML
      const html = markdownToHtml(markdown);
      
      // Step 2: Store in temporary field for TipTap to pick up
      ydoc.transact(() => {
        const tempText = ydoc.getText('_init_markdown');
        if (tempText.length > 0) {
          tempText.delete(0, tempText.length);
        }
        tempText.insert(0, html);
      });
      
      console.log('✅ [STEP 4] Hydrated from markdown successfully');
    } catch (error) {
      console.error('❌ [STEP 4] Markdown hydration failed:', error);
    }
  };

  const getDocument = useCallback(async (documentId: string): Promise<Document | undefined> => {
    // 🔥 FIX: Actually fetch the document from the service (with content!)
    // Don't just search the in-memory array (which has no content from list endpoint)
    
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;
    
    let document: Document | undefined;
    
    if (!shouldUseBackend) {
      // Guest mode: Get from guest service
      const guestDoc = await guestWorkspaceService.getDocument(documentId);
      document = guestDoc ? mapDocumentMetaToDocument(guestDoc) : undefined;
    } else {
      // 🔥 CRITICAL FIX: When authenticated, check if guest doc has cloud mapping
      // If guest doc was pushed to cloud, use the CLOUD version (enables WebSocket!)
      
      // First, try guest service (for documents created before login)
      const guestDoc = await guestWorkspaceService.getDocument(documentId);
      if (guestDoc) {
        console.log(`✅ [getDocument] Found in guest service: ${documentId}`);
        
        // 🚀 NEW: Check if this guest doc has been pushed to cloud
        if (guestDoc.cloudId && guestDoc.syncStatus === 'synced') {
          console.log(`🔄 [getDocument] Guest doc has cloud mapping, loading cloud version: ${guestDoc.cloudId}`);
          
          // Signal that caller should redirect to cloud ID
          // This will enable WebSocket and real-time collaboration!
          const cloudDoc = await backendWorkspaceService.getDocument(guestDoc.cloudId);
          if (cloudDoc) {
            const mappedDoc = mapDocumentMetaToDocument(cloudDoc);
            // Add a flag to indicate redirect is needed
            (mappedDoc as any).__redirectToCloudId = guestDoc.cloudId;
            document = mappedDoc;
          } else {
            // Cloud doc not found, use guest version as fallback
            document = mapDocumentMetaToDocument(guestDoc);
          }
        } else {
          // 🚀 CRITICAL FIX: Even if no cloudId mapping, check if cloud version exists
          // This handles cases where doc was created via API but mapping wasn't stored
          const possibleCloudId = documentId.startsWith('doc_') ? documentId.slice(4) : documentId;
          const cloudDoc = await backendWorkspaceService.getDocument(possibleCloudId).catch(() => null);
          
          if (cloudDoc) {
            console.log(`🔄 [getDocument] Found cloud version without mapping: ${possibleCloudId}`);
            // Update guest doc with cloud mapping
            await guestWorkspaceService.updateDocument(documentId, {
              cloudId: possibleCloudId,
              syncStatus: 'synced',
            });
            
            const mappedDoc = mapDocumentMetaToDocument(cloudDoc);
            (mappedDoc as any).__redirectToCloudId = possibleCloudId;
            document = mappedDoc;
          } else {
            // No cloud mapping yet, use guest version
            document = mapDocumentMetaToDocument(guestDoc);
          }
        }
      } else {
        // If not in guest service, try backend service (cloud documents)
        const doc = await backendWorkspaceService.getDocument(documentId);
        
        // Update in-memory array if we got the document
        if (doc) {
          const mappedDoc = mapDocumentMetaToDocument(doc);
          setDocuments(prev => {
            const exists = prev.some(d => d.id === documentId);
            if (exists) {
              // Update existing
              return prev.map(d => d.id === documentId ? mappedDoc : d);
            } else {
              // Add new
              return [...prev, mappedDoc];
            }
          });
          document = mappedDoc;
        }
      }
    }
    
    // 🔥 STEP 4: ONE-TIME CONTENT HYDRATION
    if (document) {
      await hydrateYjsDocument(documentId, document.content, document.sync.yjsStateB64);
    }
    
    return document;
  }, [isAuthenticated]);

  const refreshDocuments = useCallback(async () => {
    if (!currentWorkspace) return;
    
    try {
      // ✅ LOCAL-FIRST: Check workspace sync status to determine which service to use
      const isLocalOnly = currentWorkspace.syncStatus === 'local';
      const authCheck = authService.isAuthenticated();
      const shouldUseBackend = authCheck || isAuthenticated;
      
      console.log('🔄 [refreshDocuments] Starting...', { 
        workspace: currentWorkspace.name, 
        isLocalOnly, 
        shouldUseBackend 
      });
      
      // 🔥 FIX: If logged in, check workspace mapping FIRST, then fetch documents
      // Documents saved to cloud might be in a different workspace
      if (shouldUseBackend) {
        let workspaceIdToFetch = currentWorkspace.id;
        
        // Check for workspace mapping (local → cloud)
        try {
          const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
          const cloudWorkspaceId = await selectiveSyncService.getCloudWorkspaceId(currentWorkspace.id);
          if (cloudWorkspaceId && cloudWorkspaceId !== currentWorkspace.id) {
            console.log(`🆔 [refreshDocuments] Found workspace mapping: ${currentWorkspace.id} → ${cloudWorkspaceId}`);
            workspaceIdToFetch = cloudWorkspaceId; // Use cloud workspace ID to fetch documents
          }
        } catch (err) {
          console.warn('⚠️ Failed to check workspace mapping:', err);
        }
        
        // Get documents from backend service using the correct workspace ID
        const backendDocs = await backendWorkspaceService.getDocuments(workspaceIdToFetch);
        console.log(`📥 [refreshDocuments] Backend: Got ${backendDocs.length} docs from backendWorkspaceService (workspace: ${workspaceIdToFetch})`);
        
        // If we have backend docs, use them (they have the latest cloud content)
        if (backendDocs.length > 0) {
          console.log(`📥 [refreshDocuments] Backend: First doc:`, {
            id: backendDocs[0].id,
            title: backendDocs[0].title,
            hasContent: !!backendDocs[0].content,
            contentLength: backendDocs[0].content?.length || 0,
            contentPreview: backendDocs[0].content?.substring(0, 50)
          });
          const mappedDocs = backendDocs.map(mapDocumentMetaToDocument);
          console.log(`📥 [refreshDocuments] Backend: After mapping, first doc content length: ${mappedDocs[0]?.content?.length || 0}`);
          
          // 🔥 FIX 1: Merge-by-canonical-key instead of raw id (preserves local-only docs)
          setDocuments(prev => {
            const map = new Map<string, Document>();

            // Seed map with existing docs keyed by canonical doc key
            prev.forEach(d => {
              const key = getCanonicalDocKey({
                id: d.id,
                sync: d.sync,
              });
              const existing = map.get(key);
              map.set(key, existing ?? d);
            });

            // Merge incoming docs (override metadata but preserve local fields)
            mappedDocs.forEach(d => {
              const key = getCanonicalDocKey({
                id: d.id,
                sync: d.sync,
              });
              const existing = map.get(key);
              map.set(key, {
                ...existing,
                ...d,
              });
            });

            const merged = Array.from(map.values());

            // Dev-only invariant: no two docs share the same canonical key
            if (process.env.NODE_ENV === 'development') {
              const seen = new Set<string>();
              for (const doc of merged) {
                const key = getCanonicalDocKey({
                  id: doc.id,
                  sync: doc.sync,
                });
                if (seen.has(key)) {
                  // eslint-disable-next-line no-console
                  console.error('[WorkspaceContext] Duplicate canonical document key after backend merge', {
                    key,
                    docs: merged
                      .filter(d => getCanonicalDocKey({ id: d.id, sync: d.sync }) === key)
                      .map(d => ({
                        id: d.id,
                        title: d.title,
                        sync: d.sync,
                      })),
                  });
                  break;
                }
                seen.add(key);
              }
            }

            return merged;
          });
          return;
        }
        
        // If no backend docs, fall through to guest service (for truly local-only docs)
        console.log('⚠️ [refreshDocuments] No backend docs found, falling back to guest service');
      }
      
      // Guest mode OR no backend docs: Use guest service
      const docs = await guestWorkspaceService.getDocuments(currentWorkspace.id);
      console.log(`📥 [refreshDocuments] Guest: Got ${docs.length} docs from guestWorkspaceService`);
      if (docs.length > 0) {
        console.log(`📥 [refreshDocuments] Guest: First doc content length: ${docs[0].content?.length || 0}`);
      }
      const mappedDocs = docs.map((d: any) => ({
        ...mapDocumentMetaToDocument(d),
        sync: { status: 'local' as const, localVersion: 1 },
      }));
      console.log(`📥 [refreshDocuments] Guest: After mapping, first doc content length: ${mappedDocs[0]?.content?.length || 0}`);
      
      // 🔥 FIX 1: Merge-by-canonical-key instead of raw id (preserves local-only docs)
      setDocuments(prev => {
        const map = new Map<string, Document>();

        prev.forEach(d => {
          const key = getCanonicalDocKey({
            id: d.id,
            sync: d.sync,
          });
          const existing = map.get(key);
          map.set(key, existing ?? d);
        });

        mappedDocs.forEach(d => {
          const key = getCanonicalDocKey({
            id: d.id,
            sync: d.sync,
          });
          const existing = map.get(key);
          map.set(key, {
            ...existing,
            ...d,
          });
        });

        const merged = Array.from(map.values());

        if (process.env.NODE_ENV === 'development') {
          const seen = new Set<string>();
          for (const doc of merged) {
            const key = getCanonicalDocKey({
              id: doc.id,
              sync: doc.sync,
            });
            if (seen.has(key)) {
              // eslint-disable-next-line no-console
              console.error('[WorkspaceContext] Duplicate canonical document key after guest merge', {
                key,
                docs: merged
                  .filter(d => getCanonicalDocKey({ id: d.id, sync: d.sync }) === key)
                  .map(d => ({
                    id: d.id,
                    title: d.title,
                    sync: d.sync,
                  })),
              });
              break;
            }
            seen.add(key);
          }
        }

        return merged;
      });
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  }, [currentWorkspace, isAuthenticated]);

  // 🔥 BLOCKING ACTION 1: Handler to push all guest documents to cloud
  const handlePushGuestDocuments = useCallback(async () => {
    if (!guestDocumentPrompt) return;
    
    try {
      console.log(`🚀 Pushing ${guestDocumentPrompt.count} guest documents to cloud...`);
      const guestDocs = await guestWorkspaceService.getDocuments();
      
      // Import SelectiveSyncService dynamically to avoid circular deps
      const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const doc of guestDocs) {
        try {
          const result = await selectiveSyncService.pushDocument(doc.id);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.warn(`⚠️ Failed to push ${doc.title}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Error pushing ${doc.title}:`, error);
        }
      }
      
      console.log(`✅ Push complete: ${successCount} succeeded, ${failCount} failed`);
      
      // Close prompt
      setGuestDocumentPrompt(null);
      
      // Refresh documents to show newly synced ones
      await refreshDocuments();
    } catch (error) {
      console.error('❌ Failed to push guest documents:', error);
    }
  }, [guestDocumentPrompt, refreshDocuments]);

  const autoSaveDocument = useCallback(async (documentId: string, content: string) => {
    console.log(`💾 autoSaveDocument called: ${documentId}, ${content.length} chars`);
    
    // Get binary state for dual-write (local-first truth)
    const { yjsDocumentManager } = await import('@/services/yjs/YjsDocumentManager');
    const binary = yjsDocumentManager.getYjsBinarySnapshot(documentId);
    const yjsStateB64 = binary ? buffer.toBase64(binary) : undefined;

    // Guest mode: Save content to IndexedDB
    if (!isAuthenticated) {
      guestWorkspaceService.updateDocument(documentId, { 
        content,
        yjsStateB64,
      });
      
      // 🔥 CRITICAL: Update local state so getDocument() returns fresh content
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, content, updatedAt: new Date(), sync: { ...doc.sync, yjsStateB64 } }
          : doc
      ));
      
      console.log(`✅ Saved to IndexedDB + updated state: ${content.length} chars (binary truth preserved)`);
      return;
    }
    
    // Authenticated mode: Save to backend CACHE (local-first)
    // Note: This only updates the local IndexedDB cache, not the cloud API
    const docs = await backendWorkspaceService.getDocuments();
    const docExists = docs.some(d => d.id === documentId);
    if (docExists) {
      try {
        await backendWorkspaceService.updateDocument(documentId, { 
          content,
          yjsStateB64,
        });
        
        // 🔥 CRITICAL: Update local state
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, content, updatedAt: new Date(), sync: { ...doc.sync, yjsStateB64 } }
            : doc
        ));
        console.log(`✅ Saved to backend cache + updated state: ${content.length} chars (binary truth preserved)`);
      } catch (err) {
        console.warn('⚠️ Failed to save document to cache:', err);
      }
    } else {
      console.log('ℹ️ Document not in cache yet');
    }
  }, [isAuthenticated]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      documents,
      isLoading,
      error,
      switchWorkspace,
      createWorkspace,
      createDocument,
      updateDocument,
      deleteDocument,
      getDocument,
      refreshDocuments,
      autoSaveDocument,
      reloadPrompt,
    }}>
      {children}

      {/* Reload confirmation modal — UI only, no reload logic here */}
      {reloadPrompt && (
        <React.Suspense fallback={null}>
          {/* Lazy import modal to avoid bundling in non-UI contexts */}
          <ReloadModalWrapper
            reloadPrompt={reloadPrompt}
            onClose={() => setReloadPrompt(null)}
            snapshotBeforeReload={snapshotBeforeReload}
          />
        </React.Suspense>
      )}
      
      {/* 🔥 BLOCKING ACTION 1: Guest document migration prompt */}
      {guestDocumentPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              📋 Local Documents Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have <strong>{guestDocumentPrompt.count} local document{guestDocumentPrompt.count !== 1 ? 's' : ''}</strong> created before logging in.
              Would you like to push them to the cloud to sync across devices?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handlePushGuestDocuments}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                ☁️ Push to Cloud
              </button>
              <button
                onClick={() => setGuestDocumentPrompt(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Keep Local
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              💡 Tip: Local documents will remain accessible but won't sync across devices.
            </p>
          </div>
        </div>
      )}
      
      {/* 🔥 BLOCKING ACTION 3: Guest mode explainer toast */}
      {showGuestExplainer && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm border-2 border-blue-400">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-semibold mb-1">Local-Only Mode</h3>
                <p className="text-sm text-blue-100 mb-2">
                  Your document is saved locally in your browser. It won't sync across devices until you login and push to cloud.
                </p>
                <button
                  onClick={() => setShowGuestExplainer(false)}
                  className="text-xs text-blue-200 hover:text-white underline"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}


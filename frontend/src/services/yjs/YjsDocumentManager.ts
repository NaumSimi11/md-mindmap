/**
 * YjsDocumentManager - Global Singleton for Yjs Document Management
 * 
 * Purpose: Prevent duplicate Yjs document initialization and type conflicts
 * 
 * Features:
 * - Single Y.Doc instance per documentId (prevents type conflicts)
 * - Automatic cleanup when no components are using a document
 * - Reference counting to track active users
 * - IndexedDB and WebSocket provider management
 * - Error handling with automatic recovery
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { SnapshotManager } from '@/services/snapshots/SnapshotManager';

interface YjsDocumentInstance {
  ydoc: Y.Doc;
  indexeddbProvider: IndexeddbPersistence;
  websocketProvider: HocuspocusProvider | null;
  snapshotManager: SnapshotManager | null; // STEP 5: Cloud snapshots
  refCount: number; // Number of components using this document
  isInitialized: boolean;
  lastAccessed: number;
}

class YjsDocumentManager {
  private static instance: YjsDocumentManager;
  private documents: Map<string, YjsDocumentInstance> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Cleanup documents that haven't been accessed in 5 minutes
  private static CLEANUP_THRESHOLD_MS = 5 * 60 * 1000;
  private static CLEANUP_INTERVAL_MS = 60 * 1000; // Check every minute

  private constructor() {
    console.log('🔧 YjsDocumentManager initialized');
    this.startCleanupTimer();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): YjsDocumentManager {
    if (!YjsDocumentManager.instance) {
      YjsDocumentManager.instance = new YjsDocumentManager();
    }
    return YjsDocumentManager.instance;
  }

  /**
   * Get document instance (read-only access for status checks)
   * Used by useSyncStatus hook to read sync state
   */
  public getDocumentInstance(documentId: string): YjsDocumentInstance | null {
    return this.documents.get(documentId) || null;
  }

  /**
   * Get or create a Yjs document instance
   * @param documentId - Unique document identifier
   * @param options - Configuration options
   */
  public getDocument(
    documentId: string,
    options: {
      enableWebSocket?: boolean;
      websocketUrl?: string;
      isAuthenticated?: boolean;
    } = {}
  ): YjsDocumentInstance {
    const { enableWebSocket = false, websocketUrl = 'ws://localhost:1234', isAuthenticated = false } = options;

    // Check if document already exists
    if (this.documents.has(documentId)) {
      const instance = this.documents.get(documentId)!;
      instance.refCount++;
      instance.lastAccessed = Date.now();
      console.log(`♻️ Reusing existing Yjs document: ${documentId} (refCount: ${instance.refCount})`);
      
      // 🔥 UPGRADE FIX: If document exists but WebSocket is needed and missing, add it now!
      if (enableWebSocket && isAuthenticated && !instance.websocketProvider) {
        console.log(`🔄 [UPGRADE] Adding WebSocket to existing document: ${documentId}`);
        
        try {
          const authToken = localStorage.getItem('auth_token');
          
          if (!authToken) {
            console.warn(`⚠️ No auth token found for WebSocket upgrade`);
          } else {
            console.log(`🔥 [UPGRADE DEBUG] Creating Hocuspocus provider with:`, {
              websocketUrl,
              documentId,
              documentIdType: typeof documentId,
              documentIdLength: documentId ? documentId.length : 0,
              documentIdValue: JSON.stringify(documentId),
            });
            
            // Check for share token (guest access)
            const shareToken = sessionStorage.getItem('share_token');
            
            const websocketProvider = new HocuspocusProvider({
              url: websocketUrl,
              name: documentId,
              document: instance.ydoc,
              token: authToken || '',
              // Pass share token via requestHeaders (NOT token parameter)
              requestHeaders: shareToken ? { 'x-share-token': shareToken } : undefined,
            });
            
            console.log(`🔥 [UPGRADE DEBUG] Hocuspocus provider created:`, {
              url: websocketProvider.configuration.url,
              name: websocketProvider.configuration.name,
            });
            
            websocketProvider.on('status', (event: { status: string }) => {
              console.log(`🌐 WebSocket status for ${documentId}:`, event.status);
            });
            
            websocketProvider.on('sync', (isSynced: boolean) => {
              console.log(`🔄 WebSocket sync for ${documentId}:`, isSynced);
            });
            
            websocketProvider.on('connection-error', (error: any) => {
              console.error(`❌ WebSocket connection error for ${documentId}:`, error);
            });
            
            instance.websocketProvider = websocketProvider;
            console.log(`✅ [UPGRADE] WebSocket added successfully for ${documentId} (with auth: true) - Room: ${(websocketProvider as any).roomname}`);
          }
        } catch (wsError) {
          console.error(`❌ [UPGRADE] WebSocket creation failed for ${documentId}:`, wsError);
        }
      }
      
      return instance;
    }

    // Create new document instance
    console.log(`🆕 Creating new Yjs document: ${documentId}`);
    
    try {
      const ydoc = new Y.Doc();
      
      // 🔥 EXPERT-LEVEL: Yjs document created empty
      // Content initialization is handled by WorkspaceContext using proper ProseMirror structure
      // NO localStorage hacks, NO timing issues, NO race conditions
      console.log(`📄 [EXPERT] Creating empty Yjs document (content initialized separately)`);
      
      // 1. Setup IndexedDB persistence (ALWAYS)
      const indexeddbProvider = new IndexeddbPersistence(`mdreader-${documentId}`, ydoc);
      
      indexeddbProvider.on('synced', () => {
        console.log(`💾 IndexedDB synced for ${documentId}`);
        if (instance) {
          instance.isInitialized = true;
        }
      });
      
      indexeddbProvider.on('error', (err: Error) => {
        console.error(`❌ IndexedDB error for ${documentId}:`, err);
      });

      // 2. Setup WebSocket provider (ONLY if authenticated + enabled)
      let websocketProvider: HocuspocusProvider | null = null;
      
      if (enableWebSocket && isAuthenticated) {
        try {
          // Get JWT token for authentication
          const authToken = localStorage.getItem('auth_token');
          
          if (!authToken) {
            console.warn(`⚠️ No auth token found, WebSocket will connect as guest`);
          }
          
          console.log(`🌐 [WEBSOCKET DEBUG] Creating WebSocket provider with:`, {
            websocketUrl,
            documentId,
            documentIdType: typeof documentId,
            documentIdLength: documentId.length,
            authToken: authToken ? `${authToken.substring(0, 20)}...` : 'none'
          });
          
          console.log(`🔥 [DEBUG] RAW VALUES:`, {
            'arg1 (serverUrl)': websocketUrl,
            'arg2 (roomname)': documentId,
            'arg3': 'ydoc',
            'arg4': { connect: true, params: { token: authToken || '' } }
          });
          
          // Check for share token (guest access)
          const shareToken = sessionStorage.getItem('share_token');
          
          websocketProvider = new HocuspocusProvider({
            url: websocketUrl,
            name: documentId,
            document: ydoc,
            token: authToken || '',
            // Pass share token via requestHeaders (NOT token parameter)
            requestHeaders: shareToken ? { 'x-share-token': shareToken } : undefined,
          });
          
          console.log(`🔥 [DEBUG] Hocuspocus provider created:`, {
            url: websocketProvider.configuration.url,
            name: websocketProvider.configuration.name,
          });
          
          websocketProvider.on('status', (event: { status: string }) => {
            console.log(`🌐 WebSocket status for ${documentId}:`, event.status);
          });
          
          websocketProvider.on('sync', (isSynced: boolean) => {
            console.log(`🔄 WebSocket sync for ${documentId}:`, isSynced);
          });
          
          websocketProvider.on('connection-error', (error: any) => {
            console.error(`❌ WebSocket connection error for ${documentId}:`, error);
          });
          
          console.log(`🌐 WebSocket enabled for ${documentId} (with auth: ${!!authToken})`);
        } catch (wsError) {
          console.error(`❌ WebSocket creation failed for ${documentId}:`, wsError);
          // Continue without WebSocket - local-only mode
        }
      } else {
        console.log(`📴 WebSocket disabled for ${documentId} (guest mode or offline)`);
      }

      // 3. Setup Snapshot Manager (STEP 5: Cloud snapshots)
      // Only enabled for authenticated users
      let snapshotManager: SnapshotManager | null = null;
      
      if (isAuthenticated) {
        snapshotManager = new SnapshotManager({
          documentId,
          ydoc,
          debounceMs: 3000, // 3 seconds
          isAuthenticated: true,
        });
        console.log(`📸 [STEP 5] Snapshot manager enabled for ${documentId}`);
      } else {
        console.log(`📴 [STEP 5] Snapshot manager disabled (guest mode) for ${documentId}`);
      }

      // Create instance
      const instance: YjsDocumentInstance = {
        ydoc,
        indexeddbProvider,
        websocketProvider,
        snapshotManager,
        refCount: 1,
        isInitialized: false,
        lastAccessed: Date.now(),
      };

      this.documents.set(documentId, instance);
      console.log(`✅ Yjs document created: ${documentId}`);
      
      return instance;
    } catch (error) {
      console.error(`❌ CRITICAL: Failed to create Yjs document for ${documentId}:`, error);
      throw new Error(`Failed to create Yjs document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release a document (decrement ref count)
   * @param documentId - Document to release
   */
  public releaseDocument(documentId: string): void {
    const instance = this.documents.get(documentId);
    if (!instance) {
      console.warn(`⚠️ Attempted to release non-existent document: ${documentId}`);
      return;
    }

    instance.refCount--;
    console.log(`📉 Released document ${documentId} (refCount: ${instance.refCount})`);

    // Don't destroy immediately - let cleanup timer handle it
    // This allows for quick re-access without re-initialization
  }

  /**
   * Get a binary snapshot of the current Yjs document state
   * @param documentId - Document to snapshot
   * @returns Uint8Array binary update
   */
  public getYjsBinarySnapshot(documentId: string): Uint8Array | null {
    const instance = this.documents.get(documentId);
    if (!instance || !instance.ydoc) {
      return null;
    }

    // 🔥 PURE: encodeStateAsUpdate is a read-only operation that captures the full state
    return Y.encodeStateAsUpdate(instance.ydoc);
  }

  /**
   * Force destroy a document (for manual cleanup)
   * @param documentId - Document to destroy
   */
  public destroyDocument(documentId: string): void {
    const instance = this.documents.get(documentId);
    if (!instance) {
      console.warn(`⚠️ Attempted to destroy non-existent document: ${documentId}`);
      return;
    }

    console.log(`🧹 Destroying Yjs document: ${documentId}`);
    
    try {
      // Destroy snapshot manager (STEP 5)
      instance.snapshotManager?.destroy();
      
      // Destroy providers
      instance.indexeddbProvider?.destroy();
      instance.websocketProvider?.destroy();
      
      // Destroy Yjs document
      instance.ydoc.destroy();
      
      // Remove from map
      this.documents.delete(documentId);
      
      console.log(`✅ Document destroyed: ${documentId}`);
    } catch (error) {
      console.error(`❌ Error destroying document ${documentId}:`, error);
      // Force remove from map even if cleanup failed
      this.documents.delete(documentId);
    }
  }

  /**
   * Get all active document IDs
   */
  public getActiveDocuments(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Get document info (for debugging)
   */
  public getDocumentInfo(documentId: string): YjsDocumentInstance | null {
    return this.documents.get(documentId) || null;
  }

  /**
   * Periodic cleanup of unused documents
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedDocuments();
    }, YjsDocumentManager.CLEANUP_INTERVAL_MS);
  }

  /**
   * Clean up documents with refCount = 0 that haven't been accessed recently
   */
  private cleanupUnusedDocuments(): void {
    const now = Date.now();
    const toDestroy: string[] = [];

    this.documents.forEach((instance, documentId) => {
      if (instance.refCount === 0 && (now - instance.lastAccessed) > YjsDocumentManager.CLEANUP_THRESHOLD_MS) {
        toDestroy.push(documentId);
      }
    });

    if (toDestroy.length > 0) {
      console.log(`🧹 Cleaning up ${toDestroy.length} unused documents`);
      toDestroy.forEach(docId => this.destroyDocument(docId));
    }
  }

  /**
   * Destroy all documents (for testing or reset)
   */
  public destroyAll(): void {
    console.log('🧹 Destroying all Yjs documents');
    const documentIds = Array.from(this.documents.keys());
    documentIds.forEach(docId => this.destroyDocument(docId));
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const yjsDocumentManager = YjsDocumentManager.getInstance();


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
import { safeStorage, StorageKeys } from '@/utils/storage';

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
    this.startCleanupTimer();
    this.setupLogoutCleanup();
  }

  /**
   * Listen for logout events to clean up all documents
   * Prevents stale document state from persisting across user sessions
   */
  private setupLogoutCleanup(): void {
    window.addEventListener('auth:logout', () => {
      this.destroyAll();
      // Restart cleanup timer for next session
      this.startCleanupTimer();
    });
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
      currentUser?: { name: string; color: string }; // 🔥 NEW: User info for presence
    } = {}
  ): YjsDocumentInstance {
    const { enableWebSocket = false, websocketUrl = 'ws://localhost:1234', isAuthenticated = false, currentUser } = options;

    // Check if document already exists
    if (this.documents.has(documentId)) {
      const instance = this.documents.get(documentId)!;
      instance.refCount++;
      instance.lastAccessed = Date.now();
      
      // 🔥 UPGRADE FIX: If document exists but WebSocket is needed and missing, add it now!
      if (enableWebSocket && isAuthenticated && !instance.websocketProvider) {
        
        try {
          const authToken = safeStorage.getItem(StorageKeys.AUTH_TOKEN);
          
          if (!authToken) {
            console.warn(`⚠️ No auth token found for WebSocket upgrade`);
          } else {
           
            
            // Check for share token (guest access)
            const shareToken = sessionStorage.getItem('share_token');
            // Append share token to URL if present
            const wsUrl = shareToken ? `${websocketUrl}?share_token=${shareToken}` : websocketUrl;
            
            const websocketProvider = new HocuspocusProvider({
              url: wsUrl,
              name: documentId,
              document: instance.ydoc,
              token: authToken || '',
              // 🔥 FIX: Handle auth failures - refresh token and recreate provider
              onAuthenticationFailed: async ({ reason }) => {
                console.warn(`🔐 [Auth Failed - Upgrade] ${documentId}: ${reason}`);
                
                try {
                  const { authService } = await import('@/services/api/AuthService');
                  await authService.refreshToken();
                  
                  const newToken = safeStorage.getItem(StorageKeys.AUTH_TOKEN);
                  if (newToken && instance.websocketProvider) {
                    instance.websocketProvider.destroy();
                    
                    const newProvider = new HocuspocusProvider({
                      url: wsUrl,
                      name: documentId,
                      document: instance.ydoc,
                      token: newToken,
                    });
                    
                    instance.websocketProvider = newProvider;
                  }
                } catch (refreshError) {
                  console.error(`❌ Token refresh failed:`, refreshError);
                  safeStorage.removeItem(StorageKeys.AUTH_TOKEN);
                  safeStorage.removeItem(StorageKeys.REFRESH_TOKEN);
                  console.error(`🚨 Session expired. Please log in again.`);
                }
              },
            });
            
           
            websocketProvider.on('connection-error', (error: any) => {
              console.error(`❌ WebSocket connection error for ${documentId}:`, error);
            });
            
            instance.websocketProvider = websocketProvider;
            
            // 🔥 NEW: Set user presence info on awareness
            if (currentUser) {
              websocketProvider.awareness.setLocalStateField('user', {
                name: currentUser.name,
                color: currentUser.color,
              });
            }
            
          }
        } catch (wsError) {
          console.error(`❌ [UPGRADE] WebSocket creation failed for ${documentId}:`, wsError);
        }
      }
      
      return instance;
    }

    // Create new document instance
    
    try {
      const ydoc = new Y.Doc();
      
      // 🔥 EXPERT-LEVEL: Yjs document created empty
      // Content initialization is handled by WorkspaceContext using proper ProseMirror structure
      // NO localStorage hacks, NO timing issues, NO race conditions
      
      // 1. Setup IndexedDB persistence (ALWAYS)
      const indexeddbProvider = new IndexeddbPersistence(`mdreader-${documentId}`, ydoc);
      
      indexeddbProvider.on('synced', () => {
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
          // Get JWT token for authentication (using safeStorage for SSR/private mode)
          const authToken = safeStorage.getItem(StorageKeys.AUTH_TOKEN);
          
          if (!authToken) {
            console.warn(`⚠️ No auth token found, WebSocket will connect as guest`);
          }
          
        
          
         
          
          // Check for share token (guest access)
          const shareToken = sessionStorage.getItem('share_token');
          // Append share token to URL if present
          const wsUrl = shareToken ? `${websocketUrl}?share_token=${shareToken}` : websocketUrl;
          
          websocketProvider = new HocuspocusProvider({
            url: wsUrl,
            name: documentId,
            document: ydoc,
            token: authToken || '',
            // 🔥 FIX: Handle auth failures - refresh token and recreate provider
            onAuthenticationFailed: async ({ reason }) => {
              console.warn(`🔐 [Auth Failed] ${documentId}: ${reason}`);
              
              try {
                // Dynamic import to avoid circular dependency
                const { authService } = await import('@/services/api/AuthService');
                await authService.refreshToken();
                
                // Get new token
                const newToken = safeStorage.getItem(StorageKeys.AUTH_TOKEN);
                if (newToken) {
                  
                  // Get the document instance
                  const instance = this.documents.get(documentId);
                  if (instance && instance.websocketProvider) {
                    // Destroy old provider
                    instance.websocketProvider.destroy();
                    
                    // Create new provider with fresh token
                    const newProvider = new HocuspocusProvider({
                      url: wsUrl,
                      name: documentId,
                      document: ydoc,
                      token: newToken,
                    });
                    
                    // Update instance
                    instance.websocketProvider = newProvider;
                    
                    newProvider.on('status', (event: { status: string }) => {
                    });
                    
                    newProvider.on('sync', (isSynced: boolean) => {
                    });
                    
                    // 🔥 Re-set awareness on new provider
                    if (currentUser) {
                      newProvider.awareness.setLocalStateField('user', {
                        name: currentUser.name,
                        color: currentUser.color,
                      });
                    }
                    
                  }
                }
              } catch (refreshError) {
                console.error(`❌ Token refresh failed:`, refreshError);
                // Token refresh failed - user needs to re-login
                safeStorage.removeItem(StorageKeys.AUTH_TOKEN);
                safeStorage.removeItem(StorageKeys.REFRESH_TOKEN);
                console.error(`🚨 Session expired. Please log in again.`);
              }
            },
          });
          
        
          
          websocketProvider.on('status', (event: { status: string }) => {
          });
          
          websocketProvider.on('sync', (isSynced: boolean) => {
          });
          
          websocketProvider.on('connection-error', (error: any) => {
            console.error(`❌ WebSocket connection error for ${documentId}:`, error);
          });
          
          // 🔥 NEW: Set user presence info on awareness
          if (currentUser) {
            websocketProvider.awareness.setLocalStateField('user', {
              name: currentUser.name,
              color: currentUser.color,
            });
          }
          
        } catch (wsError) {
          console.error(`❌ WebSocket creation failed for ${documentId}:`, wsError);
          // Continue without WebSocket - local-only mode
        }
      } else {
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
      } else {
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

    // 🔥 FIX: Prevent negative refCount (bug where release called more than acquire)
    if (instance.refCount <= 0) {
      console.warn(`⚠️ RefCount already 0 for ${documentId}, skipping decrement. This may indicate a double-release bug.`);
      return;
    }

    instance.refCount--;
    instance.lastAccessed = Date.now(); // Update last accessed for cleanup timer
    

    // Don't destroy immediately - let cleanup timer handle it
    // This allows for quick re-access without re-initialization
  }

  /**
   * Get current ref count for a document (for debugging)
   */
  public getRefCount(documentId: string): number {
    return this.documents.get(documentId)?.refCount ?? 0;
  }

  /**
   * Debug: List all documents with their ref counts
   */
  public debugListDocuments(): Array<{ id: string; refCount: number; lastAccessed: Date }> {
    return Array.from(this.documents.entries()).map(([id, instance]) => ({
      id,
      refCount: instance.refCount,
      lastAccessed: new Date(instance.lastAccessed),
    }));
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
      
    } catch (error) {
      console.error(`❌ Error destroying document ${documentId}:`, error);
      // Force remove from map even if cleanup failed
      this.documents.delete(documentId);
    }
  }

  /**
   * Clear document storage (destroy instance + delete IndexedDB)
   * 
   * Use this after pushing a document to cloud to force re-hydration
   * from the cloud yjs_state_b64 on next document open.
   * 
   * This fixes the content loss bug where local Yjs state is stale
   * after pushing to cloud.
   * 
   * @param documentId - Document ID to clear
   */
  public async clearDocumentStorage(documentId: string): Promise<void> {
    
    try {
      // 1. Destroy in-memory instance if it exists
      if (this.documents.has(documentId)) {
        this.destroyDocument(documentId);
      }
      
      // 2. Delete IndexedDB database for this document
      const dbName = `mdreader-${documentId}`;
      await indexedDB.deleteDatabase(dbName);
      
    } catch (error) {
      console.error(`❌ [YjsDocumentManager] Failed to clear storage for ${documentId}:`, error);
      throw error;
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
      toDestroy.forEach(docId => this.destroyDocument(docId));
    }
  }

  /**
   * Destroy all documents (for testing or reset)
   */
  public destroyAll(): void {
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


/**
 * Unified Sync Manager
 * 
 * Central orchestrator for ALL sync scenarios:
 * - Web vs Desktop
 * - Local vs Online
 * - Auth vs Guest
 * - Single vs Multi-user
 * 
 * This is the ONLY sync manager - all sync logic flows through here.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { EnvironmentDetector } from './EnvironmentDetector';
import { ConnectionStateMachine } from './ConnectionStateMachine';
import { StorageProviderFactory } from './storage/StorageProviderFactory';
import {
  IStorageProvider,
  Environment,
  ConnectionState,
  SyncConfig,
  DEFAULT_SYNC_CONFIG,
  SyncEvent,
  SyncEventType,
  SyncEventListener,
  SyncError,
  SyncErrorCode,
} from './types';

export class UnifiedSyncManager {
  private static instance: UnifiedSyncManager | null = null;

  private config: SyncConfig;
  private envDetector: EnvironmentDetector;
  private stateMachine: ConnectionStateMachine;
  private storageProvider: IStorageProvider | null = null;

  // Document registry (one Yjs doc instance per document ID)
  private yjsDocs: Map<string, Y.Doc> = new Map();
  private yjsProviders: Map<string, {
    indexeddb: IndexeddbPersistence | null;
    websocket: WebsocketProvider | null;
  }> = new Map();

  // Reference counting for multi-tab scenarios
  private refCounts: Map<string, number> = new Map();

  // Event listeners
  private listeners: Set<SyncEventListener> = new Set();

  // Initialization state
  private initialized = false;

  private constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.envDetector = EnvironmentDetector.getInstance();
    this.stateMachine = new ConnectionStateMachine(
      this.config.maxReconnectAttempts
    );
    
    // Listen for logout to cleanup all sync state
    window.addEventListener('auth:logout', () => {
      console.log('🚪 [UnifiedSyncManager] Logout detected, destroying instance...');
      UnifiedSyncManager.resetInstance();
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<SyncConfig>): UnifiedSyncManager {
    if (!UnifiedSyncManager.instance) {
      UnifiedSyncManager.instance = new UnifiedSyncManager(config);
    }
    return UnifiedSyncManager.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    UnifiedSyncManager.instance?.destroy();
    UnifiedSyncManager.instance = null;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize sync manager
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('Sync manager already initialized');
      return;
    }

    try {
      this.stateMachine.connect();

      // Detect environment
      const env = await this.envDetector.init();
      console.log('Environment detected:', env);

      // Initialize storage provider
      this.storageProvider = await StorageProviderFactory.createAndInit(env.platform);
      console.log('Storage provider initialized:', await this.storageProvider.getInfo());

      // Setup environment change listener
      this.envDetector.subscribe(this.handleEnvironmentChange.bind(this));

      // Setup connection state listener
      this.stateMachine.subscribe(this.handleStateChange.bind(this));

      this.stateMachine.connected();
      this.initialized = true;

      this.emit({
        type: SyncEventType.STATE_CHANGE,
        timestamp: Date.now(),
        data: { state: ConnectionState.CONNECTED },
      });

      console.log('✅ Sync manager initialized successfully');
    } catch (error) {
      this.stateMachine.fatal(error as Error);
      throw new SyncError(
        SyncErrorCode.FATAL_ERROR,
        'Failed to initialize sync manager',
        false,
        error as Error
      );
    }
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Get or create Yjs document
   */
  getDocument(documentId: string): Y.Doc {
    this.ensureInitialized();

    // Check if document already exists
    let ydoc = this.yjsDocs.get(documentId);

    if (!ydoc) {
      // Create new Yjs document
      ydoc = new Y.Doc();
      this.yjsDocs.set(documentId, ydoc);

      // Initialize providers
      this.initializeProviders(documentId, ydoc);

      console.log(`✅ Created Yjs document: ${documentId}`);
    }

    // Increment reference count
    const refCount = (this.refCounts.get(documentId) || 0) + 1;
    this.refCounts.set(documentId, refCount);

    console.log(`📊 Document ${documentId} refs: ${refCount}`);

    return ydoc;
  }

  /**
   * Release document reference
   */
  releaseDocument(documentId: string): void {
    const refCount = (this.refCounts.get(documentId) || 0) - 1;

    if (refCount <= 0) {
      // No more references, cleanup
      this.cleanupDocument(documentId);
      this.refCounts.delete(documentId);
      console.log(`🗑️  Cleaned up document: ${documentId}`);
    } else {
      this.refCounts.set(documentId, refCount);
      console.log(`📊 Document ${documentId} refs: ${refCount}`);
    }
  }

  /**
   * Check if document is loaded
   */
  hasDocument(documentId: string): boolean {
    return this.yjsDocs.has(documentId);
  }

  /**
   * Get all loaded documents
   */
  getLoadedDocuments(): string[] {
    return Array.from(this.yjsDocs.keys());
  }

  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================

  /**
   * Initialize providers for document
   */
  private initializeProviders(documentId: string, ydoc: Y.Doc): void {
    const env = this.envDetector.getEnvironment();
    const storageKey = this.envDetector.getStorageKey(documentId);

    // Always initialize IndexedDB persistence (local backup)
    const indexeddb = new IndexeddbPersistence(storageKey, ydoc);
    
    indexeddb.on('synced', () => {
      console.log(`💾 IndexedDB synced: ${documentId}`);
    });

    // Initialize WebSocket provider if auth + online
    let websocket: WebsocketProvider | null = null;

    if (this.envDetector.shouldUseCloudSync() && this.config.enableCloudSync) {
      websocket = new WebsocketProvider(
        this.config.websocketUrl,
        documentId,
        ydoc,
        {
          connect: true,
          params: {
            userId: env.userId || 'guest',
          },
        }
      );

      websocket.on('status', ({ status }: { status: string }) => {
        console.log(`🌐 WebSocket status: ${status} (${documentId})`);
        
        if (status === 'connected') {
          this.stateMachine.synced();
        } else if (status === 'disconnected') {
          this.stateMachine.disconnect();
        }
      });

      websocket.on('synced', () => {
        console.log(`☁️  Cloud synced: ${documentId}`);
        this.emit({
          type: SyncEventType.DOCUMENT_SYNCED,
          timestamp: Date.now(),
          data: { documentId },
        });
      });

      console.log(`🌐 WebSocket provider initialized: ${documentId}`);
    }

    this.yjsProviders.set(documentId, { indexeddb, websocket });
  }

  /**
   * Cleanup document and providers
   */
  private cleanupDocument(documentId: string): void {
    // Get providers
    const providers = this.yjsProviders.get(documentId);

    if (providers) {
      // Destroy WebSocket provider
      if (providers.websocket) {
        providers.websocket.destroy();
        console.log(`🗑️  WebSocket provider destroyed: ${documentId}`);
      }

      // Destroy IndexedDB persistence
      if (providers.indexeddb) {
        providers.indexeddb.destroy();
        console.log(`🗑️  IndexedDB persistence destroyed: ${documentId}`);
      }

      this.yjsProviders.delete(documentId);
    }

    // Destroy Yjs document
    const ydoc = this.yjsDocs.get(documentId);
    if (ydoc) {
      ydoc.destroy();
      this.yjsDocs.delete(documentId);
    }
  }

  // ============================================================================
  // ENVIRONMENT CHANGES
  // ============================================================================

  /**
   * Handle environment changes (network, auth)
   */
  private handleEnvironmentChange(env: Environment): void {
    console.log('🔄 Environment changed:', env);

    this.emit({
      type: SyncEventType.ENVIRONMENT_CHANGE,
      timestamp: Date.now(),
      data: env,
    });

    // Reinitialize providers for all documents
    for (const [documentId, ydoc] of this.yjsDocs.entries()) {
      this.reinitializeProviders(documentId, ydoc);
    }
  }

  /**
   * Reinitialize providers (e.g., when going online/offline or login/logout)
   */
  private reinitializeProviders(documentId: string, ydoc: Y.Doc): void {
    // Cleanup existing providers
    const providers = this.yjsProviders.get(documentId);
    if (providers?.websocket) {
      providers.websocket.destroy();
    }

    // Re-initialize with new environment
    this.initializeProviders(documentId, ydoc);

    console.log(`🔄 Providers reinitialized: ${documentId}`);
  }

  // ============================================================================
  // CONNECTION STATE CHANGES
  // ============================================================================

  /**
   * Handle connection state changes
   */
  private handleStateChange(info: any): void {
    console.log('🔄 Connection state:', info.state);

    this.emit({
      type: SyncEventType.STATE_CHANGE,
      timestamp: Date.now(),
      data: info,
    });

    // Handle error state
    if (info.state === ConnectionState.ERROR && info.error) {
      this.emit({
        type: SyncEventType.SYNC_ERROR,
        timestamp: Date.now(),
        data: { error: info.error },
      });

      // Auto-retry if possible
      if (this.stateMachine.canRetry()) {
        const delay = this.stateMachine.getTimeUntilRetry();
        if (delay !== null) {
          setTimeout(() => {
            this.stateMachine.connect();
          }, delay);
        }
      }
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit sync event
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.envDetector.getEnvironment();
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.stateMachine.getState();
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    this.ensureInitialized();
    return await this.storageProvider!.getInfo();
  }

  /**
   * Force sync all documents
   */
  async forceSyncAll(): Promise<void> {
    this.ensureInitialized();
    
    console.log('🔄 Force syncing all documents...');

    for (const [documentId, providers] of this.yjsProviders.entries()) {
      if (providers.websocket && providers.websocket.wsconnected) {
        console.log(`🔄 Force syncing: ${documentId}`);
        // Force sync by triggering awareness update
        providers.websocket.awareness.setLocalState(
          providers.websocket.awareness.getLocalState()
        );
      }
    }
  }

  /**
   * Destroy sync manager
   */
  destroy(): void {
    // Cleanup all documents
    for (const documentId of Array.from(this.yjsDocs.keys())) {
      this.cleanupDocument(documentId);
    }

    this.initialized = false;
    console.log('🗑️  Sync manager destroyed');
  }

  /**
   * Ensure manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new SyncError(
        SyncErrorCode.FATAL_ERROR,
        'Sync manager not initialized',
        false
      );
    }
  }
}


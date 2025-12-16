/**
 * Document Lifecycle Manager
 * 
 * Centralized document lifecycle management:
 * - Create new documents
 * - Load existing documents
 * - Save documents
 * - Close documents
 * - Automatic cleanup
 * - Multi-tab coordination
 */

import * as Y from 'yjs';
import { UnifiedSyncManager } from '../sync/UnifiedSyncManager';
import { DocumentRegistry } from './DocumentRegistry';
import {
  DocumentState,
  DocumentMetadata,
  DocumentInstance,
  CreateDocumentOptions,
  LoadDocumentOptions,
  SaveDocumentOptions,
  CloseDocumentOptions,
  DocumentEvent,
  DocumentEventType,
  DocumentEventListener,
  DocumentError,
  DocumentErrorCode,
  DocumentConfig,
  DEFAULT_DOCUMENT_CONFIG,
} from './types';

export class DocumentLifecycleManager {
  private static instance: DocumentLifecycleManager;

  private config: DocumentConfig;
  private syncManager: UnifiedSyncManager;
  private registry: DocumentRegistry;

  // Event listeners
  private listeners: Set<DocumentEventListener> = new Set();

  // Auto-save timers
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  // Initialization state
  private initialized = false;

  private constructor(config: Partial<DocumentConfig> = {}) {
    this.config = { ...DEFAULT_DOCUMENT_CONFIG, ...config };
    this.syncManager = UnifiedSyncManager.getInstance();
    this.registry = DocumentRegistry.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<DocumentConfig>): DocumentLifecycleManager {
    if (!DocumentLifecycleManager.instance) {
      DocumentLifecycleManager.instance = new DocumentLifecycleManager(config);
    }
    return DocumentLifecycleManager.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    DocumentLifecycleManager.instance?.destroy();
    DocumentLifecycleManager.instance = null as any;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize manager
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('Document manager already initialized');
      return;
    }

    try {
      // Ensure sync manager is initialized
      await this.syncManager.init();

      this.initialized = true;
      console.log('✅ Document lifecycle manager initialized');
    } catch (error) {
      throw new DocumentError(
        DocumentErrorCode.LOAD_FAILED,
        'Failed to initialize document manager',
        undefined,
        error as Error
      );
    }
  }

  // ============================================================================
  // CREATE DOCUMENT
  // ============================================================================

  /**
   * Create new document
   */
  async createDocument(options: CreateDocumentOptions): Promise<DocumentInstance> {
    this.ensureInitialized();

    const documentId = this.generateDocumentId();

    try {
      console.log(`📝 Creating document: ${documentId}`);

      // Get Yjs document from sync manager
      const ydoc = this.syncManager.getDocument(documentId);

      // Initialize document content
      const ytext = ydoc.getText('content');
      if (options.initialContent) {
        ytext.insert(0, options.initialContent);
      }

      // Create metadata
      const metadata: DocumentMetadata = {
        title: options.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: options.initialContent?.length || 0,
        version: 1,
      };

      // Register in registry
      const instance = this.registry.register(documentId, ydoc, metadata);

      // Setup auto-save
      if (this.config.enableAutoSave) {
        this.setupAutoSave(documentId);
      }

      // Emit event
      this.emit({
        type: DocumentEventType.DOCUMENT_CREATED,
        documentId,
        timestamp: Date.now(),
        data: { metadata },
      });

      console.log(`✅ Document created: ${documentId}`);

      return instance;
    } catch (error) {
      throw new DocumentError(
        DocumentErrorCode.CREATE_FAILED,
        `Failed to create document: ${options.title}`,
        documentId,
        error as Error
      );
    }
  }

  // ============================================================================
  // LOAD DOCUMENT
  // ============================================================================

  /**
   * Load existing document
   */
  async loadDocument(options: LoadDocumentOptions): Promise<DocumentInstance> {
    this.ensureInitialized();

    const { documentId } = options;

    try {
      console.log(`📖 Loading document: ${documentId}`);

      // Check if already loaded
      if (this.registry.has(documentId)) {
        console.log(`📖 Document already loaded: ${documentId}`);
        const instance = this.registry.get(documentId)!;
        this.registry.addRef(documentId);
        return instance;
      }

      // Get Yjs document from sync manager
      const ydoc = this.syncManager.getDocument(documentId);

      // Load metadata (from IndexedDB or backend)
      const metadata = await this.loadMetadata(documentId);

      // Register in registry
      const instance = this.registry.register(documentId, ydoc, metadata);

      // Setup auto-save
      if (this.config.enableAutoSave && !options.readonly) {
        this.setupAutoSave(documentId);
      }

      // Emit event
      this.emit({
        type: DocumentEventType.DOCUMENT_LOADED,
        documentId,
        timestamp: Date.now(),
        data: { metadata },
      });

      console.log(`✅ Document loaded: ${documentId}`);

      return instance;
    } catch (error) {
      throw new DocumentError(
        DocumentErrorCode.LOAD_FAILED,
        `Failed to load document: ${documentId}`,
        documentId,
        error as Error
      );
    }
  }

  // ============================================================================
  // SAVE DOCUMENT
  // ============================================================================

  /**
   * Save document
   */
  async saveDocument(
    documentId: string,
    options: SaveDocumentOptions = {}
  ): Promise<void> {
    this.ensureInitialized();

    const instance = this.registry.get(documentId);
    
    if (!instance) {
      throw new DocumentError(
        DocumentErrorCode.NOT_FOUND,
        `Document not found: ${documentId}`,
        documentId
      );
    }

    try {
      console.log(`💾 Saving document: ${documentId}`);

      this.registry.setState(documentId, DocumentState.SAVING);

      // Get document content
      const ytext = instance.ydoc.getText('content');
      const content = ytext.toString();

      // Update metadata
      this.registry.updateMetadata(documentId, {
        size: content.length,
        version: instance.metadata.version + 1,
      });

      // Sync manager handles persistence automatically
      // We just need to ensure metadata is saved
      await this.saveMetadata(documentId, instance.metadata);

      this.registry.setState(documentId, DocumentState.SAVED);

      // Emit event
      this.emit({
        type: DocumentEventType.DOCUMENT_SAVED,
        documentId,
        timestamp: Date.now(),
        data: { metadata: instance.metadata },
      });

      console.log(`✅ Document saved: ${documentId}`);
    } catch (error) {
      this.registry.setState(documentId, DocumentState.ERROR);
      
      throw new DocumentError(
        DocumentErrorCode.SAVE_FAILED,
        `Failed to save document: ${documentId}`,
        documentId,
        error as Error
      );
    }
  }

  // ============================================================================
  // CLOSE DOCUMENT
  // ============================================================================

  /**
   * Close document
   */
  async closeDocument(
    documentId: string,
    options: CloseDocumentOptions = {}
  ): Promise<void> {
    this.ensureInitialized();

    const instance = this.registry.get(documentId);
    
    if (!instance) {
      console.warn(`Document not found: ${documentId}`);
      return;
    }

    try {
      console.log(`🔒 Closing document: ${documentId}`);

      // Save before close if requested
      if (options.saveBeforeClose) {
        await this.saveDocument(documentId);
      }

      // Decrement reference count
      const refCount = this.registry.releaseRef(documentId);

      // If no more references, cleanup
      if (refCount === 0 || options.force) {
        // Stop auto-save
        this.stopAutoSave(documentId);

        // Release from sync manager
        this.syncManager.releaseDocument(documentId);

        // Unregister from registry
        this.registry.unregister(documentId);

        // Emit event
        this.emit({
          type: DocumentEventType.DOCUMENT_CLOSED,
          documentId,
          timestamp: Date.now(),
        });

        console.log(`✅ Document closed: ${documentId}`);
      }
    } catch (error) {
      throw new DocumentError(
        DocumentErrorCode.LOAD_FAILED,
        `Failed to close document: ${documentId}`,
        documentId,
        error as Error
      );
    }
  }

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  /**
   * Setup auto-save for document
   */
  private setupAutoSave(documentId: string): void {
    // Clear existing timer
    this.stopAutoSave(documentId);

    // Create new timer
    const timer = setInterval(() => {
      this.saveDocument(documentId).catch((error) => {
        console.error(`Auto-save failed for ${documentId}:`, error);
      });
    }, this.config.autoSaveInterval);

    this.autoSaveTimers.set(documentId, timer);
  }

  /**
   * Stop auto-save for document
   */
  private stopAutoSave(documentId: string): void {
    const timer = this.autoSaveTimers.get(documentId);
    
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(documentId);
    }
  }

  // ============================================================================
  // METADATA MANAGEMENT
  // ============================================================================

  /**
   * Load document metadata
   */
  private async loadMetadata(documentId: string): Promise<DocumentMetadata> {
    // Try to load from localStorage first (temporary)
    const stored = localStorage.getItem(`doc_meta_${documentId}`);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Default metadata if not found
    return {
      title: 'Untitled Document',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 0,
      version: 1,
    };
  }

  /**
   * Save document metadata
   */
  private async saveMetadata(documentId: string, metadata: DocumentMetadata): Promise<void> {
    // Store in localStorage (temporary - will be replaced by backend)
    localStorage.setItem(`doc_meta_${documentId}`, JSON.stringify(metadata));
  }

  // ============================================================================
  // DOCUMENT ACCESS
  // ============================================================================

  /**
   * Get document instance
   */
  getDocument(documentId: string): DocumentInstance | undefined {
    return this.registry.get(documentId);
  }

  /**
   * Get all loaded documents
   */
  getAllDocuments(): DocumentInstance[] {
    return this.registry.getAll();
  }

  /**
   * Check if document is loaded
   */
  isDocumentLoaded(documentId: string): boolean {
    return this.registry.has(documentId);
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Subscribe to document events
   */
  subscribe(listener: DocumentEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit document event
   */
  private emit(event: DocumentEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // ============================================================================
  // CLEANUP & UTILITIES
  // ============================================================================

  /**
   * Cleanup unreferenced documents
   */
  async cleanupUnreferenced(): Promise<void> {
    const unreferenced = this.registry.getUnreferenced();
    
    for (const instance of unreferenced) {
      await this.closeDocument(instance.id, { force: true });
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      ...this.registry.getStats(),
      autoSaveActive: this.autoSaveTimers.size,
    };
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    // Stop all auto-save timers
    for (const [documentId] of this.autoSaveTimers) {
      this.stopAutoSave(documentId);
    }

    // Clear registry
    this.registry.clear();

    this.initialized = false;
    console.log('🗑️  Document lifecycle manager destroyed');
  }

  /**
   * Ensure manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new DocumentError(
        DocumentErrorCode.LOAD_FAILED,
        'Document manager not initialized'
      );
    }
  }
}

/**
 * Document Registry
 * 
 * Central registry for all document instances
 * Ensures one Yjs document per document ID (global)
 */

import * as Y from 'yjs';
import { DocumentInstance, DocumentState, DocumentMetadata, DocumentError, DocumentErrorCode } from './types';

export class DocumentRegistry {
  private static instance: DocumentRegistry;

  // Document registry (one instance per ID)
  private documents: Map<string, DocumentInstance> = new Map();

  // Access tracking for LRU cleanup
  private accessOrder: string[] = [];

  private constructor() {}

  static getInstance(): DocumentRegistry {
    if (!DocumentRegistry.instance) {
      DocumentRegistry.instance = new DocumentRegistry();
    }
    return DocumentRegistry.instance;
  }

  /**
   * Register new document
   */
  register(
    id: string,
    ydoc: Y.Doc,
    metadata: DocumentMetadata
  ): DocumentInstance {
    // Check if already registered
    if (this.documents.has(id)) {
      throw new DocumentError(
        DocumentErrorCode.ALREADY_LOADED,
        `Document already registered: ${id}`,
        id
      );
    }

    const instance: DocumentInstance = {
      id,
      ydoc,
      state: DocumentState.LOADED,
      refCount: 1,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      metadata,
    };

    this.documents.set(id, instance);
    this.trackAccess(id);

    console.log(`📝 Document registered: ${id} (refs: 1)`);

    return instance;
  }

  /**
   * Get document instance
   */
  get(id: string): DocumentInstance | undefined {
    const instance = this.documents.get(id);
    
    if (instance) {
      instance.lastAccessedAt = Date.now();
      this.trackAccess(id);
    }

    return instance;
  }

  /**
   * Check if document is registered
   */
  has(id: string): boolean {
    return this.documents.has(id);
  }

  /**
   * Increment reference count
   */
  addRef(id: string): number {
    const instance = this.documents.get(id);
    
    if (!instance) {
      throw new DocumentError(
        DocumentErrorCode.NOT_FOUND,
        `Document not found: ${id}`,
        id
      );
    }

    instance.refCount++;
    instance.lastAccessedAt = Date.now();
    this.trackAccess(id);

    console.log(`📊 Document ${id} refs: ${instance.refCount}`);

    return instance.refCount;
  }

  /**
   * Decrement reference count
   */
  releaseRef(id: string): number {
    const instance = this.documents.get(id);
    
    if (!instance) {
      return 0;
    }

    instance.refCount = Math.max(0, instance.refCount - 1);

    console.log(`📊 Document ${id} refs: ${instance.refCount}`);

    return instance.refCount;
  }

  /**
   * Update document state
   */
  setState(id: string, state: DocumentState): void {
    const instance = this.documents.get(id);
    
    if (!instance) {
      throw new DocumentError(
        DocumentErrorCode.NOT_FOUND,
        `Document not found: ${id}`,
        id
      );
    }

    instance.state = state;
    console.log(`🔄 Document ${id} state: ${state}`);
  }

  /**
   * Update document metadata
   */
  updateMetadata(id: string, metadata: Partial<DocumentMetadata>): void {
    const instance = this.documents.get(id);
    
    if (!instance) {
      throw new DocumentError(
        DocumentErrorCode.NOT_FOUND,
        `Document not found: ${id}`,
        id
      );
    }

    instance.metadata = {
      ...instance.metadata,
      ...metadata,
      updatedAt: Date.now(),
    };
  }

  /**
   * Unregister document
   */
  unregister(id: string): void {
    const instance = this.documents.get(id);
    
    if (!instance) {
      return;
    }

    // Destroy Yjs document
    instance.ydoc.destroy();

    // Remove from registry
    this.documents.delete(id);
    this.removeFromAccessOrder(id);

    console.log(`🗑️  Document unregistered: ${id}`);
  }

  /**
   * Get all registered documents
   */
  getAll(): DocumentInstance[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get all document IDs
   */
  getAllIds(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Get documents with zero references
   */
  getUnreferenced(): DocumentInstance[] {
    return Array.from(this.documents.values()).filter(
      (instance) => instance.refCount === 0
    );
  }

  /**
   * Get least recently used documents
   */
  getLRU(count: number): DocumentInstance[] {
    const sortedIds = [...this.accessOrder].reverse();
    return sortedIds
      .slice(0, count)
      .map((id) => this.documents.get(id))
      .filter((instance): instance is DocumentInstance => instance !== undefined);
  }

  /**
   * Track document access for LRU
   */
  private trackAccess(id: string): void {
    // Remove from current position
    this.removeFromAccessOrder(id);
    
    // Add to end (most recent)
    this.accessOrder.push(id);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(id: string): void {
    const index = this.accessOrder.indexOf(id);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const instances = Array.from(this.documents.values());
    
    return {
      total: instances.length,
      referenced: instances.filter((i) => i.refCount > 0).length,
      unreferenced: instances.filter((i) => i.refCount === 0).length,
      states: {
        loaded: instances.filter((i) => i.state === DocumentState.LOADED).length,
        loading: instances.filter((i) => i.state === DocumentState.LOADING).length,
        saving: instances.filter((i) => i.state === DocumentState.SAVING).length,
        error: instances.filter((i) => i.state === DocumentState.ERROR).length,
      },
      totalMemory: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let total = 0;
    
    for (const instance of this.documents.values()) {
      // Rough estimate: metadata + Yjs state size
      total += JSON.stringify(instance.metadata).length;
      total += Y.encodeStateAsUpdate(instance.ydoc).byteLength;
    }

    return total;
  }

  /**
   * Clear all documents (for testing)
   */
  clear(): void {
    for (const id of Array.from(this.documents.keys())) {
      this.unregister(id);
    }
    
    this.accessOrder = [];
    console.log('🗑️  Registry cleared');
  }
}

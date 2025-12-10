/**
 * OfflineWorkspaceService - Simple offline-aware wrapper
 * 
 * Strategy: Delegate everything to BackendWorkspaceService,
 * but intercept writes to add offline support
 */

import { BackendWorkspaceService, Document, Workspace } from '../workspace/BackendWorkspaceService';
import { offlineDB } from './OfflineDatabase';
import { syncManager } from './SyncManager';
import { v4 as uuidv4 } from 'uuid';

export class OfflineWorkspaceService {
  private backendService: BackendWorkspaceService;
  private isOnline: boolean = navigator.onLine;
  
  constructor(backendService: BackendWorkspaceService) {
    this.backendService = backendService;
    this.setupNetworkListeners();
    console.log('🔄 OfflineWorkspaceService initialized (wrapper mode)');
  }
  
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('✅ Back online');
      this.isOnline = true;
      syncManager.syncNow();
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.isOnline = false;
    });
  }
  
  // ==========================================================================
  // Pass-through methods (delegate to backend service)
  // ==========================================================================
  
  async init(): Promise<void> {
    return this.backendService.init();
  }
  
  async getAllWorkspaces(): Promise<Workspace[]> {
    return this.backendService.getAllWorkspaces();
  }
  
  async switchWorkspace(workspaceId: string): Promise<void> {
    return this.backendService.switchWorkspace(workspaceId);
  }
  
  async createWorkspace(data: { name: string; description: string; icon: string }): Promise<Workspace> {
    return this.backendService.createWorkspace(data);
  }
  
  getCurrentWorkspace(): Workspace {
    return this.backendService.getCurrentWorkspace();
  }
  
  getAllDocuments(): Document[] {
    return this.backendService.getAllDocuments();
  }
  
  getDocument(documentId: string): Document | undefined {
    return this.backendService.getDocument(documentId);
  }
  
  // ==========================================================================
  // Enhanced methods (with offline support)
  // ==========================================================================
  
  /**
   * Create document - Works offline!
   */
  async createDocument(
    type: Document['type'],
    title: string,
    content: string = '',
    folderId: string | null = null
  ): Promise<Document> {
    console.log(`🔵 OfflineWorkspaceService.createDocument() called, isOnline: ${this.isOnline}`);
    
    if (this.isOnline) {
      // Try online first
      try {
        console.log('🌐 Attempting to create document online...');
        const doc = await this.backendService.createDocument(type, title, content, folderId);
        // Success! Store in IndexedDB for offline access
        await this.cacheDocument(doc);
        console.log('✅ Document created online and cached');
        return doc;
      } catch (error) {
        console.warn('⚠️ Online create failed, falling back to offline:', error);
        // Fall through to offline mode
      }
    }
    
    // Offline mode: Create locally
    console.log('📴 Creating document offline...');
    const currentWorkspace = this.backendService.getCurrentWorkspace();
    if (!currentWorkspace) {
      console.error('❌ No workspace loaded!');
      throw new Error('No workspace loaded');
    }
    console.log(`✅ Current workspace: ${currentWorkspace.name} (${currentWorkspace.id})`);
    
    const tempId = uuidv4();
    const now = new Date();
    
    console.log(`📝 Creating document with temp ID: ${tempId}`);
    
    const doc: Document = {
      id: tempId,
      type,
      title,
      content,
      folderId,
      workspaceId: currentWorkspace.id,
      starred: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      metadata: { _offline: true, _tempId: tempId }
    };
    
    console.log('💾 Storing document in IndexedDB...');
    // Store in IndexedDB
    await offlineDB.documents.add({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      workspaceId: doc.workspaceId,
      folderId: doc.folderId,
      starred: doc.starred,
      tags: doc.tags || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      pending_changes: true,
      last_synced: null,
      remote_version: 0
    });
    console.log('✅ Stored in IndexedDB');
    
    console.log('📋 Queuing document for sync...');
    // Queue for sync
    await syncManager.queueChange({
      entity_type: 'document',
      entity_id: tempId,
      operation: 'create',
      data: { type, title, content, folderId, workspaceId: currentWorkspace.id },
      priority: 'high'
    });
    console.log('✅ Queued for sync');
    
    // Update backend service's in-memory state so it appears in getAllDocuments()
    const backendDocs = (this.backendService as any).documents;
    const beforeCount = backendDocs.length;
    backendDocs.push(doc);
    console.log(`📊 Updated backend service: ${beforeCount} → ${backendDocs.length} documents`);
    
    console.log('📴 Document created offline, queued for sync');
    return doc;
  }
  
  /**
   * Update document - Works offline!
   */
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    console.log(`🔄 OfflineWorkspaceService.updateDocument(${documentId})`, { 
      isOnline: this.isOnline,
      updates: Object.keys(updates)
    });
    
    // Update IndexedDB first (optimistic)
    try {
      const existing = await offlineDB.documents.get(documentId);
      if (existing) {
        console.log('💾 Updating IndexedDB...');
        const updateData: any = {
          updatedAt: new Date().toISOString(),
          pending_changes: true
        };
        
        // Add specific updates
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.content !== undefined) updateData.content = updates.content;
        if (updates.folderId !== undefined) updateData.folderId = updates.folderId;
        if (updates.starred !== undefined) updateData.starred = updates.starred;
        if (updates.tags !== undefined) updateData.tags = updates.tags;
        
        await offlineDB.documents.update(documentId, updateData);
        console.log('✅ IndexedDB updated');
      } else {
        console.warn('⚠️ Document not found in IndexedDB:', documentId);
      }
    } catch (err) {
      console.error('❌ Could not update IndexedDB:', err);
    }
    
    if (this.isOnline) {
      // Try to update backend immediately
      try {
        console.log('🌐 Attempting online update...');
        await this.backendService.updateDocument(documentId, updates);
        console.log('✅ Document updated online');
        return;
      } catch (error) {
        console.warn('⚠️ Online update failed, queuing for sync:', error);
        // Fall through to queue
      }
    }
    
    // Offline or failed: Queue for sync
    console.log('📋 Queuing update for sync...');
    await syncManager.queueChange({
      entity_type: 'document',
      entity_id: documentId,
      operation: 'update',
      data: updates,
      priority: 'normal'
    });
    
    console.log('📝 Document update queued for sync');
  }
  
  /**
   * Delete document - Works offline!
   */
  async deleteDocument(documentId: string): Promise<void> {
    // Mark as deleted in IndexedDB
    try {
      await offlineDB.documents.delete(documentId);
    } catch (err) {
      console.warn('Could not delete from IndexedDB:', err);
    }
    
    if (this.isOnline) {
      try {
        await this.backendService.deleteDocument(documentId);
        console.log('✅ Document deleted online');
        return;
      } catch (error) {
        console.warn('⚠️ Online delete failed, queuing for sync:', error);
      }
    }
    
    // Queue for sync
    await syncManager.queueChange({
      entity_type: 'document',
      entity_id: documentId,
      operation: 'delete',
      data: {},
      priority: 'normal'
    });
    
    console.log('🗑️ Document deletion queued for sync');
  }
  
  /**
   * Auto-save (debounced) - Override to use offline-aware update
   */
  autoSave(documentId: string, content: string, delay: number = 2000): void {
    // Use our own offline-aware update instead of backend service's
    if ((this as any).autoSaveTimeout) {
      clearTimeout((this as any).autoSaveTimeout);
    }
    
    (this as any).autoSaveTimeout = setTimeout(() => {
      this.updateDocument(documentId, { content }).catch(err => {
        console.error('❌ Auto-save failed:', err);
      });
    }, delay);
  }
  
  // ==========================================================================
  // Helper methods
  // ==========================================================================
  
  private async cacheDocument(doc: Document): Promise<void> {
    try {
      await offlineDB.documents.put({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        workspaceId: doc.workspaceId,
        folderId: doc.folderId,
        starred: doc.starred,
        tags: doc.tags || [],
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt.toISOString(),
        pending_changes: false,
        last_synced: new Date().toISOString(),
        remote_version: 1
      });
    } catch (error) {
      console.warn('Failed to cache document:', error);
    }
  }
}

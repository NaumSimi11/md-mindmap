/**
 * GuestVersionManager - Version history for guest mode (local-first)
 * 
 * 🔴 CRITICAL POINT #4: localStorage Limits
 * - localStorage has ~5-10MB limit per origin
 * - We store version METADATA in localStorage (small)
 * - We store version CONTENT in IndexedDB (large, ~50MB limit)
 * - If localStorage is full, version tracking fails gracefully
 * 
 * 🔴 CRITICAL POINT #5: Yjs Document Lifecycle
 * - Each version = separate Yjs doc in IndexedDB
 * - Format: {docId}-v{N} (e.g., "local-123-v2")
 * - Current version uses main docId (e.g., "local-123")
 * - MUST release Yjs docs after use to prevent memory leaks
 * 
 * 🔴 CRITICAL POINT #6: Version Number Consistency
 * - Version numbers are sequential (1, 2, 3...)
 * - NEVER skip version numbers
 * - NEVER reuse version numbers
 * - If version creation fails, rollback version number
 */

import * as Y from 'yjs';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { getContentHash } from '@/utils/content-hash';

export interface GuestVersion {
  versionNumber: number;
  yjsDocId: string;
  contentHash: string;
  createdAt: string;
  comment: string;
  wordCount: number;
}

export interface GuestDocumentVersions {
  documentId: string;
  currentVersion: number;
  versions: GuestVersion[];
}

class GuestVersionManager {
  private getStorageKey(documentId: string): string {
    return `mdreader:document-versions:${documentId}`;
  }

  /**
   * Get version history for a document
   * 
   * ⚠️ BREAKABLE POINT: localStorage access can throw
   * - User has disabled localStorage
   * - Private browsing mode
   * - Storage quota exceeded
   * Solution: Catch and return empty history
   */
  getVersions(documentId: string): GuestDocumentVersions {
    try {
      const key = this.getStorageKey(documentId);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return {
          documentId,
          currentVersion: 1,
          versions: []
        };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('❌ Failed to read version history:', error);
      // Return empty history on error
      return {
        documentId,
        currentVersion: 1,
        versions: []
      };
    }
  }

  /**
   * Save version history to localStorage
   * 
   * ⚠️ BREAKABLE POINT: localStorage.setItem can throw QuotaExceededError
   * Solution: Catch and log error, version tracking fails gracefully
   */
  private saveVersions(versions: GuestDocumentVersions): boolean {
    try {
      const key = this.getStorageKey(versions.documentId);
      localStorage.setItem(key, JSON.stringify(versions));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('❌ localStorage quota exceeded - cannot save version history');
      } else {
        console.error('❌ Failed to save version history:', error);
      }
      return false;
    }
  }

  /**
   * Create a new version from current content
   * 
   * 🔴 CRITICAL POINT #7: Transaction Atomicity
   * - Version creation involves 3 steps:
   *   1. Create Yjs doc with content
   *   2. Calculate content hash
   *   3. Save version metadata
   * - If any step fails, we must rollback
   * - Currently: Best-effort (logs error, doesn't rollback Yjs doc)
   * 
   * @param documentId - The document to version
   * @param content - The new content
   * @param comment - Optional comment describing changes
   * @returns New version number, or null if failed
   */
  async createVersion(
    documentId: string,
    content: string,
    comment: string = 'Imported from file'
  ): Promise<number | null> {
    try {
      const versions = this.getVersions(documentId);
      const newVersionNumber = versions.currentVersion + 1;
      const newYjsDocId = `${documentId}-v${newVersionNumber}`;
      
      
      // Step 1: Calculate content hash
      const contentHash = await getContentHash(content);
      
      // Step 2: Create new Yjs document for this version
      // ⚠️ BREAKABLE POINT: Dynamic import can fail
      const { initializeYjsWithMarkdown } = await import('@/utils/yjs-content-initializer');
      
      const instance = yjsDocumentManager.getDocument(newYjsDocId, {
        enableWebSocket: false,
        isAuthenticated: false
      });
      
      initializeYjsWithMarkdown(instance.ydoc, content);
      
      // ⚠️ IMPORTANT: Release the Yjs doc reference immediately
      // We don't need to keep it in memory - it's persisted to IndexedDB
      yjsDocumentManager.releaseDocument(newYjsDocId);
      
      // Step 3: Store version metadata
      const newVersion: GuestVersion = {
        versionNumber: newVersionNumber,
        yjsDocId: newYjsDocId,
        contentHash,
        createdAt: new Date().toISOString(),
        comment,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length
      };
      
      versions.versions.push(newVersion);
      versions.currentVersion = newVersionNumber;
      
      const saved = this.saveVersions(versions);
      
      if (!saved) {
        console.error('❌ Failed to save version metadata, but Yjs doc was created');
        // TODO: Consider rollback - delete the Yjs doc from IndexedDB
        return null;
      }
      
      return newVersionNumber;
    } catch (error) {
      console.error('❌ Failed to create version:', error);
      return null;
    }
  }

  /**
   * Check if content matches current version (skip duplicate imports)
   * 
   * 🔴 CRITICAL POINT #8: Hash Comparison Timing
   * - Hash calculation is async and can take 1-10ms for large docs
   * - Don't block UI thread
   * - Show loading state if needed
   * 
   * @returns true if content is identical to current version
   */
  async contentMatchesCurrentVersion(
    documentId: string,
    newContent: string
  ): Promise<boolean> {
    try {
      const versions = this.getVersions(documentId);
      
      if (versions.versions.length === 0) {
        return false; // No versions yet, can't match
      }
      
      const currentVersion = versions.versions[versions.versions.length - 1];
      const newHash = await getContentHash(newContent);
      
      const matches = currentVersion.contentHash === newHash;
      
      if (matches) {
        console.log(`✅ Content matches current version (${currentVersion.versionNumber})`);
      }
      
      return matches;
    } catch (error) {
      console.error('❌ Failed to compare content:', error);
      return false; // On error, assume content is different (safer)
    }
  }

  /**
   * Initialize version tracking for a new document
   * 
   * ⚠️ BREAKABLE POINT: Must be called when creating new document
   * If not called, first import will work, but subsequent imports won't detect duplicates
   */
  async initializeVersionTracking(
    documentId: string,
    initialContent: string,
    comment: string = 'Initial import'
  ): Promise<void> {
    try {
      const contentHash = await getContentHash(initialContent);
      
      const versions: GuestDocumentVersions = {
        documentId,
        currentVersion: 1,
        versions: [{
          versionNumber: 1,
          yjsDocId: documentId, // v1 uses main doc ID
          contentHash,
          createdAt: new Date().toISOString(),
          comment,
          wordCount: initialContent.split(/\s+/).filter(w => w.length > 0).length
        }]
      };
      
      this.saveVersions(versions);
    } catch (error) {
      console.error('❌ Failed to initialize version tracking:', error);
      // Non-fatal - document creation continues
    }
  }

  /**
   * Get content from a specific version
   * 
   * 🔴 CRITICAL POINT #9: Yjs Content Extraction
   * - Need to read from Yjs XmlFragment or Y.Text
   * - Current implementation reads from temp markdown field
   * - If temp field is empty, need to convert Yjs → markdown
   * 
   * ⚠️ TODO: Implement proper Yjs → markdown conversion
   */
  async getVersionContent(documentId: string, versionNumber: number): Promise<string | null> {
    try {
      const versions = this.getVersions(documentId);
      const version = versions.versions.find(v => v.versionNumber === versionNumber);
      
      if (!version) {
        console.error(`❌ Version ${versionNumber} not found`);
        return null;
      }
      
      // Get Yjs document for this version
      const instance = yjsDocumentManager.getDocument(version.yjsDocId, {
        enableWebSocket: false,
        isAuthenticated: false
      });
      
      // Try to read from temp markdown field first
      const initMarkdown = instance.ydoc.getText('_init_markdown');
      if (initMarkdown.length > 0) {
        const content = initMarkdown.toString();
        yjsDocumentManager.releaseDocument(version.yjsDocId);
        return content;
      }
      
      // TODO: If temp field is empty, convert from Yjs XmlFragment
      // For now, return placeholder
      console.warn('⚠️ Version content extraction from Yjs not fully implemented');
      yjsDocumentManager.releaseDocument(version.yjsDocId);
      return null;
    } catch (error) {
      console.error('❌ Failed to get version content:', error);
      return null;
    }
  }

  /**
   * Restore a version (replace current document content)
   * 
   * 🔴 CRITICAL POINT #10: Guest Mode Restore
   * - Loads content from version's Yjs doc
   * - Replaces current document's Yjs doc content
   * - Updates version tracking
   * 
   * @param documentId - The current document ID
   * @param versionNumber - The version to restore
   * @returns true if successful, false otherwise
   */
  async restoreVersion(documentId: string, versionNumber: number): Promise<boolean> {
    try {
      
      // Get version content
      const content = await this.getVersionContent(documentId, versionNumber);
      
      if (!content) {
        console.error('❌ Failed to load version content');
        return false;
      }
      
      // Get current document's Yjs instance
      const currentInstance = yjsDocumentManager.getDocument(documentId, {
        enableWebSocket: false,
        isAuthenticated: false
      });
      
      // Import markdown initializer
      const { initializeYjsWithMarkdown } = await import('@/utils/yjs-content-initializer');
      
      // Replace current document content with version content
      initializeYjsWithMarkdown(currentInstance.ydoc, content);
      
      // Create a new version entry for this restore
      const versions = this.getVersions(documentId);
      const newVersionNumber = versions.currentVersion + 1;
      const contentHash = await getContentHash(content);
      
      const restoreVersion: GuestVersion = {
        versionNumber: newVersionNumber,
        yjsDocId: documentId, // Current doc uses main ID
        contentHash,
        createdAt: new Date().toISOString(),
        comment: `Restored from version ${versionNumber}`,
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length
      };
      
      versions.versions.push(restoreVersion);
      versions.currentVersion = newVersionNumber;
      this.saveVersions(versions);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to restore version:', error);
      return false;
    }
  }

  /**
   * Restore a version as a new document (create copy)
   * 
   * @param documentId - The original document ID
   * @param versionNumber - The version to restore
   * @param newDocumentId - The ID for the new document
   * @returns true if successful, false otherwise
   */
  async restoreVersionAsNew(
    documentId: string,
    versionNumber: number,
    newDocumentId: string
  ): Promise<boolean> {
    try {
      
      // Get version content
      const content = await this.getVersionContent(documentId, versionNumber);
      
      if (!content) {
        console.error('❌ Failed to load version content');
        return false;
      }
      
      // Create new Yjs document
      const { initializeYjsWithMarkdown } = await import('@/utils/yjs-content-initializer');
      
      const newInstance = yjsDocumentManager.getDocument(newDocumentId, {
        enableWebSocket: false,
        isAuthenticated: false
      });
      
      initializeYjsWithMarkdown(newInstance.ydoc, content);
      
      // Initialize version tracking for new document
      await this.initializeVersionTracking(
        newDocumentId,
        content,
        `Restored from version ${versionNumber}`
      );
      
      // Release the document reference
      yjsDocumentManager.releaseDocument(newDocumentId);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to restore version as new:', error);
      return false;
    }
  }

  /**
   * Delete all versions for a document (cleanup)
   * 
   * ⚠️ BREAKABLE POINT: Must be called when deleting document
   * If not called, orphaned Yjs docs remain in IndexedDB
   */
  async deleteAllVersions(documentId: string): Promise<void> {
    try {
      const versions = this.getVersions(documentId);
      
      // Delete all Yjs docs for this document's versions
      for (const version of versions.versions) {
        try {
          // Use yjsDocumentManager to properly clean up
          const instance = yjsDocumentManager.getDocument(version.yjsDocId, {
            enableWebSocket: false,
            isAuthenticated: false
          });
          
          // Destroy the Yjs document
          instance.ydoc.destroy();
          
          // Release from manager
          yjsDocumentManager.releaseDocument(version.yjsDocId);
          
        } catch (error) {
          console.warn(`⚠️ Failed to delete Yjs doc ${version.yjsDocId}:`, error);
        }
      }
      
      // Delete version metadata from localStorage
      const key = this.getStorageKey(documentId);
      localStorage.removeItem(key);
      
    } catch (error) {
      console.error('❌ Failed to delete version history:', error);
    }
  }
}

export const guestVersionManager = new GuestVersionManager();

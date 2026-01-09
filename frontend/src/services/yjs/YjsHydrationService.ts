/**
 * Yjs Hydration Service
 * =====================
 * 
 * Pure service for hydrating Yjs documents on cold load.
 * NO React dependencies, NO context, just pure Yjs operations.
 * 
 * CRITICAL RULES:
 * - Only hydrate when fragment.length === 0
 * - Never hydrate while HocuspocusProvider is active
 * - Priority: Yjs Binary > Markdown Cache
 * - Hydration is ONE-TIME ONLY per document load
 */

import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';
import { markdownToHtml } from '@/utils/markdownConversion';
import { yjsDocumentManager } from './YjsDocumentManager';

export class YjsHydrationService {
  /**
   * Hydrate Yjs document from stored state
   * 
   * @param documentId - Document ID
   * @param markdown - Markdown content (fallback)
   * @param yjsStateB64 - Base64-encoded Yjs binary state (preferred)
   * @param isAuthenticated - Whether user is authenticated (for WebSocket)
   * 
   * @throws Never throws - logs errors instead
   * 
   * Priority:
   * 1. Yjs binary state (authoritative CRDT truth)
   * 2. Markdown content (legacy fallback)
   * 3. Empty document (no content)
   */
  async hydrateDocument(
    documentId: string,
    markdown: string,
    yjsStateB64?: string,
    isAuthenticated: boolean = false
  ): Promise<void> {
    try {
      // 🔥 FIX: Normalize document ID (same as useYjsDocument.ts)
      // This ensures hydration uses the SAME Yjs instance as TipTap editor
      const normalizedDocId = documentId.startsWith('doc_') 
        ? documentId.slice(4)  // Remove doc_ prefix
        : documentId;
      
      if (normalizedDocId !== documentId) {
      }
      
      // 1. Get Yjs document from manager (using normalized ID)
      const instance = yjsDocumentManager.getDocument(normalizedDocId, {
        enableWebSocket: false,
        isAuthenticated,
      });
      
      const { ydoc, indexeddbProvider } = instance as any;
      
      // 🛡️ CRITICAL INVARIANT: Never apply snapshots while HocuspocusProvider is active
      // Applying updates during live sync can corrupt the CRDT state
      if (instance.websocketProvider) {
        console.warn('⚠️ [YjsHydration] Skipping - provider active:', normalizedDocId);
        console.warn('   📖 Rule: Snapshots are WRITE-ONLY during live collaboration');
        return;
      }

      // 2. THE HYDRATION GATE
      //    CRITICAL: Always wait for IndexedDB to sync BEFORE checking fragment state.
      //    Otherwise we might think the doc is empty when it actually has content in IndexedDB.
      //    This is essential for:
      //    - Paste persistence (content in IndexedDB, not yjsStateB64)
      //    - Import (content written to _init_markdown before navigation)
      //    - Refresh (content already persisted to IndexedDB)
      
      // Wait for IndexedDB sync FIRST (with timeout for new docs)
      if (indexeddbProvider && !instance.isInitialized) {
        await new Promise<void>((resolve) => {
          const handler = () => {
            indexeddbProvider.off('synced', handler);
            resolve();
          };
          indexeddbProvider.on('synced', handler);
          
          // Short timeout for new documents (IndexedDB might be empty)
          setTimeout(() => {
            indexeddbProvider.off('synced', handler);
            resolve();
          }, 500);
        });
      }
      
      // NOW check fragment state (after IndexedDB has loaded)
      const fragment = ydoc.getXmlFragment('content');
      const isFragmentPopulated = fragment.length > 0;
      
      // If fragment has content, skip hydration (content already loaded from IndexedDB)
      if (isFragmentPopulated) {
        return;
      }
      
      // Also check _init_markdown (might have been written by import)
      const initMarkdown = ydoc.getText('_init_markdown');
      if (initMarkdown.length > 0) {
        return;
      }
      
      // 3. APPLY YJS BINARY (AUTHORITATIVE)
      if (yjsStateB64) {
        try {
          const binary = buffer.fromBase64(yjsStateB64);
          Y.applyUpdate(ydoc, binary, 'initial-hydration');
          return; // ✅ ENFORCED: Do not fall back to markdown if binary exists
        } catch (error) {
          console.warn('⚠️ [YjsHydration] Binary failed, falling back to markdown:', error);
          // Fall through to markdown only on error
        }
      }
      
      // 4. FALLBACK TO MARKDOWN
      if (!markdown) {
        return;
      }
      
      // Validate invariant
      if (process.env.NODE_ENV === 'development') {
        if (yjsStateB64) {
          console.error('❌ [INVARIANT] Markdown hydration on binary-authoritative doc');
        }
      }

      
      // Step 1: Convert Markdown → HTML
      const html = markdownToHtml(markdown);
    
      // Step 2: Store in _init_markdown for TipTap to pick up
      ydoc.transact(() => {
        const tempText = ydoc.getText('_init_markdown');
        if (tempText.length > 0) {
          tempText.delete(0, tempText.length);
        }
        tempText.insert(0, html);
      });
      
      // Verify the write
      const verifyText = ydoc.getText('_init_markdown');
    } catch (error) {
      console.error('❌ [YjsHydration] Failed:', error);
    }
  }

  /**
   * Snapshot current Yjs state vector (minimal provenance) before reload.
   * Stores snapshot in localStorage with metadata for debugging.
   */
  async snapshotBeforeReload(
    documentId: string,
    opts: { reason: string; filePath: string; timestamp?: number }
  ): Promise<void> {
    try {
      const info = yjsDocumentManager.getDocumentInfo(documentId);
      const ts = opts.timestamp || Date.now();
      
      if (!info) {
        console.warn('⚠️ [Snapshot] No ydoc for', documentId);
        // Still log provenance
        const meta = { 
          documentId, 
          timestamp: ts, 
          reason: opts.reason, 
          filePath: opts.filePath, 
          vector: null 
        };
        localStorage.setItem(`mdreader:snapshot:${documentId}:${ts}`, JSON.stringify(meta));
        return;
      }

      // Encode state vector
      const stateVector = Y.encodeStateVector(info.ydoc);
      
      // Base64 encode for storage
      const base64 = typeof window !== 'undefined' 
        ? btoa(String.fromCharCode(...Array.from(stateVector))) 
        : Buffer.from(stateVector).toString('base64');

      const meta = {
        documentId,
        timestamp: ts,
        reason: opts.reason,
        filePath: opts.filePath,
        vector: base64,
      };

      // Persist to localStorage
      try {
        localStorage.setItem(`mdreader:snapshot:${documentId}:${ts}`, JSON.stringify(meta));
      } catch (e) {
        console.warn('⚠️ [Snapshot] Failed to persist to localStorage', e);
      }

    
    } catch (err) {
      console.error('❌ [Snapshot] Failed:', err);
    }
  }
}

// Export singleton
export const yjsHydrationService = new YjsHydrationService();


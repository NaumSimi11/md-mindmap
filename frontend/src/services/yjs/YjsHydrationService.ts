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
        console.log(`🔄 [YjsHydration] Normalized ID: ${documentId} → ${normalizedDocId}`);
      }
      
      // 1. Get Yjs document from manager (using normalized ID)
      const instance = yjsDocumentManager.getDocument(normalizedDocId, {
        enableWebSocket: false,
        isAuthenticated,
      });
      
      const { ydoc, indexeddbProvider } = instance as any;
      
      // 2. THE HYDRATION GATE (ONLY ALLOWED CHECK)
      //    IMPORTANT: Wait for IndexedDB to finish loading BEFORE checking content.
      //    Otherwise we might think the document is empty and overwrite real CRDT state
      //    with stale markdown from IndexedDB/guest metadata (which is exactly what
      //    caused the offline persistence invariant to fail).
      
      // 🛡️ CRITICAL INVARIANT: Never apply snapshots while HocuspocusProvider is active
      // Applying updates during live sync can corrupt the CRDT state
      if (instance.websocketProvider) {
        console.warn('⚠️ [YjsHydration] Skipping - provider active:', normalizedDocId);
        console.warn('   📖 Rule: Snapshots are WRITE-ONLY during live collaboration');
        return;
      }

      // If there is an IndexedDB provider and it hasn't finished syncing yet,
      // wait for its "synced" event once before making any decisions about
      // whether this document is "empty" or not.
      if (indexeddbProvider && !instance.isInitialized) {
        await new Promise<void>((resolve) => {
          const handler = () => {
            indexeddbProvider.off('synced', handler);
            resolve();
          };
          indexeddbProvider.on('synced', handler);
        });
      }

      // After IndexedDB sync, re-check the fragment state
      const fragment = ydoc.getXmlFragment('content');
      const isFragmentPopulated = fragment.length > 0;
      
      // Validate invariants in development
      if (process.env.NODE_ENV === 'development') {
        if (yjsStateB64 && isFragmentPopulated) {
          console.error('❌ [INVARIANT] Attempted to hydrate from binary on non-empty doc!');
        }
      }
      
      if (isFragmentPopulated) {
        console.log('ℹ️ [YjsHydration] Document already has content after IndexedDB sync, skipping hydrate:', normalizedDocId);
        return;
      }

      // 3. APPLY YJS BINARY (AUTHORITATIVE)
      if (yjsStateB64) {
        console.log('🧬 [YjsHydration] Binary truth:', normalizedDocId, `(${yjsStateB64.length} chars b64)`);
        try {
          const binary = buffer.fromBase64(yjsStateB64);
          Y.applyUpdate(ydoc, binary, 'initial-hydration');
          console.log('✅ [YjsHydration] Binary applied successfully');
          return; // ✅ ENFORCED: Do not fall back to markdown if binary exists
        } catch (error) {
          console.warn('⚠️ [YjsHydration] Binary failed, falling back to markdown:', error);
          // Fall through to markdown only on error
        }
      }
      
      // 4. FALLBACK TO MARKDOWN
      if (!markdown) {
        console.log('ℹ️ [YjsHydration] No content to hydrate:', normalizedDocId);
        return;
      }
      
      // Validate invariant
      if (process.env.NODE_ENV === 'development') {
        if (yjsStateB64) {
          console.error('❌ [INVARIANT] Markdown hydration on binary-authoritative doc');
        }
      }

      console.log('🧬 [YjsHydration] [LEGACY] From markdown:', normalizedDocId, `(${markdown.length} chars)`);
      
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
      
      console.log('✅ [YjsHydration] Markdown applied successfully');
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
        console.log('🔖 [Snapshot] Recorded (no ydoc):', meta);
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

      console.log('🔖 [Snapshot] Recorded:', { 
        documentId, 
        timestamp: ts, 
        reason: opts.reason, 
        filePath: opts.filePath 
      });
    } catch (err) {
      console.error('❌ [Snapshot] Failed:', err);
    }
  }
}

// Export singleton
export const yjsHydrationService = new YjsHydrationService();


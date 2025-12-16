/**
 * STEP 5: Yjs → Snapshot Serialization
 * 
 * CRITICAL RULES:
 * - Reads ONLY from Yjs (never TipTap)
 * - Pure functions (no side effects)
 * - Supports binary (recommended) and HTML (optional) formats
 */

import * as Y from 'yjs';

/**
 * OPTION A: Yjs Binary Snapshot (RECOMMENDED)
 * 
 * Serializes the entire Yjs document state as a binary blob.
 * This is the CRDT-native format - best for restore and collaboration.
 */
export function serializeYjsBinary(ydoc: Y.Doc): Uint8Array {
  // Encode the entire Yjs document state
  const state = Y.encodeStateAsUpdate(ydoc);
  return state;
}

/**
 * Convert Uint8Array to base64 for JSON transport
 */
export function binaryToBase64(binary: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(binary)));
}

/**
 * Convert base64 back to Uint8Array for restore
 */
export function base64ToBinary(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * OPTION B: HTML Snapshot (OPTIONAL, SECONDARY)
 * 
 * Extracts HTML from Yjs XmlFragment for preview/search/export.
 * ⚠️ NEVER use for rehydration during collaboration.
 */
export function serializeYjsToHtml(ydoc: Y.Doc): string | null {
  try {
    const fragment = ydoc.getXmlFragment('content');
    
    if (fragment.length === 0) {
      return null; // Empty document
    }
    
    // Convert XmlFragment to HTML string
    // This is a simplified extraction - TipTap's Collaboration extension
    // handles the complex ProseMirror ↔ Yjs mapping
    const html = xmlFragmentToHtml(fragment);
    return html;
  } catch (error) {
    console.error('❌ Failed to serialize Yjs to HTML:', error);
    return null;
  }
}

/**
 * Helper: Convert Yjs XmlFragment to HTML
 * This is a basic implementation - for production, use TipTap's utilities
 */
function xmlFragmentToHtml(fragment: Y.XmlFragment): string {
  // For now, we'll extract text content
  // In production, this would need proper ProseMirror → HTML serialization
  let html = '';
  
  fragment.forEach((item) => {
    if (item instanceof Y.XmlText) {
      html += item.toString();
    } else if (item instanceof Y.XmlElement) {
      const tagName = item.nodeName || 'p';
      html += `<${tagName}>${xmlElementToHtml(item)}</${tagName}>`;
    }
  });
  
  return html || '<p></p>';
}

function xmlElementToHtml(element: Y.XmlElement): string {
  let html = '';
  
  element.forEach((item) => {
    if (item instanceof Y.XmlText) {
      html += item.toString();
    } else if (item instanceof Y.XmlElement) {
      const tagName = item.nodeName || 'span';
      html += `<${tagName}>${xmlElementToHtml(item)}</${tagName}>`;
    }
  });
  
  return html;
}

/**
 * Create snapshot payload (ready for backend)
 */
export interface SnapshotPayload {
  documentId: string;
  yjsState: string; // base64-encoded binary
  html?: string; // optional, for preview/search
  updatedAt: number; // timestamp
}

export function createSnapshotPayload(
  documentId: string,
  ydoc: Y.Doc,
  includeHtml: boolean = false
): SnapshotPayload {
  const binary = serializeYjsBinary(ydoc);
  const base64 = binaryToBase64(binary);
  
  const payload: SnapshotPayload = {
    documentId,
    yjsState: base64,
    updatedAt: Date.now(),
  };
  
  if (includeHtml) {
    const html = serializeYjsToHtml(ydoc);
    if (html) {
      payload.html = html;
    }
  }
  
  return payload;
}


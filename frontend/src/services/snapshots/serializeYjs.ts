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
 * Map TipTap/ProseMirror node names to HTML tags
 * TipTap uses semantic node names that need conversion to proper HTML
 */
function getHtmlTag(nodeName: string, element?: Y.XmlElement): string {
  switch (nodeName) {
    case 'heading': {
      // TipTap stores heading level as attribute
      const level = element?.getAttribute('level') || 1;
      return `h${level}`;
    }
    case 'paragraph':
      return 'p';
    case 'bulletList':
      return 'ul';
    case 'orderedList':
      return 'ol';
    case 'listItem':
      return 'li';
    case 'codeBlock':
      return 'pre';
    case 'blockquote':
      return 'blockquote';
    case 'hardBreak':
      return 'br';
    case 'horizontalRule':
      return 'hr';
    case 'bold':
    case 'strong':
      return 'strong';
    case 'italic':
    case 'em':
      return 'em';
    case 'code':
      return 'code';
    case 'link':
      return 'a';
    case 'strike':
      return 's';
    case 'underline':
      return 'u';
    case 'taskList':
      return 'ul';
    case 'taskItem':
      return 'li';
    case 'table':
      return 'table';
    case 'tableRow':
      return 'tr';
    case 'tableCell':
      return 'td';
    case 'tableHeader':
      return 'th';
    default:
      // If it's already an HTML tag name (like 'p', 'div'), use it directly
      if (['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'pre', 'code', 'blockquote', 'a', 'strong', 'em', 'br', 'hr'].includes(nodeName)) {
        return nodeName;
      }
      return 'p'; // Default fallback
  }
}

/**
 * Helper: Convert Yjs XmlFragment to HTML
 * Maps TipTap/ProseMirror nodes to proper HTML tags
 */
function xmlFragmentToHtml(fragment: Y.XmlFragment): string {
  let html = '';
  
  fragment.forEach((item) => {
    if (item instanceof Y.XmlText) {
      html += item.toString();
    } else if (item instanceof Y.XmlElement) {
      const nodeName = item.nodeName || 'p';
      const tagName = getHtmlTag(nodeName, item);
      
      // Handle self-closing tags
      if (tagName === 'br' || tagName === 'hr') {
        html += `<${tagName}/>`;
      } else {
        html += `<${tagName}>${xmlElementToHtml(item)}</${tagName}>`;
      }
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
      const nodeName = item.nodeName || 'span';
      const tagName = getHtmlTag(nodeName, item);
      
      // Handle self-closing tags
      if (tagName === 'br' || tagName === 'hr') {
        html += `<${tagName}/>`;
      } else {
        html += `<${tagName}>${xmlElementToHtml(item)}</${tagName}>`;
      }
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


/**
 * Yjs Content Initializer
 * 
 * SIMPLIFIED APPROACH: Store markdown in Yjs, let TipTap parse it.
 * 
 * The "expert" approach of manually parsing ProseMirror nodes is fragile because:
 * 1. Schema mismatches (basic schema vs. full TipTap extensions)
 * 2. Complex markdown (tables, task lists) fails to parse
 * 3. Maintenance burden (must keep schema in sync)
 * 
 * BETTER: Store markdown as Y.Text, let TipTap's setContent() handle parsing.
 */

import * as Y from 'yjs';

/**
 * Initialize a Yjs document with markdown content.
 * 
 * SIMPLIFIED FLOW:
 * 1. Store markdown in a temporary Yjs field
 * 2. TipTap editor reads this field on mount
 * 3. TipTap's setContent() parses markdown → ProseMirror
 * 4. Collaboration extension syncs to Yjs 'content' field
 * 
 * This is MORE RELIABLE than manual ProseMirror parsing.
 * 
 * @param ydoc - The Yjs document to initialize
 * @param markdownContent - The markdown content to insert
 * @param tempFieldName - Temporary field name for markdown storage
 */
export function initializeYjsWithMarkdown(
  ydoc: Y.Doc,
  markdownContent: string,
  tempFieldName: string = '_init_markdown'
): void {
  if (!markdownContent || !markdownContent.trim()) {
    console.log('⚠️ No content to initialize');
    return;
  }

  console.log(`🔧 Storing markdown in Yjs temp field (${markdownContent.length} chars)`);

  // Store markdown in a Y.Text field
  const ytext = ydoc.getText(tempFieldName);
  
  ydoc.transact(() => {
    // Clear existing content
    if (ytext.length > 0) {
      ytext.delete(0, ytext.length);
    }
    // Insert markdown
    ytext.insert(0, markdownContent);
  });

  console.log('✅ Markdown stored in Yjs, TipTap will parse it on mount');
}


/**
 * Check if a Yjs document is empty (has no content).
 */
export function isYjsDocumentEmpty(ydoc: Y.Doc, fieldName: string = 'content'): boolean {
  const fragment = ydoc.getXmlFragment(fieldName);
  return fragment.length === 0;
}

/**
 * Get the text content from a Yjs document (for debugging).
 */
export function getYjsTextContent(ydoc: Y.Doc, fieldName: string = 'content'): string {
  const fragment = ydoc.getXmlFragment(fieldName);
  return fragment.toString();
}

/**
 * SIMPLER APPROACH: Let TipTap do the parsing
 * 
 * Instead of manually converting ProseMirror nodes, we can store the HTML
 * in a temporary Yjs field and let TipTap's setContent() do the work.
 * 
 * This is more maintainable and works with TipTap's schema.
 */
export function initializeYjsWithHtml(
  ydoc: Y.Doc,
  html: string,
  tempFieldName: string = '_init_html'
): void {
  console.log(`🔧 Storing HTML in Yjs temp field for TipTap to parse (${html.length} chars)`);

  const ytext = ydoc.getText(tempFieldName);
  
  ydoc.transact(() => {
    if (ytext.length > 0) {
      ytext.delete(0, ytext.length);
    }
    ytext.insert(0, html);
  });

  console.log('✅ HTML stored in Yjs, TipTap will parse it');
}


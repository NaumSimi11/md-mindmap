/**
 * TipTap Editor Extensions Configuration
 * 
 * Central place to configure all editor extensions
 */

// StarterKit replaced with individual extensions to avoid history conflicts
// import StarterKit from '@tiptap/starter-kit';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Heading } from '@tiptap/extension-heading';
import { Blockquote } from '@tiptap/extension-blockquote';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Document } from '@tiptap/extension-document';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';

// Custom extensions
import { InlinePreviewExtension } from '@/extensions/InlinePreviewExtension';
import { CommentExtension } from '@/extensions/CommentExtension';
import { MermaidNode } from './extensions/MermaidNode';
import type * as Y from 'yjs';

interface GetExtensionsOptions {
  setShowDiagramMenu: (show: boolean) => void;
  setShowAIModal: (show: boolean) => void;
  setShowTableModal: (show: boolean) => void;
  aiHintsEnabledRef: any;
  aiAutocompleteEnabled: boolean;
  ydoc?: Y.Doc;  // 🔥 NEW: Yjs document
  provider?: any;  // 🔥 NEW: WebSocket provider
}

export function getExtensions(options: GetExtensionsOptions) {
  const { ydoc, provider } = options;
  
  // 🔥 NUCLEAR FIX: Manually include StarterKit extensions WITHOUT History
  // This guarantees no history/undo-redo extension conflicts with Yjs Collaboration
  const baseExtensions = [
    // Core StarterKit extensions (manually added to EXCLUDE History)
    Document,
    Paragraph,
    Text,
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    Bold,
    Italic,
    Strike,
    Code,
    CodeBlock,
    Blockquote,
    BulletList,
    OrderedList,
    ListItem,
    HorizontalRule,
    HardBreak,
    Dropcursor,
    Gapcursor,
    // ❌ History extension explicitly NOT included - Yjs provides undo/redo
    // ❌ Link extension explicitly NOT included - we add custom version below
    // ❌ Underline extension explicitly NOT included - we add custom version below
    
    // ✅ Custom extensions (no duplicates, no history conflicts)
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
    Underline,
    
    // Formatting
    Highlight.configure({ multicolor: true }),
    TextStyle,
    FontFamily,
    Subscript,
    Superscript,
    
    // Images
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg',
      },
    }),
    
    // Tables
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'table-auto border-collapse',
      },
    }),
    TableRow,
    TableCell,
    TableHeader,
    
    // Task lists (checkboxes)
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
    
    // Placeholder
    Placeholder.configure({
      placeholder: 'Start writing or press "/" for commands...',
    }),
    
    // 🎯 Inline Preview Extension (NEW!)
    InlinePreviewExtension,
    
    // 💬 Comment Extension (NEW!)
    CommentExtension,
    
    // 📊 Mermaid Diagram Extension
    MermaidNode,
  ];

  // 🔥 STEP 3: Enable Yjs Collaboration (MANDATORY if ydoc exists)
  // Note: ydoc may be undefined initially (during Yjs loading), then defined on re-init
  if (ydoc) {
    console.log('✅ [STEP 3] Yjs Collaboration enabled');
    
    // ✅ MANDATORY: Bind TipTap to Yjs document
    baseExtensions.push(
      Collaboration.configure({
        document: ydoc,
        field: 'content',
      })
    );
    
    // ✅ OPTIONAL: Add collaboration cursors if WebSocket provider available
    if (provider) {
      console.log('✅ [STEP 3] Collaboration cursors enabled (WebSocket available)');
      baseExtensions.push(
        CollaborationCaret.configure({
          provider,
          user: {
            name: 'User',
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
          },
        })
      );
    } else {
      console.log('ℹ️ [STEP 3] WebSocket not available - local-first mode only');
    }
  }
  // Note: No warning logged when ydoc is undefined - this is expected during initial mount
  
  return baseExtensions;
}


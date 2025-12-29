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
  // 🔥 NEW: User info for collaboration cursors
  currentUser?: {
    name: string;
    color: string;
  };
}

export function getExtensions(options: GetExtensionsOptions) {
  const { ydoc, provider, currentUser } = options;
  
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
      // Use provided user info or generate defaults
      const userName = currentUser?.name || 'Anonymous';
      const userColor = currentUser?.color || generateUserColor(userName);
      
      console.log('✅ [STEP 3] Collaboration cursors enabled:', { userName, userColor });
      baseExtensions.push(
        CollaborationCaret.configure({
          provider,
          user: {
            name: userName,
            color: userColor,
          },
          // 🔥 Custom render: Avatar circle with initials at cursor position
          render: (user: { name: string; color: string }) => {
            console.log('🎨 [Collaboration] Rendering cursor for:', user);
            
            // Create cursor container (matches TipTap's default class names)
            const cursor = document.createElement('span');
            cursor.classList.add('collaboration-carets__caret');
            cursor.setAttribute('style', `border-color: ${user.color}`);
            
            // Create avatar circle with initials (instead of just a label)
            const avatar = document.createElement('div');
            avatar.classList.add('collaboration-cursor__avatar');
            avatar.setAttribute('style', `background-color: ${user.color}`);
            
            // Get initials
            const initials = getInitials(user.name);
            avatar.textContent = initials;
            
            // Add tooltip with full name on hover
            avatar.setAttribute('data-tooltip', user.name);
            avatar.title = user.name;
            
            cursor.appendChild(avatar);
            
            return cursor;
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

/**
 * Get initials from a name (e.g., "John Doe" → "JD", "ljubo" → "LJ")
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  // Single word - take first 1-2 chars
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent color from a string (user name/id)
 * Same name always gets the same color
 */
function generateUserColor(str: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}


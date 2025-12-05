/**
 * TipTap Editor Extensions Configuration
 * 
 * Central place to configure all editor extensions
 */

import StarterKit from '@tiptap/starter-kit';
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

// Custom extensions
import { InlinePreviewExtension } from '@/extensions/InlinePreviewExtension';
import { CommentExtension } from '@/extensions/CommentExtension';

interface GetExtensionsOptions {
  setShowDiagramMenu: (show: boolean) => void;
  setShowAIModal: (show: boolean) => void;
  setShowTableModal: (show: boolean) => void;
  aiHintsEnabledRef: any;
  aiAutocompleteEnabled: boolean;
}

export function getExtensions(options: GetExtensionsOptions) {
  return [
    // Core extensions
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    
    // Formatting
    Underline,
    Highlight.configure({ multicolor: true }),
    TextStyle,
    FontFamily,
    Subscript,
    Superscript,
    
    // Links & Images
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 hover:text-blue-800 underline',
      },
    }),
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
  ];
}


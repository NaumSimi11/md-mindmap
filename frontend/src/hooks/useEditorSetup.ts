import { useEditor, Extensions } from '@tiptap/react';
import { useMemo } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { FontSize } from '@/components/editor/extensions/FontSizeExtension';
import { MermaidNode } from '@/components/editor/extensions/MermaidNode';
import { CalloutNode } from '@/components/editor/extensions/CalloutNode';
import { YouTubeNode } from '@/components/editor/extensions/YouTubeNode';
import { VimeoNode } from '@/components/editor/extensions/VimeoNode';
import { PDFNode } from '@/components/editor/extensions/PDFNode';
import { GistNode } from '@/components/editor/extensions/GistNode';
import { EnhancedBlockquote } from '@/components/editor/extensions/EnhancedBlockquote';
import { FootnoteReference, FootnoteDefinition, FootnotesSection } from '@/components/editor/extensions/FootnoteExtension';
import { TOCNode } from '@/components/editor/extensions/TOCNode';
import { ResizableImageNodeView } from '@/components/editor/extensions/ResizableImageNodeView';
import { ReactNodeViewRenderer } from '@tiptap/react';

interface EditorSetupOptions {
  content: string;
  onUpdate?: (html: string) => void;
  onSelectionUpdate?: (selection: any) => void;
  editable?: boolean;
  autofocus?: boolean;
  placeholder?: string;
  enableSlashCommands?: boolean;
  enableAIAutocomplete?: boolean;
}

export function useEditorSetup(options: EditorSetupOptions) {
  const {
    content,
    onUpdate,
    onSelectionUpdate,
    editable = true,
    autofocus = false,
    placeholder = 'Start writing...',
  } = options;

  const extensions: Extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Placeholder.configure({ 
      placeholder 
    }),
    Table.configure({ 
      resizable: true 
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Image,
    Link.configure({ 
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
      },
    }),
    TextStyle,
    FontFamily,
    FontSize,
    Highlight.configure({
      multicolor: true,
    }),
    Underline,
    Superscript,
    Subscript,
    // Custom nodes
    MermaidNode,
    CalloutNode,
    YouTubeNode,
    VimeoNode,
    PDFNode,
    GistNode,
    EnhancedBlockquote,
    FootnoteReference,
    FootnoteDefinition,
    FootnotesSection,
    TOCNode.configure({
      onUpdate: () => {
        // TOC auto-updates when headings change
      },
    }),
    Image.extend({
      addNodeView() {
        return ReactNodeViewRenderer(ResizableImageNodeView);
      },
    }),
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content,
    editable,
    autofocus,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-screen p-8',
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelectionUpdate) {
        onSelectionUpdate(editor.state.selection);
      }
    },
  });

  return editor;
}


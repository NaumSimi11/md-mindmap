import { useMemo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Underline,
  Highlighter,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEditorUIStore } from '@/stores/editorUIStore';

export interface ToolbarAction {
  icon: LucideIcon;
  label: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shortcut?: string;
}

export function useEditorToolbar(editor: Editor | null) {
  const { setShowLinkModal, setShowImageModal } = useEditorUIStore();

  const formatActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];

    return [
      {
        icon: Bold,
        label: 'Bold',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
        shortcut: '⌘B',
      },
      {
        icon: Italic,
        label: 'Italic',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive('italic'),
        shortcut: '⌘I',
      },
      {
        icon: Underline,
        label: 'Underline',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive('underline'),
        shortcut: '⌘U',
      },
      {
        icon: Strikethrough,
        label: 'Strikethrough',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive('strike'),
        shortcut: '⌘⇧X',
      },
      {
        icon: Code,
        label: 'Code',
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive('code'),
        shortcut: '⌘E',
      },
      {
        icon: Highlighter,
        label: 'Highlight',
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: editor.isActive('highlight'),
      },
      {
        icon: Superscript,
        label: 'Superscript',
        action: () => editor.chain().focus().toggleSuperscript().run(),
        isActive: editor.isActive('superscript'),
      },
      {
        icon: Subscript,
        label: 'Subscript',
        action: () => editor.chain().focus().toggleSubscript().run(),
        isActive: editor.isActive('subscript'),
      },
    ];
  }, [editor]);

  const headingActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];

    return [
      {
        icon: Heading1,
        label: 'Heading 1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive('heading', { level: 1 }),
        shortcut: '⌘⌥1',
      },
      {
        icon: Heading2,
        label: 'Heading 2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive('heading', { level: 2 }),
        shortcut: '⌘⌥2',
      },
      {
        icon: Heading3,
        label: 'Heading 3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive('heading', { level: 3 }),
        shortcut: '⌘⌥3',
      },
    ];
  }, [editor]);

  const listActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];

    return [
      {
        icon: List,
        label: 'Bullet List',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive('bulletList'),
        shortcut: '⌘⇧8',
      },
      {
        icon: ListOrdered,
        label: 'Numbered List',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive('orderedList'),
        shortcut: '⌘⇧7',
      },
      {
        icon: ListTodo,
        label: 'Task List',
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: editor.isActive('taskList'),
        shortcut: '⌘⇧9',
      },
    ];
  }, [editor]);

  const insertActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];

    return [
      {
        icon: Quote,
        label: 'Blockquote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive('blockquote'),
        shortcut: '⌘⇧B',
      },
      {
        icon: Minus,
        label: 'Horizontal Rule',
        action: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: false,
      },
      {
        icon: LinkIcon,
        label: 'Link',
        action: () => {
          setShowLinkModal(true);
        },
        isActive: editor.isActive('link'),
        shortcut: '⌘K',
      },
      {
        icon: ImageIcon,
        label: 'Image',
        action: () => {
          setShowImageModal(true);
        },
        isActive: false,
      },
      {
        icon: TableIcon,
        label: 'Table',
        action: () => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
        isActive: editor.isActive('table'),
      },
    ];
  }, [editor]);

  const alignActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];

    return [
      {
        icon: AlignLeft,
        label: 'Align Left',
        action: () => editor.chain().focus().setTextAlign('left').run(),
        isActive: editor.isActive({ textAlign: 'left' }),
      },
      {
        icon: AlignCenter,
        label: 'Align Center',
        action: () => editor.chain().focus().setTextAlign('center').run(),
        isActive: editor.isActive({ textAlign: 'center' }),
      },
      {
        icon: AlignRight,
        label: 'Align Right',
        action: () => editor.chain().focus().setTextAlign('right').run(),
        isActive: editor.isActive({ textAlign: 'right' }),
      },
    ];
  }, [editor]);

  return {
    formatActions,
    headingActions,
    listActions,
    insertActions,
    alignActions,
  };
}


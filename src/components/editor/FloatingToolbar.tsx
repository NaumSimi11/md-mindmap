/**
 * Floating Toolbar (Bubble Menu) for Text Selection
 * Shows formatting options when text is selected
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Link as LinkIcon,
  Superscript as SuperIcon,
  Subscript as SubIcon,
} from 'lucide-react';

interface FloatingToolbarProps {
  editor: Editor;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const ButtonIcon = ({
    icon: Icon,
    onClick,
    isActive,
    title,
  }: {
    icon: any;
    onClick: () => void;
    isActive?: boolean;
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-accent transition-colors ${
        isActive ? 'bg-accent text-primary' : 'text-foreground'
      }`}
      title={title}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      className="floating-toolbar bg-popover border border-border rounded-lg shadow-lg p-1 flex items-center gap-0.5"
    >
      {/* Basic Formatting */}
      <ButtonIcon
        icon={Bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      />
      <ButtonIcon
        icon={Italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      />
      <ButtonIcon
        icon={Underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      />
      <ButtonIcon
        icon={Strikethrough}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Code & Highlight */}
      <ButtonIcon
        icon={Code}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
      />
      <ButtonIcon
        icon={Highlighter}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Super/Subscript */}
      <ButtonIcon
        icon={SuperIcon}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive('superscript')}
        title="Superscript (x²)"
      />
      <ButtonIcon
        icon={SubIcon}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive('subscript')}
        title="Subscript (H₂O)"
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Link */}
      <ButtonIcon
        icon={LinkIcon}
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Add Link"
      />
    </BubbleMenu>
  );
};


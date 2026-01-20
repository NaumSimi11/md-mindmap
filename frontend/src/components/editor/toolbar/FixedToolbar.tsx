import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from './ToolbarButton';
import { useEditorToolbar, ToolbarAction } from '@/hooks/useEditorToolbar';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  Type,
  Heading,
  ListIcon,
  Plus,
  AlignLeft,
  Undo2,
  Redo2,
  Highlighter,
  Image,
  Table,
  Minus,
  CheckSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * FixedToolbar - Enhanced text formatting toolbar with dropdowns
 * 
 * Features:
 * - Quick access buttons for common actions
 * - Dropdown menus for grouped tools
 * - Undo/Redo
 * - Insert menu (Table, Image, Horizontal Rule, Blockquote)
 */

interface FixedToolbarProps {
  editor: Editor | null;
}

// Dropdown menu component for toolbar groups
const ToolbarDropdown: React.FC<{
  trigger: React.ReactNode;
  label: string;
  actions: ToolbarAction[];
  className?: string;
}> = ({ trigger, label, actions, className }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            className
          )}
        >
          {trigger}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, i) => (
          <DropdownMenuItem
            key={i}
            onClick={action.action}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              action.isActive && "bg-primary/10 text-primary"
            )}
          >
            <action.icon className="h-4 w-4" />
            <span>{action.label}</span>
            {action.shortcut && (
              <span className="ml-auto text-xs text-muted-foreground">{action.shortcut}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const FixedToolbar: React.FC<FixedToolbarProps> = ({ editor }) => {
  const { formatActions, headingActions, listActions, insertActions, alignActions } = useEditorToolbar(editor);

  if (!editor) {
    return null;
  }

  // Quick access formatting (most used)
  const quickFormatActions = formatActions.slice(0, 4); // Bold, Italic, Underline, Strikethrough
  // More formatting options for dropdown
  const moreFormatActions = formatActions.slice(4); // Code, Highlight, Superscript, Subscript

  // Check if any action in a group is active
  const hasActiveHeading = headingActions.some(a => a.isActive);
  const hasActiveList = listActions.some(a => a.isActive);
  const hasActiveAlign = alignActions.some(a => a.isActive);

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 sm:px-4 py-2 flex items-center gap-1 overflow-x-auto">
      {/* Left: Formatting Tools */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Undo (⌘Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1 dark:bg-slate-700" />

        {/* Quick format buttons */}
        {quickFormatActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}
        
        {/* More formatting dropdown */}
        <ToolbarDropdown
          trigger={<Type className="h-4 w-4" />}
          label="Text Formatting"
          actions={moreFormatActions}
        />

        <Separator orientation="vertical" className="h-5 mx-1 dark:bg-slate-700" />

        {/* Headings dropdown */}
        <ToolbarDropdown
          trigger={<Heading className="h-4 w-4" />}
          label="Headings"
          actions={headingActions}
          className={hasActiveHeading ? "bg-primary/10 text-primary" : ""}
        />

        {/* Lists dropdown */}
        <ToolbarDropdown
          trigger={<ListIcon className="h-4 w-4" />}
          label="Lists"
          actions={listActions}
          className={hasActiveList ? "bg-primary/10 text-primary" : ""}
        />

        {/* Alignment dropdown */}
        <ToolbarDropdown
          trigger={<AlignLeft className="h-4 w-4" />}
          label="Alignment"
          actions={alignActions}
          className={hasActiveAlign ? "bg-primary/10 text-primary" : ""}
        />

        <Separator orientation="vertical" className="h-5 mx-1 dark:bg-slate-700" />

        {/* Quick insert buttons */}
        <ToolbarButton action={insertActions.find(a => a.label === 'Link')!} />
        <ToolbarButton action={insertActions.find(a => a.label === 'Blockquote')!} />
        
        {/* Insert dropdown for more items */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Insert</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Table className="h-4 w-4" />
              <span>Table</span>
              <span className="ml-auto text-xs text-muted-foreground">3×3</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = window.prompt('Image URL:');
                if (url) editor.chain().focus().setImage({ src: url }).run();
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Image className="h-4 w-4" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Minus className="h-4 w-4" />
              <span>Horizontal Rule</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                editor.isActive('taskList') && "bg-primary/10 text-primary"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Task List</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘⇧9</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                editor.isActive('highlight') && "bg-primary/10 text-primary"
              )}
            >
              <Highlighter className="h-4 w-4" />
              <span>Highlight</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
};


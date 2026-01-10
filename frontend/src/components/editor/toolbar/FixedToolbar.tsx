import React from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from './ToolbarButton';
import { useEditorToolbar } from '@/hooks/useEditorToolbar';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCommentStore } from '@/stores/commentStore';

/**
 * FixedToolbar - Text formatting toolbar
 * 
 * NOTE: Diagram, Mindmap, and AI pills were removed to avoid duplication.
 * These features are available in the Action Bar (top) and Side Toolbar (right).
 * This toolbar focuses on text formatting: Bold, Italic, Headings, Lists, Link.
 */

interface FixedToolbarProps {
  editor: Editor | null;
}

export const FixedToolbar: React.FC<FixedToolbarProps> = ({ editor }) => {
  const { formatActions, headingActions, listActions, insertActions } = useEditorToolbar(editor);
  const { toggleCommentSidebar, comments } = useCommentStore();

  if (!editor) {
    return null;
  }

  const openCommentsCount = comments.filter(c => c.status === 'open').length;

  // Core formatting actions (limited to essentials)
  const coreFormatActions = formatActions.slice(0, 5); // Bold, Italic, Underline, Strikethrough, Code
  const coreHeadingActions = headingActions.slice(0, 3); // H1, H2, H3

  return (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
      {/* Left: Core Formatting */}
      <div className="flex items-center gap-1">
        {/* Basic formatting */}
        {coreFormatActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-2 dark:bg-slate-700" />

        {/* Headings */}
        {coreHeadingActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-2 dark:bg-slate-700" />

        {/* Lists */}
        {listActions.slice(0, 2).map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-2 dark:bg-slate-700" />

        {/* Link */}
        <ToolbarButton action={insertActions.find(a => a.label === 'Link')!} />
      </div>

      {/* Right: Comments button only (Diagram/AI moved to Action Bar & Side Toolbar) */}
      <div className="flex items-center gap-2">
        {/* Comments */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCommentSidebar}
          className="h-8 px-2 relative text-slate-700 dark:text-slate-300"
          title="Comments"
        >
          <MessageSquare className="h-4 w-4" />
          {openCommentsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {openCommentsCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};


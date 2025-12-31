import React from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from './ToolbarButton';
import { useEditorToolbar } from '@/hooks/useEditorToolbar';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Network,
  Sparkles,
  Wand2,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useCommentStore } from '@/stores/commentStore';
import { useEditorUIStore } from '@/stores/editorUIStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FixedToolbarProps {
  editor: Editor | null;
}

export const FixedToolbar: React.FC<FixedToolbarProps> = ({ editor }) => {
  const { formatActions, headingActions, listActions, insertActions } = useEditorToolbar(editor);
  const { toggleCommentSidebar, comments } = useCommentStore();
  const {
    setShowAIModal,
    setShowDiagramMenu,
    setShowMindmapChoiceModal,
  } = useEditorUIStore();

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

      {/* Right: Feature Pills + Preview Toggle */}
      <div className="flex items-center gap-2">
        {/* Feature Pills */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagramMenu(true)}
            className="h-7 px-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
          >
            <Network className="h-3.5 w-3.5 mr-1" />
            Diagram
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMindmapChoiceModal(true)}
            className="h-7 px-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Mindmap
          </Button>

          {/* AI Assistant Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              >
                <Wand2 className="h-3.5 w-3.5 mr-1" />
                AI Assistant
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowAIModal(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAIModal(true)}>
                <Wand2 className="h-4 w-4 mr-2" />
                Rewrite Text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAIModal(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask AI
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 dark:bg-slate-700" />

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


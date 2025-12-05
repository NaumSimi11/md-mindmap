import React from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from './ToolbarButton';
import { useEditorToolbar } from '@/hooks/useEditorToolbar';
import { MessageSquare } from 'lucide-react';
import { useCommentStore } from '@/stores/commentStore';

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

  return (
    <div className="border-b border-border bg-card px-4 py-2 flex items-center gap-1 flex-wrap">
      {/* Format Group */}
      <div className="flex items-center gap-1">
        {formatActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Heading Group */}
      <div className="flex items-center gap-1">
        {headingActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* List Group */}
      <div className="flex items-center gap-1">
        {listActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Group */}
      <div className="flex items-center gap-1">
        {insertActions.map((action, i) => (
          <ToolbarButton key={i} action={action} />
        ))}
      </div>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* Comments */}
      <button
        onClick={toggleCommentSidebar}
        className="relative p-2 rounded hover:bg-accent transition-colors"
        title="Comments"
      >
        <MessageSquare className="w-4 h-4" />
        {openCommentsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
            {openCommentsCount}
          </span>
        )}
      </button>
    </div>
  );
};


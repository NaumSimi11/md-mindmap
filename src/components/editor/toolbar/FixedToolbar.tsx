import React from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from './ToolbarButton';
import { useEditorToolbar } from '@/hooks/useEditorToolbar';

interface FixedToolbarProps {
  editor: Editor | null;
}

export const FixedToolbar: React.FC<FixedToolbarProps> = ({ editor }) => {
  const { formatActions, headingActions, listActions, insertActions } = useEditorToolbar(editor);

  if (!editor) {
    return null;
  }

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
    </div>
  );
};


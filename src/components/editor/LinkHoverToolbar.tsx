import React, { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { ExternalLink, Unlink, Copy, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinkHoverToolbarProps {
  editor: Editor;
}

export const LinkHoverToolbar: React.FC<LinkHoverToolbarProps> = ({ editor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const isEditingRef = useRef(false);

  if (!editor) return null;

  const handleCopyUrl = () => {
    const url = editor.getAttributes('link').href;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    const url = editor.getAttributes('link').href;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
    setIsEditing(false);
    isEditingRef.current = false;
  };

  const handleStartEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const url = editor.getAttributes('link').href;
    setEditUrl(url || '');
    setIsEditing(true);
    isEditingRef.current = true;
  };

  const handleSaveEdit = () => {
    if (editUrl) {
      editor.chain().focus().setLink({ href: editUrl }).run();
    }
    setIsEditing(false);
    isEditingRef.current = false;
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    isEditingRef.current = false;
    setEditUrl('');
  };

  // Only show when cursor is on a link (not when selecting text for new link)
  // Keep showing when in edit mode
  const shouldShow = ({ editor, from, to }: any) => {
    // Keep visible if we're editing (using ref for immediate access)
    if (isEditingRef.current) return true;
    
    // Only show if cursor is inside a link
    return from === to && editor.isActive('link');
  };

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={100}
      shouldShow={shouldShow}
      className="link-hover-toolbar bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
    >
      {isEditing ? (
        // Edit mode - show input field
        <div className="flex items-center gap-1 p-2">
          <Input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="Enter URL..."
            className="h-8 text-sm min-w-[200px]"
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelEdit();
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            className="h-8 w-8 p-0"
            title="Save (Enter)"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            className="h-8 w-8 p-0"
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ) : (
        // View mode - show action buttons
        <div className="flex items-center gap-0.5 p-1">
          {/* URL Display */}
          <div className="px-2 py-1 text-xs text-muted-foreground max-w-[200px] truncate">
            {editor.getAttributes('link').href || 'No URL'}
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Action Buttons */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenLink}
            className="h-8 w-8 p-0"
            title="Open link (Ctrl+Click)"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyUrl}
            className="h-8 w-8 p-0"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => handleStartEdit(e)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 w-8 p-0"
            title="Edit link"
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleUnlink}
            className="h-8 w-8 p-0"
            title="Remove link"
          >
            <Unlink className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )}
    </BubbleMenu>
  );
};


/**
 * Rich context menu for WYSIWYG Editor
 * Compact, organized layout with icon buttons
 */

import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Sparkles,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Library,
} from 'lucide-react';

interface EditorContextMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
  onFormat: (format: string) => void;
  onAIAction: (action: string) => void;
  onInsert: (type: string) => void;
  onBasicAction: (action: string) => void;
}

export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({
  position,
  selectedText,
  onClose,
  onFormat,
  onAIAction,
  onInsert,
  onBasicAction,
}) => {
  const hasSelection = selectedText.trim().length > 0;

  // Icon button component for compact layout
  const IconButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    className = "" 
  }: { 
    icon: any; 
    onClick: () => void; 
    title: string; 
    className?: string;
  }) => (
    <button
      className={`p-2 hover:bg-accent rounded-md transition-colors ${className}`}
      onClick={() => {
        onClick();
        onClose();
      }}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-2 px-1"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          minWidth: '200px',
          maxWidth: '280px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Basic Actions - Always visible */}
        <div className="flex items-center gap-1 px-1 pb-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors flex-1"
            onClick={() => {
              onBasicAction('copy');
              onClose();
            }}
            title="Copy (Ctrl+C)"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs">Copy</span>
          </button>
          
          {hasSelection && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors flex-1"
              onClick={() => {
                onBasicAction('cut');
                onClose();
              }}
              title="Cut (Ctrl+X)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="text-xs">Cut</span>
            </button>
          )}
          
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors flex-1"
            onClick={() => {
              onBasicAction('paste');
              onClose();
            }}
            title="Paste (Ctrl+V)"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="text-xs">Paste</span>
          </button>
        </div>

        {hasSelection && (
          <>
            <div className="h-px bg-border my-1.5" />

            {/* Format - Compact icon row */}
            <div className="px-1">
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Format
              </div>
              <div className="flex items-center gap-0.5">
                <IconButton 
                  icon={Bold} 
                  onClick={() => onFormat('bold')} 
                  title="Bold (Ctrl+B)"
                />
                <IconButton 
                  icon={Italic} 
                  onClick={() => onFormat('italic')} 
                  title="Italic (Ctrl+I)"
                />
                <IconButton 
                  icon={Strikethrough} 
                  onClick={() => onFormat('strikethrough')} 
                  title="Strikethrough"
                />
                <IconButton 
                  icon={Code} 
                  onClick={() => onFormat('code')} 
                  title="Code"
                />
                <IconButton 
                  icon={LinkIcon} 
                  onClick={() => onFormat('link')} 
                  title="Add Link"
                />
              </div>
            </div>

            <div className="h-px bg-border my-1.5" />

            {/* Convert To - Compact rows */}
            <div className="px-1">
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Convert To
              </div>
              
              {/* Headings Row */}
              <div className="flex items-center gap-0.5 mb-1">
                <IconButton 
                  icon={Heading1} 
                  onClick={() => onFormat('heading1')} 
                  title="H1"
                />
                <IconButton 
                  icon={Heading2} 
                  onClick={() => onFormat('heading2')} 
                  title="H2"
                />
                <IconButton 
                  icon={Heading3} 
                  onClick={() => onFormat('heading3')} 
                  title="H3"
                />
              </div>
              
              {/* Lists & Quote Row */}
              <div className="flex items-center gap-0.5">
                <IconButton 
                  icon={List} 
                  onClick={() => onFormat('bulletList')} 
                  title="Bullet List"
                />
                <IconButton 
                  icon={ListOrdered} 
                  onClick={() => onFormat('orderedList')} 
                  title="Numbered List"
                />
                <IconButton 
                  icon={Quote} 
                  onClick={() => onFormat('blockquote')} 
                  title="Quote"
                />
              </div>
            </div>

            <div className="h-px bg-border my-1.5" />

            {/* AI Actions - Compact buttons */}
            <div className="px-1">
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Actions
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onAIAction('improve');
                    onClose();
                  }}
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Improve</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onAIAction('summarize');
                    onClose();
                  }}
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Summarize</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onAIAction('expand');
                    onClose();
                  }}
                >
                  <Sparkles className="w-3 h-3 text-green-500" />
                  <span>Expand</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onAIAction('translate');
                    onClose();
                  }}
                >
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span>Translate</span>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="h-px bg-border my-1.5" />

        {/* Insert Elements */}
        <div className="px-1">
          <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Insert
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors flex-1"
              onClick={() => {
                onInsert('table');
                onClose();
              }}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-accent rounded-md transition-colors flex-1"
              onClick={() => {
                onInsert('diagram');
                onClose();
              }}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Diagram</span>
            </button>
          </div>
        </div>

        {hasSelection && (
          <>
            <div className="h-px bg-border my-1.5" />
            <div className="px-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                onClick={() => {
                  onBasicAction('delete');
                  onClose();
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

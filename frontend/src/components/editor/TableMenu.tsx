/**
 * Table Menu
 * Floating menu that appears when right-clicking on table cells
 * Provides options to add/remove rows and columns
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FloatingMenu } from '@/components/ui/floating-menu';
import {
  Minus,
  Trash2,
  Columns,
  Rows,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Split,
  ChevronRight
} from 'lucide-react';

interface TableMenuProps {
  editor: Editor | null;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export const TableMenu: React.FC<TableMenuProps> = ({
  editor,
  isOpen,
  position,
  onClose,
}) => {
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

  if (!editor || !isOpen) return null;

  // Check if we're in a table
  const isInTable = editor.can().addRowBefore() || editor.can().addColumnBefore();

  if (!isInTable) return null;

  const tableActions = {
    // Row actions
    addRowBefore: () => { editor.chain().focus().addRowBefore().run(); onClose(); },
    addRowAfter: () => { editor.chain().focus().addRowAfter().run(); onClose(); },
    deleteRow: () => { editor.chain().focus().deleteRow().run(); onClose(); },

    // Column actions
    addColumnBefore: () => { editor.chain().focus().addColumnBefore().run(); onClose(); },
    addColumnAfter: () => { editor.chain().focus().addColumnAfter().run(); onClose(); },
    deleteColumn: () => { editor.chain().focus().deleteColumn().run(); onClose(); },

    // Table actions
    deleteTable: () => { editor.chain().focus().deleteTable().run(); onClose(); },

    // Header actions
    toggleHeaderRow: () => { editor.chain().focus().toggleHeaderRow().run(); onClose(); },
    toggleHeaderColumn: () => { editor.chain().focus().toggleHeaderColumn().run(); onClose(); },

    // Cell actions
    mergeCells: () => { editor.chain().focus().mergeCells().run(); onClose(); },
    splitCell: () => { editor.chain().focus().splitCell().run(); onClose(); },
  };

  return (
    <FloatingMenu
      isOpen={isOpen}
      position={position}
      onClose={onClose}
      width="w-56"
    >
      {/* Row Operations */}
      <div
        className="relative"
        onMouseEnter={() => setHoveredSubmenu('row')}
        onMouseLeave={() => setHoveredSubmenu(null)}
      >
        <button
          className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (!hoveredSubmenu) setHoveredSubmenu('row');
          }}
        >
          <div className="flex items-center gap-2">
            <Rows className="w-4 h-4" />
            <span>Row</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </button>
        {hoveredSubmenu === 'row' && (
          <div className="absolute left-full top-0 ml-1 bg-popover border border-border rounded-lg shadow-lg w-48 p-1 z-50">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.addRowBefore}
              disabled={!editor.can().addRowBefore()}
            >
              <ArrowUp className="w-4 h-4" />
              <span>Add Row Above</span>
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.addRowAfter}
              disabled={!editor.can().addRowAfter()}
            >
              <ArrowDown className="w-4 h-4" />
              <span>Add Row Below</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.deleteRow}
              disabled={!editor.can().deleteRow()}
            >
              <Minus className="w-4 h-4" />
              <span>Delete Row</span>
            </button>
          </div>
        )}
      </div>

      {/* Column Operations */}
      <div
        className="relative"
        onMouseEnter={() => setHoveredSubmenu('column')}
        onMouseLeave={() => setHoveredSubmenu(null)}
      >
        <button
          className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (!hoveredSubmenu) setHoveredSubmenu('column');
          }}
        >
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            <span>Column</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </button>
        {hoveredSubmenu === 'column' && (
          <div className="absolute left-full top-0 ml-1 bg-popover border border-border rounded-lg shadow-lg w-48 p-1 z-50">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.addColumnBefore}
              disabled={!editor.can().addColumnBefore()}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Add Column Left</span>
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.addColumnAfter}
              disabled={!editor.can().addColumnAfter()}
            >
              <ArrowRight className="w-4 h-4" />
              <span>Add Column Right</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={tableActions.deleteColumn}
              disabled={!editor.can().deleteColumn()}
            >
              <Minus className="w-4 h-4" />
              <span>Delete Column</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-border my-1" />

      {/* Cell Operations */}
      {editor.can().mergeCells() && (
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
          onClick={tableActions.mergeCells}
        >
          <Merge className="w-4 h-4" />
          <span>Merge Cells</span>
        </button>
      )}
      {editor.can().splitCell() && (
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
          onClick={tableActions.splitCell}
        >
          <Split className="w-4 h-4" />
          <span>Split Cell</span>
        </button>
      )}

      <div className="h-px bg-border my-1" />

      {/* Header Toggles */}
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
        onClick={tableActions.toggleHeaderRow}
      >
        <Rows className="w-4 h-4" />
        <span>Toggle Header Row</span>
      </button>
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
        onClick={tableActions.toggleHeaderColumn}
      >
        <Columns className="w-4 h-4" />
        <span>Toggle Header Column</span>
      </button>

      <div className="h-px bg-border my-1" />

      {/* Delete Table */}
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={tableActions.deleteTable}
        disabled={!editor.can().deleteTable()}
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete Table</span>
      </button>
    </FloatingMenu>
  );
};

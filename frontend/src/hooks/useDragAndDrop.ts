/**
 * useDragAndDrop - Hook for drag-and-drop document organization
 */

import { useState } from 'react';

export interface DragItem {
  type: 'document' | 'folder';
  id: string;
  title: string;
}

export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = (item: DragItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(targetId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetId: string | null,
    onDrop: (draggedId: string, targetId: string | null) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem && draggedItem.id !== targetId) {
      onDrop(draggedItem.id, targetId);
    }

    handleDragEnd();
  };

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}


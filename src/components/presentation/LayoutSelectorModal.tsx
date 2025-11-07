/**
 * LayoutSelectorModal - Gamma-style drag-to-layout selector
 * 
 * Shows a grid of layout icons that can be dragged onto blocks to transform them
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LAYOUT_DEFINITIONS, type BlockType } from '@/services/presentation/BlockSystem';
import {
  Percent,
  Circle,
  BarChart3,
  Triangle,
  Filter,
  List,
  RefreshCw,
  LayoutGrid,
  Type,
  Heading,
  CircleDot,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Percent,
  Circle,
  BarChart3,
  Triangle,
  Filter,
  List,
  RefreshCw,
  LayoutGrid,
  Type,
  Heading,
  CircleDot,
  Sparkles,
  ChevronRight, // For staircase
};

interface LayoutSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLayoutSelect?: (layoutType: BlockType) => void;
  targetBlockId?: string; // Block that will receive the layout
}

export function LayoutSelectorModal({
  open,
  onOpenChange,
  onLayoutSelect,
  targetBlockId,
}: LayoutSelectorModalProps) {
  const [draggedLayout, setDraggedLayout] = useState<BlockType | null>(null);

  const handleDragStart = (e: React.DragEvent, layoutType: BlockType) => {
    setDraggedLayout(layoutType);
    e.dataTransfer.setData('layout-type', layoutType);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.padding = '8px 12px';
    dragImage.style.background = 'rgba(0, 0, 0, 0.8)';
    dragImage.style.color = 'white';
    dragImage.style.borderRadius = '8px';
    dragImage.textContent = LAYOUT_DEFINITIONS.find(l => l.id === layoutType)?.name || layoutType;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggedLayout(null);
  };

  const handleClick = (layoutType: BlockType) => {
    if (onLayoutSelect) {
      onLayoutSelect(layoutType);
    }
    onOpenChange(false);
  };

  // Group layouts by category
  const layoutsByCategory = LAYOUT_DEFINITIONS.reduce((acc, layout) => {
    if (!acc[layout.category]) {
      acc[layout.category] = [];
    }
    acc[layout.category].push(layout);
    return acc;
  }, {} as Record<string, typeof LAYOUT_DEFINITIONS>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Templates
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            ⓘ Tip: Drag and drop a smart layout block to change layouts
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Layout Grid */}
          <div className="grid grid-cols-3 gap-4">
            {LAYOUT_DEFINITIONS.map((layout) => {
              const IconComponent = iconMap[layout.icon] || LayoutGrid;
              const isDragging = draggedLayout === layout.id;

              return (
                <button
                  key={layout.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, layout.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleClick(layout.id)}
                  className={`
                    group relative p-4 rounded-lg border-2 transition-all
                    bg-gray-50 dark:bg-gray-900
                    hover:border-primary hover:shadow-md
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${targetBlockId ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  `}
                  title={`${layout.name} - ${layout.description}`}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-3">
                    <IconComponent className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {layout.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {layout.description}
                    </p>
                  </div>

                  {/* Drag indicator */}
                  {targetBlockId && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
                        Drag to insert
                      </div>
                    </div>
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


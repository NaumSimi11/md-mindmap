/**
 * BlockSelectorModal - Select and add beautiful blocks to slides
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { BlockType } from '@/services/presentation/BlockSystem';

interface BlockSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (blockType: BlockType) => void;
}

const BLOCK_TYPES = [
  {
    type: 'hero' as BlockType,
    icon: '🚀',
    name: 'Hero',
    description: 'Big impact opening with CTA buttons',
    preview: 'Large title + subtitle + call-to-action',
  },
  {
    type: 'cards' as BlockType,
    icon: '🎴',
    name: 'Cards',
    description: 'Grid of feature cards with images',
    preview: '2-3 column responsive grid',
  },
  {
    type: 'stats' as BlockType,
    icon: '📊',
    name: 'Stats',
    description: 'Animated metrics & KPIs',
    preview: 'Ring/bar/circle visualizations',
  },
  {
    type: 'steps' as BlockType,
    icon: '📋',
    name: 'Steps',
    description: 'Sequential process timeline',
    preview: 'Numbered steps with progress',
  },
  {
    type: 'funnel' as BlockType,
    icon: '🎯',
    name: 'Funnel',
    description: 'Conversion funnel visualization',
    preview: 'Narrowing stages with rates',
  },
  {
    type: 'cycle' as BlockType,
    icon: '🔄',
    name: 'Cycle',
    description: 'Circular process flow',
    preview: 'Items arranged in circle',
  },
  {
    type: 'timeline' as BlockType,
    icon: '📅',
    name: 'Timeline',
    description: 'Milestones & events',
    preview: 'Horizontal or vertical',
  },
  {
    type: 'comparison' as BlockType,
    icon: '⚖️',
    name: 'Comparison',
    description: 'Feature comparison table',
    preview: 'Multi-column with checks',
  },
  {
    type: 'pyramid' as BlockType,
    icon: '🔺',
    name: 'Pyramid',
    description: 'Hierarchy visualization',
    preview: 'Stacked levels',
  },
  {
    type: 'callout' as BlockType,
    icon: '💡',
    name: 'Callout',
    description: 'Alert/tip/warning box',
    preview: 'Highlighted message',
  },
];

export function BlockSelectorModal({ isOpen, onClose, onSelect }: BlockSelectorModalProps) {
  const [hoveredType, setHoveredType] = useState<BlockType | null>(null);

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            ✨ Add Beautiful Block
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a content block to add to your slide
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {BLOCK_TYPES.map((blockType) => {
              const isHovered = hoveredType === blockType.type;

              return (
                <button
                  key={blockType.type}
                  onClick={() => handleSelect(blockType.type)}
                  onMouseEnter={() => setHoveredType(blockType.type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className="p-6 rounded-xl border-2 transition-all duration-300 text-left
                             hover:shadow-xl hover:scale-105 active:scale-95"
                  style={{
                    borderColor: isHovered ? '#6366f1' : '#e5e7eb',
                    backgroundColor: isHovered ? '#eef2ff' : 'white',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="text-5xl mb-3 transition-transform duration-300"
                    style={{
                      transform: isHovered ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                    }}
                  >
                    {blockType.icon}
                  </div>

                  {/* Name */}
                  <div className="font-bold text-xl mb-2" style={{ color: '#1f2937' }}>
                    {blockType.name}
                  </div>

                  {/* Description */}
                  <div className="text-sm mb-2" style={{ color: '#6b7280' }}>
                    {blockType.description}
                  </div>

                  {/* Preview hint */}
                  <div
                    className="text-xs px-3 py-1 rounded-full inline-block"
                    style={{
                      backgroundColor: isHovered ? '#818cf8' : '#e0e7ff',
                      color: isHovered ? 'white' : '#4f46e5',
                    }}
                  >
                    {blockType.preview}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


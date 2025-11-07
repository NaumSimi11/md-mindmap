/**
 * SlideLayoutModal - Choose slide layouts (image position, columns, etc.)
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  LayoutGrid, 
  Image, 
  Type, 
  Columns2,
  Columns3,
  Square,
  Sparkles,
} from 'lucide-react';

interface SlideLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (layoutType: string) => void;
}

const SLIDE_LAYOUTS = [
  {
    id: 'full-image',
    name: 'Full Image',
    description: 'Background image with text overlay at bottom',
    icon: '🖼️',
    preview: '█████████',
  },
  {
    id: 'image-left',
    name: 'Image Left',
    description: 'Image on left, text on right',
    icon: '📷',
    preview: '███ | Text',
  },
  {
    id: 'image-right',
    name: 'Image Right',
    description: 'Text on left, image on right',
    icon: '🖼',
    preview: 'Text | ███',
  },
  {
    id: 'image-top',
    name: 'Image Top',
    description: 'Image on top, text below',
    icon: '🎨',
    preview: '█████\nText',
  },
  {
    id: 'image-bottom',
    name: 'Image Bottom',
    description: 'Text on top, image below',
    icon: '📸',
    preview: 'Text\n█████',
  },
  {
    id: 'two-column',
    name: 'Two Columns',
    description: 'Side-by-side content',
    icon: '▯▯',
    preview: 'Col 1 | Col 2',
  },
  {
    id: 'three-column',
    name: 'Three Columns',
    description: 'Three equal columns',
    icon: '▯▯▯',
    preview: 'Col 1 | 2 | 3',
  },
  {
    id: 'sidebar-left',
    name: 'Sidebar Left',
    description: 'Narrow left, wide right',
    icon: '│▬',
    preview: '▌ Main',
  },
  {
    id: 'sidebar-right',
    name: 'Sidebar Right',
    description: 'Wide left, narrow right',
    icon: '▬│',
    preview: 'Main ▐',
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Content in center',
    icon: '◻',
    preview: '  ▬▬  ',
  },
  {
    id: 'split-image',
    name: 'Split 50/50',
    description: 'Image and text equal',
    icon: '▓▓',
    preview: '███ ▬▬',
  },
  {
    id: 'hero-overlay',
    name: 'Hero Overlay',
    description: 'Text centered over dimmed background image',
    icon: '🌅',
    preview: '█ Text █',
  },
];

export function SlideLayoutModal({ isOpen, onClose, onSelect }: SlideLayoutModalProps) {
  const handleSelect = (layoutId: string) => {
    onSelect(layoutId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" />
            Choose Slide Layout
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select how you want to arrange images and text on this slide
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 overflow-y-auto max-h-[600px] pr-2">
          {SLIDE_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => handleSelect(layout.id)}
              className="p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 
                         hover:bg-indigo-50 transition-all duration-200 text-left group
                         hover:scale-105 hover:shadow-xl active:scale-95"
            >
              {/* Icon */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {layout.icon}
              </div>

              {/* Name */}
              <div className="font-bold text-lg mb-2 text-gray-900">
                {layout.name}
              </div>

              {/* Description */}
              <div className="text-sm text-gray-600 mb-3">
                {layout.description}
              </div>

              {/* Preview */}
              <div 
                className="text-xs font-mono px-3 py-2 rounded bg-gray-100 
                           group-hover:bg-indigo-100 text-gray-700 text-center"
              >
                {layout.preview}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}


/**
 * PresentationSidebar - Slide list navigation
 * 
 * Shows thumbnails of all slides with drag-to-reorder support
 */

import { Button } from '@/components/ui/button';
import { Plus, Trash2, Copy, MoreVertical } from 'lucide-react';
import type { Slide, PresentationTheme } from '@/services/presentation/PresentationGenerator';

interface PresentationSidebarProps {
  slides: Slide[];
  currentIndex: number;
  theme: PresentationTheme;
  onSlideSelect: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onDuplicateSlide: (index: number) => void;
}

export function PresentationSidebar({
  slides,
  currentIndex,
  theme,
  onSlideSelect,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
}: PresentationSidebarProps) {
  const getSlidePreviewText = (slide: Slide): string => {
    if (slide.content.title) {
      return slide.content.title;
    }
    if (slide.content.body) {
      return slide.content.body.substring(0, 50) + '...';
    }
    if (slide.content.bullets && slide.content.bullets.length > 0) {
      return slide.content.bullets[0];
    }
    return 'Untitled Slide';
  };

  const getLayoutBadge = (layout: Slide['layout']): string => {
    const badges: Record<Slide['layout'], string> = {
      title: '📄',
      content: '📝',
      bullets: '📋',
      'two-column': '📊',
      image: '🖼️',
      diagram: '📈',
      mindmap: '🧠',
      quote: '💬',
      section: '🔖',
      blank: '⬜',
    };
    return badges[layout] || '📄';
  };

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Slides</h3>
          <span className="text-xs text-muted-foreground">{slides.length} total</span>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={onAddSlide}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {/* Slide List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ overflowY: 'auto', maxHeight: '100%' }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`
              group relative p-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                index === currentIndex
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-border bg-background hover:border-gray-300 hover:shadow-sm'
              }
            `}
            onClick={() => onSlideSelect(index)}
          >
            {/* Slide Number */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <span className="text-lg">{getLayoutBadge(slide.layout)}</span>
            </div>

            {/* Slide Preview */}
            <div className="space-y-1">
              <p className="text-sm font-medium line-clamp-2">
                {getSlidePreviewText(slide)}
              </p>
              {slide.content.bullets && slide.content.bullets.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {slide.content.bullets.length} bullet points
                </p>
              )}
              {slide.content.diagram && (
                <p className="text-xs text-muted-foreground">
                  {slide.content.diagram.type} diagram
                </p>
              )}
            </div>

            {/* Actions (visible on hover or when selected) */}
            <div
              className={`
                absolute top-2 right-2 flex gap-1 transition-opacity
                ${
                  index === currentIndex
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }
              `}
            >
              <button
                className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSlide(index);
                }}
                title="Duplicate slide"
              >
                <Copy className="h-3 w-3 text-gray-600" />
              </button>
              <button
                className="p-1 bg-white rounded shadow-sm hover:bg-red-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this slide?')) {
                    onDeleteSlide(index);
                  }
                }}
                title="Delete slide"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            </div>

            {/* Speaker Notes Indicator */}
            {slide.speakerNotes && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>📝</span>
                  <span>Has speaker notes</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Click a slide to edit
        </div>
      </div>
    </div>
  );
}


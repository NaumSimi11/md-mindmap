/**
 * ContextualAIMenu - Gamma-style contextual AI menu
 * 
 * Appears when text is selected, offering writing improvements and layout transformations
 */

import { useState, useEffect, useRef } from 'react';
import {
  Pen,
  Check,
  Globe,
  AlignLeft,
  Minus,
  Settings,
  Target,
  List,
  FileText,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextualAIMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, text: string) => void;
  onLayoutTransform?: (layoutType: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'writing' | 'layout';
}

const WRITING_ITEMS: MenuItem[] = [
  { id: 'improve', label: 'Improve writing', icon: Pen, category: 'writing' },
  { id: 'fix-grammar', label: 'Fix spelling & grammar', icon: Check, category: 'writing' },
  { id: 'translate', label: 'Translate', icon: Globe, category: 'writing' },
  { id: 'make-longer', label: 'Make longer', icon: AlignLeft, category: 'writing' },
  { id: 'make-shorter', label: 'Make shorter', icon: Minus, category: 'writing' },
  { id: 'simplify', label: 'Simplify language', icon: Settings, category: 'writing' },
  { id: 'be-specific', label: 'Be more specific', icon: Target, category: 'writing' },
  { id: 'bullet-points', label: 'Break into bullet points', icon: List, category: 'writing' },
  { id: 'sections', label: 'Break into sections', icon: FileText, category: 'writing' },
  { id: 'summary', label: 'Add a smart summary', icon: FileCheck, category: 'writing' },
];

const LAYOUT_ITEMS: MenuItem[] = [
  { id: 'cards', label: 'Convert to cards', icon: List, category: 'layout' },
  { id: 'steps', label: 'Convert to steps', icon: FileText, category: 'layout' },
  { id: 'cycle', label: 'Convert to cycle', icon: Sparkles, category: 'layout' },
  { id: 'stats', label: 'Convert to stats', icon: Target, category: 'layout' },
];

export function ContextualAIMenu({
  selectedText,
  position,
  onClose,
  onAction,
  onLayoutTransform,
}: ContextualAIMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleItemClick = (item: MenuItem) => {
    if (item.category === 'layout' && onLayoutTransform) {
      onLayoutTransform(item.id);
    } else {
      onAction(item.id, selectedText);
    }
    onClose();
  };

  // Calculate menu position (ensure it stays within viewport)
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${Math.min(position.x, window.innerWidth - 300)}px`,
    top: `${Math.min(position.y, window.innerHeight - 400)}px`,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-64 overflow-hidden"
      style={menuStyle}
    >
      {/* Writing Section */}
      <div className="p-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Writing
        </div>
        {WRITING_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                hoveredItem === item.id
                  ? 'bg-gray-100 dark:bg-gray-800 text-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Layout Section */}
      {onLayoutTransform && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Layout
          </div>
          {LAYOUT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  hoveredItem === item.id
                    ? 'bg-gray-100 dark:bg-gray-800 text-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Hook for detecting text selection and showing menu
export function useTextSelection(
  onSelection: (text: string, position: { x: number; y: number }) => void
) {
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 3) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position (below selection, centered)
      const position = {
        x: rect.left + rect.width / 2 - 128, // Center menu (menu width is 256px)
        y: rect.bottom + 8, // 8px below selection
      };

      onSelection(selectedText, position);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [onSelection]);
}


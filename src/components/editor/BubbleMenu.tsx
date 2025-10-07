/**
 * BubbleMenu - Floating toolbar that appears when text is selected
 * Provides quick formatting and AI actions
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Code, 
  Link as LinkIcon,
  Strikethrough,
  Sparkles,
  FileText,
  Zap,
  Languages,
  Smile,
  Heading1,
  Heading2,
  Heading3,
  List,
  Quote,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface BubbleMenuAction {
  type: 'format' | 'ai' | 'convert';
  action: string;
  data?: any;
}

interface BubbleMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onAction: (action: BubbleMenuAction) => void;
  onClose: () => void;
}

export default function BubbleMenu({
  isVisible,
  position,
  selectedText,
  onAction,
  onClose,
}: BubbleMenuProps) {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showConvertMenu, setShowConvertMenu] = useState(false);

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible || !selectedText) return null;

  // Format actions
  const handleFormat = (format: string) => {
    onAction({ type: 'format', action: format });
  };

  // AI actions
  const handleAI = (action: string, data?: any) => {
    onAction({ type: 'ai', action, data });
  };

  // Convert actions
  const handleConvert = (convertTo: string) => {
    onAction({ type: 'convert', action: convertTo });
  };

  return (
    <div
      className="bubble-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
    >
      <div className="bubble-menu-content">
        {/* Basic Formatting */}
        <div className="bubble-menu-section">
          <button
            className="bubble-menu-btn"
            onClick={() => handleFormat('bold')}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            className="bubble-menu-btn"
            onClick={() => handleFormat('italic')}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className="bubble-menu-btn"
            onClick={() => handleFormat('code')}
            title="Code (⌘E)"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            className="bubble-menu-btn"
            onClick={() => handleFormat('strikethrough')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            className="bubble-menu-btn"
            onClick={() => handleFormat('link')}
            title="Link (⌘K)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="bubble-menu-divider" />

        {/* AI Actions */}
        <div className="bubble-menu-section">
          <DropdownMenu open={showAIMenu} onOpenChange={setShowAIMenu}>
            <DropdownMenuTrigger asChild>
              <button
                className="bubble-menu-btn bubble-menu-btn-ai"
                title="AI Actions"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">AI</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                AI-Powered Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAI('improve')}>
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Improve Writing</span>
                  <span className="text-xs text-muted-foreground">
                    Enhance clarity & grammar
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAI('summarize')}>
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Summarize</span>
                  <span className="text-xs text-muted-foreground">
                    Make it concise
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAI('expand')}>
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Expand</span>
                  <span className="text-xs text-muted-foreground">
                    Add more detail
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAI('translate')}>
                <Languages className="w-4 h-4 mr-2 text-green-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Translate</span>
                  <span className="text-xs text-muted-foreground">
                    To another language
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAI('tone')}>
                <Smile className="w-4 h-4 mr-2 text-pink-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Change Tone</span>
                  <span className="text-xs text-muted-foreground">
                    Professional, casual, friendly
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Convert Dropdown */}
          <DropdownMenu open={showConvertMenu} onOpenChange={setShowConvertMenu}>
            <DropdownMenuTrigger asChild>
              <button
                className="bubble-menu-btn"
                title="Convert to..."
              >
                <FileText className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Convert Selection
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleConvert('h1')}>
                <Heading1 className="w-4 h-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvert('h2')}>
                <Heading2 className="w-4 h-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvert('h3')}>
                <Heading3 className="w-4 h-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleConvert('bullet')}>
                <List className="w-4 h-4 mr-2" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvert('quote')}>
                <Quote className="w-4 h-4 mr-2" />
                Blockquote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvert('code')}>
                <Code className="w-4 h-4 mr-2" />
                Code Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <style>{`
        .bubble-menu {
          position: fixed;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
          animation: bubbleMenuFadeIn 0.15s ease-out;
        }

        @keyframes bubbleMenuFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bubble-menu-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 4px;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .bubble-menu-section {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .bubble-menu-divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
          margin: 0 4px;
        }

        .bubble-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 8px;
          border: none;
          background: transparent;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 14px;
        }

        .bubble-menu-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .bubble-menu-btn:active {
          background: #e5e7eb;
          transform: scale(0.95);
        }

        .bubble-menu-btn-ai {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          font-weight: 500;
        }

        .bubble-menu-btn-ai:hover {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .bubble-menu-content {
            background: #1f2937;
            border-color: #374151;
          }

          .bubble-menu-divider {
            background: #374151;
          }

          .bubble-menu-btn {
            color: #d1d5db;
          }

          .bubble-menu-btn:hover {
            background: #374151;
            color: #f9fafb;
          }

          .bubble-menu-btn:active {
            background: #4b5563;
          }
        }
      `}</style>
    </div>
  );
}


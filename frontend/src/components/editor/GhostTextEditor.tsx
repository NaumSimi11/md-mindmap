/**
 * GhostTextEditor - Textarea with ghost text overlay (AI suggestions)
 * Shows gray preview text that can be accepted with Tab
 */

import { forwardRef, useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface GhostTextEditorProps {
  value: string;
  ghostText: string;
  cursorPosition: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCursorChange?: (position: number) => void;
  className?: string;
  placeholder?: string;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onMouseUp?: () => void;
  onKeyUp?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
}

const GhostTextEditor = forwardRef<HTMLTextAreaElement, GhostTextEditorProps>(
  (
    {
      value,
      ghostText,
      cursorPosition,
      onChange,
      onCursorChange,
      className = '',
      placeholder,
      onScroll,
      onMouseUp,
      onKeyUp,
      onContextMenu,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [localCursorPos, setLocalCursorPos] = useState(cursorPosition);

    // Track cursor position changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCursorPos = e.target.selectionStart;
      setLocalCursorPos(newCursorPos);
      onCursorChange?.(newCursorPos);
      onChange(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      const newCursorPos = target.selectionStart;
      setLocalCursorPos(newCursorPos);
      onCursorChange?.(newCursorPos);
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      const newCursorPos = target.selectionStart;
      setLocalCursorPos(newCursorPos);
      onCursorChange?.(newCursorPos);
      onKeyUp?.();
    };

    // Calculate where to show ghost text
    const textBeforeCursor = value.slice(0, localCursorPos);
    const textAfterCursor = value.slice(localCursorPos);
    const displayText = ghostText ? textBeforeCursor + ghostText + textAfterCursor : value;

    return (
      <div ref={containerRef} className="ghost-text-editor-container">
        {/* Ghost text overlay */}
        {ghostText && (
          <div className="ghost-text-overlay">
            <pre className={`ghost-text-content ${className}`}>
              <span className="invisible-text">{textBeforeCursor}</span>
              <span className="ghost-suggestion">{ghostText}</span>
              <span className="invisible-text">{textAfterCursor}</span>
            </pre>
          </div>
        )}

        {/* Actual textarea */}
        <Textarea
          ref={ref}
          className={`ghost-text-input ${className}`}
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          onKeyUp={handleKeyUp}
          onScroll={onScroll}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
          placeholder={placeholder}
          spellCheck={false}
        />

        <style>{`
          .ghost-text-editor-container {
            position: relative;
            width: 100%;
            height: 100%;
          }

          .ghost-text-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 1;
          }

          .ghost-text-content {
            margin: 0;
            padding: 24px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            line-height: 1.625;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: transparent;
          }

          .invisible-text {
            opacity: 0;
          }

          .ghost-suggestion {
            color: #9ca3af;
            background: rgba(139, 92, 246, 0.05);
            border-radius: 2px;
            padding: 0 2px;
            animation: ghostTextFadeIn 0.3s ease-out;
          }

          .ghost-text-input {
            position: relative;
            z-index: 2;
            background: transparent !important;
          }

          @keyframes ghostTextFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Dark mode */
          @media (prefers-color-scheme: dark) {
            .ghost-suggestion {
              color: #6b7280;
              background: rgba(139, 92, 246, 0.1);
            }
          }
        `}</style>
      </div>
    );
  }
);

GhostTextEditor.displayName = 'GhostTextEditor';

export default GhostTextEditor;


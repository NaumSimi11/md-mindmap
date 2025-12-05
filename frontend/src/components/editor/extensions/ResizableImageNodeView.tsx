/**
 * Resizable Image Node View for TipTap
 * Allows users to resize images by dragging handles
 */

import { NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';

interface ResizableImageProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  selected: boolean;
}

export const ResizableImageNodeView: React.FC<ResizableImageProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imgRef.current?.width || 0;
    const startHeight = imgRef.current?.height || 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;

      const deltaX = direction.includes('w') ? startX - e.clientX : e.clientX - startX;
      const deltaY = direction.includes('n') ? startY - e.clientY : e.clientY - startY;

      // Maintain aspect ratio
      const aspectRatio = startWidth / startHeight;
      let newWidth = startWidth + deltaX;
      let newHeight = newWidth / aspectRatio;

      // Constrain size
      newWidth = Math.max(100, Math.min(newWidth, 1200));
      newHeight = newWidth / aspectRatio;

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const align = node.attrs.align || 'center';
  const width = node.attrs.width || 'auto';
  const height = node.attrs.height || 'auto';

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{
        display: 'flex',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        margin: '1.5rem 0',
      }}
    >
      <div
        className={`resizable-image-container ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{
          position: 'relative',
          display: 'inline-block',
          maxWidth: '100%',
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          width={width}
          height={height}
          className="editor-image"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        {/* Resize Handles - Only show when selected */}
        {selected && (
          <>
            {/* Southeast handle (bottom-right) */}
            <div
              className="resize-handle resize-handle-se"
              onMouseDown={(e) => handleMouseDown(e, 'se')}
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />

            {/* Southwest handle (bottom-left) */}
            <div
              className="resize-handle resize-handle-sw"
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '-4px',
                width: '12px',
                height: '12px',
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />

            {/* Northeast handle (top-right) */}
            <div
              className="resize-handle resize-handle-ne"
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />

            {/* Northwest handle (top-left) */}
            <div
              className="resize-handle resize-handle-nw"
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '12px',
                height: '12px',
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};


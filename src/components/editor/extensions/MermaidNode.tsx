/**
 * Custom TipTap extension for Mermaid diagrams
 * Allows inline diagram rendering with click-to-edit functionality
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Check, X } from 'lucide-react';
import { AIEnhanceModal } from '../AIEnhanceModal';

// Initialize mermaid
mermaid.initialize({ 
  startOnLoad: false, 
  securityLevel: 'loose', 
  theme: 'default',
  themeVariables: {
    background: 'transparent'
  }
});

interface MermaidComponentProps {
  node: {
    attrs: {
      code: string;
      scale?: number;
      width?: string;
    };
  };
  updateAttributes: (attrs: Partial<{ code: string; scale: number; width: string }>) => void;
  deleteNode: () => void;
  selected: boolean;
}

const MermaidComponent: React.FC<MermaidComponentProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode,
  selected 
}) => {
  console.log('🎨 MermaidComponent MOUNTED/UPDATED');
  console.log('  Node attrs:', node.attrs);
  console.log('  Code length:', node.attrs.code?.length || 0);
  console.log('  Code:', node.attrs.code);
  console.log('  Selected:', selected);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(node.attrs.code);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAIEnhance, setShowAIEnhance] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramWrapperRef = useRef<HTMLDivElement>(null);

  // Render diagram whenever code changes
  useEffect(() => {
    console.log('🔄 MermaidComponent useEffect TRIGGERED');
    console.log('  Code:', node.attrs.code);
    
    const renderDiagram = async () => {
      console.log('  🎨 Starting mermaid.render()...');
      try {
        // Generate valid CSS ID (no dots, use integers only)
        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        console.log('  🆔 Generated ID:', id);
        
        const { svg } = await mermaid.render(id, node.attrs.code);
        console.log('  ✅ Mermaid rendered successfully! SVG length:', svg.length);
        
        setSvgContent(svg);
        setError(null);
      } catch (err: any) {
        console.log('  ❌ Mermaid render FAILED:', err);
        setError(err?.message || 'Failed to render diagram');
        setSvgContent('');
      }
    };

    if (node.attrs.code) {
      console.log('  ✅ Code exists, calling renderDiagram()');
      renderDiagram();
    } else {
      console.log('  ⚠️  NO CODE! Skipping render');
    }
  }, [node.attrs.code]);

  const handleSave = async () => {
    // Validate before saving
    try {
      // Generate valid CSS ID (no dots, use integers only)
      const id = `validate-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await mermaid.render(id, editCode);
      updateAttributes({ code: editCode });
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Invalid diagram syntax');
    }
  };

  const handleCancel = () => {
    setEditCode(node.attrs.code);
    setIsEditing(false);
    setError(null);
  };

  const handleAIEnhance = () => {
    setShowAIEnhance(true);
  };

  const handleApplyEnhancement = (enhancedCode: string) => {
    setEditCode(enhancedCode);
    updateAttributes({ code: enhancedCode });
    setShowAIEnhance(false);
  };

  // Drag-resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    const currentWidth = diagramWrapperRef.current?.offsetWidth || 780;
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(300, Math.min(1200, resizeStartWidth + deltaX));
      updateAttributes({ width: `${newWidth}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, resizeStartWidth]);

  const handleFitToWidth = () => {
    updateAttributes({ width: '100%', scale: 1 });
  };

  console.log('🖼️  MermaidComponent RENDER');
  console.log('  svgContent length:', svgContent.length);
  console.log('  error:', error);
  console.log('  isEditing:', isEditing);
  
  // Apply scale to rendered SVG element
  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null;
    if (svg) {
      const scale = (node as any).attrs?.scale ?? 1;
      svg.style.width = `${Math.max(0.25, Math.min(3, scale)) * 100}%`;
      svg.style.height = 'auto';
    }
  }, [svgContent, (node as any).attrs?.scale]);

  const currentWidth = node.attrs.width || '780px';

  return (
    <NodeViewWrapper className="mermaid-node">
      <div
        ref={containerRef}
        className={`relative rounded-md p-2 my-2 transition-all mx-auto ${
          selected ? 'bg-transparent' : 'bg-transparent'
        }`}
        style={{ 
          minHeight: '100px',
          maxWidth: currentWidth === '100%' ? '100%' : currentWidth,
          width: currentWidth === '100%' ? '100%' : 'auto'
        }}
      >
        <div ref={diagramWrapperRef} className="relative">

        {/* Diagram or Error Display */}
        {error ? (
          <div className="text-center py-8">
            <div className="text-destructive font-medium mb-2">⚠️ Diagram Error</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Edit Diagram
              </Button>
              <Button size="sm" variant="outline" onClick={deleteNode}>
                Delete
              </Button>
            </div>
          </div>
        ) : svgContent ? (
          <div
            className="mermaid-svg-container cursor-pointer"
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Loading diagram...
          </div>
        )}

        {/* Inline controls */}
        {!error && svgContent && (
          <>
            <div className="absolute -top-3 right-0 flex items-center gap-1 bg-background/90 backdrop-blur px-1 rounded-md shadow border">
              <Button size="xs" variant="ghost" onClick={() => setIsEditing(true)} className="h-6 px-2 text-xs">Edit</Button>
              <Button size="xs" variant="ghost" onClick={() => updateAttributes({ scale: Math.max(((node as any).attrs?.scale ?? 1) - 0.1, 0.25) })} className="h-6 px-2 text-xs">-</Button>
              <span className="text-[11px] text-muted-foreground px-1">{Math.round(((node as any).attrs?.scale ?? 1) * 100)}%</span>
              <Button size="xs" variant="ghost" onClick={() => updateAttributes({ scale: Math.min(((node as any).attrs?.scale ?? 1) + 0.1, 3) })} className="h-6 px-2 text-xs">+</Button>
              <Button size="xs" variant="ghost" onClick={handleFitToWidth} className="h-6 px-2 text-xs">↔ Full Width</Button>
            </div>

            {/* Drag resize handle */}
            <div
              className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20 transition-colors group"
              onMouseDown={handleResizeStart}
              style={{ cursor: isResizing ? 'ew-resize' : 'col-resize' }}
            >
              <div className="absolute inset-y-0 right-0 w-1 bg-primary/40 group-hover:bg-primary/60 rounded-l" />
            </div>
          </>
        )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Mermaid Diagram</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Code Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Diagram Code
              </label>
              <Textarea
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="font-mono text-sm h-64"
                placeholder="flowchart TD&#10;  A[Start] --> B[End]"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIEnhance}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Enhance
                </Button>

                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Enhancement Modal */}
      <AIEnhanceModal
        isOpen={showAIEnhance}
        onClose={() => setShowAIEnhance(false)}
        currentCode={editCode}
        diagramType="Mermaid"
        onApply={handleApplyEnhancement}
      />
    </NodeViewWrapper>
  );
};

export const MermaidNode = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: 'flowchart TD\n  A[Start] --> B[End]',
      },
      scale: {
        default: 1,
        renderHTML: (attributes: any) => ({ 'data-scale': attributes.scale }),
        parseHTML: (element: HTMLElement) => {
          const s = element.getAttribute('data-scale');
          return s ? parseFloat(s) : 1;
        }
      },
      width: {
        default: '780px',
        renderHTML: (attributes: any) => ({ 'data-width': attributes.width }),
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-width') || '780px';
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
        getAttrs: (dom) => {
          if (dom instanceof HTMLElement) {
            const raw = dom.getAttribute('data-code') || '';
            // Decode common HTML entities used when embedding code in attributes
            const code = raw
              .replace(/&#10;/g, '\n')
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&');
            return { code };
          }
          return {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'mermaid',
      'data-code': node.attrs.code,
      'data-scale': node.attrs.scale,
      'data-width': node.attrs.width 
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidComponent);
  },

  addCommands() {
    return {
      setMermaid: (code: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { code },
        });
      },
    };
  },
});

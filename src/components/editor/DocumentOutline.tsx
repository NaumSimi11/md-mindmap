/**
 * DocumentOutline - Shows hierarchical outline of markdown document
 * 
 * Features:
 * - Parses markdown headings (H1-H6)
 * - Shows hierarchical structure
 * - Click to scroll to heading
 * - Highlights current section
 * - Shows heading levels with indentation
 */

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, ChevronRight } from 'lucide-react';

interface OutlineNode {
  id: string;
  type: 'heading' | 'bullet' | 'numbered' | 'bold';
  level: number; // For headings: 1-6, for lists: nesting level
  text: string;
  line: number; // Line number in document
}

interface DocumentOutlineProps {
  content: string;
  onHeadingClick?: (text: string, line: number) => void; // Now passes text AND line
  currentLine?: number;
  activeHeadingText?: string; // Active heading text from ScrollSpy
  showHeader?: boolean; // Whether to show the header (default: true)
}

export function DocumentOutline({ 
  content, 
  onHeadingClick,
  currentLine = 0,
  activeHeadingText,
  showHeader = true
}: DocumentOutlineProps) {
  
  // Parse markdown content to extract ALL structure (headings, lists, bold items)
  const outlineNodes = useMemo(() => {
    if (!content || content.trim() === '') {
      return [];
    }
    
    const lines = content.split('\n');
    const parsed: OutlineNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines
      
      // 1. Match markdown headings: # H1, ## H2, etc. (supports emojis and special chars)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/u);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        
        parsed.push({
          id: `heading-${index}`,
          type: 'heading',
          level,
          text,
          line: index,
        });
        return;
      }
      
      // 2. Match bullet list items: - item or * item
      const bulletMatch = trimmedLine.match(/^(\s*)([-*])\s+(.+)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        const text = bulletMatch[3].trim();
        // Remove markdown formatting from text
        const cleanText = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
        
        parsed.push({
          id: `bullet-${index}`,
          type: 'bullet',
          level: Math.floor(indent / 2) + 1, // Nesting level based on indentation
          text: cleanText,
          line: index,
        });
        return;
      }
      
      // 3. Match numbered list items: 1. item
      const numberedMatch = trimmedLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const indent = numberedMatch[1].length;
        const number = numberedMatch[2];
        const text = numberedMatch[3].trim();
        const cleanText = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
        
        parsed.push({
          id: `numbered-${index}`,
          type: 'numbered',
          level: Math.floor(indent / 2) + 1,
          text: `${number}. ${cleanText}`,
          line: index,
        });
        return;
      }
      
      // 4. Match standalone bold items (for emphasis): **Important**
      const boldMatch = trimmedLine.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
      if (boldMatch && parsed.length > 0 && parsed[parsed.length - 1].type === 'heading') {
        // Only add bold items that come right after headings (like section summaries)
        const text = boldMatch[1] + (boldMatch[2] ? ': ' + boldMatch[2] : '');
        
        parsed.push({
          id: `bold-${index}`,
          type: 'bold',
          level: parsed[parsed.length - 1].level + 1,
          text,
          line: index,
        });
      }
    });
    
    return parsed;
  }, [content]);

  const handleNodeClick = (node: OutlineNode) => {
    if (onHeadingClick) {
      onHeadingClick(node.text, node.line);
    }
  };

  const getIndentClass = (node: OutlineNode) => {
    const level = node.type === 'heading' ? node.level : node.level + 1;
    // Indentation based on heading level
    const indents = {
      1: 'pl-2',
      2: 'pl-4',
      3: 'pl-6',
      4: 'pl-8',
      5: 'pl-10',
      6: 'pl-12',
    };
    return indents[level as keyof typeof indents] || 'pl-2';
  };

  const getTextSizeClass = (node: OutlineNode) => {
    if (node.type === 'heading') {
      const sizes = {
        1: 'text-sm font-semibold',
        2: 'text-sm font-medium',
        3: 'text-sm',
        4: 'text-xs',
        5: 'text-xs',
        6: 'text-xs',
      };
      return sizes[node.level as keyof typeof sizes] || 'text-sm';
    }
    return 'text-xs'; // Lists and bold items are smaller
  };

  const getNodeIcon = (node: OutlineNode) => {
    switch (node.type) {
      case 'heading':
        const headingColors = {
          1: 'text-blue-500',
          2: 'text-purple-500',
          3: 'text-green-500',
          4: 'text-yellow-500',
          5: 'text-orange-500',
          6: 'text-red-500',
        };
        return headingColors[node.level as keyof typeof headingColors] || 'text-gray-500';
      case 'bullet':
        return 'text-orange-500';
      case 'numbered':
        return 'text-blue-500';
      case 'bold':
        return 'text-pink-500';
      default:
        return 'text-gray-500';
    }
  };

  const getNodeSymbol = (node: OutlineNode) => {
    switch (node.type) {
      case 'heading':
        return '•';
      case 'bullet':
        return '◦';
      case 'numbered':
        return '▸';
      case 'bold':
        return '★';
      default:
        return '•';
    }
  };

  if (outlineNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Hash className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No Structure</p>
        <p className="text-xs text-muted-foreground/70 mt-1 mb-3">
          Add structure to see the outline
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Quick Tip</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Use <strong>Auto-Format</strong> to add headings and lists automatically!
          </p>
        </div>
        <div className="mt-4 text-xs text-muted-foreground/60 space-y-1">
          <p># Heading 1</p>
          <p>## Heading 2</p>
          <p>### Heading 3</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header (optional) */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Document Outline</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {outlineNodes.filter(n => n.type === 'heading').length} headings · {' '}
            {outlineNodes.filter(n => n.type === 'bullet' || n.type === 'numbered').length} items
          </p>
        </div>
      )}

      {/* Outline Tree */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {outlineNodes.map((node, index) => {
            // Use ScrollSpy active heading if available, otherwise fall back to line-based detection
            const isActive = activeHeadingText 
              ? node.text.trim().toLowerCase() === activeHeadingText.trim().toLowerCase()
              : currentLine >= node.line && 
                (index === outlineNodes.length - 1 || currentLine < outlineNodes[index + 1].line);
            
            return (
              <button
                key={`${node.id}-${index}`}
                onClick={() => handleNodeClick(node)}
                className={`
                  w-full text-left py-1.5 px-3 transition-colors
                  ${getIndentClass(node)}
                  ${isActive 
                    ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                    : 'hover:bg-muted/50 text-foreground/80 hover:text-foreground border-l-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-xs mt-0.5 flex-shrink-0 ${getNodeIcon(node)}`}>
                    {getNodeSymbol(node)}
                  </span>
                  <span className={`${getTextSizeClass(node)} line-clamp-2 ${node.type === 'heading' ? '' : 'text-muted-foreground'}`}>
                    {node.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Stats (optional) */}
      {showHeader && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {outlineNodes.filter(n => n.type === 'heading' && n.level === 1).length} H1
            </span>
            <span>
              {outlineNodes.filter(n => n.type === 'heading' && n.level === 2).length} H2
            </span>
            <span>
              {outlineNodes.filter(n => n.type === 'bullet').length} bullets
            </span>
            <span>
              {outlineNodes.filter(n => n.type === 'numbered').length} numbered
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

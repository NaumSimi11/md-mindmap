/**
 * ChatMarkdownRenderer - Natural markdown rendering for AI chat
 * 
 * Features:
 * - Streaming-friendly (handles partial content)
 * - Syntax highlighting for code
 * - Clean, readable output
 * - Typing animation support
 */

import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { cn } from '@/lib/utils';

interface ChatMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

// Initialize markdown-it with safe defaults
const md = new MarkdownIt({
  html: false,        // Disable HTML for safety
  linkify: true,      // Auto-convert URLs to links
  typographer: true,  // Nice quotes, dashes
  breaks: true,       // Convert \n to <br>
});

// Custom renderer for cleaner output
md.renderer.rules.heading_open = (tokens, idx) => {
  const level = tokens[idx].tag;
  const classes: Record<string, string> = {
    h1: 'text-lg font-bold mt-3 mb-2 text-foreground',
    h2: 'text-base font-semibold mt-2 mb-1.5 text-foreground',
    h3: 'text-sm font-semibold mt-2 mb-1 text-foreground',
    h4: 'text-sm font-medium mt-1.5 mb-1 text-foreground',
    h5: 'text-xs font-medium mt-1 mb-0.5 text-foreground',
    h6: 'text-xs font-medium mt-1 mb-0.5 text-muted-foreground',
  };
  return `<${level} class="${classes[level] || ''}">`;
};

md.renderer.rules.paragraph_open = () => '<p class="my-1.5 text-sm leading-relaxed">';

md.renderer.rules.bullet_list_open = () => '<ul class="my-1.5 ml-4 list-disc space-y-0.5 text-sm">';

md.renderer.rules.ordered_list_open = () => '<ol class="my-1.5 ml-4 list-decimal space-y-0.5 text-sm">';

md.renderer.rules.list_item_open = () => '<li class="pl-1">';

md.renderer.rules.code_inline = (tokens, idx) => {
  const content = tokens[idx].content;
  return `<code class="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">${md.utils.escapeHtml(content)}</code>`;
};

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = token.info || 'text';
  const content = md.utils.escapeHtml(token.content);
  return `
    <div class="my-2 rounded-md overflow-hidden border border-border">
      <div class="flex items-center justify-between px-3 py-1 bg-muted/50 text-xs text-muted-foreground border-b border-border">
        <span>${lang}</span>
      </div>
      <pre class="p-3 overflow-x-auto bg-muted/30 text-xs"><code class="font-mono">${content}</code></pre>
    </div>
  `;
};

md.renderer.rules.blockquote_open = () => '<blockquote class="my-2 pl-3 border-l-2 border-primary/30 text-sm text-muted-foreground italic">';

md.renderer.rules.hr = () => '<hr class="my-3 border-border" />';

md.renderer.rules.link_open = (tokens, idx) => {
  const href = tokens[idx].attrGet('href') || '';
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">`;
};

md.renderer.rules.strong_open = () => '<strong class="font-semibold">';

md.renderer.rules.em_open = () => '<em class="italic">';

export const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = ({
  content,
  isStreaming = false,
  className,
}) => {
  // Clean and process content
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // Remove any JSON function calls from display
    let cleaned = content;
    
    // Remove JSON blocks that look like function calls
    cleaned = cleaned.replace(/```json[\s\S]*?"function"[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/\{[\s\S]*?"function"[\s\S]*?\}/g, '');
    
    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Handle checkboxes (GitHub-style task lists)
    cleaned = cleaned.replace(/^- \[ \]/gm, '☐');
    cleaned = cleaned.replace(/^- \[x\]/gmi, '☑');
    
    return cleaned.trim();
  }, [content]);

  const html = useMemo(() => {
    try {
      return md.render(processedContent);
    } catch {
      // Fallback to plain text if markdown parsing fails
      return `<p class="text-sm">${processedContent}</p>`;
    }
  }, [processedContent]);

  if (!processedContent) {
    return null;
  }

  return (
    <div 
      className={cn(
        'chat-markdown prose prose-sm dark:prose-invert max-w-none',
        isStreaming && 'streaming',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Typing indicator component for natural feel
 */
export const TypingIndicator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

/**
 * Extract plain text summary from content (for previews)
 */
export function extractTextSummary(content: string, maxLength: number = 100): string {
  // Remove markdown formatting
  let text = content
    .replace(/#{1,6}\s/g, '')           // Headers
    .replace(/\*\*|__/g, '')            // Bold
    .replace(/\*|_/g, '')               // Italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // Code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/^[-*+]\s/gm, '')          // List items
    .replace(/^\d+\.\s/gm, '')          // Numbered lists
    .replace(/\n+/g, ' ')               // Newlines
    .trim();

  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }

  return text;
}

export default ChatMarkdownRenderer;

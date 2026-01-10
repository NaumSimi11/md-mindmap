/**
 * TemplatePreview - Rich markdown preview component for templates
 * 
 * Features:
 * - Renders markdown content with proper styling
 * - Supports truncation for previews
 * - Beautiful themed design
 * - Handles all template types (markdown, mindmap, presentation)
 */

import { useMemo } from 'react';
import { FileText, Brain, Presentation, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DocumentTemplate } from '@/services/workspace-legacy/DocumentTemplates';

interface TemplatePreviewProps {
  template: DocumentTemplate;
  maxLength?: number;
  showFull?: boolean;
  onUse?: () => void;
  className?: string;
}

export function TemplatePreview({
  template,
  maxLength = 500,
  showFull = false,
  onUse,
  className = '',
}: TemplatePreviewProps) {
  const getTypeIcon = () => {
    switch (template.type) {
      case 'markdown':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'mindmap':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'presentation':
        return <Presentation className="h-4 w-4 text-pink-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (template.type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
    }
  };

  const getTypeColor = () => {
    switch (template.type) {
      case 'markdown':
        return 'from-blue-500/20 to-sky-500/20 border-blue-500/30';
      case 'mindmap':
        return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
      case 'presentation':
        return 'from-pink-500/20 to-rose-500/20 border-pink-500/30';
    }
  };

  // Parse and render markdown preview
  const renderedPreview = useMemo(() => {
    if (template.type !== 'markdown') {
      // For non-markdown types, show structured info
      try {
        const data = JSON.parse(template.content);
        if (template.type === 'presentation') {
          return (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                {data.title || 'Presentation'}
              </div>
              <div className="text-xs text-muted-foreground">
                {data.slides?.length || 0} slides
              </div>
              {data.slides?.slice(0, 3).map((slide: any, i: number) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-background/50 border border-border/40 text-xs"
                >
                  <div className="font-medium text-foreground/80">
                    {slide.content?.title || `Slide ${i + 1}`}
                  </div>
                  {slide.content?.subtitle && (
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      {slide.content.subtitle}
                    </div>
                  )}
                </div>
              ))}
              {(data.slides?.length || 0) > 3 && (
                <div className="text-[10px] text-muted-foreground">
                  +{data.slides.length - 3} more slides
                </div>
              )}
            </div>
          );
        }
        if (template.type === 'mindmap') {
          return (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                Mindmap Template
              </div>
              <div className="text-xs text-muted-foreground">
                {data.nodes?.length || 0} nodes
              </div>
              {data.nodes?.slice(0, 4).map((node: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-400/50" />
                  <span className="text-foreground/80">
                    {node.data?.label || `Node ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          );
        }
      } catch {
        return (
          <div className="text-xs text-muted-foreground">
            {template.type} template
          </div>
        );
      }
    }

    // For markdown, render a styled preview
    const content = showFull 
      ? template.content 
      : template.content.substring(0, maxLength);

    // Simple markdown to styled elements
    const lines = content.split('\n');
    
    return (
      <div className="space-y-2 text-sm">
        {lines.slice(0, showFull ? undefined : 20).map((line, i) => {
          // Heading 1
          if (line.startsWith('# ')) {
            return (
              <h1 key={i} className="text-lg font-bold text-foreground">
                {line.substring(2)}
              </h1>
            );
          }
          // Heading 2
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-base font-semibold text-foreground/90 mt-3">
                {line.substring(3)}
              </h2>
            );
          }
          // Heading 3
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-sm font-medium text-foreground/80 mt-2">
                {line.substring(4)}
              </h3>
            );
          }
          // Horizontal rule
          if (line.startsWith('---')) {
            return <hr key={i} className="border-border/40 my-2" />;
          }
          // Checkbox
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const checked = line.startsWith('- [x] ');
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`w-3 h-3 rounded border ${checked ? 'bg-primary border-primary' : 'border-border'}`}>
                  {checked && <span className="text-[8px] text-primary-foreground">✓</span>}
                </div>
                <span className={checked ? 'line-through' : ''}>
                  {line.substring(6)}
                </span>
              </div>
            );
          }
          // List item
          if (line.startsWith('- ')) {
            return (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          // Numbered list
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={i} className="text-xs text-muted-foreground pl-2">
                {line}
              </div>
            );
          }
          // Bold text
          if (line.includes('**')) {
            const parts = line.split(/\*\*([^*]+)\*\*/g);
            return (
              <p key={i} className="text-xs text-muted-foreground">
                {parts.map((part, j) => 
                  j % 2 === 1 ? (
                    <strong key={j} className="font-semibold text-foreground/80">{part}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          }
          // Table row (simple detection)
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').filter(Boolean);
            if (cells.some(c => c.includes('---'))) {
              return null; // Skip separator row
            }
            return (
              <div key={i} className="flex gap-2 text-[10px] text-muted-foreground overflow-hidden">
                {cells.slice(0, 4).map((cell, j) => (
                  <div key={j} className="flex-1 truncate px-1 py-0.5 bg-background/30 rounded">
                    {cell.trim()}
                  </div>
                ))}
              </div>
            );
          }
          // Empty line
          if (!line.trim()) {
            return <div key={i} className="h-2" />;
          }
          // Regular paragraph
          return (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">
              {line}
            </p>
          );
        })}
        {!showFull && content.length >= maxLength && (
          <p className="text-xs text-muted-foreground/60 italic">
            ...continue reading
          </p>
        )}
      </div>
    );
  }, [template, maxLength, showFull]);

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`p-4 bg-gradient-to-br ${getTypeColor()} backdrop-blur-xl border-b border-border/40`}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center text-2xl border border-border/40">
            {template.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {template.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {template.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {getTypeIcon()}
              <span className="text-xs text-muted-foreground">
                {getTypeLabel()}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground capitalize">
                {template.category}
              </span>
              {template.featured && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {template.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-background/40 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preview Content */}
      <div className="p-4 bg-background/60 backdrop-blur-xl max-h-80 overflow-y-auto">
        {renderedPreview}
      </div>

      {/* Footer with CTA */}
      {onUse && (
        <div className="p-4 bg-background/40 border-t border-border/40">
          <Button
            onClick={onUse}
            className="w-full bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90 text-primary-foreground shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Use This Template
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * TemplateCard - Compact card for template grids
 */
interface TemplateCardProps {
  template: DocumentTemplate;
  onClick?: () => void;
  isActive?: boolean;
  showBadges?: boolean;
}

export function TemplateCard({
  template,
  onClick,
  isActive = false,
  showBadges = true,
}: TemplateCardProps) {
  const getTypeColor = () => {
    switch (template.type) {
      case 'markdown':
        return 'text-blue-400';
      case 'mindmap':
        return 'text-purple-400';
      case 'presentation':
        return 'text-pink-400';
    }
  };

  const getTypeLabel = () => {
    switch (template.type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-sky-500/10 border-2 border-primary/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]'
          : 'bg-card/30 border border-border/40 hover:bg-card/50 hover:border-primary/40 hover:shadow-xl'
        }
      `}
    >
      {/* Featured indicator */}
      {template.featured && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-background/50 backdrop-blur flex items-center justify-center text-2xl mb-3 border border-border/40 group-hover:scale-105 transition-transform">
        {template.icon}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm text-foreground mb-1 truncate group-hover:text-primary transition-colors">
        {template.name}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {template.description}
      </p>

      {/* Badges */}
      {showBadges && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${getTypeColor()}`}>
            {getTypeLabel()}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {template.category}
          </span>
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </button>
  );
}

/**
 * TemplateCollection - Display a collection of templates
 */
interface TemplateCollectionDisplayProps {
  title: string;
  description?: string;
  icon?: string;
  templates: DocumentTemplate[];
  onTemplateClick?: (template: DocumentTemplate) => void;
  maxVisible?: number;
  onViewAll?: () => void;
}

export function TemplateCollectionDisplay({
  title,
  description,
  icon,
  templates,
  onTemplateClick,
  maxVisible = 6,
  onViewAll,
}: TemplateCollectionDisplayProps) {
  const visibleTemplates = templates.slice(0, maxVisible);
  const hasMore = templates.length > maxVisible;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {hasMore && onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all ({templates.length})
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visibleTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onClick={() => onTemplateClick?.(template)}
          />
        ))}
      </div>
    </div>
  );
}


/**
 * BeautifulSlideRenderer - Enhanced slide renderer with beautiful design system
 * 
 * This renderer uses the BeautifulTheme system for complete design control:
 * - Typography scales
 * - Spacing systems
 * - Visual elements (shadows, borders, gradients)
 * - Layout patterns
 * - Decorative elements
 */

import { useState } from 'react';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import type { Slide } from '@/services/presentation/PresentationGenerator';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';
import { getThemeSpacing, getThemeElementGap, getThemeLayout } from '@/services/presentation/BeautifulThemeSystem';
import { BlockRenderer } from './BlockRenderer';
import { BlockTransformer, type Block, type BlockType } from '@/services/presentation/BlockSystem';
import { ContextualAIMenu, useTextSelection } from './ContextualAIMenu';

interface BeautifulSlideRendererProps {
  slide: Slide;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (slide: Slide) => void;
}

export function BeautifulSlideRenderer({
  slide,
  theme,
  isEditing = false,
  onUpdate,
}: BeautifulSlideRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const spacing = getThemeSpacing(theme, theme.spacingMode || 'normal');
  const layoutConfig = getThemeLayout(theme, slide.layout);
  
  // Contextual AI menu state - DISABLED for now
  // const [contextualMenu, setContextualMenu] = useState<{
  //   text: string;
  //   position: { x: number; y: number };
  // } | null>(null);

  // Detect text selection for contextual menu - DISABLED
  // useTextSelection((text, position) => {
  //   if (isEditing && text.length >= 3) {
  //     setContextualMenu({ text, position });
  //   }
  // });

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render Mermaid diagrams
  useEffect(() => {
    if (slide.content.diagram && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(
            `mermaid-${slide.id}`,
            slide.content.diagram!.code
          );
          mermaidRef.current!.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
          mermaidRef.current!.innerHTML = `<div class="text-red-500 text-sm">Failed to render diagram</div>`;
        }
      };
      renderDiagram();
    }
  }, [slide.content.diagram, slide.id]);

  // Calculate positioning styles
  const positioningStyles: React.CSSProperties = {
    justifyContent: layoutConfig.positioning.vertical === 'center' ? 'center' : 
                   layoutConfig.positioning.vertical === 'bottom' ? 'flex-end' : 'flex-start',
    alignItems: layoutConfig.positioning.horizontal === 'center' ? 'center' : 
                layoutConfig.positioning.horizontal === 'right' ? 'flex-end' : 'flex-start',
  };



  return (
    <div
      className="beautiful-slide-container"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        background: theme.colors.background.default,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.body.family,
        position: 'relative',
        overflow: 'hidden',
        // Add subtle texture/pattern
        backgroundImage: `
          ${theme.colors.background.default},
          radial-gradient(circle at 20% 50%, ${theme.colors.primary.main}15 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, ${theme.colors.secondary.main}15 0%, transparent 50%)
        `,
        boxShadow: theme.visual.shadows.xl,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      {/* Decorative background elements */}
      <div
        className="slide-decoration"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.colors.gradients.primary,
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content container */}
      <div
        className="slide-content"
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: spacing,
          ...positioningStyles,
        }}
      >
        {renderSlideContent(slide, theme, layoutConfig, isEditing, onUpdate)}
      </div>

      {/* Slide number with beautiful styling */}
      <div
        className="slide-number"
        style={{
          position: 'absolute',
          bottom: theme.spacing.scale.md,
          right: theme.spacing.scale.md,
          fontSize: theme.typography.scale.sm,
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.heading.family,
          fontWeight: 500,
          letterSpacing: theme.typography.letterSpacing.wide,
          textTransform: 'uppercase',
          opacity: theme.colors.opacity.medium,
          zIndex: 2,
        }}
      >
        {slide.order + 1}
      </div>

      {/* Contextual AI Menu - DISABLED for now */}
      {/* {contextualMenu && isEditing && (
        <ContextualAIMenu
          selectedText={contextualMenu.text}
          position={contextualMenu.position}
          onClose={() => setContextualMenu(null)}
          onAction={async (action, text) => {
            // Handle AI actions (improve writing, fix grammar, etc.)
            console.log('AI Action:', action, text);
            // TODO: Integrate with AI service
            setContextualMenu(null);
          }}
          onLayoutTransform={(layoutType) => {
            // Convert slide content to block and transform
            const block: Block = {
              id: `block-${slide.id}`,
              type: slide.layout as BlockType,
              content: {
                text: slide.content.body || contextualMenu.text,
                heading: slide.content.title,
              },
              order: 0,
            };
            
            const transformed = BlockTransformer.transform(block, layoutType as BlockType);
            
            // Update slide with transformed content
            if (onUpdate) {
              onUpdate({
                ...slide,
                layout: layoutType as any,
                content: {
                  ...slide.content,
                  ...transformed.content,
                },
              });
            }
            
            setContextualMenu(null);
          }}
        />
      )} */}
    </div>
  );
}

// ============================================================================
// Slide Content Renderers
// ============================================================================

// Custom layout renderer for image-positioned and column layouts
function renderCustomLayout(
  slide: Slide,
  theme: BeautifulTheme,
  isEditing: boolean,
  onUpdate?: (slide: Slide) => void
) {
  const { body = '', image, title } = slide.content;
  const spacing = getThemeSpacing(theme, theme.spacingMode || 'normal');

  // Full Image - Image fills entire slide with optional text overlay
  if (slide.layout === 'full-image') {
    return (
      <div className="h-full relative">
        {image ? (
          <>
            {/* Full background image */}
            <img 
              src={image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            {/* Optional text overlay with dark gradient */}
            {(title || body) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-12">
                <div className="text-white max-w-4xl">
                  {title && (
                    <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl">
                      {title}
                    </h1>
                  )}
                  {body && (
                    <div className="prose prose-lg prose-invert max-w-none drop-shadow-lg">
                      {body}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <div className="text-center text-muted-foreground">
              <p className="text-xl">Click Image button to add a full-screen background image</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image + Text layouts
  if (slide.layout === 'image-left') {
    return (
      <div className="h-full flex items-center gap-8 p-12">
        {image && (
          <div className="flex-1">
            <img src={image} alt="" className="w-full h-auto rounded-2xl shadow-2xl object-cover" style={{ maxHeight: '70vh' }} />
          </div>
        )}
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (slide.layout === 'image-right') {
    return (
      <div className="h-full flex items-center gap-8 p-12">
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
        {image && (
          <div className="flex-1">
            <img src={image} alt="" className="w-full h-auto rounded-2xl shadow-2xl object-cover" style={{ maxHeight: '70vh' }} />
          </div>
        )}
      </div>
    );
  }

  if (slide.layout === 'image-top') {
    return (
      <div className="h-full flex flex-col gap-6 p-12">
        {image && (
          <div className="flex-1">
            <img src={image} alt="" className="w-full h-auto rounded-2xl shadow-2xl object-cover" style={{ maxHeight: '50vh' }} />
          </div>
        )}
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (slide.layout === 'image-bottom') {
    return (
      <div className="h-full flex flex-col gap-6 p-12">
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
        {image && (
          <div className="flex-1">
            <img src={image} alt="" className="w-full h-auto rounded-2xl shadow-2xl object-cover" style={{ maxHeight: '50vh' }} />
          </div>
        )}
      </div>
    );
  }

  // Column layouts
  if (slide.layout === 'two-column') {
    const [col1, col2] = body.split('\n\n---\n\n');
    return (
      <div className="h-full flex items-center gap-8 p-12">
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {col1 || body}
          </div>
        </div>
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {col2 || ''}
          </div>
        </div>
      </div>
    );
  }

  if (slide.layout === 'three-column') {
    const [col1, col2, col3] = body.split('\n\n---\n\n');
    return (
      <div className="h-full flex items-center gap-6 p-12">
        <div className="flex-1">
          <div className="prose max-w-none" style={{ color: theme.colors.text }}>
            {col1 || body}
          </div>
        </div>
        <div className="flex-1">
          <div className="prose max-w-none" style={{ color: theme.colors.text }}>
            {col2 || ''}
          </div>
        </div>
        <div className="flex-1">
          <div className="prose max-w-none" style={{ color: theme.colors.text }}>
            {col3 || ''}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar layouts
  if (slide.layout === 'sidebar-left') {
    return (
      <div className="h-full flex gap-8 p-12">
        <div className="w-80 bg-black/10 rounded-2xl p-6">
          <div className="prose max-w-none" style={{ color: theme.colors.text }}>
            Sidebar content
          </div>
        </div>
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (slide.layout === 'sidebar-right') {
    return (
      <div className="h-full flex gap-8 p-12">
        <div className="flex-1">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
        <div className="w-80 bg-black/10 rounded-2xl p-6">
          <div className="prose max-w-none" style={{ color: theme.colors.text }}>
            Sidebar content
          </div>
        </div>
      </div>
    );
  }

  // Advanced layouts
  if (slide.layout === 'split-image') {
    return (
      <div className="h-full flex">
        <div className="flex-1 flex items-center justify-center p-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
        {image && (
          <div className="flex-1 relative">
            <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  if (slide.layout === 'hero-overlay') {
    return (
      <div className="h-full relative">
        {image && (
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="prose prose-2xl max-w-4xl text-center" style={{ color: theme.colors.text }}>
            {body}
          </div>
        </div>
      </div>
    );
  }

  // Centered layout
  if (slide.layout === 'centered') {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="prose prose-xl max-w-3xl text-center" style={{ color: theme.colors.text }}>
          {slide.content.title && (
            <h1 style={{ color: theme.colors.primary, marginBottom: spacing.section }}>
              {slide.content.title}
            </h1>
          )}
          {body}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="h-full flex items-center justify-center p-12">
      <div className="prose prose-lg max-w-none" style={{ color: theme.colors.text }}>
        {body}
      </div>
    </div>
  );
}

function renderSlideContent(
  slide: Slide,
  theme: BeautifulTheme,
  layoutConfig: ReturnType<typeof getThemeLayout>,
  isEditing: boolean,
  onUpdate?: (slide: Slide) => void
) {
  // Handle custom slide layouts (image positioning, columns, etc.)
  if (slide.layout === 'full-image' || slide.layout === 'image-left' || slide.layout === 'image-right' || 
      slide.layout === 'image-top' || slide.layout === 'image-bottom' ||
      slide.layout === 'two-column' || slide.layout === 'three-column' ||
      slide.layout === 'sidebar-left' || slide.layout === 'sidebar-right' ||
      slide.layout === 'split-image' || slide.layout === 'hero-overlay' ||
      slide.layout === 'centered') {
    return renderCustomLayout(slide, theme, isEditing, onUpdate);
  }

  switch (slide.layout) {
    case 'title':
      return (
        <BeautifulTitleLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      );
    case 'content':
      return (
        <BeautifulContentLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      );
    case 'bullets':
      return (
        <BeautifulBulletsLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      );
    case 'diagram':
      return (
        <BeautifulDiagramLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
        />
      );
    case 'section':
      return (
        <BeautifulSectionLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
        />
      );
    // New block types - render using BlockRenderer if content supports it
    case 'hero':
    case 'cards':
    case 'stats':
    case 'steps':
    case 'cycle':
    case 'funnel':
    case 'pyramid':
    case 'staircase':
    case 'timeline':
    case 'comparison':
    case 'callout':
      // For block-based layouts, use BlockRenderer
      if (slide.content.blocks && slide.content.blocks.length > 0) {
        return (
          <div className="w-full h-full">
            {slide.content.blocks.map((block: Block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                theme={theme}
                isEditing={isEditing}
              />
            ))}
          </div>
        );
      }
      // Fallback to content layout for legacy slides
      return (
        <BeautifulContentLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      );
    default:
      return (
        <BeautifulContentLayout
          slide={slide}
          theme={theme}
          layoutConfig={layoutConfig}
          isEditing={isEditing}
          onUpdate={onUpdate}
        />
      );
  }
}

// ============================================================================
// Beautiful Title Layout
// ============================================================================

function BeautifulTitleLayout({
  slide,
  theme,
  layoutConfig,
  isEditing,
  onUpdate,
}: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [subtitle, setSubtitle] = useState(slide.content.subtitle || '');

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleSubtitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, subtitle },
      });
    }
  };

  // Add null checks for layoutConfig.zones
  const alignment = layoutConfig.zones?.body?.alignment || 'center';
  const maxWidth = layoutConfig.zones?.body?.maxWidth || '100%';

  return (
    <div
      className="title-layout"
      style={{
        textAlign: alignment,
        maxWidth,
        width: '100%',
      }}
    >
      {/* ALWAYS show beautiful design - use contentEditable for editing */}
      {isEditing ? (
        <>
          {/* Beautiful title with gradient - editable */}
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newTitle = e.currentTarget.textContent || '';
              setTitle(newTitle);
              handleTitleBlur();

              // Reset inline edit styling
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            className="slide-title"
            style={{
              fontSize: `clamp(${theme.typography.scale['4xl']}, 5vw, ${theme.typography.scale['6xl']})`,
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              letterSpacing: theme.typography.letterSpacing.tighter,
              marginBottom: theme.spacing.scale.lg,
              background: theme.colors.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 2px 20px ${theme.colors.primary.main}40`,
              fontFamily: theme.typography.heading.family,
              cursor: 'text',
              outline: 'none',
              minHeight: '1.2em',
              border: '2px dashed transparent',
              borderRadius: theme.visual.borders.radius.sm,
              padding: '0.5rem',
              transition: 'all 0.2s',
              textAlign: alignment,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${theme.colors.primary.main}60`;
              e.currentTarget.style.backgroundColor = `${theme.colors.primary.main}10`;
            }}
          >
            {title || 'Slide Title'}
          </h1>

          {/* Beautiful subtitle - editable */}
          {subtitle ? (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newSubtitle = e.currentTarget.textContent || '';
                setSubtitle(newSubtitle);
                handleSubtitleBlur();

                // Reset inline edit styling
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              className="slide-subtitle"
              style={{
                fontSize: `clamp(${theme.typography.scale.xl}, 2vw, ${theme.typography.scale['2xl']})`,
                fontWeight: 400,
                lineHeight: theme.typography.lineHeights.normal,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.scale.xl,
                opacity: theme.colors.opacity.high,
                fontFamily: theme.typography.body.family,
                cursor: 'text',
                outline: 'none',
                minHeight: '1.2em',
                border: '2px dashed transparent',
                borderRadius: theme.visual.borders.radius.sm,
                padding: '0.5rem',
                transition: 'all 0.2s',
                textAlign: alignment,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `${theme.colors.text.secondary}60`;
                e.currentTarget.style.backgroundColor = `${theme.colors.text.secondary}10`;
              }}
            >
              {subtitle}
            </h2>
          ) : (
            <button
              onClick={() => {
                setSubtitle('Subtitle');
                if (onUpdate) {
                  onUpdate({
                    ...slide,
                    content: { ...slide.content, subtitle: 'Subtitle' },
                  });
                }
              }}
              style={{
                fontSize: theme.typography.scale.sm,
                color: theme.colors.text.secondary,
                background: 'transparent',
                border: `1px dashed ${theme.colors.text.secondary}40`,
                borderRadius: theme.visual.borders.radius.sm,
                padding: `${theme.spacing.scale.xs} ${theme.spacing.scale.sm}`,
                cursor: 'pointer',
                opacity: 0.6,
                fontFamily: theme.typography.body.family,
                marginBottom: theme.spacing.scale.xl,
              }}
            >
              + Add Subtitle
            </button>
          )}

          {/* Decorative line */}
          <div
            style={{
              width: '100px',
              height: '4px',
              background: theme.colors.gradients.primary,
              margin: `${theme.spacing.scale.lg} ${alignment === 'center' ? 'auto' : '0'} 0`,
              borderRadius: theme.visual.borders.radius.full,
              boxShadow: theme.visual.shadows.md,
            }}
          />
        </>
      ) : (
        <>
          {/* Main Title with gradient */}
          <h1
            className="slide-title"
            style={{
              fontSize: `clamp(${theme.typography.scale['4xl']}, 5vw, ${theme.typography.scale['6xl']})`,
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              letterSpacing: theme.typography.letterSpacing.tighter,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.scale.lg,
              background: theme.colors.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 2px 20px ${theme.colors.primary.main}40`,
              fontFamily: theme.typography.heading.family,
            }}
          >
            {slide.content.title}
          </h1>

          {/* Subtitle */}
          {slide.content.subtitle && (
            <h2
              className="slide-subtitle"
              style={{
                fontSize: `clamp(${theme.typography.scale.xl}, 2vw, ${theme.typography.scale['2xl']})`,
                fontWeight: 400,
                lineHeight: theme.typography.lineHeights.normal,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.scale.xl,
                opacity: theme.colors.opacity.high,
                fontFamily: theme.typography.body.family,
              }}
            >
              {slide.content.subtitle}
            </h2>
          )}

          {/* Decorative line */}
          <div
            style={{
              width: '100px',
              height: '4px',
              background: theme.colors.gradients.primary,
              margin: `${theme.spacing.scale.lg} ${alignment === 'center' ? 'auto' : '0'} 0`,
              borderRadius: theme.visual.borders.radius.full,
              boxShadow: theme.visual.shadows.md,
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Beautiful Content Layout
// ============================================================================

function BeautifulContentLayout({
  slide,
  theme,
  layoutConfig,
  isEditing,
  onUpdate,
}: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [body, setBody] = useState(slide.content.body || '');

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleBodyBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, body },
      });
    }
  };

  // Add null checks for layoutConfig.zones
  const alignment = layoutConfig.zones?.body?.alignment || 'left';
  const maxWidth = layoutConfig.zones?.body?.maxWidth || '100%';

  return (
    <div
      className="content-layout"
      style={{
        maxWidth,
        width: '100%',
      }}
    >
      {/* Image if present */}
      {slide.content.image && (
        <div
          style={{
            marginBottom: theme.spacing.scale.xl,
            borderRadius: theme.visual.borders.radius.lg,
            overflow: 'hidden',
            boxShadow: theme.visual.shadows.xl,
          }}
        >
          <img
            src={slide.content.image}
            alt={title || 'Slide image'}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            style={{
              fontSize: theme.typography.scale['4xl'],
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              letterSpacing: theme.typography.letterSpacing.tight,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.scale.lg,
              paddingBottom: theme.spacing.scale.md,
              borderBottom: `${theme.visual.borders.width.medium} dashed ${theme.colors.primary.main}40`,
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              outline: 'none',
              width: '100%',
              fontFamily: theme.typography.heading.family,
            }}
            placeholder="Content Title"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={handleBodyBlur}
            style={{
              fontSize: theme.typography.scale.lg,
              lineHeight: theme.typography.lineHeights.relaxed,
              color: theme.colors.text.primary,
              background: 'transparent',
              border: `${theme.visual.borders.width.thin} dashed ${theme.colors.text.secondary}40`,
              borderRadius: theme.visual.borders.radius.md,
              padding: theme.spacing.scale.md,
              outline: 'none',
              width: '100%',
              minHeight: '200px',
              resize: 'vertical',
              fontFamily: theme.typography.body.family,
            }}
            placeholder="Content body..."
          />
        </>
      ) : (
        <>
          {/* Title */}
          <h2
            className="content-title"
            style={{
              fontSize: `clamp(${theme.typography.scale['3xl']}, 4vw, ${theme.typography.scale['4xl']})`,
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              letterSpacing: theme.typography.letterSpacing.tight,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.scale.lg,
              paddingBottom: theme.spacing.scale.md,
              borderBottom: `${theme.visual.borders.width.medium} solid ${theme.colors.primary.main}40`,
              fontFamily: theme.typography.heading.family,
            }}
          >
            {slide.content.title}
          </h2>

          {/* Body Content */}
          <div
            className="content-body"
            style={{
              fontSize: `clamp(${theme.typography.scale.base}, 1.5vw, ${theme.typography.scale.lg})`,
              lineHeight: theme.typography.lineHeights.relaxed,
              color: theme.colors.text.primary,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              fontFamily: theme.typography.body.family,
            }}
            dangerouslySetInnerHTML={{
              __html: slide.content.body?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '',
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Beautiful Bullets Layout
// ============================================================================

function BeautifulBulletsLayout({
  slide,
  theme,
  layoutConfig,
  isEditing,
  onUpdate,
}: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [bullets, setBullets] = useState(slide.content.bullets || []);

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleBulletBlur = (index: number) => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, bullets },
      });
    }
  };

  const gap = getThemeElementGap(theme, theme.spacingMode || 'normal');

  return (
    <div
      className="bullets-layout"
      style={{
        maxWidth: layoutConfig.zones?.body?.maxWidth || '100%',
        width: '100%',
      }}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            style={{
              fontSize: theme.typography.scale['4xl'],
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.scale.xl,
              background: 'transparent',
              border: 'none',
              borderBottom: `${theme.visual.borders.width.medium} dashed ${theme.colors.primary.main}40`,
              outline: 'none',
              width: '100%',
              fontFamily: theme.typography.heading.family,
            }}
            placeholder="Bullet List Title"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {bullets.map((bullet: string, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.scale.md }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: theme.visual.borders.radius.full,
                    background: theme.colors.gradients.primary,
                    marginTop: '0.5em',
                    flexShrink: 0,
                  }}
                />
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...bullets];
                    newBullets[index] = e.target.value;
                    setBullets(newBullets);
                  }}
                  onBlur={() => handleBulletBlur(index)}
                  style={{
                    flex: 1,
                    fontSize: theme.typography.scale.xl,
                    lineHeight: theme.typography.lineHeights.relaxed,
                    color: theme.colors.text.primary,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `${theme.visual.borders.width.thin} dashed ${theme.colors.text.secondary}40`,
                    outline: 'none',
                    fontFamily: theme.typography.body.family,
                  }}
                  placeholder={`Bullet ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Title */}
          <h2
            style={{
              fontSize: `clamp(${theme.typography.scale['3xl']}, 4vw, ${theme.typography.scale['4xl']})`,
              fontWeight: 700,
              lineHeight: theme.typography.lineHeights.tight,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.scale.xl,
              fontFamily: theme.typography.heading.family,
            }}
          >
            {slide.content.title}
          </h2>

          {/* Bullet List */}
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap,
            }}
          >
            {slide.content.bullets?.map((bullet: string, index: number) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing.scale.md,
                }}
              >
                {/* Custom bullet */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: theme.visual.borders.radius.full,
                    background: theme.colors.gradients.primary,
                    marginTop: '0.5em',
                    flexShrink: 0,
                    boxShadow: `0 0 0 4px ${theme.colors.primary.main}20`,
                  }}
                />
                <span
                  style={{
                    fontSize: `clamp(${theme.typography.scale.base}, 1.5vw, ${theme.typography.scale.xl})`,
                    lineHeight: theme.typography.lineHeights.relaxed,
                    color: theme.colors.text.primary,
                    fontFamily: theme.typography.body.family,
                  }}
                >
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Beautiful Diagram Layout
// ============================================================================

function BeautifulDiagramLayout({
  slide,
  theme,
  layoutConfig,
}: any) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (slide.content.diagram && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(
            `mermaid-${slide.id}`,
            slide.content.diagram!.code
          );
          mermaidRef.current!.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
          mermaidRef.current!.innerHTML = `<div style="color: ${theme.colors.error || '#ef4444'}">Failed to render diagram</div>`;
        }
      };
      renderDiagram();
    }
  }, [slide.content.diagram, slide.id, theme]);

  return (
    <div className="diagram-layout" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {slide.content.title && (
        <h2
          style={{
            fontSize: theme.typography.scale['3xl'],
            fontWeight: 700,
            lineHeight: theme.typography.lineHeights.tight,
            color: theme.colors.primary.main,
            marginBottom: theme.spacing.scale.lg,
            fontFamily: theme.typography.heading.family,
          }}
        >
          {slide.content.title}
        </h2>
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div ref={mermaidRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    </div>
  );
}

// ============================================================================
// Beautiful Section Layout
// ============================================================================

function BeautifulSectionLayout({
  slide,
  theme,
  layoutConfig,
}: any) {
  return (
    <div
      className="section-layout"
      style={{
        textAlign: 'center',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontSize: `clamp(${theme.typography.scale['5xl']}, 8vw, ${theme.typography.scale['6xl']})`,
          fontWeight: 700,
          lineHeight: theme.typography.lineHeights.tight,
          letterSpacing: theme.typography.letterSpacing.tighter,
          background: theme.colors.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: theme.typography.heading.family,
        }}
      >
        {slide.content.title}
      </h1>
    </div>
  );
}


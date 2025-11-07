/**
 * BlockRenderer - Renders Gamma-style blocks
 * 
 * Each block can be transformed via drag-to-layout
 */

import { useState } from 'react';
import type { Block, BlockType } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';
import { LayoutSelectorModal } from './LayoutSelectorModal';
import { Layout } from 'lucide-react';
import { CardsBlock, StepsBlock, HeroBlock, StatsBlock, FunnelBlock, CycleBlock, TimelineBlock, ComparisonBlock, PyramidBlock, CalloutBlock } from '@/components/blocks';

interface BlockRendererProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
  onTransform?: (blockId: string, newType: BlockType) => void;
}

export function BlockRenderer({
  block,
  theme,
  isEditing = false,
  onUpdate,
  onTransform,
}: BlockRendererProps) {
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const layoutType = e.dataTransfer.getData('layout-type') as BlockType;
    if (layoutType && onTransform) {
      onTransform(block.id, layoutType);
    }
  };

  const handleLayoutClick = () => {
    if (isEditing) {
      setShowLayoutSelector(true);
    }
  };

  const handleLayoutSelect = (layoutType: BlockType) => {
    if (onTransform) {
      onTransform(block.id, layoutType);
    }
    setShowLayoutSelector(false);
  };

  return (
    <>
      <div
        className={`
          relative block-container
          ${isEditing ? 'group cursor-pointer' : ''}
          ${isDraggingOver ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleLayoutClick}
      >
        {/* Block content */}
        {renderBlockContent(block, theme, isEditing, onUpdate)}

        {/* Layout change button (editing mode) */}
        {isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-2 rounded-lg bg-background/90 backdrop-blur-sm border shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowLayoutSelector(true);
              }}
              title="Change layout"
            >
              <Layout className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drop indicator */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
            <div className="text-primary font-medium">Drop to change layout</div>
          </div>
        )}
      </div>

      {/* Layout selector modal */}
      {isEditing && (
        <LayoutSelectorModal
          open={showLayoutSelector}
          onOpenChange={setShowLayoutSelector}
          onLayoutSelect={handleLayoutSelect}
          targetBlockId={block.id}
        />
      )}
    </>
  );
}

function renderBlockContent(
  block: Block,
  theme: BeautifulTheme,
  isEditing: boolean,
  onUpdate?: (block: Block) => void
) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'heading':
      return <HeadingBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'cards':
      // Use new beautiful CardsBlock component
      return <CardsBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'stats':
      // Use new beautiful StatsBlock component
      return <StatsBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'steps':
      // Use new beautiful StepsBlock component
      return <StepsBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'cycle':
      // Use new beautiful CycleBlock component
      return <CycleBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'funnel':
      // Use new beautiful FunnelBlock component
      return <FunnelBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'pyramid':
      // Use new beautiful PyramidBlock component
      return <PyramidBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'hero':
      // Use new beautiful HeroBlock component
      return <HeroBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'timeline':
      // Use new beautiful TimelineBlock component
      return <TimelineBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'comparison':
      // Use new beautiful ComparisonBlock component
      return <ComparisonBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    case 'callout':
      // Use new beautiful CalloutBlock component
      return <CalloutBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    
    default:
      return <TextBlock block={block} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
  }
}

// ============================================================================
// Block Components
// ============================================================================

function TextBlock({ block, theme, isEditing, onUpdate }: any) {
  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: theme.colors.background.paper,
        color: theme.colors.text.primary,
        borderRadius: theme.visual.borders.radius.lg,
        padding: theme.spacing.contentPadding.normal,
      }}
    >
      <p style={{ fontSize: theme.typography.scale.base, lineHeight: theme.typography.lineHeights.relaxed }}>
        {block.content.text || block.content.html || 'Empty text block'}
      </p>
    </div>
  );
}

function HeadingBlock({ block, theme, isEditing, onUpdate }: any) {
  const level = block.content.level || 1;
  const fontSize = theme.typography.scale[level === 1 ? '4xl' : level === 2 ? '3xl' : '2xl'];
  
  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: theme.colors.background.paper,
        color: theme.colors.text.primary,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      <h1
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: theme.typography.lineHeights.tight,
          color: theme.colors.primary.main,
        }}
      >
        {block.content.heading || 'Heading'}
      </h1>
    </div>
  );
}

function CardsBlock({ block, theme, isEditing, onUpdate }: any) {
  const cards = block.content.cards || [];
  const columns = Math.min(cards.length, 3);

  return (
    <div
      className="grid gap-6 p-6 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
        gap: theme.spacing.elementGap.normal,
      }}
    >
      {cards.map((card: any, index: number) => (
        <div
          key={index}
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: theme.colors.background.default,
            borderColor: theme.colors.primary.main + '40',
            borderWidth: '1px',
            borderRadius: theme.visual.borders.radius.md,
            boxShadow: theme.visual.shadows.sm,
          }}
        >
          <h3
            className="font-semibold mb-2"
            style={{
              fontSize: theme.typography.scale.xl,
              color: theme.colors.primary.main,
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontSize: theme.typography.scale.base,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}
          >
            {card.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatsBlock({ block, theme, isEditing, onUpdate }: any) {
  const stats = block.content.stats || [];
  const statType = block.content.statType || 'ring';

  return (
    <div
      className="grid gap-6 p-6 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      {stats.map((stat: any, index: number) => (
        <div key={index} className="text-center">
          <div
            className="text-4xl font-bold mb-2"
            style={{
              color: theme.colors.primary.main,
              fontSize: theme.typography.scale['5xl'],
            }}
          >
            {stat.number}
          </div>
          <div
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.scale.sm,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepsBlock({ block, theme, isEditing, onUpdate }: any) {
  const steps = block.content.steps || [];

  return (
    <div
      className="space-y-4 p-6 rounded-lg"
      style={{
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      {steps.map((step: any, index: number) => (
        <div key={index} className="flex gap-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            style={{
              backgroundColor: theme.colors.primary.main,
              color: theme.colors.primary.contrast,
            }}
          >
            {step.number || index + 1}
          </div>
          <div className="flex-1">
            <h4
              className="font-semibold mb-1"
              style={{
                fontSize: theme.typography.scale.lg,
                color: theme.colors.text.primary,
              }}
            >
              {step.title}
            </h4>
            <p
              style={{
                fontSize: theme.typography.scale.base,
                color: theme.colors.text.secondary,
              }}
            >
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CycleBlock({ block, theme, isEditing, onUpdate }: any) {
  const items = block.content.cycleItems || [];

  return (
    <div
      className="p-6 rounded-lg flex items-center justify-center"
      style={{
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      <div className="flex flex-wrap gap-4 items-center justify-center">
        {items.map((item: string, index: number) => (
          <div
            key={index}
            className="px-4 py-2 rounded-full border"
            style={{
              backgroundColor: theme.colors.background.default,
              borderColor: theme.colors.primary.main + '40',
              color: theme.colors.text.primary,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelBlock({ block, theme, isEditing, onUpdate }: any) {
  const items = block.content.funnelItems || [];

  return (
    <div
      className="p-6 rounded-lg space-y-2"
      style={{
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      {items.map((item: any, index: number) => (
        <div
          key={index}
          className="p-4 rounded"
          style={{
            width: `${item.value}%`,
            backgroundColor: theme.colors.primary.main + '20',
            borderLeft: `4px solid ${theme.colors.primary.main}`,
          }}
        >
          <div style={{ color: theme.colors.text.primary }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function PyramidBlock({ block, theme, isEditing, onUpdate }: any) {
  const items = block.content.funnelItems || [];

  return (
    <div
      className="p-6 rounded-lg flex flex-col items-center space-y-2"
      style={{
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.visual.borders.radius.lg,
      }}
    >
      {items.reverse().map((item: any, index: number) => (
        <div
          key={index}
          className="p-4 rounded text-center"
          style={{
            width: `${item.value}%`,
            backgroundColor: theme.colors.primary.main + '20',
            borderTop: `4px solid ${theme.colors.primary.main}`,
            color: theme.colors.text.primary,
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}


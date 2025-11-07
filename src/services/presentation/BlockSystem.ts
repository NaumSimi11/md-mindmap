/**
 * Block System - Gamma-style block-based architecture
 * 
 * Each slide can contain multiple blocks that can be transformed via drag-to-layout
 */

// ============================================================================
// Block Types (Gamma-style)
// ============================================================================

export type BlockType =
  | 'text'           // Plain text/paragraph
  | 'heading'       // Heading block
  | 'cards'         // Card group (2, 3, or 4 columns)
  | 'stats'         // Statistics block (ring, bar, pie charts)
  | 'steps'         // Step-by-step process
  | 'cycle'         // Circular process flow
  | 'funnel'        // Funnel visualization
  | 'pyramid'       // Pyramid/hierarchy
  | 'staircase'     // Staircase/steps layout
  | 'flower'        // Flower/radial layout
  | 'circle'        // Circle layout
  | 'ring'          // Ring layout
  | 'semi-circle'   // Semi-circle layout
  | 'hero'          // Hero block (large title + image)
  | 'image'         // Image block
  | 'quote'         // Quote block
  | 'callout'       // Callout/alert block
  | 'two-column'    // Two-column text
  | 'three-column'  // Three-column text
  | 'comparison'    // Comparison table
  | 'timeline'      // Timeline
  | 'checklist';    // Checklist

// ============================================================================
// Block Interface
// ============================================================================

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  style?: BlockStyle;
  layout?: BlockLayout;
  order: number; // Order within slide
}

export interface BlockContent {
  // Text content
  text?: string;
  html?: string;
  
  // Heading
  heading?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Cards
  cards?: CardItem[];
  
  // Stats
  stats?: StatItem[];
  statType?: 'ring' | 'bar' | 'pie' | 'circle';
  
  // Steps/Process
  steps?: StepItem[];
  
  // Cycle
  cycleItems?: string[];
  
  // Funnel
  funnelItems?: FunnelItem[];
  
  // Image
  image?: string;
  imageAlt?: string;
  
  // Quote
  quote?: {
    text: string;
    author?: string;
  };
  
  // Columns
  columns?: {
    left?: string;
    right?: string;
    middle?: string;
  };
  
  // Comparison
  comparison?: ComparisonItem[];
  
  // Timeline
  timeline?: TimelineItem[];
  
  // Checklist
  checklist?: ChecklistItem[];
}

export interface CardItem {
  title: string;
  body: string;
  image?: string;
  icon?: string;
}

export interface StatItem {
  number: string;
  label: string;
  color?: string;
}

export interface StepItem {
  number?: number;
  title: string;
  description: string;
  icon?: string;
}

export interface FunnelItem {
  label: string;
  value: number;
  color?: string;
}

export interface ComparisonItem {
  feature: string;
  optionA: string;
  optionB: string;
  optionC?: string;
}

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface BlockStyle {
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
  shadow?: string;
}

export interface BlockLayout {
  columns?: number;
  gap?: string;
  alignment?: 'left' | 'center' | 'right';
  direction?: 'horizontal' | 'vertical';
}

// ============================================================================
// Layout Definition (for drag-to-layout)
// ============================================================================

export interface LayoutDefinition {
  id: BlockType;
  name: string;
  description: string;
  icon: string; // Icon component name or SVG path
  category: 'content' | 'visualization' | 'structure' | 'media';
  minItems?: number;
  maxItems?: number;
}

// ============================================================================
// Layout Registry
// ============================================================================

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: 'text',
    name: 'Text',
    description: 'Plain text block',
    icon: 'Type',
    category: 'content',
  },
  {
    id: 'heading',
    name: 'Heading',
    description: 'Heading block',
    icon: 'Heading',
    category: 'content',
  },
  {
    id: 'cards',
    name: 'Cards',
    description: 'Card group layout',
    icon: 'LayoutGrid',
    category: 'structure',
    minItems: 2,
    maxItems: 4,
  },
  {
    id: 'stats',
    name: 'Stats',
    description: 'Statistics layout',
    icon: 'Percent',
    category: 'visualization',
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    description: 'Pyramid layout',
    icon: 'Triangle',
    category: 'visualization',
  },
  {
    id: 'funnel',
    name: 'Funnel',
    description: 'Funnel layout',
    icon: 'Filter',
    category: 'visualization',
  },
  {
    id: 'staircase',
    name: 'Staircase',
    description: 'Staircase layout',
    icon: 'Stairs',
    category: 'structure',
  },
  {
    id: 'steps',
    name: 'Steps',
    description: 'Step-by-step layout',
    icon: 'List',
    category: 'structure',
  },
  {
    id: 'cycle',
    name: 'Cycle',
    description: 'Cycle layout',
    icon: 'RefreshCw',
    category: 'visualization',
  },
  {
    id: 'flower',
    name: 'Flower',
    description: 'Flower layout',
    icon: 'Flower',
    category: 'visualization',
  },
  {
    id: 'circle',
    name: 'Circle',
    description: 'Circle layout',
    icon: 'Circle',
    category: 'structure',
  },
  {
    id: 'ring',
    name: 'Ring',
    description: 'Ring layout',
    icon: 'CircleDot',
    category: 'structure',
  },
  {
    id: 'semi-circle',
    name: 'Semi-circle',
    description: 'Semi-circle layout',
    icon: 'HalfCircle',
    category: 'structure',
  },
];

// ============================================================================
// Block Transformer (converts content between block types)
// ============================================================================

export class BlockTransformer {
  /**
   * Transform a block from one type to another
   */
  static transform(block: Block, newType: BlockType): Block {
    const transformed: Block = {
      ...block,
      type: newType,
      content: this.convertContent(block.content, block.type, newType),
    };

    return transformed;
  }

  /**
   * Convert content from one block type to another
   */
  private static convertContent(
    content: BlockContent,
    fromType: BlockType,
    toType: BlockType
  ): BlockContent {
    // If same type, return as-is
    if (fromType === toType) {
      return content;
    }

    // Extract text content
    const textContent = content.text || content.html || '';
    const lines = textContent.split('\n').filter(l => l.trim());

    switch (toType) {
      case 'cards':
        return this.toCards(content, lines);
      
      case 'steps':
        return this.toSteps(content, lines);
      
      case 'cycle':
        return this.toCycle(content, lines);
      
      case 'stats':
        return this.toStats(content, lines);
      
      case 'funnel':
        return this.toFunnel(content, lines);
      
      case 'pyramid':
        return this.toPyramid(content, lines);
      
      case 'bullets':
        return this.toBullets(content, lines);
      
      default:
        // Default: preserve text
        return {
          text: textContent,
        };
    }
  }

  private static toCards(content: BlockContent, lines: string[]): BlockContent {
    const cards: CardItem[] = lines.slice(0, 4).map((line, index) => {
      const parts = line.split(':');
      return {
        title: parts[0]?.trim() || `Card ${index + 1}`,
        body: parts[1]?.trim() || line.trim(),
      };
    });

    return { cards };
  }

  private static toSteps(content: BlockContent, lines: string[]): BlockContent {
    const steps: StepItem[] = lines.slice(0, 6).map((line, index) => ({
      number: index + 1,
      title: line.split(':')[0]?.trim() || `Step ${index + 1}`,
      description: line.split(':')[1]?.trim() || line.trim(),
    }));

    return { steps };
  }

  private static toCycle(content: BlockContent, lines: string[]): BlockContent {
    const cycleItems = lines.slice(0, 6).map(l => l.trim());
    return { cycleItems };
  }

  private static toStats(content: BlockContent, lines: string[]): BlockContent {
    const stats: StatItem[] = lines.slice(0, 4).map((line, index) => {
      // Try to extract number and label
      const match = line.match(/(\d+%?)\s*[-:]\s*(.+)/);
      if (match) {
        return {
          number: match[1],
          label: match[2],
        };
      }
      return {
        number: `${(index + 1) * 25}%`,
        label: line.trim(),
      };
    });

    return { stats, statType: 'ring' };
  }

  private static toFunnel(content: BlockContent, lines: string[]): BlockContent {
    const funnelItems: FunnelItem[] = lines.slice(0, 5).map((line, index) => ({
      label: line.trim(),
      value: 100 - (index * 20),
    }));

    return { funnelItems };
  }

  private static toPyramid(content: BlockContent, lines: string[]): BlockContent {
    // Pyramid is similar to funnel but inverted
    const funnelItems: FunnelItem[] = lines.slice(0, 5).map((line, index) => ({
      label: line.trim(),
      value: (index + 1) * 20,
    }));

    return { funnelItems };
  }

  private static toBullets(content: BlockContent, lines: string[]): BlockContent {
    return {
      bullets: lines.map(l => l.replace(/^[-*]\s*/, '').trim()),
    };
  }
}


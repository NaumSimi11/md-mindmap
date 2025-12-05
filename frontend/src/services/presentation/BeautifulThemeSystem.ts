/**
 * BeautifulThemeSystem - Complete design system for beautiful presentation templates
 * 
 * This system goes beyond simple colors to include:
 * - Typography scales and font pairing
 * - Spacing systems (8px-based)
 * - Complete color palettes with gradients
 * - Visual elements (shadows, borders, overlays)
 * - Layout patterns for each slide type
 */

// ============================================================================
// Typography System
// ============================================================================

export interface TypographySystem {
  heading: {
    family: string;
    fallbacks: string[];
    weights: number[];
  };
  body: {
    family: string;
    fallbacks: string[];
    weights: number[];
  };
  scale: {
    xs: string;    // 0.75rem (12px)
    sm: string;    // 0.875rem (14px)
    base: string;  // 1rem (16px)
    lg: string;   // 1.125rem (18px)
    xl: string;   // 1.25rem (20px)
    '2xl': string; // 1.5rem (24px)
    '3xl': string; // 1.875rem (30px)
    '4xl': string; // 2.25rem (36px)
    '5xl': string; // 3rem (48px)
    '6xl': string; // 3.75rem (60px)
  };
  lineHeights: {
    tight: number;   // 1.1
    normal: number;  // 1.4
    relaxed: number; // 1.6
    loose: number;   // 2.0
  };
  letterSpacing: {
    tighter: string; // -0.05em
    tight: string;   // -0.025em
    normal: string;  // 0
    wide: string;    // 0.025em
    wider: string;   // 0.05em
  };
}

// ============================================================================
// Spacing System
// ============================================================================

export interface SpacingSystem {
  baseUnit: number; // Typically 4px or 8px
  scale: {
    xs: string;   // 0.5rem (8px)
    sm: string;   // 1rem (16px)
    md: string;   // 1.5rem (24px)
    lg: string;   // 2rem (32px)
    xl: string;   // 3rem (48px)
    '2xl': string; // 4rem (64px)
    '3xl': string; // 6rem (96px)
  };
  contentPadding: {
    compact: string;  // 1rem (16px)
    normal: string;   // 2rem (32px)
    spacious: string; // 3rem (48px)
  };
  elementGap: {
    compact: string;  // 0.75rem (12px)
    normal: string;   // 1rem (16px)
    spacious: string; // 1.5rem (24px)
  };
}

// ============================================================================
// Color System
// ============================================================================

export interface ColorSystem {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string; // Text color on primary
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  background: {
    default: string;
    paper: string; // For cards
    overlay: string; // For modals
  };
  text: {
    primary: string;
    secondary: string; // 80% opacity
    disabled: string;  // 40% opacity
  };
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
  opacity: {
    full: number;   // 1.0
    high: number;    // 0.8
    medium: number;  // 0.6
    low: number;     // 0.4
    disabled: number; // 0.2
  };
}

// ============================================================================
// Visual Elements
// ============================================================================

export interface VisualElements {
  shadows: {
    sm: string;   // Subtle
    md: string;   // Medium
    lg: string;   // Large
    xl: string;   // Extra large
    inner: string; // Inset shadow
  };
  borders: {
    width: {
      thin: string;  // 1px
      medium: string; // 2px
      thick: string;  // 4px
    };
    radius: {
      none: string;   // 0
      sm: string;     // 0.25rem (4px)
      md: string;     // 0.5rem (8px)
      lg: string;     // 1rem (16px)
      full: string;   // 9999px (circle)
    };
    style: {
      solid: string;
      dashed: string;
      dotted: string;
    };
  };
  overlays: {
    dark: string;   // rgba(0,0,0,0.5)
    light: string; // rgba(255,255,255,0.5)
    gradient: string; // gradient overlay
  };
  blur: {
    sm: string;  // blur(4px)
    md: string;  // blur(8px)
    lg: string;  // blur(16px)
  };
}

// ============================================================================
// Layout Pattern
// ============================================================================

export type SlideLayout = 
  | 'title'           // Title + subtitle (cover slide)
  | 'content'         // Title + body text
  | 'bullets'         // Title + bullet points
  | 'two-column'      // Title + left/right columns
  | 'image'           // Title + large image
  | 'diagram'         // Title + Mermaid diagram
  | 'mindmap'         // Title + mindmap visualization
  | 'quote'           // Large quote + author
  | 'section'         // Section divider
  | 'blank';          // Blank canvas

export interface LayoutPattern {
  zones: {
    header?: {
      height: string;
      padding: string;
      alignment: 'left' | 'center' | 'right';
    };
    body: {
      padding: string;
      alignment: 'left' | 'center' | 'right';
      maxWidth?: string; // For readability
    };
    footer?: {
      height: string;
      padding: string;
      alignment: 'left' | 'center' | 'right';
    };
  };
  grid?: {
    columns: number;
    gap: string;
    template?: string; // CSS grid template
  };
  positioning: {
    vertical: 'top' | 'center' | 'bottom' | 'stretch';
    horizontal: 'left' | 'center' | 'right' | 'stretch';
  };
}

// ============================================================================
// Beautiful Theme Interface
// ============================================================================

export interface BeautifulTheme {
  // Basic info
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'bold' | 'elegant';
  
  // Design systems
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  visual: VisualElements;
  
  // Layout patterns for each slide type
  layouts: {
    [key in SlideLayout]: LayoutPattern;
  };
  
  // Image handling
  images: {
    defaultStyle: 'cover' | 'contain' | 'fill';
    borderRadius: string;
    overlay?: string;
    filter?: string; // CSS filter
  };
  
  // Animation preferences
  animations: {
    slideTransition: 'fade' | 'slide' | 'zoom' | 'none';
    elementAnimation: 'fadeIn' | 'slideUp' | 'scale' | 'none';
    duration: number; // milliseconds
  };
  
  // Spacing mode (for backward compatibility)
  spacingMode?: 'compact' | 'normal' | 'spacious';
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getThemeSpacing(theme: BeautifulTheme, mode: 'compact' | 'normal' | 'spacious' = 'normal'): string {
  return theme.spacing.contentPadding[mode];
}

export function getThemeElementGap(theme: BeautifulTheme, mode: 'compact' | 'normal' | 'spacious' = 'normal'): string {
  return theme.spacing.elementGap[mode];
}

export function getThemeLayout(theme: BeautifulTheme, layout: SlideLayout): LayoutPattern {
  // Return the layout or a default fallback
  return theme.layouts[layout] || {
    contentWidth: 'wide',
    positioning: {
      vertical: 'center',
      horizontal: 'left',
    },
    elementGap: 'normal',
    padding: 'normal',
  };
}


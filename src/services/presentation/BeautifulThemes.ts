/**
 * BeautifulThemes - Pre-designed beautiful presentation themes
 * 
 * These themes are complete design systems, not just color palettes.
 * Each theme includes typography, spacing, colors, visual elements, and layouts.
 */

import type { BeautifulTheme } from './BeautifulThemeSystem';

// ============================================================================
// Night Sky Theme - Dark, elegant theme with starry gradients
// ============================================================================

export const NIGHT_SKY_THEME: BeautifulTheme = {
  id: 'night-sky',
  name: 'Night Sky',
  description: 'Dark, elegant theme with starry gradients and indigo accents',
  category: 'elegant',
  
  colors: {
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      paper: 'rgba(30, 41, 59, 0.8)',
      overlay: 'rgba(15, 23, 42, 0.9)',
    },
    text: {
      primary: '#F8FAFC',
      secondary: 'rgba(248, 250, 252, 0.8)',
      disabled: 'rgba(248, 250, 252, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.5)',
      light: 'rgba(255, 255, 255, 0.1)',
      gradient: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(0, 0, 0, 0.3)',
    filter: 'brightness(0.9) contrast(1.1)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Oasis Theme - Warm, inviting theme with desert-inspired colors
// ============================================================================

export const OASIS_THEME: BeautifulTheme = {
  id: 'oasis',
  name: 'Oasis',
  description: 'Warm, inviting theme with desert-inspired colors and golden accents',
  category: 'creative',
  
  colors: {
    primary: {
      main: '#F59E0B', // Amber
      light: '#FBBF24',
      dark: '#D97706',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Emerald
      light: '#34D399',
      dark: '#059669',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
      paper: 'rgba(255, 255, 255, 0.9)',
      overlay: 'rgba(254, 243, 199, 0.95)',
    },
    text: {
      primary: '#78350F',
      secondary: 'rgba(120, 53, 15, 0.8)',
      disabled: 'rgba(120, 53, 15, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      secondary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Poppins',
      fallbacks: ['sans-serif'],
      weights: [400, 600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 2px 4px rgba(245, 158, 11, 0.1)',
      md: '0 4px 6px rgba(245, 158, 11, 0.15)',
      lg: '0 10px 15px rgba(245, 158, 11, 0.2)',
      xl: '0 20px 25px rgba(245, 158, 11, 0.25)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(120, 53, 15, 0.3)',
      light: 'rgba(255, 255, 255, 0.5)',
      gradient: 'linear-gradient(180deg, rgba(254,243,199,0) 0%, rgba(254,243,199,0.8) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(245, 158, 11, 0.2)',
    filter: 'brightness(1.05) saturate(1.1)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Modern Theme - Clean, professional theme with purple gradients
// ============================================================================

export const MODERN_BEAUTIFUL_THEME: BeautifulTheme = {
  id: 'modern-beautiful',
  name: 'Modern',
  description: 'Clean, professional theme with purple gradients and modern typography',
  category: 'professional',
  
  colors: {
    primary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: 'rgba(255, 255, 255, 0.95)',
      overlay: 'rgba(102, 126, 234, 0.95)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      secondary: 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '2rem',
      spacious: '3rem',
    },
    elementGap: {
      compact: '0.75rem',
      normal: '1rem',
      spacious: '1.5rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 2px 4px rgba(139, 92, 246, 0.2)',
      md: '0 4px 6px rgba(139, 92, 246, 0.3)',
      lg: '0 10px 15px rgba(139, 92, 246, 0.4)',
      xl: '0 20px 25px rgba(139, 92, 246, 0.5)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.3)',
      light: 'rgba(255, 255, 255, 0.2)',
      gradient: 'linear-gradient(180deg, rgba(102,126,234,0) 0%, rgba(102,126,234,0.8) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(139, 92, 246, 0.2)',
    filter: 'brightness(0.95) contrast(1.05)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Vanilla Theme - Clean, minimal white theme
// ============================================================================

export const VANILLA_THEME: BeautifulTheme = {
  id: 'vanilla',
  name: 'Vanilla',
  description: 'Clean, minimal white theme perfect for professional presentations',
  category: 'professional',
  
  colors: {
    primary: {
      main: '#1F2937', // Dark gray
      light: '#374151',
      dark: '#111827',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280', // Medium gray
      light: '#9CA3AF',
      dark: '#4B5563',
      contrast: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9FAFB',
      overlay: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#1F2937',
      secondary: 'rgba(31, 41, 55, 0.7)',
      disabled: 'rgba(31, 41, 55, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
      secondary: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '2.5rem',
      spacious: '4rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.05)',
      light: 'rgba(255, 255, 255, 0.8)',
      gradient: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(0, 0, 0, 0.05)',
    filter: 'brightness(1) contrast(1)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Tranquil Theme - Calm, serene light blue theme
// ============================================================================

export const TRANQUIL_THEME: BeautifulTheme = {
  id: 'tranquil',
  name: 'Tranquil',
  description: 'Calm, serene theme with soft blue tones for peaceful presentations',
  category: 'creative',
  
  colors: {
    primary: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#06B6D4', // Cyan
      light: '#22D3EE',
      dark: '#0891B2',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #93C5FD 100%)',
      paper: 'rgba(255, 255, 255, 0.9)',
      overlay: 'rgba(224, 242, 254, 0.95)',
    },
    text: {
      primary: '#1E40AF',
      secondary: 'rgba(30, 64, 175, 0.8)',
      disabled: 'rgba(30, 64, 175, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
      secondary: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      background: 'linear-gradient(135deg, #E0F2FE 0%, #93C5FD 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 2px 4px rgba(59, 130, 246, 0.1)',
      md: '0 4px 6px rgba(59, 130, 246, 0.15)',
      lg: '0 10px 15px rgba(59, 130, 246, 0.2)',
      xl: '0 20px 25px rgba(59, 130, 246, 0.25)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(30, 64, 175, 0.2)',
      light: 'rgba(255, 255, 255, 0.6)',
      gradient: 'linear-gradient(180deg, rgba(224,242,254,0) 0%, rgba(224,242,254,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(59, 130, 246, 0.1)',
    filter: 'brightness(1.05) contrast(1.05)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Terracotta Theme - Warm, earthy beige theme
// ============================================================================

export const TERRACOTTA_THEME: BeautifulTheme = {
  id: 'terracotta',
  name: 'Terracotta',
  description: 'Warm, earthy theme with beige and terracotta tones',
  category: 'creative',
  
  colors: {
    primary: {
      main: '#D97706', // Amber
      light: '#F59E0B',
      dark: '#B45309',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#92400E', // Brown
      light: '#B45309',
      dark: '#78350F',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
      paper: 'rgba(255, 255, 255, 0.95)',
      overlay: 'rgba(254, 243, 199, 0.95)',
    },
    text: {
      primary: '#78350F',
      secondary: 'rgba(120, 53, 15, 0.8)',
      disabled: 'rgba(120, 53, 15, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
      secondary: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
      background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Poppins',
      fallbacks: ['sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 2px 4px rgba(217, 119, 6, 0.1)',
      md: '0 4px 6px rgba(217, 119, 6, 0.15)',
      lg: '0 10px 15px rgba(217, 119, 6, 0.2)',
      xl: '0 20px 25px rgba(217, 119, 6, 0.25)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(120, 53, 15, 0.2)',
      light: 'rgba(255, 255, 255, 0.6)',
      gradient: 'linear-gradient(180deg, rgba(254,243,199,0) 0%, rgba(254,243,199,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(217, 119, 6, 0.15)',
    filter: 'brightness(1.05) saturate(1.1)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Alien Theme - Dark theme with neon green accents
// ============================================================================

export const ALIEN_THEME: BeautifulTheme = {
  id: 'alien',
  name: 'Alien',
  description: 'Dark, futuristic theme with neon green accents and cyberpunk vibes',
  category: 'creative',
  
  colors: {
    primary: {
      main: '#10B981', // Emerald green
      light: '#34D399',
      dark: '#059669',
      contrast: '#000000',
    },
    secondary: {
      main: '#22C55E', // Green
      light: '#4ADE80',
      dark: '#16A34A',
      contrast: '#000000',
    },
    background: {
      default: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      paper: 'rgba(15, 23, 42, 0.95)',
      overlay: 'rgba(15, 23, 42, 0.98)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      disabled: 'rgba(255, 255, 255, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #10B981 0%, #22C55E 100%)',
      secondary: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 0 4px rgba(16, 185, 129, 0.3)',
      md: '0 0 8px rgba(16, 185, 129, 0.4), 0 4px 6px rgba(0, 0, 0, 0.5)',
      lg: '0 0 16px rgba(16, 185, 129, 0.5), 0 10px 15px rgba(0, 0, 0, 0.6)',
      xl: '0 0 24px rgba(16, 185, 129, 0.6), 0 20px 25px rgba(0, 0, 0, 0.7)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.6)',
      light: 'rgba(16, 185, 129, 0.1)',
      gradient: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(16, 185, 129, 0.2)',
    filter: 'brightness(0.9) contrast(1.2)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Velvet Tides Theme - Dark theme with pink/magenta accents
// ============================================================================

export const VELVET_TIDES_THEME: BeautifulTheme = {
  id: 'velvet-tides',
  name: 'Velvet Tides',
  description: 'Dark, luxurious theme with soft pink and magenta accents',
  category: 'elegant',
  
  colors: {
    primary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#F43F5E', // Rose
      light: '#FB7185',
      dark: '#E11D48',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
      paper: 'rgba(30, 27, 75, 0.95)',
      overlay: 'rgba(30, 27, 75, 0.98)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      disabled: 'rgba(255, 255, 255, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
      secondary: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 100%)',
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 0 4px rgba(236, 72, 153, 0.3)',
      md: '0 0 8px rgba(236, 72, 153, 0.4), 0 4px 6px rgba(0, 0, 0, 0.5)',
      lg: '0 0 16px rgba(236, 72, 153, 0.5), 0 10px 15px rgba(0, 0, 0, 0.6)',
      xl: '0 0 24px rgba(236, 72, 153, 0.6), 0 20px 25px rgba(0, 0, 0, 0.7)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.6)',
      light: 'rgba(236, 72, 153, 0.1)',
      gradient: 'linear-gradient(180deg, rgba(30,27,75,0) 0%, rgba(30,27,75,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(236, 72, 153, 0.2)',
    filter: 'brightness(0.9) contrast(1.15)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Aurora Theme - Dark theme with vibrant purple accents
// ============================================================================

export const AURORA_THEME: BeautifulTheme = {
  id: 'aurora',
  name: 'Aurora',
  description: 'Dark, cosmic theme with vibrant purple and blue aurora-like gradients',
  category: 'elegant',
  
  colors: {
    primary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrast: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
      paper: 'rgba(15, 23, 42, 0.95)',
      overlay: 'rgba(15, 23, 42, 0.98)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      disabled: 'rgba(255, 255, 255, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
      secondary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)',
    },
    opacity: {
      full: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      disabled: 0.2,
    },
  },
  
  typography: {
    heading: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [600, 700],
    },
    body: {
      family: 'Inter',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [400, 500],
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2.0,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    baseUnit: 8,
    scale: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    contentPadding: {
      compact: '1.5rem',
      normal: '3rem',
      spacious: '4.5rem',
    },
    elementGap: {
      compact: '1rem',
      normal: '1.5rem',
      spacious: '2rem',
    },
  },
  
  visual: {
    shadows: {
      sm: '0 0 4px rgba(139, 92, 246, 0.3)',
      md: '0 0 8px rgba(139, 92, 246, 0.4), 0 4px 6px rgba(0, 0, 0, 0.5)',
      lg: '0 0 16px rgba(139, 92, 246, 0.5), 0 10px 15px rgba(0, 0, 0, 0.6)',
      xl: '0 0 24px rgba(139, 92, 246, 0.6), 0 20px 25px rgba(0, 0, 0, 0.7)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    borders: {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px',
      },
      radius: {
        none: '0',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        full: '9999px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
      },
    },
    overlays: {
      dark: 'rgba(0, 0, 0, 0.6)',
      light: 'rgba(139, 92, 246, 0.1)',
      gradient: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.9) 100%)',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
  
  layouts: {
    title: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    content: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'top',
        horizontal: 'left',
      },
    },
    bullets: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
          maxWidth: '900px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'left',
      },
    },
    'two-column': {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'left',
        },
      },
      grid: {
        columns: 2,
        gap: '2rem',
      },
      positioning: {
        vertical: 'top',
        horizontal: 'stretch',
      },
    },
    image: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    diagram: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    mindmap: {
      zones: {
        body: {
          padding: '3rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    quote: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
          maxWidth: '800px',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    section: {
      zones: {
        body: {
          padding: '4rem',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
    blank: {
      zones: {
        body: {
          padding: '0',
          alignment: 'center',
        },
      },
      positioning: {
        vertical: 'center',
        horizontal: 'center',
      },
    },
  },
  
  images: {
    defaultStyle: 'cover',
    borderRadius: '1rem',
    overlay: 'rgba(139, 92, 246, 0.2)',
    filter: 'brightness(0.9) contrast(1.15)',
  },
  
  animations: {
    slideTransition: 'fade',
    elementAnimation: 'fadeIn',
    duration: 300,
  },
  
  spacingMode: 'normal',
};

// ============================================================================
// Export All Themes
// ============================================================================

export const BEAUTIFUL_THEMES: Record<string, BeautifulTheme> = {
  'vanilla': VANILLA_THEME,
  'tranquil': TRANQUIL_THEME,
  'terracotta': TERRACOTTA_THEME,
  'alien': ALIEN_THEME,
  'velvet-tides': VELVET_TIDES_THEME,
  'aurora': AURORA_THEME,
  'night-sky': NIGHT_SKY_THEME,
  'oasis': OASIS_THEME,
  'modern-beautiful': MODERN_BEAUTIFUL_THEME,
};

export function getBeautifulTheme(themeId: string): BeautifulTheme {
  return BEAUTIFUL_THEMES[themeId] || NIGHT_SKY_THEME;
}

export function getAllBeautifulThemes(): BeautifulTheme[] {
  return Object.values(BEAUTIFUL_THEMES);
}


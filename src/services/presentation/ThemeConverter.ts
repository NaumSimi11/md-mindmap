/**
 * ThemeConverter - Convert between old PresentationTheme and new BeautifulTheme
 * 
 * Provides backward compatibility and migration utilities
 */

import type { PresentationTheme } from './PresentationGenerator';
import type { BeautifulTheme } from './BeautifulThemeSystem';
import { getBeautifulTheme } from './BeautifulThemes';

/**
 * Convert old PresentationTheme to BeautifulTheme
 * Maps old theme IDs to new beautiful themes
 */
export function convertToBeautifulTheme(oldTheme: PresentationTheme | string): BeautifulTheme {
  // If it's already a string ID, try to map it
  if (typeof oldTheme === 'string') {
    const themeMap: Record<string, string> = {
      'modern': 'modern-beautiful',
      'professional': 'night-sky',
      'minimal': 'night-sky',
      'dark': 'night-sky',
      'vibrant': 'modern-beautiful',
      'corporate': 'oasis',
      // Also handle beautiful theme IDs directly
      'night-sky': 'night-sky',
      'oasis': 'oasis',
      'modern-beautiful': 'modern-beautiful',
    };
    
    const mappedId = themeMap[oldTheme] || 'night-sky';
    return getBeautifulTheme(mappedId);
  }
  
  // If it's a PresentationTheme object, try to match by name first
  const themeName = oldTheme.name?.toLowerCase().replace(/\s+/g, '-');
  const themeMap: Record<string, string> = {
    'modern': 'modern-beautiful',
    'professional': 'night-sky',
    'minimal': 'night-sky',
    'dark': 'night-sky',
    'vibrant': 'modern-beautiful',
    'corporate': 'oasis',
    'oasis': 'oasis',
    'night-sky': 'night-sky',
  };
  
  if (themeName && themeMap[themeName]) {
    return getBeautifulTheme(themeMap[themeName]);
  }
  
  // Try to detect by colors (Oasis has yellow/amber colors)
  if (oldTheme.colors.primary.includes('F59E0B') || oldTheme.colors.background.includes('FEF3C7')) {
    return getBeautifulTheme('oasis');
  }
  
  // Try to detect by colors (Night Sky has indigo/purple)
  if (oldTheme.colors.primary.includes('6366F1') || oldTheme.colors.primary.includes('8B5CF6')) {
    return getBeautifulTheme('night-sky');
  }
  
  // Default: create a basic beautiful theme
  return createBasicBeautifulTheme(oldTheme);
}

/**
 * Create a basic BeautifulTheme from old PresentationTheme
 * This is a minimal conversion - not as beautiful as predefined themes
 */
function createBasicBeautifulTheme(oldTheme: PresentationTheme): BeautifulTheme {
  // Use Night Sky as base and override colors
  const baseTheme = getBeautifulTheme('night-sky');
  
  return {
    ...baseTheme,
    id: `converted-${oldTheme.name.toLowerCase()}`,
    name: oldTheme.name,
    colors: {
      ...baseTheme.colors,
      primary: {
        main: oldTheme.colors.primary,
        light: oldTheme.colors.primary,
        dark: oldTheme.colors.primary,
        contrast: '#FFFFFF',
      },
      secondary: {
        main: oldTheme.colors.secondary,
        light: oldTheme.colors.secondary,
        dark: oldTheme.colors.secondary,
        contrast: '#FFFFFF',
      },
      background: {
        default: oldTheme.colors.background,
        paper: oldTheme.colors.background,
        overlay: oldTheme.colors.background,
      },
      text: {
        primary: oldTheme.colors.text,
        secondary: oldTheme.colors.text,
        disabled: oldTheme.colors.text,
      },
    },
    typography: {
      ...baseTheme.typography,
      heading: {
        ...baseTheme.typography.heading,
        family: oldTheme.fonts.heading,
      },
      body: {
        ...baseTheme.typography.body,
        family: oldTheme.fonts.body,
      },
    },
    spacingMode: oldTheme.spacing,
  };
}

/**
 * Check if a theme is a BeautifulTheme
 */
export function isBeautifulTheme(theme: any): theme is BeautifulTheme {
  return theme && typeof theme === 'object' && 'colors' in theme && 'typography' in theme && 'spacing' in theme && 'visual' in theme;
}


/**
 * PresentationThemes - Professional theme definitions
 * 
 * 6 carefully designed themes for different presentation styles
 */

import type { PresentationTheme } from './PresentationGenerator';

export const PRESENTATION_THEMES: Record<string, PresentationTheme> = {
  modern: {
    name: 'Modern',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#FFFFFF',
      accent: '#F59E0B',
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    spacing: 'normal',
  },
  
  professional: {
    name: 'Professional',
    colors: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      text: '#FFFFFF',
      accent: '#60A5FA',
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif',
    },
    spacing: 'normal',
  },
  
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#000000',
      secondary: '#6B7280',
      background: '#FFFFFF',
      text: '#111827',
      accent: '#3B82F6',
    },
    fonts: {
      heading: 'Helvetica Neue, sans-serif',
      body: 'Helvetica Neue, sans-serif',
    },
    spacing: 'spacious',
  },
  
  dark: {
    name: 'Dark',
    colors: {
      primary: '#F59E0B',
      secondary: '#10B981',
      background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      text: '#F9FAFB',
      accent: '#34D399',
    },
    fonts: {
      heading: 'JetBrains Mono, monospace',
      body: 'Inter, system-ui, sans-serif',
    },
    spacing: 'normal',
  },
  
  vibrant: {
    name: 'Vibrant',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      text: '#FFFFFF',
      accent: '#FBBF24',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Poppins, sans-serif',
    },
    spacing: 'normal',
  },
  
  corporate: {
    name: 'Corporate',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
      text: '#FFFFFF',
      accent: '#34D399',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    spacing: 'compact',
  },
};

export function getTheme(themeId: string): PresentationTheme {
  return PRESENTATION_THEMES[themeId] || PRESENTATION_THEMES.modern;
}

export function getAllThemes(): PresentationTheme[] {
  return Object.values(PRESENTATION_THEMES);
}


/**
 * User Preferences Store
 * =======================
 * 
 * Global Zustand store for user preferences.
 * Persists to localStorage and applies settings to the UI.
 * 
 * Settings:
 * - Theme (light/dark/system)
 * - Font size (small/medium/large)
 * - Toolbar style (floating/fixed)
 * - Editor settings (auto-save, spell check, line numbers)
 * - AI settings (provider, API keys)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type ToolbarStyle = 'floating' | 'fixed';
export type AIProvider = 'none' | 'openai' | 'anthropic' | 'google' | 'mdreader';

export interface UserPreferences {
  // UI Settings
  theme: ThemeMode;
  fontSize: FontSize;
  toolbarStyle: ToolbarStyle;
  
  // Toolbar Visibility Settings
  showActionBar: boolean;        // TOP BAR: Format, Diagram, AI Assistant, Mindmap, etc.
  showFormattingToolbar: boolean; // SHORTCUTS BAR: B, I, U, H1, H2, etc.
  showSideToolbar: boolean;       // FLOATING RIGHT BAR: Quick action icons
  
  // Editor Settings
  showLineNumbers: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  spellCheck: boolean;
  autoComplete: boolean;
  
  // AI Settings
  aiProvider: AIProvider;
  aiHints: boolean;
  openaiApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
  defaultModel: string;
}

interface UserPreferencesState extends UserPreferences {
  // Computed state
  resolvedTheme: 'light' | 'dark'; // Actual theme after resolving 'system'
  
  // Actions - UI
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setToolbarStyle: (style: ToolbarStyle) => void;
  
  // Actions - Toolbar Visibility
  setShowActionBar: (show: boolean) => void;
  setShowFormattingToolbar: (show: boolean) => void;
  setShowSideToolbar: (show: boolean) => void;
  
  // Actions - Editor
  setShowLineNumbers: (show: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (seconds: number) => void;
  setSpellCheck: (enabled: boolean) => void;
  setAutoComplete: (enabled: boolean) => void;
  
  // Actions - AI
  setAIProvider: (provider: AIProvider) => void;
  setAIHints: (enabled: boolean) => void;
  setAPIKey: (provider: 'openai' | 'anthropic' | 'google', key: string) => void;
  setDefaultModel: (model: string) => void;
  
  // Bulk update
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  
  // Reset to defaults
  resetToDefaults: () => void;
  
  // Initialize (call on app start)
  initialize: () => void;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  // UI
  theme: 'system',
  fontSize: 'medium',
  toolbarStyle: 'fixed',
  
  // Toolbar Visibility
  showActionBar: true,
  showFormattingToolbar: true,
  showSideToolbar: true,
  
  // Editor
  showLineNumbers: false,
  autoSave: true,
  autoSaveInterval: 30,
  spellCheck: true,
  autoComplete: true,
  
  // AI
  aiProvider: 'none',
  aiHints: true,
  openaiApiKey: '',
  anthropicApiKey: '',
  googleApiKey: '',
  defaultModel: 'gpt-4',
};

// ============================================================================
// CSS Variable Mappings
// ============================================================================

const FONT_SIZE_MAP: Record<FontSize, { base: string; editor: string }> = {
  small: { base: '14px', editor: '14px' },
  medium: { base: '16px', editor: '16px' },
  large: { base: '18px', editor: '18px' },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
function applyTheme(theme: ThemeMode): 'light' | 'dark' {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Store resolved theme for components that need it
  document.documentElement.setAttribute('data-theme', resolved);
  
  return resolved;
}

/**
 * Apply font size to document
 */
function applyFontSize(size: FontSize): void {
  const { base, editor } = FONT_SIZE_MAP[size];
  document.documentElement.style.setProperty('--font-size-base', base);
  document.documentElement.style.setProperty('--font-size-editor', editor);
  document.documentElement.setAttribute('data-font-size', size);
}

/**
 * Apply all preferences to the UI
 */
function applyAllPreferences(prefs: UserPreferences): 'light' | 'dark' {
  const resolvedTheme = applyTheme(prefs.theme);
  applyFontSize(prefs.fontSize);
  
  // Set data attributes for CSS selectors
  document.documentElement.setAttribute('data-toolbar-style', prefs.toolbarStyle);
  document.documentElement.setAttribute('data-line-numbers', prefs.showLineNumbers.toString());
  document.documentElement.setAttribute('data-spellcheck', prefs.spellCheck.toString());
  
  return resolvedTheme;
}

// ============================================================================
// Store
// ============================================================================

export const useUserPreferencesStore = create<UserPreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_PREFERENCES,
        resolvedTheme: 'light',

        // Actions - UI
        setTheme: (theme) => {
          const resolvedTheme = applyTheme(theme);
          set({ theme, resolvedTheme });
        },

        setFontSize: (fontSize) => {
          applyFontSize(fontSize);
          set({ fontSize });
        },

        setToolbarStyle: (toolbarStyle) => {
          document.documentElement.setAttribute('data-toolbar-style', toolbarStyle);
          set({ toolbarStyle });
        },

        // Actions - Toolbar Visibility
        setShowActionBar: (showActionBar) => set({ showActionBar }),
        setShowFormattingToolbar: (showFormattingToolbar) => set({ showFormattingToolbar }),
        setShowSideToolbar: (showSideToolbar) => set({ showSideToolbar }),

        // Actions - Editor
        setShowLineNumbers: (showLineNumbers) => {
          document.documentElement.setAttribute('data-line-numbers', showLineNumbers.toString());
          set({ showLineNumbers });
        },

        setAutoSave: (autoSave) => set({ autoSave }),
        
        setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
        
        setSpellCheck: (spellCheck) => {
          document.documentElement.setAttribute('data-spellcheck', spellCheck.toString());
          set({ spellCheck });
        },
        
        setAutoComplete: (autoComplete) => set({ autoComplete }),

        // Actions - AI
        setAIProvider: (aiProvider) => set({ aiProvider }),
        
        setAIHints: (aiHints) => set({ aiHints }),
        
        setAPIKey: (provider, key) => {
          switch (provider) {
            case 'openai':
              set({ openaiApiKey: key });
              break;
            case 'anthropic':
              set({ anthropicApiKey: key });
              break;
            case 'google':
              set({ googleApiKey: key });
              break;
          }
        },
        
        setDefaultModel: (defaultModel) => set({ defaultModel }),

        // Bulk update
        updatePreferences: (prefs) => {
          const currentState = get();
          const newState = { ...currentState, ...prefs };
          const resolvedTheme = applyAllPreferences(newState);
          set({ ...prefs, resolvedTheme });
        },

        // Reset to defaults
        resetToDefaults: () => {
          const resolvedTheme = applyAllPreferences(DEFAULT_PREFERENCES);
          set({ ...DEFAULT_PREFERENCES, resolvedTheme });
        },

        // Initialize on app start
        initialize: () => {
          const state = get();
          const resolvedTheme = applyAllPreferences(state);
          set({ resolvedTheme });
          
          // Listen for system theme changes
          if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
              if (get().theme === 'system') {
                const newResolved = applyTheme('system');
                set({ resolvedTheme: newResolved });
              }
            });
          }
          
          console.log('✅ [Preferences] Initialized:', {
            theme: state.theme,
            resolvedTheme,
            fontSize: state.fontSize,
            toolbarStyle: state.toolbarStyle,
          });
        },
      }),
      {
        name: 'mdreader-user-preferences',
        // Only persist these fields (not computed/derived state)
        partialize: (state) => ({
          theme: state.theme,
          fontSize: state.fontSize,
          toolbarStyle: state.toolbarStyle,
          showActionBar: state.showActionBar,
          showFormattingToolbar: state.showFormattingToolbar,
          showSideToolbar: state.showSideToolbar,
          showLineNumbers: state.showLineNumbers,
          autoSave: state.autoSave,
          autoSaveInterval: state.autoSaveInterval,
          spellCheck: state.spellCheck,
          autoComplete: state.autoComplete,
          aiProvider: state.aiProvider,
          aiHints: state.aiHints,
          openaiApiKey: state.openaiApiKey,
          anthropicApiKey: state.anthropicApiKey,
          googleApiKey: state.googleApiKey,
          defaultModel: state.defaultModel,
        }),
      }
    ),
    { name: 'UserPreferencesStore' }
  )
);

// ============================================================================
// Selector Hooks (for performance - only re-render when specific values change)
// ============================================================================

export const useTheme = () => useUserPreferencesStore((s) => s.theme);
export const useResolvedTheme = () => useUserPreferencesStore((s) => s.resolvedTheme);
export const useFontSize = () => useUserPreferencesStore((s) => s.fontSize);
export const useToolbarStyle = () => useUserPreferencesStore((s) => s.toolbarStyle);
// Individual selectors for toolbar visibility (avoids object creation on each render)
export const useShowActionBar = () => useUserPreferencesStore((s) => s.showActionBar);
export const useShowFormattingToolbar = () => useUserPreferencesStore((s) => s.showFormattingToolbar);
export const useShowSideToolbar = () => useUserPreferencesStore((s) => s.showSideToolbar);
export const useAutoSave = () => useUserPreferencesStore((s) => ({ enabled: s.autoSave, interval: s.autoSaveInterval }));
export const useSpellCheck = () => useUserPreferencesStore((s) => s.spellCheck);
export const useShowLineNumbers = () => useUserPreferencesStore((s) => s.showLineNumbers);
export const useAISettings = () => useUserPreferencesStore((s) => ({
  provider: s.aiProvider,
  hints: s.aiHints,
  openaiKey: s.openaiApiKey,
  anthropicKey: s.anthropicApiKey,
  googleKey: s.googleApiKey,
  defaultModel: s.defaultModel,
}));

// ============================================================================
// Initialize on import (for early application)
// ============================================================================

// Auto-initialize when the store is first accessed
if (typeof window !== 'undefined') {
  // Defer to next tick to ensure store is ready
  setTimeout(() => {
    useUserPreferencesStore.getState().initialize();
  }, 0);
}


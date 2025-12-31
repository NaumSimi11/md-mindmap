/**
 * useToolbarPreferences - Hook for managing toolbar configuration and preferences
 */

import { useState, useEffect, useCallback } from 'react';
import type { ToolbarStyle, ToolbarConfig } from '@/components/editor/toolbar/UnifiedToolbar';

const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  style: 'fixed-top',
  showFormat: true,
  showHeadings: true,
  showLists: true,
  showInsert: true,
  showAI: true,
  showComments: true,
  showSave: true,
  showShare: true,
  showTools: true,
};

const STORAGE_KEY = 'mdreader-toolbar-config';

export function useToolbarPreferences() {
  const [config, setConfig] = useState<ToolbarConfig>(DEFAULT_TOOLBAR_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        // Validate config structure
        const validatedConfig = {
          ...DEFAULT_TOOLBAR_CONFIG,
          ...parsedConfig,
        };
        setConfig(validatedConfig);
      }
    } catch (error) {
      console.warn('Failed to load toolbar preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const saveConfig = useCallback((newConfig: ToolbarConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save toolbar preferences:', error);
    }
  }, []);

  // Update specific config property
  const updateConfig = useCallback((updates: Partial<ToolbarConfig>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // Change toolbar style
  const setToolbarStyle = useCallback((style: ToolbarStyle) => {
    updateConfig({ style });
  }, [updateConfig]);

  // Toggle specific feature visibility
  const toggleFeature = useCallback((feature: keyof Omit<ToolbarConfig, 'style'>) => {
    updateConfig({ [feature]: !config[feature] });
  }, [config, updateConfig]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveConfig(DEFAULT_TOOLBAR_CONFIG);
  }, [saveConfig]);

  return {
    config,
    isLoaded,
    updateConfig,
    setToolbarStyle,
    toggleFeature,
    resetToDefaults,
  };
}

/**
 * Platform Context
 * Provides platform information (desktop vs web) to all components
 */

import { createContext, useContext, ReactNode } from 'react';
import { getPlatform, type Platform } from '@/utils/platform';

interface PlatformContextType {
  platform: Platform;
  isDesktop: boolean;
  isWeb: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const platform = getPlatform();
  
  const value: PlatformContextType = {
    platform,
    isDesktop: platform === 'desktop',
    isWeb: platform === 'web',
  };
  
  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

/**
 * Hook to access platform information
 * @example
 * const { isDesktop, isWeb, platform } = usePlatform();
 * if (isDesktop) {
 *   // Show desktop-specific features
 * }
 */
export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
}

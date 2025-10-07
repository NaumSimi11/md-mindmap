/**
 * Platform Detection Utility
 * Detects if running in Tauri desktop app vs web browser
 */

export type Platform = 'desktop' | 'web';

/**
 * Detect if running in Tauri desktop app
 * Tauri injects window.__TAURI__ when running in desktop mode
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
  return isDesktop() ? 'desktop' : 'web';
}

/**
 * Check if Tauri APIs are available
 */
export function isTauriAvailable(): boolean {
  return isDesktop();
}

/**
 * Type guard for Tauri APIs
 * Throws error if not in desktop mode
 */
export function assertTauri(): asserts window is Window & { __TAURI__: any } {
  if (!isDesktop()) {
    throw new Error('Tauri APIs are only available in desktop mode');
  }
}

/**
 * Get platform info for debugging
 */
export function getPlatformInfo() {
  return {
    platform: getPlatform(),
    isDesktop: isDesktop(),
    isWeb: !isDesktop(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    tauriAvailable: isTauriAvailable(),
  };
}

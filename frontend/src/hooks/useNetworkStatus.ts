/**
 * useNetworkStatus - Monitor online/offline state
 * 
 * Listens to browser's online/offline events and provides current network status.
 * Also detects when app comes back to foreground (for mobile/tab switching).
 */

import { useState, useEffect, useCallback } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

export interface NetworkState {
  isOnline: boolean;
  status: NetworkStatus;
  wasOffline: boolean;  // Track if we were previously offline
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

export function useNetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online',
    wasOffline: false,
    lastOnlineAt: null,
    lastOfflineAt: null
  });
  
  // Handle online event
  const handleOnline = useCallback(() => {
    
    setState(prev => ({
      ...prev,
      isOnline: true,
      status: prev.wasOffline ? 'reconnecting' : 'online',
      lastOnlineAt: new Date(),
      wasOffline: prev.status === 'offline'
    }));
    
    // After a brief period, transition from 'reconnecting' to 'online'
    setTimeout(() => {
      setState(prev => prev.status === 'reconnecting' ? {
        ...prev,
        status: 'online',
        wasOffline: false
      } : prev);
    }, 2000); // 2 second grace period for reconnecting state
  }, []);
  
  // Handle offline event
  const handleOffline = useCallback(() => {
    
    setState(prev => ({
      ...prev,
      isOnline: false,
      status: 'offline',
      lastOfflineAt: new Date(),
      wasOffline: true
    }));
  }, []);
  
  // Handle visibility change (app comes to foreground)
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden && navigator.onLine) {
      // App came to foreground and we're online - check connection
      
      // Force check by pinging a known endpoint (optional)
      // This helps detect "fake online" states (connected to WiFi but no internet)
      setState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        status: navigator.onLine ? (prev.wasOffline ? 'reconnecting' : 'online') : 'offline'
      }));
    }
  }, []);
  
  useEffect(() => {
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleOnline, handleOffline, handleVisibilityChange]);
  
  return state;
}

/**
 * Hook that triggers a callback when network status changes
 */
export function useNetworkStatusChange(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const { isOnline, status } = useNetworkStatus();
  
  useEffect(() => {
    if (status === 'reconnecting' && onOnline) {
      onOnline();
    }
  }, [status, onOnline]);
  
  useEffect(() => {
    if (status === 'offline' && onOffline) {
      onOffline();
    }
  }, [status, onOffline]);
  
  return { isOnline, status };
}

/**
 * Simple hook that just returns boolean isOnline
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}


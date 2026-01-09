/**
 * useYjsDocument Hook - Production-Grade Yjs Document Management
 * 
 * Purpose: Provides a Yjs document instance with automatic lifecycle management
 * 
 * Features:
 * - Uses Global YjsDocumentManager to prevent duplicate initialization
 * - IndexedDB persistence (always active, offline-first)
 * - WebSocket sync (authenticated mode only)
 * - Network status detection
 * - Automatic reconnection with exponential backoff
 * - Error handling with manual retry
 * - Proper cleanup on unmount
 * 
 * Architecture:
 * ```
 * Component
 *    ↓
 * useYjsDocument (this hook)
 *    ↓
 * YjsDocumentManager (global singleton)
 *    ↓
 * Y.Doc + IndexeddbPersistence + HocuspocusProvider
 * ```
 */

import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSyncMode } from './useSyncMode';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';

/**
 * Generate a consistent color from a string (user ID or email)
 * Same user always gets the same color
 */
function generateUserColor(str: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Sync status types
 */
export type SyncStatus = 
  | 'initializing'  // Setting up document
  | 'local-only'    // Offline or guest mode (IndexedDB only)
  | 'connecting'    // Connecting to WebSocket
  | 'synced'        // Fully synced (IndexedDB + WebSocket)
  | 'offline'       // Network offline
  | 'error';        // Error occurred

/**
 * Return type for the hook
 */
export interface UseYjsDocumentReturn {
  ydoc: Y.Doc | null;
  status: SyncStatus;
  online: boolean;
  websocketProvider: HocuspocusProvider | null;
  syncStatus: {
    local: boolean;
    cloud: boolean;
  };
  error: Error | null;
  retry: () => void;
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
};

/**
 * Hook to manage a Yjs document with automatic lifecycle
 * @param documentId - Unique identifier for the document
 * @returns Yjs document, sync status, and control functions
 */
export function useYjsDocument(documentId: string): UseYjsDocumentReturn {
  const { user, isAuthenticated } = useAuth();
  const { isOnlineMode } = useSyncMode();
  
  // 🔥 NEW: Generate user info for presence/awareness
  const currentUser = user ? {
    name: user.full_name || user.username || user.email?.split('@')[0] || 'Anonymous',
    color: generateUserColor(user.id || user.email || 'anonymous'),
  } : undefined;
  
  // Core state
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [status, setStatus] = useState<SyncStatus>('initializing');
  const [localSynced, setLocalSynced] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [websocketProvider, setWebsocketProvider] = useState<HocuspocusProvider | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for cleanup and retry logic
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  /**
   * Calculate retry delay with exponential backoff
   */
  const getRetryDelay = useCallback((): number => {
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCountRef.current),
      RETRY_CONFIG.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  /**
   * Manual retry function
   */
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Force re-initialization by clearing ydoc
    setYdoc(null);
    setStatus('initializing');
  }, []);

  /**
   * Main effect: Get or create Yjs document from global manager
   */
  useEffect(() => {
    if (!documentId) {
      console.warn('⚠️ No document ID provided');
      return;
    }

    mountedRef.current = true;
    
    // 🔥 BUG FIX #7: Normalize document ID for Yjs (always use cloud ID without doc_ prefix)
    // This ensures the SAME Yjs instance is used whether logged in or logged out
    const normalizedDocId = documentId.startsWith('doc_') 
      ? documentId.slice(4)  // Remove doc_ prefix
      : documentId;
    
    if (normalizedDocId !== documentId) {
      console.log(`   🔄 Normalized: ${documentId} → ${normalizedDocId}`);
    }
    
    try {
      // Get document instance from global manager (using normalized ID)
      const instance = yjsDocumentManager.getDocument(normalizedDocId, {
        enableWebSocket: isAuthenticated && online && isOnlineMode,
        websocketUrl: 'ws://localhost:1234',
        isAuthenticated,
        currentUser, // 🔥 NEW: Pass user info for presence
      });

      if (!mountedRef.current) {
        // Component unmounted before we got the instance
        yjsDocumentManager.releaseDocument(normalizedDocId);
        return;
      }

      // Set the ydoc immediately (so TipTap can initialize)
      setYdoc(instance.ydoc);
      setWebsocketProvider(instance.websocketProvider);
      
      // 🔥 FIX: Wait for IndexedDB to sync before marking as ready
      // Check if already initialized
      if (instance.isInitialized) {
        setLocalSynced(true);
        if (instance.websocketProvider) {
          setStatus('synced');
        } else {
          setStatus('local-only');
        }
      } else {
        // Wait for IndexedDB to sync
        setStatus('initializing');
        setLocalSynced(false);
        
        const syncHandler = () => {
          if (mountedRef.current) {
            setLocalSynced(true);
            if (instance.websocketProvider) {
              setStatus('synced');
            } else {
              setStatus('local-only');
            }
          }
        };
        
        instance.indexeddbProvider.on('synced', syncHandler);
        
        // Cleanup listener on unmount
        return () => {
          instance.indexeddbProvider.off('synced', syncHandler);
        };
      }


    } catch (err) {
      console.error(`❌ Failed to get Yjs document for ${documentId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to get document'));
      setStatus('error');
      
      // Retry with backoff
      if (retryCountRef.current < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay();
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            retryCountRef.current++;
            retry();
          }
        }, delay);
      }
    }

    // Cleanup function (runs on unmount or when dependencies change)
    return () => {
      const normalizedDocId = documentId.startsWith('doc_') 
        ? documentId.slice(4) 
        : documentId;
      mountedRef.current = false;
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Release document from manager (using normalized ID)
      yjsDocumentManager.releaseDocument(normalizedDocId);
      
      // Reset state
      setYdoc(null);
      setStatus('initializing');
      setLocalSynced(false);
      setCloudSynced(false);
      setWebsocketProvider(null);
      setError(null);
    };
  }, [documentId, isAuthenticated, online, getRetryDelay, retry]);

  /**
   * Network status listeners
   */
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      retryCountRef.current = 0; // Reset retry counter
    };
    
    const handleOffline = () => {
      setOnline(false);
      setStatus('offline');
      setCloudSynced(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ydoc,
    status,
    online,
    websocketProvider,
    syncStatus: {
      local: localSynced,
      cloud: cloudSynced,
    },
    error,
    retry,
  };
}

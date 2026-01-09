/**
 * Sync Context
 * =============
 * 
 * Handles dual storage orchestration (guest ↔ backend)
 * Manages sync mode, service selection, and ID mapping
 * 
 * Responsibilities:
 * - Determine which service to use (guest vs backend)
 * - Auth state synchronization
 * - Canonical key deduplication
 * - Service initialization
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/api';
import { backendWorkspaceService, guestWorkspaceService } from '@/services/workspace';

interface SyncContextType {
  /**
   * Whether to use backend service (cloud) or guest service (local)
   * TRUE: authenticated + online mode
   * FALSE: guest mode or local-only
   */
  shouldUseBackendService: boolean;
  
  /**
   * Whether backend service has been initialized
   */
  isBackendInitialized: boolean;
  
  /**
   * Force re-initialization (increment to trigger re-init)
   */
  forceReinit: () => void;
  
  /**
   * Initialization counter (for dependencies)
   */
  initCounter: number;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [shouldUseBackendService, setShouldUseBackendService] = useState(false);
  const [isBackendInitialized, setIsBackendInitialized] = useState(false);
  const [initCounter, setInitCounter] = useState(0);

  // Determine which service to use based on auth state
  useEffect(() => {
    // Direct auth check (bypasses React state timing issues)
    const authCheck = authService.isAuthenticated();
    const shouldUseBackend = authCheck || isAuthenticated;
    
    setShouldUseBackendService(shouldUseBackend);
    
   
  }, [isAuthenticated, user]);

  // Initialize backend service when authenticated
  useEffect(() => {
    const initBackend = async () => {
      if (!shouldUseBackendService) {
        setIsBackendInitialized(false);
        return;
      }
      
      try {
        await backendWorkspaceService.init();
        setIsBackendInitialized(true);
      } catch (error) {
        console.error('❌ [SyncContext] Backend init failed:', error);
        setIsBackendInitialized(false);
      }
    };

    initBackend();
  }, [shouldUseBackendService, initCounter]);

  // Listen for login events to trigger re-initialization
  useEffect(() => {
    const handleLoginSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const loginUser = customEvent.detail?.user;
      
      // Trust the event data - auth:login is only dispatched after successful login
      // No timeout needed - the event itself is the signal that auth is ready
      const authCheck = authService.isAuthenticated();
    
      
      if (authCheck || loginUser) {
        // Force re-init by incrementing counter
        // The auth event is authoritative - if we received it, login succeeded
        setInitCounter(prev => prev + 1);
        
        // Trigger batch sync after backend service is initialized
        // Listen for the init complete event instead of using a timeout
        const handleBackendReady = async () => {
          window.removeEventListener('sync:backend-ready', handleBackendReady);
          
          try {
            const { batchSyncService } = await import('@/services/sync/BatchSyncService');
            const results = await batchSyncService.syncAllWorkspaces();
            
            // Log results
            let totalOps = 0;
            let totalSuccessful = 0;
            let totalFailed = 0;
            
            for (const result of results.values()) {
              totalOps += result.total;
              totalSuccessful += result.successful;
              totalFailed += result.failed;
            }
            
            if (totalOps > 0) {
              
              // Refresh documents to show updated sync status
              window.dispatchEvent(new CustomEvent('batch-sync-complete', {
                detail: { totalOps, totalSuccessful, totalFailed }
              }));
            } else {
              console.log('ℹ️ [SyncContext] No pending operations to sync');
            }
          } catch (error) {
            console.error('❌ [SyncContext] Batch sync failed:', error);
          }
        };
        
        // If backend is already initialized (rare), run immediately
        if (backendWorkspaceService.initialized) {
          handleBackendReady();
        } else {
          // Otherwise wait for initialization to complete
          window.addEventListener('sync:backend-ready', handleBackendReady);
          
          // Cleanup after 10s if event never fires (safety net)
          setTimeout(() => {
            window.removeEventListener('sync:backend-ready', handleBackendReady);
          }, 10000);
        }
      } else {
        console.warn('⚠️ [SyncContext] Login event received but auth check failed. This should not happen.');
      }
    };
    
    window.addEventListener('auth:login', handleLoginSuccess);
    return () => window.removeEventListener('auth:login', handleLoginSuccess);
  }, [isAuthenticated, user]);

  const forceReinit = () => {
    setInitCounter(prev => prev + 1);
  };

  return (
    <SyncContext.Provider
      value={{
        shouldUseBackendService,
        isBackendInitialized,
        forceReinit,
        initCounter,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}


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
    
    console.log('🔄 [SyncContext] Service selection:', {
      'React isAuthenticated': isAuthenticated,
      'Direct auth check': authCheck,
      'Using': shouldUseBackend ? 'backend (cloud)' : 'guest (local)',
      'Has user': !!user,
    });
  }, [isAuthenticated, user]);

  // Initialize backend service when authenticated
  useEffect(() => {
    const initBackend = async () => {
      if (!shouldUseBackendService) {
        setIsBackendInitialized(false);
        return;
      }
      
      try {
        console.log('🔐 [SyncContext] Initializing backend service...');
        await backendWorkspaceService.init();
        setIsBackendInitialized(true);
        console.log('✅ [SyncContext] Backend service initialized');
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
      console.log('🔔 [SyncContext] Login event detected:', loginUser?.username || loginUser?.email);
      
      // Wait for React state to update
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify auth is actually set
      const authCheck = authService.isAuthenticated();
      console.log('🔍 [SyncContext] Post-login auth check:', {
        'Direct auth check': authCheck,
        'Has login user': !!loginUser,
        'React isAuthenticated': isAuthenticated,
        'React user': !!user,
      });
      
      if (authCheck) {
        // Force re-init by incrementing counter
        setInitCounter(prev => prev + 1);
        console.log('✅ [SyncContext] Forcing re-init after login');
        
        // 🔥 NEW: Trigger batch sync after login
        // This syncs all pending offline changes to the cloud
        setTimeout(async () => {
          try {
            console.log('🔄 [SyncContext] Starting batch sync after login...');
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
              console.log(`✅ [SyncContext] Batch sync complete: ${totalSuccessful}/${totalOps} successful`);
              
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
        }, 1000); // Wait 1s after login to ensure everything is initialized
      } else {
        console.warn('⚠️ [SyncContext] Login event but auth check failed, retrying...');
        // Retry once more after another delay
        setTimeout(() => {
          if (authService.isAuthenticated()) {
            setInitCounter(prev => prev + 1);
          }
        }, 200);
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


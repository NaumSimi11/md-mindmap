/**
 * UI State Context
 * =================
 * 
 * Manages UI-only state (modals, prompts, toasts)
 * NO business logic, NO data operations
 * Just UI state and display logic
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWorkspaceData } from '../workspace/WorkspaceDataContext';
import { useDocumentData } from '../workspace/DocumentDataContext';
import { guestWorkspaceService } from '@/services/workspace';
import { yjsHydrationService } from '@/services/yjs/YjsHydrationService';
import ReloadModalWrapper from '../ReloadModalWrapper';

interface UIStateContextType {
  /** Reload prompt for external file changes */
  reloadPrompt: {
    documentId: string;
    filePath: string;
    changeCount: number;
    timestamp: number;
  } | null;
  
  /** Dismiss reload prompt */
  dismissReloadPrompt: () => void;
  
  /** Guest document migration prompt */
  guestDocumentPrompt: {
    count: number;
    workspaceId: string;
  } | null;
  
  /** Handle "Push to Cloud" action */
  handlePushGuestDocuments: () => Promise<void>;
  
  /** Dismiss guest document prompt */
  dismissGuestDocumentPrompt: () => void;
  
  /** Guest mode explainer toast */
  showGuestExplainer: boolean;
  
  /** Dismiss guest explainer */
  dismissGuestExplainer: () => void;
}

const UIStateContext = createContext<UIStateContextType | null>(null);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspaceData();
  const { refreshDocuments } = useDocumentData();
  
  const [reloadPrompt, setReloadPrompt] = useState<{
    documentId: string;
    filePath: string;
    changeCount: number;
    timestamp: number;
  } | null>(null);
  
  const [guestDocumentPrompt, setGuestDocumentPrompt] = useState<{
    count: number;
    workspaceId: string;
  } | null>(null);
  
  const [showGuestExplainer, setShowGuestExplainer] = useState(false);

  // Listen for external file change events (Tauri)
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { fileWatcherService } = await import('@/services/tauri/FileWatcherService');
        unsub = fileWatcherService.onExternalFileChange((event) => {
          setReloadPrompt(prev => {
            if (prev && prev.documentId === event.documentId) {
              return {
                documentId: event.documentId,
                filePath: event.filePath,
                changeCount: prev.changeCount + event.count,
                timestamp: Date.now(),
              };
            }
            return {
              documentId: event.documentId,
              filePath: event.filePath,
              changeCount: event.count,
              timestamp: Date.now(),
            };
          });
        });
      } catch (err) {
        console.warn('⚠️ [UIState] FileWatcherService not available:', err);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Listen for auth:login to show guest document migration prompt
  useEffect(() => {
    const handleLoginSuccess = async () => {
      try {
        const guestDocs = await guestWorkspaceService.getDocuments();
        if (guestDocs.length > 0) {
          const currentWs = await guestWorkspaceService.getCurrentWorkspace();
          console.log(`📋 [UIState] Found ${guestDocs.length} guest documents after login`);
          setGuestDocumentPrompt({
            count: guestDocs.length,
            workspaceId: currentWs?.id || '',
          });
        }
      } catch (error) {
        console.warn('⚠️ [UIState] Failed to check guest documents:', error);
      }
    };
    
    window.addEventListener('auth:login', handleLoginSuccess);
    return () => window.removeEventListener('auth:login', handleLoginSuccess);
  }, []);

  // Listen for first guest document creation
  useEffect(() => {
    const handleFirstGuestDoc = () => {
      setShowGuestExplainer(true);
      // Auto-hide after 8 seconds
      setTimeout(() => setShowGuestExplainer(false), 8000);
    };
    
    window.addEventListener('first-guest-document-created', handleFirstGuestDoc);
    return () => window.removeEventListener('first-guest-document-created', handleFirstGuestDoc);
  }, []);

  const dismissReloadPrompt = () => setReloadPrompt(null);
  const dismissGuestDocumentPrompt = () => setGuestDocumentPrompt(null);
  const dismissGuestExplainer = () => setShowGuestExplainer(false);

  // Handle "Push to Cloud" action
  const handlePushGuestDocuments = async () => {
    if (!guestDocumentPrompt) return;
    
    try {
      console.log(`🚀 [UIState] Pushing ${guestDocumentPrompt.count} guest documents...`);
      const guestDocs = await guestWorkspaceService.getDocuments();
      
      const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const doc of guestDocs) {
        try {
          const result = await selectiveSyncService.pushDocument(doc.id);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.warn(`⚠️ [UIState] Failed to push ${doc.title}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ [UIState] Error pushing ${doc.title}:`, error);
        }
      }
      
      console.log(`✅ [UIState] Push complete: ${successCount} succeeded, ${failCount} failed`);
      
      // Close prompt
      setGuestDocumentPrompt(null);
      
      // Refresh documents to show newly synced ones
      await refreshDocuments();
    } catch (error) {
      console.error('❌ [UIState] Failed to push guest documents:', error);
    }
  };

  return (
    <UIStateContext.Provider
      value={{
        reloadPrompt,
        dismissReloadPrompt,
        guestDocumentPrompt,
        handlePushGuestDocuments,
        dismissGuestDocumentPrompt,
        showGuestExplainer,
        dismissGuestExplainer,
      }}
    >
      {children}

      {/* Reload confirmation modal */}
      {reloadPrompt && (
        <React.Suspense fallback={null}>
          <ReloadModalWrapper
            reloadPrompt={reloadPrompt}
            onClose={dismissReloadPrompt}
            snapshotBeforeReload={yjsHydrationService.snapshotBeforeReload.bind(yjsHydrationService)}
          />
        </React.Suspense>
      )}
      
      {/* Guest document migration prompt */}
      {guestDocumentPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              📋 Local Documents Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have <strong>{guestDocumentPrompt.count} local document{guestDocumentPrompt.count !== 1 ? 's' : ''}</strong> created before logging in.
              Would you like to push them to the cloud to sync across devices?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handlePushGuestDocuments}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                ☁️ Push to Cloud
              </button>
              <button
                onClick={dismissGuestDocumentPrompt}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Keep Local
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              💡 Tip: Local documents will remain accessible but won't sync across devices.
            </p>
          </div>
        </div>
      )}
      
      {/* Guest mode explainer toast */}
      {showGuestExplainer && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm border-2 border-blue-400">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-semibold mb-1">Local-Only Mode</h3>
                <p className="text-sm text-blue-100 mb-2">
                  Your document is saved locally in your browser. It won't sync across devices until you login and push to cloud.
                </p>
                <button
                  onClick={dismissGuestExplainer}
                  className="text-xs text-blue-200 hover:text-white underline"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}


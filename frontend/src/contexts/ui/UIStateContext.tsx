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

/** Document sync category for smart prompt */
interface DocumentSyncCategory {
  /** Never synced - pure local documents */
  pureLocal: number;
  /** Has cloudId but modified while offline */
  modifiedOffline: number;
  /** Total documents needing sync */
  total: number;
  /** Document details for display */
  documents: Array<{
    id: string;
    title: string;
    category: 'pure-local' | 'modified-offline';
  }>;
}

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
  
  /** Guest document migration prompt - now with categories */
  guestDocumentPrompt: {
    categories: DocumentSyncCategory;
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
    categories: DocumentSyncCategory;
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
          
          // 🔥 Categorize documents by sync status
          const categories: DocumentSyncCategory = {
            pureLocal: 0,
            modifiedOffline: 0,
            total: 0,
            documents: [],
          };
          
          for (const doc of guestDocs) {
            // Check if document has a cloudId (was previously synced)
            const hasCloudId = !!doc.cloudId;
            // Check if it's modified (has local changes)
            const isModified = doc.syncStatus === 'modified' || doc.syncStatus === 'pending';
            // Check if it's pure local (never synced)
            const isPureLocal = doc.syncStatus === 'local' && !hasCloudId;
            
            if (isPureLocal) {
              categories.pureLocal++;
              categories.documents.push({
                id: doc.id,
                title: doc.title,
                category: 'pure-local',
              });
            } else if (hasCloudId && (isModified || doc.syncStatus === 'local')) {
              // Has cloudId but has local changes made offline
              categories.modifiedOffline++;
              categories.documents.push({
                id: doc.id,
                title: doc.title,
                category: 'modified-offline',
              });
            }
          }
          
          categories.total = categories.pureLocal + categories.modifiedOffline;
          
          if (categories.total > 0) {
         
            
            setGuestDocumentPrompt({
              categories,
              workspaceId: currentWs?.id || '',
            });
          }
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
      const { categories } = guestDocumentPrompt;
     
      
      const { selectiveSyncService } = await import('@/services/sync/SelectiveSyncService');
      
      let successCount = 0;
      let failCount = 0;
      
      // Push each categorized document
      for (const doc of categories.documents) {
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
      
      
      // Close prompt
      setGuestDocumentPrompt(null);
      
      // Refresh documents to show newly synced ones
      await refreshDocuments();
    } catch (error) {
      console.error('❌ [UIState] Failed to push documents:', error);
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
      
      {/* Guest document migration prompt - Enhanced with categories */}
      {guestDocumentPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">📋</span> Documents Need Syncing
            </h2>
            
            {/* Category breakdown */}
            <div className="space-y-3 mb-6">
              {guestDocumentPrompt.categories.pureLocal > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {guestDocumentPrompt.categories.pureLocal} local document{guestDocumentPrompt.categories.pureLocal !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Created while not logged in. Never synced to cloud.
                    </p>
                  </div>
                </div>
              )}
              
              {guestDocumentPrompt.categories.modifiedOffline > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {guestDocumentPrompt.categories.modifiedOffline} modified offline
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Changes made while offline. Need to sync with cloud.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Would you like to push {guestDocumentPrompt.categories.total === 1 ? 'this document' : 'these documents'} to the cloud?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handlePushGuestDocuments}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                ☁️ Push to Cloud
              </button>
              <button
                onClick={dismissGuestDocumentPrompt}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Keep Local
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              💡 Local documents remain accessible but won't sync across devices.
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


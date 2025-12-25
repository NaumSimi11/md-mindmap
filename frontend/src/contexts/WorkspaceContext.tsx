/**
 * Workspace Context (Compatibility Shim)
 * ========================================
 * 
 * This file is now a COMPATIBILITY LAYER for backward compatibility.
 * All business logic has been moved to separate contexts:
 * 
 * - SyncContext: Dual storage orchestration
 * - WorkspaceDataContext: Workspace state management
 * - DocumentDataContext: Document state management
 * - UIStateContext: Modal and prompt UI
 * 
 * This shim re-exports hooks and types to maintain backward compatibility
 * with existing components that import from this file.
 * 
 * MIGRATION GUIDE:
 * ----------------
 * Old: import { useWorkspace } from '@/contexts/WorkspaceContext';
 * New: import { useWorkspaceData } from '@/contexts/workspace/WorkspaceDataContext';
 *      import { useDocumentData } from '@/contexts/workspace/DocumentDataContext';
 *      import { useSync } from '@/contexts/workspace/SyncContext';
 *      import { useUIState } from '@/contexts/ui/UIStateContext';
 */

import { useWorkspaceData } from './workspace/WorkspaceDataContext';
import { useDocumentData, type Document } from './workspace/DocumentDataContext';
import { useUIState } from './ui/UIStateContext';
import type { Workspace as WorkspaceServiceType } from '@/services/workspace/types';

// Re-export Document type for backward compatibility
export type { Document };

// Legacy Workspace type (for compatibility with existing components)
// Uses the service type as base with additional sync property for backward compat
interface Workspace extends WorkspaceServiceType {
  sync?: {
    status: 'local' | 'synced' | 'syncing' | 'conflict';
    lastSyncedAt?: Date;
    cloudVersion?: number;
    localVersion?: number;
  };
}

// Legacy WorkspaceContextType (for backward compatibility)
interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  reloadPrompt: {
    documentId: string;
    filePath: string;
    changeCount: number;
    timestamp: number;
  } | null;
  
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  createWorkspace: (data: { name: string; description: string; icon: string }) => Promise<Workspace>;
  createDocument: (type: Document['type'], title: string, content?: string, folderId?: string | null) => Promise<Document>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  getDocument: (documentId: string) => Promise<Document | undefined>;
  refreshDocuments: () => Promise<void>;
  autoSaveDocument: (documentId: string, content: string) => void;
}

/**
 * useWorkspace - Compatibility hook
 * 
 * Composes all context hooks into a single hook for backward compatibility.
 * 
 * @deprecated This is a compatibility shim. For new code, use:
 * - useWorkspaceData() for workspace operations
 * - useDocumentData() for document operations
 * - useUIState() for UI state
 * - useSync() for sync status
 */
export function useWorkspace(): WorkspaceContextType {
  const {
    workspaces,
    currentWorkspace,
    isLoading: workspaceLoading,
    error: workspaceError,
    switchWorkspace,
    createWorkspace,
  } = useWorkspaceData();
  
  const {
    documents,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments,
    autoSaveDocument,
  } = useDocumentData();
  
  const {
    reloadPrompt,
  } = useUIState();

  // Map workspace types to legacy format
  const mappedWorkspaces: Workspace[] = workspaces.map(ws => {
    const anyWs = ws as any; // Type assertion for cloudId (added in WorkspaceDataContext)
    return {
      id: ws.id,
      name: ws.name,
      icon: ws.icon,
      description: ws.description,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      syncStatus: ws.syncStatus,
      cloudId: anyWs.cloudId,
      lastSyncedAt: ws.lastSyncedAt,
      version: ws.version,
      sync: {
        status: ws.syncStatus || 'synced',
        lastSyncedAt: ws.lastSyncedAt ? new Date(ws.lastSyncedAt) : undefined,
        cloudVersion: ws.version,
        localVersion: ws.version,
      },
    };
  });

  const mappedCurrentWorkspace = currentWorkspace ? {
    id: currentWorkspace.id,
    name: currentWorkspace.name,
    icon: currentWorkspace.icon,
    description: currentWorkspace.description,
    createdAt: currentWorkspace.createdAt,
    updatedAt: currentWorkspace.updatedAt,
    syncStatus: currentWorkspace.syncStatus,
    cloudId: (currentWorkspace as any).cloudId, // Type assertion for cloudId
    lastSyncedAt: currentWorkspace.lastSyncedAt,
    version: currentWorkspace.version,
    sync: {
      status: currentWorkspace.syncStatus || 'synced',
      lastSyncedAt: currentWorkspace.lastSyncedAt ? new Date(currentWorkspace.lastSyncedAt) : undefined,
      cloudVersion: currentWorkspace.version,
      localVersion: currentWorkspace.version,
    },
  } : null;

  return {
    workspaces: mappedWorkspaces,
    currentWorkspace: mappedCurrentWorkspace,
    documents,
    isLoading: workspaceLoading,
    error: workspaceError,
    reloadPrompt,
    switchWorkspace,
    createWorkspace,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    refreshDocuments,
    autoSaveDocument,
  };
}

// Re-export new context providers for components that want to migrate
export { AppDataProvider } from './AppDataProvider';
export { useWorkspaceData } from './workspace/WorkspaceDataContext';
export { useDocumentData } from './workspace/DocumentDataContext';
export { useSync } from './workspace/SyncContext';
export { useUIState } from './ui/UIStateContext';

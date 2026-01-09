/**
 * Workspace Data Context
 * =======================
 * 
 * Pure workspace state management
 * NO document logic, NO sync orchestration
 * Just workspaces: list, current, switch, create
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSync } from './SyncContext';
import { backendWorkspaceService, guestWorkspaceService } from '@/services/workspace';
import type { Workspace as WorkspaceType } from '@/services/workspace/types';

// Type alias for consistency
type Workspace = WorkspaceType;

const LAST_WORKSPACE_KEY = 'mdreader:last-workspace-id';

interface WorkspaceDataContextType {
  /** All workspaces (local + cloud, deduplicated) */
  workspaces: Workspace[];
  
  /** Currently active workspace */
  currentWorkspace: Workspace | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Switch to different workspace */
  switchWorkspace: (workspace: Workspace) => Promise<void>;
  
  /** Create new workspace */
  createWorkspace: (data: { 
    name: string; 
    description: string; 
    icon: string;
  }) => Promise<Workspace>;
  
  /** Update workspace */
  updateWorkspace: (workspaceId: string, data: Partial<{
    name: string;
    description: string;
    icon: string;
  }>) => Promise<void>;
  
  /** Delete workspace */
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  
  /** Force reload workspaces */
  reloadWorkspaces: () => Promise<void>;
}

const WorkspaceDataContext = createContext<WorkspaceDataContextType | null>(null);

export function WorkspaceDataProvider({ children }: { children: ReactNode }) {
  const { shouldUseBackendService, isBackendInitialized, initCounter } = useSync();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map workspace to common format
  const mapWorkspace = (ws: any): Workspace => ({
    id: ws.id,
    name: ws.name,
    icon: ws.icon,
    description: ws.description,
    createdAt: typeof ws.createdAt === 'string' ? ws.createdAt : ws.createdAt.toISOString(),
    updatedAt: typeof ws.updatedAt === 'string' ? ws.updatedAt : ws.updatedAt.toISOString(),
    syncMode: ws.syncMode || (ws.syncStatus === 'local' ? 'local' : 'cloud'),
    syncStatus: ws.syncStatus || 'synced',
    cloudId: ws.cloudId,
    lastSyncedAt: ws.lastSyncedAt,
    version: ws.version || 1,
  });

  // Load workspaces on init
  const loadWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load from appropriate service
      if (!shouldUseBackendService) {
        // Guest mode: Load only guest workspaces
        const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
        const mapped = guestWorkspaces.map(ws => ({
          ...mapWorkspace(ws),
          syncStatus: 'local' as const,
        }));
        setWorkspaces(mapped);
        
        // Load current workspace
        const currentWs = await guestWorkspaceService.getCurrentWorkspace();
        if (currentWs) {
          setCurrentWorkspace(mapWorkspace({ ...currentWs, syncStatus: 'local' }));
          localStorage.setItem(LAST_WORKSPACE_KEY, currentWs.id);
        }
        
        return;
      }

      // Authenticated mode: Load and merge guest + backend workspaces
      
      // Wait for backend to be initialized
      if (!isBackendInitialized) {
        return;
      }

      // 1. Load guest workspaces (local IndexedDB)
      const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
      
      // 2. Load backend workspaces (cloud/cache)
      const backendWorkspaces = await backendWorkspaceService.getAllWorkspaces();
      
      // 3. Merge workspaces - prioritize cloud, add ONE local workspace
      const backendMapped = backendWorkspaces.map(mapWorkspace);
      
      // For logged-in users: Show cloud workspaces + single "Local Workspace"
      // Find or create the primary local workspace (for offline work)
      const primaryLocalWorkspace = guestWorkspaces[0];
      
      // Start with cloud workspaces
      const allWorkspaces: Workspace[] = [...backendMapped];
      
      // Add ONE local workspace if it exists (for offline editing)
      if (primaryLocalWorkspace) {
        const localMapped: Workspace = {
          ...mapWorkspace(primaryLocalWorkspace),
          syncStatus: 'local' as const,
          // Mark clearly as local-only
          name: primaryLocalWorkspace.name === 'Local Workspace' 
            ? 'Local Workspace' 
            : primaryLocalWorkspace.name,
          description: 'Your local workspace (not synced)',
        };
        
        // Only add if not already represented in cloud workspaces
        const alreadyInCloud = backendMapped.some(
          bws => bws.name === primaryLocalWorkspace.name
        );
        
        if (!alreadyInCloud) {
          allWorkspaces.push(localMapped);
        }
      }

      setWorkspaces(allWorkspaces);
      

      // 4. Load current workspace (prefer last used, or first available)
      const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
      const workspace = allWorkspaces.find(w => w.id === lastWorkspaceId) || allWorkspaces[0];

      if (workspace) {
        setCurrentWorkspace(workspace);
        localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
      }
    } catch (err: any) {
      console.error('❌ [WorkspaceData] Load failed:', err);
      setError(err.message || 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [shouldUseBackendService, isBackendInitialized, initCounter]);

  // Load workspaces on mount and when sync state changes
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Switch workspace
  const switchWorkspace = useCallback(async (workspace: Workspace) => {
    try {
      setIsLoading(true);
      
      const isLocalOnly = workspace.syncStatus === 'local';
      
      // Switch in appropriate service
      if (!shouldUseBackendService || isLocalOnly) {
        await guestWorkspaceService.switchWorkspace(workspace.id);
      } else {
        await backendWorkspaceService.switchWorkspace(workspace.id);
      }
      
      setCurrentWorkspace(workspace);
      localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
      
      // Emit event for DocumentDataContext to reload documents
      window.dispatchEvent(new CustomEvent('workspace:switched', {
        detail: { workspace }
      }));
    } catch (err) {
      console.error('❌ [WorkspaceData] Switch failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [shouldUseBackendService]);

  // Create workspace
  const createWorkspace = useCallback(async (data: { 
    name: string; 
    description: string; 
    icon: string;
  }): Promise<Workspace> => {
    
    // Guest mode: Use guest service
    if (!shouldUseBackendService) {
      const newWorkspace = await guestWorkspaceService.createWorkspace({
        name: data.name,
        icon: data.icon,
        description: data.description,
      });
      
      // Switch to new workspace
      await guestWorkspaceService.switchWorkspace(newWorkspace.id);
      
      // Reload workspaces
      const allWorkspaces = await guestWorkspaceService.getAllWorkspaces();
      const mapped = allWorkspaces.map(ws => ({
        ...mapWorkspace(ws),
        syncStatus: 'local' as const,
      }));
      setWorkspaces(mapped);
      
      const mappedNew = { ...mapWorkspace(newWorkspace), syncStatus: 'local' as const };
      setCurrentWorkspace(mappedNew);
      localStorage.setItem(LAST_WORKSPACE_KEY, newWorkspace.id);
      
      
      // Emit event for DocumentDataContext
      window.dispatchEvent(new CustomEvent('workspace:created', {
        detail: { workspace: mappedNew }
      }));
      
      return mappedNew;
    }
    
    // Authenticated mode: Use backend service
    const newWorkspace = await backendWorkspaceService.createWorkspace({
      name: data.name,
      icon: data.icon,
      description: data.description,
    });
    
    const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
    const mapped = allWorkspaces.map(mapWorkspace);
    setWorkspaces(mapped);
    
    const mappedNew = mapWorkspace(newWorkspace);
    setCurrentWorkspace(mappedNew);
    localStorage.setItem(LAST_WORKSPACE_KEY, newWorkspace.id);
    
    
    // Emit event for DocumentDataContext
    window.dispatchEvent(new CustomEvent('workspace:created', {
      detail: { workspace: mappedNew }
    }));
    
    return mappedNew;
  }, [shouldUseBackendService]);

  const reloadWorkspaces = useCallback(async () => {
    await loadWorkspaces();
  }, [loadWorkspaces]);

  // Update workspace
  const updateWorkspace = useCallback(async (
    workspaceId: string, 
    data: Partial<{ name: string; description: string; icon: string }>
  ) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const isLocalOnly = workspace.syncStatus === 'local';

    if (!shouldUseBackendService || isLocalOnly) {
      // Update in guest service (IndexedDB)
      await guestWorkspaceService.updateWorkspace(workspaceId, data);
    } else {
      // Update in backend service (API + cache)
      await backendWorkspaceService.updateWorkspace(workspaceId, data);
    }

    // Update local state
    setWorkspaces(prev => prev.map(w => 
      w.id === workspaceId 
        ? { ...w, ...data, updatedAt: new Date().toISOString() }
        : w
    ));

    // Update current workspace if it's the one being updated
    if (currentWorkspace?.id === workspaceId) {
      setCurrentWorkspace(prev => prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null);
    }

    // Emit event
    window.dispatchEvent(new CustomEvent('workspace:updated', {
      detail: { workspaceId, data }
    }));
  }, [workspaces, currentWorkspace, shouldUseBackendService]);

  // Delete workspace
  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    // Prevent deleting last workspace
    if (workspaces.length <= 1) {
      throw new Error('Cannot delete the last workspace');
    }

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const isLocalOnly = workspace.syncStatus === 'local';

    if (!shouldUseBackendService || isLocalOnly) {
      // Delete from guest service (IndexedDB)
      await guestWorkspaceService.deleteWorkspace(workspaceId);
    } else {
      // Delete from backend service (API + cache)
      await backendWorkspaceService.deleteWorkspace(workspaceId);
    }

    // Update local state
    const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
    setWorkspaces(remainingWorkspaces);

    // If deleted workspace was current, switch to first available
    if (currentWorkspace?.id === workspaceId) {
      const newCurrent = remainingWorkspaces[0];
      if (newCurrent) {
        setCurrentWorkspace(newCurrent);
        localStorage.setItem(LAST_WORKSPACE_KEY, newCurrent.id);
        
        // Switch in the service as well
        if (!shouldUseBackendService || newCurrent.syncStatus === 'local') {
          await guestWorkspaceService.switchWorkspace(newCurrent.id);
        } else {
          await backendWorkspaceService.switchWorkspace(newCurrent.id);
        }
      }
    }

    // Emit event
    window.dispatchEvent(new CustomEvent('workspace:deleted', {
      detail: { workspaceId }
    }));
  }, [workspaces, currentWorkspace, shouldUseBackendService]);

  return (
    <WorkspaceDataContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoading,
        error,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        reloadWorkspaces,
      }}
    >
      {children}
    </WorkspaceDataContext.Provider>
  );
}

export function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext);
  if (!context) {
    throw new Error('useWorkspaceData must be used within WorkspaceDataProvider');
  }
  return context;
}


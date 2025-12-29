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
import { getCanonicalWorkspaceKey } from '@/utils/identity';

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
        console.log('🌐 [WorkspaceData] Loading guest workspaces...');
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
        
        console.log(`✅ [WorkspaceData] Loaded ${mapped.length} guest workspace(s)`);
        return;
      }

      // Authenticated mode: Load and merge guest + backend workspaces
      console.log('🔐 [WorkspaceData] Loading authenticated workspaces...');
      
      // Wait for backend to be initialized
      if (!isBackendInitialized) {
        console.log('⏳ [WorkspaceData] Waiting for backend init...');
        return;
      }

      // 1. Load guest workspaces (local IndexedDB)
      const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
      console.log(`📦 [WorkspaceData] Loaded ${guestWorkspaces.length} guest workspace(s)`);
      
      // 2. Load backend workspaces (cloud/cache)
      const backendWorkspaces = await backendWorkspaceService.getAllWorkspaces();
      console.log(`☁️ [WorkspaceData] Loaded ${backendWorkspaces.length} backend workspace(s)`);
      
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
      
      console.log(`✅ [WorkspaceData] Loaded: ${backendMapped.length} cloud + ${primaryLocalWorkspace ? 1 : 0} local = ${allWorkspaces.length} total`);

      // 4. Load current workspace (prefer last used, or first available)
      const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
      const workspace = allWorkspaces.find(w => w.id === lastWorkspaceId) || allWorkspaces[0];

      if (workspace) {
        setCurrentWorkspace(workspace);
        localStorage.setItem(LAST_WORKSPACE_KEY, workspace.id);
        console.log('✅ [WorkspaceData] Current workspace:', workspace.name);
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
      console.log('🔄 [WorkspaceData] Switching to:', workspace.name);
      setIsLoading(true);
      
      const isLocalOnly = workspace.syncStatus === 'local';
      
      // Switch in appropriate service
      if (!shouldUseBackendService || isLocalOnly) {
        await guestWorkspaceService.switchWorkspace(workspace.id);
        console.log('✅ [WorkspaceData] Switched (guest service)');
      } else {
        await backendWorkspaceService.switchWorkspace(workspace.id);
        console.log('✅ [WorkspaceData] Switched (backend service)');
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
    console.log('🆕 [WorkspaceData] Creating workspace:', data.name);
    
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
      
      console.log('✅ [WorkspaceData] Guest workspace created:', newWorkspace.name);
      
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
    
    console.log('✅ [WorkspaceData] Backend workspace created:', newWorkspace.name);
    
    // Emit event for DocumentDataContext
    window.dispatchEvent(new CustomEvent('workspace:created', {
      detail: { workspace: mappedNew }
    }));
    
    return mappedNew;
  }, [shouldUseBackendService]);

  const reloadWorkspaces = useCallback(async () => {
    await loadWorkspaces();
  }, [loadWorkspaces]);

  return (
    <WorkspaceDataContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoading,
        error,
        switchWorkspace,
        createWorkspace,
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


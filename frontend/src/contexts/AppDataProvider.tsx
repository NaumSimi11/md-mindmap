/**
 * App Data Provider
 * ==================
 * 
 * Composes all data contexts in the correct dependency order
 * This is the SINGLE provider that wraps the entire app
 * 
 * Provider hierarchy (outer → inner):
 * 1. SyncProvider (auth & service selection)
 * 2. WorkspaceDataProvider (workspace state)
 * 3. DocumentDataProvider (document state)
 * 4. UIStateProvider (modals & prompts)
 */

import React, { ReactNode } from 'react';
import { SyncProvider } from './workspace/SyncContext';
import { WorkspaceDataProvider } from './workspace/WorkspaceDataContext';
import { DocumentDataProvider } from './workspace/DocumentDataContext';
import { UIStateProvider } from './ui/UIStateContext';

interface AppDataProviderProps {
  children: ReactNode;
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  return (
    <SyncProvider>
      <WorkspaceDataProvider>
        <DocumentDataProvider>
          <UIStateProvider>
            {children}
          </UIStateProvider>
        </DocumentDataProvider>
      </WorkspaceDataProvider>
    </SyncProvider>
  );
}


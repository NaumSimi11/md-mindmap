/**
 * useDocumentCollaborators
 * 
 * Tracks who's viewing/editing each document
 * Uses Yjs awareness to detect active users
 */

import { useState, useEffect } from 'react';
import type { WebsocketProvider } from 'y-websocket';
import type { CollaboratorInfo } from '@/components/collaboration/CollaborationBadge';

export function useDocumentCollaborators(
  documentId: string | null,
  provider: WebsocketProvider | null
): CollaboratorInfo[] {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);

  useEffect(() => {
    if (!documentId || !provider) {
      setCollaborators([]);
      return;
    }

    const awareness = provider.awareness;

    const updateCollaborators = () => {
      const states = Array.from(awareness.getStates().entries());
      const clientId = awareness.clientID;

      const collaboratorList: CollaboratorInfo[] = states
        .filter(([id]) => id !== clientId) // Exclude self
        .map(([id, state]: [number, any]) => ({
          id: id.toString(),
          name: state.user?.name || `User ${id}`,
          email: state.user?.email,
          color: state.user?.color || generateColor(id),
          isActive: true,
          lastSeen: new Date(),
        }));

      setCollaborators(collaboratorList);
    };

    // Initial update
    updateCollaborators();

    // Listen for awareness changes
    awareness.on('change', updateCollaborators);

    return () => {
      awareness.off('change', updateCollaborators);
    };
  }, [documentId, provider]);

  return collaborators;
}

/**
 * Generate consistent color for user
 */
function generateColor(seed: number): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[seed % colors.length];
}

/**
 * Hook to track all document collaborators across workspace
 */
export function useWorkspaceCollaborators(): Map<string, CollaboratorInfo[]> {
  const [collaboratorMap, setCollaboratorMap] = useState<Map<string, CollaboratorInfo[]>>(
    new Map()
  );

  // This would be populated by listening to all active document providers
  // For now, return empty map (can be implemented when needed)

  return collaboratorMap;
}


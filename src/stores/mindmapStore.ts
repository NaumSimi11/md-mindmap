import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

export interface MindmapSession {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
    lastModified: number;
    title?: string;
}

interface MindmapState {
    // Keyed by documentId (or 'default' if not associated with a doc)
    sessions: Record<string, MindmapSession>;

    // Actions
    updateSession: (docId: string, data: Partial<MindmapSession>) => void;
    getSession: (docId: string) => MindmapSession | null;
    clearSession: (docId: string) => void;

    // Helper to initialize a session if it doesn't exist
    initSession: (docId: string, initialData?: Partial<MindmapSession>) => void;
}

export const useMindmapStore = create<MindmapState>()(
    persist(
        (set, get) => ({
            sessions: {},

            updateSession: (docId, data) => {
                set((state) => {
                    const currentSession = state.sessions[docId] || {
                        nodes: [],
                        edges: [],
                        viewport: { x: 0, y: 0, zoom: 1 },
                        lastModified: Date.now(),
                    };

                    return {
                        sessions: {
                            ...state.sessions,
                            [docId]: {
                                ...currentSession,
                                ...data,
                                lastModified: Date.now(),
                            },
                        },
                    };
                });
            },

            getSession: (docId) => {
                return get().sessions[docId] || null;
            },

            clearSession: (docId) => {
                set((state) => {
                    const newSessions = { ...state.sessions };
                    delete newSessions[docId];
                    return { sessions: newSessions };
                });
            },

            initSession: (docId, initialData) => {
                const current = get().sessions[docId];
                if (!current) {
                    set((state) => ({
                        sessions: {
                            ...state.sessions,
                            [docId]: {
                                nodes: initialData?.nodes || [],
                                edges: initialData?.edges || [],
                                viewport: initialData?.viewport || { x: 0, y: 0, zoom: 1 },
                                lastModified: Date.now(),
                                title: initialData?.title,
                            },
                        },
                    }));
                }
            },
        }),
        {
            name: 'mindmap-storage', // unique name for localStorage key
        }
    )
);

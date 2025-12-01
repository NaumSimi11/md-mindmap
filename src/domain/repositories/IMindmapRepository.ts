/**
 * Mindmap Repository Interface
 * 
 * Contract for mindmap persistence.
 */

import { Mindmap } from '../entities/Mindmap';

export interface IMindmapRepository {
    /**
     * Save a mindmap (create or update)
     */
    save(mindmap: Mindmap): Promise<void>;

    /**
     * Find mindmap by ID
     */
    findById(id: string): Promise<Mindmap | null>;

    /**
     * Find all mindmaps
     */
    findAll(): Promise<Mindmap[]>;

    /**
     * Delete mindmap by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Find mindmaps by source document ID
     */
    findBySourceDocument(documentId: string): Promise<Mindmap[]>;

    /**
     * Get recently created mindmaps
     */
    getRecent(limit: number): Promise<Mindmap[]>;
}

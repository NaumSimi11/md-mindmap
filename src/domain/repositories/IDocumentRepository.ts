/**
 * Document Repository Interface
 * 
 * Contract for document persistence.
 * Infrastructure layer will implement this interface.
 */

import { Document } from '../entities/Document';

export interface IDocumentRepository {
    /**
     * Save a document (create or update)
     */
    save(document: Document): Promise<void>;

    /**
     * Find document by ID
     */
    findById(id: string): Promise<Document | null>;

    /**
     * Find all documents
     */
    findAll(): Promise<Document[]>;

    /**
     * Delete document by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Check if document exists
     */
    exists(id: string): Promise<boolean>;

    /**
     * Find documents by tag
     */
    findByTag(tag: string): Promise<Document[]>;

    /**
     * Find favorite documents
     */
    findFavorites(): Promise<Document[]>;

    /**
     * Search documents by title or content
     */
    search(query: string): Promise<Document[]>;

    /**
     * Get recently updated documents
     */
    getRecent(limit: number): Promise<Document[]>;
}

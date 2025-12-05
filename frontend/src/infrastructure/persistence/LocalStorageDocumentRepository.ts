/**
 * LocalStorage Document Repository Implementation
 * 
 * Fallback implementation for browser/web environments.
 */

import { Document, DocumentDTO } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';

export class LocalStorageDocumentRepository implements IDocumentRepository {
    private readonly storageKey = 'mdreader_documents';

    async save(document: Document): Promise<void> {
        const documents = await this.loadAll();
        const index = documents.findIndex(d => d.id === document.id);

        if (index >= 0) {
            documents[index] = document.toJSON();
        } else {
            documents.push(document.toJSON());
        }

        this.saveAll(documents);
    }

    async findById(id: string): Promise<Document | null> {
        const documents = await this.loadAll();
        const data = documents.find(d => d.id === id);
        return data ? Document.fromJSON(data) : null;
    }

    async findAll(): Promise<Document[]> {
        const documents = await this.loadAll();
        return documents.map(d => Document.fromJSON(d));
    }

    async delete(id: string): Promise<void> {
        const documents = await this.loadAll();
        const filtered = documents.filter(d => d.id !== id);
        this.saveAll(filtered);
    }

    async exists(id: string): Promise<boolean> {
        const documents = await this.loadAll();
        return documents.some(d => d.id === id);
    }

    async findByTag(tag: string): Promise<Document[]> {
        const all = await this.findAll();
        return all.filter(doc => doc.metadata?.tags?.includes(tag));
    }

    async findFavorites(): Promise<Document[]> {
        const all = await this.findAll();
        return all.filter(doc => doc.metadata?.isFavorite === true);
    }

    async search(query: string): Promise<Document[]> {
        const all = await this.findAll();
        const lowerQuery = query.toLowerCase();

        return all.filter(doc =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            doc.content.toLowerCase().includes(lowerQuery)
        );
    }

    async getRecent(limit: number): Promise<Document[]> {
        const all = await this.findAll();
        return all
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, limit);
    }

    // Private helpers

    private async loadAll(): Promise<DocumentDTO[]> {
        const json = localStorage.getItem(this.storageKey);
        return json ? JSON.parse(json) : [];
    }

    private saveAll(documents: DocumentDTO[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(documents));
    }
}

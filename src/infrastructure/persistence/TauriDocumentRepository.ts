/**
 * Tauri Document Repository Implementation
 * 
 * Implements IDocumentRepository using Tauri file system.
 */

import { Document, DocumentDTO } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';

export class TauriDocumentRepository implements IDocumentRepository {
    private readonly basePath = 'documents';

    async save(document: Document): Promise<void> {
        const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');

        // Ensure directory exists
        const dirExists = await exists(this.basePath);
        if (!dirExists) {
            await mkdir(this.basePath, { recursive: true });
        }

        // Save as JSON
        const filePath = `${this.basePath}/${document.id}.json`;
        const json = JSON.stringify(document.toJSON(), null, 2);
        await writeTextFile(filePath, json);
    }

    async findById(id: string): Promise<Document | null> {
        try {
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const filePath = `${this.basePath}/${id}.json`;
            const json = await readTextFile(filePath);
            const data: DocumentDTO = JSON.parse(json);
            return Document.fromJSON(data);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Document[]> {
        try {
            const { readDir } = await import('@tauri-apps/plugin-fs');
            const entries = await readDir(this.basePath);

            const documents: Document[] = [];
            for (const entry of entries) {
                if (entry.name?.endsWith('.json')) {
                    const id = entry.name.replace('.json', '');
                    const doc = await this.findById(id);
                    if (doc) documents.push(doc);
                }
            }

            return documents;
        } catch {
            return [];
        }
    }

    async delete(id: string): Promise<void> {
        const { remove } = await import('@tauri-apps/plugin-fs');
        const filePath = `${this.basePath}/${id}.json`;
        await remove(filePath);
    }

    async exists(id: string): Promise<boolean> {
        const { exists } = await import('@tauri-apps/plugin-fs');
        const filePath = `${this.basePath}/${id}.json`;
        return exists(filePath);
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
}

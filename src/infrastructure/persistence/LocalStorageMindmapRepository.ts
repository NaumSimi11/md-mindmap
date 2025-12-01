/**
 * LocalStorage Mindmap Repository Implementation
 */

import { Mindmap, MindmapDTO } from '@/domain/entities/Mindmap';
import { IMindmapRepository } from '@/domain/repositories/IMindmapRepository';

export class LocalStorageMindmapRepository implements IMindmapRepository {
    private readonly storageKey = 'mdreader_mindmaps';

    async save(mindmap: Mindmap): Promise<void> {
        const mindmaps = await this.loadAll();
        const index = mindmaps.findIndex(m => m.id === mindmap.id);

        if (index >= 0) {
            mindmaps[index] = mindmap.toJSON();
        } else {
            mindmaps.push(mindmap.toJSON());
        }

        this.saveAll(mindmaps);
    }

    async findById(id: string): Promise<Mindmap | null> {
        const mindmaps = await this.loadAll();
        const data = mindmaps.find(m => m.id === id);
        return data ? Mindmap.fromJSON(data) : null;
    }

    async findAll(): Promise<Mindmap[]> {
        const mindmaps = await this.loadAll();
        return mindmaps.map(m => Mindmap.fromJSON(m));
    }

    async delete(id: string): Promise<void> {
        const mindmaps = await this.loadAll();
        const filtered = mindmaps.filter(m => m.id !== id);
        this.saveAll(filtered);
    }

    async findBySourceDocument(documentId: string): Promise<Mindmap[]> {
        const all = await this.findAll();
        return all.filter(m => m.sourceDocumentId === documentId);
    }

    async getRecent(limit: number): Promise<Mindmap[]> {
        const all = await this.findAll();
        return all
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, limit);
    }

    private async loadAll(): Promise<MindmapDTO[]> {
        const json = localStorage.getItem(this.storageKey);
        return json ? JSON.parse(json) : [];
    }

    private saveAll(mindmaps: MindmapDTO[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(mindmaps));
    }
}

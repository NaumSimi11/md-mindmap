/**
 * Tauri Mindmap Repository Implementation
 */

import { Mindmap, MindmapDTO } from '@/domain/entities/Mindmap';
import { IMindmapRepository } from '@/domain/repositories/IMindmapRepository';

export class TauriMindmapRepository implements IMindmapRepository {
    private readonly basePath = 'mindmaps';

    async save(mindmap: Mindmap): Promise<void> {
        const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');

        const dirExists = await exists(this.basePath);
        if (!dirExists) {
            await mkdir(this.basePath, { recursive: true });
        }

        const filePath = `${this.basePath}/${mindmap.id}.json`;
        const json = JSON.stringify(mindmap.toJSON(), null, 2);
        await writeTextFile(filePath, json);
    }

    async findById(id: string): Promise<Mindmap | null> {
        try {
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const filePath = `${this.basePath}/${id}.json`;
            const json = await readTextFile(filePath);
            const data: MindmapDTO = JSON.parse(json);
            return Mindmap.fromJSON(data);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Mindmap[]> {
        try {
            const { readDir } = await import('@tauri-apps/plugin-fs');
            const entries = await readDir(this.basePath);

            const mindmaps: Mindmap[] = [];
            for (const entry of entries) {
                if (entry.name?.endsWith('.json')) {
                    const id = entry.name.replace('.json', '');
                    const mindmap = await this.findById(id);
                    if (mindmap) mindmaps.push(mindmap);
                }
            }

            return mindmaps;
        } catch {
            return [];
        }
    }

    async delete(id: string): Promise<void> {
        const { remove } = await import('@tauri-apps/plugin-fs');
        const filePath = `${this.basePath}/${id}.json`;
        await remove(filePath);
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
}

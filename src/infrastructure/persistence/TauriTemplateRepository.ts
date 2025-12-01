/**
 * Tauri Template Repository Implementation
 */

import { Template, TemplateDTO, TemplateCategory } from '@/domain/entities/Template';
import { ITemplateRepository } from '@/domain/repositories/ITemplateRepository';

export class TauriTemplateRepository implements ITemplateRepository {
    private readonly basePath = 'templates';

    async save(template: Template): Promise<void> {
        const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');

        const dirExists = await exists(this.basePath);
        if (!dirExists) {
            await mkdir(this.basePath, { recursive: true });
        }

        const filePath = `${this.basePath}/${template.id}.json`;
        const json = JSON.stringify(template.toJSON(), null, 2);
        await writeTextFile(filePath, json);
    }

    async findById(id: string): Promise<Template | null> {
        try {
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const filePath = `${this.basePath}/${id}.json`;
            const json = await readTextFile(filePath);
            const data: TemplateDTO = JSON.parse(json);
            return Template.fromJSON(data);
        } catch {
            return null;
        }
    }

    async findAll(): Promise<Template[]> {
        try {
            const { readDir } = await import('@tauri-apps/plugin-fs');
            const entries = await readDir(this.basePath);

            const templates: Template[] = [];
            for (const entry of entries) {
                if (entry.name?.endsWith('.json')) {
                    const id = entry.name.replace('.json', '');
                    const template = await this.findById(id);
                    if (template) templates.push(template);
                }
            }

            return templates;
        } catch {
            return [];
        }
    }

    async delete(id: string): Promise<void> {
        const { remove } = await import('@tauri-apps/plugin-fs');
        const filePath = `${this.basePath}/${id}.json`;
        await remove(filePath);
    }

    async findByCategory(category: TemplateCategory): Promise<Template[]> {
        const all = await this.findAll();
        return all.filter(t => t.category === category);
    }

    async search(query: string): Promise<Template[]> {
        const all = await this.findAll();
        const lowerQuery = query.toLowerCase();
        return all.filter(t => t.name.toLowerCase().includes(lowerQuery));
    }
}

/**
 * LocalStorage Template Repository Implementation
 */

import { Template, TemplateDTO, TemplateCategory } from '@/domain/entities/Template';
import { ITemplateRepository } from '@/domain/repositories/ITemplateRepository';

export class LocalStorageTemplateRepository implements ITemplateRepository {
    private readonly storageKey = 'mdreader_templates';

    async save(template: Template): Promise<void> {
        const templates = await this.loadAll();
        const index = templates.findIndex(t => t.id === template.id);

        if (index >= 0) {
            templates[index] = template.toJSON();
        } else {
            templates.push(template.toJSON());
        }

        this.saveAll(templates);
    }

    async findById(id: string): Promise<Template | null> {
        const templates = await this.loadAll();
        const data = templates.find(t => t.id === id);
        return data ? Template.fromJSON(data) : null;
    }

    async findAll(): Promise<Template[]> {
        const templates = await this.loadAll();
        return templates.map(t => Template.fromJSON(t));
    }

    async delete(id: string): Promise<void> {
        const templates = await this.loadAll();
        const filtered = templates.filter(t => t.id !== id);
        this.saveAll(filtered);
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

    private async loadAll(): Promise<TemplateDTO[]> {
        const json = localStorage.getItem(this.storageKey);
        return json ? JSON.parse(json) : [];
    }

    private saveAll(templates: TemplateDTO[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(templates));
    }
}

/**
 * Template Repository Interface
 * 
 * Contract for template persistence.
 */

import { Template, TemplateCategory } from '../entities/Template';

export interface ITemplateRepository {
    /**
     * Save a template (create or update)
     */
    save(template: Template): Promise<void>;

    /**
     * Find template by ID
     */
    findById(id: string): Promise<Template | null>;

    /**
     * Find all templates
     */
    findAll(): Promise<Template[]>;

    /**
     * Delete template by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Find templates by category
     */
    findByCategory(category: TemplateCategory): Promise<Template[]>;

    /**
     * Search templates by name
     */
    search(query: string): Promise<Template[]>;
}

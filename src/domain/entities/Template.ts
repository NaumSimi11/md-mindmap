/**
 * Template Entity - Core domain model
 * 
 * Represents a reusable markdown template.
 */

export class Template {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly content: string,
        public readonly category: TemplateCategory,
        public readonly description?: string,
        public readonly variables?: TemplateVariable[]
    ) {
        this.validate();
    }

    /**
     * Render template with provided variables
     */
    render(values: Record<string, string>): string {
        let rendered = this.content;

        // Replace variables
        if (this.variables) {
            for (const variable of this.variables) {
                const value = values[variable.name] || variable.defaultValue || '';
                const placeholder = `{{${variable.name}}}`;
                rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
            }
        }

        // Add current date if {{date}} is present
        if (rendered.includes('{{date}}')) {
            const today = new Date().toLocaleDateString();
            rendered = rendered.replace(/{{date}}/g, today);
        }

        return rendered;
    }

    /**
     * Check if template has variables
     */
    hasVariables(): boolean {
        return this.variables !== undefined && this.variables.length > 0;
    }

    /**
     * Get required variables (no default value)
     */
    getRequiredVariables(): TemplateVariable[] {
        if (!this.variables) return [];
        return this.variables.filter(v => !v.defaultValue);
    }

    /**
     * Domain validation
     */
    isValid(): boolean {
        return (
            this.id.length > 0 &&
            this.name.length > 0 &&
            this.content.length > 0
        );
    }

    /**
     * Convert to JSON
     */
    toJSON(): TemplateDTO {
        return {
            id: this.id,
            name: this.name,
            content: this.content,
            category: this.category,
            description: this.description,
            variables: this.variables,
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data: TemplateDTO): Template {
        return new Template(
            data.id,
            data.name,
            data.content,
            data.category,
            data.description,
            data.variables
        );
    }

    /**
     * Factory: Create new template
     */
    static create(
        name: string,
        content: string,
        category: TemplateCategory,
        description?: string
    ): Template {
        return new Template(
            crypto.randomUUID(),
            name,
            content,
            category,
            description
        );
    }

    private validate(): void {
        if (!this.isValid()) {
            throw new Error('Invalid template: id, name, and content are required');
        }
    }
}

/**
 * Template Category
 */
export enum TemplateCategory {
    MEETING = 'meeting',
    PROJECT = 'project',
    DOCUMENTATION = 'documentation',
    PERSONAL = 'personal',
    ACADEMIC = 'academic',
    OTHER = 'other',
}

/**
 * Template Variable
 */
export interface TemplateVariable {
    name: string;
    label: string;
    defaultValue?: string;
    placeholder?: string;
}

/**
 * Data Transfer Object
 */
export interface TemplateDTO {
    id: string;
    name: string;
    content: string;
    category: TemplateCategory;
    description?: string;
    variables?: TemplateVariable[];
}

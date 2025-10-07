/**
 * TemplateService - Core engine for Smart Templates
 * Handles template rendering, variable substitution, and management
 */

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  defaultValue?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'technical' | 'creative' | 'custom';
  icon: string;
  content: string;
  variables?: TemplateVariable[];
  metadata: {
    author?: string;
    tags: string[];
    version: string;
    lastModified: string;
    createdAt: string;
  };
  isCustom?: boolean;
}

export interface TemplateRenderOptions {
  variables?: Record<string, string>;
  includeDate?: boolean;
  customValues?: Record<string, string>;
}

class TemplateServiceClass {
  private templates: Map<string, Template> = new Map();
  private customTemplates: Map<string, Template> = new Map();

  constructor() {
    this.loadBuiltInTemplates();
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: Template['category']): Template[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get a specific template
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateId: string, options: TemplateRenderOptions = {}): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let content = template.content;

    // Apply variable substitutions
    if (template.variables) {
      template.variables.forEach(variable => {
        const value = options.variables?.[variable.key] ||
                     options.customValues?.[variable.key] ||
                     variable.defaultValue ||
                     `[${variable.label}]`;

        // Handle different variable types
        let replacement = value;
        if (variable.type === 'date' && options.includeDate) {
          replacement = new Date().toLocaleDateString();
        }

        content = content.replace(new RegExp(`{{${variable.key}}}`, 'g'), replacement);
      });
    }

    // Apply common substitutions
    content = content.replace(/{{date}}/g, new Date().toLocaleDateString());
    content = content.replace(/{{time}}/g, new Date().toLocaleTimeString());
    content = content.replace(/{{datetime}}/g, new Date().toISOString());

    return content;
  }

  /**
   * Create custom template
   */
  createCustomTemplate(template: Omit<Template, 'id' | 'metadata' | 'isCustom'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customTemplate: Template = {
      id,
      isCustom: true,
      metadata: {
        author: 'User',
        tags: template.tags || [],
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      ...template,
    };

    this.customTemplates.set(id, customTemplate);
    return id;
  }

  /**
   * Update custom template
   */
  updateCustomTemplate(id: string, updates: Partial<Template>): boolean {
    const template = this.customTemplates.get(id);
    if (!template || !template.isCustom) {
      return false;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        lastModified: new Date().toISOString(),
      },
    };

    this.customTemplates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Delete custom template
   */
  deleteCustomTemplate(id: string): boolean {
    return this.customTemplates.delete(id);
  }

  /**
   * Get all custom templates
   */
  getCustomTemplates(): Template[] {
    return Array.from(this.customTemplates.values());
  }

  /**
   * Load built-in templates
   */
  private loadBuiltInTemplates(): void {
    // These will be loaded from separate files
    // For now, we'll register them here
  }

  /**
   * Validate template content
   */
  validateTemplate(template: Omit<Template, 'id' | 'metadata'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.content?.trim()) {
      errors.push('Template content is required');
    }

    // Check for unmatched variables
    const variableMatches = template.content.match(/\{\{(\w+)\}\}/g) || [];
    const definedVariables = new Set(template.variables?.map(v => v.key) || []);

    variableMatches.forEach(match => {
      const varName = match.replace(/[{}]/g, '');
      if (!definedVariables.has(varName)) {
        errors.push(`Undefined variable: ${varName}`);
      }
    });

    // Check for invalid variable definitions
    template.variables?.forEach(variable => {
      if (!variable.key?.trim()) {
        errors.push('Variable key is required');
      }
      if (!variable.label?.trim()) {
        errors.push('Variable label is required');
      }
      if (variable.type === 'select' && !variable.options?.length) {
        errors.push(`Select variable ${variable.key} must have options`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export template
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template
   */
  importTemplate(templateJson: string): { success: boolean; template?: Template; error?: string } {
    try {
      const template = JSON.parse(templateJson) as Template;

      // Validate imported template
      const validation = this.validateTemplate(template);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid template: ${validation.errors.join(', ')}`,
        };
      }

      const importedTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          lastModified: new Date().toISOString(),
        },
      };

      this.registerTemplate(importedTemplate);
      return { success: true, template: importedTemplate };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse template JSON: ${error}`,
      };
    }
  }
}

// Export singleton instance
export const templateService = new TemplateServiceClass();

// Export types for use in other files
export type { Template, TemplateVariable, TemplateRenderOptions };

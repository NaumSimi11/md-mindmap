/**
 * Template Index - Loads and registers all built-in templates
 */

import { templateService } from '@/services/TemplateService';
import { meetingTemplate } from './meeting';
import { blogTemplate } from './blog';
import { docsTemplate } from './docs';
import { projectTemplate } from './project';
import { presentationTemplate } from './presentation';

/**
 * Register all built-in templates
 */
export function registerBuiltInTemplates(): void {
  templateService.registerTemplate(meetingTemplate);
  templateService.registerTemplate(blogTemplate);
  templateService.registerTemplate(docsTemplate);
  templateService.registerTemplate(projectTemplate);
  templateService.registerTemplate(presentationTemplate);
}

/**
 * Get template categories for UI
 */
export const templateCategories = [
  {
    id: 'business',
    name: 'Business',
    icon: '📅',
    description: 'Meeting notes, project plans, reports',
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: '📝',
    description: 'Journal, goals, personal notes',
  },
  {
    id: 'technical',
    name: 'Technical',
    icon: '⚙️',
    description: 'Documentation, API docs, technical guides',
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎨',
    description: 'Blog posts, stories, presentations',
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '⭐',
    description: 'Your custom templates',
  },
] as const;

/**
 * Template shortcuts for slash commands
 */
export const templateShortcuts = [
  { command: 'meeting', templateId: 'meeting-notes' },
  { command: 'blog', templateId: 'blog-post' },
  { command: 'docs', templateId: 'documentation' },
  { command: 'project', templateId: 'project-plan' },
  { command: 'presentation', templateId: 'presentation' },
];

/**
 * Initialize templates on module load
 */
registerBuiltInTemplates();

// Export all templates for debugging/testing
export {
  meetingTemplate,
  blogTemplate,
  docsTemplate,
  projectTemplate,
  presentationTemplate,
};

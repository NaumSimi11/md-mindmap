/**
 * MindmapTemplates - Pre-built mindmap templates
 * Quick-start templates for common use cases
 */

export interface MindmapTemplate {
  id: string;
  name: string;
  description: string;
  category: 'planning' | 'brainstorming' | 'project' | 'learning' | 'other';
  icon: string;
  nodes: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    type?: string;
    description?: string;
  }>;
  links: Array<{
    source: string;
    target: string;
  }>;
}

export const mindmapTemplates: MindmapTemplate[] = [
  {
    id: 'project-planning',
    name: 'Project Planning',
    description: 'Structured template for project organization',
    category: 'project',
    icon: '📋',
    nodes: [
      { id: 'root', label: 'Project', x: 400, y: 300, description: 'Main project goal' },
      { id: 'objectives', label: 'Objectives', x: 250, y: 200 },
      { id: 'timeline', label: 'Timeline', x: 250, y: 300 },
      { id: 'resources', label: 'Resources', x: 250, y: 400 },
      { id: 'risks', label: 'Risks', x: 550, y: 200 },
      { id: 'deliverables', label: 'Deliverables', x: 550, y: 300 },
      { id: 'stakeholders', label: 'Stakeholders', x: 550, y: 400 },
    ],
    links: [
      { source: 'root', target: 'objectives' },
      { source: 'root', target: 'timeline' },
      { source: 'root', target: 'resources' },
      { source: 'root', target: 'risks' },
      { source: 'root', target: 'deliverables' },
      { source: 'root', target: 'stakeholders' },
    ],
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    description: 'Free-form idea generation template',
    category: 'brainstorming',
    icon: '💡',
    nodes: [
      { id: 'central', label: 'Central Idea', x: 400, y: 300 },
      { id: 'branch1', label: 'Concept 1', x: 250, y: 200 },
      { id: 'branch2', label: 'Concept 2', x: 550, y: 200 },
      { id: 'branch3', label: 'Concept 3', x: 250, y: 400 },
      { id: 'branch4', label: 'Concept 4', x: 550, y: 400 },
    ],
    links: [
      { source: 'central', target: 'branch1' },
      { source: 'central', target: 'branch2' },
      { source: 'central', target: 'branch3' },
      { source: 'central', target: 'branch4' },
    ],
  },
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    description: 'Strategic planning framework',
    category: 'planning',
    icon: '🎯',
    nodes: [
      { id: 'center', label: 'SWOT Analysis', x: 400, y: 300 },
      { id: 'strengths', label: 'Strengths', x: 250, y: 200 },
      { id: 'weaknesses', label: 'Weaknesses', x: 550, y: 200 },
      { id: 'opportunities', label: 'Opportunities', x: 250, y: 400 },
      { id: 'threats', label: 'Threats', x: 550, y: 400 },
    ],
    links: [
      { source: 'center', target: 'strengths' },
      { source: 'center', target: 'weaknesses' },
      { source: 'center', target: 'opportunities' },
      { source: 'center', target: 'threats' },
    ],
  },
  {
    id: 'learning-notes',
    name: 'Learning Notes',
    description: 'Organize study materials and concepts',
    category: 'learning',
    icon: '📚',
    nodes: [
      { id: 'topic', label: 'Main Topic', x: 400, y: 300 },
      { id: 'concepts', label: 'Key Concepts', x: 250, y: 200 },
      { id: 'examples', label: 'Examples', x: 550, y: 200 },
      { id: 'questions', label: 'Questions', x: 250, y: 400 },
      { id: 'resources', label: 'Resources', x: 550, y: 400 },
    ],
    links: [
      { source: 'topic', target: 'concepts' },
      { source: 'topic', target: 'examples' },
      { source: 'topic', target: 'questions' },
      { source: 'topic', target: 'resources' },
    ],
  },
  {
    id: 'decision-making',
    name: 'Decision Making',
    description: 'Evaluate options and outcomes',
    category: 'planning',
    icon: '⚖️',
    nodes: [
      { id: 'decision', label: 'Decision', x: 400, y: 300 },
      { id: 'option1', label: 'Option A', x: 250, y: 200 },
      { id: 'option2', label: 'Option B', x: 550, y: 200 },
      { id: 'pros', label: 'Pros', x: 250, y: 400 },
      { id: 'cons', label: 'Cons', x: 400, y: 400 },
      { id: 'criteria', label: 'Criteria', x: 550, y: 400 },
    ],
    links: [
      { source: 'decision', target: 'option1' },
      { source: 'decision', target: 'option2' },
      { source: 'decision', target: 'pros' },
      { source: 'decision', target: 'cons' },
      { source: 'decision', target: 'criteria' },
    ],
  },
  {
    id: 'meeting-agenda',
    name: 'Meeting Agenda',
    description: 'Structure for productive meetings',
    category: 'project',
    icon: '🤝',
    nodes: [
      { id: 'meeting', label: 'Meeting', x: 400, y: 300 },
      { id: 'agenda', label: 'Agenda Items', x: 250, y: 200 },
      { id: 'attendees', label: 'Attendees', x: 550, y: 200 },
      { id: 'actions', label: 'Action Items', x: 250, y: 400 },
      { id: 'notes', label: 'Notes', x: 550, y: 400 },
    ],
    links: [
      { source: 'meeting', target: 'agenda' },
      { source: 'meeting', target: 'attendees' },
      { source: 'meeting', target: 'actions' },
      { source: 'meeting', target: 'notes' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    category: 'other',
    icon: '🎨',
    nodes: [
      { id: 'start', label: 'Start Here', x: 400, y: 300 },
    ],
    links: [],
  },
];

export class MindmapTemplateService {
  /**
   * Get all templates
   */
  getAllTemplates(): MindmapTemplate[] {
    return mindmapTemplates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: MindmapTemplate['category']): MindmapTemplate[] {
    return mindmapTemplates.filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): MindmapTemplate | undefined {
    return mindmapTemplates.find(t => t.id === id);
  }

  /**
   * Get categories
   */
  getCategories(): Array<{ id: MindmapTemplate['category']; name: string; icon: string }> {
    return [
      { id: 'planning', name: 'Planning', icon: '📋' },
      { id: 'brainstorming', name: 'Brainstorming', icon: '💡' },
      { id: 'project', name: 'Project', icon: '🚀' },
      { id: 'learning', name: 'Learning', icon: '📚' },
      { id: 'other', name: 'Other', icon: '✨' },
    ];
  }
}

// Export singleton
export const mindmapTemplateService = new MindmapTemplateService();

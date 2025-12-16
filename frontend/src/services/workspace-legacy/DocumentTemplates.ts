/**
 * DocumentTemplates - Pre-built templates for quick document creation
 * 
 * Provides professional templates for:
 * - Markdown documents (meeting notes, PRD, blog posts, etc.)
 * - Mindmaps (project roadmaps, brainstorming, etc.)
 * - Presentations (pitch decks, etc.)
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  icon: string;
  category: 'work' | 'personal' | 'education' | 'other';
  content: string; // Template content
  tags: string[];
}

// ============================================================================
// Template Definitions
// ============================================================================

export const documentTemplates: DocumentTemplate[] = [
  // ==========================================================================
  // MARKDOWN TEMPLATES
  // ==========================================================================
  
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured template for meeting notes with agenda and action items',
    type: 'markdown',
    icon: '📝',
    category: 'work',
    tags: ['meeting', 'notes', 'work'],
    content: `# Meeting Notes

**Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Time**: 
**Attendees**: 
**Location/Link**: 

## 📋 Agenda

1. 
2. 
3. 

## 💬 Discussion

### Topic 1: 


### Topic 2: 


### Topic 3: 


## ✅ Decisions Made

- 
- 

## 📌 Action Items

- [ ] **Task 1** (Assigned to: ) - Due: 
- [ ] **Task 2** (Assigned to: ) - Due: 
- [ ] **Task 3** (Assigned to: ) - Due: 

## 🔜 Next Steps


## 📝 Additional Notes


---
*Next meeting scheduled for: *
`,
  },

  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Complete project planning template with goals, scope, and timeline',
    type: 'markdown',
    icon: '📋',
    category: 'work',
    tags: ['project', 'planning', 'brief'],
    content: `# Project Brief: [Project Name]

## 📊 Executive Summary

*Brief overview of the project (2-3 sentences)*


## 🎯 Problem Statement

*What problem are we solving? Why is this important?*


## 🚀 Goals & Objectives

1. **Primary Goal**: 
2. **Secondary Goal**: 
3. **Tertiary Goal**: 

## 👥 Target Audience

*Who are we building this for?*


## 📦 Scope

### ✅ In Scope
- 
- 
- 

### ❌ Out of Scope
- 
- 
- 

## 📅 Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 |  |  |
| Phase 2 |  |  |
| Phase 3 |  |  |

- **Start Date**: 
- **End Date**: 
- **Launch Date**: 

## 💰 Budget

- **Estimated Budget**: $
- **Allocated Resources**: 

## 📈 Success Metrics

1. 
2. 
3. 

## 👥 Team

- **Project Manager**: 
- **Team Members**: 
- **Stakeholders**: 

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
|      |        |             |                     |

## 📋 Next Steps

1. 
2. 
3. 

---
*Last Updated: ${new Date().toLocaleDateString()}*
`,
  },

  {
    id: 'prd',
    name: 'Product Requirements (PRD)',
    description: 'Detailed product specification document',
    type: 'markdown',
    icon: '🎯',
    category: 'work',
    tags: ['product', 'requirements', 'prd'],
    content: `# Product Requirements Document

## 📱 Product Overview

*High-level description of what we're building*


## 🔍 Problem & Opportunity

### Current Situation


### Market Opportunity


### Why Now?


## 👤 Target Users

### Primary Persona
- **Name**: 
- **Role**: 
- **Pain Points**: 
- **Goals**: 

### Secondary Persona
- **Name**: 
- **Role**: 
- **Pain Points**: 
- **Goals**: 

## 📖 User Stories

1. As a [user type], I want to [action] so that [benefit]
2. As a [user type], I want to [action] so that [benefit]
3. As a [user type], I want to [action] so that [benefit]

## ✨ Features

### Must Have (P0)

#### Feature 1: [Name]
- **Description**: 
- **Acceptance Criteria**: 
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Priority**: P0

#### Feature 2: [Name]
- **Description**: 
- **Acceptance Criteria**: 
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Priority**: P0

### Should Have (P1)


### Nice to Have (P2)


## 🔄 User Flow

\`\`\`mermaid
graph LR
  A[User starts] --> B[Action 1]
  B --> C[Action 2]
  C --> D[Result]
\`\`\`

## 📊 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
|        |        |                   |

## 🛠️ Technical Considerations

### Architecture


### Security & Privacy


### Performance


### Scalability


## 📅 Timeline

- **Design Phase**: 
- **Development Phase**: 
- **Testing Phase**: 
- **Launch Date**: 

## ❓ Open Questions

1. 
2. 
3. 

## 📚 References

- 
- 

---
*Version: 1.0 | Last Updated: ${new Date().toLocaleDateString()}*
`,
  },

  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Blog article template with SEO structure',
    type: 'markdown',
    icon: '✍️',
    category: 'personal',
    tags: ['blog', 'writing', 'content'],
    content: `# [Your Blog Post Title Here]

**Published**: ${new Date().toLocaleDateString()}
**Author**: 
**Reading Time**: ~5 min
**Tags**: #tag1 #tag2 #tag3

---

## Introduction

*Hook your readers with a compelling opening. State the problem or question you're addressing.*


## Main Content

### Section 1: [Heading]

*First main point with details, examples, or data*


### Section 2: [Heading]

*Second main point*


### Section 3: [Heading]

*Third main point*


## Key Takeaways

- 🔑 **Takeaway 1**: 
- 🔑 **Takeaway 2**: 
- 🔑 **Takeaway 3**: 

## Conclusion

*Wrap up your main points and provide a clear conclusion*


## Call to Action

*What do you want readers to do next?*

---

### SEO Metadata

**Meta Title**: (50-60 characters)

**Meta Description**: (150-160 characters)

**Keywords**: keyword1, keyword2, keyword3

**Featured Image**: [URL or description]
`,
  },

  {
    id: 'weekly-report',
    name: 'Weekly Report',
    description: 'Weekly progress and status update template',
    type: 'markdown',
    icon: '📊',
    category: 'work',
    tags: ['report', 'weekly', 'status'],
    content: `# Weekly Report

**Week of**: ${new Date().toLocaleDateString()}
**Team/Project**: 
**Submitted by**: 

---

## 🎯 Key Accomplishments

- ✅ 
- ✅ 
- ✅ 

## 📈 Metrics & Progress

| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
|        |        |        | 🟢/🟡/🔴 |       |
|        |        |        | 🟢/🟡/🔴 |       |

## 🚧 Challenges & Blockers

### Challenge 1:
- **Description**: 
- **Impact**: 
- **Resolution**: 

### Challenge 2:
- **Description**: 
- **Impact**: 
- **Resolution**: 

## 📋 Next Week's Priorities

1. **High Priority**: 
2. **Medium Priority**: 
3. **Low Priority**: 

## 💡 Ideas & Opportunities

- 
- 

## 🤝 Help Needed

- 
- 

## 📝 Additional Notes


---
*Report generated: ${new Date().toLocaleDateString()}*
`,
  },

  // ==========================================================================
  // MINDMAP TEMPLATES
  // ==========================================================================

  {
    id: 'project-roadmap',
    name: 'Project Roadmap',
    description: 'Plan project phases, milestones, and tasks',
    type: 'mindmap',
    icon: '🗺️',
    category: 'work',
    tags: ['project', 'roadmap', 'planning'],
    content: JSON.stringify({
      nodes: [
        { 
          id: '1', 
          type: 'mindNode',
          data: { label: 'Project Name' }, 
          position: { x: 500, y: 100 } 
        },
        { 
          id: '2', 
          type: 'mindNode',
          data: { 
            label: 'Phase 1: Discovery',
            description: 'Research and planning',
            status: 'in-progress',
            priority: 'high',
          }, 
          position: { x: 200, y: 300 } 
        },
        { 
          id: '3', 
          type: 'mindNode',
          data: { 
            label: 'Phase 2: Design',
            description: 'UX/UI design',
            status: 'todo',
            priority: 'high',
          }, 
          position: { x: 400, y: 300 } 
        },
        { 
          id: '4', 
          type: 'mindNode',
          data: { 
            label: 'Phase 3: Development',
            description: 'Build the product',
            status: 'todo',
            priority: 'high',
          }, 
          position: { x: 600, y: 300 } 
        },
        { 
          id: '5', 
          type: 'mindNode',
          data: { 
            label: 'Phase 4: Launch',
            description: 'Go to market',
            status: 'todo',
            priority: 'medium',
          }, 
          position: { x: 800, y: 300 } 
        },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'default' },
        { id: 'e1-3', source: '1', target: '3', type: 'default' },
        { id: 'e1-4', source: '1', target: '4', type: 'default' },
        { id: 'e1-5', source: '1', target: '5', type: 'default' },
      ],
    }),
  },

  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Capture and organize ideas freely',
    type: 'mindmap',
    icon: '💡',
    category: 'work',
    tags: ['brainstorm', 'ideas', 'creative'],
    content: JSON.stringify({
      nodes: [
        { 
          id: '1', 
          type: 'mindNode',
          data: { label: 'Central Idea' }, 
          position: { x: 500, y: 250 } 
        },
        { 
          id: '2', 
          type: 'mindNode',
          data: { label: 'Category 1' }, 
          position: { x: 200, y: 400 } 
        },
        { 
          id: '3', 
          type: 'mindNode',
          data: { label: 'Category 2' }, 
          position: { x: 500, y: 400 } 
        },
        { 
          id: '4', 
          type: 'mindNode',
          data: { label: 'Category 3' }, 
          position: { x: 800, y: 400 } 
        },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'default' },
        { id: 'e1-3', source: '1', target: '3', type: 'default' },
        { id: 'e1-4', source: '1', target: '4', type: 'default' },
      ],
    }),
  },

  // ==========================================================================
  // PRESENTATION TEMPLATES
  // ==========================================================================

  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Investor/stakeholder presentation template',
    type: 'presentation',
    icon: '🚀',
    category: 'work',
    tags: ['pitch', 'presentation', 'investor'],
    content: JSON.stringify({
      title: 'Company Pitch Deck',
      theme: {
        name: 'Modern',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          background: '#ffffff',
          text: '#1f2937',
          accent: '#f59e0b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        spacing: 'normal',
      },
      slides: [
        { 
          layout: 'title', 
          content: { 
            title: 'Company Name', 
            subtitle: 'Your Tagline Here' 
          },
          order: 0,
        },
        { 
          layout: 'content', 
          content: { 
            title: 'The Problem', 
            body: 'What problem are we solving? Why is it important?' 
          },
          order: 1,
        },
        { 
          layout: 'content', 
          content: { 
            title: 'The Solution', 
            body: 'How does our product/service solve this problem?' 
          },
          order: 2,
        },
        { 
          layout: 'bullets', 
          content: { 
            title: 'Market Opportunity', 
            bullets: [
              'Total addressable market (TAM)',
              'Market growth rate',
              'Target customer segment'
            ] 
          },
          order: 3,
        },
        { 
          layout: 'content', 
          content: { 
            title: 'Business Model', 
            body: 'How do we make money? Revenue streams and pricing strategy.' 
          },
          order: 4,
        },
        { 
          layout: 'bullets', 
          content: { 
            title: 'Traction', 
            bullets: [
              'Key milestones achieved',
              'User growth metrics',
              'Revenue (if applicable)'
            ] 
          },
          order: 5,
        },
        { 
          layout: 'bullets', 
          content: { 
            title: 'The Team', 
            bullets: [
              'CEO: Name (Background)',
              'CTO: Name (Background)',
              'Other key team members'
            ] 
          },
          order: 6,
        },
        { 
          layout: 'content', 
          content: { 
            title: 'The Ask', 
            body: 'What are we seeking? (Funding amount, partnerships, etc.)' 
          },
          order: 7,
        },
      ],
    }),
  },
];

// ============================================================================
// DocumentTemplates Class
// ============================================================================

export class DocumentTemplates {
  /**
   * Get all templates
   */
  getAll(): DocumentTemplate[] {
    return documentTemplates;
  }

  /**
   * Get templates by category
   */
  getByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
    return documentTemplates.filter(t => t.category === category);
  }

  /**
   * Get templates by type
   */
  getByType(type: DocumentTemplate['type']): DocumentTemplate[] {
    return documentTemplates.filter(t => t.type === type);
  }

  /**
   * Get template by ID
   */
  getById(id: string): DocumentTemplate | undefined {
    return documentTemplates.find(t => t.id === id);
  }

  /**
   * Search templates
   */
  search(query: string): DocumentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return documentTemplates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get template categories
   */
  getCategories(): Array<{ value: DocumentTemplate['category']; label: string; icon: string }> {
    return [
      { value: 'work', label: 'Work', icon: '💼' },
      { value: 'personal', label: 'Personal', icon: '👤' },
      { value: 'education', label: 'Education', icon: '🎓' },
      { value: 'other', label: 'Other', icon: '📁' },
    ];
  }

  /**
   * Get template types
   */
  getTypes(): Array<{ value: DocumentTemplate['type']; label: string; icon: string }> {
    return [
      { value: 'markdown', label: 'Document', icon: '📝' },
      { value: 'mindmap', label: 'Mindmap', icon: '🧠' },
      { value: 'presentation', label: 'Presentation', icon: '🎤' },
    ];
  }
}

// Export singleton instance
export const documentTemplates_service = new DocumentTemplates();


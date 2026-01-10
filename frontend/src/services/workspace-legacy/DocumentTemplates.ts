/**
 * DocumentTemplates - Premium Template Library for MDReader
 * 
 * Enhanced template system with:
 * - 50+ professionally designed templates
 * - Rich previews and metadata
 * - Template collections and recommendations
 * - Usage tracking support
 * 
 * Template Types:
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
  content: string;
  tags: string[];
  
  // Enhanced fields for premium experience
  thumbnail?: string;  // URL to preview image
  previewSnippet?: string;  // Text snippet (300 chars)
  collection?: string;  // Collection ID
  featured?: boolean;  // Featured template flag
  variant?: string;  // Template variant ID
}

// Template Collection interface
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateIds: string[];
  featured?: boolean;
}

// ============================================================================
// Template Collections
// ============================================================================

export const templateCollections: TemplateCollection[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Essential templates for new users',
    icon: '🚀',
    templateIds: ['meeting-notes', 'quick-notes', 'project-brief', 'daily-journal'],
    featured: true,
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Boost your work efficiency',
    icon: '⚡',
    templateIds: ['meeting-notes', 'weekly-report', 'project-brief', 'prd', 'standup-notes', 'sprint-planning'],
    featured: true,
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Templates for writers and creators',
    icon: '✨',
    templateIds: ['blog-post', 'story-outline', 'book-notes', 'content-calendar'],
    featured: false,
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Study and research templates',
    icon: '🎓',
    templateIds: ['lecture-notes', 'research-paper', 'study-guide', 'essay-outline'],
    featured: false,
  },
  {
    id: 'personal',
    name: 'Personal Growth',
    description: 'Life organization and journaling',
    icon: '🌱',
    templateIds: ['daily-journal', 'goal-setting', 'habit-tracker', 'gratitude-journal', 'weekly-review'],
    featured: false,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional business templates',
    icon: '💼',
    templateIds: ['pitch-deck', 'business-plan', 'okr-template', 'swot-analysis', 'competitive-analysis'],
    featured: true,
  },
];

// ============================================================================
// Template Definitions - 50+ Premium Templates
// ============================================================================

export const documentTemplates: DocumentTemplate[] = [
  // ==========================================================================
  // WORK TEMPLATES - Meetings & Communication
  // ==========================================================================
  
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured template for meeting notes with agenda, discussion points, and action items',
    type: 'markdown',
    icon: '📝',
    category: 'work',
    tags: ['meeting', 'notes', 'work', 'agenda'],
    collection: 'productivity',
    featured: true,
    previewSnippet: 'Professional meeting notes with agenda, discussion tracking, decisions, and action items.',
    content: `# Meeting Notes

**Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Time**: 2:00 PM - 3:00 PM
**Attendees**: @Team Lead, @Designer, @Developer
**Location/Link**: Conference Room A / Zoom

---

## 📋 Agenda

1. Review last week's progress
2. Discuss blockers and challenges
3. Plan upcoming sprint priorities

## 💬 Discussion

### Topic 1: Progress Review

**Key Points:**
- Completed feature X ahead of schedule
- User feedback has been positive
- Minor bugs identified and fixed

**Notes:**


### Topic 2: Blockers & Challenges

**Key Points:**
- API rate limiting causing delays
- Need design assets for new feature

**Notes:**


### Topic 3: Sprint Planning

**Key Points:**
- Prioritize mobile responsiveness
- Focus on performance optimization

**Notes:**


## ✅ Decisions Made

- ✅ Proceed with Phase 2 development
- ✅ Schedule design review for Friday
- ✅ Allocate budget for cloud infrastructure

## 📌 Action Items

| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
| Complete API integration | @Developer | Jan 20 | 🟡 In Progress |
| Finalize UI mockups | @Designer | Jan 18 | ⬜ Not Started |
| Review security audit | @Team Lead | Jan 22 | ⬜ Not Started |

## 🔜 Next Steps

1. Schedule follow-up meeting for next week
2. Share meeting notes with stakeholders
3. Update project timeline in Jira

## 📝 Additional Notes

- Team morale is high
- Consider celebrating recent wins
- Need to update documentation

---
*Next meeting scheduled for: Next Monday, 2:00 PM*
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
    collection: 'business',
    featured: true,
  },

  // ==========================================================================
  // NEW WORK TEMPLATES
  // ==========================================================================

  {
    id: 'standup-notes',
    name: 'Daily Standup',
    description: 'Quick daily standup meeting template for agile teams',
    type: 'markdown',
    icon: '🌅',
    category: 'work',
    tags: ['standup', 'agile', 'daily', 'scrum'],
    collection: 'productivity',
    featured: false,
    content: `# Daily Standup

**Date**: ${new Date().toLocaleDateString()}
**Team**: 

---

## 👤 Team Updates

### @Team Member 1

**Yesterday:**
- Completed task X
- Fixed bug in feature Y

**Today:**
- Working on task Z
- Code review for PR #123

**Blockers:**
- None

---

### @Team Member 2

**Yesterday:**
- 

**Today:**
- 

**Blockers:**
- 

---

## 🚨 Team Blockers

| Issue | Owner | Priority | Status |
|-------|-------|----------|--------|
| | | | |

## 📝 Notes

- 

---
*Duration: 15 minutes*
`,
  },

  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Plan your sprint with goals, stories, and capacity',
    type: 'markdown',
    icon: '🏃',
    category: 'work',
    tags: ['sprint', 'agile', 'planning', 'scrum'],
    collection: 'productivity',
    content: `# Sprint Planning

**Sprint**: Sprint #X
**Duration**: ${new Date().toLocaleDateString()} - 
**Team Capacity**: X story points

---

## 🎯 Sprint Goal

*What is the main objective for this sprint?*


## 📊 Sprint Backlog

### High Priority (P0)

| Story | Points | Owner | Acceptance Criteria |
|-------|--------|-------|---------------------|
| | | | |

### Medium Priority (P1)

| Story | Points | Owner | Acceptance Criteria |
|-------|--------|-------|---------------------|
| | | | |

### Nice to Have (P2)

| Story | Points | Owner | Acceptance Criteria |
|-------|--------|-------|---------------------|
| | | | |

---

## 👥 Team Capacity

| Team Member | Available Days | Capacity (pts) |
|-------------|----------------|----------------|
| | | |

**Total Capacity**: X points
**Committed**: X points
**Buffer**: X%

## ⚠️ Risks & Dependencies

- 

## 📝 Notes

- 
`,
  },

  {
    id: 'retrospective',
    name: 'Sprint Retrospective',
    description: 'Reflect on what went well and what to improve',
    type: 'markdown',
    icon: '🔄',
    category: 'work',
    tags: ['retro', 'agile', 'improvement', 'team'],
    content: `# Sprint Retrospective

**Sprint**: Sprint #X
**Date**: ${new Date().toLocaleDateString()}
**Facilitator**: 

---

## 🌟 What Went Well

- 
- 
- 

## 🔧 What Could Be Improved

- 
- 
- 

## 💡 Ideas & Suggestions

- 
- 
- 

## 🎯 Action Items

| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| | | | |

---

## 📊 Sprint Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Velocity | X pts | Y pts | 🟢/🟡/🔴 |
| Completion Rate | 100% | X% | 🟢/🟡/🔴 |
| Bug Count | 0 | X | 🟢/🟡/🔴 |

## 🏆 Shoutouts

- 

---
*Next retrospective: End of Sprint #X+1*
`,
  },

  {
    id: 'one-on-one',
    name: '1:1 Meeting',
    description: 'One-on-one meeting template for managers and direct reports',
    type: 'markdown',
    icon: '👥',
    category: 'work',
    tags: ['1on1', 'meeting', 'management', 'feedback'],
    content: `# 1:1 Meeting

**Date**: ${new Date().toLocaleDateString()}
**Manager**: 
**Direct Report**: 

---

## ✅ Check-in

**How are you feeling this week?** (1-10)

**Energy level**: 
**Workload**: 
**Job satisfaction**: 

---

## 📋 Agenda

### Topics to Discuss

1. 
2. 
3. 

### Carried Over from Last Time

- 

---

## 💬 Discussion Notes

### Progress & Wins

- 

### Challenges & Blockers

- 

### Career Development

- 

### Feedback (Both Ways)

**For Manager:**
- 

**For Direct Report:**
- 

---

## 🎯 Action Items

| Action | Owner | Due Date |
|--------|-------|----------|
| | | |

## 📅 Next Meeting

**Date**: 
**Focus**: 
`,
  },

  {
    id: 'okr-template',
    name: 'OKR Template',
    description: 'Objectives and Key Results planning template',
    type: 'markdown',
    icon: '🎯',
    category: 'work',
    tags: ['okr', 'goals', 'objectives', 'planning'],
    collection: 'business',
    featured: true,
    content: `# OKRs - Q1 2024

**Team/Individual**: 
**Period**: Q1 2024 (Jan - Mar)

---

## 🎯 Objective 1: [Title]

*Why this matters:*

### Key Results

| # | Key Result | Target | Current | Progress |
|---|-----------|--------|---------|----------|
| 1 | | | | 0% |
| 2 | | | | 0% |
| 3 | | | | 0% |

**Status**: 🟢 On Track / 🟡 At Risk / 🔴 Behind

---

## 🎯 Objective 2: [Title]

*Why this matters:*

### Key Results

| # | Key Result | Target | Current | Progress |
|---|-----------|--------|---------|----------|
| 1 | | | | 0% |
| 2 | | | | 0% |
| 3 | | | | 0% |

**Status**: 🟢 On Track / 🟡 At Risk / 🔴 Behind

---

## 🎯 Objective 3: [Title]

*Why this matters:*

### Key Results

| # | Key Result | Target | Current | Progress |
|---|-----------|--------|---------|----------|
| 1 | | | | 0% |
| 2 | | | | 0% |
| 3 | | | | 0% |

**Status**: 🟢 On Track / 🟡 At Risk / 🔴 Behind

---

## 📊 Overall Progress

**Average Completion**: X%
**Last Updated**: ${new Date().toLocaleDateString()}
`,
  },

  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    description: 'Strategic planning with Strengths, Weaknesses, Opportunities, Threats',
    type: 'markdown',
    icon: '📊',
    category: 'work',
    tags: ['swot', 'strategy', 'analysis', 'planning'],
    collection: 'business',
    content: `# SWOT Analysis

**Subject**: 
**Date**: ${new Date().toLocaleDateString()}
**Author**: 

---

## 💪 Strengths (Internal - Positive)

*What do we do well? What unique resources do we have?*

- 
- 
- 

---

## 🔧 Weaknesses (Internal - Negative)

*What could we improve? Where do we lack resources?*

- 
- 
- 

---

## 🌟 Opportunities (External - Positive)

*What trends could we take advantage of? What opportunities are open to us?*

- 
- 
- 

---

## ⚠️ Threats (External - Negative)

*What threats could harm us? What is the competition doing?*

- 
- 
- 

---

## 🎯 Strategic Actions

### Leverage Strengths + Opportunities

- 

### Address Weaknesses to Capture Opportunities

- 

### Use Strengths to Mitigate Threats

- 

### Minimize Weaknesses and Avoid Threats

- 

---

## 📝 Conclusions

*Key insights and recommended next steps:*


`,
  },

  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    description: 'Compare your product/company against competitors',
    type: 'markdown',
    icon: '🏆',
    category: 'work',
    tags: ['competitive', 'analysis', 'market', 'strategy'],
    collection: 'business',
    content: `# Competitive Analysis

**Product/Company**: 
**Date**: ${new Date().toLocaleDateString()}
**Author**: 

---

## 🎯 Overview

| Company | Founded | Size | Funding | Market Share |
|---------|---------|------|---------|--------------|
| **Our Company** | | | | |
| Competitor A | | | | |
| Competitor B | | | | |
| Competitor C | | | | |

---

## 📊 Feature Comparison

| Feature | Ours | Comp A | Comp B | Comp C |
|---------|------|--------|--------|--------|
| Feature 1 | ✅ | ❌ | ✅ | ✅ |
| Feature 2 | ✅ | ✅ | ❌ | ✅ |
| Feature 3 | ❌ | ✅ | ✅ | ❌ |

---

## 💰 Pricing Comparison

| Tier | Ours | Comp A | Comp B | Comp C |
|------|------|--------|--------|--------|
| Free | | | | |
| Basic | | | | |
| Pro | | | | |
| Enterprise | | | | |

---

## 💪 Competitive Advantages

### Our Strengths vs Competition

- 

### Areas Where We're Behind

- 

---

## 🎯 Strategic Recommendations

1. 
2. 
3. 

`,
  },

  {
    id: 'user-interview',
    name: 'User Interview',
    description: 'Template for conducting user research interviews',
    type: 'markdown',
    icon: '🎤',
    category: 'work',
    tags: ['ux', 'research', 'interview', 'user'],
    content: `# User Interview Notes

**Date**: ${new Date().toLocaleDateString()}
**Interviewer**: 
**Participant**: 
**Duration**: 45 minutes

---

## 👤 Participant Profile

**Role**: 
**Company/Industry**: 
**Experience Level**: 

---

## 📋 Interview Guide

### Warm-up Questions

1. Tell me about yourself and your role.
2. Walk me through a typical day.

### Topic 1: [Current Workflow]

**Question**: 
**Response**: 

**Follow-up**: 
**Response**: 

### Topic 2: [Pain Points]

**Question**: 
**Response**: 

### Topic 3: [Ideal Solution]

**Question**: 
**Response**: 

---

## 💡 Key Insights

1. 
2. 
3. 

## 📝 Notable Quotes

> 

> 

---

## ✅ Next Steps

- 
`,
  },

  // ==========================================================================
  // PERSONAL TEMPLATES
  // ==========================================================================

  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Reflect on your day with prompts for gratitude and growth',
    type: 'markdown',
    icon: '📔',
    category: 'personal',
    tags: ['journal', 'daily', 'reflection', 'mindfulness'],
    collection: 'personal',
    featured: true,
    content: `# Daily Journal

**Date**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Mood**: 😊 / 😐 / 😔

---

## 🌅 Morning Intentions

**How do I want to feel today?**


**Top 3 priorities for today:**
1. 
2. 
3. 

**One thing I'm looking forward to:**


---

## 🙏 Gratitude

I'm grateful for:
1. 
2. 
3. 

---

## 📝 Today's Reflections

**What went well today?**


**What could have been better?**


**What did I learn?**


---

## 🌙 Evening Wind-Down

**Rate your day** (1-10): 

**One win from today:**


**Tomorrow I will:**


---

*"The only person you should try to be better than is the person you were yesterday."*
`,
  },

  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'Practice daily gratitude with guided prompts',
    type: 'markdown',
    icon: '🙏',
    category: 'personal',
    tags: ['gratitude', 'journal', 'mindfulness', 'wellbeing'],
    collection: 'personal',
    content: `# Gratitude Journal

**Week of**: ${new Date().toLocaleDateString()}

---

## Monday

### Three things I'm grateful for:
1. 
2. 
3. 

### Someone who made my day better:


---

## Tuesday

### Three things I'm grateful for:
1. 
2. 
3. 

### A small moment that brought me joy:


---

## Wednesday

### Three things I'm grateful for:
1. 
2. 
3. 

### Something about myself I appreciate:


---

## Thursday

### Three things I'm grateful for:
1. 
2. 
3. 

### A challenge that made me stronger:


---

## Friday

### Three things I'm grateful for:
1. 
2. 
3. 

### Something I'm looking forward to:


---

## Weekend Reflection

### Best moment of the week:


### What I want to bring into next week:


---

*"Gratitude turns what we have into enough."*
`,
  },

  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on your week and plan for the next',
    type: 'markdown',
    icon: '📅',
    category: 'personal',
    tags: ['weekly', 'review', 'planning', 'reflection'],
    collection: 'personal',
    content: `# Weekly Review

**Week of**: ${new Date().toLocaleDateString()}

---

## 📊 Week at a Glance

**Energy Level**: ⬜⬜⬜⬜⬜ (1-5)
**Productivity**: ⬜⬜⬜⬜⬜ (1-5)
**Satisfaction**: ⬜⬜⬜⬜⬜ (1-5)

---

## ✅ Accomplishments

What did I complete this week?

- 
- 
- 

## 🎯 Goal Progress

| Goal | Progress | Notes |
|------|----------|-------|
| | % | |

---

## 💡 Lessons Learned

What insights did I gain?

1. 
2. 
3. 

## 🚧 Challenges

What obstacles did I face?

- 

How can I address them?

- 

---

## 📋 Next Week's Focus

### Top 3 Priorities

1. 
2. 
3. 

### Habits to Maintain

- 

### One Thing to Improve

- 

---

## 🙏 Gratitude

Three things I'm grateful for this week:

1. 
2. 
3. 

---

*"Review your goals twice every day in order to be focused on achieving them."*
`,
  },

  {
    id: 'goal-setting',
    name: 'Goal Setting',
    description: 'Set SMART goals with action plans',
    type: 'markdown',
    icon: '🎯',
    category: 'personal',
    tags: ['goals', 'smart', 'planning', 'achievement'],
    collection: 'personal',
    featured: true,
    content: `# Goal Setting Worksheet

**Created**: ${new Date().toLocaleDateString()}
**Review Date**: 

---

## 🌟 Vision

*Where do you want to be in 1 year? 5 years?*


---

## 🎯 SMART Goals

### Goal 1: [Title]

**Specific**: What exactly do I want to achieve?


**Measurable**: How will I measure success?


**Achievable**: Is this realistic?


**Relevant**: Why does this matter?


**Time-bound**: By when?


### Action Steps

| Step | Deadline | Status |
|------|----------|--------|
| 1. | | ⬜ |
| 2. | | ⬜ |
| 3. | | ⬜ |

---

### Goal 2: [Title]

**Specific**: 
**Measurable**: 
**Achievable**: 
**Relevant**: 
**Time-bound**: 

### Action Steps

| Step | Deadline | Status |
|------|----------|--------|
| 1. | | ⬜ |
| 2. | | ⬜ |

---

## 🚧 Potential Obstacles

| Obstacle | Mitigation Strategy |
|----------|---------------------|
| | |

## 💪 Resources Needed

- 

## 📅 Check-in Schedule

- Weekly review: 
- Monthly review: 
- Quarterly review: 

---

*"A goal without a plan is just a wish."*
`,
  },

  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Track and build positive daily habits',
    type: 'markdown',
    icon: '✨',
    category: 'personal',
    tags: ['habits', 'tracker', 'daily', 'routine'],
    collection: 'personal',
    content: `# Habit Tracker

**Month**: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

---

## 📋 My Habits

| Habit | Goal | Why It Matters |
|-------|------|----------------|
| 🏃 Exercise | 30 min/day | Health & energy |
| 📚 Reading | 20 pages/day | Learning & growth |
| 🧘 Meditation | 10 min/day | Mental clarity |
| 💧 Water | 8 glasses/day | Hydration |
| 😴 Sleep | 7+ hours | Rest & recovery |

---

## 📊 Weekly Tracking

### Week 1

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Score |
|-------|-----|-----|-----|-----|-----|-----|-----|-------|
| 🏃 Exercise | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | /7 |
| 📚 Reading | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | /7 |
| 🧘 Meditation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | /7 |
| 💧 Water | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | /7 |
| 😴 Sleep | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | /7 |

✅ = Completed | ⬜ = Not done

---

## 📈 Monthly Summary

**Completion Rate**: %
**Best Streak**: days
**Most Consistent Habit**: 
**Needs Improvement**: 

---

## 💡 Reflections

**What's working?**


**What needs adjustment?**


**Next month's focus:**

`,
  },

  {
    id: 'book-notes',
    name: 'Book Notes',
    description: 'Capture key insights from books you read',
    type: 'markdown',
    icon: '📚',
    category: 'personal',
    tags: ['books', 'reading', 'notes', 'learning'],
    content: `# Book Notes

## 📖 Book Information

**Title**: 
**Author**: 
**Genre**: 
**Date Read**: ${new Date().toLocaleDateString()}
**Rating**: ⭐⭐⭐⭐⭐

---

## 📝 Summary

*In 3-5 sentences, what is this book about?*


---

## 💡 Key Takeaways

### Main Ideas

1. 
2. 
3. 

### Memorable Quotes

> 

> 

---

## 📋 Chapter Notes

### Chapter 1: [Title]

- 

### Chapter 2: [Title]

- 

---

## 🎯 Action Items

*How will I apply what I learned?*

- [ ] 
- [ ] 
- [ ] 

---

## 💭 My Thoughts

*What did I agree/disagree with? How did this change my thinking?*


---

## 🔗 Related Reading

- 
- 

---

**Would I recommend this book?** Yes / No

**Who should read this?**

`,
  },

  {
    id: 'trip-planner',
    name: 'Trip Planner',
    description: 'Plan your travel adventures in detail',
    type: 'markdown',
    icon: '✈️',
    category: 'personal',
    tags: ['travel', 'planning', 'vacation', 'trip'],
    content: `# Trip Planner

## ✈️ Trip Overview

**Destination**: 
**Dates**: 
**Duration**: days
**Travel Companions**: 
**Budget**: $

---

## 📋 Pre-Trip Checklist

### Documents

- [ ] Passport (valid 6+ months)
- [ ] Visa (if required)
- [ ] Travel insurance
- [ ] Flight tickets
- [ ] Hotel confirmations
- [ ] Driver's license

### Packing

- [ ] Clothes
- [ ] Toiletries
- [ ] Electronics & chargers
- [ ] Medications
- [ ] Travel adapters
- [ ] Camera

---

## 🏨 Accommodations

| Night | Hotel/Airbnb | Address | Confirmation # | Cost |
|-------|--------------|---------|----------------|------|
| 1 | | | | |
| 2 | | | | |

---

## 📅 Itinerary

### Day 1 - [Date]

**Theme**: Arrival & Exploration

| Time | Activity | Location | Notes |
|------|----------|----------|-------|
| 09:00 | | | |
| 12:00 | Lunch | | |
| 15:00 | | | |
| 19:00 | Dinner | | |

### Day 2 - [Date]

| Time | Activity | Location | Notes |
|------|----------|----------|-------|
| | | | |

---

## 💰 Budget Tracker

| Category | Budgeted | Actual |
|----------|----------|--------|
| Flights | $ | $ |
| Hotels | $ | $ |
| Food | $ | $ |
| Activities | $ | $ |
| Transport | $ | $ |
| Shopping | $ | $ |
| **Total** | $ | $ |

---

## 📝 Notes & Tips

- 

`,
  },

  // ==========================================================================
  // EDUCATION TEMPLATES
  // ==========================================================================

  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    description: 'Structured template for capturing lecture content',
    type: 'markdown',
    icon: '🎓',
    category: 'education',
    tags: ['lecture', 'notes', 'class', 'study'],
    collection: 'academic',
    featured: true,
    content: `# Lecture Notes

**Course**: 
**Lecture**: #
**Topic**: 
**Date**: ${new Date().toLocaleDateString()}
**Professor**: 

---

## 📋 Today's Topics

1. 
2. 
3. 

---

## 📝 Notes

### Main Concept 1: [Title]

**Definition:**


**Key Points:**
- 
- 
- 

**Examples:**


### Main Concept 2: [Title]

**Definition:**


**Key Points:**
- 
- 

---

## 💡 Important Terms

| Term | Definition |
|------|------------|
| | |

---

## ❓ Questions to Ask

- 
- 

## 📚 Homework/Assignments

- [ ] 
- [ ] 

## 🔗 Related Topics

- Previous lecture: 
- Reading: Chapter 
- Next lecture preview: 

---

## 📊 Summary

*In 2-3 sentences, summarize the main points:*


`,
  },

  {
    id: 'study-guide',
    name: 'Study Guide',
    description: 'Prepare for exams with this comprehensive study template',
    type: 'markdown',
    icon: '📖',
    category: 'education',
    tags: ['study', 'exam', 'review', 'preparation'],
    collection: 'academic',
    content: `# Study Guide

**Course**: 
**Exam Date**: 
**Exam Type**: Midterm / Final / Quiz

---

## 📋 Topics to Cover

### Unit 1: [Title]

**Key Concepts:**
- [ ] Concept 1
- [ ] Concept 2
- [ ] Concept 3

**Important Formulas/Definitions:**


**Practice Problems:**
1. 
2. 

---

### Unit 2: [Title]

**Key Concepts:**
- [ ] 
- [ ] 

**Important Formulas/Definitions:**


**Practice Problems:**
1. 
2. 

---

## 💡 Key Terms Flashcards

| Term | Definition | Example |
|------|------------|---------|
| | | |

---

## 📝 Practice Questions

### Short Answer

1. Q: 
   A: 

2. Q: 
   A: 

### Multiple Choice

1. Question?
   - A) 
   - B) 
   - C) ✓
   - D) 

---

## 🎯 Study Schedule

| Day | Topics | Hours | Done |
|-----|--------|-------|------|
| Day 1 | | 2h | ⬜ |
| Day 2 | | 2h | ⬜ |
| Day 3 | | 3h | ⬜ |
| Day 4 | Review all | 2h | ⬜ |

---

## ❓ Questions for Professor

- 

`,
  },

  {
    id: 'essay-outline',
    name: 'Essay Outline',
    description: 'Structure your essay with this comprehensive outline',
    type: 'markdown',
    icon: '✍️',
    category: 'education',
    tags: ['essay', 'writing', 'outline', 'academic'],
    collection: 'academic',
    content: `# Essay Outline

**Title**: 
**Course**: 
**Due Date**: 
**Word Count**: 

---

## 📋 Essay Overview

**Thesis Statement:**


**Essay Type:** Argumentative / Expository / Narrative / Descriptive

---

## 📝 Outline

### I. Introduction

**Hook:**


**Background:**


**Thesis:**


---

### II. Body Paragraph 1

**Topic Sentence:**


**Evidence/Example 1:**
- Source: 
- Quote/Data: 

**Analysis:**


**Transition:**


---

### III. Body Paragraph 2

**Topic Sentence:**


**Evidence/Example:**
- Source: 
- Quote/Data: 

**Analysis:**


**Transition:**


---

### IV. Body Paragraph 3

**Topic Sentence:**


**Evidence/Example:**
- Source: 

**Analysis:**


---

### V. Conclusion

**Restate Thesis:**


**Summary of Main Points:**


**Final Thought/Call to Action:**


---

## 📚 Sources

1. 
2. 
3. 

---

## ✅ Checklist

- [ ] Draft completed
- [ ] Citations formatted (MLA/APA/Chicago)
- [ ] Proofread
- [ ] Peer reviewed
- [ ] Final revision
`,
  },

  {
    id: 'research-paper',
    name: 'Research Paper',
    description: 'Template for academic research papers',
    type: 'markdown',
    icon: '🔬',
    category: 'education',
    tags: ['research', 'paper', 'academic', 'thesis'],
    collection: 'academic',
    content: `# Research Paper

**Title**: 
**Author**: 
**Institution**: 
**Date**: ${new Date().toLocaleDateString()}

---

## Abstract

*Summarize your research in 150-300 words*


**Keywords**: keyword1, keyword2, keyword3

---

## 1. Introduction

### 1.1 Background


### 1.2 Research Question


### 1.3 Hypothesis


### 1.4 Significance


---

## 2. Literature Review

### 2.1 Overview of Existing Research


### 2.2 Gaps in Current Knowledge


### 2.3 Theoretical Framework


---

## 3. Methodology

### 3.1 Research Design


### 3.2 Data Collection


### 3.3 Analysis Methods


### 3.4 Limitations


---

## 4. Results

### 4.1 Key Findings


### 4.2 Data Analysis


---

## 5. Discussion

### 5.1 Interpretation of Results


### 5.2 Implications


### 5.3 Recommendations


---

## 6. Conclusion


---

## References

1. 
2. 
3. 

---

## Appendices

### Appendix A: [Title]

`,
  },

  // ==========================================================================
  // OTHER TEMPLATES
  // ==========================================================================

  {
    id: 'quick-notes',
    name: 'Quick Notes',
    description: 'Simple template for quick note-taking',
    type: 'markdown',
    icon: '📌',
    category: 'other',
    tags: ['quick', 'notes', 'simple', 'capture'],
    collection: 'getting-started',
    featured: true,
    content: `# Quick Notes

**Date**: ${new Date().toLocaleDateString()}

---

## 📝 Notes

- 
- 
- 

---

## 💡 Ideas

- 

---

## ✅ To-Do

- [ ] 
- [ ] 
- [ ] 

---

## 🔗 Links

- 
`,
  },

  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Plan and organize your content creation',
    type: 'markdown',
    icon: '📅',
    category: 'work',
    tags: ['content', 'calendar', 'social', 'marketing'],
    collection: 'creative',
    content: `# Content Calendar

**Month**: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

---

## 📊 Content Overview

| Platform | Posts/Week | Focus |
|----------|------------|-------|
| Blog | 2 | SEO content |
| Twitter | 7 | Engagement |
| LinkedIn | 3 | Thought leadership |
| Instagram | 5 | Visual content |

---

## 📅 Weekly Schedule

### Week 1

| Day | Platform | Content Type | Topic | Status |
|-----|----------|--------------|-------|--------|
| Mon | Blog | Article | | ⬜ Draft |
| Tue | Twitter | Thread | | ⬜ Scheduled |
| Wed | LinkedIn | Post | | ⬜ Idea |
| Thu | Instagram | Carousel | | ⬜ Design |
| Fri | Blog | Article | | ⬜ Draft |

---

## 💡 Content Ideas

### Blog Posts
- 
- 

### Social Media
- 
- 

---

## 📈 Monthly Goals

- [ ] Publish X blog posts
- [ ] Reach X followers
- [ ] Generate X leads

`,
  },

  {
    id: 'recipe-template',
    name: 'Recipe',
    description: 'Document your favorite recipes',
    type: 'markdown',
    icon: '🍳',
    category: 'other',
    tags: ['recipe', 'cooking', 'food', 'kitchen'],
    content: `# Recipe Name

**Prep Time**: 15 min
**Cook Time**: 30 min
**Servings**: 4
**Difficulty**: Easy / Medium / Hard

---

## 📝 Description

*Brief description of the dish*


---

## 🛒 Ingredients

### Main Ingredients
- 
- 
- 

### Seasonings
- 
- 

### Optional
- 

---

## 👨‍🍳 Instructions

### Preparation

1. 
2. 
3. 

### Cooking

1. 
2. 
3. 

### Finishing

1. 
2. 

---

## 💡 Tips & Variations

- 
- 

---

## 📊 Nutrition (per serving)

| Nutrient | Amount |
|----------|--------|
| Calories | |
| Protein | g |
| Carbs | g |
| Fat | g |

---

**Rating**: ⭐⭐⭐⭐⭐

**Notes for next time:**

`,
  },

  {
    id: 'story-outline',
    name: 'Story Outline',
    description: 'Plan your creative writing with this story structure',
    type: 'markdown',
    icon: '📕',
    category: 'personal',
    tags: ['story', 'writing', 'creative', 'fiction'],
    collection: 'creative',
    content: `# Story Outline

**Title**: 
**Genre**: 
**Target Length**: 
**Author**: 

---

## 📝 Logline

*One sentence that captures the essence of your story*


---

## 👤 Characters

### Protagonist

**Name**: 
**Age**: 
**Occupation**: 
**Motivation**: 
**Flaw**: 
**Arc**: 

### Antagonist

**Name**: 
**Motivation**: 
**Connection to protagonist**: 

### Supporting Characters

1. **Name**: - Role: 
2. **Name**: - Role: 

---

## 🌍 Setting

**Time Period**: 
**Location**: 
**World Rules**: 

---

## 📖 Plot Structure

### Act 1: Setup

**Opening Hook**: 

**Inciting Incident**: 

**First Plot Point**: 

### Act 2: Confrontation

**Rising Action**: 

**Midpoint**: 

**Crisis**: 

### Act 3: Resolution

**Climax**: 

**Falling Action**: 

**Resolution**: 

---

## 🎭 Themes

- 
- 

---

## 📝 Scene List

| # | Scene | POV | Purpose | Notes |
|---|-------|-----|---------|-------|
| 1 | | | | |
| 2 | | | | |

`,
  },

  // ==========================================================================
  // ADDITIONAL MINDMAP TEMPLATES
  // ==========================================================================

  {
    id: 'decision-tree',
    name: 'Decision Tree',
    description: 'Visualize decision-making processes',
    type: 'mindmap',
    icon: '🌳',
    category: 'work',
    tags: ['decision', 'analysis', 'flowchart', 'logic'],
    content: JSON.stringify({
      nodes: [
        { id: '1', type: 'mindNode', data: { label: 'Decision Point' }, position: { x: 400, y: 100 } },
        { id: '2', type: 'mindNode', data: { label: 'Option A' }, position: { x: 200, y: 250 } },
        { id: '3', type: 'mindNode', data: { label: 'Option B' }, position: { x: 600, y: 250 } },
        { id: '4', type: 'mindNode', data: { label: 'Outcome A1' }, position: { x: 100, y: 400 } },
        { id: '5', type: 'mindNode', data: { label: 'Outcome A2' }, position: { x: 300, y: 400 } },
        { id: '6', type: 'mindNode', data: { label: 'Outcome B1' }, position: { x: 500, y: 400 } },
        { id: '7', type: 'mindNode', data: { label: 'Outcome B2' }, position: { x: 700, y: 400 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'default' },
        { id: 'e1-3', source: '1', target: '3', type: 'default' },
        { id: 'e2-4', source: '2', target: '4', type: 'default' },
        { id: 'e2-5', source: '2', target: '5', type: 'default' },
        { id: 'e3-6', source: '3', target: '6', type: 'default' },
        { id: 'e3-7', source: '3', target: '7', type: 'default' },
      ],
    }),
  },

  {
    id: 'learning-map',
    name: 'Learning Map',
    description: 'Organize topics and concepts for learning',
    type: 'mindmap',
    icon: '🧠',
    category: 'education',
    tags: ['learning', 'study', 'concepts', 'knowledge'],
    collection: 'academic',
    content: JSON.stringify({
      nodes: [
        { id: '1', type: 'mindNode', data: { label: 'Subject' }, position: { x: 400, y: 200 } },
        { id: '2', type: 'mindNode', data: { label: 'Topic 1' }, position: { x: 150, y: 350 } },
        { id: '3', type: 'mindNode', data: { label: 'Topic 2' }, position: { x: 400, y: 350 } },
        { id: '4', type: 'mindNode', data: { label: 'Topic 3' }, position: { x: 650, y: 350 } },
        { id: '5', type: 'mindNode', data: { label: 'Subtopic 1.1' }, position: { x: 50, y: 500 } },
        { id: '6', type: 'mindNode', data: { label: 'Subtopic 1.2' }, position: { x: 250, y: 500 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'default' },
        { id: 'e1-3', source: '1', target: '3', type: 'default' },
        { id: 'e1-4', source: '1', target: '4', type: 'default' },
        { id: 'e2-5', source: '2', target: '5', type: 'default' },
        { id: 'e2-6', source: '2', target: '6', type: 'default' },
      ],
    }),
  },

  // ==========================================================================
  // ADDITIONAL PRESENTATION TEMPLATES
  // ==========================================================================

  {
    id: 'team-intro',
    name: 'Team Introduction',
    description: 'Introduce your team in style',
    type: 'presentation',
    icon: '👥',
    category: 'work',
    tags: ['team', 'introduction', 'presentation', 'onboarding'],
    content: JSON.stringify({
      title: 'Meet Our Team',
      theme: {
        name: 'Professional',
        colors: { primary: '#3b82f6', secondary: '#8b5cf6', background: '#ffffff', text: '#1f2937', accent: '#10b981' },
        fonts: { heading: 'Inter', body: 'Inter' },
        spacing: 'normal',
      },
      slides: [
        { layout: 'title', content: { title: 'Meet Our Team', subtitle: 'The people behind the magic' }, order: 0 },
        { layout: 'content', content: { title: 'Our Mission', body: 'We are dedicated to delivering exceptional results through collaboration and innovation.' }, order: 1 },
        { layout: 'bullets', content: { title: 'Leadership Team', bullets: ['CEO - Vision & Strategy', 'CTO - Technology & Innovation', 'COO - Operations & Growth'] }, order: 2 },
        { layout: 'bullets', content: { title: 'Our Values', bullets: ['🎯 Excellence', '🤝 Collaboration', '💡 Innovation', '❤️ Integrity'] }, order: 3 },
        { layout: 'content', content: { title: 'Join Our Team', body: 'We are always looking for talented individuals. Check out our careers page!' }, order: 4 },
      ],
    }),
  },

  {
    id: 'project-kickoff',
    name: 'Project Kickoff',
    description: 'Start your project with a professional kickoff presentation',
    type: 'presentation',
    icon: '🚀',
    category: 'work',
    tags: ['project', 'kickoff', 'presentation', 'planning'],
    content: JSON.stringify({
      title: 'Project Kickoff',
      theme: {
        name: 'Modern',
        colors: { primary: '#6366f1', secondary: '#8b5cf6', background: '#ffffff', text: '#1f2937', accent: '#f59e0b' },
        fonts: { heading: 'Inter', body: 'Inter' },
        spacing: 'normal',
      },
      slides: [
        { layout: 'title', content: { title: 'Project Kickoff', subtitle: '[Project Name]' }, order: 0 },
        { layout: 'content', content: { title: 'Project Overview', body: 'Brief description of what we are building and why it matters.' }, order: 1 },
        { layout: 'bullets', content: { title: 'Goals & Objectives', bullets: ['Goal 1: ...', 'Goal 2: ...', 'Goal 3: ...'] }, order: 2 },
        { layout: 'bullets', content: { title: 'Team & Roles', bullets: ['Project Manager: Name', 'Tech Lead: Name', 'Designer: Name', 'Developers: Names'] }, order: 3 },
        { layout: 'bullets', content: { title: 'Timeline', bullets: ['Phase 1: Discovery (Week 1-2)', 'Phase 2: Design (Week 3-4)', 'Phase 3: Development (Week 5-10)', 'Phase 4: Launch (Week 11-12)'] }, order: 4 },
        { layout: 'content', content: { title: 'Next Steps', body: 'What we need from everyone to make this project a success.' }, order: 5 },
      ],
    }),
  },
];

// ============================================================================
// DocumentTemplates Class - Enhanced with Collections & Recommendations
// ============================================================================

export class DocumentTemplates {
  private recentlyUsedIds: string[] = [];
  
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
   * Search templates with fuzzy matching
   */
  search(query: string): DocumentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return documentTemplates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      t.collection?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get featured templates
   */
  getFeatured(): DocumentTemplate[] {
    return documentTemplates.filter(t => t.featured === true);
  }

  /**
   * Get popular templates (sorted by featured status and category coverage)
   */
  getPopular(limit: number = 10): DocumentTemplate[] {
    const featured = this.getFeatured();
    const others = documentTemplates.filter(t => !t.featured);
    return [...featured, ...others].slice(0, limit);
  }

  /**
   * Get templates by collection
   */
  getByCollection(collectionId: string): DocumentTemplate[] {
    const collection = templateCollections.find(c => c.id === collectionId);
    if (!collection) return [];
    return collection.templateIds
      .map(id => this.getById(id))
      .filter((t): t is DocumentTemplate => t !== undefined);
  }

  /**
   * Get all collections
   */
  getCollections(): TemplateCollection[] {
    return templateCollections;
  }

  /**
   * Get featured collections
   */
  getFeaturedCollections(): TemplateCollection[] {
    return templateCollections.filter(c => c.featured === true);
  }

  /**
   * Get recently used templates
   */
  getRecentlyUsed(limit: number = 5): DocumentTemplate[] {
    return this.recentlyUsedIds
      .slice(0, limit)
      .map(id => this.getById(id))
      .filter((t): t is DocumentTemplate => t !== undefined);
  }

  /**
   * Track template usage
   */
  trackUsage(templateId: string): void {
    // Remove if already in list
    this.recentlyUsedIds = this.recentlyUsedIds.filter(id => id !== templateId);
    // Add to front
    this.recentlyUsedIds.unshift(templateId);
    // Keep only last 10
    if (this.recentlyUsedIds.length > 10) {
      this.recentlyUsedIds = this.recentlyUsedIds.slice(0, 10);
    }
    // Persist to localStorage
    try {
      localStorage.setItem('mdreader_recent_templates', JSON.stringify(this.recentlyUsedIds));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Load recently used from localStorage
   */
  loadRecentlyUsed(): void {
    try {
      const stored = localStorage.getItem('mdreader_recent_templates');
      if (stored) {
        this.recentlyUsedIds = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Get recommended templates based on usage patterns
   */
  getRecommended(limit: number = 6): DocumentTemplate[] {
    // Start with featured templates the user hasn't used
    const recent = new Set(this.recentlyUsedIds);
    const featured = this.getFeatured().filter(t => !recent.has(t.id));
    
    // If not enough featured, add from other categories
    if (featured.length >= limit) return featured.slice(0, limit);
    
    const others = documentTemplates
      .filter(t => !recent.has(t.id) && !t.featured)
      .slice(0, limit - featured.length);
    
    return [...featured, ...others];
  }

  /**
   * Advanced search with filters
   */
  searchAdvanced(
    query: string,
    filters?: {
      type?: DocumentTemplate['type'];
      category?: DocumentTemplate['category'];
      collection?: string;
    }
  ): DocumentTemplate[] {
    let results = query ? this.search(query) : [...documentTemplates];
    
    if (filters?.type) {
      results = results.filter(t => t.type === filters.type);
    }
    if (filters?.category) {
      results = results.filter(t => t.category === filters.category);
    }
    if (filters?.collection) {
      const collectionTemplateIds = templateCollections
        .find(c => c.id === filters.collection)?.templateIds || [];
      results = results.filter(t => collectionTemplateIds.includes(t.id));
    }
    
    return results;
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

  /**
   * Get template count by category
   */
  getCountByCategory(): Record<DocumentTemplate['category'], number> {
    return {
      work: this.getByCategory('work').length,
      personal: this.getByCategory('personal').length,
      education: this.getByCategory('education').length,
      other: this.getByCategory('other').length,
    };
  }

  /**
   * Get template count by type
   */
  getCountByType(): Record<DocumentTemplate['type'], number> {
    return {
      markdown: this.getByType('markdown').length,
      mindmap: this.getByType('mindmap').length,
      presentation: this.getByType('presentation').length,
    };
  }

  /**
   * Get total template count
   */
  getCount(): number {
    return documentTemplates.length;
  }
}

// Export singleton instance
export const documentTemplates_service = new DocumentTemplates();

// Load recently used on module load
if (typeof window !== 'undefined') {
  documentTemplates_service.loadRecentlyUsed();
}


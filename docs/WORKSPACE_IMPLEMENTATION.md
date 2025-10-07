# 🗂️ Multi-Document Workspace - Implementation Plan

> **Goal**: Build a workspace system to manage multiple documents, mindmaps, and presentations in an organized folder structure.

---

## 📋 Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Data Models](#data-models)
3. [Implementation Tasks](#implementation-tasks)
4. [User Flows](#user-flows)
5. [Technical Architecture](#technical-architecture)

---

## 🎯 Vision & Goals

### **What We're Building**

A **Notion-like workspace** where users can:
- Create folders and subfolders
- Organize documents, mindmaps, and presentations
- Quick-switch between documents (Cmd+K)
- Use templates for common document types
- Search across all content
- Star/favorite important items

### **Success Criteria**

✅ User can manage 50+ documents without chaos
✅ Finding a document takes <5 seconds
✅ Creating new docs from templates is instant
✅ Workspace persists across sessions (localStorage)

---

## 📊 Data Models

### **Workspace Structure**

```typescript
interface Workspace {
  id: string;
  name: string;
  icon: string; // Emoji
  folders: Folder[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  id: string;
  name: string;
  icon: string;
  parentId: string | null; // null = root folder
  workspaceId: string;
  order: number; // For custom ordering
  createdAt: Date;
}

interface Document {
  id: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  title: string;
  content: string; // Markdown or JSON
  folderId: string | null; // null = root level
  workspaceId: string;
  starred: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    wordCount?: number;
    slideCount?: number;
    nodeCount?: number;
    lastEditedBy?: string;
  };
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  icon: string;
  content: string; // Template content
  category: 'work' | 'personal' | 'education' | 'other';
}
```

---

## ✅ Implementation Tasks

### **Phase 1: Core Data Layer** (Week 1)

#### Task 1.1: Workspace Service
**File**: `src/services/workspace/WorkspaceService.ts`

```typescript
export class WorkspaceService {
  private storageKey = 'md-workspace';
  
  // Create default workspace
  createDefaultWorkspace(): Workspace
  
  // Get current workspace
  getCurrentWorkspace(): Workspace
  
  // Update workspace
  updateWorkspace(workspace: Workspace): void
  
  // Create folder
  createFolder(name: string, parentId?: string): Folder
  
  // Delete folder (and move documents to parent)
  deleteFolder(folderId: string): void
  
  // Rename folder
  renameFolder(folderId: string, newName: string): void
  
  // Create document
  createDocument(
    type: Document['type'],
    title: string,
    folderId?: string
  ): Document
  
  // Update document
  updateDocument(documentId: string, updates: Partial<Document>): void
  
  // Delete document
  deleteDocument(documentId: string): void
  
  // Move document to folder
  moveDocument(documentId: string, folderId: string): void
  
  // Star/unstar document
  toggleStar(documentId: string): void
  
  // Search documents
  searchDocuments(query: string): Document[]
  
  // Get recent documents (last 10)
  getRecentDocuments(): Document[]
}
```

**Subtasks**:
- [ ] Create WorkspaceService.ts
- [ ] Implement localStorage persistence
- [ ] Add default workspace creation
- [ ] Add CRUD operations for folders
- [ ] Add CRUD operations for documents
- [ ] Add search functionality
- [ ] Write unit tests

---

#### Task 1.2: Document Templates
**File**: `src/services/workspace/DocumentTemplates.ts`

```typescript
export const documentTemplates: DocumentTemplate[] = [
  // Markdown Templates
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured template for meeting notes',
    type: 'markdown',
    icon: '📝',
    category: 'work',
    content: `# Meeting Notes

**Date**: ${new Date().toLocaleDateString()}
**Attendees**: 
**Location**: 

## Agenda

1. 
2. 
3. 

## Discussion

### Topic 1


### Topic 2


## Action Items

- [ ] Task 1 (Assigned to: )
- [ ] Task 2 (Assigned to: )

## Next Steps


## Notes

`,
  },
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Complete project planning template',
    type: 'markdown',
    icon: '📋',
    category: 'work',
    content: `# Project Brief: [Project Name]

## Executive Summary


## Problem Statement


## Goals & Objectives

1. 
2. 
3. 

## Target Audience


## Scope

### In Scope
- 
- 

### Out of Scope
- 
- 

## Timeline

- **Start Date**: 
- **End Date**: 
- **Key Milestones**: 

## Budget


## Success Metrics


## Team

- **Project Manager**: 
- **Team Members**: 

## Risks & Mitigation


## Next Steps

1. 
2. 
3. 
`,
  },
  {
    id: 'prd',
    name: 'Product Requirements (PRD)',
    description: 'Product specification document',
    type: 'markdown',
    icon: '🎯',
    category: 'work',
    content: `# Product Requirements Document

## Product Overview


## Problem & Opportunity


## Target Users

### Primary Persona


### Secondary Persona


## User Stories

1. As a [user type], I want to [action] so that [benefit]
2. 
3. 

## Features

### Must Have (P0)


### Should Have (P1)


### Nice to Have (P2)


## User Flow

\`\`\`mermaid
graph LR
  A[Start] --> B[Action]
  B --> C[Result]
\`\`\`

## Success Metrics


## Technical Considerations


## Timeline


## Open Questions

1. 
2. 
`,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Blog article template with SEO structure',
    type: 'markdown',
    icon: '✍️',
    category: 'personal',
    content: `# [Blog Post Title]

**Published**: ${new Date().toLocaleDateString()}
**Author**: 
**Tags**: 

## Introduction


## Main Content

### Section 1


### Section 2


### Section 3


## Conclusion


## Call to Action


---

**Meta Description**: 

**SEO Keywords**: 
`,
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    description: 'Weekly progress and status update',
    type: 'markdown',
    icon: '📊',
    category: 'work',
    content: `# Weekly Report

**Week of**: ${new Date().toLocaleDateString()}
**Team/Project**: 

## 🎯 Key Accomplishments

- 
- 
- 

## 📈 Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
|        |        |        |        |

## 🚧 Challenges & Blockers


## 📋 Next Week's Priorities

1. 
2. 
3. 

## 💡 Ideas & Opportunities


## 🤝 Help Needed

`,
  },
  
  // Mindmap Templates
  {
    id: 'project-roadmap',
    name: 'Project Roadmap',
    description: 'Plan project phases and milestones',
    type: 'mindmap',
    icon: '🗺️',
    category: 'work',
    content: JSON.stringify({
      nodes: [
        { id: '1', data: { label: 'Project Name' }, position: { x: 400, y: 100 } },
        { id: '2', data: { label: 'Phase 1: Research' }, position: { x: 200, y: 250 } },
        { id: '3', data: { label: 'Phase 2: Design' }, position: { x: 400, y: 250 } },
        { id: '4', data: { label: 'Phase 3: Development' }, position: { x: 600, y: 250 } },
        { id: '5', data: { label: 'Phase 4: Launch' }, position: { x: 800, y: 250 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e1-4', source: '1', target: '4' },
        { id: 'e1-5', source: '1', target: '5' },
      ],
    }),
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Capture and organize ideas',
    type: 'mindmap',
    icon: '💡',
    category: 'work',
    content: JSON.stringify({
      nodes: [
        { id: '1', data: { label: 'Central Idea' }, position: { x: 400, y: 200 } },
        { id: '2', data: { label: 'Category 1' }, position: { x: 200, y: 350 } },
        { id: '3', data: { label: 'Category 2' }, position: { x: 600, y: 350 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
      ],
    }),
  },
  
  // Presentation Templates
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Investor/stakeholder presentation',
    type: 'presentation',
    icon: '🚀',
    category: 'work',
    content: JSON.stringify({
      slides: [
        { layout: 'title', content: { title: 'Company Name', subtitle: 'Tagline' } },
        { layout: 'content', content: { title: 'Problem', body: 'What problem are we solving?' } },
        { layout: 'content', content: { title: 'Solution', body: 'How do we solve it?' } },
        { layout: 'bullets', content: { title: 'Market Opportunity', bullets: ['Market size', 'Growth rate', 'Target segment'] } },
        { layout: 'content', content: { title: 'Business Model', body: 'How do we make money?' } },
        { layout: 'content', content: { title: 'Traction', body: 'What have we achieved so far?' } },
        { layout: 'bullets', content: { title: 'Team', bullets: ['CEO', 'CTO', 'COO'] } },
        { layout: 'content', content: { title: 'Ask', body: 'What are we seeking?' } },
      ],
    }),
  },
];

export class DocumentTemplates {
  getAll(): DocumentTemplate[] {
    return documentTemplates;
  }
  
  getByCategory(category: string): DocumentTemplate[] {
    return documentTemplates.filter(t => t.category === category);
  }
  
  getByType(type: Document['type']): DocumentTemplate[] {
    return documentTemplates.filter(t => t.type === type);
  }
  
  getById(id: string): DocumentTemplate | undefined {
    return documentTemplates.find(t => t.id === id);
  }
}
```

**Subtasks**:
- [ ] Create DocumentTemplates.ts
- [ ] Add 5 markdown templates
- [ ] Add 2 mindmap templates
- [ ] Add 1 presentation template
- [ ] Add template categories

---

### **Phase 2: UI Components** (Week 1-2)

#### Task 2.1: Workspace Sidebar
**File**: `src/components/workspace/WorkspaceSidebar.tsx`

**Features**:
- Folder tree (expandable/collapsible)
- Document list per folder
- Drag-and-drop to move documents
- Right-click context menu (rename, delete)
- "New" button (folder, doc, mindmap, presentation)
- Search input at top
- Recent documents section

**Subtasks**:
- [ ] Create WorkspaceSidebar.tsx
- [ ] Build folder tree component
- [ ] Add document list with icons
- [ ] Implement drag-and-drop
- [ ] Add context menus
- [ ] Style with Tailwind

---

#### Task 2.2: Quick Switcher (Cmd+K)
**File**: `src/components/workspace/QuickSwitcher.tsx`

**Features**:
- Modal triggered by Cmd+K
- Fuzzy search across all documents
- Show recent documents first
- Keyboard navigation (arrows, enter)
- Show document type icons
- Click to open document

**Subtasks**:
- [ ] Create QuickSwitcher.tsx
- [ ] Add keyboard shortcut listener
- [ ] Implement fuzzy search (fuse.js)
- [ ] Add keyboard navigation
- [ ] Style modal

---

#### Task 2.3: Document List View
**File**: `src/components/workspace/DocumentList.tsx`

**Features**:
- Grid or list view toggle
- Sort by: date, name, type
- Filter by: type, starred, tags
- Document cards with preview
- Bulk actions (select multiple)

**Subtasks**:
- [ ] Create DocumentList.tsx
- [ ] Add view toggles
- [ ] Add sorting/filtering
- [ ] Build document card component
- [ ] Add bulk selection

---

#### Task 2.4: New Document Modal
**File**: `src/components/workspace/NewDocumentModal.tsx`

**Features**:
- Shows all templates
- Categories: Work, Personal, Education
- Search templates
- Preview template content
- "Blank document" option
- Create and open immediately

**Subtasks**:
- [ ] Create NewDocumentModal.tsx
- [ ] Display templates in grid
- [ ] Add template preview
- [ ] Add search/filter
- [ ] Handle document creation

---

### **Phase 3: Integration** (Week 2)

#### Task 3.1: Update App Layout
**File**: `src/components/layout/AppLayout.tsx`

**Changes**:
- Add WorkspaceSidebar (always visible)
- Update routing to use document IDs
- Add QuickSwitcher component
- Handle document navigation

**Subtasks**:
- [ ] Integrate WorkspaceSidebar
- [ ] Add QuickSwitcher
- [ ] Update routes
- [ ] Test navigation

---

#### Task 3.2: Migrate Existing Pages
**Files**: `Editor.tsx`, `MindmapStudio2.tsx`, `PresentationEditor.tsx`

**Changes**:
- Load document from workspace instead of localStorage
- Save back to workspace on changes
- Update document metadata (lastEdited, wordCount)
- Add "Save" confirmation

**Subtasks**:
- [ ] Update Editor to use WorkspaceService
- [ ] Update MindmapStudio2 to use WorkspaceService
- [ ] Update PresentationEditor to use WorkspaceService
- [ ] Test all document types

---

## 🎯 User Flows

### **Flow 1: Create New Document from Template**

```
1. User clicks "New Document" button in sidebar
2. Modal opens showing templates
3. User selects "Meeting Notes" template
4. Document is created with template content
5. User is navigated to Editor with new doc
6. User edits and saves
7. Document appears in sidebar folder
```

### **Flow 2: Organize Documents into Folders**

```
1. User creates folder "Q4 Projects"
2. User drags 5 documents into folder
3. Folder shows count (5 documents)
4. User clicks folder to expand
5. Documents are listed under folder
6. User can collapse folder to hide documents
```

### **Flow 3: Quick Switch Between Documents**

```
1. User presses Cmd+K
2. Quick Switcher modal opens
3. User types "meeting"
4. Results filter to show "Meeting Notes 2024-10-03"
5. User presses Enter
6. Editor opens with that document
7. User continues working
```

---

## 🏗️ Technical Architecture

### **Storage Strategy**

```typescript
// localStorage structure
{
  "md-workspace": {
    id: "workspace-1",
    name: "My Workspace",
    folders: [...],
    documents: [...],
  },
  
  // Individual documents (for backward compatibility)
  "doc-123": "markdown content...",
  "presentation-456": {...},
  "mindmap-789": {...}
}
```

### **Migration Strategy**

1. Detect existing localStorage docs
2. Create default workspace
3. Import all existing docs into workspace
4. Preserve document IDs
5. Add to "Imported" folder

---

## 📅 Implementation Timeline

### **Week 1: Core + UI**
- Days 1-2: WorkspaceService + DocumentTemplates
- Days 3-4: WorkspaceSidebar + DocumentList
- Day 5: QuickSwitcher + NewDocumentModal

### **Week 2: Integration + Testing**
- Days 1-2: Update Editor/Studio/Presentation
- Days 3-4: Migration logic + testing
- Day 5: Polish + bug fixes

---

## 🎯 Success Metrics

✅ User can create 50+ documents without confusion
✅ Finding a document with Cmd+K takes <3 seconds
✅ Creating doc from template is 1 click
✅ Zero data loss during migration
✅ Workspace persists across sessions

---

## 🚀 Next Steps After Workspace

Once workspace is done, we can build:
1. **Real-time collaboration** (now we have documents to share!)
2. **Cloud sync** (backend API + database)
3. **Advanced search** (full-text, filters, tags)
4. **Document linking** (reference other docs)
5. **Version history** (Git-like)

---

**Ready to start building?** Let's begin with `WorkspaceService.ts`! 🏗️


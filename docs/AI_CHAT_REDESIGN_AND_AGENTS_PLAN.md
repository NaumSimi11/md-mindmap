# AI Chat Redesign & Self-Writing Agents Plan

## Executive Summary

This document outlines a comprehensive plan to:
1. **Fix current AI chat UX issues** - Parser, preview, header, context
2. **Implement Self-Writing Agents** - Autonomous document/folder creation

---

## Part 1: Current Issues Analysis

### 1.1 Critical Bug: Invalid Model ID Error

**Error:**
```
Error: OpenAI streaming failed: invalid model ID
```

**Root Cause:**
The `generateContentStream` method is using `model` parameter from options without validation. When user selects a model from ModelPicker, it might pass model IDs that are formatted for one provider to another.

**Location:** `frontend/src/services/ai/AIService.ts:109-169`

```typescript
// Current Issue - Model is passed directly without mapping
async generateContentStream(prompt: string, onChunk: (chunk: string) => void, options: GenerationOptions = {}): Promise<void> {
  const model = options.model || this.config.defaultModel || 'gpt-3.5-turbo';
  // If user selects "openai/gpt-4-turbo-preview" (OpenRouter format) 
  // but provider is OpenAI, this fails!
}
```

**Fix Required:**
- Add model ID normalization layer
- Map provider-specific model IDs correctly
- Validate model exists for selected provider

---

### 1.2 UI Issue: Answer Parsing (Unnatural)

**Current Problem:**
- AI responses show raw JSON function calls
- Streaming looks robotic
- Confidence badges appear before content
- Function call status appears inline awkwardly

**Current Code:** `AISidebarChat.tsx:367-401`
```tsx
{/* Message Content (hide JSON) */}
{message.content && !message.content.includes('"function"') && (
  <p className="text-sm whitespace-pre-wrap">
    {message.content}  // Raw text, no markdown rendering!
  </p>
)}
```

**Issues:**
1. No markdown rendering in chat messages
2. Raw text dump
3. `whitespace-pre-wrap` creates awkward formatting
4. No progressive reveal animation

**Solution:**
- Implement proper markdown renderer for chat
- Use `ReactMarkdown` or similar
- Add typing animation for natural feel
- Hide technical details, show human-friendly summaries

---

### 1.3 UI Issue: Accept/Cancel UI Placement

**Current Problem:**
- Accept/Cancel appears in TWO places:
  1. Inside AIContentPreview component
  2. Fixed at bottom of chat (lines 409-440)
- Redundant and confusing

**Current Code:** `AISidebarChat.tsx:409-440`
```tsx
{/* Quick Action Buttons (when content is staged) */}
{currentStaged && (
  <div className="px-4 py-2 bg-purple-50...">
    <Button onClick={acceptStaged}>Apply</Button>
    <Button onClick={rejectStaged}>Cancel</Button>
  </div>
)}
```

**Solution:**
- Remove duplicate action bar
- Keep actions ONLY in the content preview
- Add keyboard shortcuts (Enter = accept, Esc = cancel)

---

### 1.4 UI Issue: Preview at Top of Conversation

**Current Problem:**
- Preview appears BEFORE messages in the scroll area
- Breaks conversational flow
- User loses context

**Current Code:** `AISidebarChat.tsx:316-328`
```tsx
{/* 🎯 Show Preview if content is staged - BEFORE messages! */}
{currentStaged && (
  <div className="mb-4">
    <AIContentPreview ... />
  </div>
)}

{messages.map((message) => ...)}  // Messages come AFTER
```

**Solution:**
- Move preview to be PART of the message flow
- Preview should appear as the assistant's response
- Or: Show preview inline with the editor (we have InlinePreviewExtension!)

---

### 1.5 UI Issue: Chat Header Takes Too Much Space

**Current Problem:**
```tsx
// 90px+ of header space:
- AI Assistant title + Antigravity badge (24px)
- Word count (16px) 
- 4 icon buttons (32px)
- Context panel (document, section, preferences) (~60px)
```

**Wasted Space Analysis:**
- Title: "AI Assistant" + "Antigravity" badge = redundant
- Word count: useful but not header material
- Context panel: shows section info that's rarely useful

**Solution:**
- Collapse header to single line
- Move context to expandable panel
- Use tooltips instead of visible labels

**Proposed Compact Header:**
```
[✨] AI Chat          [⚙️] [🔑] [−] [×]
```

---

### 1.6 UI Issue: Context Display Takes Too Much Space

**Current Problem:**
```tsx
{/* Context Info - 60px+ of space */}
<div className="p-3 border-b border-border bg-muted/30">
  <div>📄 {documentTitle}</div>
  <div>🖱️ Section: {currentSection}</div>
  <div>✨ Confident Mode • Professional</div>
</div>
```

**Issues:**
- Always visible even when not needed
- Takes 60px regardless of value
- No support for MULTIPLE document context

**Solution: Collapsible Context Chips**
```tsx
// Compact: Single line with expandable chips
<div className="flex gap-1 px-2 py-1">
  <Chip>📄 README</Chip>
  <Chip>+ 3 docs</Chip>  {/* Expandable */}
  <Chip>🎯 Section: Setup</Chip>
</div>
```

---

### 1.7 Parsing Should Be Natural

**Current Flow:**
1. AI generates text + JSON function call
2. We extract JSON with regex
3. We show text before JSON (often truncated)
4. Function call status appears as badge

**Desired Flow:**
1. AI streams response naturally
2. Text appears word-by-word (typing effect)
3. When action detected, show subtle indicator
4. Preview appears smoothly integrated

**Implementation:**
```typescript
// Natural streaming parser
const streamParser = {
  buffer: '',
  onText: (text) => appendToMessage(text),
  onAction: (action) => showSubtleIndicator(action),
  onComplete: () => showPreviewSmoothly()
};
```

---

## Part 2: Self-Writing Agents Feature

### 2.1 Vision

Enable AI to autonomously:
- **Plan** projects/documentation structure
- **Create** folders and documents
- **Generate** content across multiple files
- **Execute** multi-step workflows

### 2.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Planner   │  │   Writer    │  │  Organizer  │     │
│  │   Agent     │──▶│   Agent    │──▶│   Agent    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│        │                │                │              │
│        ▼                ▼                ▼              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Tool Layer (Functions)              │   │
│  │  • create_plan_document                          │   │
│  │  • create_folder                                 │   │
│  │  • create_document                               │   │
│  │  • update_document                               │   │
│  │  • batch_create                                  │   │
│  └─────────────────────────────────────────────────┘   │
│        │                │                │              │
│        ▼                ▼                ▼              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Workspace Service Layer                │   │
│  │  • BackendWorkspaceService                       │   │
│  │  • GuestWorkspaceService                         │   │
│  │  • FolderService                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Agent Types

#### Planner Agent
**Purpose:** Create structured plans for documentation/projects

**Input:** "Create documentation for a React component library"

**Output:** `PLAN.md` with:
```markdown
# Documentation Plan: React Component Library

## Structure
- `/docs/`
  - `getting-started.md`
  - `/components/`
    - `button.md`
    - `input.md`
    - `modal.md`
  - `/guides/`
    - `theming.md`
    - `accessibility.md`

## Tasks
- [ ] Create folder structure
- [ ] Write Getting Started guide
- [ ] Document Button component
- [ ] Document Input component
...
```

#### Writer Agent
**Purpose:** Generate content for documents

**Capabilities:**
- Write full documents from outline
- Fill empty sections
- Expand existing content
- Cross-reference other documents

#### Organizer Agent
**Purpose:** Create folder structures and organize files

**Capabilities:**
- Create nested folder hierarchies
- Move documents between folders
- Rename and restructure

### 2.4 New Function Schemas

```typescript
// Agent Tools - extends DocumentEditTools
const AgentFunctionSchemas = {
  // Planning
  create_plan: {
    name: 'create_plan',
    description: 'Create a structured plan document with tasks and folder structure',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Plan title' },
        structure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Folder or file path' },
              type: { type: 'string', enum: ['folder', 'document'] },
              description: { type: 'string' }
            }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'in-progress', 'done'] }
            }
          }
        }
      },
      required: ['title', 'structure']
    }
  },

  // Folder Operations
  create_folder: {
    name: 'create_folder',
    description: 'Create a new folder in the workspace',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Folder name' },
        parentPath: { type: 'string', description: 'Parent folder path (null for root)' },
        icon: { type: 'string', description: 'Emoji icon for folder' }
      },
      required: ['name']
    }
  },

  // Document Operations
  create_document: {
    name: 'create_document',
    description: 'Create a new document in a folder',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Initial markdown content' },
        folderPath: { type: 'string', description: 'Target folder path' },
        type: { type: 'string', enum: ['markdown', 'note', 'todo'] }
      },
      required: ['title', 'content']
    }
  },

  // Batch Operations
  batch_create: {
    name: 'batch_create',
    description: 'Create multiple folders and documents in one operation',
    parameters: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['folder', 'document'] },
              path: { type: 'string' },
              name: { type: 'string' },
              content: { type: 'string' },
              icon: { type: 'string' }
            }
          }
        }
      },
      required: ['operations']
    }
  },

  // Execute Plan
  execute_plan: {
    name: 'execute_plan',
    description: 'Execute a previously created plan, creating all folders and documents',
    parameters: {
      type: 'object',
      properties: {
        planDocumentId: { type: 'string', description: 'ID of the plan document to execute' },
        dryRun: { type: 'boolean', description: 'Preview changes without applying' }
      },
      required: ['planDocumentId']
    }
  }
};
```

### 2.5 Agent Workflow Example

**User:** "Create full documentation for my API project"

**Agent Response Flow:**

```
[Planner Agent Activates]
├─ Analyzing project context...
├─ Creating PLAN.md
│   └─ Structure: 12 folders, 24 documents
│   └─ Tasks: 24 items
└─ Plan ready for review

[User: "Do it" / "Execute"]

[Organizer Agent Activates]
├─ Creating folder: /docs
├─ Creating folder: /docs/api
├─ Creating folder: /docs/guides
├─ Creating folder: /docs/examples
└─ Folder structure complete (4 folders)

[Writer Agent Activates]
├─ Writing: /docs/README.md
│   └─ Progress: 100%
├─ Writing: /docs/api/authentication.md
│   └─ Progress: 100%
├─ Writing: /docs/api/endpoints.md
│   └─ Progress: 100%
...
└─ All documents created (24 files)

[Complete]
✅ Created documentation structure
   - 4 folders
   - 24 documents
   - 15,000+ words
```

### 2.6 UI for Agent Progress

```tsx
// AgentProgressPanel component
<div className="agent-progress">
  <div className="header">
    <span>🤖 Agent Working...</span>
    <Badge>Planner</Badge>
  </div>
  
  <ProgressBar value={65} />
  
  <div className="steps">
    <Step status="done">✅ Created plan</Step>
    <Step status="done">✅ Created 4 folders</Step>
    <Step status="active">📝 Writing README.md (3/24)</Step>
    <Step status="pending">⏳ Write API docs</Step>
  </div>
  
  <div className="actions">
    <Button variant="outline">Pause</Button>
    <Button variant="destructive">Cancel</Button>
  </div>
</div>
```

---

## Part 3: Implementation Plan

### Phase 1: Fix Current Issues (Priority: HIGH)

| Task | Effort | Files |
|------|--------|-------|
| Fix model ID validation | 2h | AIService.ts |
| Add markdown rendering to chat | 3h | AISidebarChat.tsx |
| Remove duplicate action buttons | 1h | AISidebarChat.tsx |
| Move preview into message flow | 2h | AISidebarChat.tsx |
| Compact header redesign | 2h | AISidebarChat.tsx |
| Collapsible context chips | 3h | AISidebarChat.tsx |
| Natural streaming parser | 4h | useAIChat.ts |

**Total: ~17 hours**

### Phase 2: Agent Infrastructure (Priority: MEDIUM)

| Task | Effort | Files |
|------|--------|-------|
| Create AgentService base | 4h | AgentService.ts |
| Implement create_folder function | 3h | AgentTools.ts |
| Implement create_document function | 3h | AgentTools.ts |
| Implement batch_create function | 4h | AgentTools.ts |
| Create AgentProgressPanel UI | 4h | AgentProgressPanel.tsx |

**Total: ~18 hours**

### Phase 3: Planner Agent (Priority: MEDIUM)

| Task | Effort | Files |
|------|--------|-------|
| Plan document schema | 2h | PlanSchema.ts |
| Planner agent prompts | 3h | PlannerAgent.ts |
| Plan preview UI | 3h | PlanPreview.tsx |
| Execute plan function | 4h | AgentTools.ts |

**Total: ~12 hours**

### Phase 4: Writer Agent (Priority: LOW)

| Task | Effort | Files |
|------|--------|-------|
| Writer agent prompts | 3h | WriterAgent.ts |
| Multi-document context | 4h | WriterAgent.ts |
| Progress tracking | 2h | WriterAgent.ts |

**Total: ~9 hours**

---

## Part 4: File Changes Summary

### Files to Modify

1. **`frontend/src/services/ai/AIService.ts`**
   - Add model ID normalization
   - Add provider-specific model mapping

2. **`frontend/src/components/editor/AISidebarChat.tsx`**
   - Compact header
   - Collapsible context
   - Remove duplicate actions
   - Move preview into message flow
   - Add markdown rendering

3. **`frontend/src/hooks/useAIChat.ts`**
   - Natural streaming parser
   - Better error handling

4. **`frontend/src/components/editor/AIContentPreview.tsx`**
   - Simplify UI
   - Add keyboard shortcuts

### Files to Create

1. **`frontend/src/services/ai/AgentService.ts`**
   - Agent orchestrator
   - Agent state management

2. **`frontend/src/services/ai/AgentTools.ts`**
   - create_folder
   - create_document
   - batch_create
   - execute_plan

3. **`frontend/src/services/ai/agents/PlannerAgent.ts`**
   - Plan generation
   - Structure analysis

4. **`frontend/src/services/ai/agents/WriterAgent.ts`**
   - Content generation
   - Multi-doc context

5. **`frontend/src/components/editor/AgentProgressPanel.tsx`**
   - Progress visualization
   - Step tracking

6. **`frontend/src/components/editor/PlanPreview.tsx`**
   - Plan visualization
   - Structure tree

---

## Part 5: Dependencies

### Existing Infrastructure We Can Use

| Component | Location | Purpose |
|-----------|----------|---------|
| FolderService | hooks/useBackendFolders.ts | Create/update/delete folders |
| DocumentService | services/workspace/BackendWorkspaceService.ts | Create/update documents |
| DocumentEditTools | services/ai/DocumentEditTools.ts | Edit document content |
| AIStagingStore | stores/aiStagingStore.ts | Preview before apply |
| InlinePreviewExtension | extensions/InlinePreviewExtension.tsx | Show preview in editor |

### New Dependencies Needed

| Package | Purpose |
|---------|---------|
| react-markdown | Render markdown in chat |
| remark-gfm | GitHub-flavored markdown support |

---

## Confirmation

I understand what we're going to do:

1. **Phase 1:** Fix all the UI issues you mentioned:
   - Model ID error
   - Unnatural parsing
   - Duplicate accept/cancel
   - Preview placement
   - Header space
   - Context display

2. **Phase 2+:** Implement Self-Writing Agents:
   - Planner Agent (creates PLAN.md with structure)
   - Writer Agent (generates document content)
   - Organizer Agent (creates folders/documents)
   - All agents use existing workspace infrastructure

**Ready to proceed with Phase 1 fixes first?**

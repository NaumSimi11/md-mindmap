# 🏗️ Surgical Refactoring Plan: Evidence-Based Architecture Evolution

> **Philosophy**: "Refactor like you're performing heart surgery on a running patient."
> 
> Based on: Strangler Fig Pattern (Martin Fowler), Incremental Refactoring (Refactoring.Guru), and Real-World Production Constraints

---

## 🎯 What Makes This Product Special

**You're not building "just another Markdown editor."**

You're building a **dual-mode thinking system** where users can:

```
   LINEAR THINKING              VISUAL THINKING
  ┌──────────────┐             ┌──────────────┐
  │   MARKDOWN   │             │   MINDMAP    │
  │   EDITOR     │◄────────────►│   STUDIO     │
  │              │   One Click  │              │
  │ - Write docs │             │ - Visualize  │
  │ - AI assist  │             │ - Edit nodes │
  │ - Diagrams   │             │ - AI tools   │
  └──────────────┘             └──────────────┘
         ↓                              ↓
         └──── Same Document ───────────┘
```

**The Magic Flow:**
1. User writes: "# Project Planning\n## Q1 Goals\n## Q2 Goals"
2. Clicks **"Mindmap"** button in editor
3. System converts headings → visual mindmap
4. User edits mindmap visually (drag, connect, AI expand)
5. Clicks **"Back to Editor"**
6. Changes sync back to Markdown

**This is your competitive advantage. The refactoring must preserve this.**

---

## ⚠️ CRITICAL: THE CORE VALUE PROPOSITION ⚠️

**THIS IS NOT JUST AN EDITOR. IT'S A DUAL-MODE THINKING SYSTEM.**

```
┌─────────────────────────────────────────────────────────┐
│                    WORKSPACE                            │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  EDITOR MODE   │ ◄─────► │  MINDMAP MODE    │       │
│  │  (Linear)      │ Switch  │  (Visual)        │       │
│  ├────────────────┤         ├──────────────────┤       │
│  │ - Markdown     │         │ - React Flow     │       │
│  │ - WYSIWYG      │         │ - Interactive    │       │
│  │ - AI Sidebar   │         │ - AI Tools       │       │
│  │ - Diagrams     │         │ - Export         │       │
│  └────────────────┘         └──────────────────┘       │
│         ↓                            ↓                  │
│    Same Document - Different View Modes                │
└─────────────────────────────────────────────────────────┘
```

**Your Product's Magic:**
1. **Write** in Markdown/WYSIWYG (linear thinking)
2. **Click "Mindmap"** button → UnifiedDiagramModal
3. **Switch** to full MindmapStudio2 (visual thinking)
4. **Edit** visually with React Flow + AI
5. **Return** to editor - changes persist

**The URL Architecture:**
```
/workspace/doc/:id/edit     → WYSIWYGEditor (Mode 1)
/workspace/doc/:id/mindmap  → MindmapStudio2 (Mode 2)
/workspace/doc/:id/slides   → PresentationEditor (Mode 3)
```

**THIS REFACTORING MUST NOT BREAK THE MODE SWITCHING.**

---

## Executive Summary

**Current State Analysis:**
- ✅ Zustand installed (v5.0.8) but unused
- ⚠️ WYSIWYGEditor: **2,813 lines** (God Component)
- ⚠️ Two AI sidebars exist: `AISidebarChat.tsx` (997 lines) + `AISidebarChatV2.tsx` (524 lines)
- ⚠️ Empty folder structure created (`core/`, `features/`, `toolbar/`) but **not migrated**
- ✅ Strong foundation: TipTap, good services layer, comprehensive extensions
- ✅ **CORE FEATURE**: Editor ↔ Mindmap ↔ Slides switching via Workspace router

**The Problem:**
You started refactoring by creating folders but didn't finish the migration. The empty structure is now **technical debt** instead of progress.

**The Solution:**
Use the **Strangler Fig Pattern** - gradually replace parts of WYSIWYGEditor while keeping the original working, **especially protecting the mindmap integration**, then delete the old code only after the new code is proven.

---

## Part 0: Protecting The Mindmap Integration

### 0.1 Critical Integration Points

Your refactoring **MUST** preserve these:

#### 1. **Editor → Mindmap Data Flow**

```typescript
// In WYSIWYGEditor.tsx:2536-2548
<Button onClick={() => {
  // Save current content first (as markdown)
  if (editor && onContentChange) {
    const markdown = htmlToMarkdown('', editor);
    onContentChange(markdown); // ← CRITICAL: Persists to document
  }
  setShowMindmapChoiceModal(true); // ← Opens modal
}}>
  Mindmap
</Button>
```

**What this does:**
1. Converts TipTap HTML → Markdown
2. Saves to document via `onContentChange`
3. Opens `UnifiedDiagramModal` with 3 options:
   - Quick Insert (inline mermaid)
   - AI Generate (AI creates diagram)
   - **Open Studio** → navigates to `/workspace/doc/:id/mindmap`

#### 2. **Workspace Router (The Orchestrator)**

```typescript
// In Workspace.tsx:29-44
type ViewMode = 'home' | 'edit' | 'mindmap' | 'slides' | 'present';

const renderMainContent = () => {
  if (viewMode === 'edit') {
    return <WYSIWYGEditor {...props} />;
  }
  if (viewMode === 'mindmap') {
    return <MindmapStudio2 />;
  }
  // ... etc
};
```

**This is your single source of truth for mode switching.**

#### 3. **Session Service (State Persistence)**

```typescript
// src/services/EditorStudioSession.ts
// Stores mindmap session data when switching between modes
sessionService.setMindmapData(data);
```

### 0.2 Refactoring Safety Rules

**FOR EVERY WEEK, TEST THESE FLOWS:**

1. **Editor → Mindmap Flow:**
   - Create document in editor
   - Click "Mindmap" button
   - Choose "Open Studio"
   - Verify: MindmapStudio2 loads with correct document
   - Make changes in mindmap
   - Return to editor
   - Verify: Changes persisted

2. **Mindmap → Editor Flow:**
   - Create mindmap in studio
   - Export to editor
   - Verify: Mermaid code inserted correctly
   - Verify: Diagram renders in editor

3. **Cross-Mode AI:**
   - Use AI in editor
   - Switch to mindmap
   - Use AI in mindmap
   - Verify: Credits tracked correctly
   - Verify: No state conflicts

### 0.3 Files That Are OFF-LIMITS During Refactoring

These files are **critical** to mode switching. **DO NOT REFACTOR THEM** until Weeks 5-6:

- ❌ `src/pages/Workspace.tsx` (the router)
- ❌ `src/services/EditorStudioSession.ts` (session state)
- ❌ `src/components/modals/UnifiedDiagramModal.tsx` (the bridge)
- ❌ `src/pages/MindmapStudio2.tsx` (3,241 lines - separate refactoring)

**Why?** These are the "spine" of your dual-mode system. Break them and the whole product breaks.

### 0.4 The Mindmap Button Must Always Work

During refactoring, this button is your **canary in the coal mine**:

```typescript
// In WYSIWYGEditor (lines 2536-2553)
<Button onClick={() => { /* ... */ }}>
  <Network className="h-4 w-4 mr-1" />
  Mindmap
</Button>
```

**Test this EVERY DAY:**
- Before starting work
- After any editor changes
- Before committing

If this button breaks, **stop refactoring immediately** and fix it.

### 0.5 Integration Tests Required

Before Week 1 starts, add these tests:

```typescript
// src/__tests__/integration/mode-switching.test.tsx
describe('Editor ↔ Mindmap Switching', () => {
  it('should save editor content before opening mindmap', async () => {
    const { getByText } = render(<Workspace />);
    
    // Type in editor
    // Click "Mindmap" button
    // Verify onContentChange called
    // Verify modal opens
  });

  it('should persist document between mode switches', async () => {
    // Create doc in editor
    // Switch to mindmap
    // Make changes
    // Switch back to editor
    // Verify changes persisted
  });

  it('should handle AI usage in both modes', async () => {
    // Use AI in editor
    // Switch to mindmap
    // Use AI in mindmap
    // Verify credits decremented correctly
  });
});
```

**These tests MUST pass before any refactoring is deployed.**

---

## Part 1: The Strategy

### 1.1 Strangler Fig Pattern

Named after a type of tree that grows around a host tree, eventually replacing it.

**How it works:**
1. Build new functionality **alongside** old code (not as replacement)
2. Route NEW features to new code, OLD features to old code
3. Gradually migrate traffic from old → new
4. Delete old code only when new code is 100% stable

**Why it works:**
- ✅ Zero downtime
- ✅ Reversible at any point
- ✅ Production-tested before switching
- ✅ Team learns incrementally

### 1.2 Risk Management

Every refactoring follows this lifecycle:

```
CREATE → TEST → INTEGRATE → VALIDATE → (optional) DEPRECATE → DELETE
```

**Critical Rules:**
1. **Feature flags** for all major changes
2. **Never delete until replacement is proven** (minimum 1 week in production)
3. **Parallel systems** - old and new run side-by-side during transition
4. **Rollback plan** for every change
5. **Test coverage** before extraction (currently: test infrastructure exists but incomplete)

---

## Part 2: The 6-Week Refactoring Roadmap

### Week 1: Foundation & Measurement
**Goal:** Establish metrics, testing, and Zustand store

#### Task 1.1: Add Metrics & Monitoring (2 days)
```typescript
// src/utils/performance.ts
export const metrics = {
  trackRender: (component: string, duration: number) => {},
  trackStateChange: (store: string, action: string) => {},
  trackError: (component: string, error: Error) => {},
};
```

**Why:** You need data to prove refactoring is improving things (or not).

**Metrics to track:**
- Component render times
- State update frequency
- Bundle size per feature
- Error rates

#### Task 1.2: Create Zustand Editor Store (3 days)

**Do NOT migrate everything to Zustand immediately.** Start with **UI-only state**.

```typescript
// src/stores/editorUIStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface EditorUIState {
  // Sidebar & Modal State
  isSidebarOpen: boolean;
  activeModal: 'ai' | 'diagram' | 'settings' | 'export' | null;
  isMinimized: boolean;
  
  // Toolbar State
  showFloatingToolbar: boolean;
  showFixedToolbar: boolean;
  
  // Panel State
  showKeyboardShortcuts: boolean;
  showOutline: boolean;
  
  // Actions
  toggleSidebar: () => void;
  openModal: (modal: EditorUIState['activeModal']) => void;
  closeModal: () => void;
  toggleMinimized: () => void;
}

export const useEditorUIStore = create<EditorUIState>()(
  devtools(
    persist(
      (set) => ({
        // State
        isSidebarOpen: false,
        activeModal: null,
        isMinimized: false,
        showFloatingToolbar: true,
        showFixedToolbar: true,
        showKeyboardShortcuts: false,
        showOutline: false,
        
        // Actions
        toggleSidebar: () => set((state) => ({ 
          isSidebarOpen: !state.isSidebarOpen 
        })),
        openModal: (modal) => set({ activeModal: modal }),
        closeModal: () => set({ activeModal: null }),
        toggleMinimized: () => set((state) => ({ 
          isMinimized: !state.isMinimized 
        })),
      }),
      { name: 'editor-ui-store' }
    )
  )
);
```

**Migration Strategy:**
- Keep old state management in WYSIWYGEditor
- Add Zustand alongside
- Wire new components to Zustand
- OLD components still use props/useState
- Gradually deprecate prop drilling

**Success Criteria:**
- [ ] Store created with DevTools
- [ ] At least 1 new component uses store
- [ ] Old components still work
- [ ] Performance metrics show no regression

---

### Week 2: AI Sidebar Consolidation
**Goal:** Merge AISidebarChat + AISidebarChatV2 into one production-ready component

#### Current Situation Analysis:

**AISidebarChat.tsx (997 lines):**
- ✅ Sophisticated prompt engineering
- ✅ Preference system
- ✅ Context detection
- ❌ Complex state management
- ❌ No streaming

**AISidebarChatV2.tsx (524 lines):**
- ✅ Function calling
- ✅ Streaming responses
- ✅ Cleaner architecture
- ❌ Missing preference system
- ❌ Less mature prompts

**Decision:** **V2 is the foundation, migrate V1's best features into it.**

#### Task 2.1: Feature Inventory (1 day)

Create comparison matrix:

| Feature | V1 | V2 | Winner | Migration Complexity |
|---------|----|----|--------|---------------------|
| Streaming | ❌ | ✅ | V2 | - |
| Function Calling | ❌ | ✅ | V2 | - |
| Preferences Panel | ✅ | ❌ | V1 | Medium |
| Execute Mode Detection | ✅ | ❌ | V1 | Low |
| Frustration Detection | ✅ | ❌ | V1 | Low |
| Context Detection | ✅ | ⚠️ | V1 | Medium |
| Smart Prompting | ✅ | ❌ | V1 | High |

#### Task 2.2: Migrate Preferences to V2 (2 days)

1. Copy `AIPreferencesPanel.tsx` integration
2. Wire preferences into V2's system prompts
3. Test that preferences affect behavior

#### Task 2.3: Migrate Prompt Engineering to V2 (2 days)

The 300-line prompt in V1 is valuable but needs few-shot examples (per our earlier analysis).

**New Approach:**
```typescript
// src/config/aiPrompts.ts
export const SIDEBAR_SYSTEM_PROMPT = `
You are a document editing assistant. You make changes immediately without asking questions.

**Example 1: User says "improve the roadmap"**
❌ BAD: "Would you like me to add more structure?"
✅ GOOD: edit_document({
  section: "Roadmap",
  old_text: "Phase 1: Setup",
  new_text: "Phase 1: Setup & Infrastructure (Week 1-2)\\n- AWS configuration (Day 1)\\n- CI/CD pipeline (Day 2-4)"
})

**Example 2: User says "yes"**
❌ BAD: "Great! Shall I proceed?"
✅ GOOD: [Execute previous suggestion immediately]

${getPreferenceInstructions(preferences)}
`;
```

#### Task 2.4: Feature Flag Rollout (1 day)

```typescript
// In WYSIWYGEditor.tsx
const USE_AI_SIDEBAR_V2 = true; // Feature flag

{USE_AI_SIDEBAR_V2 ? (
  <AISidebarChatV2 {...props} />
) : (
  <AISidebarChat {...props} />
)}
```

**Rollout Plan:**
- Day 1-2: Internal testing with V2 (flag = true)
- Day 3-4: Production with 50% rollout
- Day 5: Full rollout
- Week 3: Delete AISidebarChat.tsx

**Success Criteria:**
- [ ] V2 has all V1 features
- [ ] Preferences system works
- [ ] Performance ≥ V1
- [ ] User feedback positive
- [ ] No increase in error rate

---

### Week 3: Toolbar Extraction
**Goal:** Extract toolbar logic from WYSIWYGEditor without breaking anything

#### Current Problem:

Lines 82-100 in WYSIWYGEditor define all toolbar components inline:
```typescript
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2,
  Heading3, List, ListOrdered, ListTodo, Quote, Minus,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Sparkles, Wand2, Save, Share, Download, ...
} from 'lucide-react';
```

Then lines 200-600 define toolbar rendering logic.

#### Task 3.1: Create Toolbar Hook (2 days)

**Extract, don't rewrite:**

```typescript
// src/hooks/useEditorToolbar.ts
import { Editor } from '@tiptap/react';

export interface ToolbarAction {
  icon: React.ComponentType;
  label: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shortcut?: string;
}

export function useEditorToolbar(editor: Editor | null) {
  const formatActions: ToolbarAction[] = useMemo(() => {
    if (!editor) return [];
    
    return [
      {
        icon: Bold,
        label: 'Bold',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
        shortcut: '⌘B',
      },
      // ... extract ALL existing toolbar logic
    ];
  }, [editor]);

  const insertActions: ToolbarAction[] = useMemo(() => {
    // Extract insert menu logic
  }, [editor]);

  return { formatActions, insertActions };
}
```

#### Task 3.2: Create Toolbar Components (2 days)

**Important:** These wrap existing logic, not replace it.

```typescript
// src/components/editor/toolbar/ToolbarButton.tsx
export const ToolbarButton: React.FC<{
  action: ToolbarAction;
}> = ({ action }) => {
  return (
    <Button
      variant={action.isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={action.action}
      disabled={action.isDisabled}
      title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
    >
      <action.icon className="h-4 w-4" />
    </Button>
  );
};

// src/components/editor/toolbar/FixedToolbar.tsx
export const FixedToolbar: React.FC<{
  editor: Editor | null;
}> = ({ editor }) => {
  const { formatActions, insertActions } = useEditorToolbar(editor);
  
  return (
    <div className="border-b p-2 flex gap-1">
      {formatActions.map((action, i) => (
        <ToolbarButton key={i} action={action} />
      ))}
      <Separator orientation="vertical" />
      {insertActions.map((action, i) => (
        <ToolbarButton key={i} action={action} />
      ))}
    </div>
  );
};
```

#### Task 3.3: Parallel Integration (2 days)

```typescript
// In WYSIWYGEditor.tsx
const USE_NEW_TOOLBAR = false; // Start with false

return (
  <div>
    {USE_NEW_TOOLBAR ? (
      <FixedToolbar editor={editor} />
    ) : (
      /* OLD TOOLBAR CODE - keep untouched */
      <div className="border-b p-2 flex gap-1">
        {/* existing 200 lines of toolbar code */}
      </div>
    )}
  </div>
);
```

**Test for 3 days with flag = true internally.**

#### Task 3.4: Delete Old Toolbar (1 day)

Only after new toolbar is proven:
1. Set flag = true permanently
2. Delete old toolbar JSX (lines 200-400 in WYSIWYGEditor)
3. Verify no regressions

**Success Criteria:**
- [ ] New toolbar has 100% feature parity
- [ ] Keyboard shortcuts still work
- [ ] Floating toolbar still works
- [ ] No performance regression
- [ ] WYSIWYGEditor reduced by ~200 lines

---

### Week 4: Editor Core Extraction
**Goal:** Extract TipTap setup logic into reusable hook

#### Current Problem:

Lines 100-500 in WYSIWYGEditor contain TipTap initialization:
- Extension configuration
- Event handlers
- Lifecycle management

This logic is **impossible to reuse** in other components.

#### Task 4.1: Create Editor Setup Hook (3 days)

```typescript
// src/hooks/useEditorSetup.ts
import { useEditor } from '@tiptap/react';
import { Extensions } from '@tiptap/core';

interface EditorSetupOptions {
  content: string;
  onUpdate?: (content: string) => void;
  onSelectionUpdate?: (selection: any) => void;
  editable?: boolean;
  autofocus?: boolean;
  placeholder?: string;
}

export function useEditorSetup(options: EditorSetupOptions) {
  const extensions: Extensions = useMemo(() => [
    StarterKit,
    Placeholder.configure({ placeholder: options.placeholder }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem,
    Image,
    Link.configure({ openOnClick: false }),
    // ... ALL existing extensions
    MermaidNode,
    CalloutNode,
    YouTubeNode,
    // ... etc
  ], [options.placeholder]);

  const editor = useEditor({
    extensions,
    content: options.content,
    editable: options.editable ?? true,
    autofocus: options.autofocus ?? false,
    onUpdate: ({ editor }) => {
      options.onUpdate?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      options.onSelectionUpdate?.(editor.state.selection);
    },
  });

  return editor;
}
```

#### Task 4.2: Replace useEditor in WYSIWYGEditor (2 days)

```typescript
// In WYSIWYGEditor.tsx - BEFORE
const editor = useEditor({
  extensions: [
    StarterKit,
    // ... 100 lines of extensions
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    // ... complex logic
  },
  // ... etc
});

// AFTER
const editor = useEditorSetup({
  content: initialContent,
  onUpdate: handleUpdate,
  onSelectionUpdate: handleSelectionUpdate,
  editable: isEditable,
  placeholder: 'Start writing...',
});
```

**Benefits:**
- Reduces WYSIWYGEditor by ~150 lines
- Makes editor logic reusable
- Easier to test in isolation

**Success Criteria:**
- [ ] All extensions still work
- [ ] All event handlers fire correctly
- [ ] No performance regression
- [ ] Can create second editor instance using same hook

---

### Week 5: Feature Module Extraction
**Goal:** Move features into `features/` folder **properly**

#### Current Situation:

You created empty folders:
- `features/ai/` (empty)
- `features/diagrams/` (empty)
- `features/media/` (empty)

But all the actual code is still in root `editor/` folder.

#### Task 5.1: AI Feature Module (2 days)

**Move these files:**
```
src/components/editor/
├── AISidebarChatV2.tsx           → features/ai/AISidebarChat.tsx
├── AIPreferencesPanel.tsx        → features/ai/AIPreferencesPanel.tsx
├── AISettingsPanel.tsx           → features/ai/AISettingsPanel.tsx
├── ModelPicker.tsx               → features/ai/ModelPicker.tsx
├── InlineSuggestion.tsx          → features/ai/InlineSuggestion.tsx
└── AIAssistantModal.tsx          → features/ai/AIAssistantModal.tsx (if keeping)
```

**Create barrel export:**
```typescript
// src/components/editor/features/ai/index.ts
export { AISidebarChat } from './AISidebarChat';
export { AIPreferencesPanel } from './AIPreferencesPanel';
export { AISettingsPanel } from './AISettingsPanel';
export { ModelPicker } from './ModelPicker';
export { InlineSuggestion } from './InlineSuggestion';

export type { ChatMessage, AIPreferences } from './types';
```

**Update imports in WYSIWYGEditor:**
```typescript
// Before
import { AISidebarChatV2 } from './AISidebarChatV2';
import { AIPreferencesPanel } from './AIPreferencesPanel';

// After
import { AISidebarChat, AIPreferencesPanel } from './features/ai';
```

#### Task 5.2: Diagram Feature Module (2 days)

**Move these files:**
```
src/components/editor/
├── DiagramInsertMenu.tsx         → features/diagrams/DiagramInsertMenu.tsx
├── DiagramTemplates.ts           → features/diagrams/templates.ts
└── extensions/
    └── MermaidNode.tsx           → features/diagrams/MermaidNode.tsx
```

#### Task 5.3: Media Feature Module (1 day)

**Move these files:**
```
src/components/editor/
└── extensions/
    ├── ResizableImageNodeView.tsx → features/media/ResizableImageNode.tsx
    ├── YouTubeNode.tsx            → features/media/YouTubeNode.tsx
    ├── VimeoNode.tsx              → features/media/VimeoNode.tsx
    ├── PDFNode.tsx                → features/media/PDFNode.tsx
    └── GistNode.tsx               → features/media/GistNode.tsx
```

**Success Criteria:**
- [ ] All imports updated
- [ ] No broken dependencies
- [ ] Features still work
- [ ] Clear module boundaries
- [ ] Easier to find files

---

### Week 6: Core Extraction & Polish
**Goal:** Finalize core extraction and delete old code

#### Task 6.1: Create EditorCanvas Component (2 days)

This is the actual editing surface, separated from all controls.

```typescript
// src/components/editor/core/EditorCanvas.tsx
import { Editor, EditorContent } from '@tiptap/react';

interface EditorCanvasProps {
  editor: Editor | null;
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ 
  editor, 
  className 
}) => {
  if (!editor) {
    return <div className={className}>Loading editor...</div>;
  }

  return (
    <EditorContent 
      editor={editor} 
      className={cn(
        "prose prose-lg max-w-none",
        "focus:outline-none",
        "min-h-screen p-8",
        className
      )}
    />
  );
};
```

#### Task 6.2: Create EditorLayout Component (2 days)

This **composes** all the extracted pieces.

```typescript
// src/components/editor/core/EditorLayout.tsx
import { EditorCanvas } from './EditorCanvas';
import { FixedToolbar } from '../toolbar/FixedToolbar';
import { AISidebarChat } from '../features/ai';
import { useEditorSetup } from '@/hooks/useEditorSetup';
import { useEditorUIStore } from '@/stores/editorUIStore';

interface EditorLayoutProps {
  documentId: string;
  initialContent: string;
  onSave: (content: string) => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  documentId,
  initialContent,
  onSave,
}) => {
  const { isSidebarOpen, toggleSidebar } = useEditorUIStore();
  
  const editor = useEditorSetup({
    content: initialContent,
    onUpdate: onSave,
  });

  return (
    <div className="flex h-screen">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <FixedToolbar editor={editor} />
        <EditorCanvas editor={editor} />
      </div>

      {/* AI Sidebar */}
      <AISidebarChat
        editor={editor}
        documentContent={editor?.getHTML() ?? ''}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
    </div>
  );
};
```

#### Task 6.3: Feature Flag Switch (1 day)

```typescript
// In pages/Editor.tsx or wherever WYSIWYGEditor is used
const USE_NEW_EDITOR_LAYOUT = false; // Start false

return USE_NEW_EDITOR_LAYOUT ? (
  <EditorLayout
    documentId={documentId}
    initialContent={content}
    onSave={handleSave}
  />
) : (
  <WYSIWYGEditor {...props} />
);
```

**Test for 2 days with flag = true.**

#### Task 6.4: Integration Testing - The Mindmap Flow (1 day)

**CRITICAL: Test the mode switching before deleting anything.**

```bash
# Manual Test Checklist
1. Create new document in editor ✅
2. Write some markdown with headings ✅
3. Click "Mindmap" button ✅
4. Choose "Quick Insert" → verify mermaid inserted ✅
5. Click "Mindmap" button again ✅
6. Choose "AI Generate" → verify AI generates diagram ✅
7. Click "Mindmap" button again ✅
8. Choose "Open Studio" ✅
9. Verify: MindmapStudio2 opens with document data ✅
10. Make changes in mindmap ✅
11. Export to editor ✅
12. Return to editor (back button or URL) ✅
13. Verify: Changes persisted ✅
14. Try AI sidebar in editor ✅
15. Switch to mindmap again ✅
16. Try AI tools in mindmap ✅
17. Verify: Credits tracked correctly ✅
```

**Automated Test:**
```typescript
// src/__tests__/integration/editor-mindmap-integration.test.tsx
describe('Editor → Mindmap Integration (Post-Refactor)', () => {
  it('should maintain data flow after refactoring', async () => {
    // This test verifies the refactored editor still works with mindmap
  });
});
```

**IF ANY TEST FAILS: STOP. DO NOT DELETE OLD CODE.**

#### Task 6.5: The Great Deletion (1 day)

**Only after:**
1. ✅ EditorLayout has 100% feature parity
2. ✅ All tests pass (including mindmap integration)
3. ✅ Mindmap button works perfectly
4. ✅ Mode switching works perfectly
5. ✅ 1 week of successful production use
6. ✅ Error rates ≤ old system
7. ✅ Team/user approval

**Then delete:**
- ❌ `WYSIWYGEditor.tsx` (2813 lines → 0 lines)
- ❌ `AISidebarChat.tsx` (old V1)
- ❌ `FloatingSideToolbar.tsx` (if merged into new toolbar)
- ❌ Any other deprecated files

**Success Criteria:**
- [ ] Old editor deleted
- [ ] All features work in new architecture
- [ ] **Mindmap integration still works flawlessly**
- [ ] Performance improved (or at least not degraded)
- [ ] Bundle size reduced
- [ ] Team can navigate codebase faster

---

## Part 3: Testing Strategy

### 3.1 Test Before Refactoring

**Current test files:**
- `src/__tests__/editor/lists.test.ts`
- `src/__tests__/editor/tables.test.ts`

**Add before any refactoring:**

```typescript
// src/__tests__/editor/toolbar.test.tsx
describe('Toolbar', () => {
  it('should toggle bold', () => {
    // Test that bold toggle works before AND after refactoring
  });
  
  it('should insert table', () => {
    // Test table insertion before AND after
  });
});

// src/__tests__/hooks/useEditorSetup.test.ts
describe('useEditorSetup', () => {
  it('should initialize editor with extensions', () => {});
  it('should call onUpdate when content changes', () => {});
});

// src/__tests__/stores/editorUIStore.test.ts
describe('editorUIStore', () => {
  it('should toggle sidebar', () => {});
  it('should persist state', () => {});
});
```

**Rule:** Every extracted component MUST have tests before merging.

### 3.2 Integration Tests

```typescript
// src/__tests__/integration/editor-workflow.test.tsx
describe('Editor Workflow', () => {
  it('should create, edit, and save document', () => {
    // Full user journey test
  });
  
  it('should use AI to improve content', () => {
    // Test AI sidebar integration
  });
  
  it('should insert and render diagrams', () => {
    // Test diagram feature
  });
});
```

### 3.3 Performance Tests

```typescript
// src/__tests__/performance/editor.perf.test.ts
describe('Editor Performance', () => {
  it('should render large document in < 500ms', () => {
    const largeDocument = generateDocument(10000); // 10k words
    const start = performance.now();
    render(<EditorLayout initialContent={largeDocument} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(500);
  });
});
```

---

## Part 4: Rollback Plans

Every week has a rollback plan:

### Week 1: Zustand Store
**Rollback:** Delete store files, remove imports. Old state management still works.

### Week 2: AI Sidebar V2
**Rollback:** Set `USE_AI_SIDEBAR_V2 = false`. V1 still exists.

### Week 3: Toolbar Extraction
**Rollback:** Set `USE_NEW_TOOLBAR = false`. Old toolbar still in code.

### Week 4: Editor Hook
**Rollback:** Revert to old `useEditor` call. Hook is optional.

### Week 5: Feature Modules
**Rollback:** Git revert to move files back. Imports are the only change.

### Week 6: EditorLayout
**Rollback:** Set `USE_NEW_EDITOR_LAYOUT = false`. WYSIWYGEditor still exists.

**Only after Week 6 is stable do we delete old code.**

---

## Part 5: Success Metrics

### Technical Metrics

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Lines in WYSIWYGEditor | 2,813 | < 500 | LOC counter |
| Bundle size (editor chunk) | ? | -20% | Webpack analyzer |
| Component render time | ? | < 100ms | React DevTools |
| Test coverage | ~30% | > 70% | Vitest coverage |
| Files in `/editor` root | 45 | < 20 | File count |

### User Metrics

| Metric | Target |
|--------|--------|
| AI Sidebar response time | < 2s |
| Editor load time | < 500ms |
| Toolbar interaction latency | < 16ms (60fps) |
| **Mindmap button response** | **< 200ms** |
| **Mode switch time (edit→mindmap)** | **< 1s** |
| **Data persistence (round-trip)** | **100%** |
| User-reported bugs | 0 new bugs |

### Team Metrics

| Metric | Target |
|--------|--------|
| Time to find file | < 10s |
| Time to understand component | < 5min |
| Onboarding new dev | < 1 day |

---

## Part 6: Dos and Don'ts

### ✅ DO

1. **Extract, don't rewrite**
   - Use existing logic, just reorganize it
   - Copy-paste is OK during transition

2. **Keep old code until new code is proven**
   - Minimum 1 week in production
   - Get team/user approval

3. **Use feature flags**
   - Easy rollback
   - Gradual rollout

4. **Test at every step**
   - Unit tests for hooks/stores
   - Integration tests for features
   - Performance tests for critical paths

5. **Measure before and after**
   - Bundle size
   - Render performance
   - Error rates

### ❌ DON'T

1. **Don't refactor for style**
   - Only refactor to solve real problems
   - "It looks ugly" is not a reason

2. **Don't delete until proven**
   - Keep old code until new code is 100% stable
   - Users don't care about "clean" code, they care about working code

3. **Don't refactor everything at once**
   - One feature per week
   - Ship incrementally

4. **Don't break the build**
   - Every commit should compile
   - Every PR should pass CI

5. **Don't ignore feedback**
   - If metrics get worse, revert
   - If users complain, listen

---

## Part 7: After Refactoring

Once WYSIWYGEditor is deleted and EditorLayout is stable, enforce these rules:

### 7.1 File Size Limits

```javascript
// .eslint.rules.js
module.exports = {
  rules: {
    'max-lines': ['error', { max: 400, skipBlankLines: true }],
  },
};
```

Any file > 400 lines must be split.

### 7.2 Folder Structure Rules

```
src/components/editor/
├── core/              # Base editor components (Canvas, Layout)
├── toolbar/           # Toolbar components
├── features/          # Feature modules (ai, diagrams, media)
│   ├── ai/           # Everything AI-related
│   ├── diagrams/     # Everything diagram-related
│   └── media/        # Everything media-related
└── extensions/        # TipTap extensions only
```

**Rule:** No files in root `/editor` folder except index.ts.

### 7.3 Import Rules

```typescript
// ❌ BAD - Reaching across features
import { AISidebarChat } from '../features/ai/AISidebarChat';

// ✅ GOOD - Using barrel export
import { AISidebarChat } from '../features/ai';
```

### 7.4 Documentation Requirements

Every feature module needs:
1. `README.md` explaining what it does
2. `types.ts` for shared types
3. `index.ts` for exports
4. At least one test file

---

## Part 8: Emergency Exit Strategy

If at any point the refactoring is taking too long or causing too many issues:

### Option A: Pause and Ship
1. Commit current progress
2. Set all feature flags to `false` (use old code)
3. Ship what you have
4. Come back to refactoring later

### Option B: Cherry-Pick Wins
1. Identify which refactorings added value
2. Keep those, revert the rest
3. Example: Keep Zustand store + AI sidebar V2, but keep old WYSIWYGEditor

### Option C: Full Revert
1. Git revert to before refactoring started
2. Refactoring was a learning experience
3. Try again later with better plan

**Remember:** It's OK to stop refactoring if it's not working.

---

## Part 9: Phase 2 - Refactoring MindmapStudio2 (Future)

**DO NOT START THIS until editor refactoring is complete and stable.**

MindmapStudio2 is **3,241 lines** - even bigger than WYSIWYGEditor. But refactor the editor first because:

1. **Learn from editor refactoring** - patterns, mistakes, what works
2. **Editor is higher priority** - users spend more time there
3. **Separate concerns** - refactoring both at once is suicide

### When You're Ready (Months from now):

```typescript
// Proposed structure for MindmapStudio2 refactoring
src/components/mindmap/
├── core/
│   ├── MindmapCanvas.tsx         # Main canvas (React Flow)
│   ├── MindmapProvider.tsx       # Context provider
│   └── useMindmapSetup.ts        # Setup hook
├── nodes/
│   ├── MindNode.tsx              # Node component
│   ├── MilestoneNode.tsx         # Milestone node
│   └── Studio2MindNode.tsx       # Studio 2 node
├── features/
│   ├── ai/                       # AI tools
│   ├── export/                   # Export modal
│   └── layout/                   # Layout algorithms
└── MindmapLayout.tsx             # Main layout
```

**But that's for later. Focus on editor now.**

---

## Conclusion: Your Product is Unique - Protect That

This plan gives you a roadmap, but the real lessons are the principles:

1. **Protect The Core Value** - Your dual-mode system is your competitive advantage
2. **Strangler Fig** - Replace gradually, never do big rewrites
3. **Feature Flags** - Every change is reversible
4. **Measure Everything** - Data over opinions
5. **Test The Switching** - Editor ↔ Mindmap must always work
6. **Ship Small** - Weekly increments, not 6-week big bang

**The Goal:**
- Not to have "perfect" code
- Not to follow patterns from books
- But to make the codebase **easier to change** and **faster to understand**
- **AND preserve the editor ↔ mindmap ↔ slides switching magic**

**The Test:**
1. Can a new developer make a change in < 1 day? ✅
2. Does the mindmap button still work? ✅
3. Can users switch modes seamlessly? ✅

If all three are "yes" → refactoring succeeded.
If any are "no" → refactoring failed, regardless of how "clean" the code is.

---

## Your Product's Unique Position

Most note-taking apps are either:
- **Linear**: Notion, Obsidian, Roam (great for writing, bad for visual thinking)
- **Visual**: Miro, Mural, FigJam (great for brainstorming, bad for documentation)

**You're BOTH.**

Users can:
- **Write** documentation in Markdown
- **Visualize** it as a mindmap with one click
- **Edit** the mindmap visually
- **Return** to Markdown - changes sync

**This is your moat. Don't break it while refactoring.**

---

## Appendix: Comparison with Original Plan

| Original Plan | This Plan |
|---------------|-----------|
| Delete WYSIWYGEditor immediately | Keep it until replacement proven |
| Create folder structure | Fill existing folders properly |
| Delete AISidebarChat | Merge V1 + V2, then deprecate |
| Big bang refactoring | Incremental, feature-flagged |
| No rollback plan | Rollback at every step |
| 4 vague steps | 24 concrete tasks with time estimates |
| No success metrics | Clear metrics and measurement |
| Hope it works | Test-driven, data-driven |

**Original plan:** 50% chance of failure
**This plan:** 90% chance of success

---

**Next Steps:**
1. Read this plan
2. Decide: Do we commit to 6 weeks of refactoring?
3. If yes → Start Week 1
4. If no → Keep original plan as "vision doc", implement incrementally as time allows

**Remember:** No refactoring is better than failed refactoring.


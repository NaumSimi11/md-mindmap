# 🤖 AI-First Landing Page - Design Spec

> **Inspiration**: Bolt.new, Lovable, v0.dev
> **Goal**: User lands, describes their need, AI generates a complete document/mindmap/presentation

---

## 🎯 Design Philosophy

### **Bolt.new Approach:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         "Describe your project..."          │
│    ┌───────────────────────────────────┐   │
│    │ [Large prompt textarea]           │   │
│    │                                   │   │
│    └───────────────────────────────────┘   │
│              [✨ Generate]                  │
│                                             │
└─────────────────────────────────────────────┘
```

### **Lovable Approach:**
```
┌─────────────────────────────────────────────┐
│    "What would you like to create today?"   │
│                                             │
│    ┌─────────────────────────────────┐     │
│    │ AI generates as you type...     │     │
│    └─────────────────────────────────┘     │
│                                             │
│    [Document] [Mindmap] [Presentation]      │
└─────────────────────────────────────────────┘
```

---

## 🎨 Our Landing Page Design

### **Hero Section:**

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│               🧠 [App Logo/Name]                       │
│                                                        │
│      The AI-Native Office Suite for Thinking,         │
│             Planning, and Presenting                   │
│                                                        │
│   ┌────────────────────────────────────────────┐      │
│   │ "Describe what you want to create..."      │      │
│   │                                            │      │
│   │ Examples:                                  │      │
│   │ • "Create a project roadmap for Q1 2025"  │      │
│   │ • "Write meeting notes with action items" │      │
│   │ • "Build a pitch deck for my startup"     │      │
│   └────────────────────────────────────────────┘      │
│                                                        │
│   [🎨 Document] [🧠 Mindmap] [📊 Presentation]        │
│                                                        │
│              ✨ 3 free generations daily               │
│                  No signup required                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### **Key Features:**

1. **Big Prompt Box** (center stage)
   - Placeholder: "Describe what you want to create..."
   - Auto-expanding textarea
   - Character count: "0 / 500"
   - AI suggestions as you type

2. **Quick Action Buttons**
   - 📄 Document (markdown editor)
   - 🧠 Mindmap (studio2)
   - 📊 Presentation (slides)
   - Each shows preview on hover

3. **Example Prompts** (clickable)
   - "Project roadmap for Q1 2025"
   - "Meeting notes with action items"
   - "Pitch deck for AI startup"
   - "Research paper outline"
   - "Marketing campaign plan"

4. **Guest Credits Banner**
   - "✨ 3 free AI generations today"
   - "Sign up for unlimited"
   - Progress bar showing credits used

---

## 🔄 User Flow

### **New User (No Login):**

```
User lands on homepage
  ↓
Sees big prompt: "Describe what you want..."
  ↓
Types: "Create a project roadmap for my app launch"
  ↓
Chooses: [🧠 Mindmap]
  ↓
AI generates mindmap with:
  - Timeline nodes
  - Task breakdown
  - Dependencies
  - PM fields (dates, status)
  ↓
Opens in Studio2 (fully interactive)
  ↓
User edits, adds nodes, uses AI chat
  ↓
Saves to localStorage (guest session)
  ↓
Banner: "Sign up to save permanently & collaborate"
```

### **Returning User (Logged In):**

```
User lands on homepage
  ↓
Sees: "Welcome back, [Name]!"
  ↓
Options:
  - Continue last session
  - Open workspace (sidebar with folders)
  - Start new AI creation
  ↓
Can switch between:
  - Local Mode (offline, Tauri file system)
  - Cloud Mode (sync, collaboration)
```

---

## 🎨 Visual Design Elements

### **Color Scheme:**
- Primary: Purple (#8B5CF6) - AI/Magic
- Secondary: Blue (#3B82F6) - Professional
- Accent: Pink (#EC4899) - Creative
- Background: Dark gradient (#0F172A → #1E293B)

### **Typography:**
- Heading: Inter Bold, 48px
- Body: Inter Regular, 16px
- Monospace: JetBrains Mono (code blocks)

### **Animation:**
- Gradient text shimmer (AI theme)
- Smooth transitions (300ms ease)
- Hover effects on cards
- Loading states with skeleton screens

---

## 🛠️ Technical Implementation

### **Components:**

```typescript
// New Landing Page
src/pages/AILandingPage.tsx

// Components
src/components/landing/
├── HeroSection.tsx        // Main prompt area
├── QuickActionCards.tsx   // Document/Mindmap/Presentation
├── ExamplePrompts.tsx     // Clickable examples
├── GuestCreditsBar.tsx    // Free tier tracking
├── FeatureShowcase.tsx    // Scroll section
└── CTASection.tsx         // Sign up prompt
```

### **AI Generation Flow:**

```typescript
// User types prompt + chooses type
const handleGenerate = async (prompt: string, type: 'markdown' | 'mindmap' | 'presentation') => {
  // Check guest credits
  if (!checkGuestCredits()) {
    showUpgradeModal();
    return;
  }
  
  // Generate with AI
  const content = await aiService.generateFromPrompt(prompt, type);
  
  // Save to temporary session
  const tempDoc = {
    id: `temp-${Date.now()}`,
    type,
    content,
    isGuest: true,
  };
  
  // Navigate to appropriate editor
  switch (type) {
    case 'markdown':
      navigate('/dashboard/editor', { state: { tempDoc } });
      break;
    case 'mindmap':
      navigate('/dashboard/mindmaps/studio2', { state: { tempDoc } });
      break;
    case 'presentation':
      navigate(`/presentation/${tempDoc.id}/edit`, { state: { tempDoc } });
      break;
  }
  
  // Decrement guest credits
  decrementGuestCredits();
};
```

---

## 🗂️ Storage Architecture (Hybrid)

### **Guest Mode (No Login):**
```typescript
// localStorage (temporary)
{
  "guest-session-id": "abc123",
  "guest-credits": 2, // 3 free, 1 used
  "guest-documents": [
    { id: "temp-1", type: "markdown", content: "..." },
    { id: "temp-2", type: "mindmap", content: "..." }
  ]
}
```

### **Local Mode (Tauri Desktop):**
```typescript
// File system (persistent, offline)
~/Documents/AppName/
├── Workspaces/
│   ├── My Workspace/
│   │   ├── Projects/
│   │   │   ├── roadmap.json (mindmap)
│   │   │   └── notes.md (document)
│   │   └── workspace.json (metadata)
```

### **Cloud Mode (Future - Backend):**
```typescript
// PostgreSQL + S3
{
  user_id: "uuid",
  workspaces: [
    {
      id: "ws-1",
      name: "My Workspace",
      storage: "cloud",
      documents: [...],
      shared_with: ["user2", "user3"],
      sync_status: "synced"
    }
  ]
}
```

---

## 🔄 Migration Path (Safe!)

### **Current State (Preserve):**
- Editor: localStorage `editor-content`
- Studio2: localStorage `mindmap-session-*`
- Presentation: localStorage `presentation-*`

### **New Addition (Non-Breaking):**
```typescript
// Detect storage mode
const storageMode = detectStorageMode();
// Options: 'guest', 'local', 'cloud'

if (storageMode === 'guest') {
  // Use temporary localStorage (current behavior)
} else if (storageMode === 'local') {
  // Use Tauri file system API
  await invoke('save_document', { path, content });
} else if (storageMode === 'cloud') {
  // Use backend API
  await api.saveDocument({ workspaceId, documentId, content });
}
```

### **Migration Strategy:**
```typescript
// Offer to import existing localStorage docs
const migrateToWorkspace = async () => {
  const existingDocs = getLocalStorageDocs();
  
  if (existingDocs.length > 0) {
    // Show modal: "Import 5 existing documents to workspace?"
    const confirmed = await showImportModal(existingDocs);
    
    if (confirmed) {
      // Create workspace
      const workspace = workspaceService.createWorkspace('My Workspace');
      
      // Import docs
      existingDocs.forEach(doc => {
        workspaceService.createDocument(doc.type, doc.title, doc.content);
      });
      
      // Keep original localStorage as backup
      // (Don't delete until user explicitly confirms)
    }
  }
};
```

---

## 🎯 Implementation Priority

### **Phase 1: AI-First Landing (Week 1)**
1. Create `AILandingPage.tsx`
2. Build prompt input + AI generation
3. Quick action cards (Document/Mindmap/Presentation)
4. Guest credits system
5. Route to existing editors with temp data

### **Phase 2: Workspace Integration (Week 2)**
1. Add workspace sidebar (optional toggle in AppLayout)
2. "Save to Workspace" button in editors
3. Import localStorage docs (one-time migration)
4. Test end-to-end flow

### **Phase 3: Tauri Desktop (Week 3)**
1. Implement file system storage
2. Native file picker
3. Local folder sync
4. Offline mode indicator

### **Phase 4: Cloud Mode (Week 4+)**
1. Backend API (Node.js + PostgreSQL)
2. User auth (Clerk or Supabase)
3. Real-time sync
4. Collaboration features

---

## ✅ Success Metrics

1. **Landing Page**:
   - Time to first generation: <30 seconds
   - Guest conversion rate: >20% sign up after 3 credits

2. **Workspace**:
   - 0% loss of existing localStorage data
   - Seamless mode switching (local ↔ cloud)

3. **Desktop (Tauri)**:
   - Works 100% offline
   - File operations <100ms
   - Cross-platform compatibility

---

## 🚀 Next Steps

**OPTION A: AI-First Landing** (2-3 days)
- Build the bolt.new style landing
- Immediate user value
- Sets tone for "AI-native"

**OPTION B: Safe Workspace Integration** (2-3 days)
- Add workspace as optional feature
- Non-breaking migration
- Preserves all existing work

**OPTION C: Both in Parallel** (1 week)
- Landing page (frontend dev)
- Workspace integration (architecture dev)
- Ship together

---

**Which path do you want to take?** 🤔


# 🗺️ User Flow Design - Complete Navigation

> **Goal**: Clear, intuitive navigation for guest and authenticated users

---

## 🎯 User Journeys

### **Journey 1: Guest User (First Time)**

```
┌─────────────────────────────────────────────────────────┐
│                   LANDING PAGE (/)                      │
│                                                         │
│  🎨 Hero: "Transform Ideas into Action"                │
│                                                         │
│  Two paths:                                            │
│  ┌─────────────────┐    ┌─────────────────┐          │
│  │  Generate AI    │    │  Start Working  │          │
│  │  (AI prompt)    │    │  (Manual start) │          │
│  └────────┬────────┘    └────────┬────────┘          │
└───────────┼──────────────────────┼──────────────────────┘
            │                      │
            v                      v
    ┌───────────────┐      ┌──────────────────┐
    │ AI Generated  │      │  Guest Dashboard │
    │ Content       │      │  (/guest)        │
    │ → Open Editor │      └────────┬─────────┘
    └───────────────┘               │
                                    v
                    ┌───────────────────────────────┐
                    │  Choose Action:               │
                    │  • Blank Document → Editor    │
                    │  • Blank Mindmap → Studio2    │
                    │  • Blank Presentation → Pres  │
                    │  • Browse Templates           │
                    └───────────────────────────────┘
```

### **Journey 2: Returning Guest User**

```
User opens app
  ↓
Landing Page (/)
  ↓
Shows banner: "You have 2 documents in progress"
  ↓
Options:
  ├─ Continue last document
  ├─ View all documents (Guest Dashboard)
  └─ Generate new with AI
```

### **Journey 3: Signed In User**

```
┌─────────────────────────────────────────────────────────┐
│                   LANDING PAGE (/)                      │
│                                                         │
│  Detects user is signed in                             │
│  → Auto-redirects to /dashboard                        │
└───────────────────────────┬─────────────────────────────┘
                            v
┌─────────────────────────────────────────────────────────┐
│              WORKSPACE DASHBOARD (/dashboard)           │
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐│
│  │  Sidebar     │  │  Main Area                      ││
│  │              │  │                                 ││
│  │  📁 Folders  │  │  🎨 AI Generation Card         ││
│  │  📄 Docs     │  │  (Prompt box like landing)      ││
│  │  ⭐ Starred  │  │                                 ││
│  │  🕐 Recent   │  │  📊 Quick Actions               ││
│  │              │  │  • New Document                 ││
│  │  [+ New]     │  │  • New Mindmap                  ││
│  │              │  │  • New Presentation             ││
│  │              │  │                                 ││
│  │              │  │  📁 Recent Documents            ││
│  │              │  │  (List of last 5 docs)          ││
│  └──────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Route Structure

### **Public Routes (No Auth Required)**

```typescript
Route: "/"
Component: AILandingPage
Purpose: Marketing + AI generation for guests
Actions:
  - Generate with AI → Create temp doc → Redirect to editor
  - "Start Working" button → /guest
  - "Sign In" → /auth/signin

Route: "/guest"
Component: GuestDashboard
Purpose: Simple workspace for unauthenticated users
Shows:
  - Recent guest documents (from localStorage)
  - Quick actions (Blank doc/mindmap/presentation)
  - Template browser
  - "Sign up to save permanently" banner

Route: "/dashboard/editor"
Component: Editor
Purpose: Markdown editor (works for guest + auth)

Route: "/dashboard/mindmaps/studio2"
Component: MindmapStudio2
Purpose: Interactive mindmap (works for guest + auth)

Route: "/presentation/:id/edit"
Component: PresentationEditor
Purpose: Presentation editor (works for guest + auth)
```

### **Authenticated Routes (Requires Login)**

```typescript
Route: "/dashboard"
Component: WorkspaceDashboard (NEW!)
Purpose: Main workspace with folders, AI generation, recent docs
Protected: Yes
Features:
  - Workspace sidebar (folders, documents)
  - AI generation area (like landing page)
  - Recent documents
  - Quick actions
  - Settings

Route: "/dashboard/workspace"
Component: WorkspaceDashboard (same as above)
Purpose: Explicit workspace view
```

---

## 🔄 Navigation Logic

### **Landing Page Behavior:**

```typescript
// src/pages/AILandingPage.tsx

useEffect(() => {
  // Check if user is authenticated
  const isAuthenticated = checkAuth(); // localStorage['auth-token']
  
  if (isAuthenticated) {
    // Redirect to workspace
    navigate('/dashboard');
  }
}, []);
```

### **Header Navigation:**

```typescript
// Navigation depends on auth state

Guest User Header:
  [Logo] [Features] [Pricing] [Sign In] [Get Started]

Authenticated User Header:
  [Logo] [Cmd+K Search] [Notifications] [Profile] [Settings]
```

---

## 📋 Components to Build

### **1. GuestDashboard Component** (NEW)

```typescript
// src/pages/GuestDashboard.tsx

Purpose: Simple dashboard for guest users
Features:
  - Recent documents from localStorage
  - Quick actions (Blank doc/mindmap/presentation)
  - Template browser button
  - "Sign up to save" banner
  - Credit counter (X free generations left)

Layout:
  ┌─────────────────────────────────────────┐
  │  ⚠️ Sign up to save permanently         │
  │  ✨ 2 free AI generations left          │
  └─────────────────────────────────────────┘
  
  Quick Actions:
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ 📄       │ │ 🧠       │ │ 📊       │
  │ Document │ │ Mindmap  │ │ Slides   │
  └──────────┘ └──────────┘ └──────────┘
  
  Recent Documents:
  📄 Untitled Document (2 min ago)
  🧠 Project Roadmap (1 hour ago)
```

### **2. WorkspaceDashboard Component** (NEW)

```typescript
// src/pages/WorkspaceDashboard.tsx

Purpose: Main workspace for authenticated users
Features:
  - Workspace sidebar (from existing component)
  - AI generation area (embedded from landing)
  - Recent documents grid
  - Quick actions
  - Stats (X documents, Y folders)

Layout:
  ┌─────┬──────────────────────────────────┐
  │     │  🎨 Generate with AI             │
  │  S  │  [Large prompt box]              │
  │  I  │  [Document] [Mindmap] [Slides]   │
  │  D  │                                  │
  │  E  │  📁 Recent Documents             │
  │  B  │  ┌────┬────┬────┬────┐          │
  │  A  │  │ 📄 │ 🧠 │ 📊 │ 📄 │          │
  │  R  │  └────┴────┴────┴────┘          │
  └─────┴──────────────────────────────────┘
```

---

## 🎨 Updated Landing Page

### **Add "Start Working" Button:**

```typescript
// Below the "Generate with AI" section

<div className="text-center mt-8">
  <div className="inline-flex items-center gap-4">
    <Button
      size="lg"
      variant="outline"
      onClick={() => navigate('/guest')}
      className="border-slate-600 hover:bg-slate-800 text-white"
    >
      Skip AI, Start Working →
    </Button>
    <span className="text-sm text-slate-400">
      Or browse templates manually
    </span>
  </div>
</div>
```

---

## 🔐 Authentication Flow

### **Sign Up Journey:**

```
User clicks "Get Started"
  ↓
/auth/signup
  ↓
Email + Password form
  ↓
Success → Create workspace
  ↓
Migrate guest docs (if any) → Workspace
  ↓
Redirect to /dashboard
```

### **Sign In Journey:**

```
User clicks "Sign In"
  ↓
/auth/signin
  ↓
Email + Password form
  ↓
Success → Load user's workspace
  ↓
Redirect to /dashboard
```

---

## 🚀 Implementation Priority

### **Phase 1: Fix Navigation (Today)**
1. ✅ Add "Start Working" button to landing page
2. ⏳ Create GuestDashboard component
3. ⏳ Update routing logic
4. ⏳ Test guest flow

### **Phase 2: Workspace Dashboard (Tomorrow)**
1. ⏳ Create WorkspaceDashboard component
2. ⏳ Integrate WorkspaceSidebar
3. ⏳ Add AI generation area
4. ⏳ Add recent documents grid
5. ⏳ Test authenticated flow

### **Phase 3: Authentication (Next)**
1. ⏳ Add auth pages (signin/signup)
2. ⏳ Implement auth service
3. ⏳ Protected route logic
4. ⏳ Guest → User migration

---

## 📊 User Flow Summary

### **Guest User Flow:**
```
Landing → [Generate AI OR Start Working]
  ├─ AI Path: Prompt → Generate → Editor (with temp doc)
  └─ Manual Path: Guest Dashboard → Choose action → Editor (blank)
```

### **Signed In User Flow:**
```
Landing → Auto-redirect → Workspace Dashboard
  ↓
Workspace shows:
  - Sidebar (folders, documents)
  - AI generation (embedded)
  - Recent docs
  - Quick actions
```

### **Navigation is ALWAYS available:**
- Cmd+K: Quick switcher (search all docs)
- Header: Logo (home), Profile, Settings
- Sidebar: Navigate workspace

---

**Does this flow make sense now?** 🤔

Let me know if you want me to:
1. **Build GuestDashboard** (simple dashboard for guests)
2. **Add "Start Working" button** to landing page
3. **Build WorkspaceDashboard** (full workspace for auth users)
4. **Something else?**


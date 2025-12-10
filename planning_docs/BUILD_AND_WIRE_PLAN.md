# 🏗️ **MDReader Build & Wire Plan - Comprehensive Execution Strategy**

**Date**: December 10, 2025  
**Status**: 🔴 **PRE-IMPLEMENTATION ANALYSIS**  
**Purpose**: Detailed, granular plan for building and wiring backend + frontend

---

## 📊 **Executive Summary**

### **Current State** ✅
- **Frontend**: Auth, offline sync, workspace, editor, AI features (existing)
- **Backend**: FastAPI, PostgreSQL, Redis, basic CRUD APIs (existing)
- **Missing**: Hocuspocus, Yjs integration, Guest Mode, Tauri packaging

### **Target State** 🎯
- **Phase 0**: Landing Page + onboarding (Week 1)
- **Phase 1**: Yjs + Hocuspocus real-time (Week 2-3)
- **Phase 2**: Local-first storage modes (Week 4-5)
- **Phase 3**: Guest Mode (Week 6-7)
- **Phase 4**: Tauri Desktop (Week 8-9)

---

## 🔍 **PART 1: CURRENT STATE ANALYSIS**

### **1.1 Frontend - What We Have** ✅

```
frontend/src/
├─ Auth System              ✅ COMPLETE
│  ├─ useAuth.ts            ✅ Login, logout, signup
│  ├─ ProtectedRoute.tsx    ✅ Route protection
│  └─ AuthService.ts        ✅ JWT handling, refresh tokens
│
├─ Offline Sync            ✅ COMPLETE (Custom)
│  ├─ OfflineDatabase.ts    ✅ IndexedDB (Dexie)
│  ├─ SyncManager.ts        ✅ Queue, retry, conflict detection
│  └─ OfflineWorkspaceService.ts ✅ Wrapper for online/offline
│
├─ Workspace System        ✅ COMPLETE
│  ├─ WorkspaceContext.tsx  ✅ Global state
│  ├─ useBackendWorkspace.ts ✅ Workspace CRUD
│  ├─ WorkspaceSidebar.tsx  ✅ Folder tree, docs
│  └─ useBackendFolders.ts  ✅ Folder CRUD, drag-drop
│
├─ Editor System           ✅ COMPLETE
│  ├─ useTipTapEditor.ts    ✅ TipTap initialization
│  ├─ WYSIWYGEditor.tsx     ✅ Main editor component
│  ├─ extensions/           ✅ Custom extensions (comments, inline preview)
│  └─ toolbar/              ✅ Rich toolbar components
│
├─ AI Features             ✅ COMPLETE
│  ├─ AIService.ts          ✅ OpenAI/Anthropic integration
│  ├─ UnifiedAIModal.tsx    ✅ AI assistant UI
│  ├─ DocumentAnalyzer.ts   ✅ Smart analysis
│  └─ PromptTemplates.ts    ✅ Pre-built prompts
│
├─ Mindmap Features        ✅ COMPLETE
│  ├─ MindmapGenerator.ts   ✅ Markdown → mindmap
│  ├─ MindmapEditor.tsx     ✅ Interactive editing
│  └─ markmap integration   ✅ Rendering
│
├─ Landing Page            ✅ COMPLETE
│  ├─ AILandingPage.tsx     ✅ Current landing
│  └─ MDFileDropZone.tsx    ✅ File drop support
│
└─ UI Components          ✅ COMPLETE
   ├─ shadcn/ui             ✅ Component library
   ├─ blocks/               ✅ Content blocks
   └─ modals/               ✅ Modal system
```

**Status**: ✅ **Frontend is 90% complete** for Phase 0

---

### **1.2 Backend - What We Have** ✅

```
backend/
├─ FastAPI Server          ✅ COMPLETE
│  ├─ Port 7001            ✅ Running
│  ├─ Auth endpoints       ✅ /api/v1/auth/*
│  ├─ Workspace endpoints  ✅ /api/v1/workspaces/*
│  ├─ Document endpoints   ✅ /api/v1/documents/*
│  ├─ Folder endpoints     ✅ /api/v1/folders/*
│  └─ File endpoints       ✅ /api/v1/files/*
│
├─ PostgreSQL              ✅ COMPLETE
│  ├─ users table          ✅ Auth data
│  ├─ workspaces table     ✅ Workspace metadata
│  ├─ documents table      ✅ Document metadata (NOT content)
│  ├─ folders table        ✅ Folder hierarchy
│  └─ document_collab_state ⏳ EXISTS (not used yet)
│
├─ Redis                   ✅ COMPLETE
│  ├─ Session storage      ✅ JWT refresh tokens
│  ├─ Cache                ✅ Workspace/folder cache
│  └─ Rate limiting        ✅ API throttling
│
└─ Service Layer          ✅ COMPLETE
   ├─ AuthService.py       ✅ User auth, JWT
   ├─ DocumentService.py   ✅ Document CRUD
   ├─ WorkspaceService.py  ✅ Workspace CRUD
   └─ FolderService.py     ✅ Folder CRUD
```

**Status**: ✅ **Backend is 80% complete** for Phase 0

---

### **1.3 What's MISSING** ❌

```
❌ Hocuspocus Server (Node.js, Port 1234)
   → Real-time collaboration
   → Yjs CRDT sync
   → WebSocket handling

❌ Yjs Integration in Frontend
   → TipTap + Yjs binding
   → HocuspocusProvider connection
   → y-indexeddb persistence

❌ Guest Mode / No-Auth
   → LocalOnly mode (no login)
   → IndexedDB-first storage
   → Optional cloud migration

❌ Tauri Desktop App
   → Desktop packaging
   → File system access
   → Native features

❌ Storage Mode Selector
   → LocalOnly vs HybridSync vs CloudOnly
   → Per-document control
   → UI for switching modes
```

---

## 🎯 **PART 2: ALIGNMENT WITH PLANNING DOCS**

### **2.1 Match with SENIOR_ENGINEERING_PLAN.md**

| Phase | Plan Says | Current Status | Gap |
|-------|-----------|----------------|-----|
| **Phase 0**: Landing Page | Onboarding, file drop, no-login start | ✅ 90% complete | ❌ Guest mode flow |
| **Phase 1**: Collaboration | Yjs, Hocuspocus, real-time | ❌ 0% complete | ❌ Full implementation |
| **Phase 2**: Storage Modes | LocalOnly, HybridSync, CloudOnly | ⚠️ 40% complete | ❌ Mode selector UI |
| **Phase 3**: Guest Mode | No-auth, local storage, optional login | ❌ 0% complete | ❌ Full implementation |
| **Phase 4**: Desktop | Tauri, FS access, native | ❌ 0% complete | ❌ Full implementation |

**Gap Analysis**: We have infrastructure, but missing **Phase 1-4 core features**.

---

### **2.2 Match with COMPREHENSIVE_USE_CASES.md**

| Use Case Category | Current Support | Gap |
|-------------------|-----------------|-----|
| **Installation** (1.1-1.2) | ✅ Web app works | ❌ Tauri desktop install |
| **Local-Only** (2.1-2.3) | ⚠️ Partial (needs guest mode) | ❌ True local-first |
| **Account Creation** (3.1-3.2) | ✅ Works | ❌ Migration flow |
| **Cloud Sync** (4.1-4.3) | ✅ Works (custom sync) | ❌ Yjs sync |
| **Offline/Online** (5.1-5.3) | ✅ Works (custom sync) | ❌ Yjs merge |
| **Collaboration** (6.1-6.3) | ❌ Not implemented | ❌ Hocuspocus, Yjs |
| **AI Features** (7.1-7.2) | ✅ Works | ✅ Complete |

**Gap Analysis**: Core features work, but **collaboration missing**.

---

### **2.3 Match with BACKEND_ARCHITECTURE_BRIEF.md**

| Component | Plan Says | Current State | Action |
|-----------|-----------|---------------|--------|
| **FastAPI** | Metadata, auth | ✅ Complete | ✅ Keep as-is |
| **Hocuspocus** | Content sync | ❌ Not deployed | 🎯 **Deploy in Phase 1** |
| **PostgreSQL** | Both metadata + Yjs | ✅ Metadata works | ⏳ Wire Yjs storage |
| **Redis** | Cache, sessions | ✅ Works | ✅ Keep as-is |

**Action Required**: Deploy Hocuspocus server (Phase 1, Week 2-3).

---

## 🏗️ **PART 3: BUILD PLAN** (Step-by-Step)

### **Phase 0: Landing Page & Onboarding** (Week 1) 🎯 **PRIORITY 1**

**Goal**: Allow users to start working with NO login, then optionally migrate to cloud.

#### **Task 0.1: Landing Page Enhancement** (Day 1-2)

**What to Build**:
```typescript
// frontend/src/pages/LandingPageV3.tsx (new file)

Features:
1. Hero section: "Start Writing Now (No Login Required)"
2. Three entry points:
   - "Start Writing" → Guest mode editor
   - "Open .md File" → File picker → Guest editor
   - "Drop File Here" → Drag-drop → Guest editor
3. AI section: "Configure AI Later"
4. Login/Signup in header (optional)
```

**Why**:
- Use case 1.1 (First-time install) requires instant start
- Use case 2.1 (Create doc without login) requires guest mode
- Reduces friction for new users

**Who Builds**:
- Frontend developer (2 days)
- Designer (1 day for mockups)

**Wire with**:
- Guest Mode context (Task 0.2)
- IndexedDB storage (existing)

**Test**:
- [ ] User clicks "Start Writing" → Editor opens (no login)
- [ ] User drops .md file → Content appears
- [ ] User closes tab → Data persists (IndexedDB)

---

#### **Task 0.2: Guest Mode Context** (Day 2-3)

**What to Build**:
```typescript
// frontend/src/contexts/GuestModeContext.tsx

interface GuestModeContext {
  isGuestMode: boolean;
  guestDocuments: Document[];
  createGuestDocument: (title, content) => Promise<Document>;
  updateGuestDocument: (id, updates) => Promise<void>;
  migrateToCloud: () => Promise<void>;  // For Task 3.1
}

Implementation:
- Store everything in IndexedDB (no backend)
- Generate temp UUIDs (guest-doc-{uuid})
- Provide "Login to Sync" banner
```

**Why**:
- Use case 3.1 (Optional account) requires guest → cloud migration
- Use case 2.1 (Local-only workflow) requires no-auth storage
- Separation of concerns (guest ≠ offline)

**Who Builds**:
- Senior frontend developer (2 days)

**Wire with**:
- IndexedDB (existing OfflineDatabase)
- WorkspaceContext (for migration)
- Landing page (Task 0.1)

**Test**:
- [ ] Guest creates 3 docs → All stored in IndexedDB
- [ ] Guest closes/reopens browser → Docs persist
- [ ] Guest clicks "Login to Sync" → Migration starts

---

#### **Task 0.3: Landing Page Wiring** (Day 3-4)

**What to Wire**:
```typescript
// frontend/src/App.tsx

<Routes>
  <Route path="/" element={<LandingPageV3 />} />
  
  {/* Guest routes (no auth) */}
  <Route path="/guest/editor" element={<GuestEditor />} />
  <Route path="/guest/doc/:id" element={<GuestEditor />} />
  
  {/* Authenticated routes */}
  <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
</Routes>

// Wrap with GuestModeProvider
<GuestModeProvider>
  <WorkspaceProvider>
    <Routes>...</Routes>
  </WorkspaceProvider>
</GuestModeProvider>
```

**Why**:
- Clear separation: Guest vs Authenticated
- Use case 1.1 (First install) → Guest mode
- Use case 3.1 (Login later) → Migration

**Who Builds**:
- Frontend developer (1 day)

**Wire with**:
- GuestModeContext (Task 0.2)
- LandingPageV3 (Task 0.1)
- Existing WorkspaceContext

**Test**:
- [ ] User visits `/` → Landing page
- [ ] User clicks "Start Writing" → `/guest/editor`
- [ ] User clicks "Login" → `/login` → `/workspace`

---

### **Phase 1: Real-Time Collaboration** (Week 2-3) 🎯 **PRIORITY 2**

**Goal**: Deploy Hocuspocus server, integrate Yjs for real-time document sync.

#### **Task 1.1: Hocuspocus Server Setup** (Day 1-3)

**What to Build**:
```bash
# New directory
mdreader-main/
├─ backend/           # Existing FastAPI
├─ frontend/          # Existing React
└─ hocuspocus-server/ # NEW (Node.js)
   ├─ package.json
   ├─ index.ts        # Main server
   ├─ auth.ts         # JWT verification
   ├─ persistence.ts  # PostgreSQL connection
   └─ Dockerfile
```

**Code**:
```typescript
// hocuspocus-server/index.ts

import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import { verifyJWT } from './auth';
import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: 'mdreader',
  user: 'mdreader',
  password: process.env.POSTGRES_PASSWORD,
});

const server = Server.configure({
  port: 1234,
  
  async onAuthenticate(data) {
    const { token } = data;
    
    // Verify JWT with FastAPI
    const user = await verifyJWT(token);
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    return {
      user: {
        id: user.id,
        name: user.username || user.email,
      }
    };
  },
  
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        // Load Yjs state from PostgreSQL
        const result = await pool.query(
          'SELECT yjs_state FROM document_collab_state WHERE document_name = $1',
          [documentName]
        );
        
        if (result.rows.length === 0) {
          return null; // New document
        }
        
        return Buffer.from(result.rows[0].yjs_state);
      },
      
      store: async ({ documentName, state }) => {
        // Save Yjs state to PostgreSQL
        await pool.query(
          `INSERT INTO document_collab_state (document_name, yjs_state, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (document_name)
           DO UPDATE SET yjs_state = $2, updated_at = NOW()`,
          [documentName, state]
        );
      },
    }),
  ],
});

server.listen();
console.log('🚀 Hocuspocus server running on ws://localhost:1234');
```

**Why**:
- Use case 6.2 (Real-time collaboration) requires Hocuspocus
- Architecture requires separation: FastAPI (metadata) + Hocuspocus (content)
- Yjs CRDT enables conflict-free merging

**Who Builds**:
- Senior backend developer (3 days)
- DevOps (1 day for deployment)

**Wire with**:
- PostgreSQL (`document_collab_state` table)
- FastAPI (for JWT verification via HTTP)
- Redis (optional, for presence tracking)

**Test**:
- [ ] `npm run dev` → Server starts on port 1234
- [ ] Connect with valid JWT → Success
- [ ] Connect without JWT → 401 Unauthorized
- [ ] Save document → Stored in `document_collab_state`

---

#### **Task 1.2: Frontend Yjs Integration** (Day 4-6)

**What to Build**:
```typescript
// frontend/src/hooks/useYjsDocument.ts

import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';

export function useYjsDocument(documentId: string, token: string) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  
  useEffect(() => {
    // 1. IndexedDB persistence (offline)
    const indexeddbProvider = new IndexeddbPersistence(`doc-${documentId}`, ydoc);
    
    // 2. Hocuspocus provider (online)
    const hocuspocusProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: `doc:${documentId}`,
      document: ydoc,
      token,
      
      onSynced: () => {
        console.log('✅ Document synced with Hocuspocus');
        setIsSynced(true);
      },
      
      onDisconnect: () => {
        console.log('📴 Disconnected from Hocuspocus');
        setIsSynced(false);
      },
    });
    
    setProvider(hocuspocusProvider);
    
    return () => {
      hocuspocusProvider.destroy();
      indexeddbProvider.destroy();
    };
  }, [documentId, token]);
  
  return { ydoc, provider, isSynced };
}
```

**Why**:
- Use case 5.2 (Edit on 2 devices offline) requires Yjs CRDT
- Use case 6.2 (Real-time collaboration) requires HocuspocusProvider
- y-indexeddb enables offline persistence

**Who Builds**:
- Senior frontend developer (3 days)

**Wire with**:
- TipTap editor (Task 1.3)
- Hocuspocus server (Task 1.1)
- IndexedDB (existing)

**Test**:
- [ ] Open document → Yjs doc loaded from IndexedDB
- [ ] Go online → Connects to Hocuspocus
- [ ] Edit content → Syncs to Hocuspocus (< 100ms)
- [ ] Go offline → Edits saved to IndexedDB

---

#### **Task 1.3: TipTap + Yjs Binding** (Day 6-7)

**What to Build**:
```typescript
// frontend/src/hooks/useTipTapEditor.ts

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useYjsDocument } from './useYjsDocument';

export function useTipTapEditor(documentId: string) {
  const { ydoc, provider, isSynced } = useYjsDocument(documentId, token);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs handles history
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: currentUser.name,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      }),
      // ... other extensions
    ],
  });
  
  return { editor, isSynced };
}
```

**Why**:
- Use case 6.2 (Real-time collaboration) requires TipTap + Yjs binding
- `Collaboration` extension syncs content
- `CollaborationCursor` shows other users' cursors

**Who Builds**:
- Senior frontend developer (2 days)

**Wire with**:
- useYjsDocument (Task 1.2)
- Existing TipTap setup
- WYSIWYGEditor component

**Test**:
- [ ] Two users open same doc → Both see content
- [ ] User A types → User B sees changes (< 100ms)
- [ ] User A cursor → User B sees cursor position
- [ ] Go offline → Edits saved locally, sync on reconnect

---

### **Phase 2: Storage Modes** (Week 4-5) 🎯 **PRIORITY 3**

**Goal**: Allow users to choose per-document storage mode (LocalOnly, HybridSync, CloudOnly).

#### **Task 2.1: Storage Mode Selector UI** (Day 1-2)

**What to Build**:
```typescript
// frontend/src/components/workspace/StorageModeSelector.tsx

export function StorageModeSelector({ documentId, currentMode, onModeChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost">
          {currentMode === 'LocalOnly' && '📁 Local Only'}
          {currentMode === 'HybridSync' && '☁️ Synced'}
          {currentMode === 'CloudOnly' && '☁️ Cloud Only'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onModeChange('LocalOnly')}>
          <FileIcon />
          <div>
            <div>Local Only</div>
            <div className="text-xs">Never syncs to cloud</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onModeChange('HybridSync')}>
          <CloudIcon />
          <div>
            <div>Hybrid Sync</div>
            <div className="text-xs">Local + cloud backup</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onModeChange('CloudOnly')}>
          <CloudIcon />
          <div>
            <div>Cloud Only</div>
            <div className="text-xs">Stream from cloud</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Why**:
- Use case 4.2 (Sync existing local file) requires mode selector
- Use case 4.3 (Create document while online) requires mode choice
- Users need control over data location

**Who Builds**:
- Frontend developer (2 days)

**Wire with**:
- Document metadata (new `storage_mode` field)
- Backend API (Task 2.2)
- WorkspaceContext

**Test**:
- [ ] User clicks dropdown → 3 modes shown
- [ ] User selects "Local Only" → Saved to metadata
- [ ] User switches to "Hybrid Sync" → Starts sync

---

#### **Task 2.2: Backend Storage Mode Support** (Day 2-3)

**What to Build**:
```python
# backend/app/models/document.py

class Document(Base):
    # ... existing fields
    storage_mode = Column(Enum('LocalOnly', 'HybridSync', 'CloudOnly'), default='HybridSync')
```

```python
# backend/app/routers/documents.py

@router.patch("/{document_id}/storage-mode")
async def change_storage_mode(
    document_id: str,
    mode: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change document storage mode
    
    LocalOnly:   Never syncs to cloud (metadata only)
    HybridSync:  Local + cloud (default)
    CloudOnly:   Stream from cloud (no local persistence)
    """
    document = DocumentService.get_document_by_id(db, UUID(document_id), current_user.id)
    if not document:
        raise HTTPException(404, "Document not found")
    
    # If switching to LocalOnly, delete cloud content
    if mode == 'LocalOnly':
        # Keep metadata, delete Yjs state
        db.execute(
            "DELETE FROM document_collab_state WHERE document_name = :name",
            {"name": f"doc:{document_id}"}
        )
    
    document.storage_mode = mode
    db.commit()
    
    return {"storage_mode": mode}
```

**Why**:
- Use case 4.2 (Sync control) requires backend awareness of mode
- Backend needs to respect mode (e.g., don't sync LocalOnly docs)
- Enables "Delete cloud copy" action

**Who Builds**:
- Backend developer (2 days)

**Wire with**:
- Frontend storage mode selector (Task 2.1)
- Hocuspocus (for CloudOnly streaming)
- Document model

**Test**:
- [ ] PATCH `/documents/{id}/storage-mode` → Mode updated
- [ ] Mode = "LocalOnly" → Yjs state deleted
- [ ] Mode = "CloudOnly" → IndexedDB not used

---

### **Phase 3: Guest Mode Migration** (Week 6-7) 🎯 **PRIORITY 4**

**Goal**: Allow guest users to migrate their local documents to cloud after signing up.

#### **Task 3.1: Migration Flow** (Day 1-3)

**What to Build**:
```typescript
// frontend/src/services/workspace/GuestMigrationService.ts

export class GuestMigrationService {
  async migrateToCloud(userId: string, token: string): Promise<MigrationResult> {
    // 1. Get all guest documents from IndexedDB
    const guestDocs = await offlineDB.documents
      .where('id').startsWith('guest-doc-')
      .toArray();
    
    console.log(`📦 Found ${guestDocs.length} guest documents to migrate`);
    
    // 2. Create workspace for user
    const workspace = await apiWorkspace.createWorkspace({
      name: 'My Workspace',
      description: 'Migrated from guest mode',
    });
    
    console.log(`✅ Created workspace: ${workspace.id}`);
    
    // 3. Upload each document
    const results = [];
    for (const doc of guestDocs) {
      try {
        // Create document on backend
        const newDoc = await apiDocument.createDocument({
          workspace_id: workspace.id,
          title: doc.title,
          content: doc.content,
          content_type: 'markdown',
        });
        
        // Delete guest document from IndexedDB
        await offlineDB.documents.delete(doc.id);
        
        // Add migrated document to IndexedDB (with real ID)
        await offlineDB.documents.put({
          ...doc,
          id: newDoc.id,
          workspaceId: workspace.id,
          pending_changes: false,
          last_synced: new Date().toISOString(),
        });
        
        results.push({ success: true, oldId: doc.id, newId: newDoc.id });
        console.log(`✅ Migrated: ${doc.title} (${doc.id} → ${newDoc.id})`);
      } catch (err) {
        console.error(`❌ Failed to migrate ${doc.id}:`, err);
        results.push({ success: false, oldId: doc.id, error: err.message });
      }
    }
    
    return {
      workspace,
      totalDocs: guestDocs.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }
}
```

**Why**:
- Use case 3.1 (Sign up after guest mode) requires migration
- Users shouldn't lose work when creating account
- Seamless transition from guest → authenticated

**Who Builds**:
- Senior frontend developer (3 days)

**Wire with**:
- GuestModeContext (Phase 0)
- WorkspaceContext (existing)
- Backend workspace/document APIs

**Test**:
- [ ] Guest creates 5 docs → All in IndexedDB
- [ ] Guest signs up → Migration dialog appears
- [ ] User confirms → All docs migrated to cloud
- [ ] Guest docs deleted → Cloud docs appear in workspace

---

### **Phase 4: Tauri Desktop** (Week 8-9) 🎯 **PRIORITY 5**

**Goal**: Package as desktop app with file system access.

#### **Task 4.1: Tauri Setup** (Day 1-2)

**What to Build**:
```bash
# Install Tauri
npm install --save-dev @tauri-apps/cli

# Initialize Tauri
npm run tauri init

# Configure src-tauri/tauri.conf.json
```

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "MDReader",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true,
        "readDir": true
      },
      "dialog": {
        "all": true,
        "open": true,
        "save": true
      }
    },
    "windows": [
      {
        "title": "MDReader",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

**Why**:
- Use case 1.1 (Desktop install) requires Tauri packaging
- Use case 2.1 (Open .md file from laptop) requires FS access
- Native app feels more professional

**Who Builds**:
- Desktop developer (2 days)

**Wire with**:
- Frontend (existing)
- Native file system
- OS integration

**Test**:
- [ ] `npm run tauri dev` → Desktop app opens
- [ ] File → Open → Native file picker appears
- [ ] Select .md file → Content loads
- [ ] Build → DMG/EXE/AppImage generated

---

## 🔌 **PART 4: WIRING STRATEGY**

### **4.1 Wiring: Frontend ↔ Backend** (Existing)

**Current Wiring**: ✅ **COMPLETE**

```
Frontend (React)
    ↓ HTTP REST
FastAPI (Port 7001)
    ↓ SQL
PostgreSQL
```

**Endpoints Wired**:
- ✅ `/api/v1/auth/*` → AuthService
- ✅ `/api/v1/workspaces/*` → WorkspaceService
- ✅ `/api/v1/documents/*` → DocumentService
- ✅ `/api/v1/folders/*` → FolderService

**Status**: ✅ No changes needed for Phase 0.

---

### **4.2 Wiring: Frontend ↔ Hocuspocus** (Phase 1)

**New Wiring**: ⏳ **TO BE IMPLEMENTED**

```
Frontend (React + Yjs)
    ↓ WebSocket (ws://localhost:1234)
Hocuspocus Server (Port 1234)
    ↓ HTTP (JWT verification)
FastAPI (Port 7001) [for auth only]
    ↓ SQL
PostgreSQL (document_collab_state table)
```

**Steps**:
1. Frontend calls FastAPI: `GET /api/v1/documents/{id}/collab-token`
2. FastAPI returns: `{ "token": "jwt-for-hocuspocus" }`
3. Frontend connects: `new HocuspocusProvider({ url: 'ws://localhost:1234', token })`
4. Hocuspocus verifies JWT with FastAPI via HTTP
5. Hocuspocus loads Yjs state from PostgreSQL
6. Frontend receives synced document

**Implementation**: Task 1.1, 1.2, 1.3

---

### **4.3 Wiring: Guest Mode ↔ IndexedDB** (Phase 0)

**New Wiring**: ⏳ **TO BE IMPLEMENTED**

```
GuestModeContext
    ↓
OfflineDatabase (IndexedDB)
    ↓ (no backend)
Local Browser Storage
```

**Data Flow**:
```
1. User creates guest doc
2. GuestModeContext.createGuestDocument()
3. offlineDB.documents.put({ id: 'guest-doc-{uuid}', ... })
4. Document stored locally (no API call)
```

**Implementation**: Task 0.2

---

### **4.4 Wiring: Migration Flow** (Phase 3)

**New Wiring**: ⏳ **TO BE IMPLEMENTED**

```
GuestMigrationService
    ↓ Read guest docs
OfflineDatabase (IndexedDB)
    ↓ Upload to backend
FastAPI (Port 7001)
    ↓ Store metadata + Yjs state
PostgreSQL
    ↓ Update IndexedDB with real IDs
OfflineDatabase (IndexedDB)
```

**Data Flow**:
```
1. User signs up (guest → authenticated)
2. GuestMigrationService.migrateToCloud()
3. For each guest doc:
   a. POST /api/v1/documents (create on backend)
   b. GET response with real ID
   c. offlineDB.documents.delete(guest-id)
   d. offlineDB.documents.put(real-id)
4. Switch to WorkspaceContext
```

**Implementation**: Task 3.1

---

## 🧪 **PART 5: TESTING STRATEGY**

### **5.1 Unit Tests**

**What to Test**:
```typescript
// frontend/src/__tests__/GuestModeContext.test.ts

describe('GuestModeContext', () => {
  it('creates guest document in IndexedDB', async () => {
    const { createGuestDocument } = useGuestMode();
    const doc = await createGuestDocument('Test', 'Hello');
    
    expect(doc.id).toMatch(/^guest-doc-/);
    
    const stored = await offlineDB.documents.get(doc.id);
    expect(stored.title).toBe('Test');
  });
  
  it('persists guest docs after page reload', async () => {
    // ... test persistence
  });
  
  it('migrates guest docs to cloud', async () => {
    // ... test migration
  });
});
```

**Who Tests**:
- Frontend developer (as they build)
- QA engineer (integration tests)

---

### **5.2 Integration Tests**

**What to Test**:
```typescript
// e2e/guest-mode.spec.ts

test('Guest user flow', async ({ page }) => {
  // 1. Visit landing page
  await page.goto('/');
  
  // 2. Click "Start Writing" (no login)
  await page.click('text=Start Writing');
  
  // 3. Create document
  await page.fill('[placeholder="Untitled"]', 'My First Doc');
  await page.fill('.ProseMirror', 'Hello, world!');
  
  // 4. Close and reopen browser
  await page.close();
  await page.goto('/guest/editor');
  
  // 5. Document persists
  await expect(page.locator('text=My First Doc')).toBeVisible();
  
  // 6. Sign up
  await page.click('text=Login to Sync');
  await page.click('text=Sign Up');
  await page.fill('[type="email"]', 'test@example.com');
  await page.fill('[type="password"]', 'Password123!');
  await page.click('button:has-text("Sign Up")');
  
  // 7. Migration dialog
  await expect(page.locator('text=Migrate 1 document')).toBeVisible();
  await page.click('text=Yes, Migrate');
  
  // 8. Document now in workspace
  await page.goto('/workspace');
  await expect(page.locator('text=My First Doc')).toBeVisible();
});
```

**Who Tests**:
- QA engineer (3 days per phase)
- Automated CI/CD pipeline

---

### **5.3 Manual Testing Checklist**

**Phase 0 (Guest Mode)**:
- [ ] User visits landing page (no login)
- [ ] User clicks "Start Writing" → Editor opens
- [ ] User creates 3 documents → All saved to IndexedDB
- [ ] User closes browser → Documents persist
- [ ] User reopens → Documents appear
- [ ] User clicks "Login to Sync" → Migration starts
- [ ] After migration → Documents in workspace

**Phase 1 (Real-time Collaboration)**:
- [ ] Two users open same document
- [ ] User A types → User B sees changes (< 100ms)
- [ ] User A goes offline → Edits saved locally
- [ ] User A goes online → Changes sync to User B
- [ ] Conflict test: Both edit offline → Yjs merges

**Phase 2 (Storage Modes)**:
- [ ] User creates doc → Default "Hybrid Sync"
- [ ] User switches to "Local Only" → Cloud copy deleted
- [ ] User switches to "Cloud Only" → IndexedDB cleared
- [ ] User switches back to "Hybrid Sync" → Both exist

---

## 🚨 **PART 6: RISK ANALYSIS**

### **6.1 Technical Risks**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Yjs learning curve** | 🟡 Medium | 🔴 High | Spike: 2 days learning Yjs before Task 1.2 |
| **Hocuspocus deployment** | 🟢 Low | 🟡 Medium | Use Docker, test locally first |
| **Migration data loss** | 🟡 Medium | 🔴 High | Backup IndexedDB before migration, allow rollback |
| **IndexedDB quota exceeded** | 🟡 Medium | 🟡 Medium | Monitor usage, prompt user to sync to cloud |
| **Network flakiness** | 🟢 Low | 🟡 Medium | Exponential backoff, queue retries |

---

### **6.2 Process Risks**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Scope creep** | 🔴 High | 🔴 High | Stick to plan, defer Phase 5-7 features |
| **Frontend/Backend misalignment** | 🟡 Medium | 🟡 Medium | Daily standups, shared Slack channel |
| **Breaking existing features** | 🟡 Medium | 🔴 High | Comprehensive test suite, feature flags |
| **Underestimating Yjs complexity** | 🟡 Medium | 🟡 Medium | Add 20% buffer to Phase 1 |

---

## 📅 **PART 7: TIMELINE SUMMARY**

### **Week-by-Week Breakdown**

```
Week 1 (Phase 0: Guest Mode)
├─ Day 1-2: Landing page enhancement (Task 0.1)
├─ Day 2-3: Guest mode context (Task 0.2)
├─ Day 3-4: Wiring (Task 0.3)
└─ Day 5: Testing + bug fixes

Week 2-3 (Phase 1: Hocuspocus + Yjs)
├─ Day 1-3: Hocuspocus server (Task 1.1)
├─ Day 4-6: Yjs integration (Task 1.2)
├─ Day 6-7: TipTap binding (Task 1.3)
└─ Day 8-9: Testing + refinement

Week 4-5 (Phase 2: Storage Modes)
├─ Day 1-2: UI for mode selector (Task 2.1)
├─ Day 2-3: Backend support (Task 2.2)
├─ Day 4-5: Testing + edge cases
└─ Day 6-7: Buffer for issues

Week 6-7 (Phase 3: Migration)
├─ Day 1-3: Migration service (Task 3.1)
├─ Day 4-5: UI flow (signup → migrate)
├─ Day 6-7: Testing + edge cases
└─ Day 8-9: Buffer

Week 8-9 (Phase 4: Tauri Desktop)
├─ Day 1-2: Tauri setup (Task 4.1)
├─ Day 3-4: File system access
├─ Day 5-6: Build/packaging
└─ Day 7-9: Testing + polish
```

**Total**: **9 weeks** for Phases 0-4.

---

## ✅ **PART 8: DEFINITION OF DONE**

### **Phase 0 Done When**:
- [ ] User can start writing without login
- [ ] Documents persist in IndexedDB across sessions
- [ ] "Login to Sync" banner appears for guest users
- [ ] All unit tests pass
- [ ] E2E test: Guest mode flow works

### **Phase 1 Done When**:
- [ ] Hocuspocus server deployed (port 1234)
- [ ] Two users can edit same doc in real-time (< 100ms latency)
- [ ] Offline edits sync on reconnect
- [ ] Yjs state stored in PostgreSQL
- [ ] All integration tests pass

### **Phase 2 Done When**:
- [ ] Users can select storage mode per document
- [ ] "Local Only" docs never sync to cloud
- [ ] "Cloud Only" docs stream from cloud (no IndexedDB)
- [ ] Mode changes persist across sessions
- [ ] All storage mode tests pass

### **Phase 3 Done When**:
- [ ] Guest users can sign up
- [ ] All guest docs migrate to cloud automatically
- [ ] Migration success rate > 99%
- [ ] Guest docs deleted after migration
- [ ] All migration tests pass

### **Phase 4 Done When**:
- [ ] Desktop app builds for macOS/Windows/Linux
- [ ] Native file picker works
- [ ] .md files open in app
- [ ] DMG/EXE installers generated
- [ ] All desktop tests pass

---

## 🎯 **PART 9: SUCCESS METRICS**

### **Phase 0 (Guest Mode)**:
- **Adoption**: 50%+ of new users start without login
- **Retention**: 80%+ of guest users return within 7 days
- **Migration**: 30%+ of guest users sign up and migrate

### **Phase 1 (Real-time)**:
- **Latency**: < 100ms for document updates
- **Uptime**: Hocuspocus 99.9% uptime
- **Conflicts**: < 1% conflict rate (Yjs should prevent)

### **Phase 2 (Storage Modes)**:
- **Usage**: 20%+ users switch from default mode
- **Local Only**: 10%+ users choose "Local Only"
- **Cloud Only**: 5%+ users choose "Cloud Only"

### **Phase 3 (Migration)**:
- **Success Rate**: > 99% migration success
- **Data Loss**: < 0.1% data loss incidents
- **Time**: < 5 seconds per document

### **Phase 4 (Desktop)**:
- **Downloads**: 1000+ desktop installs in first month
- **Performance**: < 2s startup time
- **Stability**: < 1 crash per 100 user-hours

---

## 📋 **PART 10: PRE-FLIGHT CHECKLIST**

**Before Starting Phase 0**:
- [ ] Push current code to main branch
- [ ] Create `feature/phase-0-guest-mode` branch
- [ ] Set up CI/CD for automated tests
- [ ] Create Slack channel: `#mdreader-build`
- [ ] Schedule daily standups (15 min)
- [ ] Assign developers to tasks
- [ ] Review COMPREHENSIVE_USE_CASES.md (refresh context)
- [ ] Review SENIOR_ENGINEERING_PLAN.md (align vision)

**Before Starting Phase 1**:
- [ ] Phase 0 fully tested and deployed
- [ ] Create PostgreSQL `document_collab_state` table
- [ ] Set up Node.js environment for Hocuspocus
- [ ] Install Yjs + Hocuspocus packages
- [ ] Spike: 2 days learning Yjs (senior dev)

**Before Each Phase**:
- [ ] Previous phase complete (DoD ✅)
- [ ] Code reviewed and merged to main
- [ ] All tests passing
- [ ] Product owner signs off

---

## 🎉 **CONCLUSION**

### **What This Plan Delivers**:
1. ✅ **Clear roadmap** (9 weeks, 5 phases)
2. ✅ **Granular tasks** (0.1, 0.2, 1.1, etc.)
3. ✅ **Why/Who/What** for every task
4. ✅ **Wiring strategy** (how components connect)
5. ✅ **Testing protocol** (unit, integration, manual)
6. ✅ **Risk mitigation** (technical + process)
7. ✅ **Success metrics** (KPIs per phase)
8. ✅ **Definition of Done** (clear exit criteria)

### **Key Principles**:
- 🎯 **Build incrementally** (Phase 0 → Phase 4)
- 🔌 **Wire as you go** (don't build in isolation)
- 🧪 **Test continuously** (don't defer testing)
- 📝 **Document decisions** (why we chose X over Y)
- 🚀 **Ship small** (deploy after each phase)

### **Next Steps**:
1. **Review this plan** with team (1 hour meeting)
2. **Push current code** to main branch
3. **Start Phase 0, Task 0.1** (Landing Page Enhancement)
4. **Daily standups** to track progress

---

**Status**: 🟢 **READY TO START**  
**Total Scope**: 9 weeks (Phases 0-4)  
**Team Size**: 2-3 developers (1 senior, 1-2 mid)  
**Risk Level**: 🟡 Medium (Yjs learning curve)  
**Confidence**: 🟢 High (plan is detailed, feasible)

**Let's build.** 🚀

---

**Document Created**: December 10, 2025  
**Author**: Senior Engineering Team  
**Version**: 1.0  
**Next Review**: After Phase 0 completion


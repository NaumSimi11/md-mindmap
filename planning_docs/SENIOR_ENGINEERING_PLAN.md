# 🏗️ **MDReader: Senior Engineering Implementation Plan**

**Date**: December 10, 2025  
**Engineer**: Senior Architect  
**Status**: 🟢 **READY TO EXECUTE**  
**Purpose**: Complete technical blueprint for local-first markdown + mindmap editor with real-time collaboration  
**Version**: 2.0 (Enhanced with competitive "win" features)

---

## 📊 **Current State Analysis**

### **✅ What You Already Have (Strong Foundation)**

```typescript
Tech Stack (from package.json):
├─ Frontend Framework
│  ├─ React 18.3 ✅
│  ├─ Vite 5.4 ✅
│  └─ TypeScript 5.8 ✅
│
├─ Editor & CRDT
│  ├─ TipTap 3.6+ (extensible WYSIWYG) ✅
│  ├─ Yjs 13.6 (CRDT engine) ✅
│  └─ y-indexeddb 9.0 (local persistence) ✅
│
├─ Desktop Platform
│  ├─ Tauri 2.8 (Rust-based) ✅
│  ├─ @tauri-apps/plugin-fs ✅
│  └─ @tauri-apps/plugin-dialog ✅
│
├─ Offline Storage
│  ├─ Dexie.js 4.2 (IndexedDB wrapper) ✅
│  └─ Custom sync manager ✅
│
├─ Mindmap Generation
│  ├─ markmap-lib + markmap-view ✅
│  ├─ d3.js 7.9 ✅
│  └─ elkjs (auto-layout) ✅
│
├─ State Management
│  ├─ Zustand 5.0 ✅
│  └─ React Context ✅
│
└─ UI/UX
   ├─ Radix UI (primitives) ✅
   ├─ Tailwind CSS ✅
   ├─ Framer Motion (animations) ✅
   └─ shadcn/ui components ✅
```

**Architecture (from src/):**
```
frontend/src/
├─ components/
│  ├─ editor/        → WYSIWYG editor (TipTap)
│  ├─ mindmap/       → Mindmap generation + editor
│  ├─ comments/      → Comment system
│  ├─ presentation/  → Presentation mode
│  ├─ workspace/     → Workspace sidebar/navigation
│  └─ offline/       → Sync status, conflict resolver
│
├─ services/
│  ├─ offline/       → OfflineWorkspaceService, SyncManager
│  ├─ mindmap/       → MindmapGenerator
│  └─ workspace/     → BackendWorkspaceService
│
├─ stores/           → Zustand stores (editor, mindmap, comments)
├─ contexts/         → WorkspaceContext, EditorContext
└─ hooks/            → useAuth, useNetworkStatus, useConflicts
```

**Key Discovery**: You already have:
- ✅ Yjs (CRDT foundation)
- ✅ TipTap (editor with Yjs support)
- ✅ Tauri (desktop platform)
- ✅ Offline sync infrastructure
- ✅ Mindmap auto-generation
- ✅ Comments system

**What's Missing**: Landing page integration + Win features + Production polish

---

## 🎯 **The Vision (What We're Building)**

### **MDReader = Obsidian + Notion + Miro (AI-Powered)**

```
┌─────────────────────────────────────────────────────────────┐
│                    MDREADER VISION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 WYSIWYG Markdown Editor (TipTap + Yjs)                 │
│     → Like Notion, but local-first                         │
│                                                             │
│  🧠 AI-Powered Mindmap Generation                          │
│     → Auto-generate from markdown headings                 │
│     → Visual thinking tool                                 │
│                                                             │
│  👥 Real-Time Collaboration (Yjs + Hocuspocus)            │
│     → Google Docs-style multi-user editing                │
│     → Conflict-free (CRDT automatic merge)                │
│                                                             │
│  💾 Hybrid Storage (Local + Cloud)                         │
│     → Works 100% offline (Tauri + IndexedDB)              │
│     → Optional cloud sync (FastAPI + Hocuspocus)          │
│     → Per-document control (LocalOnly/HybridSync/CloudOnly)│
│                                                             │
│  🔐 Privacy-First                                          │
│     → Guest mode (no login, local-only)                   │
│     → Sign up → migrate local docs to cloud               │
│     → Choose what syncs                                    │
│                                                             │
│  ⚡ Power User Features (NEW)                              │
│     → Command Palette (Cmd+K)                             │
│     → Graph View (Obsidian-style)                         │
│     → Templates System (20+)                              │
│     → Publishing (public docs)                            │
│     → Advanced Search                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Architecture (Complete System)**

### **Layered Architecture**

```
┌────────────────────────────────────────────────────────────────┐
│  Layer 1: PLATFORMS                                            │
│  ┌──────────────────────┬──────────────────────────────────┐  │
│  │  Web (Browser)       │  Desktop (Tauri)                 │  │
│  │  • Vite dev server   │  • Rust backend                  │  │
│  │  • IndexedDB         │  • Filesystem access             │  │
│  │  • 50-500MB limit    │  • Unlimited storage             │  │
│  └──────────────────────┴──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  Layer 2: FRONTEND (React App)                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  UI Components                                           │ │
│  │  ├─ WYSIWYGEditor (TipTap + Yjs binding)               │ │
│  │  ├─ MindmapCanvas (markmap + d3 + elk)                 │ │
│  │  ├─ WorkspaceSidebar (document tree)                   │ │
│  │  ├─ CommentSidebar                                      │ │
│  │  ├─ CommandPalette (Cmd+K) ← NEW                       │ │
│  │  ├─ GraphView (connections) ← NEW                      │ │
│  │  └─ SyncStatusIndicator                                 │ │
│  │                                                           │ │
│  │  State Management                                        │ │
│  │  ├─ WorkspaceContext (React Context)                   │ │
│  │  ├─ editorStore (Zustand)                              │ │
│  │  ├─ mindmapStore (Zustand)                             │ │
│  │  └─ commentStore (Zustand)                             │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  Layer 3: DOCUMENT ENGINE (Yjs CRDT)                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Y.Doc (per document)                                    │ │
│  │  ├─ Y.Text('content') → Editor content                 │ │
│  │  ├─ Y.Array('comments') → Comments                     │ │
│  │  ├─ Y.Map('metadata') → Title, tags, etc.             │ │
│  │  └─ Awareness (collaborative cursors)                  │ │
│  │                                                           │ │
│  │  TipTap Extensions                                       │ │
│  │  ├─ Collaboration (binds TipTap ↔ Yjs)                │ │
│  │  ├─ CollaborationCursor (shows other users)           │ │
│  │  └─ All existing extensions                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  Layer 4: STORAGE & SYNC                                       │
│  ┌───────────────────────┬──────────────────────────────────┐ │
│  │  Local Storage        │  Sync Providers                  │ │
│  │  ├─ y-indexeddb       │  ├─ Hocuspocus (WebSocket)      │ │
│  │  │  (Yjs persistence) │  │  (real-time sync)            │ │
│  │  │                     │  │                               │ │
│  │  ├─ Dexie.js          │  └─ Custom SyncManager          │ │
│  │  │  (metadata, queue) │     (fallback, queue-based)     │ │
│  │  │                     │                                  │ │
│  │  └─ Tauri FS          │                                  │ │
│  │     (desktop files)   │                                  │ │
│  └───────────────────────┴──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  Layer 5: BACKEND (Optional, for cloud sync)                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Hocuspocus Server (Node.js)                            │ │
│  │  ├─ WebSocket server (port 1234)                       │ │
│  │  ├─ Yjs sync protocol                                   │ │
│  │  ├─ Persistence (PostgreSQL)                           │ │
│  │  └─ Auth (JWT tokens)                                   │ │
│  │                                                           │ │
│  │  FastAPI App Server (Python)                            │ │
│  │  ├─ User authentication                                 │ │
│  │  ├─ Document metadata API                              │ │
│  │  ├─ Workspace management                               │ │
│  │  ├─ Collaboration tokens                               │ │
│  │  ├─ Publishing service ← NEW                           │ │
│  │  └─ File uploads/exports                               │ │
│  │                                                           │ │
│  │  PostgreSQL Database                                     │ │
│  │  ├─ users                                               │ │
│  │  ├─ workspaces                                          │ │
│  │  ├─ documents (metadata only)                          │ │
│  │  ├─ folders                                             │ │
│  │  ├─ document_collab_state (Yjs snapshots)             │ │
│  │  └─ published_documents ← NEW                          │ │
│  │                                                           │ │
│  │  Monitoring & Analytics ← NEW                           │ │
│  │  ├─ Sentry (error tracking)                            │ │
│  │  ├─ PostHog/Mixpanel (analytics)                       │ │
│  │  └─ Performance monitoring                              │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 📐 **Storage Modes (The Innovation)**

### **Per-Document Storage Control**

```typescript
// Document model
interface Document {
  id: string;                    // UUID
  local_id: string;              // Always present (for local ref)
  remote_id: string | null;      // Present if cloud-backed
  
  storage_mode: 'LocalOnly' | 'CloudOnly' | 'HybridSync';
  
  title: string;
  content: string;               // Markdown (or Yjs state pointer)
  
  // Yjs-specific
  yjs_doc_name: string;          // Y.Doc room name
  yjs_state_vector?: Uint8Array; // Last known state
  
  // Sync metadata
  last_synced_at: string | null;
  pending_changes: boolean;
  
  // Organization
  workspace_id: string;
  folder_id: string | null;
  
  // Features
  has_mindmap: boolean;
  has_comments: boolean;
  has_presentation: boolean;
  
  created_at: string;
  updated_at: string;
}
```

### **Mode Behaviors**

| Mode | Local Storage | Cloud Sync | Collaboration | Use Case |
|------|---------------|------------|---------------|----------|
| **LocalOnly** | ✅ y-indexeddb | ❌ Never | ❌ No | Private journal |
| **HybridSync** | ✅ y-indexeddb | ✅ Hocuspocus | ✅ Yes (when online) | Most documents |
| **CloudOnly** | ⚠️ Cache only | ✅ Hocuspocus | ✅ Yes | Team collaboration |

---

## 🔄 **Sync Architecture (Dual-System)**

### **System 1: Yjs + Hocuspocus (Real-Time)**

**For**: HybridSync and CloudOnly documents

```typescript
// When user opens a cloud-backed document
const ydoc = new Y.Doc();
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: document.yjs_doc_name,
  document: ydoc,
  token: await getCollabToken(document.id),
  
  // Local persistence (works offline)
  persistence: new IndexeddbPersistence(document.yjs_doc_name, ydoc),
  
  // Awareness (collaborative cursors)
  awareness: new awarenessProtocol.Awareness(ydoc),
});

// Bind to TipTap editor
const editor = useEditor({
  extensions: [
    StarterKit,
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: currentUser.name,
        color: generateColor(currentUser.id),
      },
    }),
    // ... all your existing extensions
  ],
});
```

**How It Works**:
```
User types → Yjs captures edit → y-indexeddb saves (local)
                                ↓
                          (if online) Hocuspocus sends to cloud
                                ↓
                          Other users receive update (< 100ms)
                                ↓
                          Their editors update automatically
```

**Offline Behavior**:
```
1. User offline → edits saved to y-indexeddb only
2. Network returns → Hocuspocus reconnects automatically
3. Yjs merges local changes with cloud (CRDT = no conflicts!)
4. All users sync up
```

---

### **System 2: Custom SyncManager (Fallback + LocalOnly)**

**For**: LocalOnly documents, metadata sync, folder structure

**Keep your existing**:
```typescript
// services/offline/SyncManager.ts
class SyncManager {
  // For LocalOnly documents (never use Hocuspocus)
  async syncMetadata() { ... }
  
  // For folder structure (not in Yjs)
  async syncFolders() { ... }
  
  // Fallback if Hocuspocus fails
  async fallbackSync() { ... }
}
```

**Why Two Systems?**:
- Yjs/Hocuspocus = Perfect for document content (real-time, CRDT)
- Custom sync = Perfect for metadata, folders, settings (not in Yjs)

---

## 👤 **Guest Mode → Login → Sync Flow**

### **Phase 1: Guest Mode (Local-Only)**

```
User opens app (no login)
        ↓
    Landing Page
    "Start Writing" → Opens editor
        ↓
    Create Y.Doc with local name: `guest-${uuid}`
        ↓
    Save to y-indexeddb (local only)
        ↓
    storage_mode = "LocalOnly"
    remote_id = null
        ↓
    User continues working...
        ↓
    All data in IndexedDB (browser) or Tauri FS (desktop)
```

**Implementation**:
```typescript
// When guest creates document
const createGuestDocument = async (title: string) => {
  const localId = `guest-doc-${uuidv4()}`;
  
  const doc: Document = {
    id: localId,
    local_id: localId,
    remote_id: null, // ← No cloud identity yet
    storage_mode: 'LocalOnly',
    title,
    content: '',
    yjs_doc_name: `local:${localId}`,
    workspace_id: 'guest-workspace',
    folder_id: null,
    pending_changes: false,
    last_synced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Save to IndexedDB (metadata)
  await offlineDB.documents.put(doc);
  
  // Create Yjs doc (local only, no provider)
  const ydoc = new Y.Doc();
  const persistence = new IndexeddbPersistence(doc.yjs_doc_name, ydoc);
  
  return { doc, ydoc, persistence };
};
```

---

### **Phase 2: Sign Up / Login**

```
User clicks "Sign Up"
        ↓
    Show registration form
        ↓
    User enters email/password
        ↓
    POST /api/v1/auth/register
        ↓
    Receive JWT tokens
        ↓
    [Migration Modal Appears]
    "You have 5 local documents. Import to account?"
        ↓
    User clicks "Yes, Import All"
        ↓
    For each local document:
      1. POST /api/v1/documents (create remote)
      2. Get remote_id
      3. Upload Yjs state to Hocuspocus
      4. Update document:
         - remote_id = (from server)
         - storage_mode = "HybridSync"
         - yjs_doc_name = `doc:${remote_id}`
      5. Connect to Hocuspocus provider
        ↓
    Documents now synced to cloud!
```

**Implementation**:
```typescript
// Migration flow
const migrateGuestDocumentsToCloud = async (userId: string, token: string) => {
  // Get all local documents
  const localDocs = await offlineDB.documents
    .where('storage_mode').equals('LocalOnly')
    .toArray();
  
  console.log(`Found ${localDocs.length} local documents to migrate`);
  
  for (const localDoc of localDocs) {
    try {
      // 1. Create remote document (metadata only)
      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: localDoc.title,
          workspace_id: (await createOrGetWorkspace(userId, token)).id,
          content_type: 'markdown',
        }),
      });
      
      const { id: remoteId } = await response.json();
      
      // 2. Get Yjs state from local IndexedDB
      const ydoc = new Y.Doc();
      const localPersistence = new IndexeddbPersistence(localDoc.yjs_doc_name, ydoc);
      await localPersistence.whenSynced; // Wait for load
      
      const yjsState = Y.encodeStateAsUpdate(ydoc);
      
      // 3. Upload to Hocuspocus (create remote Y.Doc)
      const collabToken = await getCollabToken(remoteId, token);
      const provider = new HocuspocusProvider({
        url: 'ws://localhost:1234',
        name: `doc:${remoteId}`,
        document: ydoc,
        token: collabToken,
      });
      
      await provider.synced; // Wait for upload
      provider.destroy(); // Close connection
      
      // 4. Update local metadata
      await offlineDB.documents.update(localDoc.id, {
        remote_id: remoteId,
        storage_mode: 'HybridSync',
        yjs_doc_name: `doc:${remoteId}`,
        last_synced_at: new Date().toISOString(),
      });
      
      console.log(`✅ Migrated: ${localDoc.title}`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${localDoc.title}:`, err);
    }
  }
  
  console.log(`🎉 Migration complete!`);
};
```

---

### **Phase 3: Ongoing Sync (Authenticated User)**

```
User creates new document
        ↓
    [Modal: "Storage Mode?"]
    • LocalOnly (private, device-only)
    • HybridSync (local + cloud backup) ← Default
    • CloudOnly (cloud-first, team collaboration)
        ↓
    User selects "HybridSync"
        ↓
    1. POST /api/v1/documents (create remote)
    2. Get remote_id
    3. Create Y.Doc with name: `doc:${remote_id}`
    4. Connect to Hocuspocus
    5. Local persistence (y-indexeddb)
        ↓
    User types → Syncs in real-time (< 100ms)
        ↓
    If offline → Saves local, syncs when online returns
```

---

## 🚀 **Implementation Phases**

### **Phase 0: Landing Page & Onboarding (1 week)** 🆕 QUICK WIN

**Goal**: Seamless integration with existing landing page

**Tasks**:

1. **Open File (Tauri Command)** (Day 1)
```typescript
// src-tauri/src/commands.rs
#[tauri::command]
async fn open_markdown_file() -> Result<(String, String), String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    let file = FileDialogBuilder::new()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .pick_file();
    
    if let Some(path) = file {
        let content = fs::read_to_string(&path)?;
        Ok((path.to_str().unwrap().to_string(), content))
    } else {
        Err("No file selected".into())
    }
}

// Frontend
const handleOpenFile = async () => {
  try {
    const { path, content } = await invoke('open_markdown_file');
    
    // Create document in workspace
    const doc = await createDocument({
      title: getFileName(path),
      content,
      local_path: path,
      storage_mode: 'LocalOnly'
    });
    
    // Navigate to editor
    navigate(`/workspace/doc/${doc.id}/edit`);
  } catch (err) {
    console.error('Failed to open file:', err);
  }
};
```

2. **Drop Zone** (Day 2)
```typescript
const handleFileDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  
  const files = Array.from(e.dataTransfer.files);
  const mdFiles = files.filter(f => 
    f.name.endsWith('.md') || 
    f.name.endsWith('.markdown') ||
    f.name.endsWith('.txt')
  );
  
  if (mdFiles.length === 0) {
    toast.error('Please drop markdown files (.md, .txt)');
    return;
  }
  
  // Import all files
  for (const file of mdFiles) {
    const content = await file.text();
    
    await createDocument({
      title: file.name.replace(/\.(md|markdown|txt)$/, ''),
      content,
      storage_mode: 'LocalOnly'
    });
  }
  
  toast.success(`Imported ${mdFiles.length} file(s)`);
  navigate('/workspace');
};
```

3. **Start Writing** (Day 2)
```typescript
const handleStartWriting = async () => {
  // Create blank document (no login required)
  const doc = await createDocument({
    title: 'Untitled',
    content: '',
    storage_mode: 'LocalOnly'
  });
  
  navigate(`/workspace/doc/${doc.id}/edit`);
};
```

4. **AI Generate** (Day 3)
```typescript
const handleAIGenerate = async () => {
  const prompt = await showPromptDialog();
  if (!prompt) return;
  
  // Check if AI configured
  if (!config.ai.openai_api_key) {
    navigate('/workspace?modal=ai-settings');
    return;
  }
  
  // Generate with AI
  setGenerating(true);
  try {
    const content = await generateWithAI(prompt);
    
    const doc = await createDocument({
      title: extractTitle(content) || 'AI Generated',
      content,
      storage_mode: 'LocalOnly'
    });
    
    navigate(`/workspace/doc/${doc.id}/edit`);
  } finally {
    setGenerating(false);
  }
};
```

**Deliverables**:
- ✅ Open .md file from computer
- ✅ Drag & drop .md files
- ✅ Start writing (no login)
- ✅ AI generate document

**Effort**: 40 hours  
**Risk**: Low (quick win)

---

### **Phase 1: Yjs + Hocuspocus Foundation (3 weeks)** 🟢 HIGH PRIORITY

**Goal**: Get real-time collaboration working

**Tasks**:

1. **Deploy Hocuspocus Server** (1 week)
```bash
# Create new Node.js project
mkdir hocuspocus-server
cd hocuspocus-server
npm init -y
npm install @hocuspocus/server @hocuspocus/extension-database
```

```typescript
// server.ts
import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

const server = Server.configure({
  port: 1234,
  
  // Auth: Verify JWT tokens from FastAPI
  async onAuthenticate({ token, documentName }) {
    // Verify JWT token (from FastAPI /collab-token endpoint)
    const payload = await verifyJWT(token);
    
    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(payload.userId, documentName);
    if (!hasAccess) throw new Error('Unauthorized');
    
    return {
      user: {
        id: payload.userId,
        name: payload.username,
      },
    };
  },
  
  // Persistence: Save Yjs state to PostgreSQL
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const result = await sql`
          SELECT yjs_state FROM document_collab_state 
          WHERE document_name = ${documentName}
        `;
        return result[0]?.yjs_state || null;
      },
      store: async ({ documentName, state }) => {
        await sql`
          INSERT INTO document_collab_state (document_name, yjs_state, updated_at)
          VALUES (${documentName}, ${state}, NOW())
          ON CONFLICT (document_name) 
          DO UPDATE SET yjs_state = ${state}, updated_at = NOW()
        `;
      },
    }),
  ],
});

server.listen();
```

2. **Add Hocuspocus to Frontend** (1 week)
```bash
cd frontend
npm install @hocuspocus/provider @hocuspocus/common
```

```typescript
// hooks/useYjsDocument.ts
export const useYjsDocument = (documentId: string, storageMode: string) => {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Always use local persistence
    const localPersistence = new IndexeddbPersistence(
      `doc:${documentId}`,
      ydoc
    );
    
    // If cloud-backed, connect to Hocuspocus
    if (storageMode !== 'LocalOnly' && user) {
      const collabProvider = new HocuspocusProvider({
        url: 'ws://localhost:1234',
        name: `doc:${documentId}`,
        document: ydoc,
        token: async () => {
          const res = await fetch(`/api/v1/documents/${documentId}/collab-token`);
          const { token } = await res.json();
          return token;
        },
        
        // Reconnect automatically
        maxAttempts: 10,
        delay: 1000,
        
        // Awareness (collaborative cursors)
        awareness: new awarenessProtocol.Awareness(ydoc),
      });
      
      setProvider(collabProvider);
    }
    
    return () => {
      provider?.destroy();
      localPersistence.destroy();
    };
  }, [documentId, storageMode, user]);
  
  return { ydoc, provider };
};
```

3. **Integrate with TipTap** (1 week)
```typescript
// Modify WYSIWYGEditor.tsx
const WYSIWYGEditor = ({ documentId, storageMode }) => {
  const { ydoc, provider } = useYjsDocument(documentId, storageMode);
  const { user } = useAuth();
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history (Yjs handles it)
        history: false,
      }),
      
      // ✅ ADD: Yjs collaboration
      Collaboration.configure({
        document: ydoc,
      }),
      
      // ✅ ADD: Collaborative cursors (if cloud-backed)
      ...(storageMode !== 'LocalOnly' && provider
        ? [
            CollaborationCursor.configure({
              provider: provider,
              user: {
                name: user?.username || 'Anonymous',
                color: generateUserColor(user?.id),
              },
            }),
          ]
        : []),
      
      // All your existing extensions
      Underline,
      Highlight,
      Link,
      Image,
      Table,
      // ... etc
    ],
  });
  
  return <EditorContent editor={editor} />;
};
```

**Deliverables**:
- ✅ Hocuspocus server running
- ✅ Real-time collaboration working (< 100ms sync)
- ✅ Offline edits queue and merge automatically
- ✅ Collaborative cursors visible

**Effort**: 120 hours  
**Risk**: Medium (new infrastructure)

---

### **Phase 2: Storage Modes System (2 weeks)** 🟡 MEDIUM PRIORITY

**Goal**: Per-document storage control

**Tasks**:

1. **Update Document Model** (2 days)
```typescript
// Add to Dexie schema
offlineDB.version(4).stores({
  documents: 'id, local_id, remote_id, storage_mode, workspace_id, folder_id',
  // ... existing tables
});

// Add storage_mode to all CRUD operations
```

2. **Create Storage Mode UI** (3 days)
```typescript
// components/workspace/DocumentStorageSettings.tsx
const DocumentStorageSettings = ({ document }) => {
  const [mode, setMode] = useState(document.storage_mode);
  
  const handleModeChange = async (newMode: StorageMode) => {
    if (newMode === 'HybridSync' && !user) {
      // Prompt login
      navigate('/login?redirect=/workspace/doc/' + document.id);
      return;
    }
    
    if (newMode === 'HybridSync' && document.storage_mode === 'LocalOnly') {
      // Upload to cloud
      await migrateToCloud(document);
    }
    
    if (newMode === 'LocalOnly' && document.storage_mode === 'HybridSync') {
      // Disconnect from cloud (keep local copy)
      await disconnectFromCloud(document);
    }
    
    setMode(newMode);
  };
  
  return (
    <RadioGroup value={mode} onValueChange={handleModeChange}>
      <RadioGroupItem value="LocalOnly">
        🔒 Local Only (private, never syncs)
      </RadioGroupItem>
      <RadioGroupItem value="HybridSync">
        🔄 Hybrid Sync (local + cloud backup)
      </RadioGroupItem>
      <RadioGroupItem value="CloudOnly">
        ☁️ Cloud Only (team collaboration)
      </RadioGroupItem>
    </RadioGroup>
  );
};
```

3. **Implement Mode Transitions** (5 days)
```typescript
// services/workspace/StorageModeService.ts
class StorageModeService {
  async migrateToCloud(document: Document): Promise<void> {
    // Same logic as guest migration
    // 1. Create remote document
    // 2. Upload Yjs state
    // 3. Update storage_mode
    // 4. Connect to Hocuspocus
  }
  
  async disconnectFromCloud(document: Document): Promise<void> {
    // 1. Disconnect Hocuspocus provider
    // 2. Update storage_mode = 'LocalOnly'
    // 3. Keep local Yjs state
    // 4. Optionally archive remote copy
  }
}
```

**Deliverables**:
- ✅ UI to switch storage modes
- ✅ LocalOnly documents never touch cloud
- ✅ HybridSync documents sync automatically
- ✅ CloudOnly documents collaboration-first

**Effort**: 80 hours  
**Risk**: Low (enhances existing system)

---

### **Phase 3: Guest Mode → Login Flow (2 weeks)** 🟢 HIGH PRIORITY

**Goal**: Frictionless onboarding

**Tasks**:

1. **Implement Guest Mode** (3 days)
```typescript
// On landing page
const handleStartWriting = () => {
  // Create guest workspace (local-only)
  const guestWorkspace = await createGuestWorkspace();
  
  // Create first document
  const doc = await createGuestDocument('Untitled', guestWorkspace.id);
  
  // Navigate to editor
  navigate(`/workspace/doc/${doc.id}/edit`);
};
```

2. **Migration Modal** (4 days)
```typescript
// components/auth/GuestMigrationModal.tsx
const GuestMigrationModal = () => {
  const localDocs = useLocalDocuments();
  const [selected, setSelected] = useState<string[]>(localDocs.map(d => d.id));
  
  const handleMigrate = async () => {
    const token = await login(email, password);
    
    for (const docId of selected) {
      await migrateGuestDocumentsToCloud(docId, token);
    }
    
    toast.success(`Migrated ${selected.length} documents!`);
    navigate('/workspace');
  };
  
  return (
    <Dialog>
      <DialogTitle>Import Local Documents?</DialogTitle>
      <DialogDescription>
        You have {localDocs.length} documents saved locally.
        Import them to your account?
      </DialogDescription>
      
      <CheckboxGroup>
        {localDocs.map(doc => (
          <Checkbox
            key={doc.id}
            checked={selected.includes(doc.id)}
            onCheckedChange={() => toggleSelect(doc.id)}
          >
            {doc.title}
          </Checkbox>
        ))}
      </CheckboxGroup>
      
      <Button onClick={handleMigrate}>
        Import {selected.length} Documents
      </Button>
    </Dialog>
  );
};
```

3. **Seamless Auth Flow** (3 days)
```typescript
// Login.tsx
const handleLogin = async (email, password) => {
  const { token, user } = await authService.login(email, password);
  
  // Check for local documents
  const localDocs = await getLocalDocuments();
  
  if (localDocs.length > 0) {
    // Show migration modal
    setShowMigrationModal(true);
  } else {
    // Navigate to workspace
    navigate('/workspace');
  }
};
```

**Deliverables**:
- ✅ Users can start without login
- ✅ Local documents persist in IndexedDB/Tauri
- ✅ Sign up → smooth migration to cloud
- ✅ No data loss

**Effort**: 80 hours  
**Risk**: Low (well-defined flow)

---

### **Phase 4: Tauri Desktop Enhancements (2 weeks)** 🟡 MEDIUM PRIORITY

**Goal**: Native desktop experience

**Tasks**:

1. **Filesystem Storage** (1 week)
```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn save_document_to_fs(
    doc_id: String,
    yjs_state: Vec<u8>,
    metadata: String,
) -> Result<(), String> {
    let docs_dir = get_documents_dir().join("MDReader/documents");
    fs::create_dir_all(&docs_dir)?;
    
    // Save .mddoc file
    let file_path = docs_dir.join(format!("{}.mddoc", doc_id));
    let mddoc = MdDocFile {
        meta: serde_json::from_str(&metadata)?,
        yjs_state: base64::encode(&yjs_state),
        version: 1,
    };
    
    fs::write(file_path, serde_json::to_string_pretty(&mddoc)?)?;
    Ok(())
}

#[tauri::command]
async fn load_document_from_fs(doc_id: String) -> Result<(String, Vec<u8>), String> {
    let file_path = get_documents_dir()
        .join("MDReader/documents")
        .join(format!("{}.mddoc", doc_id));
    
    let contents = fs::read_to_string(file_path)?;
    let mddoc: MdDocFile = serde_json::from_str(&contents)?;
    
    let yjs_state = base64::decode(&mddoc.yjs_state)?;
    Ok((serde_json::to_string(&mddoc.meta)?, yjs_state))
}
```

2. **Native Menus & Shortcuts** (5 days)
```rust
// src-tauri/src/menu.rs
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

pub fn build_menu() -> Menu {
    let file_menu = Submenu::new("File", Menu::new()
        .add_item(CustomMenuItem::new("new_doc", "New Document").accelerator("Cmd+N"))
        .add_item(CustomMenuItem::new("open", "Open...").accelerator("Cmd+O"))
        .add_item(CustomMenuItem::new("save", "Save").accelerator("Cmd+S"))
        .add_native_item(MenuItem::Separator)
        .add_item(CustomMenuItem::new("export_md", "Export as Markdown"))
        .add_item(CustomMenuItem::new("export_pdf", "Export as PDF"))
    );
    
    let edit_menu = Submenu::new("Edit", Menu::new()
        .add_native_item(MenuItem::Undo)
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
    );
    
    Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
}
```

**Deliverables**:
- ✅ Documents saved to filesystem (~/Documents/MDReader/)
- ✅ Native file picker integration
- ✅ OS-level menus and shortcuts
- ✅ System tray icon

**Effort**: 80 hours  
**Risk**: Low (Tauri is mature)

---

### **Phase 5: "Win" Features (2 weeks)** 🆕 COMPETITIVE EDGE

**Goal**: Features that make MDReader **unbeatable**

#### **5.1 Command Palette (Cmd+K)** ⭐ MUST-HAVE

**Why**: Power users expect this (VS Code, Notion, Linear)

```typescript
// components/workspace/CommandPalette.tsx
const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => createDocument()}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </CommandItem>
          <CommandItem onSelect={() => navigate('/workspace')}>
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </CommandItem>
          <CommandItem onSelect={() => openSearch()}>
            <Search className="mr-2 h-4 w-4" />
            Search Documents
          </CommandItem>
        </CommandGroup>
        
        {/* Recent Documents */}
        <CommandGroup heading="Recent Documents">
          {recentDocs.map(doc => (
            <CommandItem key={doc.id} onSelect={() => openDoc(doc.id)}>
              <FileText className="mr-2 h-4 w-4" />
              {doc.title}
            </CommandItem>
          ))}
        </CommandGroup>
        
        {/* AI Actions */}
        <CommandGroup heading="AI">
          <CommandItem onSelect={() => generateMindmap()}>
            <Brain className="mr-2 h-4 w-4" />
            Generate Mindmap
          </CommandItem>
          <CommandItem onSelect={() => summarizeDoc()}>
            <Bot className="mr-2 h-4 w-4" />
            Summarize Document
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
```

**Features**:
- Cmd+K to open
- Search documents
- Quick actions
- Recent documents
- AI commands
- Fuzzy matching

**Effort**: 20 hours

---

#### **5.2 Graph View (like Obsidian)** ⭐ KILLER FEATURE

**Why**: Visualize connections between documents

```typescript
// components/workspace/GraphView.tsx
import { ForceGraph2D } from 'react-force-graph';

const GraphView = () => {
  const documents = useDocuments();
  
  // Build graph data
  const graphData = useMemo(() => {
    const nodes = documents.map(doc => ({
      id: doc.id,
      name: doc.title,
      val: doc.links.length + 1 // Node size based on connections
    }));
    
    const links = [];
    
    // Parse document links [[document-name]]
    documents.forEach(doc => {
      const linkMatches = doc.content.matchAll(/\[\[(.+?)\]\]/g);
      for (const match of linkMatches) {
        const targetDoc = documents.find(d => d.title === match[1]);
        if (targetDoc) {
          links.push({
            source: doc.id,
            target: targetDoc.id
          });
        }
      }
    });
    
    return { nodes, links };
  }, [documents]);
  
  return (
    <div className="graph-view">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => getColor(node)}
        onNodeClick={node => navigate(`/workspace/doc/${node.id}`)}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
};
```

**Features**:
- Force-directed graph
- Click to open document
- Shows document links [[document-name]]
- Backlinks tracking
- Zoom/pan controls
- Search in graph

**Effort**: 30 hours

---

#### **5.3 Templates System** ⭐ FAST START

**Why**: Users want to start quickly

```typescript
// Templates
const templates = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: '📝',
    content: `# Meeting Notes

## Date: {{date}}
## Attendees
- 

## Agenda
1. 

## Discussion Notes


## Action Items
- [ ] 

## Next Meeting
`
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    icon: '📋',
    content: `# {{title}}

## Overview


## Goals
- 

## Timeline
| Phase | Duration | Status |
|-------|----------|--------|
|       |          |        |

## Resources


## Risks
`
  },
  {
    id: 'daily-note',
    name: 'Daily Note',
    icon: '📅',
    content: `# {{date}}

## Tasks
- [ ] 

## Notes


## Journal

`
  }
];

// Template Picker
const TemplatePicker = ({ onSelect }) => {
  return (
    <Dialog>
      <DialogTitle>Choose a Template</DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-3 gap-4">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="template-card"
            >
              <div className="text-4xl mb-2">{template.icon}</div>
              <div className="font-medium">{template.name}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Features**:
- 20+ built-in templates
- Variable substitution ({{date}}, {{title}})
- Custom templates
- Template marketplace (Phase 7)

**Effort**: 20 hours

---

#### **5.4 Publishing (Public Docs)** ⭐ SHARING

**Why**: Share docs with non-collaborators

```typescript
// Publishing flow
const publishDocument = async (documentId: string) => {
  // Generate public slug
  const slug = generateSlug(document.title);
  
  // Create public version
  const publicDoc = await fetch('/api/v1/documents/publish', {
    method: 'POST',
    body: JSON.stringify({
      document_id: documentId,
      slug,
      allow_comments: true,
      password_protected: false
    })
  });
  
  // Public URL: https://mdreader.app/p/{slug}
  const publicUrl = `https://mdreader.app/p/${slug}`;
  
  return publicUrl;
};

// Public view (no login required)
const PublicDocumentView = ({ slug }) => {
  const doc = usePublicDocument(slug);
  
  return (
    <div className="public-doc">
      <header>
        <h1>{doc.title}</h1>
        <div className="meta">
          By {doc.author} · {doc.views} views
        </div>
      </header>
      
      <div className="content">
        <MarkdownRenderer content={doc.content} />
      </div>
      
      {doc.allow_comments && (
        <CommentsSection documentId={doc.id} />
      )}
    </div>
  );
};
```

**Features**:
- Public URL (https://mdreader.app/p/{slug})
- SEO optimized
- Optional password protection
- Comments on public docs
- View analytics
- Custom domains (paid)

**Effort**: 30 hours

---

#### **5.5 Advanced Search** ⭐ DISCOVERY

**Why**: Find anything, fast

```typescript
// Advanced search with Fuse.js
import Fuse from 'fuse.js';

const AdvancedSearch = () => {
  const documents = useDocuments();
  const [query, setQuery] = useState('');
  
  const fuse = useMemo(() => {
    return new Fuse(documents, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'tags', weight: 1.5 }
      ],
      threshold: 0.3,
      includeMatches: true,
      minMatchCharLength: 2
    });
  }, [documents]);
  
  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query);
  }, [query, fuse]);
  
  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search documents... (Cmd+Shift+F)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <div className="results">
        {results.map(({ item, matches }) => (
          <SearchResult 
            key={item.id}
            document={item}
            matches={matches}
          />
        ))}
      </div>
    </div>
  );
};
```

**Features**:
- Full-text search
- Fuzzy matching
- Search in titles, content, tags
- Highlight matches
- Filter by date, folder, tags
- Keyboard shortcuts (Cmd+Shift+F)

**Effort**: 20 hours

---

#### **Phase 5 Summary**

**Deliverables**:
- ✅ Command Palette (Cmd+K)
- ✅ Graph View (visualize connections)
- ✅ Templates System (20+ templates)
- ✅ Publishing (public docs)
- ✅ Advanced Search (fuzzy matching)

**Total Effort**: 120 hours (2 weeks)  
**Risk**: Low (proven patterns)  
**Impact**: 🔥 **MARKET DIFFERENTIATION**

---

### **Phase 6: Scale & Polish (1 week)** 🆕 PRODUCTION READY

**Goal**: Ship with confidence

#### **6.1 Performance Monitoring**

```typescript
// Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Performance monitoring
const measurePerformance = (metric: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  
  // Send to analytics
  trackMetric('performance', {
    metric,
    duration,
    threshold: duration > 1000 ? 'slow' : 'fast'
  });
};
```

#### **6.2 Analytics Dashboard**

```typescript
// Track key metrics
const trackEvent = (event: string, properties?: object) => {
  // PostHog, Mixpanel, or custom
  analytics.track(event, {
    ...properties,
    user_id: user?.id,
    workspace_id: currentWorkspace?.id,
    platform: isPlatform() // web, desktop, mobile
  });
};

// Key events
trackEvent('document_created', { storage_mode: 'LocalOnly' });
trackEvent('collaboration_started', { participants: 2 });
trackEvent('ai_feature_used', { feature: 'mindmap' });
trackEvent('export', { format: 'pdf' });
```

#### **6.3 Error Boundaries**

```typescript
// Graceful degradation
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
    
    // Show user-friendly error
    this.setState({ hasError: true });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### **6.4 Performance Optimization**

```typescript
// Lazy load heavy components
const MindmapCanvas = lazy(() => import('./MindmapCanvas'));
const GraphView = lazy(() => import('./GraphView'));
const PresentationMode = lazy(() => import('./PresentationMode'));

// Virtual scrolling for large document lists
import { FixedSizeList } from 'react-window';

const DocumentList = ({ documents }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={documents.length}
      itemSize={60}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <DocumentItem document={documents[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

**Deliverables**:
- ✅ Error tracking (Sentry)
- ✅ Analytics (PostHog/Mixpanel)
- ✅ Performance monitoring
- ✅ Error boundaries
- ✅ Lazy loading
- ✅ Virtual scrolling

**Effort**: 40 hours (1 week)

---

### **Phase 7: Growth Features (Ongoing)** 🆕 SCALE

**Goal**: Capture more market

#### **7.1 Mobile Apps (iOS + Android)**

**Strategy**: React Native (separate codebase, shared logic)

```typescript
// Shared business logic
packages/
├─ core/              (TypeScript, platform-agnostic)
│  ├─ document.ts
│  ├─ sync.ts
│  └─ ai.ts
│
├─ web/               (React + Vite)
├─ desktop/           (Tauri)
└─ mobile/            (React Native)
```

**Timeline**: 8 weeks  
**Priority**: Medium (after Phase 1-6)

---

#### **7.2 Plugins/Extensions System**

```typescript
// Plugin API
interface MDReaderPlugin {
  id: string;
  name: string;
  version: string;
  
  activate(context: PluginContext): void;
  deactivate(): void;
}

// Example plugin
class SpellCheckPlugin implements MDReaderPlugin {
  id = 'spell-check';
  name = 'Spell Check';
  version = '1.0.0';
  
  activate(context: PluginContext) {
    context.editor.on('update', ({ editor }) => {
      const mistakes = checkSpelling(editor.getText());
      highlightMistakes(mistakes);
    });
  }
  
  deactivate() {
    // Cleanup
  }
}

// Plugin marketplace
https://mdreader.app/plugins
```

**Timeline**: 6 weeks  
**Priority**: High (extensibility = ecosystem)

---

#### **7.3 Team/Organization Features**

```typescript
// Organization model
interface Organization {
  id: string;
  name: string;
  slug: string;
  
  members: Member[];
  teams: Team[];
  workspaces: Workspace[];
  
  billing: {
    plan: 'free' | 'team' | 'enterprise';
    seats: number;
    billing_email: string;
  };
}

// Team features
- Shared workspaces
- Role-based access control (Admin, Editor, Viewer)
- Team analytics
- Centralized billing
- SSO (SAML)
```

**Timeline**: 4 weeks  
**Priority**: High (B2B revenue)

---

#### **7.4 Advanced Export**

```typescript
// Export formats
const exportDocument = async (doc: Document, format: ExportFormat) => {
  switch (format) {
    case 'pdf':
      return await generatePDF(doc);
    case 'docx':
      return await generateWord(doc);
    case 'html':
      return generateHTML(doc);
    case 'slides':
      return await generateSlides(doc); // PowerPoint
    case 'notion':
      return await exportToNotion(doc);
    case 'confluence':
      return await exportToConfluence(doc);
  }
};

// Export with styling
- Custom fonts
- Themes
- Page numbers
- Table of contents
- Cover page
```

**Timeline**: 3 weeks  
**Priority**: Medium (reduces lock-in fear)

---

## 🏆 **Competitive "Win" Features Matrix**

| Feature | MDReader | Obsidian | Notion | Typora | VS Code |
|---------|----------|----------|--------|--------|---------|
| **Local-First** | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Real-Time Collab** | ✅ | ❌ | ✅ | ❌ | ⚠️ |
| **WYSIWYG Editor** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **AI Mindmaps** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Graph View** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Command Palette** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Templates** | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| **Publishing** | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| **Desktop App** | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Mobile Apps** | 🔜 | ⚠️ | ✅ | ❌ | ❌ |
| **Plugins** | 🔜 | ✅ | ❌ | ❌ | ✅ |
| **No Login Required** | ✅ | ✅ | ❌ | ✅ | ✅ |

**Key**: ✅ Full Support | ⚠️ Partial | ❌ Not Available | 🔜 Planned

---

## 🎯 **Product Differentiation Strategy**

### **What Makes MDReader Unique**

```
1. AI-Powered Mindmaps (UNIQUE)
   → Auto-generate from markdown
   → No competitor has this

2. Hybrid Storage Modes (UNIQUE)
   → LocalOnly/CloudOnly/HybridSync per doc
   → No competitor offers this granularity

3. Real-Time Collab + Local-First (RARE)
   → Obsidian = local, no collab
   → Notion = collab, not local-first
   → MDReader = BOTH

4. WYSIWYG + Markdown (BEST)
   → Typora = WYSIWYG, no collab
   → VS Code = markdown, developer-only
   → MDReader = beautiful + powerful

5. No Login Required (FRICTION-FREE)
   → Notion/Linear require login
   → MDReader = instant start

6. Tauri Platform (EFFICIENT)
   → Obsidian/VS Code = Electron (heavy)
   → MDReader = Tauri (10x lighter)
```

---

## 📊 **Timeline Summary**

```
┌─────────────────────────────────────────────────────────────┐
│                    ENHANCED ROADMAP                         │
└─────────────────────────────────────────────────────────────┘

Week 0:     Phase 0 - Landing Page Integration ✅ (NEW)
            └─ Open file, drop zone, start writing, AI generate

Week 1-3:   Phase 1 - Yjs + Hocuspocus ✅
            └─ Real-time collaboration
            └─ Offline sync with CRDT merge
            └─ Collaborative cursors

Week 4-5:   Phase 2 - Storage Modes ✅
            └─ LocalOnly/HybridSync/CloudOnly per doc
            └─ Mode switcher UI

Week 6-7:   Phase 3 - Guest Mode → Login ✅
            └─ No login required to start
            └─ Seamless migration to cloud

Week 8-9:   Phase 4 - Tauri Desktop ✅
            └─ Native filesystem storage
            └─ OS integration

Week 10-11: Phase 5 - Win Features ✅ (NEW)
            └─ Command Palette (Cmd+K)
            └─ Graph View
            └─ Templates System
            └─ Publishing
            └─ Advanced Search

Week 12:    Phase 6 - Scale & Polish ✅ (NEW)
            └─ Performance monitoring
            └─ Error tracking
            └─ Analytics
            └─ Optimization

Week 13+:   Phase 7 - Growth ✅ (NEW)
            └─ Mobile apps (8 weeks)
            └─ Plugins (6 weeks)
            └─ Team features (4 weeks)
            └─ Advanced export (3 weeks)

────────────────────────────────────────────────────────
TOTAL: 13 weeks to market leadership + ongoing growth
```

**Critical Path**:
1. Phase 0 (Landing) → Blocks first impression
2. Phase 1 (Collaboration) → Validates architecture
3. Phase 3 (Guest Mode) → Blocks user onboarding
4. Phase 5 (Win Features) → Competitive moat
5. Phase 6 (Polish) → Production readiness

**Recommended Order**: Phase 0 → 1 → 3 → 4 → 2 → 5 → 6 → 7

---

## 💰 **Monetization Strategy**

### **Tier 1: Free** (Generous)

```
✅ Unlimited local documents
✅ Guest mode
✅ Desktop app
✅ Folders
✅ Search
✅ Export .md
✅ AI features (bring your own key)
✅ Offline mode
✅ Graph view (local only)

→ Goal: Massive adoption
→ Target: 100K users
```

### **Tier 2: Pro** ($10/month)

```
✅ Everything in Free
✅ Cloud sync (unlimited)
✅ Cross-device
✅ Version history
✅ Collaboration (5 users)
✅ Publishing (unlimited)
✅ Advanced search
✅ Priority support
✅ Custom themes

→ Goal: Individual power users
→ Target: 10K users (10% conversion)
```

### **Tier 3: Team** ($20/user/month)

```
✅ Everything in Pro
✅ Team workspaces
✅ Unlimited collaboration
✅ Advanced permissions
✅ Team analytics
✅ Centralized billing
✅ SSO (SAML)
✅ Dedicated support

→ Goal: B2B revenue
→ Target: 100 teams (500 users)
```

### **Revenue Projection**

```
Year 1:
- Free:  100,000 users × $0 = $0
- Pro:   10,000 users × $10 × 12 = $1.2M
- Team:  500 users × $20 × 12 = $120K
─────────────────────────────────────────
TOTAL: $1.32M ARR

Year 2:
- Free:  500,000 users × $0 = $0
- Pro:   50,000 users × $10 × 12 = $6M
- Team:  2,500 users × $20 × 12 = $600K
─────────────────────────────────────────
TOTAL: $6.6M ARR
```

---

## 🎯 **What You Get**

### **After Phase 0 (1 week)**:
```
✅ Landing page integration
✅ Open .md files from computer
✅ Drag & drop import
✅ Start writing (no login)
✅ AI generate
```

### **After Phase 1 (3 weeks)**:
```
✅ Real-time collaboration (Google Docs-quality)
✅ Offline editing with automatic merge
✅ Collaborative cursors
✅ < 100ms sync latency
✅ CRDT conflict resolution (automatic)
```

### **After Phase 3 (5 weeks)**:
```
✅ Everything from Phase 0 + 1
✅ Guest mode (no login required)
✅ Seamless migration to cloud
✅ Frictionless onboarding
```

### **After Phase 2 (7 weeks)**:
```
✅ Everything from Phase 0 + 1 + 3
✅ Per-document storage control
✅ Privacy-first (choose what syncs)
✅ LocalOnly/HybridSync/CloudOnly modes
```

### **After Phase 4 (9 weeks)**:
```
✅ Everything from Phase 0 + 1 + 2 + 3
✅ Native desktop app (Mac/Windows/Linux)
✅ Filesystem storage (unlimited)
✅ OS-level integration
```

### **After Phase 5 (11 weeks)**:
```
✅ Everything from Phase 0-4
✅ Command Palette (Cmd+K)
✅ Graph View
✅ Templates (20+)
✅ Publishing
✅ Advanced Search
→ COMPETITIVE MOAT
```

### **After Phase 6 (12 weeks)**:
```
✅ Everything from Phase 0-5
✅ Error tracking
✅ Analytics
✅ Performance optimized
→ PRODUCTION READY
```

### **After Phase 7 (13+ weeks)**:
```
✅ Everything from Phase 0-6
✅ Mobile apps
✅ Plugins
✅ Team features
✅ Advanced export
→ CATEGORY LEADER
```

---

## 💻 **Tech Stack (Final)**

```
Frontend:
  ├─ React 18.3
  ├─ Vite 5.4
  ├─ TypeScript 5.8
  ├─ TipTap 3.6+ (WYSIWYG)
  ├─ Yjs 13.6 (CRDT)
  ├─ @hocuspocus/provider (real-time sync)
  ├─ y-indexeddb (local persistence)
  ├─ Dexie.js (metadata storage)
  ├─ Zustand (state management)
  ├─ Fuse.js (fuzzy search) ← NEW
  ├─ react-force-graph (graph view) ← NEW
  └─ Tauri 2.8 (desktop platform)

Backend:
  ├─ Hocuspocus (Node.js, collaboration server)
  ├─ FastAPI (Python, app server)
  ├─ PostgreSQL (user data + Yjs persistence)
  └─ Redis (sessions, caching)

Monitoring & Analytics: ← NEW
  ├─ Sentry (error tracking)
  ├─ PostHog/Mixpanel (analytics)
  └─ Custom performance monitoring

Infrastructure:
  ├─ Docker (containerization)
  ├─ Nginx (reverse proxy)
  └─ AWS/DigitalOcean (hosting)
```

---

## 🔥 **Cutting-Edge Features**

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| **Per-Doc Storage Modes** | IndexedDB + Hocuspocus | Industry-first, max privacy |
| **Yjs CRDT** | @hocuspocus/provider | Zero conflicts, better undo/redo |
| **Tauri Platform** | Rust-based desktop | 10x smaller than Electron |
| **Mindmap Auto-Gen** | markmap + d3 + elk | Visual thinking from markdown |
| **Offline-First** | y-indexeddb + Dexie | 100% offline capability |
| **Guest Mode** | Local-only → cloud migration | Frictionless onboarding |
| **Command Palette** | Cmd+K | Power user productivity |
| **Graph View** | react-force-graph | Knowledge connections |
| **Templates System** | 20+ built-in | Fast start |
| **Publishing** | Public URLs + SEO | Easy sharing |
| **Comments System** | Yjs Y.Array | Collaborative annotations |
| **Presentation Mode** | React Flow + blocks | Slides from markdown |

---

## ✅ **Next Steps**

### **Immediate Actions** (This Week):

**Start with Phase 0**: Landing Page Integration

1. **Day 1-2**: Tauri command for opening .md files
   ```bash
   # Implement open_markdown_file() command
   # Test native file picker on Mac/Windows
   ```

2. **Day 2-3**: Drag & drop zone for file import
   ```bash
   # Implement handleFileDrop()
   # Test with multiple .md files
   ```

3. **Day 3-4**: "Start Writing" action
   ```bash
   # Implement handleStartWriting()
   # Test document creation without login
   ```

4. **Day 4-5**: AI Generate action
   ```bash
   # Implement handleAIGenerate()
   # Test with AI API keys
   ```

**Next Week**: Start Phase 1 (Hocuspocus deployment)

---

## 📊 **Success Metrics**

| Metric | Week 9 (MVP) | Week 12 (Full) | Week 26 (6mo) |
|--------|--------------|----------------|---------------|
| **Users** | 1,000 | 10,000 | 100,000 |
| **Docs Created** | 50K | 500K | 5M |
| **Collaborations** | 100 | 1,000 | 10,000 |
| **Pro Users** | 10 | 500 | 10,000 |
| **MRR** | $100 | $5K | $100K |
| **NPS** | 40+ | 50+ | 60+ |

---

## 🎤 **Decision: Start Phase 0!**

**I recommend**: Start with Phase 0 (Landing Page) because:
- ✅ Quick win (1 week)
- ✅ First impression matters
- ✅ Validates Tauri integration
- ✅ Builds momentum for team

**Then proceed**: Phase 1 (Collaboration) → Phase 3 (Guest Mode) → Phase 4 (Desktop) → Phase 2 (Storage) → Phase 5 (Win Features) → Phase 6 (Polish) → Phase 7 (Growth)

**Your call**: Ready to start Phase 0? 🚀

---

**Status**: 🟢 **READY TO EXECUTE**  
**Next Step**: Begin Phase 0 implementation (Landing Page Integration)  
**Document Created**: December 10, 2025  
**Version**: 2.0 (Enhanced with competitive "win" features)  
**Related Documents**: See `/planning_docs/` folder for detailed execution plans

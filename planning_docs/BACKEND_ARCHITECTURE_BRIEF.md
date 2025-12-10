# 🏗️ **MDReader Backend Architecture - Brief**

**Date**: December 10, 2025  
**Purpose**: Short overview of service layers and communication  
**Status**: Current implementation + planned

---

## 📊 **Service Layers (3-Tier)**

```
┌────────────────────────────────────────────────┐
│  FRONTEND (React + Tauri)                      │
│  ├─ TipTap Editor                              │
│  ├─ IndexedDB (local cache)                    │
│  └─ Yjs Y.Doc (CRDT state)                     │
└────────────────────────────────────────────────┘
           ↓ HTTP/REST          ↓ WebSocket
┌─────────────────────────┬────────────────────────┐
│  LAYER 1: FastAPI       │  LAYER 2: Hocuspocus   │
│  (Application Server)   │  (Collaboration Server)│
│  Port: 7001             │  Port: 1234            │
│  Python                 │  Node.js               │
└─────────────────────────┴────────────────────────┘
           ↓                          ↓
┌──────────────────────────────────────────────────┐
│  LAYER 3: Data Layer                             │
│  ├─ PostgreSQL (metadata, users, auth)          │
│  ├─ PostgreSQL (Yjs snapshots)                  │
│  └─ Redis (sessions, cache, queues)             │
└──────────────────────────────────────────────────┘
```

---

## 🔄 **What Each Layer Does**

### **Layer 1: FastAPI (Port 7001)** 📦

**Handles**: Metadata, auth, business logic

```python
Responsibilities:
├─ Authentication (JWT tokens)
│  ├─ /api/v1/auth/login
│  ├─ /api/v1/auth/register
│  └─ /api/v1/auth/refresh
│
├─ Document Metadata (NOT content)
│  ├─ POST /api/v1/documents (create)
│  ├─ GET /api/v1/documents/{id} (metadata only)
│  ├─ PATCH /api/v1/documents/{id} (title, folder, starred)
│  └─ DELETE /api/v1/documents/{id}
│
├─ Workspaces
│  ├─ GET /api/v1/workspaces
│  └─ POST /api/v1/workspaces
│
├─ Folders
│  ├─ GET /api/v1/folders/tree
│  └─ POST /api/v1/folders
│
├─ Collaboration Tokens
│  └─ GET /api/v1/documents/{id}/collab-token (for Hocuspocus)
│
└─ Publishing
   └─ POST /api/v1/documents/publish
```

**What it does NOT handle**:
- ❌ Document content (Yjs handles this)
- ❌ Real-time sync (Hocuspocus handles this)
- ❌ Binary storage (we use filesystem/S3)

---

### **Layer 2: Hocuspocus (Port 1234)** 🔌

**Handles**: Real-time document content sync

```typescript
Responsibilities:
├─ WebSocket connections (ws://localhost:1234)
├─ Yjs CRDT synchronization
├─ Collaborative cursors (awareness)
├─ Persist Yjs state to PostgreSQL
└─ Auth verification (via JWT from FastAPI)

NOT in current implementation (Future):
⏳ Hocuspocus server deployment
⏳ Yjs integration with TipTap
⏳ Real-time collaboration
```

**Current State**: 🟡 **NOT DEPLOYED YET**
- Phase 1 (Week 1-3) will deploy this
- For now: Using custom SyncManager

---

### **Layer 3: Data Layer** 💾

#### **PostgreSQL (Primary Database)**

```sql
Tables:
├─ users
│  ├─ id, email, password_hash
│  └─ created_at, updated_at
│
├─ workspaces
│  ├─ id, name, owner_id, slug
│  └─ created_at
│
├─ documents (METADATA ONLY, not content)
│  ├─ id, title, workspace_id, folder_id
│  ├─ is_starred, content_type
│  ├─ created_at, updated_at
│  └─ version (for optimistic locking)
│
├─ folders
│  ├─ id, name, icon, workspace_id, parent_id
│  └─ position, created_at
│
├─ document_collab_state (Yjs snapshots)
│  ├─ id, document_name
│  ├─ yjs_state (bytea) ← The actual content
│  └─ updated_at
│
└─ refresh_tokens
   ├─ id, user_id, token
   └─ expires_at
```

**Key Point**: 
- `documents` table = metadata (title, folder, starred)
- `document_collab_state` = actual content (Yjs binary)

---

#### **Redis (Cache + Sessions)**

```
Keys:
├─ session:{user_id} → JWT refresh token
├─ blacklist:{jti} → Invalidated tokens
├─ cache:workspaces:{user_id} → Workspace list (5 min TTL)
├─ viewers:{slug} → Active viewers for published docs
└─ sync_queue:{workspace_id} → Pending sync operations
```

---

## 🔄 **Communication Flow**

### **Flow 1: User Login**

```
Frontend                 FastAPI                PostgreSQL
   │                        │                       │
   ├─ POST /auth/login ────→│                       │
   │  { email, password }   │                       │
   │                        ├─ Verify password ────→│
   │                        │                       │
   │                        │←── user data ─────────┤
   │                        │                       │
   │                        ├─ Generate JWT         │
   │                        ├─ Store refresh →Redis │
   │                        │                       │
   │←─ { access, refresh }──┤                       │
   │                        │                       │
```

---

### **Flow 2: Create Document (LocalOnly)**

```
Frontend                 IndexedDB
   │                        │
   ├─ createDocument() ────→│
   │                        │
   │                        ├─ Store metadata
   │                        ├─ Create Y.Doc
   │                        ├─ y-indexeddb persistence
   │                        │
   │←── document ───────────┤
   │                        │
   
No backend involved! ✅
```

---

### **Flow 3: Create Document (HybridSync)**

```
Frontend          FastAPI          PostgreSQL      Hocuspocus
   │                 │                 │                │
   ├─ 1. POST ──────→│                 │                │
   │  /documents     │                 │                │
   │  {title,        │                 │                │
   │   workspace}    │                 │                │
   │                 ├─ 2. INSERT ────→│                │
   │                 │                 │                │
   │                 │←─ 3. doc_id ────┤                │
   │                 │                 │                │
   │←─ 4. metadata ──┤                 │                │
   │  {id, title}    │                 │                │
   │                 │                 │                │
   ├─ 5. GET collab-token ────────────→│                │
   │                 │                 │                │
   │←─ 6. {jwt} ─────┤                 │                │
   │                 │                 │                │
   ├─ 7. WebSocket connect ────────────────────────────→│
   │  ws://localhost:1234/doc:{id}                      │
   │  Authorization: Bearer {jwt}                       │
   │                 │                 │                │
   │                 │                 │                ├─ 8. Verify JWT
   │                 │                 │                │    (call FastAPI)
   │                 │                 │                │
   │                 │                 │                ├─ 9. Load Yjs
   │                 │                 │                │    from PG
   │                 │                 │                │
   │←─ 10. Connected ────────────────────────────────────┤
   │                 │                 │                │
   ├─ 11. Type "Hello" (Yjs update) ──────────────────→│
   │                 │                 │                │
   │                 │                 │                ├─ 12. Save to PG
   │                 │                 │                │
```

---

### **Flow 4: Edit Document (Real-time)**

```
User A (Frontend)      Hocuspocus       User B (Frontend)
       │                   │                    │
       ├─ Type "Hello" ───→│                    │
       │  (Yjs update)     │                    │
       │                   ├─ Broadcast ───────→│
       │                   │                    │
       │                   │                    ├─ Apply update
       │                   │                    │  (CRDT merge)
       │                   │                    │
       │                   │                    │  Sees "Hello" ✅
       │                   │                    │
       │                   │←─ Type "World" ────┤
       │                   │   (Yjs update)     │
       │                   │                    │
       │←─ Broadcast ──────┤                    │
       │                   │                    │
       ├─ Apply update     │                    │
       │  (CRDT merge)     │                    │
       │                   │                    │
       Sees "World" ✅     │                    │
       │                   │                    │
```

**Result**: Both see "Hello World" (CRDT automatic merge)

---

### **Flow 5: Offline → Online Sync**

```
Frontend (Offline)    IndexedDB       FastAPI       Hocuspocus
       │                  │               │               │
       ├─ Edit doc ──────→│               │               │
       │                  │               │               │
       │                  ├─ Save locally │               │
       │                  ├─ Queue change │               │
       │                  │               │               │
       │  [Network returns]               │               │
       │                  │               │               │
       ├─ Detect online ──┤               │               │
       │                  │               │               │
       ├─ SyncManager.syncNow()           │               │
       │                  │               │               │
       ├─ PATCH /documents/{id} ─────────→│               │
       │  (metadata only)                 │               │
       │                  │               │               │
       │←─ 200 OK ────────────────────────┤               │
       │                  │               │               │
       ├─ Reconnect WebSocket ────────────────────────────→│
       │                  │               │               │
       │                  │               │               ├─ Yjs merge
       │                  │               │               │  (CRDT!)
       │                  │               │               │
       │←─ Synced ─────────────────────────────────────────┤
       │                  │               │               │
```

---

## 🎯 **What Fits Where**

### **FastAPI Handles** 📦
```
✅ User authentication (JWT)
✅ Document metadata (title, folder, starred)
✅ Workspace CRUD
✅ Folder hierarchy
✅ Permissions & RBAC
✅ Publishing (public docs)
✅ File uploads (images, attachments)
✅ Export (PDF, Word)
✅ Analytics events
✅ Search indexing (trigger)

❌ NOT: Document content (Yjs does this)
❌ NOT: Real-time sync (Hocuspocus does this)
```

---

### **Hocuspocus Handles** 🔌
```
✅ WebSocket connections
✅ Yjs CRDT synchronization
✅ Real-time document content
✅ Collaborative cursors
✅ Conflict-free merging
✅ Offline → Online merge

❌ NOT: Authentication (FastAPI does this)
❌ NOT: Metadata (FastAPI does this)
```

---

### **PostgreSQL Handles** 💾
```
✅ User accounts
✅ Workspaces
✅ Document metadata
✅ Folders
✅ Yjs snapshots (document_collab_state)
✅ Version history
✅ Published documents

❌ NOT: Sessions (Redis does this)
❌ NOT: Active connections (Hocuspocus does this)
```

---

### **Redis Handles** ⚡
```
✅ Session tokens (JWT refresh)
✅ Token blacklist (logout)
✅ Cache (workspaces, folders)
✅ Pub/Sub (notifications)
✅ Rate limiting
✅ Sync queue (temporary)

❌ NOT: Permanent data (PostgreSQL does this)
```

---

## 🔑 **Key Architectural Decisions**

### **1. Separation of Concerns** ✅
```
Metadata (FastAPI)  ≠  Content (Hocuspocus)

Why?
- Metadata changes rarely (title, folder)
- Content changes constantly (every keystroke)
- Different protocols: REST vs WebSocket
- Different storage: Relational vs Binary
```

---

### **2. Dual Sync System** ✅
```
System 1: Yjs + Hocuspocus
→ For: Real-time document content
→ Protocol: WebSocket
→ Storage: Binary (Yjs state)

System 2: Custom SyncManager
→ For: Metadata, folders, LocalOnly docs
→ Protocol: REST (HTTP)
→ Storage: JSON
```

**Why Two Systems?**
- Yjs perfect for content (CRDT, conflict-free)
- REST perfect for metadata (structured, searchable)

---

### **3. Local-First, Cloud-Optional** ✅
```
Local:
- IndexedDB (metadata cache)
- y-indexeddb (Yjs persistence)
- Tauri FS (desktop files)

Cloud (Optional):
- PostgreSQL (backup, sync)
- Hocuspocus (real-time)

User decides per document:
- LocalOnly (never syncs)
- HybridSync (local + cloud)
- CloudOnly (cloud primary)
```

---

## 📊 **Current State vs Target**

| Component | Current | Target (Phase 1) |
|-----------|---------|------------------|
| FastAPI | ✅ Deployed | ✅ Keep |
| PostgreSQL | ✅ Running | ✅ Keep |
| Redis | ✅ Running | ✅ Keep |
| Hocuspocus | ❌ Not deployed | 🎯 Deploy (Week 1-3) |
| Custom SyncManager | ✅ Working | ✅ Keep (for metadata) |
| Yjs Integration | ⚠️ Partial (local only) | 🎯 Full (local + cloud) |

---

## 🚀 **Next Steps (Phase 1)**

### **Week 1-3: Deploy Hocuspocus**
```bash
1. Create hocuspocus-server/ (Node.js)
2. Install @hocuspocus/server
3. Connect to PostgreSQL (document_collab_state)
4. Implement JWT auth (verify with FastAPI)
5. Deploy on port 1234
6. Frontend: Connect TipTap to Hocuspocus
7. Test: Real-time collaboration (< 100ms)
```

**After Phase 1**:
- ✅ Real-time collaboration works
- ✅ FastAPI handles metadata
- ✅ Hocuspocus handles content
- ✅ PostgreSQL stores both
- ✅ Redis caches sessions

---

## 📋 **Summary (TL;DR)**

```
3 Layers:

1. FastAPI (7001)
   → Auth, metadata, business logic
   → REST API
   → Python

2. Hocuspocus (1234) [Phase 1]
   → Real-time content sync
   → WebSocket
   → Node.js
   → Yjs CRDT

3. Data Layer
   → PostgreSQL: Metadata + Yjs snapshots
   → Redis: Cache + sessions

Communication:
- Frontend ↔ FastAPI: REST (metadata)
- Frontend ↔ Hocuspocus: WebSocket (content)
- Hocuspocus ↔ FastAPI: HTTP (auth verification)
- Both ↔ PostgreSQL: SQL (storage)
```

---

**Status**: 🟢 **Architecture Defined**  
**Current**: FastAPI + PostgreSQL + Redis (metadata only)  
**Phase 1**: Add Hocuspocus (real-time content)  
**Document Created**: December 10, 2025


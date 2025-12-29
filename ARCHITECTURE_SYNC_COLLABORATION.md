# MDReader Architecture: Sync & Collaboration

> Complete guide to offline/online modes, document sync, sharing, and real-time collaboration.

---

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MDReader Client                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TipTap    │  │    Yjs      │  │  IndexedDB  │  │   React Context     │ │
│  │   Editor    │◄─┤   (CRDT)    │◄─┤   (Local)   │◄─┤   (State Mgmt)      │ │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│                          │                │                                  │
│                          ▼                ▼                                  │
│                   ┌─────────────────────────────┐                           │
│                   │     Sync Services           │                           │
│                   │  • AutoSyncManager          │                           │
│                   │  • SyncModeService          │                           │
│                   │  • SelectiveSyncService     │                           │
│                   └──────────────┬──────────────┘                           │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │   FastAPI       │           │   Hocuspocus    │
          │   Backend       │           │   WebSocket     │
          │   (Port 7001)   │           │   (Port 1234)   │
          └────────┬────────┘           └────────┬────────┘
                   │                             │
                   ▼                             │
          ┌─────────────────┐                    │
          │   PostgreSQL    │◄───────────────────┘
          │   Database      │   (Auth validation)
          └─────────────────┘
```

---

## 👤 User States

### 1. Guest (Not Logged In)

```
┌────────────────────────────────────────────┐
│                 GUEST MODE                 │
├────────────────────────────────────────────┤
│ Storage:      IndexedDB only               │
│ Workspaces:   1 "Local Workspace"          │
│ Documents:    Local-only, never synced     │
│ Sync:         ❌ Disabled                   │
│ Collaboration:❌ Disabled                   │
│ Share:        ❌ Cannot share               │
└────────────────────────────────────────────┘
```

**Data Flow:**
```
User Types → TipTap → Yjs Doc → IndexedDB
                              ↓
                        (stays local)
```

### 2. Logged In (Online)

```
┌────────────────────────────────────────────┐
│              AUTHENTICATED MODE            │
├────────────────────────────────────────────┤
│ Storage:      IndexedDB + PostgreSQL       │
│ Workspaces:   Cloud workspaces + 1 local   │
│ Documents:    Can be local OR cloud-synced │
│ Sync:         ✅ Automatic for cloud docs   │
│ Collaboration:✅ Real-time via WebSocket    │
│ Share:        ✅ Invite by email            │
└────────────────────────────────────────────┘
```

**Data Flow:**
```
User Types → TipTap → Yjs Doc → IndexedDB
                              ↓
                    (if cloud-enabled)
                              ↓
              ┌───────────────┴───────────────┐
              ▼                               ▼
         Hocuspocus                      Backend API
         (real-time)                     (snapshots)
```

### 3. Logged In (Offline)

```
┌────────────────────────────────────────────┐
│              OFFLINE MODE                  │
├────────────────────────────────────────────┤
│ Storage:      IndexedDB (cached cloud data)│
│ Workspaces:   Cached cloud + local         │
│ Documents:    Editable, changes queued     │
│ Sync:         ⏸️ Paused until online        │
│ Collaboration:❌ Disconnected               │
│ Share:        ❌ Pending until online       │
└────────────────────────────────────────────┘
```

**Data Flow:**
```
User Types → TipTap → Yjs Doc → IndexedDB
                              ↓
                     syncStatus: 'modified'
                              ↓
                    (queued in AutoSyncManager)
                              ↓
                     [NETWORK ONLINE EVENT]
                              ↓
                    Auto-push to backend
```

---

## 📄 Document Sync Modes

Each document has a `syncMode` that controls its behavior:

| Mode | Description | Auto-Sync | Collaboration |
|------|-------------|-----------|---------------|
| `local-only` | Never syncs to cloud | ❌ | ❌ |
| `cloud-enabled` | Auto-syncs when online | ✅ | ✅ |
| `pending-sync` | First sync in progress | ⏳ | ❌ |

### Document Sync Status

| Status | Meaning | UI Badge |
|--------|---------|----------|
| `local` | Only exists locally | 🔒 Local |
| `synced` | Matches cloud version | ☁️ Synced |
| `syncing` | Currently uploading | 🔄 Syncing |
| `modified` | Local changes pending | ⚠️ Modified |
| `conflict` | Version mismatch | ❗ Conflict |
| `error` | Sync failed | ❌ Error |

---

## 🔄 Sync Flows

### Flow 1: Create Document (Logged In)

```
User clicks "New Doc"
        ↓
Document created in IndexedDB
        ↓
syncMode = 'pending-sync'
        ↓
Auto-push to backend (after 500ms)
        ↓
Backend returns cloudId
        ↓
syncMode = 'cloud-enabled'
syncStatus = 'synced'
        ↓
Future edits auto-sync
```

### Flow 2: Enable Cloud Sync (Existing Local Doc)

```
User clicks "Enable Cloud Sync"
        ↓
syncStatus = 'syncing'
        ↓
Push document to backend
        ↓
Backend creates document, returns ID
        ↓
Store cloudId locally
        ↓
syncMode = 'cloud-enabled'
syncStatus = 'synced'
        ↓
Register with AutoSyncManager
```

### Flow 3: Auto-Sync on Edit

```
User types in editor
        ↓
TipTap onChange fires
        ↓
Yjs document updated
        ↓
IndexedDB updated (immediate)
        ↓
AutoSyncManager.onDocumentModified() [debounced 2s]
        ↓
If online + cloud-enabled:
    Push to backend
    Update syncStatus = 'synced'
Else:
    Queue for later
    syncStatus = 'modified'
```

### Flow 4: Network Recovery Sync

```
Browser fires 'online' event
        ↓
NetworkStatusService detects
        ↓
AutoSyncManager.onNetworkOnline()
        ↓
Get all docs where:
    syncMode = 'cloud-enabled'
    syncStatus = 'modified'
        ↓
For each doc:
    Push to backend
    Update syncStatus = 'synced'
        ↓
Dispatch 'sync:queue-processed' event
```

---

## 🤝 Collaboration Flow

### Real-Time Collaboration Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐     WebSocket      ┌─────────────┐
│   User A    │◄──────────────────►│ Hocuspocus  │◄──────────────────►│   User B    │
│   Browser   │                    │   Server    │                    │   Browser   │
└─────────────┘                    └──────┬──────┘                    └─────────────┘
      │                                   │                                  │
      │ Yjs Changes                       │ Broadcast                        │ Yjs Changes
      ▼                                   ▼                                  ▼
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  IndexedDB  │                    │ In-Memory   │                    │  IndexedDB  │
│   (Local)   │                    │  Yjs Doc    │                    │   (Local)   │
└─────────────┘                    └─────────────┘                    └─────────────┘
```

### Collaboration Connection Flow

```
User A opens document
        ↓
YjsDocumentManager.getDocument(docId)
        ↓
Create HocuspocusProvider
        ↓
Connect to ws://localhost:1234
        ↓
Send JWT token for auth
        ↓
Hocuspocus validates:
    1. JWT signature (SECRET_KEY)
    2. User access (document_shares table)
        ↓
If valid:
    Join document "room"
    Sync Yjs state with other clients
        ↓
Real-time updates flow both ways
```

### Collaboration Permission Levels

| Role | View | Comment | Edit | Admin | Owner |
|------|------|---------|------|-------|-------|
| Read doc | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add comments | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit content | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage shares | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete doc | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📤 Sharing Flow

### Share Document with User

```
Owner clicks "Share"
        ↓
Enter email + select role
        ↓
POST /api/v1/documents/{id}/share
        ↓
Backend creates DocumentShare record:
    principal_id = target_user_id
    principal_type = 'user'
    role = 'editor' (or viewer/admin)
        ↓
Send invitation email (optional)
        ↓
Target user sees doc in "Shared with me"
```

### Share Link (Anonymous Access)

```
Owner clicks "Create Share Link"
        ↓
Select mode: view | comment | edit
        ↓
POST /api/v1/share/links
        ↓
Backend creates ShareLink:
    token = random_string
    mode = 'edit'
    expires_at = optional
        ↓
Return URL: /share?token=abc123
        ↓
Anyone with link can access
(Hocuspocus validates via x-share-token header)
```

---

## ⚔️ Conflict Resolution

### When Conflicts Occur

```
Conflict happens when:
    localVersion > 0
    AND cloudVersion > localVersion
    AND content differs

Example:
    User A edits offline: v1 → v2 (local)
    User B edits online:  v1 → v2 (cloud)
    User A comes online:  v2 local ≠ v2 cloud
                              ↓
                         CONFLICT!
```

### CRDT Resolution (Yjs)

For **real-time collaboration**, Yjs handles conflicts automatically:

```
User A types "Hello"     User B types "World"
       ↓                        ↓
   Yjs Op A                 Yjs Op B
       ↓                        ↓
       └────────┬───────────────┘
                ↓
         Hocuspocus merges
                ↓
         "Hello World"
                ↓
    Both clients receive merged state
```

**Why it works:** CRDTs (Conflict-free Replicated Data Types) guarantee convergence. Operations are commutative and idempotent.

### Snapshot Conflict Resolution

For **backend snapshots** (not real-time):

```
Push snapshot to backend
        ↓
Backend checks yjs_version:
    If request.yjs_version < document.yjs_version:
        Return 409 Conflict
        ↓
Client options:
    1. Pull latest, merge, push again
    2. Force overwrite (not recommended)
    3. Show conflict UI to user
```

### Conflict UI

```
┌─────────────────────────────────────────────┐
│        ⚠️ Document Conflict Detected        │
├─────────────────────────────────────────────┤
│                                             │
│  Your version:     Last edited 2 min ago   │
│  Cloud version:    Last edited 5 min ago   │
│                                             │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Keep Mine   │  │ Keep Cloud Version  │  │
│  └─────────────┘  └─────────────────────┘  │
│                                             │
│         ┌─────────────────────┐            │
│         │  View Differences   │            │
│         └─────────────────────┘            │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Data Storage

### IndexedDB Structure

```
mdreader-offline (Dexie)
├── workspaces
│   ├── id (primary)
│   ├── name
│   ├── icon
│   ├── syncStatus
│   └── cloudId
│
├── documents
│   ├── id (primary)
│   ├── workspaceId (index)
│   ├── title
│   ├── content
│   ├── syncMode        ← NEW
│   ├── syncStatus
│   ├── cloudId
│   ├── yjsStateB64
│   └── yjsVersion
│
├── folders
│   ├── id (primary)
│   ├── workspaceId (index)
│   ├── name
│   └── parentId
│
└── yjs-documents
    ├── docId (primary)
    └── state (Uint8Array)
```

### PostgreSQL Structure (Backend)

```
documents
├── id (UUID)
├── workspace_id (FK)
├── title
├── content (markdown)
├── yjs_state (bytea)
├── yjs_version (int)
├── created_by_id (FK)
├── is_public
└── timestamps

document_shares
├── id (UUID)
├── document_id (FK)
├── principal_id (user or team UUID)
├── principal_type ('user' | 'team')
├── role ('viewer' | 'commenter' | 'editor' | 'admin')
└── timestamps

share_links
├── id (UUID)
├── document_id (FK)
├── token (unique)
├── mode ('view' | 'comment' | 'edit')
├── password_hash (optional)
├── expires_at (optional)
└── timestamps
```

---

## 🔐 Authentication Flow

### JWT Token Structure

```json
{
  "sub": "cf9e8404-1234-5678-9abc-def012345678",  // User ID
  "exp": 1735360000,                               // Expiration
  "iat": 1735356400,                               // Issued at
  "jti": "random-jwt-id",                          // JWT ID
  "type": "access"                                 // Token type
}
```

### Auth in Different Contexts

| Context | Auth Method | Where |
|---------|-------------|-------|
| REST API | `Authorization: Bearer {token}` | Header |
| WebSocket (Hocuspocus) | `token` query param | URL |
| Share Link | `x-share-token: {token}` | Header |

### Hocuspocus Auth Flow

```
Client connects to ws://localhost:1234/{docId}?token=JWT
        ↓
Hocuspocus AuthExtension:
    1. Verify JWT signature (SECRET_KEY)
    2. Extract user ID from 'sub' claim
    3. Check document access via backend API
        ↓
If authorized:
    Allow connection
    Set user context (id, name, role)
        ↓
If unauthorized:
    Close connection with error
```

---

## 🌐 Environment Configuration

### Required `.env` Files

**Backend (`backendv2/.env`):**
```bash
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/mdreader
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Hocuspocus (`hocuspocus-server/.env`):**
```bash
# MUST MATCH backend SECRET_KEY!
SECRET_KEY=your-secret-key-here-change-in-production
BACKEND_URL=http://localhost:7001
HOCUSPOCUS_PORT=1234
```

**Frontend (`frontend/.env`):**
```bash
VITE_API_URL=http://localhost:7001
VITE_WS_URL=ws://localhost:1234
```

⚠️ **Critical:** `SECRET_KEY` must be identical in backend and Hocuspocus!

---

## 📊 Service Dependencies

```
Frontend App
    │
    ├── AuthService
    │   └── Manages JWT tokens, login/logout
    │
    ├── GuestWorkspaceService
    │   └── IndexedDB storage for guests
    │
    ├── BackendWorkspaceService
    │   ├── REST API calls
    │   └── IndexedDB cache for offline
    │
    ├── SyncModeService
    │   └── Enable/disable cloud sync per doc
    │
    ├── AutoSyncManager
    │   ├── NetworkStatusService (online/offline)
    │   └── Queue + debounce sync operations
    │
    ├── SelectiveSyncService
    │   └── Push/pull individual documents
    │
    └── YjsDocumentManager
        └── HocuspocusProvider (WebSocket)
```

---

## 🧪 Testing Scenarios

### Scenario 1: Guest Creates Document
```
1. Not logged in
2. Create document
3. Verify: Local badge, no sync options
4. Log in
5. Verify: Document still in local workspace
6. Click "Enable Cloud Sync"
7. Verify: Document syncs, badge changes
```

### Scenario 2: Offline Editing
```
1. Logged in, open cloud document
2. Go offline (DevTools → Network → Offline)
3. Edit document
4. Verify: Changes saved locally
5. Go online
6. Verify: Changes auto-sync
```

### Scenario 3: Real-Time Collaboration
```
1. User A creates document
2. User A shares with User B
3. Both open document
4. User A types → User B sees immediately
5. User B types → User A sees immediately
```

### Scenario 4: Conflict Resolution
```
1. User A opens document
2. User A goes offline
3. User B edits document (online)
4. User A edits document (offline)
5. User A goes online
6. Verify: Conflict detected or merged
```

---

## 🚀 Quick Reference

### Start Services
```bash
# Terminal 1: Backend
cd backendv2 && uvicorn app.main:app --port 7001 --reload

# Terminal 2: Hocuspocus
cd hocuspocus-server && npm run start

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Check Sync Status
```javascript
// In browser console
autoSyncManager.getStats()
// → { totalSynced: 5, totalFailed: 0, pendingCount: 0 }

autoSyncManager.getQueueStatus()
// → { size: 0, isProcessing: false, items: [] }
```

### Force Sync
```javascript
// Sync specific document
autoSyncManager.syncDocument('doc-id-here')

// Sync all pending
autoSyncManager.syncAll()
```

---

*Last Updated: December 28, 2025*
*Version: 1.0*


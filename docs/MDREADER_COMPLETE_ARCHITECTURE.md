# 🏛️ MDReader: Complete Architecture Masterpiece

**Version:** 1.0 - Final System Design  
**Date:** December 15, 2025  
**Status:** 🎯 **DEFINITIVE BLUEPRINT**

---

## 📋 **Table of Contents**

1. [Vision & System Overview](#1-vision--system-overview)
2. [Database Models (Complete Schema)](#2-database-models-complete-schema)
3. [System Architecture Layers](#3-system-architecture-layers)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [CRDT & Yjs Architecture](#5-crdt--yjs-architecture)
6. [Sync Layers & Managers](#6-sync-layers--managers)
7. [Collaboration System](#7-collaboration-system)
8. [Workspace & Folder Management](#8-workspace--folder-management)
9. [Document Lifecycle](#9-document-lifecycle)
10. [Permission & Role System](#10-permission--role-system)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Implementation Order](#12-implementation-order)
13. [UI Architecture (High-Level)](#13-ui-architecture-high-level)

---

## 1. Vision & System Overview

### **The Complete System**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MDREADER ECOSYSTEM                            │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │    Browser     │  │ Tauri Desktop  │  │     Mobile     │        │
│  │   (Primary)    │  │   (Secondary)  │  │    (Future)    │        │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘        │
│           │                    │                    │                 │
│           └────────────────────┼────────────────────┘                 │
│                                │                                      │
│                    ┌───────────▼──────────┐                          │
│                    │   Frontend Layer     │                          │
│                    │  (React + TipTap)    │                          │
│                    └───────────┬──────────┘                          │
│                                │                                      │
│           ┌────────────────────┼────────────────────┐                │
│           │                    │                    │                 │
│      ┌────▼─────┐         ┌───▼────┐          ┌───▼────┐           │
│      │ IndexedDB│         │  Yjs   │          │FastAPI │           │
│      │  Cache   │         │ CRDT   │          │  REST  │           │
│      └──────────┘         └───┬────┘          └────┬───┘           │
│                               │                     │                │
│                          ┌────▼─────┐          ┌───▼────┐           │
│                          │Hocuspocus│          │Backend │           │
│                          │WebSocket │          │Services│           │
│                          └────┬─────┘          └────┬───┘           │
│                               │                     │                │
│                               └──────────┬──────────┘                │
│                                          │                           │
│                               ┌──────────▼──────────┐               │
│                               │   Data Layer        │               │
│                               │  PostgreSQL + Redis │               │
│                               └─────────────────────┘               │
└───────────────────────────────────────────────────────────────────────┘
```

### **Core Principles**

1. **Local-First Architecture** - IndexedDB + Yjs as source of truth
2. **CRDT-Based Sync** - Conflict-free, automatic merging
3. **Real-Time Collaboration** - WebSocket for multi-user editing
4. **Progressive Enhancement** - Works offline → online → collaborative
5. **Zero Trust Security** - Backend validates everything
6. **Role-Based Access** - Owner → Editor → Viewer → Guest

---

## 2. Database Models (Complete Schema)

### **PostgreSQL Schema**

```sql
-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    is_active           BOOLEAN DEFAULT true,
    is_verified         BOOLEAN DEFAULT false,
    avatar_url          VARCHAR(500),
    bio                 TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    last_login_at       TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
);

-- ============================================================================
-- WORKSPACES
-- ============================================================================

CREATE TABLE workspaces (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    icon                VARCHAR(10) DEFAULT '📁',
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public           BOOLEAN DEFAULT false,
    is_deleted          BOOLEAN DEFAULT false,
    version             INTEGER DEFAULT 1,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_workspaces_owner (owner_id),
    INDEX idx_workspaces_slug (owner_id, slug),
    UNIQUE (owner_id, slug)
);

-- ============================================================================
-- WORKSPACE MEMBERS (Multi-User Access)
-- ============================================================================

CREATE TYPE workspace_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE workspace_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                workspace_role NOT NULL DEFAULT 'viewer',
    invited_by          UUID REFERENCES users(id),
    invited_at          TIMESTAMP DEFAULT NOW(),
    accepted_at         TIMESTAMP,
    is_active           BOOLEAN DEFAULT true,
    
    INDEX idx_members_workspace (workspace_id),
    INDEX idx_members_user (user_id),
    UNIQUE (workspace_id, user_id)
);

-- ============================================================================
-- FOLDERS (Hierarchical Organization)
-- ============================================================================

CREATE TABLE folders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES folders(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    icon                VARCHAR(10) DEFAULT '📁',
    position            INTEGER DEFAULT 0,
    is_expanded         BOOLEAN DEFAULT true,
    is_deleted          BOOLEAN DEFAULT false,
    version             INTEGER DEFAULT 1,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_folders_workspace (workspace_id),
    INDEX idx_folders_parent (parent_id),
    INDEX idx_folders_position (workspace_id, parent_id, position)
);

-- ============================================================================
-- DOCUMENTS (Metadata Only)
-- ============================================================================

CREATE TYPE document_type AS ENUM ('markdown', 'mindmap', 'presentation');
CREATE TYPE storage_mode AS ENUM ('LocalOnly', 'HybridSync', 'CloudOnly');

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL,
    content             TEXT,  -- Legacy: HTML snapshot (deprecated)
    content_type        document_type DEFAULT 'markdown',
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id           UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_by_id       UUID NOT NULL REFERENCES users(id),
    tags                VARCHAR(50)[],
    is_public           BOOLEAN DEFAULT false,
    is_template         BOOLEAN DEFAULT false,
    is_starred          BOOLEAN DEFAULT false,
    storage_mode        storage_mode DEFAULT 'HybridSync',
    version             INTEGER DEFAULT 1,
    yjs_version         INTEGER DEFAULT 0,  -- Yjs state version
    word_count          INTEGER DEFAULT 0,
    is_deleted          BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_documents_workspace (workspace_id),
    INDEX idx_documents_folder (folder_id),
    INDEX idx_documents_creator (created_by_id),
    INDEX idx_documents_slug (workspace_id, slug),
    INDEX idx_documents_public (is_public, is_deleted)
);

-- ============================================================================
-- DOCUMENT COLLABORATION STATE (Yjs CRDT Binary)
-- ============================================================================

CREATE TABLE document_collab_state (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    yjs_state           BYTEA NOT NULL,  -- Yjs binary state
    yjs_version         INTEGER NOT NULL DEFAULT 0,
    last_edit_by        UUID REFERENCES users(id),
    last_edit_at        TIMESTAMP DEFAULT NOW(),
    size_bytes          INTEGER NOT NULL,
    
    INDEX idx_collab_document (document_id),
    INDEX idx_collab_version (document_id, yjs_version),
    UNIQUE (document_id, yjs_version)
);

-- ============================================================================
-- DOCUMENT SNAPSHOTS (Version History)
-- ============================================================================

CREATE TABLE document_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    yjs_state           BYTEA NOT NULL,
    html_content        TEXT,  -- Rendered HTML for preview
    version             INTEGER NOT NULL,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    snapshot_label      VARCHAR(100),  -- Optional: "Before refactor", "Final draft"
    
    INDEX idx_snapshots_document (document_id),
    INDEX idx_snapshots_version (document_id, version),
    UNIQUE (document_id, version)
);

-- ============================================================================
-- DOCUMENT PERMISSIONS (Fine-Grained Access)
-- ============================================================================

CREATE TYPE document_permission AS ENUM ('view', 'comment', 'edit', 'admin');

CREATE TABLE document_permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    permission          document_permission NOT NULL DEFAULT 'view',
    granted_by          UUID REFERENCES users(id),
    granted_at          TIMESTAMP DEFAULT NOW(),
    expires_at          TIMESTAMP,  -- Optional: time-limited access
    
    INDEX idx_doc_perms_document (document_id),
    INDEX idx_doc_perms_user (user_id),
    UNIQUE (document_id, user_id)
);

-- ============================================================================
-- COLLABORATION SESSIONS (Active Editing)
-- ============================================================================

CREATE TABLE collaboration_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    websocket_id        VARCHAR(255) NOT NULL,  -- Hocuspocus connection ID
    cursor_position     JSONB,  -- { line: 10, column: 5 }
    selection_range     JSONB,  -- { start: {...}, end: {...} }
    is_active           BOOLEAN DEFAULT true,
    connected_at        TIMESTAMP DEFAULT NOW(),
    last_seen_at        TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_sessions_document (document_id),
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_active (document_id, is_active)
);

-- ============================================================================
-- INVITATIONS (Workspace & Document Sharing)
-- ============================================================================

CREATE TYPE invitation_type AS ENUM ('workspace', 'document');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

CREATE TABLE invitations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                invitation_type NOT NULL,
    workspace_id        UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id         UUID REFERENCES documents(id) ON DELETE CASCADE,
    inviter_id          UUID NOT NULL REFERENCES users(id),
    invitee_email       VARCHAR(255) NOT NULL,
    invitee_id          UUID REFERENCES users(id),  -- NULL if not registered yet
    role                workspace_role,
    permission          document_permission,
    status              invitation_status DEFAULT 'pending',
    token               VARCHAR(255) UNIQUE NOT NULL,  -- For email link
    message             TEXT,
    invited_at          TIMESTAMP DEFAULT NOW(),
    responded_at        TIMESTAMP,
    expires_at          TIMESTAMP NOT NULL,
    
    INDEX idx_invitations_email (invitee_email),
    INDEX idx_invitations_token (token),
    INDEX idx_invitations_status (status, expires_at)
);

-- ============================================================================
-- ACTIVITY LOG (Audit Trail)
-- ============================================================================

CREATE TYPE activity_action AS ENUM (
    'document.created',
    'document.updated',
    'document.deleted',
    'document.shared',
    'workspace.created',
    'workspace.updated',
    'workspace.deleted',
    'member.added',
    'member.removed',
    'folder.created',
    'folder.moved',
    'folder.deleted'
);

CREATE TABLE activity_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    workspace_id        UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id         UUID REFERENCES documents(id) ON DELETE CASCADE,
    action              activity_action NOT NULL,
    metadata            JSONB,  -- { oldValue: "x", newValue: "y" }
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_workspace (workspace_id),
    INDEX idx_activity_document (document_id),
    INDEX idx_activity_created (created_at)
);
```

### **Redis Data Structures**

```redis
# Session Tokens (JWT Refresh)
session:{user_id}:{session_id} = { token, expires_at, device_info }
TTL: 30 days

# Active Connections (Hocuspocus)
collab:active:{document_id} = SET[user_id, user_id, ...]
TTL: 1 hour (refreshed on activity)

# Document Presence (Who's Viewing)
presence:{document_id}:{user_id} = { cursor, selection, last_seen }
TTL: 5 minutes (refreshed on activity)

# Rate Limiting
ratelimit:{user_id}:{action} = counter
TTL: 1 minute

# Cache (Frequently Accessed Data)
cache:workspace:{workspace_id} = JSON(workspace + members + folders)
TTL: 10 minutes

cache:document:{document_id} = JSON(document metadata)
TTL: 10 minutes
```

---

## 3. System Architecture Layers

### **Layer 1: Client (Frontend)**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Presentation Layer                                   │  │
│  │  • React Components                                   │  │
│  │  • TipTap Editor                                      │  │
│  │  • UI State Management (Zustand)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↕                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer                                           │  │
│  │  • WorkspaceContext                                   │  │
│  │  • AuthContext                                        │  │
│  │  • Document Store                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↕                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CRDT Engine (Yjs)                                    │  │
│  │  • Y.Doc (document state)                             │  │
│  │  • Y.Map (metadata)                                   │  │
│  │  • Y.Array (structure)                                │  │
│  │  • Y.UndoManager (history)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↕                                     │
│  ┌────────────┬─────────────┬───────────────────────────┐  │
│  │ IndexedDB  │  WebSocket  │  REST API                 │  │
│  │ (y-idb)    │ (Hocuspocus)│  (FastAPI)                │  │
│  │ Always-On  │  Collab     │  Metadata                 │  │
│  └────────────┴─────────────┴───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Layer 2: Transport**

```
┌─────────────────────────────────────────────────────────────┐
│                   TRANSPORT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Protocol 1: WebSocket (Real-Time Content)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (y-websocket)                               │  │
│  │         ↕                                             │  │
│  │  Hocuspocus Server (Port 1234)                        │  │
│  │         ↕                                             │  │
│  │  PostgreSQL (document_collab_state)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Protocol 2: REST (Metadata & Operations)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Axios/Fetch)                               │  │
│  │         ↕                                             │  │
│  │  FastAPI Server (Port 7001)                           │  │
│  │         ↕                                             │  │
│  │  PostgreSQL (metadata tables)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Protocol 3: IndexedDB (Local Persistence)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Dexie.js)                                  │  │
│  │         ↕                                             │  │
│  │  Browser IndexedDB                                    │  │
│  │  • MDReaderGuest (local documents)                    │  │
│  │  • MDReaderCache (cloud cache)                        │  │
│  │  • y-indexeddb (Yjs persistence)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Layer 3: Backend Services**

```
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Service 1: FastAPI (Python)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Routers (HTTP endpoints)                           │  │
│  │  • Services (Business logic)                          │  │
│  │  • Models (SQLAlchemy ORM)                            │  │
│  │  • Schemas (Pydantic validation)                      │  │
│  │  • Middleware (Auth, CORS, Rate Limiting)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Service 2: Hocuspocus (Node.js)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • WebSocket Handler                                  │  │
│  │  • Yjs Sync Protocol                                  │  │
│  │  • Authentication Hook (JWT)                          │  │
│  │  • Persistence Hook (PostgreSQL)                      │  │
│  │  • Presence Tracking                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Service 3: Background Workers (Future)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Snapshot Generator (version history)               │  │
│  │  • Search Indexer (full-text)                         │  │
│  │  • Email Sender (invitations)                         │  │
│  │  • Export Worker (PDF, Word)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Layer 4: Data Storage**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Primary: PostgreSQL (Persistent Storage)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • users, workspaces, workspace_members               │  │
│  │  • folders, documents, document_permissions           │  │
│  │  • document_collab_state (Yjs binary)                 │  │
│  │  • document_snapshots (version history)               │  │
│  │  • collaboration_sessions, invitations                │  │
│  │  • activity_log (audit trail)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Cache: Redis (Ephemeral State)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Session tokens (JWT refresh)                       │  │
│  │  • Active connections (Hocuspocus)                    │  │
│  │  • Document presence (cursors, selections)            │  │
│  │  • Rate limiting counters                             │  │
│  │  • Cached metadata (workspaces, folders)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Local: IndexedDB (Browser Storage)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • MDReaderGuest: Local-only documents                │  │
│  │  • MDReaderCache: Cloud document cache                │  │
│  │  • y-indexeddb: Yjs document persistence              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization

### **Auth Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

User Action: Login
     │
     ▼
Frontend: POST /api/v1/auth/login { email, password }
     │
     ▼
FastAPI: AuthService.login()
     │
     ├─► Validate email/password
     ├─► Generate JWT access token (15 min)
     ├─► Generate refresh token (30 days)
     ├─► Store session in Redis
     │
     ▼
Response: { access_token, refresh_token, user }
     │
     ▼
Frontend: Store tokens in memory + localStorage
     │
     ▼
All Requests: Header: Authorization: Bearer {access_token}
     │
     ▼
FastAPI Middleware: Verify JWT
     │
     ├─► Valid? → Extract user_id → Continue
     └─► Expired? → Return 401
              │
              ▼
Frontend: Auto-refresh using refresh_token
     │
     ▼
POST /api/v1/auth/refresh { refresh_token }
     │
     ▼
New access_token → Continue
```

### **Permission Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                   PERMISSION MATRIX                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Workspace Level:                                            │
│                                                              │
│  Owner:                                                      │
│  • Create/delete workspace                                   │
│  • Add/remove members                                        │
│  • Change workspace settings                                 │
│  • Delete any document/folder                                │
│                                                              │
│  Editor:                                                     │
│  • Create documents/folders                                  │
│  • Edit own documents                                        │
│  • Edit shared documents                                     │
│  • Move documents/folders                                    │
│                                                              │
│  Viewer:                                                     │
│  • View documents                                            │
│  • Comment (future)                                          │
│  • Export documents                                          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Document Level (Overrides Workspace):                       │
│                                                              │
│  Admin:                                                      │
│  • All permissions                                           │
│  • Change document permissions                               │
│  • Delete document                                           │
│                                                              │
│  Edit:                                                       │
│  • Read/write content                                        │
│  • Collaborate in real-time                                  │
│                                                              │
│  Comment:                                                    │
│  • Read content                                              │
│  • Add comments (future)                                     │
│                                                              │
│  View:                                                       │
│  • Read-only access                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Access Check Algorithm**

```python
def check_document_access(user_id: UUID, document_id: UUID, required_permission: str) -> bool:
    """
    Permission check order (first match wins):
    1. Document owner → full access
    2. Document-specific permission → use that
    3. Workspace role → translate to document permission
    4. Public document → view only
    5. Default → no access
    """
    
    # 1. Get document
    document = db.get(Document, document_id)
    if document.created_by_id == user_id:
        return True  # Owner has full access
    
    # 2. Check document-specific permission
    doc_perm = db.query(DocumentPermission).filter(
        DocumentPermission.document_id == document_id,
        DocumentPermission.user_id == user_id
    ).first()
    
    if doc_perm:
        return perm_allows(doc_perm.permission, required_permission)
    
    # 3. Check workspace membership
    workspace_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == document.workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    
    if workspace_member:
        # Owner → edit, Editor → edit, Viewer → view
        workspace_perm = role_to_permission(workspace_member.role)
        return perm_allows(workspace_perm, required_permission)
    
    # 4. Check if public
    if document.is_public and required_permission == 'view':
        return True
    
    # 5. No access
    return False
```

---

## 5. CRDT & Yjs Architecture

### **Yjs Document Structure**

```javascript
// Every MDReader document is a Yjs document:

const ydoc = new Y.Doc()

// 1. Content (TipTap prosemirror schema)
const content = ydoc.getXmlFragment('prosemirror')
// → Stores rich text, headings, lists, etc.
// → Automatically synced via TipTap Collaboration extension

// 2. Metadata (document properties)
const metadata = ydoc.getMap('metadata')
metadata.set('title', 'My Document')
metadata.set('tags', ['work', 'draft'])
metadata.set('starred', false)

// 3. Cursors & Selection (collaboration awareness)
const awareness = ydoc.getMap('awareness')
// → User cursors, selections, presence
// → Managed by y-websocket provider

// 4. Comments (future)
const comments = ydoc.getArray('comments')
// → { id, user_id, position, text, created_at }

// 5. History (undo/redo)
const undoManager = new Y.UndoManager([content])
// → Tracks changes for undo/redo
```

### **CRDT Sync Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                      CRDT SYNC FLOW                          │
└─────────────────────────────────────────────────────────────┘

Scenario: User A and User B editing same document

User A Types "Hello"
     │
     ▼
Yjs: Generate operation
     │ operation = { type: 'insert', position: 0, content: 'Hello' }
     │
     ├─► Store in IndexedDB (y-indexeddb)  [LOCAL PERSISTENCE]
     │
     ├─► Send via WebSocket (y-websocket)  [CLOUD SYNC]
     │
     ▼
Hocuspocus Server
     │
     ├─► Broadcast to all connected clients (User B)
     │
     ├─► Store in PostgreSQL (document_collab_state)
     │
     ▼
User B Receives Operation
     │
     ▼
Yjs: Apply operation to local Y.Doc
     │
     ├─► Merge with User B's local edits (CRDT magic)
     │
     ├─► Update TipTap editor
     │
     ▼
Result: Both users see "Hello" + User B's edits, conflict-free
```

### **Conflict Resolution (Automatic)**

```
Example: Both users edit at same time

Initial State:
Document: "The cat"

User A (Offline):          User B (Online):
Edits: "The black cat"     Edits: "The cat sat"

When User A comes online:

Step 1: User A's Yjs sends operations to server
Step 2: Server merges using CRDT algorithm
Step 3: Server broadcasts merged state

Final State (Automatic):
Document: "The black cat sat"

→ NO CONFLICT DIALOG
→ NO USER INTERVENTION
→ GUARANTEED CONVERGENCE
```

### **Yjs Persistence Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│              YJS PERSISTENCE ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

Layer 1: IndexedDB (Always Active)
┌────────────────────────────────────────────────────────────┐
│  Database: y-indexeddb                                      │
│  Purpose: Local-first, offline-capable                      │
│  Stores: Full Yjs document binary                           │
│  Update: On every change (debounced 500ms)                  │
│  Survives: Refresh, browser close, offline                  │
└────────────────────────────────────────────────────────────┘
                        ↕
Layer 2: WebSocket (When Online + Authenticated)
┌────────────────────────────────────────────────────────────┐
│  Protocol: Yjs sync protocol (y-websocket)                  │
│  Purpose: Real-time sync, multi-user                        │
│  Sends: Differential updates (not full doc)                 │
│  Receives: Updates from other users                         │
└────────────────────────────────────────────────────────────┘
                        ↕
Layer 3: PostgreSQL (Backend Storage)
┌────────────────────────────────────────────────────────────┐
│  Table: document_collab_state                               │
│  Purpose: Persistent backup, cross-device sync              │
│  Stores: Compressed Yjs binary + version                    │
│  Update: On Hocuspocus onChange (debounced 2s)              │
│  Used For: Recovery, new device login, snapshots            │
└────────────────────────────────────────────────────────────┘

Recovery Flow (User logs in on new device):
1. Frontend: Load from PostgreSQL (latest Yjs state)
2. IndexedDB: Store locally
3. TipTap: Render immediately
4. WebSocket: Connect for real-time updates
```

---

## 6. Sync Layers & Managers

### **Sync Manager Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                   SYNC MANAGER HIERARCHY                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  UnifiedSyncManager (Top-Level Orchestrator)                 │
│  • Detects network status                                    │
│  • Routes to appropriate sync strategy                       │
│  • Handles auth state changes                                │
│  • Manages sync queue                                        │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─► LocalSyncManager (Offline Mode)
             │   • Sync to IndexedDB only
             │   • Queue changes for later upload
             │   • No network calls
             │
             ├─► HybridSyncManager (Default Mode)
             │   • IndexedDB (immediate)
             │   • Cloud (background)
             │   • Best of both worlds
             │
             └─► CloudSyncManager (Collaboration Mode)
                 • WebSocket (real-time)
                 • PostgreSQL (persistent)
                 • IndexedDB (cache)
```

### **Sync State Machine**

```
┌─────────────────────────────────────────────────────────────┐
│                     SYNC STATE MACHINE                       │
└─────────────────────────────────────────────────────────────┘

States:
• local       → Document exists only in IndexedDB
• syncing     → Upload in progress
• synced      → Cloud and local match
• conflict    → Diverged (should never happen with CRDT)
• error       → Sync failed, will retry

Transitions:

[local] ──(user clicks "Push to Cloud")──> [syncing]
                                                │
                                                ├─(success)──> [synced]
                                                │
                                                └─(failure)──> [error]
                                                      │
                                                      └─(retry)──> [syncing]

[synced] ──(offline edit)──> [local] ──(auto-sync)──> [syncing] ──> [synced]
```

### **Conflict Detection (Metadata Only)**

```
Note: CRDT handles content conflicts automatically.
This is ONLY for metadata conflicts (title, folder, etc.)

Scenario: User edits metadata offline, server changes metadata online

Detection:
if (local.version != server.version) {
    // Conflict detected
    show_conflict_dialog({
        local: local.title,
        server: server.title,
        action: 'Choose which to keep'
    })
}

Resolution:
• User chooses local → POST with version override
• User chooses server → Discard local changes
• User merges → Manual edit → POST

Prevention:
• Use Yjs for metadata too (future improvement)
• Optimistic locking (version field)
```

---

## 7. Collaboration System

### **Real-Time Collaboration Flow**

```
┌─────────────────────────────────────────────────────────────┐
│              COLLABORATION ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

User A Opens Document
     │
     ▼
Frontend: GET /api/v1/documents/{id}
     │ Returns: { title, workspace_id, permissions }
     │
     ▼
Check Permission: Can user edit?
     │
     ├─► No → Load read-only (no WebSocket)
     │
     └─► Yes → Initialize collaboration
          │
          ▼
     Load Yjs from IndexedDB
          │
          ▼
     Connect WebSocket: ws://localhost:1234/{document_id}
          │ Auth: JWT token in connection params
          │
          ▼
     Hocuspocus: Verify JWT, check document permission
          │
          ├─► Invalid → Reject connection
          │
          └─► Valid → Accept connection
               │
               ▼
          Load Yjs state from PostgreSQL (if first connection)
               │
               ▼
          Sync Yjs state with User A
               │
               ▼
          User A sees document content
               │
               ▼
          User A starts editing → Yjs operations sent to server
               │
               ▼
          Server broadcasts to all connected users
               │
               ▼
          User B (if connected) receives updates in real-time
```

### **Presence & Cursors**

```javascript
// Presence System (Who's Online)

// Frontend: Announce presence
const awareness = provider.awareness

awareness.setLocalState({
    user: {
        id: currentUser.id,
        name: currentUser.full_name,
        avatar: currentUser.avatar_url,
        color: assignedColor  // e.g., '#FF6B6B'
    },
    cursor: {
        line: 10,
        column: 5
    },
    selection: {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 10 }
    }
})

// Backend: Track in Redis
redis.sadd(`collab:active:${documentId}`, userId)
redis.expire(`collab:active:${documentId}`, 3600)

redis.hset(`presence:${documentId}:${userId}`, {
    cursor: JSON.stringify(cursor),
    selection: JSON.stringify(selection),
    last_seen: Date.now()
})

// Frontend: Show other users
awareness.on('change', ({ added, removed, updated }) => {
    added.forEach(clientId => {
        const state = awareness.getStates().get(clientId)
        renderCursor(state.user, state.cursor)
    })
    
    removed.forEach(clientId => {
        removeCursor(clientId)
    })
})
```

### **Collaboration UI Elements**

```
┌─────────────────────────────────────────────────────────────┐
│                  COLLABORATION UI                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Editor Header                                        │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ Document Title │  │ Active Users (Avatars)   │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Alice (you)  Bob  Carol                        │  │  │
│  │  │   🟢         🟢    🟡 (viewing)                 │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Editor Content                                       │  │
│  │                                                        │  │
│  │  The quick brown fox jumps over                       │  │
│  │       ▲                    ▲                          │  │
│  │       │                    │                          │  │
│  │   Bob's cursor        Alice's cursor (you)           │  │
│  │   (blue, labeled)     (your color)                   │  │
│  │                                                        │  │
│  │  Selected text shows background color of user        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Status Bar                                           │  │
│  │  🟢 Synced • 3 users editing • Last saved: now       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Workspace & Folder Management

### **Workspace Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                   WORKSPACE STRUCTURE                        │
└─────────────────────────────────────────────────────────────┘

Workspace (e.g., "Work Projects")
│
├─ Members:
│  ├─ Alice (Owner)
│  ├─ Bob (Editor)
│  └─ Carol (Viewer)
│
├─ Folders:
│  │
│  ├─ 📁 Product Design (parent_id: NULL, position: 0)
│  │  ├─ 📄 Roadmap 2025.md
│  │  ├─ 📄 User Research.md
│  │  └─ 📁 Mockups (parent_id: Product Design, position: 0)
│  │     ├─ 📄 Homepage.md
│  │     └─ 📄 Dashboard.md
│  │
│  ├─ 📁 Engineering (parent_id: NULL, position: 1)
│  │  ├─ 📄 Architecture.md
│  │  └─ 📄 API Docs.md
│  │
│  └─ 📁 Marketing (parent_id: NULL, position: 2)
│     ├─ 📄 Campaign Ideas.md
│     └─ 📄 Social Media.md
│
└─ Root Documents (folder_id: NULL):
   ├─ 📄 Workspace README.md
   └─ 📄 Team Meeting Notes.md
```

### **Folder Operations**

```sql
-- Create Folder
INSERT INTO folders (id, workspace_id, parent_id, name, position)
VALUES (uuid_generate_v4(), '...', NULL, 'New Folder', 0);

-- Move Folder (Change Parent)
UPDATE folders
SET parent_id = 'new_parent_id', position = 0
WHERE id = 'folder_id';

-- Reorder Folders (Change Position)
UPDATE folders
SET position = CASE
    WHEN id = 'folder1' THEN 0
    WHEN id = 'folder2' THEN 1
    WHEN id = 'folder3' THEN 2
END
WHERE id IN ('folder1', 'folder2', 'folder3');

-- Delete Folder (Soft Delete)
UPDATE folders
SET is_deleted = true, updated_at = NOW()
WHERE id = 'folder_id';

-- Cascade Delete: Move documents to parent or root
UPDATE documents
SET folder_id = (
    SELECT parent_id FROM folders WHERE id = 'deleted_folder_id'
)
WHERE folder_id = 'deleted_folder_id';
```

### **Workspace Sharing Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                  WORKSPACE SHARING FLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Owner Invites Member
     │
     ▼
Frontend: POST /api/v1/workspaces/{id}/invite
     │ Body: { email: 'bob@example.com', role: 'editor' }
     │
     ▼
Backend: Create invitation
     │
     ├─► Generate unique token
     ├─► Set expiration (7 days)
     ├─► Send email with link
     │
     ▼
Email: "Alice invited you to 'Work Projects'"
     │ Link: https://mdreader.com/invite/{token}
     │
     ▼
Step 2: Bob Clicks Link
     │
     ▼
Frontend: GET /api/v1/invitations/{token}
     │ Returns: { workspace_name, inviter_name, role }
     │
     ▼
Show Invitation Page:
     │ "Alice invited you to 'Work Projects' as Editor"
     │ [Accept] [Reject]
     │
     ▼
Bob Clicks "Accept"
     │
     ▼
POST /api/v1/invitations/{token}/accept
     │
     ▼
Backend:
     │
     ├─► Create workspace_member record
     ├─► Update invitation status → 'accepted'
     ├─► Grant Bob access
     │
     ▼
Response: { workspace_id, role }
     │
     ▼
Frontend: Redirect to workspace
     │
     ▼
Bob sees workspace in sidebar, can open documents
```

---

## 9. Document Lifecycle

### **Complete Document Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                   DOCUMENT LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

Phase 1: Creation (Local-First)
───────────────────────────────────────
User: Click "New Document"
  │
  ▼
Frontend: Create local document
  │
  ├─► Generate UUID
  ├─► Create Yjs document
  ├─► Save to IndexedDB (GuestWorkspaceService)
  ├─► Add to WorkspaceContext (sidebar)
  │
  ▼
Status: 'local' (💾 icon)


Phase 2: Push to Cloud (Explicit)
───────────────────────────────────────
User: Right-click → "Push to Cloud"
  │
  ▼
Frontend: POST /api/v1/documents
  │ Body: { id, title, workspace_id, folder_id }
  │
  ▼
Backend: Create document metadata
  │
  ├─► Insert into `documents` table
  ├─► Return document record
  │
  ▼
Frontend: Update sync status
  │
  ├─► Update IndexedDB → syncStatus: 'synced'
  ├─► Update WorkspaceContext state
  │
  ▼
Status: 'synced' (☁️ icon)


Phase 3: Edit (Offline or Online)
───────────────────────────────────────
User: Types in editor
  │
  ▼
TipTap: onChange event
  │
  ▼
Yjs: Generate operation
  │
  ├─► Save to IndexedDB (y-indexeddb)
  │
  └─► IF WebSocket connected:
       └─► Send to Hocuspocus
            └─► Broadcast to collaborators
            └─► Save to PostgreSQL


Phase 4: Collaboration (Real-Time)
───────────────────────────────────────
User: Opens shared document
  │
  ▼
Frontend: Connect WebSocket
  │ ws://localhost:1234/{document_id}?token={jwt}
  │
  ▼
Hocuspocus: Authenticate + Sync
  │
  ├─► Verify JWT
  ├─► Check permissions
  ├─► Load Yjs state from PostgreSQL
  ├─► Sync with client
  │
  ▼
User sees live cursors, edits propagate instantly


Phase 5: Snapshot (Version History)
───────────────────────────────────────
Trigger: Every 50 operations or manual save
  │
  ▼
Backend: Create snapshot
  │
  ├─► Extract Yjs state
  ├─► Render HTML (for preview)
  ├─► Store in `document_snapshots`
  │
  ▼
User can: View history, restore previous version


Phase 6: Deletion (Soft Delete)
───────────────────────────────────────
User: Click "Delete"
  │
  ▼
Frontend: PATCH /api/v1/documents/{id}
  │ Body: { is_deleted: true }
  │
  ▼
Backend: Soft delete
  │
  ├─► UPDATE documents SET is_deleted = true
  ├─► Keep in database (recoverable)
  │
  ▼
Frontend: Remove from sidebar
  │
Status: Document hidden, data preserved


Phase 7: Permanent Deletion (Admin)
───────────────────────────────────────
Admin: Cleanup task (30 days after soft delete)
  │
  ▼
Backend: DELETE FROM documents WHERE is_deleted = true AND updated_at < NOW() - INTERVAL '30 days'
  │
  ├─► Remove from PostgreSQL
  ├─► Remove Yjs state
  ├─► Remove snapshots
  │
  ▼
Status: Permanently deleted
```

---

## 10. Permission & Role System

### **Permission Evaluation Algorithm**

```python
def evaluate_permission(user_id: UUID, resource_type: str, resource_id: UUID, action: str) -> bool:
    """
    Unified permission check for all resources
    
    Args:
        user_id: User requesting access
        resource_type: 'workspace' | 'document' | 'folder'
        resource_id: ID of resource
        action: 'view' | 'edit' | 'admin' | 'delete'
    
    Returns:
        True if allowed, False otherwise
    """
    
    # Special case: System admin (future)
    if is_system_admin(user_id):
        return True
    
    if resource_type == 'workspace':
        return check_workspace_permission(user_id, resource_id, action)
    
    elif resource_type == 'document':
        return check_document_permission(user_id, resource_id, action)
    
    elif resource_type == 'folder':
        # Folder permissions inherited from workspace
        folder = db.get(Folder, resource_id)
        return check_workspace_permission(user_id, folder.workspace_id, action)


def check_workspace_permission(user_id: UUID, workspace_id: UUID, action: str) -> bool:
    """Workspace permission check"""
    
    workspace = db.get(Workspace, workspace_id)
    
    # 1. Owner has full access
    if workspace.owner_id == user_id:
        return True
    
    # 2. Check membership
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
        WorkspaceMember.is_active == True
    ).first()
    
    if member:
        # Map role to permissions
        if member.role == 'owner':
            return True
        elif member.role == 'editor':
            return action in ['view', 'edit']
        elif member.role == 'viewer':
            return action == 'view'
    
    # 3. Public workspace (view only)
    if workspace.is_public and action == 'view':
        return True
    
    return False


def check_document_permission(user_id: UUID, document_id: UUID, action: str) -> bool:
    """Document permission check (overrides workspace)"""
    
    document = db.get(Document, document_id)
    
    # 1. Document owner
    if document.created_by_id == user_id:
        return True
    
    # 2. Document-specific permission (override)
    doc_perm = db.query(DocumentPermission).filter(
        DocumentPermission.document_id == document_id,
        DocumentPermission.user_id == user_id
    ).first()
    
    if doc_perm:
        return permission_allows(doc_perm.permission, action)
    
    # 3. Fall back to workspace permission
    return check_workspace_permission(user_id, document.workspace_id, action)


def permission_allows(granted: str, required: str) -> bool:
    """Check if granted permission satisfies required"""
    hierarchy = {
        'admin': ['admin', 'edit', 'comment', 'view'],
        'edit': ['edit', 'comment', 'view'],
        'comment': ['comment', 'view'],
        'view': ['view']
    }
    return required in hierarchy.get(granted, [])
```

### **Permission Caching Strategy**

```python
# Cache permissions in Redis (60 second TTL)

def get_user_permissions(user_id: UUID, workspace_id: UUID) -> dict:
    """Get cached permissions for user in workspace"""
    
    cache_key = f"permissions:{user_id}:{workspace_id}"
    cached = redis.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Compute permissions
    permissions = {
        'role': get_workspace_role(user_id, workspace_id),
        'can_view': check_workspace_permission(user_id, workspace_id, 'view'),
        'can_edit': check_workspace_permission(user_id, workspace_id, 'edit'),
        'can_admin': check_workspace_permission(user_id, workspace_id, 'admin'),
        'documents': get_document_permissions(user_id, workspace_id)
    }
    
    # Cache for 60 seconds
    redis.setex(cache_key, 60, json.dumps(permissions))
    
    return permissions


def invalidate_permissions(user_id: UUID, workspace_id: UUID):
    """Invalidate cache when permissions change"""
    cache_key = f"permissions:{user_id}:{workspace_id}"
    redis.delete(cache_key)
```

---

## 11. Data Flow Diagrams

### **Complete System Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│               COMPLETE SYSTEM DATA FLOW                      │
└─────────────────────────────────────────────────────────────┘

USER OPENS APP
     │
     ▼
┌──────────────────────────────────────┐
│  Frontend Initialization             │
│  • Check auth token                  │
│  • Load workspaces from IndexedDB    │
│  • Render sidebar                    │
└──────────┬───────────────────────────┘
           │
           ▼
     ┌─────────────────┐
     │ Authenticated?  │
     └─────────┬───────┘
               │
        ┌──────┴───────┐
        │              │
    [NO]            [YES]
        │              │
        ▼              ▼
   Guest Mode    Cloud Sync
        │              │
        │              ├─► GET /api/v1/workspaces
        │              │   (merge with local)
        │              │
        │              ├─► GET /api/v1/documents
        │              │   (cache in IndexedDB)
        │              │
        │              └─► Connect Redis
        │                  (presence, cache)
        │              
        └──────┬───────┘
               │
               ▼
    USER OPENS DOCUMENT
               │
               ▼
    ┌──────────────────┐
    │ Load Yjs Doc     │
    │ from IndexedDB   │
    └─────────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │ Check Permission │
    └─────────┬────────┘
              │
       ┌──────┴──────┐
       │             │
   [View Only]   [Can Edit]
       │             │
       │             ├─► Connect WebSocket
       │             │   (Hocuspocus)
       │             │
       │             ├─► Load awareness
       │             │   (cursors, presence)
       │             │
       │             └─► Enable collaboration
       │
       └──────┬──────┘
              │
              ▼
    USER EDITS DOCUMENT
              │
              ▼
    ┌──────────────────┐
    │ Yjs Operation    │
    └─────────┬────────┘
              │
       ┌──────┴──────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
  IndexedDB     WebSocket      TipTap UI
  (instant)   (if connected)   (render)
       │             │              
       │             ├─► Hocuspocus
       │             │   └─► PostgreSQL
       │             │       (persist)
       │             │   
       │             └─► Broadcast
       │                 └─► Other users
       │                     (real-time)
       │
       └─► Auto-save complete
```

### **Guest → Authenticated Transition**

```
┌─────────────────────────────────────────────────────────────┐
│            GUEST TO AUTHENTICATED MIGRATION                  │
└─────────────────────────────────────────────────────────────┘

Initial State: User has 5 documents in IndexedDB (guest mode)

User Logs In
     │
     ▼
Frontend: POST /api/v1/auth/login
     │ Response: { access_token, user }
     │
     ▼
WorkspaceContext: Detect login
     │
     ▼
Load Guest Documents (IndexedDB)
     │ documents: [doc1, doc2, doc3, doc4, doc5]
     │
     ▼
Load Cloud Workspaces (Backend)
     │ workspaces: [workspace1, workspace2]
     │
     ▼
Show Merge UI:
     │ "You have 5 local documents"
     │ "Which workspace should we add them to?"
     │ 
     │ [x] Add to "Work Projects"
     │ [ ] Add to "Personal"
     │ [ ] Keep local-only
     │
     ▼
User Selects "Work Projects"
     │
     ▼
For each document:
     │
     ├─► POST /api/v1/documents
     │   Body: { id: doc.id, title, workspace_id }
     │
     ├─► Upload Yjs state to Hocuspocus
     │   (full document binary)
     │
     ├─► Update IndexedDB
     │   syncStatus: 'local' → 'synced'
     │
     └─► Update sidebar
         (show cloud icon)
     │
     ▼
Migration Complete
     │
     ├─► All documents visible
     ├─► Collaboration enabled
     └─► Cross-device sync active
```

---

## 12. Implementation Order

### **Phase 1: Foundation (Week 1-2)**

```
✅ Workspace Members System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 Database
    • Create workspace_members table
    • Add role enum (owner, editor, viewer)
    • Add indexes for workspace_id, user_id
    • Migration script

1.2 Backend API
    • POST   /api/v1/workspaces/{id}/members      (add member)
    • GET    /api/v1/workspaces/{id}/members      (list members)
    • PATCH  /api/v1/workspaces/{id}/members/{id} (change role)
    • DELETE /api/v1/workspaces/{id}/members/{id} (remove member)
    
    • Update WorkspaceService._check_workspace_access()
      (check members table, not just owner_id)
    
    • Update all routers to use new permission system

1.3 Frontend API Client
    • apiWorkspace.addMember(workspaceId, email, role)
    • apiWorkspace.listMembers(workspaceId)
    • apiWorkspace.updateMemberRole(workspaceId, memberId, role)
    • apiWorkspace.removeMember(workspaceId, memberId)

1.4 Frontend UI
    • WorkspaceSettings modal
      └─ Members tab
         ├─ Member list (avatar, name, role)
         ├─ Add member button → email input + role picker
         ├─ Role dropdown (for each member)
         └─ Remove member button

1.5 Testing
    • Test: Owner adds editor
    • Test: Editor can edit documents
    • Test: Viewer can only view
    • Test: Remove member (access revoked)

Dependencies: None
Duration: 1-2 weeks
Risk: Low (additive only, no breaking changes)
```

### **Phase 2: Invitations (Week 3)**

```
✅ Invitation System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 Database
    • Create invitations table
    • Add invitation_type enum
    • Add invitation_status enum
    • Add token (unique, for email link)
    • Add expiration (7 days default)

2.2 Backend API
    • POST   /api/v1/workspaces/{id}/invite     (create invitation)
    • GET    /api/v1/invitations/{token}        (get invitation details)
    • POST   /api/v1/invitations/{token}/accept (accept invitation)
    • POST   /api/v1/invitations/{token}/reject (reject invitation)
    
    • Email service (send invitation email)

2.3 Frontend
    • Invite modal (in workspace settings)
    • Invitation page (/invite/{token})
      └─ Show workspace details, inviter
      └─ [Accept] [Reject] buttons
    
    • Handle accept → add user to workspace → redirect

2.4 Email Template
    Subject: "{inviter} invited you to {workspace}"
    Body:
      "You've been invited to collaborate on {workspace}.
       Role: {role}
       
       [Accept Invitation] (link to /invite/{token})
       
       This invitation expires in 7 days."

Dependencies: Phase 1 (workspace members)
Duration: 1 week
Risk: Low (no core logic changes)
```

### **Phase 3: Hocuspocus Production (Week 4-6)**

```
✅ Hocuspocus + PostgreSQL Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 Database
    • Create document_collab_state table
    • Add yjs_state (BYTEA) column
    • Add yjs_version (INTEGER) column
    • Add last_edit_by, last_edit_at
    • Add size_bytes (for monitoring)

3.2 Hocuspocus Extensions
    • PostgreSQL Database Extension
      └─ onLoadDocument: Load Yjs state from PostgreSQL
      └─ onChange: Save Yjs state to PostgreSQL (debounced 2s)
    
    • Authentication Extension
      └─ Verify JWT token
      └─ Check document permission (call FastAPI)
      └─ Reject if unauthorized
    
    • Presence Extension
      └─ Track connected users in Redis
      └─ Broadcast awareness updates

3.3 Hocuspocus → FastAPI Integration
    • POST /api/v1/internal/auth/verify
      Body: { token: jwt }
      Response: { user_id, permissions }
    
    • GET /api/v1/internal/documents/{id}/permission
      Query: { user_id }
      Response: { can_edit: bool }

3.4 Frontend Changes
    • Enable WebSocket for shared workspaces
    • Show "Connecting..." indicator
    • Show "X users editing" badge
    • Handle connection errors gracefully

3.5 Monitoring
    • Log active connections (Redis)
    • Alert if PostgreSQL write fails
    • Track average sync latency

Dependencies: Phase 1 (workspace members for permissions)
Duration: 2-3 weeks
Risk: HIGH (critical infrastructure change)
Rollback Plan: Disable WebSocket, fall back to local-only
```

### **Phase 4: Real-Time Collaboration UI (Week 7-8)**

```
✅ Collaboration UI & UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Cursors & Selection
    • Show other users' cursors (colored, labeled)
    • Show other users' selections (highlight background)
    • Animate cursor movements
    • Hide cursor when user inactive (30s)

4.2 Presence UI
    • Avatar row in editor header
      └─ Show up to 5 avatars, +N for more
      └─ Tooltip: "Alice is editing"
      └─ Color-coded (matches cursor color)
    
    • Status indicator
      └─ 🟢 Synced (WebSocket connected)
      └─ 🟡 Syncing... (operation in progress)
      └─ 🔴 Offline (WebSocket disconnected)

4.3 Collaboration Events
    • Toast: "Bob joined the document"
    • Toast: "Alice left the document"
    • Toast: "Carol is viewing" (viewer, not editing)

4.4 Conflict Resolution UI
    • Should rarely happen (CRDT handles it)
    • If metadata conflict: Show dialog
      └─ "Your changes: ..."
      └─ "Bob's changes: ..."
      └─ [Keep Mine] [Keep Bob's] [Merge]

4.5 Performance
    • Throttle cursor updates (100ms)
    • Debounce awareness state (500ms)
    • Limit visible cursors (max 10)

Dependencies: Phase 3 (Hocuspocus)
Duration: 1-2 weeks
Risk: Medium (UI complexity, performance tuning)
```

### **Phase 5: Version History (Week 9-10)**

```
✅ Document Snapshots & Version History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 Database
    • Create document_snapshots table
    • Store Yjs binary + rendered HTML
    • Add version number (sequential)
    • Add snapshot_label (optional)

5.2 Backend Snapshot Service
    • Auto-snapshot every 50 operations
    • Manual snapshot: POST /api/v1/documents/{id}/snapshot
    • List snapshots: GET /api/v1/documents/{id}/snapshots
    • Restore snapshot: POST /api/v1/documents/{id}/restore/{version}

5.3 Frontend UI
    • Version History modal
      └─ Timeline view (vertical list)
      └─ Each version: date, author, preview
      └─ [Preview] button → show in read-only mode
      └─ [Restore] button → confirm dialog
    
    • Diff view (future enhancement)
      └─ Show changes between versions

5.4 Restoration Logic
    • Load snapshot Yjs state
    • Apply to current document
    • Create new snapshot (preserve current before restore)
    • Broadcast to collaborators (if connected)

Dependencies: Phase 3 (Yjs state storage)
Duration: 1-2 weeks
Risk: Low (non-critical feature)
```

### **Phase 6: Full Workspace Replication (Week 11-12)**

```
✅ Download All / Sync All
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6.1 Backend Export API
    • GET /api/v1/workspaces/{id}/export
      Returns: {
        workspace: {...},
        folders: [...],
        documents: [...],
        yjs_states: [...] (binary data)
      }
    
    • Paginated for large workspaces
    • Compressed (gzip)
    • Progress tracking (Redis)

6.2 Frontend Download Manager
    • "Download All" button in workspace settings
    • Progress modal
      └─ "Downloading 50 documents..."
      └─ Progress bar (0% → 100%)
      └─ [Cancel] button
    
    • Batch import to IndexedDB
      └─ Import metadata (GuestWorkspaceService)
      └─ Import Yjs states (y-indexeddb)
      └─ Update sync status

6.3 Conflict Detection
    • Before download: Check for local-only edits
    • If conflict: Show dialog
      └─ "You have X local changes"
      └─ [Backup local] [Overwrite] [Merge]

6.4 Selective Sync (Future)
    • User picks which documents to download
    • Checkbox list in workspace settings

Dependencies: Phase 3 (Yjs state in PostgreSQL)
Duration: 2-3 weeks
Risk: Medium (IndexedDB quotas, large data handling)
```

### **Phase 7: Activity Log & Audit Trail (Week 13)**

```
✅ Activity Log System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7.1 Database
    • Create activity_log table
    • Add activity_action enum
    • Add metadata (JSONB) for details
    • Add IP address, user agent

7.2 Backend Logging
    • Log decorator:
      @log_activity('document.updated')
      async def update_document(...):
    
    • Automatic logging in services
    • Async insert (non-blocking)

7.3 Frontend UI
    • Activity tab in workspace settings
      └─ Timeline view
      └─ Filter by user, action, date
      └─ Expandable details
    
    • Document-specific activity
      └─ Show in document info panel

7.4 Audit Trail
    • Who created/updated/deleted what
    • When permission changed
    • Who invited whom
    • Full history for compliance

Dependencies: None (standalone)
Duration: 1 week
Risk: Low (logging only)
```

---

## 13. UI Architecture (High-Level)

### **Component Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                     UI COMPONENT TREE                        │
└─────────────────────────────────────────────────────────────┘

App
├─ AuthProvider (Context)
│  └─ WorkspaceProvider (Context)
│     │
│     ├─ Login/Register Pages
│     │
│     └─ Authenticated Layout
│        │
│        ├─ Sidebar
│        │  ├─ WorkspaceSelector
│        │  ├─ FolderTree
│        │  ├─ DocumentList
│        │  └─ NewDocumentButton
│        │
│        ├─ Main Content
│        │  │
│        │  ├─ DocumentEditor
│        │  │  ├─ EditorHeader
│        │  │  │  ├─ DocumentTitle
│        │  │  │  ├─ CollaboratorAvatars
│        │  │  │  └─ SyncStatus
│        │  │  │
│        │  │  ├─ TipTapEditor
│        │  │  │  └─ (uses Yjs)
│        │  │  │
│        │  │  └─ EditorFooter
│        │  │     ├─ WordCount
│        │  │     ├─ SyncIndicator
│        │  │     └─ CollaborationStatus
│        │  │
│        │  └─ WorkspaceDashboard
│        │     ├─ RecentDocuments
│        │     ├─ ActivityFeed
│        │     └─ QuickActions
│        │
│        └─ Modals
│           ├─ NewDocumentModal
│           ├─ WorkspaceSettingsModal
│           ├─ InviteMemberModal
│           ├─ VersionHistoryModal
│           └─ ShareDocumentModal
```

### **State Management**

```typescript
// Auth State (React Context + localStorage)
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email, password) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

// Workspace State (React Context + IndexedDB cache)
interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  documents: Document[]
  folders: Folder[]
  
  createDocument: (type, title) => Promise<Document>
  deleteDocument: (id) => Promise<void>
  switchWorkspace: (id) => Promise<void>
  refreshDocuments: () => Promise<void>
}

// Editor State (Zustand)
interface EditorState {
  ydoc: Y.Doc | null
  isCollaborating: boolean
  collaborators: Collaborator[]
  syncStatus: 'local' | 'syncing' | 'synced'
  
  connectWebSocket: (documentId) => Promise<void>
  disconnectWebSocket: () => void
}

// UI State (Zustand)
interface UIState {
  showSidebar: boolean
  showAIModal: boolean
  showKeyboardShortcuts: boolean
  theme: 'light' | 'dark'
  
  toggleSidebar: () => void
  setTheme: (theme) => void
}
```

### **Routing**

```
/                           → Landing Page
/login                      → Login Page
/register                   → Register Page
/workspace                  → Workspace Dashboard (default workspace)
/workspace/:workspaceId     → Specific Workspace
/workspace/:workspaceId/:docId → Document Editor
/invite/:token              → Accept Invitation
/settings                   → User Settings
/settings/workspaces        → Workspace Settings
```

---

## 🎯 **Implementation Summary**

### **Total Timeline: 13 Weeks (3 months)**

| Phase | Duration | Risk | Dependencies |
|-------|----------|------|--------------|
| 1. Workspace Members | 1-2 weeks | Low | None |
| 2. Invitations | 1 week | Low | Phase 1 |
| 3. Hocuspocus Production | 2-3 weeks | HIGH | Phase 1 |
| 4. Collaboration UI | 1-2 weeks | Medium | Phase 3 |
| 5. Version History | 1-2 weeks | Low | Phase 3 |
| 6. Full Replication | 2-3 weeks | Medium | Phase 3 |
| 7. Activity Log | 1 week | Low | None |

### **Critical Path**

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
(Members) (Invite) (Hocuspocus) (Collab UI)
   ↓
Phase 5, 6, 7 (can be done in parallel after Phase 3)
```

### **MVP (Minimum Viable Product)**

```
Phase 1 + Phase 2 + Phase 3 + Phase 4 = Real-Time Collaboration MVP
Duration: 6-8 weeks
```

---

## ✅ **Architecture Checklist**

- [x] Local-first (IndexedDB always primary)
- [x] CRDT-based (Yjs handles conflicts)
- [x] Real-time collaboration (WebSocket)
- [x] Role-based permissions (Owner/Editor/Viewer)
- [x] Multi-user workspaces (workspace_members)
- [x] Fine-grained document permissions (document_permissions)
- [x] Version history (document_snapshots)
- [x] Offline-capable (works without network)
- [x] Cross-device sync (PostgreSQL + Hocuspocus)
- [x] Invitation system (email invites)
- [x] Audit trail (activity_log)
- [x] Presence tracking (Redis + awareness)
- [x] Scalable (PostgreSQL + Redis + Hocuspocus)

---

**Status**: 🟢 **ARCHITECTURE COMPLETE - READY FOR IMPLEMENTATION**  
**Next Step**: Begin Phase 1 (Workspace Members)

---

*This document is the definitive architectural blueprint for MDReader. All implementation must follow this specification.*


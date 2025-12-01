# 🔬 Comprehensive Collaboration Research & Implementation Plan

**Date**: November 5, 2025  
**Status**: Research & Planning Phase  
**Priority**: CRITICAL - Core Feature

---

## 📊 Executive Summary

Based on analysis of use cases and competitor research, **real-time collaboration is essential** for our product. The use cases demonstrate:
- **6 simultaneous editors** working on interconnected diagrams
- **4-hour intensive sessions** with zero data loss
- **150+ diagram components** created collaboratively
- **Real-time cross-validation** preventing design conflicts

**Decision**: Implement full real-time collaboration using **Yjs (CRDT) + WebSocket** architecture.

---

## 🏆 Competitor Analysis

### **1. Notion**
**Architecture:**
- **CRDT**: Uses Yjs internally
- **WebSocket**: Custom WebSocket server
- **Presence**: Redis for live cursors
- **Sync**: Operational transforms with automatic conflict resolution
- **Latency**: < 100ms for character-level updates

**Key Features:**
- ✅ Real-time character-level editing
- ✅ Live cursors with user avatars
- ✅ Comments and @mentions
- ✅ Version history
- ✅ Conflict-free editing (CRDT)

**Tech Stack:**
- Backend: Node.js + WebSocket
- Database: PostgreSQL
- Cache: Redis
- Frontend: React + Yjs

**Lessons Learned:**
- CRDT eliminates merge conflicts
- Presence tracking critical for UX
- Debounced persistence (save every 2-3 seconds)

---

### **2. Google Docs**
**Architecture:**
- **OT (Operational Transform)**: Custom OT algorithm
- **WebSocket**: Persistent connections
- **Presence**: In-memory presence tracking
- **Sync**: Character-level operational transforms

**Key Features:**
- ✅ Sub-100ms latency
- ✅ Live cursors and selections
- ✅ Comments and suggestions
- ✅ Version history
- ✅ Offline support

**Tech Stack:**
- Backend: Google's proprietary infrastructure
- Database: Spanner (distributed)
- Frontend: JavaScript + OT library

**Lessons Learned:**
- OT requires central server (more complex than CRDT)
- Excellent for text editing
- Harder to implement than CRDT

---

### **3. Cursor IDE**
**Architecture:**
- **CRDT**: Yjs for code editing
- **WebSocket**: Custom WebSocket API
- **Presence**: Real-time cursor positions
- **Sync**: Document-level CRDT sync

**Key Features:**
- ✅ Real-time code collaboration
- ✅ Live cursors
- ✅ Shared terminal sessions
- ✅ Low latency (< 50ms)

**Tech Stack:**
- Backend: Node.js + WebSocket
- Database: PostgreSQL
- Frontend: VS Code + Yjs

**Lessons Learned:**
- Yjs works excellently for code editors
- Presence is crucial for pair programming
- WebSocket connections must be resilient

---

### **4. Linear**
**Architecture:**
- **CRDT**: Yjs for issue editing
- **WebSocket**: GraphQL subscriptions
- **Presence**: Redis-based presence
- **Sync**: Real-time updates via WebSocket

**Key Features:**
- ✅ Real-time issue updates
- ✅ Live presence indicators
- ✅ Comments and mentions
- ✅ Instant notifications

**Tech Stack:**
- Backend: Node.js + GraphQL
- Database: PostgreSQL
- Cache: Redis
- Frontend: React + Yjs

**Lessons Learned:**
- GraphQL subscriptions work well for real-time
- Presence tracking improves collaboration UX
- CRDT handles concurrent edits perfectly

---

### **5. Figma**
**Architecture:**
- **CRDT**: Custom CRDT for vector graphics
- **WebSocket**: Persistent connections
- **Presence**: Live cursors and selections
- **Sync**: Operational transforms for graphics

**Key Features:**
- ✅ Real-time design collaboration
- ✅ Live cursors and selections
- ✅ Comments on design elements
- ✅ Version history
- ✅ Multiplayer editing

**Tech Stack:**
- Backend: Custom WebSocket infrastructure
- Database: PostgreSQL
- Frontend: WebGL + CRDT

**Lessons Learned:**
- CRDT works for complex data structures
- Presence is essential for design tools
- Real-time sync is non-negotiable

---

## 🔍 Our Current State Analysis

### **What We Have:**
✅ **Frontend:**
- React + TypeScript
- TipTap editor (ProseMirror-based)
- WorkspaceService (localStorage/file system)
- Document CRUD operations
- Mermaid diagram support
- Mindmap editor
- Presentation editor

✅ **Storage:**
- localStorage (web)
- File system (Tauri desktop)
- Hybrid storage architecture

✅ **Editor:**
- WYSIWYG editor
- Markdown mode
- Real-time content updates
- AI integration

### **What We're Missing:**
❌ **Backend:**
- No server infrastructure
- No user authentication
- No cloud storage
- No WebSocket server

❌ **Collaboration:**
- No real-time sync
- No presence tracking
- No live cursors
- No comments system
- No permissions

❌ **Infrastructure:**
- No database
- No WebSocket connections
- No Redis cache
- No notification system

---

## 🎯 Use Case Requirements Analysis

### **Use Case 1: Collaborative Diagram Editing**

**Requirements:**
1. **6 simultaneous editors** on same document
2. **Real-time diagram updates** (Mermaid syntax)
3. **Cross-diagram validation** (diagrams reference each other)
4. **Live comments** on diagram elements
5. **Color-coded cursors** for editor identification
6. **Zero data loss** during 4-hour session
7. **Conflict-free editing** (no merge conflicts)

**Technical Challenges:**
- Mermaid diagrams are text-based (easier than graphics)
- Need to sync markdown content in real-time
- Cross-references between diagrams
- Live preview updates

**Solution:**
- ✅ Yjs for markdown content sync
- ✅ WebSocket for real-time updates
- ✅ Redis for presence tracking
- ✅ TipTap + Yjs integration

---

### **Use Case 2: Real-Time Technical Specification**

**Requirements:**
1. **6 team members** editing simultaneously
2. **40+ page document** with complex content
3. **12 Mermaid diagrams** with collaborative input
4. **25+ tables** with live conflict resolution
5. **Timeline coordination** with multiple contributors
6. **Budget tables** with live calculations
7. **10.5-hour session** with zero data loss

**Technical Challenges:**
- Large document size (40+ pages)
- Complex content (diagrams, tables, markdown)
- Table editing conflicts
- Real-time calculations

**Solution:**
- ✅ Yjs for document sync
- ✅ Operational transforms for tables
- ✅ Debounced persistence (save every 2-3 seconds)
- ✅ Conflict resolution via CRDT

---

## 🏗️ Architecture Decision

### **Recommended Stack: Yjs + WebSocket**

**Why Yjs (CRDT) over Operational Transform:**
- ✅ **Easier to implement** (no central server required)
- ✅ **Conflict-free by design** (no merge conflicts)
- ✅ **Decentralized** (works offline)
- ✅ **Proven** (used by Notion, Linear, Cursor)
- ✅ **TipTap compatible** (Yjs integration available)

**Why WebSocket:**
- ✅ **Low latency** (< 100ms)
- ✅ **Bidirectional** (server can push updates)
- ✅ **Efficient** (persistent connections)
- ✅ **AWS API Gateway** supports WebSocket

---

## 🚀 Implementation Plan

### **Phase 1: Foundation (Weeks 1-4)**

#### **Week 1-2: Backend Infrastructure**
- [ ] Set up AWS ECS Fargate
- [ ] Set up AWS RDS PostgreSQL
- [ ] Set up AWS API Gateway WebSocket API
- [ ] Set up ElastiCache Redis
- [ ] Set up AWS Cognito (authentication)
- [ ] Deploy FastAPI backend

**Deliverables:**
- Backend API running
- Database schema created
- WebSocket endpoint ready

---

#### **Week 3-4: Authentication & User Management**
- [ ] Implement user signup/login (Cognito)
- [ ] User profiles and workspaces
- [ ] Document ownership
- [ ] Guest → User migration flow

**Deliverables:**
- Users can sign up and log in
- Workspaces created
- Documents linked to users

---

### **Phase 2: Real-Time Sync (Weeks 5-8)**

#### **Week 5-6: WebSocket Infrastructure**
- [ ] WebSocket connection handling
- [ ] Document room management
- [ ] Connection lifecycle (connect/disconnect)
- [ ] Heartbeat/ping-pong
- [ ] Error handling and reconnection

**Deliverables:**
- WebSocket connections working
- Document rooms functional
- Connection management stable

---

#### **Week 7-8: Yjs Integration**
- [ ] Integrate Yjs library (backend)
- [ ] Integrate Yjs library (frontend)
- [ ] TipTap + Yjs integration
- [ ] Document sync via WebSocket
- [ ] Update broadcasting
- [ ] Conflict resolution (CRDT)

**Deliverables:**
- Real-time document editing
- Multiple users can edit simultaneously
- Zero conflicts

---

### **Phase 3: Presence & Cursors (Weeks 9-10)**

#### **Week 9-10: Live Presence**
- [ ] Redis presence tracking
- [ ] Live cursor broadcasting
- [ ] User avatars display
- [ ] Selection highlighting
- [ ] Online/offline status
- [ ] User list in document

**Deliverables:**
- Live cursors visible
- User presence indicators
- Selection highlighting

---

### **Phase 4: Comments & Permissions (Weeks 11-12)**

#### **Week 11-12: Comments System**
- [ ] Comments table (RDS)
- [ ] Comment endpoints (REST)
- [ ] Inline comment UI
- [ ] Threaded discussions
- [ ] @mention system
- [ ] Comment notifications

**Deliverables:**
- Comments functional
- @mentions working
- Notifications delivered

---

#### **Week 13-14: Permissions & Sharing**
- [ ] Permissions table (RDS)
- [ ] Role-based access (Owner, Editor, Commenter, Viewer)
- [ ] Document sharing UI
- [ ] Invite links
- [ ] Email invites
- [ ] Permission checks

**Deliverables:**
- Document sharing working
- Permissions enforced
- Invites functional

---

### **Phase 5: Advanced Features (Weeks 15-16)**

#### **Week 15-16: Notifications & Polish**
- [ ] SNS topics setup
- [ ] Comment notifications
- [ ] @mention alerts
- [ ] Share invites
- [ ] Email integration (SES)
- [ ] In-app notifications
- [ ] Performance optimization

**Deliverables:**
- Full notification system
- Polished UX
- Production-ready

---

## 🛠️ Technical Implementation Details

### **1. Backend Architecture (FastAPI)**

```python
# WebSocket Handler
from fastapi import WebSocket, WebSocketDisconnect
from yjs import YDoc
import redis

redis_client = redis.Redis(host='redis-endpoint')

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.documents: dict[str, YDoc] = {}
    
    async def connect(self, websocket: WebSocket, document_id: str, user_id: str):
        await websocket.accept()
        
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
            self.documents[document_id] = YDoc()
        
        self.active_connections[document_id].append(websocket)
        
        # Update presence
        redis_client.setex(
            f"presence:{document_id}:{user_id}",
            300,  # 5 min TTL
            json.dumps({"online": True, "last_seen": time.time()})
        )
        
        # Broadcast user joined
        await self.broadcast(document_id, {
            "type": "user_joined",
            "user_id": user_id
        }, exclude=websocket)
    
    async def handle_update(self, websocket: WebSocket, document_id: str, update: bytes, user_id: str):
        # Apply Yjs update
        doc = self.documents[document_id]
        YDoc.apply_update(doc, update)
        
        # Broadcast to other clients
        await self.broadcast(document_id, {
            "type": "update",
            "update": base64.b64encode(update).decode(),
            "user_id": user_id
        }, exclude=websocket)
        
        # Persist to database (debounced)
        await self.save_document(document_id, doc)
    
    async def handle_cursor_move(self, websocket: WebSocket, document_id: str, position: dict, user_id: str):
        # Update cursor in Redis
        redis_client.setex(
            f"cursor:{document_id}:{user_id}",
            10,  # 10 sec TTL
            json.dumps(position)
        )
        
        # Broadcast cursor position
        await self.broadcast(document_id, {
            "type": "cursor_move",
            "user_id": user_id,
            "position": position
        }, exclude=websocket)
    
    async def broadcast(self, document_id: str, message: dict, exclude: WebSocket = None):
        if document_id in self.active_connections:
            for connection in self.active_connections[document_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except:
                        # Remove dead connections
                        self.active_connections[document_id].remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str):
    # Authenticate user
    token = websocket.query_params.get("token")
    user_id = await authenticate_token(token)
    
    await manager.connect(websocket, document_id, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["action"] == "update":
                await manager.handle_update(websocket, document_id, data["update"], user_id)
            elif data["action"] == "cursor_move":
                await manager.handle_cursor_move(websocket, document_id, data["position"], user_id)
            elif data["action"] == "comment":
                await manager.handle_comment(websocket, document_id, data, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, document_id, user_id)
```

---

### **2. Frontend Integration (React + TipTap + Yjs)**

```typescript
// Collaboration Hook
import { useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Collaboration } from '@tiptap/extension-collaboration'
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor'

export function useCollaborativeEditor(documentId: string, userId: string) {
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  
  useEffect(() => {
    // Connect to WebSocket
    const wsProvider = new WebsocketProvider(
      'wss://api.mdreader.app',
      `document-${documentId}`,
      ydoc,
      {
        params: { token: getAuthToken() }
      }
    )
    
    setProvider(wsProvider)
    
    return () => {
      wsProvider.destroy()
    }
  }, [documentId, ydoc])
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider!,
        user: {
          name: getUserName(),
          color: getUserColor(userId),
        },
      }),
    ],
    content: '',
  })
  
  return { editor, provider }
}
```

---

### **3. Database Schema**

```sql
-- Users (managed by Cognito, but we store metadata)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  cognito_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Markdown content
  type TEXT DEFAULT 'markdown', -- markdown, mindmap, presentation
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1 -- For optimistic concurrency
);

-- Document Permissions
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- owner, editor, commenter, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES comments(id), -- For threading
  content TEXT NOT NULL,
  position JSONB, -- {line: 10, column: 5, text: "selected text"}
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Versions (snapshots)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_permissions_user ON document_permissions(user_id);
```

---

### **4. Redis Schema (Presence & Cursors)**

```python
# Presence
presence:{document_id}:{user_id} = {
    "online": True,
    "last_seen": timestamp,
    "cursor": {"x": 100, "y": 200},
    "selection": {"start": 10, "end": 15}
}
TTL: 300 seconds (5 minutes)

# Document Room
document:{document_id}:users = Set of user_ids
TTL: None (managed by connection lifecycle)

# Cursor Positions
cursor:{document_id}:{user_id} = {
    "x": 100,
    "y": 200,
    "selection": {"start": 10, "end": 15}
}
TTL: 10 seconds
```

---

## 💰 Cost Analysis

### **Monthly Costs (First Year):**

```
Base Infrastructure:
- ECS Fargate:          $0-15/month (free tier)
- RDS PostgreSQL:       $0-20/month (free tier)
- S3 Storage:            $0-5/month (free tier)
- CloudFront:            $0/month (free tier)
- Cognito:               $0/month (free tier)
─────────────────────────────────────────────
Subtotal:               $0-40/month

Collaboration Features:
- WebSocket API:         $5-15/month
- ElastiCache Redis:     $0-15/month (free tier)
- SNS Notifications:     $2-5/month
─────────────────────────────────────────────
Subtotal:               $7-35/month

Total (First Year):     $7-75/month
```

### **Monthly Costs (After Free Tier):**

```
Base Infrastructure:     $35-70/month
Collaboration Features:  $22-35/month
─────────────────────────────────────────────
Total:                  $57-105/month
```

### **Monthly Costs (1000 Active Users):**

```
Base Infrastructure:     ~$116/month
Collaboration Features:  ~$50/month
─────────────────────────────────────────────
Total:                  ~$166/month
```

---

## ✅ Success Criteria

### **Functional Requirements:**
- ✅ 6+ simultaneous editors on same document
- ✅ < 100ms latency for character updates
- ✅ Zero data loss during 4+ hour sessions
- ✅ Live cursors visible to all users
- ✅ Comments appear instantly
- ✅ Cross-diagram validation working
- ✅ Conflict-free editing (CRDT)

### **Performance Requirements:**
- ✅ WebSocket connection: < 50ms latency
- ✅ Document sync: < 100ms latency
- ✅ Presence updates: < 50ms latency
- ✅ 99.9% uptime
- ✅ Support 1000+ concurrent users

### **UX Requirements:**
- ✅ Smooth real-time editing
- ✅ Clear user presence indicators
- ✅ Intuitive comment system
- ✅ Easy document sharing
- ✅ Mobile-responsive

---

## 🚨 Risks & Mitigation

### **Risk 1: WebSocket Connection Instability**
**Mitigation:**
- Implement automatic reconnection
- Heartbeat/ping-pong mechanism
- Connection pooling
- Fallback to polling if WebSocket fails

### **Risk 2: Yjs Performance with Large Documents**
**Mitigation:**
- Document chunking (split large docs)
- Debounced persistence (save every 2-3 seconds)
- Optimize Yjs update size
- Use document versioning

### **Risk 3: Cost Scaling**
**Mitigation:**
- Monitor usage closely
- Implement rate limiting
- Use free tier efficiently
- Optimize WebSocket message frequency

### **Risk 4: Data Consistency**
**Mitigation:**
- CRDT guarantees eventual consistency
- Database transactions for critical operations
- Version control for document snapshots
- Conflict resolution testing

---

## 📈 Timeline Summary

**Total Duration: 16 weeks (4 months)**

- **Weeks 1-4**: Foundation (Backend + Auth)
- **Weeks 5-8**: Real-Time Sync (WebSocket + Yjs)
- **Weeks 9-10**: Presence & Cursors
- **Weeks 11-14**: Comments & Permissions
- **Weeks 15-16**: Notifications & Polish

---

## 🎯 Next Steps

1. **Approve Architecture**: Review and approve Yjs + WebSocket approach
2. **Set Up AWS**: Create AWS account and set up services
3. **Start Week 1**: Begin backend infrastructure setup
4. **Weekly Reviews**: Review progress every week
5. **Testing**: Continuous testing throughout development

---

## 📚 References

- **Yjs Documentation**: https://docs.yjs.dev/
- **TipTap Collaboration**: https://tiptap.dev/guide/collaboration
- **AWS WebSocket API**: https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html
- **Notion Architecture**: https://www.notion.so/blog/sharding-postgres
- **CRDT Explained**: https://crdt.tech/

---

**Status**: Ready for implementation  
**Priority**: CRITICAL  
**Estimated Start**: Week 1  
**Estimated Completion**: Week 16


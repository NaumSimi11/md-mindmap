# 🤝 AWS Collaboration Features - Core Implementation

**Date**: October 30, 2025  
**Status**: CORE FEATURE (Not Optional)  
**Priority**: HIGHEST

---

## 🎯 **COLLABORATION IS OUR MAIN POINT**

Collaboration is **NOT** a future feature - it's **CORE** to the product!

---

## ✅ **COLLABORATION FEATURES**

### **1. Real-Time Document Editing**
- ✅ **WebSocket connections** (API Gateway WebSocket API)
- ✅ **CRDT-based conflict resolution** (Yjs library)
- ✅ **Operational transforms** (no conflicts, automatic merging)
- ✅ **Character-level synchronization** (see changes as they type)

### **2. Live Presence**
- ✅ **Live cursors** (see where each user is editing)
- ✅ **User avatars** (see who's online)
- ✅ **Selection highlighting** (see what each user selected)
- ✅ **Online/offline status** (who's currently viewing)

### **3. Comments & Discussions**
- ✅ **Inline comments** (comment on specific text/nodes)
- ✅ **Threaded discussions** (reply to comments)
- ✅ **@mentions** (notify specific users)
- ✅ **Resolve/unresolve** (mark comments as resolved)
- ✅ **Comment notifications** (real-time alerts)

### **4. Permissions & Sharing**
- ✅ **Role-based access** (Owner, Editor, Commenter, Viewer)
- ✅ **Document sharing** (invite links, email invites)
- ✅ **Workspace permissions** (team-level access control)
- ✅ **Public/private documents** (share publicly or keep private)

### **5. Notifications**
- ✅ **Comment notifications** (when someone comments)
- ✅ **@mention alerts** (when mentioned)
- ✅ **Document shares** (when invited to document)
- ✅ **Real-time delivery** (via SNS)

---

## 🏗️ **AWS SERVICES FOR COLLABORATION**

### **1. API Gateway WebSocket API**
**Purpose**: Real-time bidirectional communication

**Setup:**
```yaml
WebSocket API:
  Route Selection: $request.body.action
  Routes:
    - $connect: Handle connection
    - $disconnect: Handle disconnection
    - $default: Handle messages
    - join-document: Join document room
    - leave-document: Leave document room
    - update-document: Broadcast document changes
    - cursor-move: Broadcast cursor position
    - add-comment: Broadcast new comment
    - update-presence: Update user presence

Integration: ECS Fargate (FastAPI WebSocket handlers)
Auth: Cognito JWT tokens
```

**Cost:**
- $1.00 per million messages (first 1B free)
- $0.25 per million connection minutes
- **Total: ~$5-15/month** (depending on usage)

---

### **2. ElastiCache Redis**
**Purpose**: Presence tracking, live cursors, session management

**Setup:**
```yaml
Redis Cluster:
  Node Type: cache.t3.micro (free tier eligible)
  Engine: Redis 7.x
  Cluster Mode: Disabled (single node for v1)
  
Use Cases:
  - Presence: user_id → {online, cursor_position, document_id}
  - Cursors: document_id → {user_id: {x, y, selection}}
  - Sessions: connection_id → {user_id, document_id}
  - Rate Limiting: user_id → request_count
```

**Data Structure:**
```python
# Presence
redis.set(f"presence:{user_id}", json.dumps({
    "online": True,
    "document_id": "doc-123",
    "cursor": {"x": 100, "y": 200},
    "last_seen": timestamp
}), ex=300)  # 5 min TTL

# Document room
redis.sadd(f"document:{document_id}:users", user_id)
redis.publish(f"document:{document_id}", json.dumps({
    "type": "cursor_move",
    "user_id": user_id,
    "position": {"x": 100, "y": 200}
}))
```

**Cost:**
- **cache.t3.micro**: $0/month (Free Tier - 750 hours)
- **cache.t3.small**: $15/month (after free tier)
- **Total: $0-15/month**

---

### **3. Yjs (CRDT Library)**
**Purpose**: Conflict-free document editing

**How It Works:**
```python
# Backend (FastAPI)
from yjs import YDoc, YText

# Create shared document state
doc = YDoc()
text = doc.get_text("content")

# Apply updates from clients
def handle_update(update_bytes, user_id):
    YDoc.apply_update(doc, update_bytes)
    
    # Broadcast to other clients
    broadcast_to_room(document_id, update_bytes, exclude_user=user_id)
    
    # Persist to RDS
    save_document_version(document_id, doc.get_text("content").to_string())
```

**Frontend Integration:**
```typescript
// Frontend (React)
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const ytext = ydoc.getText('content')

// Connect to WebSocket
const provider = new WebsocketProvider(
  'wss://api.mdreader.app',
  `document-${documentId}`,
  ydoc
)

// Sync with editor
ytext.observe((event) => {
  // Update editor content
  editor.setContent(ytext.toString())
})
```

**Cost:**
- **Library**: Free (open source)
- **Infrastructure**: Included in WebSocket costs

---

### **4. DynamoDB Streams (Optional)**
**Purpose**: Real-time document change events

**Alternative**: Use RDS triggers + SNS for document change notifications

**Setup:**
```yaml
RDS Trigger:
  Event: INSERT/UPDATE on documents table
  Action: Publish to SNS topic
  Topic: document-changes
  
SNS Subscribers:
  - ElastiCache Redis (update cache)
  - WebSocket API (broadcast to clients)
  - CloudWatch (metrics)
```

**Cost:**
- RDS triggers: Included in RDS cost
- SNS: $0.50 per 100,000 notifications
- **Total: ~$1-3/month**

---

### **5. AWS SNS (Notifications)**
**Purpose**: Comment notifications, @mentions, shares

**Setup:**
```yaml
Topics:
  - comments: New comment notifications
  - mentions: @mention alerts
  - shares: Document share invites
  
Subscribers:
  - Email (SES)
  - Push notifications (future)
  - In-app notifications (WebSocket)
```

**Cost:**
- $0.50 per 100,000 notifications
- **Total: ~$2-5/month**

---

## 📊 **DATABASE SCHEMA FOR COLLABORATION**

### **Comments Table:**
```sql
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

CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

### **Permissions Table:**
```sql
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL, -- owner, editor, commenter, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_permissions_user ON document_permissions(user_id);
```

### **Presence Table (RDS) or Redis:**
```sql
-- Option A: RDS (for persistence)
CREATE TABLE presence (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  cursor_position JSONB,
  selection JSONB,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Option B: Redis (recommended for real-time)
-- Store in Redis with TTL (see ElastiCache section)
```

---

## 🔌 **API ENDPOINTS FOR COLLABORATION**

### **REST Endpoints:**
```
POST   /api/documents/:id/comments
GET    /api/documents/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/comments/:id/resolve

POST   /api/documents/:id/share
GET    /api/documents/:id/permissions
PATCH  /api/documents/:id/permissions/:user_id
DELETE /api/documents/:id/permissions/:user_id

GET    /api/documents/:id/presence
```

### **WebSocket Messages:**
```json
// Join document
{
  "action": "join-document",
  "document_id": "doc-123"
}

// Document update (Yjs update)
{
  "action": "update-document",
  "document_id": "doc-123",
  "update": "<base64_encoded_yjs_update>"
}

// Cursor move
{
  "action": "cursor-move",
  "document_id": "doc-123",
  "position": {"x": 100, "y": 200},
  "selection": {"start": 10, "end": 15}
}

// Add comment
{
  "action": "add-comment",
  "document_id": "doc-123",
  "content": "Great idea!",
  "position": {"line": 10, "column": 5}
}

// Presence update
{
  "action": "update-presence",
  "document_id": "doc-123",
  "status": "online"
}
```

---

## 🚀 **IMPLEMENTATION TIMELINE**

### **Week 5-6: WebSocket Infrastructure**
- [ ] Set up API Gateway WebSocket API
- [ ] Implement WebSocket handlers in FastAPI
- [ ] Set up ElastiCache Redis
- [ ] Implement connection management
- [ ] Test WebSocket connections

### **Week 7-8: Real-Time Editing (Yjs)**
- [ ] Integrate Yjs library
- [ ] Implement document sync via WebSocket
- [ ] Set up update broadcasting
- [ ] Handle conflicts (CRDT)
- [ ] Test multi-user editing

### **Week 9-10: Presence & Cursors**
- [ ] Implement presence tracking (Redis)
- [ ] Add live cursor broadcasting
- [ ] Show user avatars
- [ ] Selection highlighting
- [ ] Online/offline status

### **Week 11-12: Comments & Permissions**
- [ ] Create comments table (RDS)
- [ ] Implement comment endpoints
- [ ] Add inline comment UI
- [ ] Threaded discussions
- [ ] @mention system
- [ ] Permissions system
- [ ] Document sharing

### **Week 13-14: Notifications**
- [ ] Set up SNS topics
- [ ] Comment notifications
- [ ] @mention alerts
- [ ] Share invites
- [ ] Email integration (SES)
- [ ] In-app notifications

---

## 💰 **COST BREAKDOWN (WITH COLLABORATION)**

### **Additional Costs:**
```
WebSocket API Gateway: $5-15/month
ElastiCache Redis:     $0-15/month (free tier)
SNS Notifications:     $2-5/month
DynamoDB Streams:      $1-3/month (optional)

Total Additional: $8-38/month
```

### **Updated Total Cost:**
```
Base Backend:        $21-50/month
Collaboration:       $8-38/month
─────────────────────────────────
Total:              $29-88/month (first year)
Total (after free): $43-108/month
Total (1000 users):  ~$154/month
```

---

## ✅ **COLLABORATION FEATURES CHECKLIST**

### **Real-Time Editing:**
- [ ] WebSocket API Gateway setup
- [ ] Yjs CRDT integration
- [ ] Document sync broadcasting
- [ ] Conflict resolution (automatic)
- [ ] Character-level updates

### **Presence:**
- [ ] Redis presence tracking
- [ ] Live cursors
- [ ] User avatars
- [ ] Selection highlighting
- [ ] Online/offline status

### **Comments:**
- [ ] Comments table (RDS)
- [ ] Inline comments
- [ ] Threaded discussions
- [ ] @mentions
- [ ] Resolve/unresolve

### **Permissions:**
- [ ] Permissions table (RDS)
- [ ] Role-based access (Owner, Editor, Commenter, Viewer)
- [ ] Document sharing
- [ ] Invite links
- [ ] Email invites

### **Notifications:**
- [ ] SNS topics setup
- [ ] Comment notifications
- [ ] @mention alerts
- [ ] Share invites
- [ ] Email delivery (SES)

---

## 🎯 **SUCCESS METRICS**

- ✅ Multiple users can edit same document simultaneously
- ✅ Changes appear in real-time (< 100ms latency)
- ✅ No conflicts or data loss
- ✅ Live cursors visible to all users
- ✅ Comments appear instantly
- ✅ Notifications delivered in < 1 second

---

**Collaboration is CORE - not optional!** 🚀


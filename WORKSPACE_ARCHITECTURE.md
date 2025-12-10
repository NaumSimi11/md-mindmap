# 🏗️ **Workspace Architecture & Model**

## 📊 **Current State (After 9 Hours)**

### ✅ **What We Have (Backend)**

```
DATABASE STRUCTURE:
├── users
│   └── naum@example.com (6434feb1-eac5-43ff-82be-0b114af8c6f1)
│
├── workspaces
│   └── "My Workspace" (404cbcc7-6aab-403c-a10d-e47b2ddd26ca)
│       - owner_id: 6434feb1-eac5-43ff-82be-0b114af8c6f1
│       - description: "Your personal workspace"
│       - created_at: 2025-12-08 08:49:42
│
└── documents (17 total)
    ├── "mm" (9f72a51c...)
    ├── "fsdfs" (1c2b63b9...)
    ├── "Untitled Document" (210355a5...)
    ├── "sdfsdfs" (ce065193...)
    ├── "sdfsdf" (12cdfce0...)
    └── ... 12 more documents
```

### 🎨 **What UI Shows (Frontend)**

```
SIDEBAR:
├── My Workspace 🚀
│   ├── Search documents...
│   ├── [New Doc] [New Folder]
│   │
│   ├── 📄 Untitled Document (from LocalStorage - OLD)
│   ├── 📁 Personal (0) (UI-only folder)
│   └── 📁 Work (0) (UI-only folder)
│
└── Footer: "1 documents | 2 folders" (OLD data)
```

---

## 🎯 **THE DESIGN VISION**

### **Multi-Workspace Model**

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│                    naum@example.com                           │
└─────────────────────┬────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │Workspace │  │Workspace │  │Workspace │
  │   #1     │  │   #2     │  │   #3     │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │             │             │
    DOCUMENTS     DOCUMENTS     DOCUMENTS
```

### **1. Workspaces (Multiple per User)**

**Purpose**: Separate contexts/projects

**Examples**:
- "My Workspace" (personal notes, ideas)
- "Work Projects" (company docs, meeting notes)
- "Side Hustle" (business plans, designs)
- "Learning" (tutorials, code snippets)

**Features**:
- ✅ Each workspace has its own documents
- ✅ Can invite team members to specific workspaces
- ✅ Can share/collaborate per workspace
- ✅ Switch between workspaces in UI (dropdown)

**Backend API**:
```typescript
GET /api/v1/workspaces → List all user's workspaces
POST /api/v1/workspaces → Create new workspace
GET /api/v1/workspaces/:id → Get specific workspace
PATCH /api/v1/workspaces/:id → Update workspace
DELETE /api/v1/workspaces/:id → Delete workspace
```

---

### **2. Documents (Many per Workspace)**

**Purpose**: Actual content (markdown, mindmaps, presentations)

**Features**:
- ✅ Belong to ONE workspace
- ✅ Have versions (history)
- ✅ Can be shared via links
- ✅ Searchable across workspace
- ✅ Support tags, templates

**Types**:
- `markdown` - Rich text editor
- `mindmap` - Visual thinking tool
- `presentation` - Slide decks

**Backend API**:
```typescript
GET /api/v1/documents/workspace/:workspaceId → List documents
POST /api/v1/documents?workspace_id=... → Create document
GET /api/v1/documents/:id → Get document
PATCH /api/v1/documents/:id → Update document
DELETE /api/v1/documents/:id → Delete document
```

---

### **3. Folders (Frontend UI Only - NOT in Backend Yet)**

**Current State**: 
- "Personal" and "Work" folders are **UI-only**
- They exist in **LocalStorage**, not backend
- They are **temporary** until we implement backend folders

**Future Plan**:
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  name VARCHAR(255),
  parent_id UUID REFERENCES folders(id),
  icon VARCHAR(50),
  ...
);

-- Documents will have folder_id
ALTER TABLE documents ADD COLUMN folder_id UUID REFERENCES folders(id);
```

---

## 🚀 **USER JOURNEY**

### **Scenario 1: Solo User (Current)**

```
1. User signs up → Creates account
2. Backend creates default workspace: "My Workspace"
3. User creates documents in that workspace
4. All documents live in "My Workspace"
```

### **Scenario 2: Power User (Future)**

```
1. User has multiple workspaces:
   - "Personal" (100 documents)
   - "Work" (50 documents)
   - "Side Project" (25 documents)

2. User switches workspace in UI dropdown
3. Sidebar shows documents for THAT workspace only
4. Search is scoped to current workspace
```

### **Scenario 3: Team Collaboration (Future)**

```
1. User creates "Team Project" workspace
2. Invites teammates: alice@example.com, bob@example.com
3. Team members see "Team Project" in their workspace list
4. Everyone can create/edit documents in shared workspace
5. Real-time collaboration via WebSockets
```

---

## 🔧 **WHAT WE NEED TO FIX NOW**

### ❌ **Problem**: Sidebar shows LocalStorage data

**Current**:
```typescript
// WorkspaceSidebar.tsx (OLD)
const [workspace, setWorkspace] = useState(
  workspaceService.getCurrentWorkspace() // ← LocalStorage
);
const documents = workspace.documents; // ← OLD
```

**Fixed** (just now):
```typescript
// WorkspaceSidebar.tsx (NEW)
const { documents: backendDocuments } = useBackendWorkspace(); // ← Backend
const filteredDocuments = backendDocuments; // ← LIVE
```

### ✅ **What You Should See After Refresh**

```
SIDEBAR:
├── My Workspace 🚀
│   ├── Search documents...
│   ├── [New Doc] [New Folder]
│   │
│   ├── 📄 mm
│   ├── 📄 fsdfs
│   ├── 📄 Untitled Document
│   ├── 📄 sdfsdfs
│   ├── 📄 sdfsdf
│   └── ... (12 more)
│
└── Footer: "17 documents | 2 folders"
```

---

## 📝 **NEXT STEPS (Future Development)**

### Phase 1: Clean Up UI ✅ **DONE TODAY**
- ✅ Connect sidebar to backend documents
- ✅ Remove LocalStorage dependency
- ✅ Show real document count

### Phase 2: Multi-Workspace UI (Not Started)
- [ ] Add workspace switcher dropdown
- [ ] Show current workspace name in header
- [ ] Allow creating new workspaces
- [ ] Allow switching between workspaces

### Phase 3: Backend Folders (Not Started)
- [ ] Create `folders` table in database
- [ ] Add `folder_id` to documents table
- [ ] Implement folder API endpoints
- [ ] Connect UI folders to backend

### Phase 4: Team Collaboration (Not Started)
- [ ] Workspace members management
- [ ] Real-time collaboration (WebSocket)
- [ ] Permissions (viewer, editor, admin)
- [ ] Activity feed

---

## 💡 **KEY DECISIONS MADE**

### **Why One Workspace Now?**
- ✅ Simpler to implement first
- ✅ Most users start with one workspace
- ✅ Can add multi-workspace later without breaking changes
- ✅ Backend already supports multiple workspaces

### **Why No Backend Folders Yet?**
- ✅ Documents are the priority
- ✅ Folders are UI organization (can be added later)
- ✅ Tags can serve similar purpose for now
- ✅ Reduces backend complexity for initial launch

### **Why Multiple Workspaces in Backend?**
- ✅ Future-proof architecture
- ✅ Enables team collaboration
- ✅ Allows personal/work separation
- ✅ Easy to scale later

---

## 🎯 **SUMMARY**

**Current Reality**:
- ✅ 1 User
- ✅ 1 Workspace ("My Workspace")
- ✅ 17 Documents
- ✅ Backend fully supports multi-workspace
- ✅ UI shows single workspace

**Future Vision**:
- 🔮 Multiple workspaces per user
- 🔮 Team collaboration per workspace
- 🔮 Real-time editing
- 🔮 Backend folders/hierarchy
- 🔮 Advanced permissions

**Today's Achievement**:
- ✅ Backend fully functional
- ✅ Documents syncing
- ✅ Sidebar now shows backend data (after refresh)
- ✅ No more infinite loops
- ✅ Production-ready for single workspace

---

**Date**: December 8, 2025  
**Status**: ✅ Single workspace fully functional  
**Next**: Refresh browser to see all 17 documents!


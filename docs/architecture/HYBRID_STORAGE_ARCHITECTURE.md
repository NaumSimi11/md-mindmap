# 🗄️ Hybrid Storage Architecture

> **Goal**: Support 3 storage modes without breaking existing functionality
> **Modes**: Guest (temp), Local (Tauri), Cloud (sync)

---

## 🎯 Design Principles

1. **Non-Breaking**: Existing localStorage functionality must work
2. **Progressive Enhancement**: Add features without disrupting current users
3. **Mode Switching**: User can switch between local/cloud seamlessly
4. **Data Safety**: Never lose user data during transitions

---

## 📊 Storage Modes

### **Mode 1: Guest (Temporary)** 🧪
**Use Case**: First-time users, no signup, testing features

**Storage**: `localStorage` (temporary)
**Limitations**:
- 3 free AI generations per day
- Data persists only in current browser
- No sync across devices
- Lost on cache clear

**Data Structure**:
```typescript
// localStorage keys
{
  "guest-session-id": "abc123",
  "guest-credits-remaining": 2,
  "guest-credits-reset": "2025-10-04T00:00:00Z",
  "guest-documents": [
    {
      id: "temp-1234",
      type: "markdown",
      title: "Untitled Document",
      content: "# Hello\n\nContent here...",
      createdAt: "2025-10-03T14:30:00Z",
      isGuest: true
    }
  ]
}
```

**Upgrade Path**:
- Show banner: "Sign up to save permanently"
- On signup → Migrate all guest docs to user's workspace

---

### **Mode 2: Local (Tauri Desktop)** 🖥️
**Use Case**: Desktop app users, offline work, privacy-focused

**Storage**: Native file system via Tauri APIs
**Benefits**:
- 100% offline functionality
- Fast read/write (no network)
- Standard folder structure
- Use native file picker
- Backup with Time Machine / File History

**File System Structure**:
```
~/Documents/[AppName]/
├── Workspaces/
│   ├── Default Workspace/
│   │   ├── workspace.json          # Metadata
│   │   ├── Documents/
│   │   │   ├── meeting-notes.md
│   │   │   └── project-brief.md
│   │   ├── Mindmaps/
│   │   │   ├── roadmap-q1.json
│   │   │   └── brainstorm.json
│   │   └── Presentations/
│   │       └── pitch-deck.json
│   └── Work Projects/
│       └── ...
└── .app-config.json                # User preferences
```

**Tauri Commands**:
```rust
// src-tauri/src/commands/storage.rs

#[tauri::command]
fn save_document(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_document(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_workspace_files(workspace_path: String) -> Result<Vec<FileInfo>, String> {
    // Scan directory, return file metadata
}

#[tauri::command]
fn create_workspace_folder(path: String, name: String) -> Result<(), String> {
    fs::create_dir(format!("{}/{}", path, name)).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_file_picker() -> Result<String, String> {
    // Native file picker dialog
}
```

**TypeScript Service**:
```typescript
// src/services/storage/LocalStorageService.ts

import { invoke } from '@tauri-apps/api/tauri';

export class LocalStorageService {
  private workspacePath: string;
  
  async saveDocument(doc: Document): Promise<void> {
    const filePath = this.getDocumentPath(doc);
    await invoke('save_document', { 
      path: filePath, 
      content: doc.content 
    });
  }
  
  async loadDocument(id: string): Promise<Document> {
    const filePath = this.getDocumentPath({ id });
    const content = await invoke('load_document', { path: filePath });
    return { id, content, /* ... */ };
  }
  
  async listWorkspaceDocuments(): Promise<Document[]> {
    const files = await invoke('list_workspace_files', { 
      workspacePath: this.workspacePath 
    });
    return files.map(this.parseFileToDocument);
  }
  
  private getDocumentPath(doc: Partial<Document>): string {
    // ~/Documents/AppName/Workspaces/Default/Documents/doc-id.md
    return `${this.workspacePath}/Documents/${doc.id}.md`;
  }
}
```

---

### **Mode 3: Cloud (Backend Sync)** ☁️
**Use Case**: Multi-device users, collaboration, teams

**Storage**: PostgreSQL (metadata) + S3 (content)
**Benefits**:
- Sync across all devices
- Real-time collaboration
- Share links
- Version history
- Team workspaces

**Backend Stack**:
- **API**: Node.js + Express / Fastify
- **Database**: PostgreSQL (Supabase or AWS RDS)
- **Files**: S3 / R2 (Cloudflare)
- **Auth**: Clerk or Supabase Auth
- **Sync**: WebSocket or Server-Sent Events

**Database Schema**:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free', -- free, pro, team
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  owner_id UUID REFERENCES users(id),
  storage_mode TEXT DEFAULT 'cloud', -- local or cloud
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members (for collaboration)
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- owner, admin, member, viewer
  PRIMARY KEY (workspace_id, user_id)
);

-- Folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  parent_id UUID REFERENCES folders(id),
  name TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  folder_id UUID REFERENCES folders(id),
  type TEXT NOT NULL, -- markdown, mindmap, presentation
  title TEXT NOT NULL,
  content_url TEXT, -- S3 URL or inline for small docs
  starred BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  metadata JSONB, -- { wordCount, nodeCount, etc. }
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_by UUID REFERENCES users(id)
);

-- Document versions (for history)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  version_number INTEGER,
  content_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaboration (comments, mentions)
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints**:
```typescript
// Backend API routes

// Workspaces
POST   /api/workspaces                     // Create workspace
GET    /api/workspaces                     // List user's workspaces
GET    /api/workspaces/:id                 // Get workspace details
PATCH  /api/workspaces/:id                 // Update workspace
DELETE /api/workspaces/:id                 // Delete workspace

// Documents
POST   /api/workspaces/:id/documents       // Create document
GET    /api/workspaces/:id/documents       // List documents
GET    /api/documents/:id                  // Get document
PATCH  /api/documents/:id                  // Update document
DELETE /api/documents/:id                  // Delete document
GET    /api/documents/:id/versions         // Get version history

// Folders
POST   /api/workspaces/:id/folders         // Create folder
GET    /api/workspaces/:id/folders         // List folders
PATCH  /api/folders/:id                    // Update folder
DELETE /api/folders/:id                    // Delete folder

// Collaboration
POST   /api/documents/:id/share            // Generate share link
POST   /api/documents/:id/comments         // Add comment
GET    /api/documents/:id/comments         // Get comments
PATCH  /api/comments/:id                   // Update comment
```

**TypeScript Service**:
```typescript
// src/services/storage/CloudStorageService.ts

export class CloudStorageService {
  private apiUrl = import.meta.env.VITE_API_URL;
  private authToken: string;
  
  async saveDocument(doc: Document): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to save document');
  }
  
  async loadDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.apiUrl}/api/documents/${id}`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    
    if (!response.ok) throw new Error('Document not found');
    return response.json();
  }
  
  async syncWorkspace(workspaceId: string): Promise<void> {
    // Fetch all documents from server
    // Compare with local cache
    // Upload changes, download updates
  }
}
```

---

## 🔄 Storage Service Abstraction

**Unified Interface** (works for all modes):

```typescript
// src/services/storage/StorageService.ts

export type StorageMode = 'guest' | 'local' | 'cloud';

export interface IStorageService {
  // Documents
  saveDocument(doc: Document): Promise<void>;
  loadDocument(id: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(workspaceId: string): Promise<Document[]>;
  
  // Workspaces
  createWorkspace(name: string): Promise<Workspace>;
  listWorkspaces(): Promise<Workspace[]>;
  
  // Folders
  createFolder(workspaceId: string, name: string): Promise<Folder>;
  listFolders(workspaceId: string): Promise<Folder[]>;
  
  // Search
  searchDocuments(query: string): Promise<Document[]>;
  
  // Mode info
  getStorageMode(): StorageMode;
  canSwitchMode(newMode: StorageMode): boolean;
  switchMode(newMode: StorageMode, migrate: boolean): Promise<void>;
}

// Factory function
export function createStorageService(mode: StorageMode): IStorageService {
  switch (mode) {
    case 'guest':
      return new GuestStorageService(); // localStorage
    case 'local':
      return new LocalStorageService(); // Tauri file system
    case 'cloud':
      return new CloudStorageService(); // Backend API
  }
}

// Global storage service (auto-detect mode)
export const storageService = createStorageService(detectStorageMode());

function detectStorageMode(): StorageMode {
  // Check if Tauri is available
  if (typeof window.__TAURI__ !== 'undefined') {
    // Check if user is logged in
    const authToken = localStorage.getItem('auth-token');
    if (authToken) {
      // User preference: local or cloud?
      const pref = localStorage.getItem('storage-mode-preference');
      return pref === 'local' ? 'local' : 'cloud';
    }
    return 'local'; // Default for desktop
  }
  
  // Web app
  const authToken = localStorage.getItem('auth-token');
  return authToken ? 'cloud' : 'guest';
}
```

---

## 🔄 Migration Between Modes

### **Guest → Cloud (Sign Up)**
```typescript
async function migrateGuestToCloud(userId: string, authToken: string) {
  // 1. Get all guest documents
  const guestDocs = JSON.parse(localStorage.getItem('guest-documents') || '[]');
  
  // 2. Create default workspace in cloud
  const workspace = await cloudService.createWorkspace('My Workspace');
  
  // 3. Upload all documents
  for (const doc of guestDocs) {
    await cloudService.saveDocument({
      ...doc,
      workspaceId: workspace.id,
      id: undefined, // Let server generate new ID
    });
  }
  
  // 4. Clear guest data
  localStorage.removeItem('guest-documents');
  localStorage.removeItem('guest-session-id');
  
  // 5. Set new storage mode
  localStorage.setItem('storage-mode-preference', 'cloud');
  localStorage.setItem('auth-token', authToken);
  
  console.log(`✅ Migrated ${guestDocs.length} documents to cloud`);
}
```

### **Local → Cloud (Enable Sync)**
```typescript
async function enableCloudSync(workspaceId: string) {
  // 1. Get all local documents
  const localDocs = await localService.listDocuments(workspaceId);
  
  // 2. Upload to cloud
  for (const doc of localDocs) {
    await cloudService.saveDocument(doc);
  }
  
  // 3. Update workspace metadata
  await cloudService.updateWorkspace(workspaceId, { 
    storageMode: 'cloud' 
  });
  
  // 4. Keep local files as cache
  // (Don't delete for offline access)
  
  console.log(`✅ Synced ${localDocs.length} documents to cloud`);
}
```

### **Cloud → Local (Go Offline)**
```typescript
async function downloadWorkspaceForOffline(workspaceId: string) {
  // 1. Fetch all cloud documents
  const cloudDocs = await cloudService.listDocuments(workspaceId);
  
  // 2. Save to local file system
  for (const doc of cloudDocs) {
    await localService.saveDocument(doc);
  }
  
  // 3. Update preference
  localStorage.setItem('storage-mode-preference', 'local');
  
  console.log(`✅ Downloaded ${cloudDocs.length} documents for offline use`);
}
```

---

## 🛡️ Data Safety Guarantees

### **Never Lose Data:**

1. **Always keep backups**:
   ```typescript
   async function migrateWithBackup() {
     // Before any migration:
     const backup = await createBackup();
     localStorage.setItem('migration-backup', JSON.stringify(backup));
     
     try {
       await performMigration();
       // Success - keep backup for 7 days
     } catch (error) {
       // Failure - restore from backup
       await restoreFromBackup(backup);
     }
   }
   ```

2. **Atomic operations**:
   - Use transactions for multi-step operations
   - Rollback on any failure

3. **Sync conflicts**:
   - Last-write-wins (simple)
   - Or: CRDTs for real-time collaboration (advanced)

4. **Export anytime**:
   - User can export entire workspace as ZIP
   - Markdown files + JSON for mindmaps

---

## 🚀 Implementation Priority

### **Phase 1: Preserve Current (Week 1)**
- ✅ Keep all existing localStorage code
- ✅ Create `StorageService` abstraction
- ✅ Implement `GuestStorageService` (current behavior)

### **Phase 2: Local Mode (Week 2)**
- Add Tauri file system commands
- Implement `LocalStorageService`
- Test on macOS/Windows/Linux

### **Phase 3: Cloud Mode (Week 3-4)**
- Build backend API (Node.js + PostgreSQL)
- Implement `CloudStorageService`
- Add auth (Clerk/Supabase)
- Sync engine

### **Phase 4: Migration Tools (Week 5)**
- Guest → Cloud migration on signup
- Local ↔ Cloud switching
- Export/import tools

---

## ✅ Success Criteria

1. **Zero Data Loss**: No user ever loses a document
2. **Mode Switching**: Switch local ↔ cloud in <5 seconds
3. **Offline First**: Desktop app works 100% offline
4. **Sync Speed**: Cloud sync <2 seconds for typical doc
5. **Backwards Compatible**: Existing localStorage users unaffected

---

**This architecture ensures we can add workspace features WITHOUT breaking anything!** 🎉


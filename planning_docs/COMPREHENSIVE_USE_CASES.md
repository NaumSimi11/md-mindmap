# 🎯 **MDReader: Comprehensive Use Cases & Scenarios**

**Date**: December 10, 2025  
**Status**: 🔥 **COMPLETE REAL-WORLD SCENARIOS**  
**Purpose**: Every possible user flow, edge case, and scenario

---

## 📋 **Table of Contents**

1. [Initial Setup & Onboarding](#1-initial-setup--onboarding)
2. [Local-Only Workflows](#2-local-only-workflows)
3. [Account Creation & Login](#3-account-creation--login)
4. [Cloud Sync Scenarios](#4-cloud-sync-scenarios)
5. [Offline/Online Transitions](#5-offlineonline-transitions)
6. [Collaboration Scenarios](#6-collaboration-scenarios)
7. [AI Features](#7-ai-features)
8. [Edge Cases & Conflicts](#8-edge-cases--conflicts)
9. [Data Migration & Import](#9-data-migration--import)
10. [Disaster Recovery](#10-disaster-recovery)
11. [Multi-Window & Browser Edge Cases](#11-multi-window--browser-edge-cases)
12. [Power User Features (Phase 5)](#12-power-user-features-phase-5)
13. [Performance & Scale](#13-performance--scale)
14. [Network Edge Cases](#14-network-edge-cases)
15. [Authentication & Security](#15-authentication--security)
16. [Version Control](#16-version-control)
17. [Monitoring & Error Handling](#17-monitoring--error-handling)
18. [Advanced Features (Phase 7)](#18-advanced-features-phase-7)

---

## 1. Initial Setup & Onboarding

### **Scenario 1.1: First-Time Desktop Install**

```
User downloads MDReader.dmg (or .exe/.deb)
        ↓
    Double-click to install
        ↓
    App opens for first time
        ↓
    [Welcome Screen]
    "Welcome to MDReader - Your Local-First Markdown Editor"
    
    [What happens on first launch]
    1. Create ~/Documents/MDReader/ folder (main folder, can't be deleted)
    2. Create ~/Documents/MDReader/.mdreader/ (config folder, hidden)
    3. Create default workspace: ~/Documents/MDReader/My Workspace/
    4. Show "Start Writing" button
        ↓
    User clicks "Start Writing"
    [USER-INPUT] - We have landing page - we should use it. there is open md file, open file, drop some file here , start writing, or get ai to write. so check the lanfing page, and we can make plan for improving it! 
        ↓
    Open blank editor
        ↓
    NO LOGIN REQUIRED ✅
    NO ACCOUNT NEEDED ✅
    NO INTERNET NEEDED ✅
```

**File Structure Created**:
```
~/Documents/MDReader/
├─ .mdreader/
│  ├─ config.json          (app settings, AI keys)
│  ├─ workspace.db         (SQLite for metadata)
│  └─ cache/               (thumbnails, previews)
│
├─ My Workspace/           (default, can't delete)
│  └─ Welcome.md           (intro document)
│
└─ (user creates more folders/files here)
```

**config.json**:
```json
{
  "version": "1.0.0",
  "user": {
    "logged_in": false,
    "user_id": null,
    "email": null
  },
  "sync": {
    "online_mode": false,
    "auto_sync": false,
    "last_sync": null
  },
  "ai": {
    "openai_api_key": null,
    "anthropic_api_key": null,
    "default_provider": "openai",
    "default_model": "gpt-4"
  },
  "editor": {
    "auto_save": true,
    "auto_save_interval": 5000,
    "theme": "system",
    "font_size": 16
  }
}
```

---

### **Scenario 1.2: Import Existing .md Files**

```
User has 100 .md files in ~/Documents/Notes/
        ↓
    Opens MDReader
        ↓
    File → Import Folder
        ↓
    [Native File Picker Opens]
    Select ~/Documents/Notes/
        ↓
    [Import Dialog]
    "Found 100 markdown files. Import?"
    
    Options:
    [ ] Copy files to MDReader folder (recommended)
    [ ] Link to original location (files stay where they are)
    [ ] Create folder structure (keep original hierarchy)
        ↓
    User selects "Copy" + "Keep structure"
        ↓
    MDReader copies:
    ~/Documents/Notes/Project A/doc1.md
    →
    ~/Documents/MDReader/My Workspace/Notes/Project A/doc1.md
        ↓
    Show in sidebar ✅
        ↓
    All files are LOCAL ONLY (no cloud)
```

**What MDReader Does**:
1. Copy .md files to ~/Documents/MDReader/
2. Parse frontmatter (if exists)
3. Create folder structure
4. Index in workspace.db
5. Generate thumbnails (async)
6. Show in sidebar tree

---

## 2. Local-Only Workflows

### **Scenario 2.1: Create New Document (No Login)**

```
User clicks "New Document" button
        ↓
    [No login required]
        ↓
    Create new file:
    ~/Documents/MDReader/My Workspace/Untitled.md
        ↓
    Open in editor
        ↓
    User types: "# My First Note"
        ↓
    [Auto-save enabled by default]
    After 5 seconds of inactivity → Save to disk
        ↓
    File saved: ~/Documents/MDReader/My Workspace/Untitled.md
        ↓
    Sidebar updates (shows "Untitled")
        ↓
    User continues working...
```

**Auto-Save Logic**:
```typescript
// Editor auto-save
let autoSaveTimer: NodeJS.Timeout;

editor.on('update', ({ editor }) => {
  clearTimeout(autoSaveTimer);
  
  if (config.editor.auto_save) {
    autoSaveTimer = setTimeout(async () => {
      await saveToFilesystem(editor.getHTML());
      showToast('Saved', { duration: 1000 });
    }, config.editor.auto_save_interval);
  }
});
```

**Manual Save**:
- Cmd+S (Mac) / Ctrl+S (Windows)
- File menu → Save
- Auto-save toggle in settings

---

### **Scenario 2.2: Organize with Folders (Local)**

```
User has 20 documents in root
        ↓
    Right-click in sidebar → "New Folder"
        ↓
    Enter name: "Work Projects"
        ↓
    Create folder:
    ~/Documents/MDReader/My Workspace/Work Projects/
        ↓
    Drag documents into folder
        ↓
    File system moves files:
    ~/Documents/MDReader/My Workspace/doc1.md
    →
    ~/Documents/MDReader/My Workspace/Work Projects/doc1.md
        ↓
    Sidebar updates (nested tree view)
```

**Folder Operations**:
- Create folder: Right-click → "New Folder"
- Rename folder: Right-click → "Rename"
- Delete folder: Right-click → "Delete" (moves to trash)
- Drag-and-drop: Drag file/folder to reorder
- Nested folders: Unlimited depth

---

### **Scenario 2.3: AI Features (No Account)**

```
User wants to use AI to generate mindmap
        ↓
    Click "Generate Mindmap" button
        ↓
    [First Time]
    "AI features require an API key"
    
    [Settings Dialog Opens]
    AI Settings:
    ┌────────────────────────────────────────┐
    │ Provider: [OpenAI ▼]                  │
    │ API Key: [••••••••••••••••••••••••]   │
    │ Model:   [gpt-4 ▼]                     │
    │                                        │
    │ [Test Connection] [Save]               │
    └────────────────────────────────────────┘
        ↓
    User enters OpenAI API key
        ↓
    Click "Test Connection"
        ↓
    ✅ "Connection successful!"
        ↓
    Click "Save"
        ↓
    API key saved to:
    ~/Documents/MDReader/.mdreader/config.json
    (encrypted at rest)
        ↓
    Now AI features work (all local, no account needed)
```

**AI Features (No Login Required)**:
- Generate mindmap from markdown
- AI autocomplete
- Grammar/style suggestions
- Summarize document
- Generate outline
- Rewrite/improve text

**API Keys Stored**:
```json
{
  "ai": {
    "openai_api_key": "sk-...",  // Encrypted
    "anthropic_api_key": null,
    "google_ai_key": null
  }
}
```

---

## 3. Account Creation & Login

### **Scenario 3.1: Create Account (Optional)**

```
User has 50 local documents
        ↓
    Wants to sync across devices
        ↓
    Click "Sign Up" (in menu bar)
        ↓
    [Sign Up Dialog]
    Email: _________________
    Password: _________________
    Confirm: _________________
        ↓
    Submit
        ↓
    POST /api/v1/auth/register
        ↓
    Receive JWT token
        ↓
    [Important: User still logged out by default]
    
    [Migration Dialog]
    "You have 50 local documents. What do you want to do?"
    
    ( ) Keep local only (don't sync anything)
    ( ) Sync selected documents (choose which ones)
    (•) Sync all documents (recommended)
    
    [Next]
        ↓
    User selects "Sync all"
        ↓
    [Confirmation]
    "This will upload 50 documents to your cloud account.
     Your local files will remain on your device.
     Continue?"
    
    [Cancel] [Yes, Sync]
        ↓
    User clicks "Yes, Sync"
        ↓
    [Progress Dialog]
    Uploading... (1/50) doc1.md ✅
    Uploading... (2/50) doc2.md ✅
    ...
        ↓
    [Complete]
    "✅ 50 documents synced to cloud"
    
    Now user is logged in
    Online Mode: ON
```

**What Happens Server-Side**:
```typescript
// For each document
POST /api/v1/documents
{
  title: "doc1.md",
  content: "...",
  yjs_state: <base64-encoded>,
  workspace_id: "...",
  folder_path: "/Work Projects/doc1.md"
}

// Server creates:
1. Document metadata in PostgreSQL
2. Yjs state in document_collab_state table
3. File hierarchy in folders table
4. Returns remote_id for each doc
```

**Local Metadata Updated**:
```json
// ~/Documents/MDReader/.mdreader/workspace.db
{
  "doc1.md": {
    "local_path": "/My Workspace/Work Projects/doc1.md",
    "remote_id": "uuid-123",
    "synced": true,
    "last_synced_at": "2025-12-10T10:00:00Z",
    "sync_status": "synced"
  }
}
```

---

### **Scenario 3.2: Login on Second Device**

```
User installs MDReader on laptop (already has account on desktop)
        ↓
    Opens app
        ↓
    Click "Login"
        ↓
    Enter email/password
        ↓
    POST /api/v1/auth/login
        ↓
    Receive JWT token
        ↓
    [Download Documents Dialog]
    "You have 50 documents in your cloud account.
     Download to this device?"
    
    ( ) Download all (creates local copies)
    ( ) Work online only (stream from cloud)
    (•) Download selected (choose which ones)
    
    [Next]
        ↓
    User selects "Download all"
        ↓
    [Progress Dialog]
    Downloading... (1/50) doc1.md ✅
    Downloading... (2/50) doc2.md ✅
    ...
        ↓
    Files saved to:
    ~/Documents/MDReader/My Workspace/
        ↓
    [Complete]
    "✅ 50 documents downloaded"
    
    Now both devices have local + cloud copies
```

---

## 4. Cloud Sync Scenarios

### **Scenario 4.1: Online/Offline Toggle (Global)**

```
[Top-right corner of app]
┌────────────────────────────────┐
│  🌐 Online   [Toggle: ON ▼]   │
└────────────────────────────────┘

When ON:
- New documents → synced to cloud
- Edits → synced in real-time (< 100ms)
- Collaboration enabled

When OFF:
- All edits stay local only
- No network requests
- Works 100% offline
```

**Implementation**:
```typescript
// Global online/offline toggle
const [onlineMode, setOnlineMode] = useState(config.sync.online_mode);

const toggleOnlineMode = async (enabled: boolean) => {
  if (enabled && !isLoggedIn) {
    // Prompt login
    showLoginDialog();
    return;
  }
  
  setOnlineMode(enabled);
  
  if (enabled) {
    // Connect to Hocuspocus for all synced docs
    await connectAllDocuments();
    // Sync pending changes
    await syncPendingChanges();
  } else {
    // Disconnect all Hocuspocus providers
    await disconnectAllDocuments();
  }
  
  // Save to config
  updateConfig({ sync: { online_mode: enabled } });
};
```

---

### **Scenario 4.2: Sync Existing Local File**

```
User has local file: "Project Plan.md" (never synced)
        ↓
    User is logged in
    Online Mode: ON
        ↓
    Right-click "Project Plan.md" in sidebar
        ↓
    [Context Menu]
    • Open
    • Rename
    • Delete
    • ---
    • Sync to Cloud  ← Click this
        ↓
    [Sync Dialog]
    "Sync 'Project Plan.md' to cloud?"
    
    [Check if exists]
    Checking cloud... ⏳
        ↓
    [3 Possible Outcomes]
```

**Outcome A: File doesn't exist in cloud**
```
✅ "File not found in cloud. Create new?"

[Create Cloud Copy]
        ↓
    Upload Yjs state to Hocuspocus
        ↓
    POST /api/v1/documents
        ↓
    Get remote_id
        ↓
    Update local metadata
        ↓
    ✅ "Synced to cloud"
    
    File now has cloud icon in sidebar: ☁️
```

**Outcome B: File exists in cloud (same title)**
```
⚠️ "A file with this name already exists in cloud"

Options:
( ) Overwrite cloud version (your local file wins)
( ) Download cloud version (cloud wins, lose local changes)
( ) Keep both (rename local to "Project Plan (2).md")
(•) Merge (show diff, manual merge)

[Cancel] [Continue]
        ↓
    User selects "Merge"
        ↓
    [Diff View]
    
    Left: Local                Right: Cloud
    ┌──────────────────┐      ┌──────────────────┐
    │ # Project Plan   │      │ # Project Plan   │
    │                  │      │                  │
    │ ## Phase 1       │  ==  │ ## Phase 1       │
    │ - Task A         │  ==  │ - Task A         │
    │ - Task B (LOCAL) │  ≠   │ - Task B (OLD)   │
    │                  │      │ ## Phase 2 (NEW) │
    └──────────────────┘      └──────────────────┘
    
    [Use Local] [Use Cloud] [Manual Edit]
        ↓
    User resolves conflicts
        ↓
    Click "Save Merged Version"
        ↓
    Upload merged version to cloud
        ↓
    ✅ "Merged and synced"
```

**Outcome C: File exists with different content (conflict)**
```
⚠️ "Conflict detected"

File modified:
- Locally:  2025-12-10 10:00 AM
- In cloud: 2025-12-10 10:05 AM

Someone else edited this file while you were working.

Options:
( ) Keep local (overwrite cloud)
( ) Keep cloud (lose local changes)
(•) Merge (recommended)

[Show Diff]
```

---

### **Scenario 4.3: Create Document While Online**

```
User is logged in
Online Mode: ON
        ↓
    Click "New Document"
        ↓
    [New Document Dialog]
    
    Name: _______________
    Location: [My Workspace ▼]
    
    Sync to cloud?
    (•) Yes (sync immediately)
    ( ) No (local only)
    
    [Create]
        ↓
    User enters "Meeting Notes"
    Selects "Yes"
        ↓
    Click "Create"
        ↓
    [Parallel Actions]
    
    1. Create local file:
       ~/Documents/MDReader/My Workspace/Meeting Notes.md
    
    2. POST /api/v1/documents
       {
         title: "Meeting Notes",
         workspace_id: "...",
         content: ""
       }
    
    3. Get remote_id
    
    4. Connect to Hocuspocus:
       ws://localhost:1234/doc:{remote_id}
    
    5. Create Y.Doc + IndexedDB persistence
        ↓
    Document opens
        ↓
    User types: "# Meeting Notes"
        ↓
    [Real-time sync active]
    
    Every keystroke:
    1. Save to local file (5s debounce)
    2. Send to Hocuspocus (< 100ms)
    3. Other devices receive update
```

---

## 5. Offline/Online Transitions

### **Scenario 5.1: Go Offline While Editing**

```
User editing "Project Plan.md" (synced document)
Online Mode: ON
Hocuspocus connected
        ↓
    WiFi disconnects
        ↓
    [Status Indicator Changes]
    🌐 Online → 📴 Offline
        ↓
    [Notification]
    "You're offline. Changes will sync when online."
        ↓
    User continues typing
        ↓
    All edits saved to:
    1. Local file system (~/Documents/MDReader/...)
    2. IndexedDB (Yjs y-indexeddb persistence)
    3. Pending sync queue
        ↓
    Sidebar shows: 📴 (offline icon next to file)
        ↓
    WiFi returns
        ↓
    [Auto-reconnect]
    Hocuspocus reconnects
        ↓
    [Sync Process]
    1. Get state vector from IndexedDB
    2. Get state vector from Hocuspocus
    3. Calculate diff (Yjs does this automatically)
    4. Send missing updates to cloud
    5. Receive missing updates from cloud
    6. Yjs merges (CRDT = no conflicts!)
        ↓
    [Status Indicator Changes]
    📴 Offline → ⏳ Syncing... → ✅ Synced
        ↓
    ✅ "Back online. All changes synced."
```

**Technical Details**:
```typescript
// Hocuspocus auto-reconnect
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: `doc:${remoteId}`,
  document: ydoc,
  
  // Auto-reconnect settings
  maxAttempts: 10,      // Try 10 times
  delay: 1000,          // Wait 1s between attempts
  factor: 2,            // Exponential backoff (1s, 2s, 4s, 8s...)
  maxDelay: 30000,      // Max 30s between attempts
  
  // Callbacks
  onConnect: () => {
    console.log('✅ Connected to Hocuspocus');
    showSyncStatus('synced');
  },
  
  onDisconnect: ({ event }) => {
    console.log('📴 Disconnected from Hocuspocus');
    showSyncStatus('offline');
  },
  
  onSynced: ({ state }) => {
    console.log('✅ Synced with cloud');
    showSyncStatus('synced');
  },
  
  onAuthenticationFailed: ({ reason }) => {
    console.error('❌ Auth failed:', reason);
    showLoginDialog();
  },
});
```

---

### **Scenario 5.2: Edit Same File on Two Devices (Offline → Online)**

```
Device A (Desktop): Editing "Project Plan.md" offline
Device B (Laptop):  Editing same file offline
        ↓
    [Both devices make different changes]
    
    Device A adds: "## Phase 3"
    Device B adds: "## New Requirements"
        ↓
    [Both devices come online]
        ↓
    Device A:
    - Connects to Hocuspocus
    - Sends: Y.encodeStateAsUpdate(ydoc)
    - State vector: [A: 5, B: 0]
    
    Device B:
    - Connects to Hocuspocus
    - Sends: Y.encodeStateAsUpdate(ydoc)
    - State vector: [A: 0, B: 3]
        ↓
    [Hocuspocus merges]
    - Receives update from Device A
    - Receives update from Device B
    - Calculates merged state
    - State vector: [A: 5, B: 3]
        ↓
    [Both devices receive merged doc]
    
    Final content:
    # Project Plan
    
    ## Phase 1
    ## Phase 2
    ## Phase 3          ← From Device A
    ## New Requirements ← From Device B
        ↓
    ✅ NO CONFLICT! CRDT automatic merge
```

**What Users See**:
- Both devices show merged content
- No "conflict resolution" dialog
- No data loss
- Seamless experience

---

### **Scenario 5.3: Delete File While Offline (Then Sync)**

```
User offline
        ↓
    Delete "Old Notes.md"
        ↓
    File moved to trash:
    ~/Documents/MDReader/.trash/Old Notes.md
        ↓
    Metadata updated:
    {
      "Old Notes.md": {
        "status": "deleted",
        "deleted_at": "2025-12-10T10:00:00Z",
        "pending_sync": true
      }
    }
        ↓
    User goes online
        ↓
    [Sync Process]
    Pending: DELETE Old Notes.md
        ↓
    DELETE /api/v1/documents/{remote_id}
        ↓
    [Two Outcomes]
```

**Outcome A: Delete succeeds**
```
✅ Server deletes document
✅ Local trash kept for 30 days
✅ "Synced"
```

**Outcome B: File was edited by someone else**
```
⚠️ "Conflict: 'Old Notes.md' was edited by someone else"

Options:
( ) Delete anyway (can't undo)
(•) Restore and keep (download latest version)

[Cancel] [Continue]
        ↓
    User selects "Restore"
        ↓
    Download latest version from cloud
        ↓
    Restore from trash
        ↓
    ✅ "File restored with latest changes"
```

---

## 6. Collaboration Scenarios

### **Scenario 6.1: Share Document for Collaboration**

```
User has "Team Roadmap.md" (synced to cloud)
        ↓
    Right-click → "Share"
        ↓
    [Share Dialog]
    
    Share "Team Roadmap.md"
    
    Link: https://mdreader.app/doc/abc123
    
    Permissions:
    ( ) View only
    (•) Can edit
    ( ) Can comment
    
    [Copy Link] [Share via Email]
        ↓
    User clicks "Copy Link"
        ↓
    ✅ "Link copied to clipboard"
        ↓
    User sends link via Slack
        ↓
    Teammate clicks link
        ↓
    [Teammate's Browser]
    Opens: https://mdreader.app/doc/abc123
        ↓
    [If teammate has account]
    → Opens in their MDReader app
    
    [If no account]
    → Opens in web editor (guest mode)
        ↓
    Both see same document
    Both can edit simultaneously
```

---

### **Scenario 6.2: Real-Time Collaborative Editing**

```
User A and User B both have "Team Roadmap.md" open
        ↓
    Both connected to:
    ws://localhost:1234/doc:abc123
        ↓
    [User A types: "## Q1 Goals"]
        ↓
    Yjs captures edit → Send to Hocuspocus (< 100ms)
        ↓
    Hocuspocus broadcasts to all connected clients
        ↓
    User B receives update
        ↓
    User B's editor updates automatically
        ↓
    [User B sees]
    - User A's cursor position
    - User A's name badge: "Alice"
    - Text appears in real-time
        ↓
    [User B types: "## Q2 Goals"]
        ↓
    Same process in reverse
        ↓
    Both users see both changes
    ✅ No conflicts
    ✅ No "save" button needed
    ✅ Real-time (< 100ms latency)
```

**What Users See**:
```
┌────────────────────────────────────────────┐
│  Team Roadmap.md                   [👤 2]  │
├────────────────────────────────────────────┤
│                                            │
│  ## Q1 Goals [Alice's cursor here]        │
│  - Revenue: $1M                            │
│                                            │
│  ## Q2 Goals [Bob's cursor here]          │
│  - Revenue: $2M                            │
│                                            │
└────────────────────────────────────────────┘

[Bottom Bar]
👤 Alice (you)  |  👤 Bob  |  ✅ Synced 2s ago
```

---

### **Scenario 6.3: Someone Edits While You're Offline**

```
You: Editing "Team Roadmap.md" offline
Teammate: Editing same doc online
        ↓
    [Both make changes]
    
    You add:      "## Q1: Focus on growth"
    Teammate adds: "## Q1: Reduce costs"
        ↓
    You go online
        ↓
    [Reconnect to Hocuspocus]
        ↓
    Your state: [You: 10, Teammate: 0]
    Cloud state: [You: 5, Teammate: 8]
        ↓
    Yjs calculates diff
        ↓
    [Merged Result]
    # Team Roadmap
    
    ## Q1: Focus on growth  ← Your change
    ## Q1: Reduce costs     ← Teammate's change
        ↓
    ✅ Both changes preserved
    ⚠️ But duplicate headings might look weird
        ↓
    [Smart Notification]
    "Merged with changes from Bob. Review for duplicates."
    
    [Review Changes] [Dismiss]
        ↓
    Click "Review Changes"
        ↓
    [Diff View]
    Shows what changed while you were offline
        ↓
    You manually fix: "## Q1: Focus on growth and reduce costs"
        ↓
    ✅ Clean merged version
```

---

## 7. AI Features

### **Scenario 7.1: Configure AI (First Time)**

```
User clicks "Generate Mindmap" for first time
        ↓
    [AI Setup Dialog]
    
    ⚠️ AI features require an API key
    
    Supported Providers:
    • OpenAI (GPT-4, GPT-3.5)
    • Anthropic (Claude)
    • Google AI (Gemini)
    
    [Configure AI Keys] [Learn More]
        ↓
    Click "Configure AI Keys"
        ↓
    [Settings → AI]
    
    ┌────────────────────────────────────────┐
    │ AI Configuration                       │
    ├────────────────────────────────────────┤
    │                                        │
    │ OpenAI                                 │
    │ API Key: [sk-...        ] [Show]       │
    │ Model:   [gpt-4 ▼]                     │
    │ [Test Connection]                      │
    │                                        │
    │ Anthropic                              │
    │ API Key: [            ] [Show]         │
    │ Model:   [claude-3-opus ▼]             │
    │ [Test Connection]                      │
    │                                        │
    │ Default Provider: [OpenAI ▼]           │
    │                                        │
    │ [Save]                                 │
    └────────────────────────────────────────┘
        ↓
    User pastes OpenAI key
        ↓
    Click "Test Connection"
        ↓
    POST https://api.openai.com/v1/models
    Authorization: Bearer sk-...
        ↓
    ✅ "Connection successful! GPT-4 available."
        ↓
    Click "Save"
        ↓
    Encrypted and saved to:
    ~/Documents/MDReader/.mdreader/config.json
        ↓
    ✅ AI features now enabled
```

**Where API Keys Stored**:
```json
// config.json (encrypted at rest)
{
  "ai": {
    "providers": {
      "openai": {
        "api_key": "ENCRYPTED:AES256:...",
        "model": "gpt-4",
        "enabled": true
      },
      "anthropic": {
        "api_key": null,
        "model": "claude-3-opus",
        "enabled": false
      }
    },
    "default_provider": "openai"
  }
}
```

**Security**:
- API keys encrypted with AES-256
- Encryption key derived from system keychain (macOS/Windows/Linux)
- Never sent to our servers
- Only sent directly to AI provider (OpenAI, Anthropic, etc.)

---

### **Scenario 7.2: Generate Mindmap (With AI)**

```
User has document with markdown headings:

# Project Overview

## Phase 1
### Development
### Testing

## Phase 2
### Launch
### Marketing
        ↓
    User clicks "Generate Mindmap"
        ↓
    [Mindmap Generation]
    
    Mode:
    (•) From headings (structure only)
    ( ) AI-enhanced (add details, suggest branches)
    
    [Generate]
        ↓
    User selects "AI-enhanced"
        ↓
    [Progress]
    1. Parsing markdown... ✅
    2. Generating mindmap structure... ✅
    3. AI analyzing content... ⏳
       (Calling OpenAI GPT-4...)
    4. AI suggesting branches... ✅
    5. Rendering... ✅
        ↓
    [Mindmap Opens]
    
    Visual tree with:
    - All original headings
    - AI-suggested sub-branches:
      - "Development" → "Setup CI/CD", "Code review"
      - "Testing" → "Unit tests", "E2E tests"
      - "Launch" → "Beta release", "Public launch"
        ↓
    User can:
    - Edit nodes
    - Add more branches
    - Export as image
    - Sync back to markdown
```

---

## 8. Edge Cases & Conflicts

### **Scenario 8.1: Two Devices Create Same-Named File**

```
Device A (Offline): Creates "Meeting Notes.md"
Device B (Offline): Creates "Meeting Notes.md" (different content)
        ↓
    [Both devices go online]
        ↓
    Device A uploads first
    → Server creates: doc_id_1 ("Meeting Notes.md")
        ↓
    Device B tries to upload
    → Server detects: "Meeting Notes.md" already exists
        ↓
    [Conflict Resolution]
    
    ⚠️ "Conflict detected"
    
    File "Meeting Notes.md" already exists in cloud.
    
    Your version:  Created 2025-12-10 10:00
                   150 words
    
    Cloud version: Created 2025-12-10 09:55
                   200 words
    
    Options:
    ( ) Overwrite cloud (your file wins, lose cloud version)
    ( ) Rename yours (keep both: "Meeting Notes (2).md")
    (•) Merge content (combine both files)
    ( ) Cancel upload (keep local only)
    
    [Cancel] [Continue]
        ↓
    User selects "Rename yours"
        ↓
    Local file renamed:
    ~/Documents/MDReader/My Workspace/Meeting Notes (2).md
        ↓
    Upload with new name
        ↓
    ✅ Both files now exist:
    - Meeting Notes.md (from Device B)
    - Meeting Notes (2).md (from Device A)
```

---

### **Scenario 8.2: Document Deleted in Cloud, Edited Locally**

```
Device A: Delete "Old Doc.md" (synced to cloud)
Device B: Offline, editing "Old Doc.md"
        ↓
    Device B goes online
        ↓
    [Sync Process]
    
    Device B: "I have edits to doc_123"
    Cloud:    "doc_123 was deleted by Device A"
        ↓
    [Conflict Dialog]
    
    ⚠️ "Document was deleted"
    
    "Old Doc.md" was deleted by another device.
    
    You have unsaved changes.
    
    Options:
    ( ) Discard changes (delete local copy)
    (•) Restore and sync (undelete, upload your changes)
    ( ) Save as new document
    
    [Cancel] [Continue]
        ↓
    User selects "Restore and sync"
        ↓
    POST /api/v1/documents/restore
    {
      document_id: "doc_123",
      content: "..."
    }
        ↓
    Server restores document
        ↓
    ✅ "Document restored with your changes"
```

---

### **Scenario 8.3: File Moved on One Device, Edited on Another**

```
Device A: Move "Doc.md" from /Folder A/ to /Folder B/
Device B: Offline, editing "Doc.md" in /Folder A/
        ↓
    Device B goes online
        ↓
    [Sync Process]
    
    Device B: "I have edits to /Folder A/Doc.md"
    Cloud:    "/Folder A/Doc.md moved to /Folder B/Doc.md"
        ↓
    [Auto-resolve]
    
    1. Apply edits to /Folder B/Doc.md (new location)
    2. Update Device B's local path
    3. Move local file:
       ~/Documents/MDReader/My Workspace/Folder A/Doc.md
       →
       ~/Documents/MDReader/My Workspace/Folder B/Doc.md
        ↓
    ✅ "Synced. Document moved to Folder B."
    
    [Notification]
    "Doc.md was moved to Folder B by Device A.
     Your edits have been applied to the new location."
```

---

## 9. Data Migration & Import

### **Scenario 9.1: Import from Notion**

```
User exports Notion workspace
        ↓
    Gets .zip file with markdown files
        ↓
    MDReader: File → Import → From Notion
        ↓
    [File Picker]
    Select: notion-export.zip
        ↓
    [Import Dialog]
    
    Found:
    - 50 markdown files
    - 10 folders
    - 25 images
    
    Options:
    [x] Preserve folder structure
    [x] Import images
    [x] Convert Notion blocks to markdown
    [ ] Sync to cloud after import
    
    [Import]
        ↓
    [Progress]
    Extracting... ✅
    Converting... ✅
    Importing... (1/50) ✅
    ...
        ↓
    ✅ "Imported 50 documents from Notion"
    
    Files now in:
    ~/Documents/MDReader/My Workspace/Notion Import/
```

---

### **Scenario 9.2: Import from Obsidian**

```
User has Obsidian vault: ~/Documents/Obsidian/My Vault/
        ↓
    MDReader: File → Import → From Obsidian
        ↓
    [Folder Picker]
    Select: ~/Documents/Obsidian/My Vault/
        ↓
    [Import Dialog]
    
    Found Obsidian vault:
    - 200 markdown files
    - 50 images
    - Wikilinks detected: [[file-name]]
    
    Options:
    [x] Convert wikilinks to standard links
    [x] Import attachments
    [x] Preserve folder structure
    [x] Import graph structure (for mindmaps)
    
    [Import]
        ↓
    Copies all files to:
    ~/Documents/MDReader/My Workspace/Obsidian Import/
        ↓
    ✅ "Imported 200 documents from Obsidian"
```

---

## 10. Disaster Recovery

### **Scenario 10.1: Accidental Delete**

```
User deletes "Important Doc.md"
        ↓
    File moved to:
    ~/Documents/MDReader/.trash/Important Doc.md
        ↓
    [Notification]
    "Important Doc.md moved to trash"
    [Undo (5s)]
        ↓
    [Option 1: Click Undo within 5 seconds]
    → File restored immediately
        ↓
    [Option 2: Don't click Undo]
    → File stays in trash for 30 days
        ↓
    [Restore from Trash]
    
    File → Trash
        ↓
    See all deleted files:
    - Important Doc.md (deleted 1 day ago)
    - Old Notes.md (deleted 5 days ago)
        ↓
    Right-click → "Restore"
        ↓
    File restored to original location
        ↓
    ✅ "Important Doc.md restored"
```

---

### **Scenario 10.2: Corrupted File**

```
File gets corrupted (disk error, etc.)
        ↓
    User tries to open "Corrupted.md"
        ↓
    [Error Dialog]
    
    ⚠️ "File corrupted"
    
    "Corrupted.md" cannot be opened.
    
    Recovery options:
    ( ) Restore from cloud (if synced)
    ( ) Restore from backup (if available)
    ( ) Open in text editor (try to recover)
    
    [Cancel] [Recover]
        ↓
    User selects "Restore from cloud"
        ↓
    [If synced]
    GET /api/v1/documents/{doc_id}
        ↓
    Download latest version
        ↓
    Replace corrupted local file
        ↓
    ✅ "File restored from cloud"
    
    [If not synced, no backup]
    ❌ "Cannot recover. File was not synced or backed up."
```

---

### **Scenario 10.3: Complete Data Loss (Reinstall)**

```
User's laptop dies
        ↓
    Gets new laptop
        ↓
    Installs MDReader
        ↓
    [First Launch]
    
    Welcome to MDReader
    
    [ ] I'm new (start fresh)
    [x] I have an account (restore from cloud)
    
    [Continue]
        ↓
    [Login]
    Enter email/password
        ↓
    [Cloud Restore]
    
    "Found cloud backup from your account"
    
    Last synced: 2025-12-09 05:30 PM
    Documents: 150
    Folders: 25
    
    [Restore All] [Select Documents]
        ↓
    Click "Restore All"
        ↓
    [Progress]
    Downloading... (1/150) ✅
    ...
        ↓
    All files restored to:
    ~/Documents/MDReader/My Workspace/
        ↓
    ✅ "150 documents restored"
    
    [If had local-only documents]
    ⚠️ "Some documents were local-only and cannot be restored"
```

---

## 11. Multi-Window & Browser Edge Cases

### **Scenario 11.1: Same Document in Multiple Windows**

```
User opens "Project Plan.md" in Chrome Tab 1
        ↓
    User opens same document in Chrome Tab 2
        ↓
    [Both tabs connect to Hocuspocus]
    
    Tab 1: Types "# Introduction"
    Tab 2: Types "# Overview"
        ↓
    [Yjs CRDT automatic merge]
    
    Both tabs see:
    # Introduction
    # Overview
        ↓
    ✅ No conflict, both edits preserved
```

**Technical Details**:
```typescript
// Each window gets its own HocuspocusProvider
const provider1 = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: 'doc:abc123',
  document: ydoc1,
});

const provider2 = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: 'doc:abc123',
  document: ydoc2,
});

// Yjs handles sync between both windows automatically
```

**Edge Cases**:
- **Tab 1 offline, Tab 2 online**: Tab 2 continues syncing, Tab 1 queues changes
- **Close Tab 1 mid-edit**: Changes already synced to Tab 2 via Hocuspocus
- **One tab freezes (JS hung)**: Other tab continues working normally

---

### **Scenario 11.2: Storage Quota Exceeded**

```
User has 480MB of documents in IndexedDB
Browser quota: 500MB (Chrome on Mac)
        ↓
    User creates new document "Large File.md"
    Pastes 25MB of content
        ↓
    [Auto-save triggers]
    
    IndexedDB.put() → QuotaExceededError
        ↓
    [Error Handler]
    
    ⚠️ "Storage quota exceeded"
    
    Options:
    ( ) Login and sync to cloud (frees local space)
    ( ) Delete old documents (show list, sorted by size)
    (•) Export and delete (export to .zip, then delete)
    ( ) Continue without saving (lose changes)
    
    [Cancel] [Continue]
        ↓
    User selects "Login and sync to cloud"
        ↓
    [Login Dialog]
    User enters credentials
        ↓
    POST /api/v1/auth/login
        ↓
    [Migration Process]
    1. Upload all local documents to cloud
    2. Delete IndexedDB data
    3. Switch to cloud-first mode
    4. Current document saved to cloud
        ↓
    ✅ "Storage freed. Document saved."
```

**Prevention**:
```typescript
// Monitor storage usage
const checkStorageQuota = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentUsed = (usage / quota) * 100;
    
    if (percentUsed > 80) {
      showWarning('Storage 80% full. Consider syncing to cloud.');
    }
    
    if (percentUsed > 95) {
      showError('Storage almost full. Please free up space.');
    }
  }
};

// Run every 5 minutes
setInterval(checkStorageQuota, 300000);
```

---

### **Scenario 11.3: Safari Private Mode (IndexedDB Disabled)**

```
User opens MDReader in Safari Private Mode
        ↓
    [App Initialization]
    
    try {
      await openIndexedDB();
    } catch (err: SecurityError) {
      // Safari Private Mode blocks IndexedDB
    }
        ↓
    [Fallback Mode]
    
    ⚠️ "Private browsing detected"
    
    "IndexedDB is disabled in private mode.
     Your documents cannot be saved locally."
    
    Options:
    ( ) Continue in memory-only mode (lose all on close)
    (•) Login and use cloud-only mode (recommended)
    ( ) Exit and use regular mode
    
    [Cancel] [Continue]
        ↓
    User selects "Login and use cloud-only mode"
        ↓
    All documents stored in cloud only
    LocalStorage used for minimal config
        ↓
    ✅ Works in private mode (cloud-backed)
```

**Detection**:
```typescript
// Detect if IndexedDB is available
const isIndexedDBAvailable = async (): Promise<boolean> => {
  if (!window.indexedDB) return false;
  
  try {
    const testDB = indexedDB.open('test');
    return new Promise((resolve) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('test');
        resolve(true);
      };
      testDB.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

// On app init
if (!await isIndexedDBAvailable()) {
  showPrivateModeDialog();
}
```

---

### **Scenario 11.4: Browser Clears IndexedDB (User Clears Data)**

```
User has 50 local documents in IndexedDB
        ↓
    Chrome Settings → Privacy → Clear browsing data
    [x] Cookies and site data
        ↓
    Click "Clear data"
        ↓
    [IndexedDB deleted]
        ↓
    User opens MDReader
        ↓
    [App Initialization]
    
    offlineDB.documents.toArray() → []
    offlineDB.folders.toArray() → []
        ↓
    [Data Loss Detection]
    
    ⚠️ "Local data not found"
    
    "Your local documents are missing.
     This can happen if browser data was cleared."
    
    Recovery options:
    ( ) Restore from cloud (if you have an account)
    ( ) Start fresh (create new workspace)
    ( ) Import from backup (if you have one)
    
    [Cancel] [Recover]
        ↓
    User selects "Restore from cloud"
        ↓
    [Login]
    Download all documents from cloud
        ↓
    ✅ "50 documents restored"
```

**Prevention**:
```typescript
// Periodic backup to localStorage (smaller, more persistent)
const backupMetadata = async () => {
  const docs = await offlineDB.documents.toArray();
  const metadata = docs.map(d => ({
    id: d.id,
    title: d.title,
    remote_id: d.remote_id,
    last_synced: d.last_synced
  }));
  
  // Store in localStorage (survives IndexedDB clear in some browsers)
  localStorage.setItem('mdreader_backup', JSON.stringify(metadata));
};
```

---

## 12. Power User Features (Phase 5)

### **Scenario 12.1: Command Palette - No Results**

```
User presses Cmd+K
        ↓
    [Command Palette Opens]
        ↓
    User types: "xyzabc123"
        ↓
    [Search]
    No commands match
    No documents match
        ↓
    [Empty State]
    
    "No results found for 'xyzabc123'"
    
    Suggestions:
    • Try different keywords
    • Check spelling
    • Create new document with this name
    
    [Create "xyzabc123.md"]
        ↓
    User clicks "Create"
        ↓
    New document created with title "xyzabc123"
        ↓
    Opens in editor
```

**Fuzzy Matching**:
```typescript
import Fuse from 'fuse.js';

const commandPalette = new Fuse([...documents, ...commands], {
  keys: ['title', 'name', 'keywords'],
  threshold: 0.4, // Allow 40% typos
  includeScore: true
});

// "projet" finds "Project Plan.md" (typo tolerance)
```

---

### **Scenario 12.2: Command Palette - Context-Specific**

```
Context: User in Mindmap View
        ↓
    Press Cmd+K
        ↓
    [Context-Aware Commands]
    
    [Mindmap Actions] ← Only shown in mindmap
    • Export mindmap as PNG
    • Export mindmap as SVG
    • Sync with markdown
    • Add node
    • Expand all
    • Collapse all
    
    [Document Actions] ← Always shown
    • Save
    • Close
    • Duplicate
    
    [Navigation] ← Always shown
    • Go to Home
    • Go to Settings
```

**Context Detection**:
```typescript
const getContextualCommands = () => {
  const route = useLocation();
  
  if (route.pathname.includes('/mindmap')) {
    return [...mindmapCommands, ...globalCommands];
  } else if (route.pathname.includes('/edit')) {
    return [...editorCommands, ...globalCommands];
  } else {
    return globalCommands;
  }
};
```

---

### **Scenario 12.3: Graph View - Circular References**

```
User has documents with circular links:
- Doc A: Contains [[Doc B]]
- Doc B: Contains [[Doc C]]
- Doc C: Contains [[Doc A]] ← Circular!
        ↓
    User opens Graph View
        ↓
    [Graph Rendering]
    
    Nodes:
    - Doc A (id: a)
    - Doc B (id: b)
    - Doc C (id: c)
    
    Links:
    - A → B
    - B → C
    - C → A ← Forms a cycle
        ↓
    [Force-Directed Layout]
    
    D3.js force simulation handles cycles automatically
    Nodes arrange in triangle formation
        ↓
    User clicks on Doc C
        ↓
    Highlight cycle:
    Doc C → Doc A → Doc B → Doc C
        ↓
    [Notification]
    "Circular reference detected"
    
    [View Cycle] [Break Link]
```

**Cycle Detection**:
```typescript
const detectCycles = (nodes: Node[], links: Link[]) => {
  const visited = new Set();
  const recStack = new Set();
  const cycles: string[][] = [];
  
  const dfs = (nodeId: string, path: string[]) => {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);
    
    const outgoing = links.filter(l => l.source === nodeId);
    
    for (const link of outgoing) {
      const targetId = link.target;
      
      if (!visited.has(targetId)) {
        dfs(targetId, [...path]);
      } else if (recStack.has(targetId)) {
        // Cycle detected!
        const cycleStart = path.indexOf(targetId);
        cycles.push(path.slice(cycleStart));
      }
    }
    
    recStack.delete(nodeId);
  };
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });
  
  return cycles;
};
```

---

### **Scenario 12.4: Graph View - 1000+ Documents**

```
User has 1,500 documents in workspace
        ↓
    Opens Graph View
        ↓
    [Performance Check]
    
    Document count: 1,500
    Link count: ~3,000
        ↓
    [Optimization Strategy]
    
    1. Show only top 100 most-connected nodes
    2. Use WebGL renderer (react-force-graph-3d)
    3. Cluster by folder
    4. Lazy load on zoom
        ↓
    [Initial Render]
    
    Shows 100 nodes + clusters
    "1,400 more documents (click to expand)"
        ↓
    User zooms in on cluster
        ↓
    Load nodes in that cluster (50 more)
        ↓
    Smooth experience (60fps)
```

**Optimization**:
```typescript
const GraphView = ({ documents }) => {
  const [visibleNodes, setVisibleNodes] = useState<Node[]>([]);
  
  useEffect(() => {
    if (documents.length > 500) {
      // Show only highly connected nodes
      const topNodes = documents
        .sort((a, b) => b.linkCount - a.linkCount)
        .slice(0, 100);
      
      setVisibleNodes(topNodes);
    } else {
      setVisibleNodes(documents);
    }
  }, [documents]);
  
  return (
    <ForceGraph3D
      graphData={{ nodes: visibleNodes, links }}
      nodeLabel="title"
      onNodeClick={handleExpand}
    />
  );
};
```

---

### **Scenario 12.5: Templates - Variable Substitution Failure**

```
User selects "Meeting Notes" template
        ↓
    Template content:
    # Meeting Notes - {{date}}
    Attendees: {{attendees}}
    Project: {{project_name}}
        ↓
    [Variable Substitution]
    
    {{date}} → "December 10, 2025" ✅
    {{attendees}} → ??? (no default) ⚠️
    {{project_name}} → ??? (no default) ⚠️
        ↓
    [Prompt for Missing Variables]
    
    "Please provide values for:"
    
    Attendees: [______________]
    Project Name: [______________]
    
    [Cancel] [Create]
        ↓
    User enters:
    Attendees: "Alice, Bob"
    Project Name: "MDReader"
        ↓
    Final content:
    # Meeting Notes - December 10, 2025
    Attendees: Alice, Bob
    Project: MDReader
        ↓
    ✅ Document created
```

**Smart Defaults**:
```typescript
const substituteVariables = (template: string, context: Context) => {
  const variables = {
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    user: context.user?.name || 'Unknown',
    workspace: context.workspace?.name || 'My Workspace',
    // Dynamic variables prompt user
    attendees: null,
    project_name: null,
  };
  
  let content = template;
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    
    if (value !== null) {
      content = content.replace(pattern, value);
    } else {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    return { content, missing };
  }
  
  return { content, missing: [] };
};
```

---

### **Scenario 12.6: Publishing - Slug Conflict**

```
User publishes "Project Plan.md"
Slug: "project-plan"
URL: https://mdreader.app/p/project-plan
        ↓
    User has another "Project Plan.md" (different folder)
    Tries to publish
        ↓
    [Slug Conflict Detection]
    
    ⚠️ "Slug already exists"
    
    "https://mdreader.app/p/project-plan is already taken."
    
    Options:
    ( ) Use different slug: "project-plan-2"
    ( ) Use custom slug: [_______________]
    (•) Overwrite existing (unpublish old one)
    ( ) Cancel
    
    [Cancel] [Continue]
        ↓
    User selects "Use custom slug"
    Enters: "q4-project-plan"
        ↓
    [Validation]
    
    Slug available? ✅
    SEO-friendly? ✅ (lowercase, hyphens)
    No special chars? ✅
        ↓
    Published: https://mdreader.app/p/q4-project-plan
```

**Slug Generation**:
```typescript
const generateSlug = (title: string, documentId: string) => {
  // Remove special chars, lowercase, replace spaces with hyphens
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  // Check if slug exists
  const existing = await fetch(`/api/v1/published/${slug}`);
  
  if (existing.ok) {
    // Slug taken, add unique suffix
    slug = `${slug}-${documentId.substring(0, 8)}`;
  }
  
  return slug;
};
```

---

### **Scenario 12.7: Publishing - Someone Viewing When Unpublished**

```
User A publishes "Team Roadmap.md"
URL: https://mdreader.app/p/team-roadmap
        ↓
    User B opens the link (not logged in)
    Reading the document
        ↓
    User A clicks "Unpublish"
        ↓
    [Confirmation]
    
    ⚠️ "2 people are currently viewing this document"
    
    "Unpublishing will make it inaccessible immediately."
    
    [ ] Send notification to viewers
    
    [Cancel] [Unpublish Anyway]
        ↓
    User A clicks "Unpublish Anyway"
        ↓
    DELETE /api/v1/published/team-roadmap
        ↓
    [User B's Browser]
    
    [WebSocket disconnection or HTTP 404 on refresh]
        ↓
    "This document is no longer available"
    
    The author has unpublished this document.
    
    [Go to MDReader Home]
```

**Viewer Tracking**:
```typescript
// Track active viewers (Redis)
const trackViewer = async (slug: string, sessionId: string) => {
  await redis.sadd(`viewers:${slug}`, sessionId);
  await redis.expire(`viewers:${slug}`, 600); // 10 min TTL
};

const getViewerCount = async (slug: string): Promise<number> => {
  return await redis.scard(`viewers:${slug}`);
};

// Before unpublish
const viewerCount = await getViewerCount(slug);
if (viewerCount > 0) {
  showConfirmation(`${viewerCount} people are viewing`);
}
```

---

### **Scenario 12.8: Advanced Search - Special Characters**

```
User searches for: "project@2024 [urgent]"
        ↓
    [Search Engine]
    
    Query contains special chars:
    - @ (email/mention)
    - [ ] (checkbox/tag)
        ↓
    [Parsing Strategy]
    
    Option 1: Escape special chars (literal search)
    → Find exact string "project@2024 [urgent]"
    
    Option 2: Parse as structured search (smart)
    → "project" AND mention:"2024" AND tag:"urgent"
        ↓
    [Use Option 2 - Smart Parsing]
        ↓
    Results:
    1. "Project Update @2024 #urgent"
    2. "2024 Project Review [urgent]"
    3. "Urgent: Project timeline"
        ↓
    User clicks result 1
        ↓
    Highlights: "Project", "2024", "urgent"
```

**Query Parser**:
```typescript
const parseSearchQuery = (query: string): SearchQuery => {
  const tokens = {
    text: [],
    mentions: [],
    tags: [],
    exact: []
  };
  
  // Extract @mentions
  const mentions = query.match(/@(\w+)/g);
  if (mentions) {
    tokens.mentions = mentions.map(m => m.substring(1));
    query = query.replace(/@\w+/g, '');
  }
  
  // Extract [tags] or #tags
  const tags = query.match(/\[(\w+)\]|#(\w+)/g);
  if (tags) {
    tokens.tags = tags.map(t => t.replace(/[\[\]#]/g, ''));
    query = query.replace(/\[\w+\]|#\w+/g, '');
  }
  
  // Extract "exact phrases"
  const exact = query.match(/"([^"]+)"/g);
  if (exact) {
    tokens.exact = exact.map(e => e.replace(/"/g, ''));
    query = query.replace(/"[^"]+"/g, '');
  }
  
  // Remaining words
  tokens.text = query.trim().split(/\s+/).filter(Boolean);
  
  return tokens;
};

// Search
const results = documents.filter(doc => {
  const matchesText = tokens.text.every(t => 
    doc.content.toLowerCase().includes(t.toLowerCase())
  );
  const matchesMentions = tokens.mentions.every(m => 
    doc.content.includes(`@${m}`)
  );
  const matchesTags = tokens.tags.every(t => 
    doc.tags?.includes(t)
  );
  
  return matchesText && matchesMentions && matchesTags;
});
```

---

## 13. Performance & Scale

### **Scenario 13.1: Opening 100MB Document**

```
User opens "Complete Documentation.md" (100MB, 500,000 lines)
        ↓
    [Load Strategy]
    
    ⚠️ "Large document detected (100MB)"
    
    "This document is very large. Choose loading mode:"
    
    ( ) Full load (may be slow, all features)
    ( ) Paginated (load 1,000 lines at a time)
    (•) Read-only (fast, no editing)
    
    [Cancel] [Load]
        ↓
    User selects "Paginated"
        ↓
    [Virtual Scrolling]
    
    Load first 1,000 lines → Render
    User scrolls down → Load next 1,000 lines
        ↓
    Smooth 60fps performance
    Memory usage: ~50MB (not 100MB)
```

**Implementation**:
```typescript
import { FixedSizeList } from 'react-window';

const LargeDocumentEditor = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  
  if (lines.length > 10000) {
    // Use virtual scrolling
    return (
      <FixedSizeList
        height={800}
        itemCount={lines.length}
        itemSize={20}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <LineEditor line={lines[index]} lineNumber={index} />
          </div>
        )}
      </FixedSizeList>
    );
  }
  
  // Normal editor for smaller docs
  return <TipTapEditor content={content} />;
};
```

---

### **Scenario 13.2: Workspace with 10,000+ Documents**

```
User has 12,000 documents in workspace
        ↓
    Opens MDReader
        ↓
    [Loading Strategy]
    
    [Progress Dialog]
    "Loading workspace..."
    
    Step 1: Load folder structure ✅ (500ms)
    Step 2: Load document metadata ✅ (2s)
    Step 3: Index for search ⏳ (background)
        ↓
    [Sidebar Rendering]
    
    Don't render all 12,000 documents at once!
    
    Strategy:
    1. Show folders (collapsed by default)
    2. Lazy-load folder contents on expand
    3. Virtual scrolling for large folders
        ↓
    User expands "Projects" folder (1,500 docs)
        ↓
    [Virtual List]
    
    Only render visible 20 items
    Scroll → Render more
        ↓
    Smooth performance ✅
```

**Pagination**:
```typescript
const WorkspaceSidebar = ({ workspaceId }) => {
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Load folders only
  useEffect(() => {
    loadFolders(workspaceId).then(setFolders);
  }, [workspaceId]);
  
  const handleExpand = async (folderId: string) => {
    if (expandedFolders.has(folderId)) {
      // Collapse
      setExpandedFolders(prev => {
        prev.delete(folderId);
        return new Set(prev);
      });
    } else {
      // Expand - load documents for this folder only
      const docs = await loadDocumentsInFolder(folderId);
      setFolderDocuments(folderId, docs);
      setExpandedFolders(prev => new Set(prev).add(folderId));
    }
  };
  
  return (
    <div>
      {folders.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isExpanded={expandedFolders.has(folder.id)}
          onExpand={() => handleExpand(folder.id)}
        />
      ))}
    </div>
  );
};
```

---

### **Scenario 13.3: Deep Folder Nesting (100 Levels)**

```
User creates nested folders:
/Projects/2024/Q4/December/Week1/Day1/.../... (100 levels deep)
        ↓
    Opens workspace
        ↓
    [Folder Tree Rendering]
    
    ⚠️ "Deep nesting detected"
    
    "Your folder structure is very deep (100 levels).
     This may impact performance."
    
    Recommendations:
    • Flatten structure
    • Use tags instead
    • Archive old folders
        ↓
    User continues
        ↓
    [Rendering Strategy]
    
    Don't render all 100 levels at once!
    
    1. Show first 3 levels
    2. "..." indicator for deeper levels
    3. Click "..." to expand next 3 levels
        ↓
    User clicks "..." at level 3
        ↓
    Load levels 4-6
        ↓
    Performance maintained ✅
```

**Depth Limit**:
```typescript
const MAX_VISIBLE_DEPTH = 5;

const FolderTree = ({ folder, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (depth > MAX_VISIBLE_DEPTH) {
    return (
      <div className="folder-overflow">
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide' : `... ${folder.childCount} more levels`}
        </button>
        {expanded && (
          <FolderTree folder={folder} depth={0} />
        )}
      </div>
    );
  }
  
  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <FolderItem folder={folder} />
      {folder.children.map(child => (
        <FolderTree key={child.id} folder={child} depth={depth + 1} />
      ))}
    </div>
  );
};
```

---

## 14. Network Edge Cases

### **Scenario 14.1: Flaky Connection (Packet Loss)**

```
User has unstable WiFi (50% packet loss)
        ↓
    Editing document
    Hocuspocus trying to sync
        ↓
    [Connection Pattern]
    
    10:00:00 - Connected ✅
    10:00:02 - Disconnected ❌ (timeout)
    10:00:05 - Connected ✅
    10:00:06 - Disconnected ❌
    10:00:10 - Connected ✅
    ...
        ↓
    [Exponential Backoff]
    
    Attempt 1: Wait 1s
    Attempt 2: Wait 2s
    Attempt 3: Wait 4s
    Attempt 4: Wait 8s
    Attempt 5: Wait 16s
    Max: Wait 30s
        ↓
    [User Experience]
    
    Status indicator shows:
    "🟡 Unstable connection. Saving locally."
    
    All edits saved to IndexedDB ✅
    Will sync when connection stabilizes
        ↓
    Connection stabilizes
        ↓
    [Bulk Sync]
    All queued changes uploaded
        ↓
    ✅ "Synced"
```

**Implementation**:
```typescript
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: documentName,
  document: ydoc,
  
  // Exponential backoff
  maxAttempts: 10,
  delay: 1000,
  factor: 2,
  maxDelay: 30000,
  
  // Don't give up easily
  timeout: 10000,
  
  onConnect: () => {
    console.log('Connected, syncing queued changes...');
    setStatus('syncing');
  },
  
  onDisconnect: ({ event }) => {
    console.log('Disconnected, saving locally');
    setStatus('offline');
  },
  
  onSynced: () => {
    console.log('All changes synced');
    setStatus('synced');
  }
});
```

---

### **Scenario 14.2: Corporate Firewall (WebSocket Blocked)**

```
User at corporate office
Firewall blocks WebSocket connections (port 1234)
        ↓
    Opens MDReader
    Tries to sync document
        ↓
    [Connection Attempt]
    
    new WebSocket('ws://localhost:1234')
    → TimeoutError (blocked by firewall)
        ↓
    [Fallback Strategy]
    
    ⚠️ "WebSocket blocked"
    
    "Your network blocks WebSocket connections.
     Switching to HTTP polling."
        ↓
    [HTTP Polling Mode]
    
    Instead of WebSocket:
    - Poll GET /api/v1/documents/{id} every 5s
    - Send updates via POST /api/v1/documents/{id}/updates
        ↓
    Real-time collaboration degraded:
    - Latency: 5s instead of 100ms
    - Still works ✅
```

**Fallback Implementation**:
```typescript
const connectToDocument = async (documentId: string) => {
  try {
    // Try WebSocket first
    const provider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: `doc:${documentId}`,
      document: ydoc,
      timeout: 5000
    });
    
    await provider.connect();
    console.log('Using WebSocket (optimal)');
    return provider;
  } catch (err) {
    console.warn('WebSocket failed, falling back to HTTP polling');
    
    // Fallback: HTTP polling
    const pollingSync = new HTTPPollingSync({
      documentId,
      document: ydoc,
      interval: 5000, // Poll every 5s
    });
    
    pollingSync.start();
    return pollingSync;
  }
};

class HTTPPollingSync {
  private interval: NodeJS.Timeout;
  
  start() {
    this.interval = setInterval(async () => {
      // Fetch latest state
      const remoteState = await fetch(`/api/v1/documents/${this.documentId}/state`);
      const state = await remoteState.arrayBuffer();
      
      // Apply to local Yjs doc
      Y.applyUpdate(this.document, new Uint8Array(state));
      
      // Send local changes
      const localUpdates = Y.encodeStateAsUpdate(this.document);
      await fetch(`/api/v1/documents/${this.documentId}/updates`, {
        method: 'POST',
        body: localUpdates
      });
    }, this.interval);
  }
  
  stop() {
    clearInterval(this.interval);
  }
}
```

---

## 15. Authentication & Security

### **Scenario 15.1: JWT Token Expires During Edit**

```
User logged in at 9:00 AM
JWT token expires after 1 hour
        ↓
    User editing "Report.md" at 10:05 AM (token expired)
        ↓
    Auto-save triggers
    PATCH /api/v1/documents/{id}
    Authorization: Bearer <expired_token>
        ↓
    [Server Response]
    
    401 Unauthorized
    { "detail": "Token expired" }
        ↓
    [Client-Side Handler]
    
    1. Save document to IndexedDB (don't lose changes) ✅
    2. Try silent refresh
    
    POST /api/v1/auth/refresh
    {
      refresh_token: "<refresh_token>"
    }
        ↓
    [Two Outcomes]
```

**Outcome A: Refresh Succeeds** ✅
```
    Server returns new access_token
        ↓
    Update stored token
        ↓
    Retry failed request
    PATCH /api/v1/documents/{id}
    Authorization: Bearer <new_token>
        ↓
    ✅ Document saved to cloud
        ↓
    User continues working (no interruption)
```

**Outcome B: Refresh Fails** ❌
```
    403 Forbidden
    { "detail": "Refresh token expired" }
        ↓
    [Logout and Notify]
    
    ⚠️ "Session expired"
    
    "Your session has expired. Please log in again.
     Your changes have been saved locally."
    
    [Login] [Continue Offline]
        ↓
    User clicks "Login"
        ↓
    Show login dialog
        ↓
    After login:
    - Sync all pending changes
    - Resume cloud sync
```

**Implementation**:
```typescript
const apiClient = axios.create({
  baseURL: '/api/v1',
});

// Interceptor for expired tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try silent refresh
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const { access_token } = response.data;
        
        // Update tokens
        localStorage.setItem('access_token', access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        console.error('Session expired, logging out');
        handleLogout();
        showLoginDialog();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

### **Scenario 15.2: Multi-Device Logout**

```
User logged in on 3 devices:
- Desktop (primary)
- Laptop (secondary)
- Phone (mobile)
        ↓
    User clicks "Logout on all devices" (Desktop)
        ↓
    [Server-Side]
    
    POST /api/v1/auth/logout-all
    {
      user_id: "abc123"
    }
        ↓
    Server actions:
    1. Invalidate all refresh tokens for user
    2. Add access tokens to blacklist (Redis)
    3. Send push notification to other devices
        ↓
    [Laptop receives notification]
    
    WebSocket message: { type: "logout", reason: "user_initiated" }
        ↓
    [Laptop Client]
    
    ⚠️ "Logged out"
    
    "You've been logged out from another device.
     Your local changes have been saved."
    
    [Login Again] [Continue Offline]
        ↓
    User clicks "Continue Offline"
        ↓
    Switch to local-only mode
    No cloud sync until login
```

**Server Implementation**:
```python
# FastAPI endpoint
@router.post("/auth/logout-all")
async def logout_all_devices(user_id: str, db: Session):
    # 1. Invalidate all refresh tokens
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).delete()
    
    # 2. Blacklist all active access tokens
    active_tokens = db.query(AccessToken).filter(
        AccessToken.user_id == user_id,
        AccessToken.expires_at > datetime.utcnow()
    ).all()
    
    for token in active_tokens:
        # Add to Redis blacklist
        await redis.setex(
            f"blacklist:{token.jti}",
            token.expires_at - datetime.utcnow(),
            "1"
        )
    
    # 3. Notify other devices via WebSocket
    await websocket_manager.broadcast_to_user(
        user_id,
        {"type": "logout", "reason": "user_initiated"}
    )
    
    return {"status": "logged_out_all_devices"}
```

---

## 16. Version Control

### **Scenario 16.1: Restore Version While Others Editing**

```
Document: "Team Roadmap.md"
- User A: Editing (online, real-time)
- User B: Viewing version history
        ↓
    User B clicks "Restore" on version from 2 hours ago
        ↓
    [Conflict Detection]
    
    ⚠️ "Document is being edited"
    
    "User A is currently editing this document.
     Restoring an old version may lose their changes."
    
    Options:
    ( ) Wait for User A to finish
    ( ) Restore anyway (User A will see conflict)
    (•) Create copy of old version
    ( ) Cancel
    
    [Cancel] [Continue]
        ↓
    User B selects "Create copy"
        ↓
    New document created:
    "Team Roadmap (restored from Dec 10 8:00 AM).md"
        ↓
    ✅ No conflicts, both versions exist
```

**Implementation**:
```typescript
const restoreVersion = async (
  documentId: string,
  version: Version
) => {
  // Check if anyone is currently editing
  const activeEditors = await getActiveEditors(documentId);
  
  if (activeEditors.length > 0) {
    const choice = await showDialog({
      title: 'Document is being edited',
      message: `${activeEditors.map(e => e.name).join(', ')} currently editing.`,
      options: [
        { value: 'wait', label: 'Wait for them to finish' },
        { value: 'force', label: 'Restore anyway' },
        { value: 'copy', label: 'Create copy' },
      ]
    });
    
    if (choice === 'copy') {
      // Create new document with old content
      const newDoc = await createDocument({
        title: `${document.title} (restored)`,
        content: version.content,
        workspace_id: document.workspace_id
      });
      
      navigate(`/workspace/doc/${newDoc.id}`);
      return;
    } else if (choice === 'wait') {
      // Poll until no active editors
      await waitForEditors(documentId);
    }
  }
  
  // Restore version
  await updateDocument(documentId, {
    content: version.content,
    version_restored_from: version.id
  });
  
  toast.success('Version restored');
};
```

---

## 17. Monitoring & Error Handling

### **Scenario 17.1: Sentry Captures Error - User Experience**

```
User editing document
        ↓
    JavaScript error occurs:
    TypeError: Cannot read property 'content' of undefined
        ↓
    [Error Boundary Catches]
    
    1. Log to Sentry (with context)
    2. Show user-friendly message
    3. Attempt recovery
        ↓
    [User Sees]
    
    ⚠️ "Something went wrong"
    
    "An error occurred while editing your document.
     Your changes have been saved."
    
    [Reload] [Report Issue]
        ↓
    User clicks "Report Issue"
        ↓
    [Feedback Form]
    
    What were you doing?
    [Text area with pre-filled context]
    
    Error ID: abc123-def456
    (This helps us investigate)
    
    [Cancel] [Submit]
        ↓
    User submits
        ↓
    Linked to Sentry issue
        ↓
    Engineer can see:
    - Error stack trace
    - User feedback
    - Session replay (if enabled)
    - Breadcrumbs (last 50 actions)
```

**Sentry Configuration**:
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Capture 10% of sessions for performance monitoring
  tracesSampleRate: 0.1,
  
  // Capture session replays on errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Add user context
  beforeSend(event, hint) {
    // Add user info (if logged in)
    if (user) {
      event.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };
    }
    
    // Add document context
    if (currentDocument) {
      event.contexts = {
        ...event.contexts,
        document: {
          id: currentDocument.id,
          title: currentDocument.title,
          size: currentDocument.content?.length
        }
      };
    }
    
    return event;
  },
  
  // Filter sensitive data
  beforeBreadcrumb(breadcrumb) {
    // Don't log document content
    if (breadcrumb.category === 'console' && 
        breadcrumb.message?.includes('content:')) {
      return null;
    }
    return breadcrumb;
  }
});
```

---

## 18. Advanced Features (Phase 7)

### **Scenario 18.1: Mobile App - Limited Storage**

```
User installs MDReader on iPhone (64GB, 2GB available)
        ↓
    Opens app
        ↓
    [Storage Check]
    
    Available: 2GB
    Recommended: 5GB for offline mode
        ↓
    ⚠️ "Limited storage"
    
    "Your device has limited storage.
     Recommend using cloud-only mode."
    
    ( ) Cloud-only (documents in cloud, no local copies)
    ( ) Selective sync (choose which docs to download)
    ( ) Full offline (download all, may fill storage)
    
    [Continue]
        ↓
    User selects "Selective sync"
        ↓
    [Document Picker]
    
    Select documents to keep offline:
    
    [x] Current Projects (5 docs, 2MB)
    [ ] Archive 2023 (100 docs, 50MB)
    [x] Meeting Notes (10 docs, 1MB)
        ↓
    Total: 3MB
        ↓
    ✅ Synced 15 documents offline
```

**Storage API**:
```typescript
// Check available storage (iOS/Android)
const checkStorage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { quota, usage } = await navigator.storage.estimate();
    const available = quota - usage;
    const availableGB = available / (1024 ** 3);
    
    if (availableGB < 1) {
      showLowStorageWarning();
      recommendCloudOnly();
    }
    
    return { quota, usage, available };
  }
  
  // Fallback for older devices
  return null;
};
```

---

### **Scenario 18.2: Plugin - Installation & Sandboxing**

```
User discovers "Spell Check" plugin in marketplace
        ↓
    Clicks "Install"
        ↓
    [Plugin Manifest]
    
    {
      "name": "Spell Check",
      "version": "1.0.0",
      "permissions": [
        "editor:read",
        "editor:modify"
      ],
      "author": "MDReader Team",
      "verified": true
    }
        ↓
    [Permission Prompt]
    
    "Spell Check" requests:
    
    ✓ Read editor content (to check spelling)
    ✓ Modify editor content (to fix mistakes)
    
    [Deny] [Allow]
        ↓
    User clicks "Allow"
        ↓
    [Sandboxed Installation]
    
    Plugin runs in isolated iframe
    Cannot access:
    - Other documents
    - Network (unless permission granted)
    - localStorage
    - IndexedDB
        ↓
    ✅ Plugin installed
        ↓
    [Usage]
    
    User types: "teh quick brown fox"
        ↓
    Plugin detects error, underlines "teh"
    Right-click → "the" (suggestion)
        ↓
    User clicks "the"
        ↓
    Plugin calls: editor.replaceText("teh", "the")
        ↓
    ✅ Fixed
```

**Plugin API**:
```typescript
// Define plugin interface
interface MDReaderPlugin {
  id: string;
  name: string;
  version: string;
  permissions: Permission[];
  
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  editor: EditorAPI;
  workspace: WorkspaceAPI;
  ui: UIAPI;
}

// Example plugin
class SpellCheckPlugin implements MDReaderPlugin {
  id = 'spell-check';
  name = 'Spell Check';
  version = '1.0.0';
  permissions = ['editor:read', 'editor:modify'];
  
  activate(context: PluginContext) {
    // Listen for editor changes
    context.editor.on('update', async ({ editor }) => {
      const text = editor.getText();
      const mistakes = await checkSpelling(text);
      
      // Highlight mistakes
      mistakes.forEach(mistake => {
        context.editor.addDecoration({
          from: mistake.from,
          to: mistake.to,
          class: 'spelling-error',
          suggestions: mistake.suggestions
        });
      });
    });
  }
  
  deactivate() {
    // Cleanup
  }
}

// Plugin loader (sandboxed)
const loadPlugin = async (pluginUrl: string) => {
  // Load plugin in iframe sandbox
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.src = pluginUrl;
  
  // Communicate via postMessage
  window.addEventListener('message', (event) => {
    if (event.source === iframe.contentWindow) {
      handlePluginMessage(event.data);
    }
  });
};
```

---

### **Scenario 18.3: Team/Organization - Permission Conflict**

```
Organization: "Acme Corp"
User: Alice (role: Editor)
        ↓
    Alice tries to delete "Company Policy.md"
        ↓
    [Permission Check]
    
    Document owner: Bob (Admin)
    Document permissions: Admin only
    Alice role: Editor
        ↓
    ❌ "Permission denied"
    
    "You don't have permission to delete this document.
     Only Admin can delete it."
    
    Request permission from:
    • Bob (Owner)
    • Carol (Admin)
    
    [Request Access] [Cancel]
        ↓
    Alice clicks "Request Access"
        ↓
    [Request Form]
    
    Requesting: Delete permission
    Document: "Company Policy.md"
    Reason: [Text area]
        ↓
    Alice enters: "This is outdated, we have new version"
        ↓
    [Notification to Bob]
    
    "Alice requested delete permission for Company Policy.md"
    
    Reason: "This is outdated, we have new version"
    
    [Deny] [Approve]
        ↓
    Bob clicks "Approve"
        ↓
    Alice can now delete document
        ↓
    ✅ Permission granted
```

**RBAC System**:
```typescript
// Role-Based Access Control
enum Role {
  Viewer = 'viewer',
  Editor = 'editor',
  Admin = 'admin',
  Owner = 'owner'
}

enum Permission {
  Read = 'read',
  Write = 'write',
  Delete = 'delete',
  Share = 'share',
  ChangePermissions = 'change_permissions'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.Viewer]: [Permission.Read],
  [Role.Editor]: [Permission.Read, Permission.Write],
  [Role.Admin]: [Permission.Read, Permission.Write, Permission.Delete, Permission.Share],
  [Role.Owner]: Object.values(Permission) // All permissions
};

const checkPermission = (
  user: User,
  document: Document,
  permission: Permission
): boolean => {
  // Get user's role for this document
  const userRole = getUserRole(user.id, document.id);
  
  // Check if role has permission
  const hasPermission = rolePermissions[userRole]?.includes(permission);
  
  return hasPermission;
};

// Usage
const handleDelete = async (documentId: string) => {
  const canDelete = checkPermission(currentUser, document, Permission.Delete);
  
  if (!canDelete) {
    showPermissionDeniedDialog();
    return;
  }
  
  await deleteDocument(documentId);
};
```

---

## 📊 **Scenario Matrix**

| Scenario | Local Only | Online | Collaborative | Edge Case | Performance |
|----------|-----------|--------|---------------|-----------|-------------|
| **First install** | ✅ | - | - | - | - |
| **Import .md files** | ✅ | - | - | - | - |
| **Create document** | ✅ | ✅ | - | - | - |
| **Auto-save** | ✅ | ✅ | ✅ | - | - |
| **Organize folders** | ✅ | ✅ | - | - | - |
| **Sign up** | ✅ | ✅ | - | - | - |
| **Sync existing local file** | ✅ | ✅ | - | ✅ | - |
| **Online/Offline toggle** | ✅ | ✅ | - | - | - |
| **Go offline while editing** | ✅ | ✅ | ✅ | ✅ | - |
| **Edit on 2 devices offline** | - | ✅ | ✅ | ✅ | - |
| **Real-time collaboration** | - | ✅ | ✅ | - | - |
| **Share document** | - | ✅ | ✅ | - | - |
| **Conflict resolution** | - | ✅ | ✅ | ✅ | - |
| **Delete while offline** | ✅ | ✅ | - | ✅ | - |
| **AI features** | ✅ | ✅ | ✅ | - | - |
| **Import from Notion** | ✅ | - | - | - | - |
| **Accidental delete** | ✅ | ✅ | - | ✅ | - |
| **Corrupted file** | ✅ | ✅ | - | ✅ | - |
| **Complete data loss** | - | ✅ | - | ✅ | - |
| **Multi-window editing** | - | ✅ | ✅ | ✅ | - |
| **Storage quota exceeded** | ✅ | - | - | ✅ | - |
| **Safari private mode** | - | ✅ | - | ✅ | - |
| **Browser clears data** | - | ✅ | - | ✅ | - |
| **Command Palette** | ✅ | ✅ | - | - | - |
| **Graph View (1000+ docs)** | ✅ | ✅ | - | - | ✅ |
| **Templates** | ✅ | ✅ | - | ✅ | - |
| **Publishing** | - | ✅ | - | ✅ | - |
| **Advanced Search** | ✅ | ✅ | - | ✅ | ✅ |
| **100MB document** | ✅ | ✅ | - | - | ✅ |
| **10,000+ documents** | ✅ | ✅ | - | - | ✅ |
| **Deep folder nesting** | ✅ | ✅ | - | ✅ | ✅ |
| **Flaky connection** | ✅ | ✅ | ✅ | ✅ | - |
| **WebSocket blocked** | - | ✅ | ✅ | ✅ | - |
| **Token expiration** | - | ✅ | - | ✅ | - |
| **Multi-device logout** | - | ✅ | - | ✅ | - |
| **Version restore conflict** | - | ✅ | ✅ | ✅ | - |
| **Error tracking** | ✅ | ✅ | ✅ | ✅ | - |
| **Mobile limited storage** | ✅ | ✅ | - | ✅ | - |
| **Plugin installation** | ✅ | ✅ | - | ✅ | - |
| **Team permissions** | - | ✅ | ✅ | ✅ | - |

---

## 🎯 **Summary: Every Possible Scenario Covered**

### **1. Installation & Setup**
✅ First-time install (no login)
✅ Import existing .md files
✅ Configure folder structure
✅ Set up AI API keys

### **2. Local-Only Workflows**
✅ Create/edit documents offline
✅ Auto-save (with toggle)
✅ Organize with folders
✅ Use AI features (no account needed)

### **3. Account & Cloud**
✅ Sign up (optional)
✅ Sync existing local files
✅ Login on multiple devices
✅ Download from cloud

### **4. Online/Offline**
✅ Global online/offline toggle
✅ Per-document sync control
✅ Go offline while editing
✅ Auto-reconnect and sync

### **5. Collaboration**
✅ Share documents
✅ Real-time editing (< 100ms)
✅ Collaborative cursors
✅ Conflict-free merging

### **6. Edge Cases**
✅ Same file edited on 2 devices
✅ Delete conflicts
✅ Move conflicts
✅ Name conflicts
✅ Corrupted files

### **7. Recovery**
✅ Undo delete (5s grace period)
✅ Restore from trash (30 days)
✅ Restore from cloud
✅ Complete data restore

### **8. Multi-Window & Browser**
✅ Multi-window editing
✅ Storage quota exceeded
✅ Browser compatibility
✅ Private/incognito mode

### **9. Power User Features**
✅ Command Palette (Cmd+K)
✅ Graph View
✅ Templates System
✅ Publishing
✅ Advanced Search

### **10. Performance & Scale**
✅ Large documents (10MB+)
✅ Large workspaces (10,000+ docs)
✅ Deep folder nesting
✅ Network edge cases

### **11. Authentication & Security**
✅ Token expiration
✅ Multi-device logout
✅ Account deletion
✅ Password reset

### **12. Version Control**
✅ Version history (1000+ versions)
✅ Restore old versions
✅ Version comparison
✅ Collaborative versioning

### **13. Monitoring & Error Handling**
✅ Error tracking
✅ Performance monitoring
✅ Analytics & privacy
✅ Error boundaries

### **14. Advanced Features**
✅ Mobile apps
✅ Plugins/Extensions
✅ Team/Organization
✅ Advanced export

---

**Status**: ✅ **ALL SCENARIOS DOCUMENTED**  
**Total Scenarios**: 85+  
**Coverage**: 100% (ALL PHASES)  
**Document Created**: December 10, 2025  
**Last Updated**: December 10, 2025 (Added 50+ missing scenarios)


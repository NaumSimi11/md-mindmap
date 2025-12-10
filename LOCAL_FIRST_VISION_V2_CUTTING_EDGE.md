# 🚀 **MDReader: Local-First Vision v2.0 (Cutting Edge)**

**Date**: December 10, 2025  
**Status**: 🔥 **Strategic Roadmap - Phased Implementation**  
**Purpose**: Define MDReader as a cutting-edge local-first editor with industry-leading architecture

---

## 📋 **What Changed from v1.0**

### **v1.0 (Basic Local-First)**
- ✅ Local storage with IndexedDB
- ✅ Guest mode
- ✅ Optional cloud sync
- ⚠️ Custom sync engine
- ⚠️ Manual conflict resolution

### **v2.0 (Cutting Edge)** ⭐ **THIS DOCUMENT**
- ✅ All features from v1.0
- 🆕 **Per-document storage modes** (LocalOnly/CloudOnly/HybridSync)
- 🆕 **Yjs CRDT as foundation** (phased migration)
- 🆕 **Tauri desktop platform** (native filesystem)
- 🆕 **Storage adapter pattern** (pluggable backends)
- 🆕 **Dual identity system** (local_id + remote_id)
- 🆕 **Automatic conflict resolution** (CRDT-based)

---

## 🎯 **Core Philosophy (Upgraded)**

### **The Vision**

MDReader is a **local-first markdown editor** that combines:
- **Obsidian's local-first autonomy** (works 100% offline)
- **Notion's cloud-sync elegance** (seamless cross-device)
- **Google Docs' real-time collaboration** (instant multi-user)
- **Dropbox's hybrid sync model** (local + cloud, best of both)

**Tagline**: *"Your markdown, your device, your rules — now with cutting-edge sync."*

---

### **What Makes v2.0 "Cutting Edge"?**

| Innovation | Description | Benefit |
|------------|-------------|---------|
| **Per-Document Storage Modes** | Each doc can be LocalOnly, CloudOnly, or HybridSync | Granular control, privacy-first |
| **Yjs CRDT Engine** | Automatic conflict-free merging | Zero conflicts, better undo/redo |
| **Tauri Native Platform** | Desktop app with filesystem storage | Better performance, true offline |
| **Dual Identity System** | local_id + remote_id per document | Seamless migration, no lock-in |
| **Storage Adapter Pattern** | Pluggable storage backends | Future-proof, flexible |

---

## 📊 **Storage Modes (The Game Changer)**

### **The Key Innovation: Per-Document Control**

Unlike competitors (all-or-nothing), MDReader lets you choose **per document**:

```
Document A: "Private Journal"
  → LocalOnly (never leaves your device)

Document B: "Work Notes"
  → HybridSync (local + cloud, works offline)

Document C: "Team Roadmap"
  → CloudOnly (always in cloud, collaborate)
```

---

### **Mode 1: LocalOnly** 🔒

**Storage**: Local device only (IndexedDB or Tauri filesystem)  
**Cloud**: Never touches cloud  
**Collaboration**: ❌ No (solo only)  
**Cross-Device**: ❌ No (device-bound)  
**Offline**: ✅ 100% (always works)

**Use Cases**:
- Private journals
- Personal notes
- Sensitive documents
- When you don't trust cloud

**Technical**:
```typescript
// Document stored ONLY locally
{
  local_id: "abc-123",
  remote_id: null, // ← No cloud identity
  storage_mode: "LocalOnly",
  // Content stored in IndexedDB or Tauri FS
}
```

---

### **Mode 2: CloudOnly** ☁️

**Storage**: Cloud (PostgreSQL) + local cache (ephemeral)  
**Cloud**: ✅ Primary storage  
**Collaboration**: ✅ Yes (real-time)  
**Cross-Device**: ✅ Yes (sync via cloud)  
**Offline**: ⚠️ Cached (but needs cloud as source of truth)

**Use Cases**:
- Team documents
- Shared wikis
- Web-only users
- When collaboration is primary

**Technical**:
```typescript
// Document lives in cloud
{
  local_id: "abc-123", // For local reference
  remote_id: "xyz-789", // ← Cloud identity
  storage_mode: "CloudOnly",
  // Content synced from cloud, local is just cache
}
```

---

### **Mode 3: HybridSync** 🔄 ⭐ **RECOMMENDED**

**Storage**: Local (primary) + Cloud (sync)  
**Cloud**: ✅ Syncs when available  
**Collaboration**: ✅ Yes (when online)  
**Cross-Device**: ✅ Yes (via cloud sync)  
**Offline**: ✅ 100% (local copy always works)

**Use Cases**:
- Most documents
- Desktop app users
- Unreliable network
- Best of both worlds

**Technical**:
```typescript
// Document exists in BOTH places
{
  local_id: "abc-123",
  remote_id: "xyz-789", // ← Syncs to cloud
  storage_mode: "HybridSync",
  last_synced_at: "2025-12-10T10:30:00Z",
  // Edits work offline, sync when online
}
```

**How It Works** (Dropbox-style):
1. User edits locally → Saved to local storage FIRST
2. Change queued for cloud sync
3. (Background) Syncs to cloud when online
4. Other devices pull changes from cloud
5. If offline, edits accumulate → sync when online returns

---

## 🎨 **User Experience: Storage Mode Switcher**

### **Document Info Panel**

```
┌─────────────────────────────────────────┐
│  Document: "Meeting Notes"             │
├─────────────────────────────────────────┤
│                                         │
│  Storage Mode:  [🔒 Local] [🔄 Hybrid] [☁️ Cloud]  │
│                    ▲ Selected            │
│                                         │
│  Status: ✅ Synced (2 mins ago)         │
│                                         │
│  [⚙️ Advanced Settings]                 │
│    ☐ Enable collaboration              │
│    ☐ Allow public sharing              │
│                                         │
└─────────────────────────────────────────┘
```

**Mode Transitions**:
- **LocalOnly → HybridSync**: "Sync to cloud" → Creates remote copy
- **HybridSync → LocalOnly**: "Stop syncing" → Keeps local, archives cloud
- **CloudOnly → HybridSync**: "Keep local copy" → Downloads full copy
- **HybridSync → CloudOnly**: "Clear local storage" → Cloud becomes primary

---

## 🧩 **Yjs CRDT: The Secret Sauce**

### **Why Yjs for ALL Documents?**

**Traditional Approach** (Current):
```
Local docs: Plain text + manual versioning
Cloud docs: Plain text + sync queue + conflict UI
```

**Problem**: Two different systems, manual conflicts, no undo/redo across devices

---

**Yjs Approach** (Cutting Edge):
```
ALL docs: Yjs CRDT (local or cloud)
```

**Benefits**:

| Benefit | Local-Only | Cloud-Synced | Collaborative |
|---------|-----------|--------------|---------------|
| **Better Undo/Redo** | ✅ CRDT-based (better than history API) | ✅ | ✅ |
| **No Conflicts** | N/A | ✅ Automatic merge | ✅ Automatic merge |
| **Offline Robust** | ✅ | ✅ Edits queue automatically | ✅ |
| **Cross-Device** | ❌ | ✅ CRDT merge | ✅ |
| **Real-time** | ❌ | ⚠️ Async | ✅ Instant |

---

### **Yjs for Local-Only Documents**

**Even if you NEVER sync to cloud**, Yjs gives you:

1. **Superior Undo/Redo**
   ```typescript
   // Traditional: Limited browser history
   document.execCommand('undo'); // ❌ Basic, breaks easily
   
   // Yjs: Full CRDT history
   ydoc.undo(); // ✅ Robust, never breaks
   ```

2. **Structural Integrity**
   ```typescript
   // Traditional: Can corrupt with bad edits
   content += "<div>"; // ❌ Unmatched tags
   
   // Yjs: Maintains document structure
   ytext.insert(pos, "text"); // ✅ Always valid
   ```

3. **Future-Proof**
   ```typescript
   // If you later enable cloud sync:
   // Traditional: Must migrate to new format
   // Yjs: Already compatible! Just connect to Hocuspocus
   ```

**Key Insight**: **Yjs is not just for collaboration. It's a better document engine, period.**

---

## 🏗️ **Architecture v2.0 (Cutting Edge)**

### **Layered Architecture with Pluggable Storage**

```
┌────────────────────────────────────────────────────────────────┐
│                     MDREADER v2.0 ARCHITECTURE                 │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Layer 1: USER INTERFACE (React + TipTap)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Editor (TipTap + Yjs binding)                     │   │
│  │  • Sidebar (document list)                           │   │
│  │  • Storage mode switcher                             │   │
│  │  • Sync status indicator                             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: DOCUMENT ENGINE (Yjs CRDT)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Y.Doc (CRDT document)                             │   │
│  │  • Undo/Redo manager                                 │   │
│  │  • Change tracking                                   │   │
│  │  • Conflict-free merging                             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: STORAGE ADAPTER (Pluggable)                       │
│  ┌─────────────────────┬──────────────────────────────┐    │
│  │  IndexedDB Adapter  │  Tauri FS Adapter            │    │
│  │  (Web)              │  (Desktop)                    │    │
│  │  • y-indexeddb      │  • .mddoc files               │    │
│  │  • Browser storage  │  • ~/Documents/MDReader/      │    │
│  └─────────────────────┴──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: SYNC PROVIDERS (Optional, per storage mode)       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LocalOnly Mode:    No sync provider                 │   │
│  │  HybridSync Mode:   Hocuspocus + y-indexeddb         │   │
│  │  CloudOnly Mode:    Hocuspocus (primary)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 5: CLOUD BACKEND (Optional)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Hocuspocus (collab server, Node.js)              │   │
│  │  • FastAPI (app backend, auth, metadata)            │   │
│  │  • PostgreSQL (user data, permissions)              │   │
│  │  • document_collab_state table (Yjs persistence)    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Changes from v1.0**:
- 🆕 **Layer 2 (Yjs CRDT)** - Universal document engine
- 🆕 **Layer 3 (Storage Adapter)** - Pluggable storage
- 🆕 **Layer 4 (Sync Providers)** - Mode-specific sync logic
- ✅ **Layers 1-3 work standalone** (no cloud needed)

---

## 🔄 **Phased Migration Path (Practical)**

### **Phase 1: Current System (NOW)** ✅ Already Built

**What We Have**:
```
Custom Offline System:
  - IndexedDB (Dexie.js)
  - Custom SyncManager (queue-based)
  - Manual ConflictResolver UI
  - Guest mode (GuestManager)
```

**Storage Modes**: Guest / Authenticated (basic)  
**Collaboration**: ❌ Not yet  
**Timeline**: ✅ Already shipped

---

### **Phase 2: Storage Mode Refactor (4 weeks)**

**What We Add**:
```
Per-Document Storage Modes:
  - LocalOnly (device-bound)
  - CloudOnly (cloud-primary)
  - HybridSync (local + cloud)
```

**Changes**:
1. Add `storage_mode` field to documents
2. Add UI switcher in document info panel
3. Update sync logic to respect storage mode
4. Keep current sync engine (no Yjs yet)

**Result**: User can control which docs sync to cloud

**Timeline**: 4 weeks  
**Risk**: Low (enhances current system)

---

### **Phase 3: Yjs Foundation (6 weeks)**

**What We Add**:
```
Yjs CRDT Engine:
  - Install yjs, y-indexeddb
  - Migrate LocalOnly docs to use Yjs (for better undo/redo)
  - Keep cloud sync as-is (custom queue)
```

**Migration Strategy**:
1. **LocalOnly docs first** (no cloud, low risk)
   - Wrap TipTap with Yjs binding
   - Store Yjs state in IndexedDB
   - Get better undo/redo immediately

2. **Cloud-synced docs later** (Phase 4)
   - Replace custom sync with Hocuspocus
   - Automatic conflict resolution

**Result**: Better local editing, foundation for future collaboration

**Timeline**: 6 weeks  
**Risk**: Medium (document format migration)

---

### **Phase 4: Hocuspocus + Real-Time Collab (8 weeks)**

**What We Add**:
```
Hocuspocus Collaboration Server:
  - Real-time sync (< 100ms)
  - Automatic conflict resolution
  - Collaborative cursors
  - Presence awareness
```

**Changes**:
1. Deploy Hocuspocus server
2. Replace custom sync with Yjs sync protocol
3. Add collaboration UI (cursors, avatars)
4. Migrate cloud-synced docs to use Hocuspocus

**Result**: Google Docs-quality collaboration

**Timeline**: 8 weeks  
**Risk**: Medium (infrastructure complexity)

---

### **Phase 5: Tauri Desktop App (6 weeks)**

**What We Add**:
```
Native Desktop App:
  - Tauri wrapper around React app
  - Filesystem storage (.mddoc files)
  - OS-level encryption
  - Better offline performance
```

**Benefits**:
1. **No browser limitations** (unlimited storage)
2. **Filesystem integration** (~/Documents/MDReader/)
3. **Native feel** (proper menus, system tray)
4. **Encryption** (OS keychain integration)

**Result**: Professional desktop app (like Obsidian)

**Timeline**: 6 weeks  
**Risk**: Low (Tauri is mature)

---

## 🎯 **Complete Feature Matrix (All Modes)**

| Feature | LocalOnly | CloudOnly | HybridSync | Guest Mode |
|---------|-----------|-----------|------------|------------|
| **No Login** | ✅ (if anon) | ❌ Requires auth | ⚠️ Requires auth | ✅ Yes |
| **Offline Editing** | ✅ 100% | ⚠️ Cache only | ✅ 100% | ✅ 100% |
| **Cross-Device** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Cloud Backup** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Real-time Collab** | ❌ No | ✅ Yes | ✅ Yes (when online) | ❌ No |
| **Shareable Links** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Comments** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Version History** | ⚠️ Local undo | ✅ Cloud-stored | ✅ Cloud-stored | ⚠️ Local undo |
| **Storage Limit** | ⚠️ Browser quota | ✅ Unlimited | ✅ Unlimited | ⚠️ Browser quota |
| **Data Safety** | ⚠️ Device-only | ✅ Cloud backup | ✅✅ Both! | ⚠️ Browser-only |
| **Privacy** | ✅✅ Highest | ⚠️ Cloud-dependent | ✅ User controls | ✅ High |

---

## 🌟 **Storage Mode Comparison**

### **When to Use Each Mode**

```
┌─────────────────────────────────────────────────────────┐
│  LocalOnly                                              │
│  Best for: Private journals, sensitive docs             │
│  Trade-off: No backup, device-bound                     │
│  Like: Obsidian (without sync)                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HybridSync ⭐ RECOMMENDED                               │
│  Best for: Most documents, desktop users                │
│  Trade-off: Requires auth, uses cloud storage           │
│  Like: Dropbox, Obsidian Sync                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CloudOnly                                              │
│  Best for: Team docs, web-only users, collaboration     │
│  Trade-off: Needs internet for authoritative version    │
│  Like: Google Docs, Notion                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Guest Mode                                             │
│  Best for: First-time users, trying the app             │
│  Trade-off: Browser-bound, no backup                    │
│  Like: Figma (before signup)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 **Platform Strategy: Web + Desktop**

### **Web Platform** (Browser)

**Strengths**:
- ✅ Zero install (instant access)
- ✅ Works on any device
- ✅ Easy to share (just a URL)
- ✅ Automatic updates

**Limitations**:
- ⚠️ Browser storage limits (~50MB-500MB)
- ⚠️ IndexedDB can be cleared by browser
- ⚠️ Performance limited by browser

**Best For**: CloudOnly and HybridSync documents

---

### **Desktop Platform** (Tauri) ⭐ **STRATEGIC**

**Strengths**:
- ✅ Unlimited storage (filesystem)
- ✅ Better performance (native)
- ✅ OS integration (menus, shortcuts, system tray)
- ✅ True offline (no browser dependency)
- ✅ Filesystem encryption

**Use Cases**:
- LocalOnly documents (private, never cloud)
- HybridSync documents (local copy + cloud)
- Power users (writers, developers)
- Users who want full control

**File Structure**:
```
~/Documents/MDReader/
  config.json
  users/
    guest/
      workspace.json
      documents/
        abc-123.mddoc
        def-456.mddoc
    user_xyz-789/
      workspace.json
      documents/
        ghi-012.mddoc
```

**`.mddoc` File Format**:
```json
{
  "meta": {
    "local_id": "abc-123",
    "remote_id": "xyz-789",
    "title": "My Document",
    "storage_mode": "HybridSync",
    "created_at": "2025-12-10T10:00:00Z",
    "updated_at": "2025-12-10T15:30:00Z",
    "last_synced_at": "2025-12-10T15:30:00Z"
  },
  "yjs_state": "<base64-encoded Yjs snapshot>",
  "version": 1
}
```

**Benefits**:
- ✅ Human-readable metadata
- ✅ Portable (export/import .mddoc files)
- ✅ Version control friendly (can commit to Git)
- ✅ Backup-friendly (just copy folder)

---

## 🔐 **Security & Privacy (Cutting Edge)**

### **Privacy Tiers**

| Storage Mode | Privacy Level | Who Can Access |
|--------------|---------------|----------------|
| **LocalOnly** | 🔒🔒🔒 Highest | Only you, on this device |
| **HybridSync** | 🔒🔒 High | You (all devices) + cloud provider |
| **CloudOnly** | 🔒 Medium | You + cloud provider + collaborators |
| **Guest** | 🔒🔒 High | Only you, this browser |

---

### **Encryption Strategy**

**Phase 1**: Transport encryption (HTTPS, WSS)  
**Phase 2**: At-rest encryption (database-level)  
**Phase 3**: End-to-end encryption (optional)

```
┌─────────────────────────────────────────┐
│  Encryption Layers                      │
├─────────────────────────────────────────┤
│                                         │
│  Level 1: Transport (HTTPS/WSS)        │
│  Status: ✅ Standard                    │
│                                         │
│  Level 2: Database (AES-256)           │
│  Status: ⚠️ PostgreSQL encryption       │
│                                         │
│  Level 3: End-to-End (Zero-Knowledge)  │
│  Status: 🔮 Future (Phase 3)            │
│  • Client-side encryption               │
│  • Server can't read content            │
│  • User manages keys                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 **UI/UX Enhancements (Cutting Edge)**

### **Storage Mode Indicator (Sidebar)**

```
┌─────────────────────────────────────────┐
│  My Documents                           │
├─────────────────────────────────────────┤
│                                         │
│  🔒 Private Journal         [LocalOnly] │
│  🔄 Work Notes             [HybridSync] │
│  ☁️ Team Roadmap            [CloudOnly] │
│  📝 Quick Note              [HybridSync]│
│                                         │
└─────────────────────────────────────────┘
```

**Visual Language**:
- 🔒 LocalOnly = Locked icon (never leaves device)
- 🔄 HybridSync = Sync icon (local + cloud)
- ☁️ CloudOnly = Cloud icon (cloud-primary)

---

### **Quick Mode Switcher (Context Menu)**

```
Right-click document → Storage Settings
┌─────────────────────────────────────────┐
│  Storage Mode                           │
├─────────────────────────────────────────┤
│  ○ Local Only                           │
│    Keep on this device only             │
│                                         │
│  ● Hybrid Sync (Recommended)            │
│    Local copy + cloud backup            │
│                                         │
│  ○ Cloud Only                           │
│    Cloud-first, collaboration enabled   │
└─────────────────────────────────────────┘
```

---

### **Sync Status (Real-time)**

```
Top-right corner:

┌─────────────────────────────────────────┐
│  Document: "Meeting Notes"             │
│  Mode: HybridSync                       │
│  Status: ✅ Synced (2 mins ago)         │
│                                         │
│  [3 users online] 👤👤👤                 │
└─────────────────────────────────────────┘

When offline:
┌─────────────────────────────────────────┐
│  Document: "Meeting Notes"             │
│  Mode: HybridSync                       │
│  Status: 📴 Offline (3 pending changes) │
│                                         │
│  [Will sync when online]                │
└─────────────────────────────────────────┘
```

---

## 🚀 **Implementation Roadmap (Realistic)**

### **Timeline Overview**

```
Current                              Future
  ↓                                     ↓
┌───────┬───────┬───────┬───────┬───────┬───────┐
│ NOW   │ P2    │ P3    │ P4    │ P5    │ P6    │
│       │       │       │       │       │       │
│Custom │Storage│ Yjs   │Hocus- │Tauri  │E2E    │
│System │Modes  │Local  │pocus  │App    │Encrypt│
│       │       │       │Collab │       │       │
└───────┴───────┴───────┴───────┴───────┴───────┘
  ✅       4w      6w      8w      6w      4w

Total: 28 weeks (7 months) to complete vision
```

---

### **Phase 1: Current System** ✅ DONE

**Status**: Already built  
**Lines of Code**: 1,800+  
**Features**:
- Guest mode
- IndexedDB storage
- Custom sync queue
- Manual conflict resolution

**What to Keep**: Everything (it works!)

---

### **Phase 2: Storage Mode System (4 weeks)**

**Goal**: Add per-document storage control

**Tasks**:
- [ ] Add `storage_mode` field to document model
- [ ] Create storage mode switcher UI
- [ ] Implement LocalOnly enforcement (never sync)
- [ ] Implement CloudOnly behavior (cloud-primary)
- [ ] Implement HybridSync (current behavior, renamed)
- [ ] Migration script for existing documents

**Technical**:
```typescript
// Add to document schema
interface Document {
  // ... existing fields
  storage_mode: 'LocalOnly' | 'CloudOnly' | 'HybridSync';
  local_id: string;  // Always present
  remote_id: string | null; // Present if cloud-backed
}
```

**Deliverables**:
- User can mark documents as "LocalOnly" (never sync)
- User can convert LocalOnly → HybridSync (upload to cloud)
- User can convert HybridSync → CloudOnly (remove local primary)

**Effort**: 40 hours  
**Risk**: Low (enhances current system)

---

### **Phase 3: Yjs for Local Documents (6 weeks)**

**Goal**: Use Yjs for better local editing (no collaboration yet)

**Tasks**:
- [ ] Install Yjs packages
- [ ] Create Yjs document wrapper
- [ ] Bind TipTap to Yjs (using `@tiptap/extension-collaboration`)
- [ ] Store Yjs state in IndexedDB (using `y-indexeddb`)
- [ ] Migrate LocalOnly documents to Yjs format
- [ ] Keep custom sync for cloud documents (don't break what works)

**Benefits**:
- ✅ Better undo/redo (CRDT-based)
- ✅ Structural integrity
- ✅ Foundation for future collaboration
- ✅ No cloud dependency (works offline)

**Migration**:
```typescript
// Convert existing markdown to Yjs
const ydoc = new Y.Doc();
const ytext = ydoc.getText('content');
ytext.insert(0, existingMarkdownContent);

// Save Yjs state to IndexedDB
const state = Y.encodeStateAsUpdate(ydoc);
await indexedDB.put({ id: doc.local_id, yjs_state: state });
```

**Effort**: 60 hours  
**Risk**: Medium (document format change)

---

### **Phase 4: Hocuspocus + Real-Time Collab (8 weeks)**

**Goal**: Replace custom sync with Yjs sync for cloud documents

**Tasks**:
- [ ] Deploy Hocuspocus server
- [ ] Add `document_collab_state` table (PostgreSQL)
- [ ] Create collaboration token endpoint
- [ ] Replace custom SyncManager with Hocuspocus provider (for cloud docs)
- [ ] Add collaborative cursors UI
- [ ] Add presence avatars
- [ ] Keep custom sync as fallback (safety net)

**Architecture**:
```
LocalOnly docs:
  Yjs + y-indexeddb (no sync)

HybridSync docs:
  Yjs + y-indexeddb (local) + Hocuspocus (cloud sync)

CloudOnly docs:
  Yjs + Hocuspocus (primary)
```

**Deliverables**:
- Real-time collaboration (< 100ms sync)
- Automatic conflict resolution
- Collaborative cursors
- Presence awareness

**Effort**: 80 hours  
**Risk**: High (new infrastructure)

---

### **Phase 5: Tauri Desktop App (6 weeks)**

**Goal**: Native desktop app with filesystem storage

**Tasks**:
- [ ] Setup Tauri project
- [ ] Wrap React app in Tauri
- [ ] Implement filesystem storage adapter
- [ ] Add native menus and shortcuts
- [ ] OS-level encryption (keychain integration)
- [ ] Auto-updater
- [ ] Build for Mac, Windows, Linux

**File Storage**:
```
~/Documents/MDReader/
  documents/
    abc-123.mddoc
    def-456.mddoc
  workspaces/
    workspace_1.json
  config.json
```

**Deliverables**:
- Native Mac/Windows/Linux app
- Filesystem-based storage (better than browser)
- Unlimited storage (no browser quota)
- Professional app experience

**Effort**: 60 hours  
**Risk**: Low (Tauri is mature)

---

### **Phase 6: End-to-End Encryption (4 weeks)** 🔮 Future

**Goal**: Zero-knowledge encryption (optional)

**Tasks**:
- [ ] Client-side encryption before cloud upload
- [ ] User manages encryption keys
- [ ] Server cannot read content
- [ ] Recovery mechanisms

**Use Case**: Maximum privacy (journalists, lawyers, etc.)

**Effort**: 40 hours  
**Risk**: Medium (complexity, key management)

---

## 🎯 **Competitive Positioning (Cutting Edge)**

### **What Makes MDReader Unique**

| Feature | MDReader v2.0 | Obsidian | Notion | Google Docs |
|---------|---------------|----------|--------|-------------|
| **Per-doc storage modes** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Local-first** | ✅ Yes | ✅ Yes | ⚠️ Partial | ❌ No |
| **No login to start** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **100% offline** | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No |
| **Real-time collab** | ✅ Yes (Phase 4) | ❌ No | ✅ Yes | ✅ Yes |
| **Web + Desktop** | ✅ Both | ⚠️ Desktop only | ✅ Both | ⚠️ Web only |
| **Yjs CRDT** | ✅ Yes (Phase 3+) | ❌ No | ✅ Yes | ⚠️ OT |
| **Tauri native** | ✅ Yes (Phase 5) | ⚠️ Electron | ❌ No | ❌ No |

---

### **Market Positioning**

```
┌─────────────────────────────────────────────────────────────┐
│                    Competitive Landscape                    │
└─────────────────────────────────────────────────────────────┘

                    Cloud-First
                        ↑
                        │
                        │  Google Docs
                        │     ●
                        │
         Notion ●       │
                        │
                        │
    ←──────────────────┼──────────────────→
    Local-First        │              Collaboration
                       │
              ● MDReader v2.0
              (Best of both!)
                       │
           Obsidian ●  │
                       │
                       ↓
                  Local-Only
```

**Our Sweet Spot**: Local-first with optional cloud + collaboration

---

## 🔥 **What Makes This "Cutting Edge"?**

### **1. Granular Control (Industry-First)**

**Most apps**: All-or-nothing (either local or cloud)  
**MDReader**: Choose per document

**Example**:
```
User has 50 documents:
  - 30 are HybridSync (work notes, synced)
  - 15 are LocalOnly (private journal, never cloud)
  - 5 are CloudOnly (team docs, collaboration)
```

**Benefit**: Maximum flexibility + privacy

---

### **2. CRDT for Everything (Future-Proof)**

**Most apps**: Different engines for local vs cloud  
**MDReader**: Yjs for ALL documents

**Benefits**:
- ✅ Consistent behavior (local = cloud)
- ✅ Better undo/redo (CRDT-based)
- ✅ Zero conflicts (automatic merge)
- ✅ Easy mode switching (already Yjs-compatible)

---

### **3. Tauri Platform (Modern Desktop)**

**Old apps**: Electron (resource-heavy)  
**MDReader**: Tauri (Rust-based, lightweight)

**Benefits**:
- ✅ 10x smaller app size
- ✅ Better performance
- ✅ Lower memory usage
- ✅ Native OS integration

---

### **4. Phased Migration (Risk Management)**

**Most rewrites**: Big-bang migration (high risk)  
**MDReader**: Incremental phases (low risk)

**Phases**:
1. Keep current system (✅ working)
2. Add storage modes (enhances current)
3. Add Yjs for local (no cloud changes)
4. Replace cloud sync with Hocuspocus (last step)

**Result**: Always have a working product

---

## 📊 **Success Metrics (v2.0)**

### **Adoption Metrics**

| Metric | Target | Why Important |
|--------|--------|---------------|
| **Guest → User** | > 15% | User acquisition |
| **LocalOnly Usage** | > 30% | Privacy-conscious users |
| **HybridSync Adoption** | > 50% | Most users want sync |
| **CloudOnly Usage** | > 20% | Team collaboration |
| **Tauri Downloads** | > 40% | Desktop app adoption |

---

### **Performance Metrics**

| Metric | Target | Benchmark |
|--------|--------|-----------|
| **Time to First Edit** | < 2s | Obsidian: 3s, Notion: 5s |
| **Local Save** | < 10ms | Obsidian: 50ms |
| **Cloud Sync** | < 500ms | Notion: 1-2s |
| **Offline → Online Sync** | < 5s | Google Docs: 10-30s |
| **Real-time Latency** | < 100ms | Google Docs: 200ms |

---

### **Business Metrics**

| Metric | Target | Impact |
|--------|--------|--------|
| **Free → Pro Conversion** | > 10% | Revenue |
| **Collaboration Usage** | > 40% | Engagement |
| **Desktop App % ** | > 50% | Platform stickiness |
| **Retention (30-day)** | > 30% | Long-term success |

---

## 🏁 **Summary: What's Upgraded in v2.0**

### **From v1.0 to v2.0**

| Aspect | v1.0 (Basic) | v2.0 (Cutting Edge) |
|--------|--------------|---------------------|
| **Storage** | Guest / Auth | LocalOnly / HybridSync / CloudOnly per doc |
| **Document Engine** | Plain text | Yjs CRDT (phased) |
| **Platforms** | Web only | Web + Tauri desktop |
| **Collaboration** | Future | Planned with Hocuspocus |
| **Offline** | Works | Works + CRDT merge |
| **Encryption** | Transport | Transport + E2E (future) |
| **File Format** | Markdown | .mddoc (portable) |

---

### **Strategic Advantages**

1. **Granular Control** - Per-document storage modes (industry-first)
2. **CRDT Foundation** - Yjs for better editing + future collab
3. **Platform Flexibility** - Web + Desktop (Tauri)
4. **Progressive Migration** - No big-bang rewrite
5. **Future-Proof** - Easy to add features (CRDT compatible)

---

### **Implementation Strategy**

**Short-term (1-3 months)**:
- Enhance current system
- Add storage modes
- Ship guest mode

**Medium-term (4-6 months)**:
- Migrate to Yjs for local docs
- Better undo/redo

**Long-term (7-12 months)**:
- Add Hocuspocus (real-time collab)
- Ship Tauri desktop app
- End-to-end encryption

---

## ✅ **Next Steps**

### **Immediate Actions**:

1. **Validate Vision**
   - Does this align with business goals?
   - Are storage modes the right model?
   - Is phased approach acceptable?

2. **Technical Planning**
   - Create Phase 2 spec (storage modes)
   - Estimate effort for each phase
   - Risk assessment

3. **Start Implementation**
   - Begin with Phase 2 (storage modes)
   - 4 weeks to ship
   - Low risk, high value

---

## 📞 **Decision Points**

### **Question 1: Do we want per-document storage modes?**

**If YES**: Implement Phase 2 (4 weeks)  
**If NO**: Stick with current Guest/Auth model

**Our Recommendation**: **YES** - It's a unique differentiator

---

### **Question 2: Do we want to migrate to Yjs?**

**If YES**: Plan for Phase 3 (6 weeks, after Phase 2)  
**If NO**: Stay with custom sync (works fine, just no CRDT benefits)

**Our Recommendation**: **YES, but not immediately** - Do it in Phase 3 after storage modes work

---

### **Question 3: Do we want Tauri desktop app?**

**If YES**: Plan for Phase 5 (6 weeks)  
**If NO**: Stay web-only

**Our Recommendation**: **YES** - Desktop app is strategic for local-first positioning

---

## 🎤 **Final Verdict**

**Can we fit `high_level_architecture.md` into `LOCAL_FIRST_VISION.md`?**

**Answer**: ✅ **YES - With a phased approach**

**How**:
1. **Phase 1**: Keep current system (✅ done)
2. **Phase 2**: Add storage modes (from high_level_architecture.md)
3. **Phase 3**: Migrate to Yjs (from high_level_architecture.md)
4. **Phase 4**: Add Hocuspocus (from high_level_architecture.md)
5. **Phase 5**: Add Tauri (from high_level_architecture.md)

**Result**: We get the cutting-edge vision WITHOUT throwing away current code.

---

**Status**: 🎯 **Vision Upgraded - Ready for Implementation**  
**Next Step**: Approve phased roadmap and start Phase 2  
**Document Created**: December 10, 2025  
**Version**: 2.0 (Cutting Edge Edition)


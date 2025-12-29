# Sync Architecture: Documents & Workspaces

> Complete specification for local-first sync with automatic cloud synchronization.

---

## 🎯 Core Principles

1. **Local-First**: All data lives locally first (IndexedDB)
2. **Explicit Opt-In**: User decides what syncs to cloud
3. **Auto-Sync After Opt-In**: Once enabled, sync is automatic
4. **Offline Resilient**: Works offline, syncs when online
5. **Conflict Resolution**: Last-write-wins with conflict detection

---

## 📊 Sync Modes

### Document Sync Modes

| Mode | Description | Auto-Sync | Collaboration |
|------|-------------|-----------|---------------|
| `local-only` | Never syncs to cloud | ❌ | ❌ |
| `cloud-enabled` | Syncs automatically when online | ✅ | ✅ |
| `pending-sync` | Waiting for first push to cloud | ⏳ | ❌ |

### Workspace Sync Modes

| Mode | Description | Documents |
|------|-------------|-----------|
| `local` | Guest workspace, never syncs | All `local-only` |
| `cloud` | Authenticated workspace | Can be `local-only` or `cloud-enabled` |
| `hybrid` | Local workspace with some cloud docs | Mixed |

---

## 🔄 User Flows

### Flow 1: Guest Creates Document (No Login)

```
[Create Doc] → syncMode: 'local-only'
            → stored in IndexedDB
            → NO cloud interaction
```

### Flow 2: User Logs In (Has Local Documents)

```
[Login] → Local docs remain 'local-only'
       → User sees "Push to Cloud" option per document
       → User can bulk "Sync All" if desired
```

### Flow 3: Enable Cloud Sync for Document

```
[Click "Enable Cloud Sync"] 
  → syncMode: 'pending-sync'
  → Push document to backend
  → Backend returns cloudId
  → syncMode: 'cloud-enabled'
  → Future edits auto-sync
```

### Flow 4: Offline Editing (Cloud-Enabled Doc)

```
[Go Offline] → Continue editing locally
[Changes] → Stored in IndexedDB with syncStatus: 'modified'
[Go Online] → Auto-detect online status
           → Push modified documents
           → syncStatus: 'synced'
```

### Flow 5: Create Document While Logged In

```
[Create Doc] 
  → Modal asks: "Local only" or "Sync to cloud"?
  → OR: Default to cloud-enabled for cloud workspaces
  → If cloud: immediately push to backend
```

### Flow 6: Workspace Sync

```
[Create Cloud Workspace]
  → Workspace syncs to backend
  → All docs in workspace default to 'cloud-enabled'
  → Folders sync automatically

[Local Workspace]
  → Never syncs (guest data)
  → Can "upgrade" to cloud workspace on login
```

---

## 🗂️ Data Model Updates

### DocumentMeta (Updated)

```typescript
interface DocumentMeta {
  id: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  content: string;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  
  // === SYNC FIELDS ===
  syncMode: 'local-only' | 'cloud-enabled' | 'pending-sync';  // NEW!
  syncStatus: 'local' | 'synced' | 'syncing' | 'modified' | 'conflict' | 'error';
  cloudId?: string;           // Backend UUID (set after first push)
  lastSyncedAt?: string;      // ISO 8601
  yjsVersion?: number;        // Cloud Yjs version
  yjsStateB64?: string;       // Yjs binary state
  version: number;            // Optimistic locking
  
  // === CONFLICT RESOLUTION ===
  conflictData?: {
    localUpdatedAt: string;
    cloudUpdatedAt: string;
    localContent?: string;
    cloudContent?: string;
  };
}
```

### Workspace (Updated)

```typescript
interface Workspace {
  id: string;
  name: string;
  icon: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // === SYNC FIELDS ===
  syncMode: 'local' | 'cloud';  // NEW!
  syncStatus: 'local' | 'synced' | 'syncing' | 'conflict';
  cloudId?: string;             // Backend UUID
  lastSyncedAt?: string;
  version: number;
  
  // === OWNER INFO ===
  ownerId?: string;             // For cloud workspaces
  isShared?: boolean;           // If shared with current user
}
```

---

## 🔧 Implementation Components

### 1. SyncModeService (NEW)

```typescript
// frontend/src/services/sync/SyncModeService.ts

class SyncModeService {
  /**
   * Enable cloud sync for a document
   * - Pushes to backend
   * - Sets syncMode to 'cloud-enabled'
   * - Registers for auto-sync
   */
  async enableCloudSync(documentId: string): Promise<void>;
  
  /**
   * Disable cloud sync (make local-only)
   * - Removes from auto-sync queue
   * - Optionally deletes from cloud
   */
  async disableCloudSync(documentId: string, deleteFromCloud?: boolean): Promise<void>;
  
  /**
   * Check if document should auto-sync
   */
  shouldAutoSync(document: DocumentMeta): boolean;
  
  /**
   * Get all cloud-enabled documents that need sync
   */
  async getPendingSyncDocuments(): Promise<DocumentMeta[]>;
}
```

### 2. AutoSyncManager (NEW)

```typescript
// frontend/src/services/sync/AutoSyncManager.ts

class AutoSyncManager {
  private syncQueue: Map<string, SyncQueueItem>;
  private isOnline: boolean;
  private syncInProgress: boolean;
  
  /**
   * Initialize auto-sync listeners
   * - Network status changes
   * - Document changes (debounced)
   * - App visibility changes
   */
  init(): void;
  
  /**
   * Called when document is modified
   * - Only queues if syncMode === 'cloud-enabled'
   */
  onDocumentModified(documentId: string): void;
  
  /**
   * Called when network comes online
   * - Processes all pending syncs
   */
  onNetworkOnline(): void;
  
  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void>;
  
  /**
   * Sync a single document
   */
  private async syncDocument(documentId: string): Promise<SyncResult>;
}
```

### 3. NetworkStatusService (NEW)

```typescript
// frontend/src/services/sync/NetworkStatusService.ts

class NetworkStatusService {
  private listeners: Set<(online: boolean) => void>;
  
  /**
   * Initialize network listeners
   */
  init(): void;
  
  /**
   * Current network status
   */
  isOnline(): boolean;
  
  /**
   * Subscribe to network changes
   */
  onStatusChange(callback: (online: boolean) => void): () => void;
}
```

### 4. UI Components

#### SyncToggle (Per Document)

```tsx
// In document toolbar or sidebar
<SyncToggle
  document={document}
  onEnable={() => syncModeService.enableCloudSync(doc.id)}
  onDisable={() => syncModeService.disableCloudSync(doc.id)}
/>

// Displays:
// - Cloud icon (synced)
// - Local icon (local-only)
// - Spinning icon (syncing)
// - Warning icon (conflict/error)
```

#### SyncStatusBadge (In Sidebar)

```tsx
// Next to document title in sidebar
<SyncStatusBadge status={document.syncStatus} mode={document.syncMode} />

// Visual states:
// 🔵 Local only
// ☁️ Cloud synced
// 🔄 Syncing...
// ⚠️ Needs attention
```

#### BulkSyncModal

```tsx
// When user logs in with local documents
<BulkSyncModal
  localDocuments={unsynced}
  onSyncAll={() => ...}
  onSyncSelected={(ids) => ...}
  onKeepLocal={() => ...}
/>
```

---

## 🔀 Event Flow

### On Document Edit (Cloud-Enabled)

```
User types
  ↓
TipTap onChange
  ↓
Yjs document updated
  ↓
IndexedDB persisted (immediate)
  ↓
AutoSyncManager.onDocumentModified() (debounced 2s)
  ↓
If online: push to backend
If offline: queue for later
  ↓
Update syncStatus
```

### On Network Recovery

```
navigator.onLine → true
  ↓
NetworkStatusService emits 'online'
  ↓
AutoSyncManager.onNetworkOnline()
  ↓
Get all docs with syncMode='cloud-enabled' AND syncStatus='modified'
  ↓
Process sync queue
  ↓
Update each doc's syncStatus
  ↓
Emit 'batch-sync-complete' event
```

### On Enable Cloud Sync

```
User clicks "Enable Cloud Sync"
  ↓
SyncModeService.enableCloudSync()
  ↓
Set syncMode = 'pending-sync'
  ↓
SelectiveSyncService.pushDocument()
  ↓
Backend returns cloudId
  ↓
Set cloudId, syncMode = 'cloud-enabled', syncStatus = 'synced'
  ↓
Register with AutoSyncManager
```

---

## 🗄️ IndexedDB Schema Updates

```typescript
// frontend/src/db/offlineDb.ts

// Add syncMode to documents table
documents: '++id, workspaceId, folderId, title, syncMode, syncStatus, cloudId'

// Add index for quick sync queries
'[syncMode+syncStatus]'  // Find all cloud-enabled + modified
```

---

## 🧪 Test Cases

### Unit Tests

1. `SyncModeService.enableCloudSync()` sets correct fields
2. `AutoSyncManager` queues modified cloud-enabled docs
3. `AutoSyncManager` ignores local-only docs
4. `NetworkStatusService` detects online/offline correctly
5. Conflict detection when cloud version differs

### Integration Tests

1. Full flow: create → enable sync → edit offline → come online → verify synced
2. Bulk sync on login
3. Disable sync removes from queue
4. Conflict resolution UI appears when needed

### E2E Tests

1. Two users edit same document → changes merge
2. User goes offline, edits, comes online → changes persist
3. New document created while offline → syncs on reconnect

---

## 📅 Implementation Order

### Phase 1: Core Infrastructure (Day 1)
- [ ] Add `syncMode` field to types
- [ ] Create `SyncModeService`
- [ ] Create `NetworkStatusService`
- [ ] Update IndexedDB schema

### Phase 2: Auto-Sync Logic (Day 1-2)
- [ ] Create `AutoSyncManager`
- [ ] Hook into document edit events
- [ ] Implement sync queue processing
- [ ] Handle network status changes

### Phase 3: UI Components (Day 2)
- [ ] `SyncToggle` component
- [ ] `SyncStatusBadge` component
- [ ] Update sidebar to show sync status
- [ ] Add "Enable Cloud Sync" button to toolbar

### Phase 4: Workspace Sync (Day 3)
- [ ] Workspace sync mode logic
- [ ] "Upgrade workspace to cloud" flow
- [ ] Bulk document sync within workspace

### Phase 5: Testing & Polish (Day 3)
- [ ] Unit tests for all services
- [ ] Integration tests for flows
- [ ] Error handling & retry logic
- [ ] UI polish & animations

---

## 🚀 Quick Start Implementation

Start with these files in order:

1. `frontend/src/services/sync/NetworkStatusService.ts`
2. `frontend/src/services/sync/SyncModeService.ts`  
3. `frontend/src/services/sync/AutoSyncManager.ts`
4. Update `frontend/src/services/workspace/types.ts` (add syncMode)
5. `frontend/src/components/sync/SyncToggle.tsx`
6. `frontend/src/components/sync/SyncStatusBadge.tsx`

---

## 📝 Migration Plan

For existing documents without `syncMode`:

```typescript
// On app startup or schema migration
const migrateDocuments = async () => {
  const docs = await db.documents.toArray();
  
  for (const doc of docs) {
    if (!doc.syncMode) {
      // If has cloudId, it was synced before → cloud-enabled
      // If no cloudId, it's local-only
      doc.syncMode = doc.cloudId ? 'cloud-enabled' : 'local-only';
      await db.documents.put(doc);
    }
  }
};
```

---

*Created: December 28, 2025*
*Status: Design Complete - Ready for Implementation*


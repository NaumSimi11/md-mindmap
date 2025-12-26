# 🔄 Shared State Audit

**Date**: December 26, 2025  
**Scope**: Full-stack MDReader application  
**Focus**: Shared/mutable state ownership, writers, readers, and coordination problems

---

## Executive Summary

This audit identifies **45+ shared state locations** across the codebase. The most critical problems involve:

- **localStorage** used by 7 different services with no coordination
- **50 module-level singletons** with internal mutable state
- **3 IndexedDB databases** accessed by multiple services
- **No cleanup on logout** for most shared state

---

## 🗃️ State Inventory

### A. Browser Storage (localStorage / sessionStorage)

| Key | Owner | Writers | Readers | Coordination? |
|-----|-------|---------|---------|---------------|
| `auth_token` | `ApiClient` | `ApiClient.setToken()`, `AuthService.login()` | `ApiClient`, `AuthService`, `YjsDocumentManager` | ❌ No |
| `refresh_token` | `AuthService` | `AuthService.login()`, `AuthService.signup()`, `AuthService.refreshToken()` | `ApiClient.refreshToken()` | ❌ No |
| `user` | `AuthService` | `AuthService.login()`, `AuthService.signup()`, `AuthService.getCurrentUser()` | `AuthService.getStoredUser()` | ❌ No |
| `mdreader:last-workspace-id` | `WorkspaceDataContext` | `WorkspaceDataContext` (5 locations) | `WorkspaceDataContext`, `BackendWorkspaceService` | ⚠️ Partial |
| `mdreader:snapshot:*` | `YjsHydrationService` | `YjsHydrationService.snapshotBeforeReload()` | None (debugging only) | ✅ Single writer |
| `presentation-session` | Deprecated | `Workspace.tsx` clears | None | ✅ Cleanup only |
| `share_token` | `GuestAccessHandler` | `GuestAccessHandler` | `YjsDocumentManager` | ⚠️ sessionStorage |
| `share_mode` | `GuestAccessHandler` | `GuestAccessHandler` | Unknown | ⚠️ Undocumented |
| `document_id` | `GuestAccessHandler` | `GuestAccessHandler` | Unknown | ⚠️ Undocumented |

---

### B. IndexedDB Databases

| Database Name | Owner | Writers | Readers | Coordination? |
|---------------|-------|---------|---------|---------------|
| `MDReaderGuest` | `GuestWorkspaceService` | `guestWorkspaceService` only | `guestWorkspaceService`, `DocumentDataContext`, `SelectiveSyncService`, `BatchSyncService` | ❌ No locking |
| `MDReaderBackendCache` | `BackendWorkspaceService` | `backendWorkspaceService` only | `backendWorkspaceService`, `DocumentDataContext` | ❌ No locking |
| `MDReaderWorkspaceMappings` | `SelectiveSyncService` | `selectiveSyncService` only | `selectiveSyncService`, `DocumentDataContext` | ✅ Single service |
| `MDReaderDocumentMappings` | `SelectiveSyncService` | `selectiveSyncService` only | `selectiveSyncService` | ✅ Single service |
| `mdreader-{documentId}` | `YjsDocumentManager` | `y-indexeddb` provider | Yjs, `yjsDocumentManager` | ✅ CRDT handles |
| `MDReaderOffline` | `OfflineDatabase` | `offlineDB`, `SyncManager` | `offlineDB`, `SyncManager`, `useAuth` | ⚠️ Deprecated |

---

### C. Module-Level Singletons (50 total)

#### Critical Services (High Impact)

| Singleton | File | Internal State | Cleanup on Logout? |
|-----------|------|----------------|-------------------|
| `apiClient` | `ApiClient.ts` | `token`, `refreshPromise` | ❌ No |
| `authService` | `AuthService.ts` | None (stateless) | N/A |
| `yjsDocumentManager` | `YjsDocumentManager.ts` | `documents: Map`, `cleanupInterval` | ❌ No |
| `backendWorkspaceService` | `BackendWorkspaceService.ts` | `currentWorkspaceId`, `isInitialized`, `isOnline` | ❌ No |
| `guestWorkspaceService` | `GuestWorkspaceService.ts` | IndexedDB connection | ❌ No |
| `selectiveSyncService` | `SelectiveSyncService.ts` | Mapping databases | ❌ No |
| `batchSyncService` | `BatchSyncService.ts` | `progressCallback` | ❌ No |
| `syncManager` | `SyncManager.ts` | Many (deprecated) | ❌ No |

#### Secondary Services

| Singleton | File | Internal State |
|-----------|------|----------------|
| `yjsHydrationService` | `YjsHydrationService.ts` | None (stateless) |
| `documentService` | `DocumentService.ts` | None (stateless) |
| `workspaceService` | `WorkspaceService.ts` | None (stateless) |
| `folderService` | `FolderService.ts` | None (stateless) |
| `offlineDB` | `OfflineDatabase.ts` | IndexedDB connection |
| `syncNotificationService` | `SyncNotificationService.ts` | `listeners`, `activeNotifications` |
| `fileWatcherService` | `FileWatcherService.ts` | `watchers: Map`, `subscribers` |
| `templateService` | `TemplateService.ts` | `templates` cache |
| `aiService` | `AIService.ts` | `conversationHistory`, `config` |
| `sessionService` | `EditorStudioSession.ts` | `sessions: Map` |
| `presentationGenerator` | `PresentationGenerator.ts` | None |
| `storageService` | `StorageService.ts` | `currentProvider` |

---

## 🔴 CRITICAL ISSUES

### 1. `localStorage['auth_token']` - Multiple Writers, No Coordination

**State Location**: `localStorage.getItem('auth_token')`

**Writers**:
1. `ApiClient.setToken()` (line 28-31)
2. `AuthService.login()` → calls `apiClient.setToken()`
3. `AuthService.signup()` → calls `apiClient.setToken()`

**Readers** (13 locations):
1. `ApiClient.loadToken()` - constructor
2. `ApiClient.getHeaders()` - every API call
3. `AuthService.isAuthenticated()` - 13 call sites across codebase
4. `YjsDocumentManager.getDocument()` - WebSocket auth

**Problem**: 
```typescript
// ApiClient.ts - reads token on construction
constructor() {
  this.loadToken();  // ❌ Token read once, cached in this.token
}

// Later, after login:
setToken(token: string) {
  this.token = token;  // ✅ Updates internal cache
  localStorage.setItem('auth_token', token);  // ✅ Updates storage
}

// But YjsDocumentManager reads directly from localStorage:
const authToken = localStorage.getItem('auth_token');  // ❌ May get stale value
```

**Race Condition Scenario**:
1. User logs in
2. `AuthService.login()` calls `apiClient.setToken()`
3. `ApiClient` updates internal `this.token`
4. Meanwhile, `YjsDocumentManager.getDocument()` reads `localStorage` directly
5. If timing is wrong, WebSocket connects with no token

---

### 2. `YjsDocumentManager.documents` - Map Mutated Without Coordination

**State Location**: `this.documents: Map<string, YjsDocumentInstance>`

**Owner**: `YjsDocumentManager` singleton

**Writers**:
| Method | Mutation |
|--------|----------|
| `getDocument()` | `refCount++`, `this.documents.set()` |
| `releaseDocument()` | `refCount--`, `this.documents.delete()` |
| `destroyDocument()` | `this.documents.delete()` |
| `cleanupUnusedDocuments()` | Iterates and deletes |
| `clearDocumentStorage()` | `this.documents.delete()` |

**Readers**:
| Location | Access |
|----------|--------|
| `getDocument()` | `this.documents.has()`, `this.documents.get()` |
| `getDocumentInstance()` | `this.documents.get()` |
| `getDocumentInfo()` | `this.documents.get()` |
| `hasDocument()` | `this.documents.has()` |
| `cleanupUnusedDocuments()` | Iterates `this.documents` |

**Problem**: No mutex or coordination:
```typescript
// Cleanup timer runs every 60 seconds
private cleanupUnusedDocuments() {
  for (const [documentId, instance] of this.documents.entries()) {
    if (instance.refCount === 0) {
      toDestroy.push(documentId);  // ❌ Could be acquired between check and destroy
    }
  }
  for (const id of toDestroy) {
    this.destroyDocument(id);  // ❌ Race with concurrent getDocument()
  }
}

// Meanwhile, component calls:
const instance = yjsDocumentManager.getDocument(documentId);  // ❌ May get destroyed
```

---

### 3. `BackendWorkspaceService` - Multiple Internal State Fields

**State Fields**:
```typescript
class BackendWorkspaceService {
  private currentWorkspaceId: string | null = null;  // ❌ Mutable
  private isInitialized = false;  // ❌ Mutable
  private isOnline = navigator.onLine;  // ❌ Mutable
}
```

**Writers**:
| Field | Writers |
|-------|---------|
| `currentWorkspaceId` | `init()`, `setCurrentWorkspace()`, `switchWorkspace()`, `createWorkspace()` |
| `isInitialized` | `init()` |
| `isOnline` | Constructor event listeners |

**Readers**:
| Field | Readers |
|-------|---------|
| `currentWorkspaceId` | `getCurrentWorkspace()`, `getCurrentWorkspaceId()`, `getDocuments()`, many more |
| `isInitialized` | `init()` (early return) |
| `isOnline` | `init()`, `syncWorkspaces()`, `getDocument()`, many more |

**Problem**: No synchronization between callers:
```typescript
// Component A calls:
await backendWorkspaceService.switchWorkspace(workspaceA);

// Component B simultaneously calls:
const docs = await backendWorkspaceService.getDocuments(currentWorkspaceId);
// ❌ May get docs from old workspace if switchWorkspace hasn't updated currentWorkspaceId
```

---

### 4. React Context State - Multiple Writers via Events

**State**: `DocumentDataContext.documents`

**Writers**:
1. `refreshDocuments()` - main loader
2. `createDocument()` - adds new doc
3. `updateDocument()` - modifies existing
4. `deleteDocument()` - removes doc
5. Event handler for `document:synced` - updates on sync
6. Event handler for `document-batch-synced` - triggers refresh

**Problem**: State can be updated from multiple sources simultaneously:
```typescript
// Effect 1: Listens for document sync
useEffect(() => {
  window.addEventListener('document:synced', (e) => {
    setDocuments(prev => {
      // ❌ Merging based on stale prev if refreshDocuments() running
    });
  });
}, []);

// Effect 2: Auto-refresh on workspace change
useEffect(() => {
  refreshDocuments();  // ❌ May conflict with event handlers
}, [currentWorkspace]);
```

---

### 5. No State Cleanup on Logout

**Problem**: When user logs out, these singletons retain previous user's data:

| Singleton | State Retained | Security Impact |
|-----------|----------------|-----------------|
| `yjsDocumentManager` | `documents: Map` with loaded Yjs docs | Previous user's docs visible |
| `backendWorkspaceService` | `currentWorkspaceId`, cached workspaces | Previous user's workspace info |
| `selectiveSyncService` | ID mappings | Previous user's cloud IDs |
| `aiService` | `conversationHistory` | Previous user's AI chat |
| `sessionService` | `sessions: Map` | Previous user's editor sessions |

**Current Logout Flow**:
```typescript
// useAuth.ts
const logout = useCallback(async () => {
  window.dispatchEvent(new CustomEvent('auth:logout'));  // ✅ Event dispatched
  await authService.logout();  // ✅ Clears localStorage
  setUser(null);  // ✅ Clears React state
  // ❌ MISSING: Clear singleton state!
}, []);
```

**No listeners found** for `auth:logout` that clean up singletons.

---

## 🟠 HIGH SEVERITY

### 6. IndexedDB - Multiple Services, No Transaction Coordination

**Database**: `MDReaderGuest`

**Concurrent Writers**:
1. `guestWorkspaceService.createDocument()`
2. `guestWorkspaceService.updateDocument()`
3. `SelectiveSyncService.pushDocument()` → updates syncStatus
4. `BatchSyncService` → bulk updates

**Problem**: Dexie doesn't prevent concurrent modifications:
```typescript
// Service A:
const doc = await db.documents.get(id);
doc.syncStatus = 'syncing';
await db.documents.put(doc);

// Service B (simultaneously):
const doc = await db.documents.get(id);
doc.title = 'New Title';
await db.documents.put(doc);  // ❌ Overwrites syncStatus change!
```

---

### 7. `apiClient.token` vs `localStorage['auth_token']` - Dual Source of Truth

**Problem**: Token stored in two places:

```typescript
class ApiClient {
  private token: string | null = null;  // In-memory cache
  
  setToken(token: string) {
    this.token = token;  // ✅ Update cache
    localStorage.setItem('auth_token', token);  // ✅ Update storage
  }
  
  private loadToken() {
    this.token = localStorage.getItem('auth_token');  // ✅ Load from storage
  }
}
```

**But**: `YjsDocumentManager` reads directly from `localStorage`:
```typescript
const authToken = localStorage.getItem('auth_token');  // ❌ Bypasses ApiClient
```

**What Breaks**: If someone calls `apiClient.clearToken()` without `localStorage.removeItem()`, WebSocket would still have old token.

---

### 8. `useEditorStore` (Zustand) - Global UI State

**State**: 30+ UI state fields in Zustand store

**Writers**: 40+ setter methods

**Problem**: No ownership boundaries:
```typescript
// Any component can call:
useEditorStore.getState().setDocumentTitle('New Title');
useEditorStore.getState().setMarkdownContent('...');

// Including components that shouldn't modify document state
```

**Recommendation**: Split into focused stores:
- `useDocumentEditorStore` - document content
- `useUIStore` - modals, menus
- `useAIStore` - AI state

---

## 🟡 MEDIUM SEVERITY

### 9. `SyncContext` - State Updated by Multiple Effects

**State Fields**:
- `shouldUseBackendService`
- `isBackendInitialized`
- `initCounter`

**Writers**:
1. Effect 1: Sets `shouldUseBackendService` based on auth
2. Effect 2: Sets `isBackendInitialized` after init
3. Effect 3: Sets `initCounter` on login event

**Problem**: Interleaved updates:
```
Timeline:
  [Effect 1] setShouldUseBackendService(true)
  [Effect 3] setInitCounter(1)
  [Effect 2] (waiting for async init)
  [Effect 3] setInitCounter(2)  // Another login event?
  [Effect 2] setIsBackendInitialized(true)
  // State: initCounter=2 but only initialized once
```

---

### 10. `aiService.conversationHistory` - No Clear Ownership

**State**: `private conversationHistory: AIMessage[] = [];`

**Writers**:
- `sendMessage()` - appends messages
- `clearHistory()` - clears array

**Readers**:
- `sendMessage()` - includes in context
- `getHistory()` - returns copy

**Problem**: History never cleared between documents:
```typescript
// User edits Document A
aiService.sendMessage('Summarize this document');  // Adds to history

// User switches to Document B
aiService.sendMessage('What is this about?');
// ❌ History still contains Document A context!
```

---

## 📋 State Ownership Matrix

### Clear Ownership ✅

| State | Owner | Pattern |
|-------|-------|---------|
| Yjs CRDT content | `y-indexeddb` + Hocuspocus | CRDT coordination |
| Auth tokens | `AuthService` | Single service |
| Workspace mappings | `SelectiveSyncService` | Single service |

### Unclear Ownership ❌

| State | Problem |
|-------|---------|
| `auth_token` in localStorage | Read by multiple services directly |
| `currentWorkspaceId` | Set by multiple methods, read everywhere |
| Document list | Updated by contexts, events, and services |
| User session data | Mixed between React state and localStorage |

---

## 🛠️ Recommendations

### Immediate Actions

1. **Add logout cleanup**:
```typescript
// Create cleanup registry
const cleanupOnLogout: (() => void)[] = [];

// Each singleton registers:
cleanupOnLogout.push(() => yjsDocumentManager.destroyAll());
cleanupOnLogout.push(() => backendWorkspaceService.reset());

// On logout:
window.addEventListener('auth:logout', () => {
  cleanupOnLogout.forEach(fn => fn());
});
```

2. **Centralize localStorage access**:
```typescript
// @/services/storage/AuthStorage.ts
class AuthStorage {
  private static instance: AuthStorage;
  private token: string | null = null;
  
  getToken(): string | null {
    return this.token;
  }
  
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.notifyListeners();
  }
  
  onTokenChange(callback: (token: string | null) => void): void {
    // ...
  }
}
```

3. **Add mutex for YjsDocumentManager**:
```typescript
private documentLocks = new Map<string, Promise<void>>();

async getDocument(id: string): Promise<YjsDocumentInstance> {
  // Wait for any pending operations on this document
  await this.documentLocks.get(id);
  
  const lock = this.doGetDocument(id);
  this.documentLocks.set(id, lock.then(() => {}));
  
  return lock;
}
```

### Medium-Term Actions

4. **Split Zustand store** into focused stores with clear ownership

5. **Add IndexedDB transaction wrappers**:
```typescript
async updateDocument(id: string, updates: Partial<Doc>): Promise<Doc> {
  return db.transaction('rw', db.documents, async () => {
    const doc = await db.documents.get(id);
    const updated = { ...doc, ...updates };
    await db.documents.put(updated);
    return updated;
  });
}
```

6. **Document state contracts**:
```typescript
/**
 * @owner BackendWorkspaceService
 * @writers init(), switchWorkspace()
 * @readers getCurrentWorkspace(), getDocuments()
 * @invariant Only one workspace is "current" at a time
 */
private currentWorkspaceId: string | null = null;
```

---

## Appendix: Complete Singleton List

<details>
<summary>All 50 Exported Singletons</summary>

| Singleton | File | Has Mutable State |
|-----------|------|-------------------|
| `selectiveSyncService` | SelectiveSyncService.ts | ✅ |
| `batchSyncService` | BatchSyncService.ts | ✅ |
| `backendWorkspaceService` | BackendWorkspaceService.ts | ✅ |
| `yjsDocumentManager` | YjsDocumentManager.ts | ✅ |
| `yjsHydrationService` | YjsHydrationService.ts | ❌ |
| `apiClient` | ApiClient.ts | ✅ |
| `documentService` | DocumentService.ts | ❌ |
| `syncNotificationService` | SyncNotificationService.ts | ✅ |
| `offlineDB` | OfflineDatabase.ts | ✅ |
| `authService` | AuthService.ts | ❌ |
| `fileWatcherService` | FileWatcherService.ts | ✅ |
| `guestWorkspaceService` | GuestWorkspaceService.ts | ✅ |
| `workspaceService` | WorkspaceService.ts | ❌ |
| `documentExportService` | DocumentExportService.ts | ❌ |
| `toolExecutor` | ToolExecutor.ts | ❌ |
| `syncManager` | SyncManager.ts | ✅ (deprecated) |
| `folderService` | FolderService.ts | ❌ |
| `guestVersionManager` | GuestVersionManager.ts | ✅ |
| `tauriWorkspaceService` | TauriWorkspaceService.ts | ✅ |
| `workspaceInitializer` | WorkspaceInitializer.ts | ✅ |
| `documentVersionService` | DocumentVersionService.ts | ❌ |
| `mdFileAnalyzerService` | MDFileAnalyzerService.ts | ❌ |
| `sessionService` | EditorStudioSession.ts | ✅ |
| `templateService` | TemplateService.ts | ✅ |
| `md` | markdownConversion.ts | ❌ |
| `turndownService` | markdownConversion.ts | ❌ |
| `aiService` | AIService.ts | ✅ |
| `unsplashService` | UnsplashService.ts | ❌ |
| `safePresentationService` | SafePresentationService.ts | ❌ |
| `presentationGenerator` | PresentationGenerator.ts | ❌ |
| `storageService` | StorageService.ts | ✅ |
| `documentTemplates_service` | DocumentTemplates.ts | ❌ |
| `contentAnalyzer` | ContentAnalyzer.ts | ❌ |
| `suggestionDetector` | SuggestionDetector.ts | ❌ |
| `actionHistoryManager` | ActionHistoryManager.ts | ✅ |
| `chatContextManager` | ChatContextManager.ts | ✅ |
| `mindmapAIService` | MindmapAIService.ts | ❌ |
| `mindmapTemplateService` | MindmapTemplates.ts | ❌ |
| `forceLayout` | ForceLayout.ts | ❌ |
| `mindmapQualityAnalyzer` | MindmapQualityAnalyzer.ts | ❌ |
| `mindmapExporter` | MindmapExporter.ts | ❌ |
| `treeVerticalLayout` | TreeLayout.ts | ❌ |
| `treeHorizontalLayout` | TreeLayout.ts | ❌ |
| `radialLayout` | RadialLayout.ts | ❌ |
| `layoutEngine` | LayoutEngine.ts | ❌ |

</details>


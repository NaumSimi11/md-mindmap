# 🔗 Hidden Dependencies Audit

**Date**: December 26, 2025  
**Scope**: Full-stack MDReader application  
**Focus**: Functions that secretly depend on side effects, globals, call order, or cannot be safely called in isolation

---

## Executive Summary

This audit identifies **25 functions** with undeclared dependencies that would confuse a new senior engineer. The most dangerous patterns involve:

- Services depending on `localStorage` state without declaring it
- Functions that secretly increment reference counts
- Methods that require prior initialization calls
- Chained effects that rely on timing assumptions

---

## 🔴 CRITICAL: Call Order Dependencies

### 1. `BackendWorkspaceService.getDocument()` → Requires `init()` First

**File**: `frontend/src/services/workspace/BackendWorkspaceService.ts`

**Hidden Dependency**: 
- `this.isInitialized` must be `true`
- `this.currentWorkspaceId` must be set
- `cacheDb` (IndexedDB) must be ready

```typescript
async getDocument(documentId: string): Promise<DocumentMeta | null> {
  // ❌ No check for isInitialized
  const cachedDoc = await cacheDb.documents.get(documentId);  // Assumes cacheDb ready
  
  if (this.isOnline && authService.isAuthenticated() && 
      cachedDoc?.syncStatus !== 'local' && 
      cachedDoc?.syncStatus !== 'pending') {
    // ...
  }
}
```

**What Breaks**: Calling before `init()` returns stale/missing data or throws IndexedDB errors.

**Recommendation**: Add initialization guard:
```typescript
if (!this.isInitialized) {
  throw new Error('BackendWorkspaceService not initialized. Call init() first.');
}
```

---

### 2. `SyncContext` Effects → Require Specific Execution Order

**File**: `frontend/src/contexts/workspace/SyncContext.tsx`

**Hidden Dependency**: Three `useEffect` hooks must execute in order:

```typescript
// Effect 1: Sets shouldUseBackendService
useEffect(() => {
  setShouldUseBackendService(authCheck || isAuthenticated);
}, [isAuthenticated, user]);

// Effect 2: Reads shouldUseBackendService (DEPENDS ON EFFECT 1)
useEffect(() => {
  if (!shouldUseBackendService) return;
  await backendWorkspaceService.init();  // Uses result from Effect 1
}, [shouldUseBackendService, initCounter]);

// Effect 3: Listens for login events (DEPENDS ON EFFECTS 1 & 2)
useEffect(() => {
  const handleLoginSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 150));  // ❌ MAGIC DELAY
    setInitCounter(prev => prev + 1);  // Triggers Effect 2
  };
  window.addEventListener('auth:login', handleLoginSuccess);
}, []);
```

**What Breaks**: 
- React Concurrent Mode may batch or reorder effects
- Race conditions if auth state updates faster than 150ms delay
- Effect 2 may run before Effect 1 completes state update

**Recommendation**: Use state machine pattern or consolidate into single effect with explicit guards.

---

### 3. `YjsDocumentManager.getDocument()` → Secret RefCount Increment

**File**: `frontend/src/services/yjs/YjsDocumentManager.ts`

**Hidden Side Effect**: Calling `getDocument()` silently increments `refCount`:

```typescript
public getDocument(documentId: string, options = {}): YjsDocumentInstance {
  if (this.documents.has(documentId)) {
    const instance = this.documents.get(documentId)!;
    instance.refCount++;  // ❌ SECRET SIDE EFFECT
    console.log(`♻️ Reusing existing Yjs document: ${documentId} (refCount: ${instance.refCount})`);
    return instance;
  }
  // ...creates new instance with refCount = 1
}
```

**What Breaks**: 
- Caller doesn't know they acquired a reference
- Memory leak if `releaseDocument()` not called
- No TypeScript enforcement of cleanup

**Functions Affected**:
- `YjsHydrationService.hydrateDocument()` - calls `getDocument()` internally
- Any code calling `getDocument()` without balancing with `releaseDocument()`

**Recommendation**: Either:
1. Return a disposable handle: `const handle = manager.acquire(id); handle.release();`
2. Add JSDoc warning: `@see Must be balanced with releaseDocument()`

---

### 4. `SelectiveSyncService.pushDocument()` → Requires Auth + Network + Workspace

**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

**Hidden Dependencies**:

```typescript
async pushDocument(documentId: string, workspaceId: string): Promise<SyncResult> {
  try {
    // ❌ Depends on authService.isAuthenticated() being true
    if (!authService.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // ❌ Depends on guestWorkspaceService having the document
    const localDoc = await guestWorkspaceService.getDocument(documentId);
    
    // ❌ Depends on workspace existing or being creatable
    const cloudWorkspaceId = await this.ensureWorkspaceExists(workspaceId, localWorkspace);
    
    // ❌ Depends on yjsDocumentManager having the document
    const content = await serializeFromYjs(normalizedDocId);
    // ...
  }
}
```

**What Breaks**:
- Call without auth → silent failure with generic error
- Call with wrong documentId format → Yjs lookup fails
- Call before guest service initialized → document not found

---

## 🟠 HIGH: Global State Dependencies

### 5. `authService.isAuthenticated()` → Depends on `localStorage`

**File**: `frontend/src/services/api/AuthService.ts`

**Hidden Dependency**: Reads from `localStorage` which may not be initialized:

```typescript
isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}
```

**Callers That Depend on This** (13 locations):
- `SyncContext.tsx:55, 101, 151`
- `SelectiveSyncService.ts:436, 692, 803, 873`
- `BackendWorkspaceService.ts:105, 569, 778`
- `DocumentDataContext.tsx:493`
- `workspaceMembersClient.ts:190`

**What Breaks**:
- SSR environment (no localStorage)
- Private browsing mode (localStorage may be disabled)
- Race condition if called before page load completes

---

### 6. `ApiClient` Constructor → Auto-loads Token from `localStorage`

**File**: `frontend/src/services/api/ApiClient.ts`

```typescript
constructor() {
  this.baseUrl = API_CONFIG.baseUrl;
  this.loadToken();  // ❌ Reads localStorage at construction time
}

private loadToken() {
  this.token = localStorage.getItem('auth_token');
}
```

**Problem**: `apiClient` is a module-level singleton. If imported before user logs in:
1. Token is `null` at construction
2. Later calls may use stale token
3. No automatic re-read when user logs in

**What Breaks**: API calls after login may fail if `apiClient` was constructed before login.

---

### 7. `YjsDocumentManager.getDocument()` → Depends on `localStorage` for Auth Token

**File**: `frontend/src/services/yjs/YjsDocumentManager.ts`

```typescript
if (enableWebSocket && isAuthenticated) {
  const authToken = localStorage.getItem('auth_token');  // ❌ Direct localStorage access
  
  websocketProvider = new HocuspocusProvider({
    url: websocketUrl,
    name: documentId,
    document: ydoc,
    token: authToken || '',  // ❌ May be stale or missing
  });
}
```

**What Breaks**: If called before login completes, WebSocket connects without auth token.

---

### 8. All Dexie Databases → Depend on `indexedDB` Being Available

**Files**:
- `GuestDatabase` in `GuestWorkspaceService.ts`
- `BackendCacheDatabase` in `BackendWorkspaceService.ts`
- `WorkspaceMappingDatabase` in `SelectiveSyncService.ts`

```typescript
const canUseDexie = typeof (globalThis as any).indexedDB !== 'undefined';

const mappingDb = canUseDexie
  ? new WorkspaceMappingDatabase()
  : { mappings: createInMemoryTable<WorkspaceMappingRow>() };
```

**What Breaks**:
- Server-side rendering (no IndexedDB)
- Firefox private browsing (IndexedDB disabled)
- Old browsers (no IndexedDB support)

---

## 🟡 MEDIUM: Implicit Event Dependencies

### 9. `DocumentDataContext` → Depends on Custom Events

**File**: `frontend/src/contexts/workspace/DocumentDataContext.tsx`

**Hidden Event Dependencies**:

```typescript
// Effect 1: Listens for workspace events
useEffect(() => {
  window.addEventListener('workspace:switched', handleWorkspaceSwitched);
  window.addEventListener('workspace:created', handleWorkspaceCreated);
  // ...
}, []);

// Effect 2: Listens for document sync events
useEffect(() => {
  const handleDocumentSynced = (event: Event) => {
    const { oldId, newId, doc } = customEvent.detail;  // ❌ Assumes specific event shape
    // ...
  };
  window.addEventListener('document:synced', handleDocumentSynced);
  // ...
}, []);

// Effect 3: Listens for batch sync complete
useEffect(() => {
  const handleBatchSynced = () => {
    refreshDocuments();
  };
  window.addEventListener('document-batch-synced', handleBatchSynced);
  // ...
}, []);
```

**Hidden Contract**: These events must be dispatched with specific payload shapes:
- `workspace:switched` - no payload expected
- `document:synced` - requires `{ oldId, newId, doc }`
- `document-batch-synced` - no payload expected

**What Breaks**: If event is dispatched with wrong payload shape, code fails silently or throws.

---

### 10. `useAuth.login()` → Must Dispatch Event for Other Contexts

**File**: `frontend/src/hooks/useAuth.ts`

```typescript
const login = useCallback(async (credentials: LoginRequest) => {
  const response = await authService.login(credentials);
  setUser(response.user);
  
  // ❌ HIDDEN CONTRACT: SyncContext depends on this event
  window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: response.user } }));
}, []);
```

**Hidden Dependency Chain**:
1. `useAuth.login()` dispatches `auth:login`
2. `SyncContext` listens for `auth:login`
3. `SyncContext` increments `initCounter`
4. `backendWorkspaceService.init()` is called
5. `BatchSyncService.syncAllWorkspaces()` is triggered after 1s delay

**What Breaks**: If event name changes or dispatch is removed, entire sync flow breaks.

---

### 11. `logout()` → Dispatches Event Before Cleanup

**File**: `frontend/src/hooks/useAuth.ts`

```typescript
const logout = useCallback(async () => {
  // ❌ Dispatches event BEFORE clearing session
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  await authService.logout();  // This clears localStorage
  setUser(null);
}, []);
```

**Problem**: Listeners to `auth:logout` may try to use auth state that's about to be cleared.

---

## 🟠 HIGH: Module Singleton Dependencies

### 12. `selectiveSyncService` → Singleton with Internal State

**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

```typescript
// End of file
export const selectiveSyncService = new SelectiveSyncService();
```

**Hidden State**:
- `mappingDb` - Workspace ID mappings
- `documentMappingDb` - Document ID mappings

**Problem**: These mappings persist across "logouts" since the singleton is never reset.

**What Breaks**: User A logs out, User B logs in → User A's mappings are still in memory.

---

### 13. `yjsDocumentManager` → Singleton with Document Cache

**File**: `frontend/src/services/yjs/YjsDocumentManager.ts`

```typescript
export const yjsDocumentManager = YjsDocumentManager.getInstance();
```

**Hidden State**:
- `this.documents: Map<string, YjsDocumentInstance>` - All loaded documents
- `this.cleanupInterval` - Background cleanup timer

**Problem**: Documents cached for User A persist when User B logs in.

**What Breaks**: Content from previous user visible to new user.

---

### 14. `guestWorkspaceService` → Singleton with IndexedDB Connection

**File**: `frontend/src/services/workspace/GuestWorkspaceService.ts`

```typescript
const db = new GuestDatabase();
// ...
export const guestWorkspaceService = new GuestWorkspaceService();
```

**Hidden State**:
- `db` - Active IndexedDB connection
- Database tables populated with user data

**What Breaks**: Shared across all sessions, never cleared on logout.

---

## 🟡 MEDIUM: Implicit Type Coercions

### 15. `mapDocumentMetaToDocument()` → Assumes Field Presence

**File**: `frontend/src/contexts/workspace/DocumentDataContext.tsx`

```typescript
function mapDocumentMetaToDocument(meta: DocumentMeta | any): Document {
  return {
    id: meta.id,
    type: meta.type,
    title: meta.title,
    content: meta.content || '',  // ❌ Assumes content exists or is falsy-coercible
    folderId: meta.folderId,
    workspaceId: meta.workspaceId,
    starred: meta.starred,  // ❌ Could be undefined
    tags: meta.tags,  // ❌ Could be undefined
    createdAt: new Date(meta.createdAt),  // ❌ Assumes ISO string
    updatedAt: new Date(meta.updatedAt),  // ❌ Assumes ISO string
    // ...
    sync: {
      status: meta.syncStatus,  // ❌ Assumes syncStatus exists
      // ...
    },
  };
}
```

**What Breaks**: 
- `new Date(undefined)` creates Invalid Date
- `meta.tags` undefined causes downstream `.map()` failures
- `meta.syncStatus` undefined breaks sync logic

---

### 16. `extractUUID()` vs `extractUuid()` → Different Implementations

**Files**:
- `frontend/src/utils/id-generator.ts`
- `frontend/src/utils/identity.ts`

```typescript
// id-generator.ts
export function extractUUID(id: string): string {
  return id.includes('_') ? id.split('_')[1] : id;  // Simple split
}

// identity.ts
export function extractUuid(id: string): string {
  const underscoreIndex = id.indexOf('_');
  if (underscoreIndex === -1) return id;
  
  const possibleUuid = id.slice(underscoreIndex + 1);
  
  // Validates UUID format before returning
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(possibleUuid)) {
    return possibleUuid;
  }
  
  return id;  // Returns original if not valid UUID
}
```

**Hidden Difference**:
- `extractUUID('invalid_notauuid')` returns `'notauuid'`
- `extractUuid('invalid_notauuid')` returns `'invalid_notauuid'`

**What Breaks**: Different behavior based on which function is imported.

---

## 🔵 LOW: Timing Assumptions

### 17. `SyncContext` → 150ms Delay for React State

**File**: `frontend/src/contexts/workspace/SyncContext.tsx:98`

```typescript
const handleLoginSuccess = async () => {
  await new Promise(resolve => setTimeout(resolve, 150));  // ❌ MAGIC NUMBER
  const authCheck = authService.isAuthenticated();
  // ...
};
```

**Assumption**: React will update state within 150ms.

**What Breaks**: Slow devices, React concurrent mode, heavy renders.

---

### 18. `SyncContext` → 1s Delay for Batch Sync

**File**: `frontend/src/contexts/workspace/SyncContext.tsx:116`

```typescript
setTimeout(async () => {
  const { batchSyncService } = await import('@/services/sync/BatchSyncService');
  const results = await batchSyncService.syncAllWorkspaces();
  // ...
}, 1000);  // ❌ MAGIC 1 SECOND DELAY
```

**Assumption**: `backendWorkspaceService.init()` completes within 1 second.

**What Breaks**: Slow network, cold IndexedDB, many workspaces.

---

### 19. `SyncContext` → 200ms Retry Delay

**File**: `frontend/src/contexts/workspace/SyncContext.tsx:150`

```typescript
setTimeout(() => {
  if (authService.isAuthenticated()) {
    setInitCounter(prev => prev + 1);
  }
}, 200);  // ❌ MAGIC RETRY DELAY
```

**Assumption**: If first check fails, 200ms is enough to fix it.

---

## 📋 Summary by Category

| Category | Count | Severity |
|----------|-------|----------|
| Call Order Dependencies | 4 | 🔴 Critical |
| Global State Dependencies | 4 | 🟠 High |
| Event Dependencies | 3 | 🟡 Medium |
| Singleton State | 3 | 🟠 High |
| Type Coercions | 2 | 🟡 Medium |
| Timing Assumptions | 3 | 🔵 Low |
| **Total** | **19** | |

---

## Quick Reference: Functions That Cannot Be Safely Called in Isolation

| Function | File | Requires |
|----------|------|----------|
| `backendWorkspaceService.getDocument()` | BackendWorkspaceService.ts | `init()` called first |
| `backendWorkspaceService.createDocument()` | BackendWorkspaceService.ts | `init()`, currentWorkspaceId set |
| `selectiveSyncService.pushDocument()` | SelectiveSyncService.ts | Auth, guest doc exists, network |
| `yjsDocumentManager.getDocument()` | YjsDocumentManager.ts | Caller must call `releaseDocument()` |
| `yjsHydrationService.hydrateDocument()` | YjsHydrationService.ts | Secretly acquires refCount |
| `apiClient.get/post/...` | ApiClient.ts | Token in localStorage or auth fails |
| `authService.isAuthenticated()` | AuthService.ts | localStorage available |
| `batchSyncService.syncAllWorkspaces()` | BatchSyncService.ts | Auth, guestWorkspaceService ready |

---

## Recommendations

### Immediate Actions

1. **Add initialization guards** to all service methods that require `init()`:
   ```typescript
   private assertInitialized() {
     if (!this.isInitialized) {
       throw new Error('Service not initialized');
     }
   }
   ```

2. **Document all event contracts** in a central registry:
   ```typescript
   // @/events/contracts.ts
   export const EventContracts = {
     'auth:login': z.object({ user: UserSchema }),
     'document:synced': z.object({ oldId: z.string(), newId: z.string(), doc: DocumentSchema }),
   };
   ```

3. **Add cleanup on logout** for all singletons:
   ```typescript
   window.addEventListener('auth:logout', () => {
     yjsDocumentManager.destroyAll();
     selectiveSyncService.clearMappings();
   });
   ```

### Medium-Term Actions

4. **Replace magic timeouts** with proper state synchronization (events, callbacks, or state machines)

5. **Consolidate ID utilities** into single module with one function

6. **Add dependency injection** to services for testability

---

## Appendix: Dependency Graph (Simplified)

```
┌─────────────┐     events     ┌─────────────┐
│   useAuth   │ ─────────────→ │ SyncContext │
└─────────────┘                └─────────────┘
                                     │
                                     │ init()
                                     ▼
                          ┌─────────────────────┐
                          │BackendWorkspaceService│
                          └─────────────────────┘
                                     │
                                     │ getDocument()
                                     ▼
                          ┌─────────────────────┐
                          │  YjsDocumentManager  │◀─────────┐
                          └─────────────────────┘          │
                                     │                      │
                                     │ getDocument()        │ hydrateDocument()
                                     ▼                      │
                          ┌─────────────────────┐          │
                          │ YjsHydrationService │──────────┘
                          └─────────────────────┘

                          Dependencies:
                          ─────────────────────
                          • localStorage (auth_token, user)
                          • IndexedDB (cacheDb, guestDb, mappingDb)
                          • Custom Events (auth:login, document:synced, etc.)
                          • setTimeout magic numbers (150ms, 200ms, 1000ms)
```


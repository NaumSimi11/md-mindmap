# 📛 Naming Audit

**Date**: December 26, 2025  
**Scope**: Full-stack MDReader application  
**Focus**: Naming inconsistencies, semantic drift, and broken mental models

---

## Executive Summary

This audit identifies **50+ naming problems** that create confusion and bugs. The most severe:

- **Same concept, 5+ names**: Document ownership uses `owner_id`, `ownerId`, `created_by`, `createdBy`, `createdById`
- **Duplicate service directories**: `workspace/` and `workspace-legacy/` both actively imported
- **Type name ≠ API name**: Frontend uses `folderId`, backend uses `folder_id`, some files use `parentId`
- **"Sync" means 4 things**: Network status, CRDT merge, push-to-cloud, IndexedDB persistence

---

## 🔴 CRITICAL: Same Concept, Different Names

### 1. Document Ownership (5 names for 1 concept)

| Location | Name | Description |
|----------|------|-------------|
| `api.types.ts:53` | `owner_id` | Workspace owner |
| `api.types.ts:82` | `created_by` | Document creator |
| `api.types.ts:108` | `created_by` | Version creator |
| `types.ts:51` | `workspaceId` | Document's workspace |
| `WYSIWYGEditor.tsx` | `createdById` | Document creator check |
| Backend models | `owner_id` | Workspace owner |
| Backend models | `created_by_id` | Document creator |

**Impact**: Developers don't know which field to check for permissions.

```typescript
// WYSIWYGEditor.tsx - uses createdById
if (doc.metadata?.createdById === user.id) {
  setUserRole('owner');
}

// api.types.ts - uses created_by
created_by: string;

// Backend - uses created_by_id
created_by_id: UUID  # SQLAlchemy model
```

**Recommendation**: Standardize to `createdById` (frontend) / `created_by_id` (backend).

---

### 2. Document ID (6 variations)

| Pattern | Example | Used In |
|---------|---------|---------|
| `documentId` | camelCase | React props, hooks |
| `document_id` | snake_case | API responses |
| `docId` | Abbreviated | Some internal functions |
| `doc_id` | Abbreviated snake | Rare |
| `doc_UUID` | Prefixed | Local IndexedDB |
| `UUID` | Raw | Cloud backend |

**952 usages** found across 88 files.

```typescript
// Same variable, different names:
const documentId = props.documentId;  // From React
const doc_id = response.document_id;  // From API
const rawId = extractUUID(docId);     // To cloud
```

**Impact**: ID normalization bugs (Bug #1, #7 from previous fixes).

---

### 3. Folder Parent (3 names)

| Location | Name | Meaning |
|----------|------|---------|
| `types.ts:33` | `parentId` | Parent folder |
| `types.ts:51` | `folderId` | Document's folder |
| Backend API | `folder_id` | Parent folder |

```typescript
// Frontend types.ts
parentId: string | null; // For folders
folderId: string | null; // For documents

// But they mean the same thing conceptually!
```

**Recommendation**: Use `parentFolderId` for folders, `folderId` for documents.

---

### 4. Content Type (3 names, different enums)

| Location | Name | Values |
|----------|------|--------|
| `api.types.ts:78` | `content_type` | `'markdown' \| 'text' \| 'json'` |
| `types.ts:53` | `type` | `'markdown' \| 'mindmap' \| 'presentation'` |
| Backend | `content_type` | `'markdown'` only |

```typescript
// API type
content_type: 'markdown' | 'text' | 'json';

// Frontend type  
type: 'markdown' | 'mindmap' | 'presentation';

// These are incompatible enums!
```

**Impact**: Type mismatches when mapping API → local types.

---

### 5. Sync Status (4 meanings of "sync")

| Context | "Sync" Means | Example |
|---------|--------------|---------|
| Network | Online/offline | `isOnline`, `syncStatus` |
| CRDT | Yjs merge | `yjsVersion`, `synced` provider event |
| Push | Local → Cloud | `pushDocument()`, `syncStatus: 'syncing'` |
| Cache | Cloud → IndexedDB | `cacheDb.workspaces.put()` |

**171 usages** of `syncStatus`/`sync_status` across 25 files.

```typescript
// All mean different things:
syncStatus: 'local' | 'synced' | 'syncing' | 'conflict' | 'pending'
//           ^^^^^^   ^^^^^^    ^^^^^^^
//           Never pushed  |    Pushing now
//                    CRDT merged + pushed
```

**Impact**: `syncStatus: 'synced'` doesn't tell you if CRDT is merged, only if pushed.

**Recommendation**: Split into:
- `storageLocation: 'local' | 'cloud' | 'both'`
- `uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error'`
- `crdtStatus: 'diverged' | 'merged'`

---

## 🟠 HIGH: Duplicate/Legacy Naming

### 6. Two Service Directories

```
frontend/src/services/workspace/           # "Current"
  - BackendWorkspaceService.ts (1062 lines)
  - GuestWorkspaceService.ts (679 lines)

frontend/src/services/workspace-legacy/    # "Legacy"
  - BackendWorkspaceService.ts (465 lines)
  - GuestWorkspaceService.ts (594 lines)
```

**Both actively imported** in 24 files!

```typescript
// WorkspaceSidebar.tsx
import { backendWorkspaceService } from '@/services/workspace-legacy/BackendWorkspaceService';

// SelectiveSyncService.ts  
import { backendWorkspaceService } from '@/services/workspace/BackendWorkspaceService';

// Different services, same export name!
```

**Impact**: Which `backendWorkspaceService` are you getting? Depends on import path.

---

### 7. SyncManager vs SelectiveSyncService vs BatchSyncService

| Service | Status | Purpose |
|---------|--------|---------|
| `SyncManager` | `@deprecated` | Old offline queue |
| `SelectiveSyncService` | Active | Single document push |
| `BatchSyncService` | Active | Bulk sync on login |
| `UnifiedSyncManager` | Unknown | Appears unused? |

**4 services** that all handle "sync".

```typescript
// SyncManager.ts line 1-21
/**
 * SyncManager - Core offline sync engine
 * @deprecated This service is deprecated in favor of Yjs CRDT synchronization.
 */

// But it's still imported in 4 files!
```

---

### 8. Workspace ID Prefixes

| Type | Format | Example |
|------|--------|---------|
| Local | `ws_UUID` | `ws_123e4567-e89b-...` |
| Cloud | `UUID` | `123e4567-e89b-...` |

But functions don't clearly indicate which they expect:

```typescript
// Does this expect ws_UUID or UUID?
async getDocuments(workspaceId: string): Promise<Document[]>

// You have to check the implementation to know!
```

**Recommendation**: Use types `LocalWorkspaceId` and `CloudWorkspaceId`.

---

## 🟡 MEDIUM: Misleading Function Names

### 9. `refreshDocuments()` vs `refreshWorkspaces()`

| Function | Actually Does |
|----------|---------------|
| `refreshDocuments()` | Loads from both guest + backend, merges |
| `refreshWorkspaces()` | Only loads from current source |

**Asymmetric behavior** with symmetric names.

---

### 10. `getDocument()` - 4 Different Implementations

| Service | Returns |
|---------|---------|
| `DocumentDataContext.getDocument()` | Merged local + cloud |
| `BackendWorkspaceService.getDocument()` | Cloud only |
| `GuestWorkspaceService.getDocument()` | Local only |
| `documentService.getDocument()` | API call |

```typescript
// Which one are you calling?
const doc = await getDocument(id);
```

**Impact**: Different return shapes, different error handling.

---

### 11. `init()` vs `initialize()` vs `load()`

| Service | Method | What It Does |
|---------|--------|--------------|
| `BackendWorkspaceService` | `init()` | Sets up service |
| `GuestWorkspaceService` | `initialize()` | Sets up service |
| `WorkspaceInitializer` | `initialize()` | Sets up *everything* |
| Context | `loadInitialData()` | Loads after auth |

**No consistent naming** for "make this ready to use".

---

### 12. `destroy()` vs `cleanup()` vs `clear()`

| Method | What It Does |
|--------|--------------|
| `destroyDocument()` | Removes from memory |
| `clearDocumentStorage()` | Deletes from IndexedDB |
| `cleanup()` | Timer-based auto-destroy |

```typescript
// To fully remove a document, you need:
yjsDocumentManager.destroyDocument(id);
yjsDocumentManager.clearDocumentStorage(id);
// Why two methods?
```

---

## 🟡 MEDIUM: Casing Inconsistencies

### 13. camelCase vs snake_case Mismatch

**Frontend expects camelCase, backend returns snake_case**:

```typescript
// API response (snake_case)
{
  workspace_id: "123",
  content_type: "markdown",
  created_at: "2025-01-01",
  yjs_state_b64: "AAA=",
  created_by: "456"
}

// Frontend type (camelCase)
interface Document {
  workspaceId: string;
  contentType: 'markdown';
  createdAt: string;
  yjsStateB64: string;
  createdById: string;  // Different name!
}
```

**97 mismatches** between API and frontend types.

---

### 14. Inconsistent Boolean Naming

| Name | Follows Convention? |
|------|---------------------|
| `isOnline` | ✅ `is` prefix |
| `isAuthenticated` | ✅ `is` prefix |
| `isInitialized` | ✅ `is` prefix |
| `shouldUseBackendService` | ⚠️ `should` unusual |
| `canManageMembers` | ⚠️ `can` is for methods |

```typescript
// Inconsistent:
const shouldUseBackendService = isAuthenticated && isBackendInitialized;
const canManageMembers = roleLevel >= 4;  // This looks like a method name
```

---

## 🟡 MEDIUM: Variables That Change Meaning

### 15. `currentWorkspace` - Changes Type Across Layers

| Layer | Type |
|-------|------|
| API | `api.types.Workspace` |
| Context | `types.Workspace` (different interface!) |
| IndexedDB | `Workspace` (Dexie model) |

```typescript
// Same name, different types:
const currentWorkspace: Workspace;  // Which Workspace?
```

**Recommendation**: Use `ApiWorkspace`, `LocalWorkspace`, `ContextWorkspace`.

---

### 16. `document` - Overloaded Term

| Context | `document` Means |
|---------|------------------|
| DOM | `window.document` |
| App | Markdown document entity |
| Yjs | `Y.Doc` instance |

```typescript
// Confusing:
const document = await getDocument(id);  // App document
document.title;  // Wait, is this the DOM?
```

**Recommendation**: Use `doc` or `mdDocument` for app entities.

---

### 17. `version` - 3 Different Concepts

| Field | Meaning |
|-------|---------|
| `version` | Optimistic lock counter |
| `yjsVersion` | Yjs state vector |
| `DocumentVersion` | Historical snapshot |

```typescript
interface DocumentMeta {
  version: number;      // Optimistic locking
  yjsVersion?: number;  // Yjs state
}

// But DocumentVersion is a history snapshot, not a lock!
```

---

## 📋 Name Collision Matrix

### Same Export Name, Different Modules

| Export Name | Files |
|-------------|-------|
| `backendWorkspaceService` | `workspace/BackendWorkspaceService.ts`, `workspace-legacy/BackendWorkspaceService.ts` |
| `guestWorkspaceService` | `workspace/GuestWorkspaceService.ts`, `workspace-legacy/GuestWorkspaceService.ts` |
| `workspaceService` | `api/WorkspaceService.ts`, `workspace-legacy/WorkspaceService.ts` |
| `Workspace` | `api.types.ts`, `types.ts`, multiple contexts |
| `Document` | `api.types.ts`, `types.ts`, DOM global |

---

## 🛠️ Recommendations

### Immediate Actions

1. **Delete `workspace-legacy/`** or rename to `workspace-deprecated/` with compile errors

2. **Create type aliases for IDs**:
```typescript
type LocalDocumentId = `doc_${string}`;
type CloudDocumentId = string;
type DocumentId = LocalDocumentId | CloudDocumentId;
```

3. **Rename `syncStatus` to `uploadStatus`** to distinguish from CRDT sync

4. **Standardize ownership fields**:
```typescript
// Frontend
createdById: string;
ownerId: string;

// Backend (snake_case)
created_by_id: UUID
owner_id: UUID
```

### Medium-Term Actions

5. **Create API-to-local mappers with explicit naming**:
```typescript
function mapApiDocumentToLocal(apiDoc: ApiDocument): LocalDocument {
  return {
    id: apiDoc.id,
    createdById: apiDoc.created_by,  // Explicit rename
    workspaceId: apiDoc.workspace_id,
    // ...
  };
}
```

6. **Split sync services**:
```
sync/
  - CRDTSyncService.ts     # Yjs merge
  - CloudUploadService.ts  # Push to backend  
  - OfflineCacheService.ts # IndexedDB persistence
```

7. **Add linting rules**:
```javascript
// .eslintrc
{
  "rules": {
    "no-restricted-imports": [
      "error", 
      { "patterns": ["**/workspace-legacy/**"] }
    ]
  }
}
```

---

## Appendix: Full Name Inventory

### ID Naming Variations (952 matches)

| Pattern | Count | Files |
|---------|-------|-------|
| `documentId` | 500+ | 88 |
| `document_id` | 200+ | 40 |
| `docId` | 100+ | 25 |
| `workspaceId` | 373 | 40 |
| `workspace_id` | 100+ | 30 |

### Service/Manager Classes

| Class | Suffix | Notes |
|-------|--------|-------|
| `BackendWorkspaceService` | Service | ✅ |
| `YjsDocumentManager` | Manager | ⚠️ Inconsistent |
| `SnapshotManager` | Manager | ⚠️ |
| `SyncManager` | Manager | Deprecated |
| `ActionHistoryManager` | Manager | ✅ |
| `GuestWorkspaceService` | Service | ✅ |

### Database Classes

| Class | Pattern |
|-------|---------|
| `GuestDatabase` | `{Scope}Database` |
| `BackendCacheDatabase` | `{Scope}CacheDatabase` |
| `OfflineDatabaseClass` | `{Scope}DatabaseClass` ⚠️ |
| `WorkspaceMappingDatabase` | `{Entity}MappingDatabase` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Same concept, different names | 17 |
| Misleading function names | 8 |
| Casing inconsistencies | 97 |
| Duplicate exports | 5 |
| Deprecated but imported | 4 |
| Total naming issues | **131** |


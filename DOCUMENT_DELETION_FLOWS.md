# Document Deletion Flow Analysis

## Current System State

This document analyzes the current document deletion flows in MDReader, covering both authenticated and guest user scenarios.

---

## 📊 **Document Classification System**

### **ID Format Patterns**
- **Guest Documents**: `doc_a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p`
- **Backend Documents**: `a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p`

### **Sync Status Values**
- `'local'` - Document exists only locally, never synced to backend
- `'synced'` - Document exists on both local and backend
- `'syncing'` - Document is currently being synced
- `'pending'` - Document queued for sync to backend
- `'conflict'` - Sync conflict detected

---

## 🔀 **Deletion Flow Routing Logic**

### **Current Router (DocumentDataContext.deleteDocument)**
```typescript
const deleteDocument = useCallback(async (documentId: string) => {
  if (!shouldUseBackendService) {
    // Guest mode: Always use guest service
    await guestWorkspaceService.deleteDocument(documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
    return;
  }

  // Authenticated mode: Always use backend service
  await backendWorkspaceService.deleteDocument(documentId);
  setDocuments(prev => prev.filter(d => d.id !== documentId));
}, [shouldUseBackendService]);
```

### **What Actually Happens**
The router only checks `shouldUseBackendService` (authentication status), not document properties.

---

## 🚨 **Case 1: Guest User Deletes Document**

### **Document State**
- ID: `doc_a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p`
- Sync Status: `'local'`
- Storage: IndexedDB only

### **Flow Execution**
1. **UI Trigger**: User clicks delete in WorkspaceSidebar
2. **Router Check**: `shouldUseBackendService = false` (not authenticated)
3. **Service Call**: `guestWorkspaceService.deleteDocument(documentId)`
4. **Storage Operation**:
   ```typescript
   await db.documents.delete(id); // Hard delete from IndexedDB
   console.log(`✅ Deleted document: ${id}`);
   ```
5. **UI Update**: `setDocuments(prev => prev.filter(d => d.id !== documentId))`
6. **Result**: Document permanently removed from IndexedDB and UI

### **Edge Cases**
- **Network Status**: Irrelevant (local operation only)
- **Backend State**: No backend document exists
- **Recovery**: Impossible (hard delete)

---

## 🚨 **Case 2: Authenticated User Deletes Backend Document**

### **Document State**
- ID: `a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p` (bare UUID)
- Sync Status: `'synced'`
- Storage: PostgreSQL + IndexedDB

### **Flow Execution**
1. **UI Trigger**: User clicks delete in WorkspaceSidebar
2. **Router Check**: `shouldUseBackendService = true` (authenticated)
3. **Service Call**: `backendWorkspaceService.deleteDocument(documentId)`
4. **Storage Operations**:
   ```typescript
   // Delete from cache FIRST (optimistic UI)
   await cacheDb.documents.delete(id);

   // Then try backend
   if (this.isOnline) {
     try {
       await documentService.deleteDocument(id);
       console.log('✅ Document deleted from backend');
     } catch (error) {
       console.error('❌ Failed to delete document on backend:', error);
       // Cache already deleted, error just logged
     }
   }
   ```
5. **UI Update**: `setDocuments(prev => prev.filter(d => d.id !== documentId))`
6. **Result**: Document soft-deleted in PostgreSQL (`is_deleted = true`)

### **Success Scenario**
- Backend online: Document deleted from both cache and PostgreSQL
- UI shows document removed
- Document recoverable from trash (future feature)

### **Failure Scenario (Current Bug)**
- Backend offline/fails: Document deleted from cache, remains in PostgreSQL
- UI shows document removed
- On refresh: Backend sync brings document back to cache
- User sees document reappear in UI

---

## 🚨 **Case 3: Authenticated User Deletes Local Document**

### **Document State**
- ID: `doc_a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p`
- Sync Status: `'local'`
- Storage: IndexedDB only (never synced to backend)

### **Flow Execution (Current Bug)**
1. **UI Trigger**: User clicks delete in WorkspaceSidebar
2. **Router Check**: `shouldUseBackendService = true` (authenticated)
3. **Wrong Service Call**: `backendWorkspaceService.deleteDocument(documentId)` ❌
4. **Storage Operations**:
   ```typescript
   // Delete from cache FIRST
   await cacheDb.documents.delete(id);

   // Try backend with wrong ID format
   if (this.isOnline) {
     try {
       await documentService.deleteDocument('doc_a1b2c3d4-...'); // Wrong ID!
       console.log('✅ Document deleted from backend');
     } catch (error) {
       console.error('❌ Failed to delete document on backend:', error);
       // Cache already deleted, error just logged
     }
   }
   ```
5. **UI Update**: `setDocuments(prev => prev.filter(d => d.id !== documentId))`
6. **Result**: Document deleted from cache, backend call fails, document reappears on refresh

### **Why This Happens**
- Router ignores `sync.status === 'local'`
- Backend service doesn't handle `doc_` prefixed IDs
- Optimistic cache deletion before backend confirmation

---

## 🔧 **Service Implementation Details**

### **GuestWorkspaceService.deleteDocument()**
```typescript
async deleteDocument(id: string): Promise<void> {
  this.assertInitialized('deleteDocument');
  await db.documents.delete(id); // Direct IndexedDB deletion
  console.log(`✅ Deleted document: ${id}`);
}
```
- **Behavior**: Immediate hard delete
- **Error Handling**: Throws if database error
- **Recovery**: Impossible

### **BackendWorkspaceService.deleteDocument()**
```typescript
async deleteDocument(id: string): Promise<void> {
  this.assertInitialized('deleteDocument');

  // Delete cache FIRST (optimistic)
  await cacheDb.documents.delete(id);

  // Try backend SECOND
  if (this.isOnline) {
    try {
      await documentService.deleteDocument(id);
      console.log('✅ Document deleted from backend');
    } catch (error) {
      console.error('❌ Failed to delete document on backend:', error);
      // Cache already deleted, no rollback
    }
  }
}
```
- **Behavior**: Optimistic cache deletion, then backend sync
- **Error Handling**: Logs backend errors, doesn't rollback cache
- **Recovery**: Backend errors leave cache in wrong state

---

## 🌐 **Backend API Behavior**

### **DocumentService.deleteDocument()**
```typescript
async deleteDocument(id: string): Promise<void> {
  return apiClient.delete(API_ENDPOINTS.documents.delete(id));
}
```

### **Backend Router (documents.py)**
```python
@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = DocumentService(db)

    try:
        await service.delete_document(document_id, str(current_user.id))
        return None  # 204 No Content
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
```

### **Backend Service Logic**
```python
async def delete_document(self, document_id: str, user_id: str) -> None:
    # Get document (must not be already deleted)
    document = await self.db.query(Document).filter(
        Document.id == document_id,
        Document.is_deleted == False
    ).first()

    if not document:
        raise ValueError("Document not found")

    # Check permission (creator OR workspace owner)
    is_creator = str(document.created_by_id) == user_id

    if not is_creator:
        # Check if workspace owner
        workspace = await self.db.query(Workspace).filter(
            Workspace.id == document.workspace_id,
            Workspace.owner_id == user_id
        ).first()

        if not workspace:
            raise ValueError("No permission to delete document")

    # Soft delete
    document.is_deleted = True
    document.updated_at = datetime.utcnow()

    await self.db.commit()
```

---

## 🔄 **Sync Behavior Impact**

### **Document Sync Logic**
```typescript
// BackendWorkspaceService.syncDocuments()
if (this.isOnline && authService.isAuthenticated() &&
    cachedDoc?.syncStatus !== 'local' &&
    cachedDoc?.syncStatus !== 'pending') {
  try {
    // Fetch from backend and merge
    const backendDoc = await documentService.getDocument(id);
    // Merge logic...
  }
}
```

### **Impact on Deletion**
- **Backend documents**: Sync brings them back if local deletion fails
- **Local documents**: Never synced, stay deleted if local deletion succeeds
- **Mixed scenarios**: Creates inconsistent states

---

## 📱 **UI State Management**

### **DocumentDataContext State Updates**
```typescript
// All deletion paths update UI the same way
setDocuments(prev => prev.filter(d => d.id !== documentId));
```

### **WorkspaceSidebar Rendering**
```typescript
// Shows current documents array
const rootDocs = backendDocuments.filter(doc => !doc.folderId);
const docsInFolders = backendDocuments.filter(doc => doc.folderId);
```

### **Real-time Updates**
- **Guest deletions**: Immediate UI update, permanent
- **Backend deletions**: Immediate UI update, may revert on sync
- **Failed deletions**: UI shows deleted, content may reappear

---

## 🔍 **Error Patterns Observed**

### **Pattern 1: CORS/Network Errors**
```
DELETE http://localhost:7001/api/v1/documents/doc_xxx 500 (Internal Server Error)
❌ Failed to delete document on backend: TypeError: Failed to fetch
✅ Document deleted successfully (UI shows success despite failure)
```

### **Pattern 2: ID Format Errors**
```
DELETE /api/v1/documents/doc_e637cedf-f9e6-4e84-9fec-291db141449c
Backend expects: e637cedf-f9e6-4e84-9fec-291db141449c
Result: 404 Not Found or 500 Internal Server Error
```

### **Pattern 3: Sync Reversal**
```
1. Cache deleted: Document disappears from UI
2. Backend fails: Document still exists on server
3. Refresh occurs: Sync brings document back
4. UI shows: Document reappears unexpectedly
```

---

## 📊 **State Transition Diagrams**

### **Guest Document Deletion**
```
UI: Document Visible
    ↓ Delete Clicked
Guest Service: Hard Delete from IndexedDB
    ↓ Success
UI: Document Removed (Permanent)
```

### **Backend Document Deletion (Success)**
```
UI: Document Visible
    ↓ Delete Clicked
Cache: Delete Immediately
Backend: Soft Delete (is_deleted = true)
    ↓ Success
UI: Document Removed (Recoverable)
```

### **Backend Document Deletion (Failure)**
```
UI: Document Visible
    ↓ Delete Clicked
Cache: Delete Immediately
Backend: Delete Fails
    ↓ UI Shows Removed
    ↓ Refresh Happens
Sync: Brings Document Back
    ↓ UI Shows Reappeared
```

---

## 🎯 **Current System Invariants**

### **What Works**
- Guest documents delete permanently when user is not authenticated
- Backend documents delete correctly when network works
- UI updates immediately for good UX
- Permission checks work on backend

### **What Doesn't Work**
- Authenticated users deleting local documents (wrong service routing)
- Network failures during backend deletion (cache left in wrong state)
- ID format mismatches between frontend and backend
- No rollback mechanism for failed deletions

---

## 🔄 **Observed User Experiences**

### **Scenario A: Guest User**
1. Creates documents while logged out
2. Deletes documents
3. Documents disappear permanently
4. Refresh shows empty workspace
5. **Result**: Expected behavior

### **Scenario B: Authenticated User (Backend Docs Only)**
1. Has documents synced to backend
2. Deletes documents while online
3. Documents disappear and stay gone
4. Refresh confirms deletion
5. **Result**: Expected behavior

### **Scenario C: Authenticated User (Mixed Docs)**
1. Has both local and backend documents
2. Deletes local document
3. Document disappears, reappears on refresh
4. Deletes backend document
5. Document disappears, stays gone
6. **Result**: Confusing inconsistent behavior

### **Scenario D: Network Issues**
1. User deletes document while offline/online but backend down
2. Document disappears from UI
3. Later refresh brings document back
4. **Result**: Data loss illusion, actual data preserved but confusing UX

---

## 📈 **System Metrics Impact**

### **Cache Consistency**
- **Guest deletions**: Cache always accurate
- **Backend deletions**: Cache may be stale after failures
- **Sync operations**: May overwrite local changes

### **Data Integrity**
- **Guest docs**: High (hard delete is final)
- **Backend docs**: Medium (soft delete recoverable)
- **Mixed scenarios**: Low (inconsistent deletion behavior)

### **User Experience**
- **Immediate feedback**: ✅ Always works
- **Final state accuracy**: ❌ Inconsistent
- **Error recovery**: ❌ Poor
- **Data safety**: ✅ Backend protects against accidental loss

---

## 🔗 **Integration Points**

### **Yjs Document Manager**
- Documents are released when refCount reaches 0
- Memory cleanup happens automatically
- No direct deletion integration

### **Snapshot Manager**
- Skips snapshots for local documents (`doc_` prefix)
- Continues snapshots for backend documents
- May create snapshots of deleted documents

### **Sync Services**
- Selective sync avoids local-only documents
- Batch sync may resurrect deleted documents
- Network status affects deletion capabilities

---

## ✅ **Fixes Applied**

### **Fix 1: Smart Deletion Routing (DocumentDataContext)**
The `deleteDocument` function now routes based on document properties, not just authentication status:
```typescript
const isLocalOnlyDoc = documentId.startsWith('doc_') || 
                      existingDoc?.sync?.status === 'local' || 
                      existingDoc?.sync?.status === 'pending';

if (!shouldUseBackendService || isLocalOnlyDoc) {
  // Use guest service (hard delete from IndexedDB)
} else {
  // Use backend service (soft delete via API)
}
```

### **Fix 2: Backend-First Deletion (BackendWorkspaceService)**
The `deleteDocument` function now:
1. Detects local-only documents (`doc_` prefix) and skips backend calls
2. For backend documents: Deletes from backend FIRST, then cache
3. Throws error on backend failure (no silent failures)
4. Strips `doc_` prefix before sending to backend API

```typescript
if (isLocalOnly) {
  await cacheDb.documents.delete(id); // Local only
  return;
}

// Backend document: Delete from backend FIRST
try {
  await documentService.deleteDocument(backendId);
  await cacheDb.documents.delete(id); // Only after success
} catch (error) {
  throw error; // Don't delete from cache on failure
}
```

### **Fix 3: Navigate Away After Deleting Current Document (WorkspaceSidebar)**
When user deletes the document they're currently viewing, navigate to `/workspace`:
```typescript
if (currentDocumentId === deletedDocId) {
  console.log('📍 Navigating away from deleted document');
  navigate('/workspace');
}
```

### **Result: Consistent Deletion Behavior**
| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Guest deletes local doc | ✅ Works | ✅ Works |
| Auth user deletes backend doc | ⚠️ Sometimes fails silently | ✅ Works (throws on failure) |
| Auth user deletes local doc | ❌ Sends wrong ID to backend, reappears | ✅ Deletes locally only |
| Network failure | ❌ UI shows deleted, reappears on refresh | ✅ Shows error, UI unchanged |
| Delete current document | ❌ Content stays in editor | ✅ Navigates to /workspace |

---

*Analysis completed: January 5, 2026*
*Fixes applied: January 5, 2026*

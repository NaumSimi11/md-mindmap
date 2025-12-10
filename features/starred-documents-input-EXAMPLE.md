# Backend Feature Input: Starred Documents

**Generated:** 2024-12-09 10:45:00  
**Status:** Ready for .cursorrules-be

---

## **1. FEATURE NAME**

```
Feature: Starred Documents
Priority: High
Epic: Phase 3 - Document Organization
```

---

## **2. FRONTEND CONTEXT**

### **Components Involved:**

```typescript
// 1. StarButton Component (NEW)
- Path: src/components/document/StarButton.tsx
- Props: { 
    documentId: string, 
    isStarred: boolean,
    onToggle: (starred: boolean) => void 
  }
- State: { isLoading: boolean, optimisticStarred: boolean }
- Actions: [ handleClick, handleKeyPress ]

// 2. DocumentItem Component (MODIFY)
- Path: src/components/workspace/WorkspaceSidebar.tsx (lines 350-400)
- Add: <StarButton /> next to document title
- Update: Show star icon when hovered or starred

// 3. WorkspaceSidebar Component (MODIFY)
- Path: src/components/workspace/WorkspaceSidebar.tsx
- Add: "⭐ Starred (X)" section above "All Documents"
- Filter: Show only documents where is_starred === true
- Sort: Most recently starred first

// 4. useBackendWorkspace Hook (MODIFY)
- Path: src/hooks/useBackendWorkspace.ts
- Add: toggleStarDocument(documentId: string) method
- Add: starredDocuments computed property
- Update: Optimistic updates for starring
```

### **Frontend Logic Summary:**

```
1. User Action: User hovers over document in sidebar
   → Star icon (outline) appears next to title
   → Click star icon to toggle

2. UI Flow:
   - User clicks star icon on "My Document"
   - Icon immediately fills with yellow (optimistic update)
   - API call fires in background: POST /api/v1/documents/{id}/star
   - If success: Document appears in "⭐ Starred (3)" section
   - If error: Revert star icon, show toast "Failed to star document"
   - Clicking again: Icon empties, document removed from Starred section

3. State Management:
   - useBackendWorkspace() manages document list
   - toggleStarDocument() updates local state immediately (optimistic)
   - Then calls DocumentService.toggleStar(documentId)
   - On response: Update document.is_starred and document.starred_at
   - starredDocuments = computed from backendDocuments.filter(d => d.is_starred)

4. Expected Response:
   Success: Star icon fills, document moves to Starred section, count updates
   Loading: Subtle spinner on star icon (200ms delay to avoid flicker)
   Error: Revert icon, show toast, log error
   Empty state: "No starred documents yet" with illustration

5. Error States:
   - Network error: "Could not star document. Check your connection." + Retry button
   - 404: "Document not found" (shouldn't happen, but handle it)
   - 403: "You don't have permission to star this document"
   - 500: "Something went wrong. Try again later."
   - Offline: Star locally, queue sync, show "Will sync when online" badge
```

### **Frontend API Calls:**

```typescript
// Toggle star (current MDReader architecture)
import { documentService } from '@/services/api/DocumentService';

// Star a document
const result = await documentService.toggleStar(documentId, true);
// Response: { 
//   id: string,
//   is_starred: boolean, 
//   starred_at: string | null 
// }

// Unstar a document
const result = await documentService.toggleStar(documentId, false);
// Response: { 
//   id: string,
//   is_starred: boolean, 
//   starred_at: null 
// }

// Get only starred documents (optional optimization)
const starred = await documentService.getStarred(workspaceId);
// Response: { 
//   documents: Document[] 
// }

// In useBackendWorkspace hook:
const toggleStarDocument = useCallback(async (documentId: string) => {
  // Optimistic update
  setBackendDocuments(prev => prev.map(doc => 
    doc.id === documentId 
      ? { ...doc, is_starred: !doc.is_starred, starred_at: new Date().toISOString() }
      : doc
  ));

  try {
    const updated = await documentService.toggleStar(documentId, !document.is_starred);
    
    // Update with server response
    setBackendDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, ...updated } : doc
    ));
  } catch (error) {
    // Revert on error
    setBackendDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, is_starred: !doc.is_starred } : doc
    ));
    toast.error('Failed to star document');
  }
}, [backendDocuments]);
```

---

## **3. BACKEND TECHNOLOGY STACK**

```yaml
Framework: FastAPI
Language: Python 3.11+
Database: PostgreSQL (via SQLAlchemy)
Cache: Redis (not needed for this feature)
Authentication: JWT tokens (Argon2 hashing)
File Storage: N/A (metadata only)
WebSockets: Optional (not needed for MVP)
ORM: SQLAlchemy 2.0
Migrations: Alembic
```

---

## **4. DATA PERSISTENCE RULES**

### **Storage Strategy:**

```
Primary Data:
  - [x] PostgreSQL
        - documents.is_starred (BOOLEAN, default false)
        - documents.starred_at (TIMESTAMP, nullable)
  - [ ] Redis (not needed - simple boolean flag)
  - [ ] Local Filesystem
  - [ ] S3/Cloud Storage

Data Flow:
  1. User clicks star → Frontend sends POST /api/v1/documents/{id}/star
  2. Backend validates: User owns workspace that contains document
  3. Backend updates: 
     - documents.is_starred = true
     - documents.starred_at = NOW()
  4. Backend returns: Updated document fields
  5. Frontend updates local state with response
  6. Sidebar re-renders with new starred count
```

### **Data Lifecycle:**

```
Create (Star):
  - Who: Workspace members with viewer+ role
  - Validation: 
    - Document exists
    - User has access to document's workspace
    - Document is not deleted
  - Database:
    UPDATE documents 
    SET is_starred = true, 
        starred_at = NOW(),
        updated_at = NOW()
    WHERE id = :document_id 
      AND workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = :user_id)
  - Returns: { id, is_starred: true, starred_at: "2024-12-09T10:45:00Z" }

Read:
  - Who: All workspace members
  - Filter: 
    - GET /api/v1/documents?workspace_id=X → Returns all docs (starred flag included)
    - GET /api/v1/documents?workspace_id=X&starred=true → Returns only starred
  - Sorting: starred_at DESC (most recently starred first)

Update (Unstar):
  - Who: Same as star (the user who starred it)
  - Database:
    UPDATE documents 
    SET is_starred = false, 
        starred_at = NULL,
        updated_at = NOW()
    WHERE id = :document_id
  - Returns: { id, is_starred: false, starred_at: null }

Delete:
  - N/A (starring is not a separate entity, it's a document property)
  - When document is deleted: is_starred flag is deleted with document

Archive:
  - Archived documents keep their starred status
  - Starred filter can include/exclude archived documents
```

---

## **5. OFFLINE/ONLINE EXPECTATIONS**

### **Online Mode:**

```
- Real-time updates: No (not critical for MVP)
- WebSocket connection: Optional (future: sync stars across devices)
- API latency tolerance: 500ms (simple UPDATE query)
- Concurrent user handling: 10-50 users/workspace (low conflict risk)
```

### **Offline Mode (Desktop App):**

```
- Local storage: Full CRUD with IndexedDB
  - Store: documents table with is_starred column
  - Update locally when user clicks star
  - Queue changes in pending_sync table
  
- Sync strategy: On reconnect, sync all starred changes
  - Send: Array of { documentId, is_starred, starred_at }
  - Backend processes batch update
  - Returns conflicts (if any)
  
- Conflict resolution: Last-write-wins
  - If doc starred offline at 10:00, unstarred online at 10:05
  - On sync: Keep online version (10:05)
  - Notify user: "Some starred documents were synced"
  
- Offline capabilities: Full CRUD
  - Star/unstar works offline
  - Changes persist in IndexedDB
  - Sync on next connection
```

### **Sync Requirements:**

```
- Initial sync: Download all documents with starred flags
  - On workspace switch: Fetch documents, include is_starred
  
- Delta sync: Timestamp-based
  - Client stores: last_sync_timestamp
  - Request: GET /documents?updated_after=2024-12-09T10:00:00Z
  - Returns only changed documents
  
- Conflict handling: 
  - Scenario: User stars doc offline, deletes it online
  - Resolution: Backend returns 404, client removes from local DB
  - Notify: "Document no longer exists"
  
- Sync triggers:
  - App start (check for changes)
  - Every 60 seconds (if changes pending)
  - Manual: "Sync Now" button in settings
  - On network reconnect (browser online event)
```

---

## **6. IMPLEMENTATION NOTES**

### **Similar Features:**
```
- Use same pattern as Document CRUD in backend/app/routers/documents.py
- Follow workspace isolation rules (check user has workspace access)
- Similar to is_archived flag (boolean + timestamp pattern)
- Frontend: Like folder toggle (optimistic updates + revert on error)
```

### **Dependencies:**
```
Requires:
  - documents table (exists)
  - workspace_members table (for permission checks)
  - useBackendWorkspace hook (exists)
  
Conflicts with:
  - None
  
Extends:
  - Document model (add 2 columns)
  - DocumentService (add toggleStar method)
  - useBackendWorkspace (add toggleStarDocument)
```

### **Edge Cases:**
```
1. Document deleted while being starred
   - API returns 404
   - Frontend shows: "Document no longer exists"
   - Remove from local state

2. User loses workspace access while starring
   - API returns 403
   - Frontend shows: "You no longer have access to this workspace"
   - Reload workspace list

3. Offline star + online delete + reconnect
   - Sync detects 404
   - Remove from local pending queue
   - Log: "Sync skipped for deleted document"

4. 100+ documents starred
   - Sidebar shows: "⭐ Starred (100+)"
   - Click to open dedicated Starred page (future feature)

5. Star count in header (future)
   - Query: SELECT COUNT(*) WHERE is_starred = true
   - Cache result for 5 minutes

6. Sorting starred documents
   - Default: starred_at DESC (most recent first)
   - Alternative: title ASC (alphabetical)
   - Store preference in localStorage
```

---

## **7. API SPECIFICATION**

### **Endpoint 1: Toggle Star**
```
POST /api/v1/documents/{document_id}/star
Authorization: Bearer {jwt_token}

Request Body:
{
  "starred": true  // or false to unstar
}

Response 200:
{
  "id": "uuid",
  "is_starred": true,
  "starred_at": "2024-12-09T10:45:00.000Z"
}

Error 404:
{
  "detail": "Document not found"
}

Error 403:
{
  "detail": "You don't have permission to access this workspace"
}
```

### **Endpoint 2: Get Starred Documents (Optional)**
```
GET /api/v1/workspaces/{workspace_id}/documents/starred
Authorization: Bearer {jwt_token}

Response 200:
{
  "documents": [
    {
      "id": "uuid",
      "title": "Important Notes",
      "is_starred": true,
      "starred_at": "2024-12-09T10:45:00.000Z",
      "workspace_id": "uuid",
      "folder_id": null,
      "created_at": "2024-12-08T14:30:00.000Z",
      "updated_at": "2024-12-09T10:45:00.000Z"
    }
  ],
  "total": 5
}
```

---

## **8. DATABASE MIGRATION**

```sql
-- Add starred columns to documents table
ALTER TABLE documents 
  ADD COLUMN is_starred BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN starred_at TIMESTAMP;

-- Index for filtering starred documents
CREATE INDEX idx_documents_starred 
  ON documents(workspace_id, is_starred) 
  WHERE is_deleted = false;

-- Index for sorting by starred_at
CREATE INDEX idx_documents_starred_at 
  ON documents(starred_at DESC) 
  WHERE is_starred = true AND is_deleted = false;
```

---

## **9. TESTING CHECKLIST**

```
Backend:
  [ ] User can star a document they have access to
  [ ] User cannot star a document in another user's workspace
  [ ] Starring updates is_starred = true and sets starred_at timestamp
  [ ] Unstarring sets is_starred = false and starred_at = null
  [ ] GET /documents includes is_starred and starred_at
  [ ] GET /documents?starred=true returns only starred documents
  [ ] Deleting a document removes starred status
  [ ] API returns 404 for non-existent documents
  [ ] API returns 403 for unauthorized access

Frontend:
  [ ] Star icon appears on hover
  [ ] Clicking star immediately updates UI (optimistic)
  [ ] Document appears in "Starred" section
  [ ] Count updates: "⭐ Starred (3)"
  [ ] Clicking again unstars document
  [ ] Document removed from Starred section
  [ ] Error shows toast and reverts UI
  [ ] Offline starring queues for sync
  [ ] On reconnect, offline stars sync correctly
  [ ] Starred section sorts by most recent first

Edge Cases:
  [ ] Starring 100+ documents works
  [ ] Starring while document is being deleted (race condition)
  [ ] Offline star + online delete resolves correctly
  [ ] Network error during star shows proper error
  [ ] Concurrent stars from multiple devices sync correctly
```

---

## **10. NEXT STEPS**

### **Backend Implementation:**
```bash
1. Create migration: 
   alembic revision -m "add_starred_to_documents"

2. Update models/document.py:
   Add is_starred and starred_at columns

3. Update routers/documents.py:
   Add POST /documents/{id}/star endpoint

4. Update services/document.py:
   Add toggle_star(document_id, user_id, starred: bool)

5. Test with curl:
   curl -X POST http://localhost:7001/api/v1/documents/{id}/star \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"starred": true}'
```

### **Frontend Implementation:**
```bash
1. Create StarButton component:
   frontend/src/components/document/StarButton.tsx

2. Update DocumentService:
   Add toggleStar(documentId, starred) method

3. Update useBackendWorkspace:
   Add toggleStarDocument method
   Add starredDocuments computed property

4. Update WorkspaceSidebar:
   Add "⭐ Starred (X)" section
   Show only starred documents
   Add <StarButton /> to each DocumentItem

5. Test in browser:
   - Click star → Icon fills
   - Check "Starred" section
   - Refresh page → Star persists
   - Click again → Unstar works
```

---

## **READY TO FEED TO `.cursorrules-be`**

This input is complete and ready to paste into:

```
@.cursorrules-be Here's my feature input:
[Paste this entire file]
```

You'll receive:
✅ Complete SQLAlchemy model changes
✅ Alembic migration script
✅ FastAPI endpoint implementation
✅ Service layer logic
✅ Error handling
✅ Permission checks
✅ Frontend integration steps


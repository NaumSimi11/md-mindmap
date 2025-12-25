# 🐛 Critical Bugs Analysis - December 25, 2025

## 📋 Summary

After implementing Batch Sync, testing revealed **3 critical bugs** that prevent proper document synchronization:

1. ❌ **Content Loss During Push** - Documents pushed to cloud have empty content
2. ❌ **Wrong Workspace Name** - "My Workspace" becomes "Local Workspace"
3. ❌ **Ghost Workspaces** - Old workspaces persist after `clean-everything.sh`

---

## 🔴 Bug #1: Content Loss During Push

### Symptoms
```json
// POST /api/v1/documents
{
  "title": "Auto generated doc test",
  "content": "",           // ❌ EMPTY!
  "yjs_state_b64": "AAA="  // ❌ EMPTY! (just 3 bytes = empty array)
}
```

### Root Cause

**ID Mismatch in Yjs Document Manager**

```typescript
// In SelectiveSyncService.ts
const contentToSave = this.serializeFromYjs(documentId);
const yjsStateB64 = this.extractYjsBinaryBase64(documentId);

// documentId = "doc_7f975d1e-ea2b-4fe9-be0a-82c20c8dc9a5"
// But Yjs stores it as "7f975d1e-ea2b-4fe9-be0a-82c20c8dc9a5" (no prefix!)
```

**Flow**:
1. User creates document offline → stored as `doc_UUID` in IndexedDB
2. User clicks "Push to Cloud"
3. `SelectiveSyncService.pushDocument(documentId)` is called with `doc_UUID`
4. `serializeFromYjs(doc_UUID)` tries to find Yjs document
5. Yjs document is stored under `UUID` (without `doc_` prefix)
6. **Mismatch!** → Returns empty content
7. Empty content sent to backend

### Evidence

**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

```typescript
// Line 390-407
private serializeFromYjs(documentId: string): string {
  try {
    const instance = yjsDocumentManager.getDocument(documentId, { enableWebSocket: false });
    //                                              ^^^^^^^^^^
    //                                              This might be "doc_UUID"
    if (!instance || !instance.ydoc) {
      throw new Error('Cannot push without Yjs doc');  // ❌ Throws or returns empty
    }
    // ... serialization
  }
}

// Line 412-421
private extractYjsBinaryBase64(documentId: string): string | null {
  try {
    const binary = yjsDocumentManager.getYjsBinarySnapshot(documentId);
    //                                                      ^^^^^^^^^^
    //                                                      Same issue here
    if (!binary) return null;  // ❌ Returns null
    return buffer.toBase64(binary);
  }
}
```

**File**: `frontend/src/hooks/useYjsDocument.ts` (Line 45-48)

```typescript
// 🔥 BUG FIX #7: Normalize document ID for Yjs
const normalizedDocId = documentId.startsWith('doc_') 
  ? documentId.slice(4)  // Remove doc_ prefix
  : documentId;

// Use normalized ID for Yjs
const instance = yjsDocumentManager.getDocument(normalizedDocId, {...});
```

**This normalization exists in `useYjsDocument` but NOT in `SelectiveSyncService`!**

### Fix Required

Normalize `documentId` in `SelectiveSyncService.pushDocument()` before calling serialization methods:

```typescript
// In pushDocument(), before serialization:
const normalizedDocId = documentId.startsWith('doc_') 
  ? documentId.slice(4) 
  : documentId;

const contentToSave = this.serializeFromYjs(normalizedDocId);  // ✅ Use normalized ID
const yjsStateB64 = this.extractYjsBinaryBase64(normalizedDocId);  // ✅ Use normalized ID
```

---

## 🔴 Bug #2: Wrong Workspace Name

### Symptoms
```
User creates: "My Workspace"
Backend receives: "Local Workspace"
```

### Root Cause

**Hardcoded Fallback in Workspace Creation**

**File**: `frontend/src/services/sync/SelectiveSyncService.ts` (Line 223)

```typescript
private async ensureWorkspaceExists(workspaceId: string, localWorkspace: Workspace | null): Promise<string> {
  // ...
  const workspaceName = localWorkspace?.name || 'Local Workspace';  // ❌ HARDCODED!
  //                                            ^^^^^^^^^^^^^^^^^^
  const workspaceDescription = localWorkspace?.description || '';
  
  const cloudWorkspace = await apiWorkspace.createWorkspace({
    name: workspaceName,  // ❌ Sends "Local Workspace" if localWorkspace is null
    description: workspaceDescription,
  });
}
```

### Why is `localWorkspace` null?

**File**: `frontend/src/services/sync/SelectiveSyncService.ts` (Line 481-487)

```typescript
// Get workspace and folder info from local storage for cascading creation
let localWorkspace: Workspace | null = currentWorkspace;

// Try to get workspace from local cache if not current
if (!localWorkspace) {
  const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
  localWorkspace = allWorkspaces.find(w => w.id === workspaceId) || null;
}
```

**Problem**: When user is offline and creates "My Workspace", it's stored in `GuestWorkspaceService`, but this code only checks `BackendWorkspaceService`!

### Fix Required

Load workspace from `GuestWorkspaceService` if not found in backend:

```typescript
// Try to get workspace from local cache if not current
if (!localWorkspace) {
  // Try backend first
  const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
  localWorkspace = allWorkspaces.find(w => w.id === workspaceId) || null;
  
  // ✅ NEW: If still not found, try guest service
  if (!localWorkspace) {
    const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
    localWorkspace = guestWorkspaces.find(w => w.id === workspaceId) || null;
  }
}
```

---

## 🔴 Bug #3: Ghost Workspaces After Clean

### Symptoms

After running `./clean-everything.sh`, user still sees 3 workspaces:

```json
{
  "items": [
    {
      "id": "88eb2f23-ee17-465c-8848-2a36a9bb0376",
      "name": "Local Workspace",
      "created_at": "2025-12-24T18:45:12.734588"  // ❌ Created AFTER clean!
    },
    {
      "id": "6c27dc8d-49b3-451d-a10d-e41105776bbe",
      "name": "Cloud Workspace",
      "created_at": "2025-12-23T23:55:52.232337"  // ❌ OLD (before clean)
    },
    {
      "id": "d86d993f-24fa-4b64-9fac-4155419383db",
      "name": "Naum Workspace",
      "created_at": "2025-12-23T23:52:08.890452"  // ❌ OLD (before clean)
    }
  ]
}
```

### Root Cause

**Seed Script Recreates Workspaces Automatically**

**File**: `backendv2/scripts/create_test_users.py` (Line 142-160)

```python
# Create default workspace for user3 (Naum)
result = await session.execute(
    select(Workspace).where(
        Workspace.owner_id == user3.id,
        Workspace.slug == "naum-workspace"
    )
)
existing_workspace3 = result.scalar_one_or_none()

if existing_workspace3:
    print("   ⚠️  Workspace already exists: Naum Workspace")
else:
    workspace3 = Workspace(
        name="Naum Workspace",  # ❌ Auto-created!
        slug="naum-workspace",
        owner_id=user3.id
    )
    session.add(workspace3)
```

**This script is called by `start-services.sh` with `--with-user` flag!**

**File**: `start-services.sh` (Line 195-203)

```bash
# Seed test users if --with-user flag is set
if [ "$SEED_USER" = true ]; then
  echo -e "${BLUE}👤 Seeding test users...${NC}"
  cd "$BACKEND_DIR"
  source venv/bin/activate
  QUIET_MODE=true python scripts/create_test_users.py  # ❌ Creates workspaces!
  deactivate
  cd "$PROJECT_ROOT"
  echo -e "${GREEN}✅ Test users seeded${NC}"
fi
```

### Why Old Workspaces Persist?

**The `clean-everything.sh` script only clears Docker volumes:**

```bash
# Clear Docker volumes for PostgreSQL and Redis
echo -e "${BLUE}🗑️  Clearing PostgreSQL database...${NC}"
docker volume rm mdreader_v2_postgres_data > /dev/null 2>&1 || true

echo -e "${BLUE}🗑️  Clearing Redis cache...${NC}"
docker volume rm mdreader_v2_redis_data > /dev/null 2>&1 || true
```

**But if Docker containers are still running, the volumes might not be fully cleared!**

### Fix Required

1. **Stop Docker containers BEFORE clearing volumes**:

```bash
# In clean-everything.sh, BEFORE clearing volumes:
echo -e "${BLUE}🛑 Stopping Docker containers...${NC}"
docker-compose down
```

2. **Option A**: Don't seed workspaces automatically (only users)
3. **Option B**: Add a flag to skip workspace seeding

---

## 🎯 Priority Fixes

### High Priority (Blocking)
1. ✅ **Fix Bug #1** - Content loss (ID normalization in SelectiveSyncService)
2. ✅ **Fix Bug #2** - Wrong workspace name (load from GuestWorkspaceService)

### Medium Priority
3. ✅ **Fix Bug #3** - Ghost workspaces (stop Docker before clearing volumes)

---

## 📝 Implementation Plan

### Fix #1: ID Normalization in SelectiveSyncService

**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

**Changes**:
```typescript
async pushDocument(documentId: string, liveContent?: string, retryCount: number = 0): Promise<SyncResult> {
  // ... auth checks ...
  
  // 🔥 FIX: Normalize document ID for Yjs
  const normalizedDocId = documentId.startsWith('doc_') 
    ? documentId.slice(4) 
    : documentId;
  
  // Use normalized ID for serialization
  const contentToSave = this.serializeFromYjs(normalizedDocId);
  const yjsStateB64 = this.extractYjsBinaryBase64(normalizedDocId);
  
  // Rest of the function...
}
```

### Fix #2: Load Workspace from Guest Service

**File**: `frontend/src/services/sync/SelectiveSyncService.ts`

**Changes**:
```typescript
// Get workspace and folder info from local storage for cascading creation
let localWorkspace: Workspace | null = currentWorkspace;

// Try to get workspace from local cache if not current
if (!localWorkspace) {
  // Try backend first
  const allWorkspaces = await backendWorkspaceService.getAllWorkspaces();
  localWorkspace = allWorkspaces.find(w => w.id === workspaceId) || null;
  
  // 🔥 FIX: If still not found, try guest service
  if (!localWorkspace) {
    const guestWorkspaces = await guestWorkspaceService.getAllWorkspaces();
    localWorkspace = guestWorkspaces.find(w => w.id === workspaceId) || null;
  }
}
```

### Fix #3: Improve Clean Script

**File**: `clean-everything.sh`

**Changes**:
```bash
# Stop all services FIRST
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
./stop-services.sh

# Stop Docker containers
echo -e "${BLUE}🛑 Stopping Docker containers...${NC}"
docker-compose down

# NOW clear volumes
echo -e "${BLUE}🗑️  Clearing PostgreSQL database...${NC}"
docker volume rm mdreader_v2_postgres_data > /dev/null 2>&1 || true
```

---

## ✅ Testing Plan

After fixes:

1. **Test Content Preservation**:
   - Logout → Create doc with content → Login → Push → Verify content exists
   
2. **Test Workspace Name**:
   - Logout → Create workspace "My Test Workspace" → Create doc → Login → Push → Verify workspace name

3. **Test Clean Script**:
   - Run `./clean-everything.sh` → Start app → Verify only 1 workspace exists (the one you create)

---

## 📊 Impact Assessment

| Bug | Severity | Impact | Users Affected |
|-----|----------|--------|----------------|
| #1: Content Loss | 🔴 Critical | Data loss | 100% |
| #2: Wrong Name | 🟡 Medium | Confusing UX | 100% |
| #3: Ghost Workspaces | 🟡 Medium | Cluttered UI | Developers only |

---

**Status**: 🔴 **CRITICAL BUGS - IMMEDIATE FIX REQUIRED**

**Next Step**: Implement fixes and test thoroughly.


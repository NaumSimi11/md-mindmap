# 🔍 Offline Mode Debug Logs Reference

Quick guide to understanding console logs during offline/login flows.

---

## 🔐 Login Flow - Expected Logs

### **1. User Clicks "Login"**
```
🔐 AuthService.login() called
✅ Login response received: { hasUser: false, hasToken: true }
📞 Fetching user via /me...
✅ User fetched: { username: "...", email: "..." }
✅ Login successful, user set: [username]
```

### **2. WorkspaceContext Initializes**
```
🔵 WorkspaceContext init triggered: { isAuthenticated: true, hasUser: true, userId: "...", authLoading: false }
🔄 Initializing workspace for user: [username]
```

### **3. Workspace Service Loads**
```
📦 API Response: {workspaces: Array(X), total: X, ...}
📦 Workspaces array: (X) [{…}, {…}, ...]
📦 Current workspace: {id: "...", name: "...", ...}
✅ Loaded X documents
✅ Backend workspace initialized: [workspace-name]
```

### **4. Context Updates State**
```
✅ Workspace context initialized: [workspace-name] with X docs
```

### **✅ SUCCESS**: Workspaces and documents visible immediately (no refresh needed!)

---

## 📴 Offline Document Creation - Expected Logs

### **1. User Goes Offline**
```
📴 SyncManager: Offline
📴 Gone offline
📴 Network: Offline
```

### **2. User Clicks "+ New"**
```
🔵 WorkspaceContext.createDocument() called: { type: "markdown", title: "...", currentWorkspace: "..." }
```

### **3. Offline Service Creates Document**
```
🔵 OfflineWorkspaceService.createDocument() called, isOnline: false
📴 Creating document offline...
✅ Current workspace: [name] ([id])
📝 Creating document with temp ID: [uuid]
```

### **4. Store in IndexedDB**
```
💾 Storing document in IndexedDB...
✅ Stored in IndexedDB
```

### **5. Queue for Sync**
```
📋 Queuing document for sync...
📋 SyncManager.queueChange(): { operation: "create", entity_type: "document", ... }
📝 Change queued: create document [uuid] (Total pending: 1)
✅ Queued for sync
```

### **6. Update Local State**
```
📊 Updated backend service: X → Y documents
📴 Document created offline, queued for sync
📄 Document created by service: { id: "...", title: "...", ... }
📊 getAllDocuments() returned Y documents
✅ State updated with Y documents
```

### **✅ SUCCESS**: Document appears in sidebar immediately!

---

## 📝 Offline Document Editing - Expected Logs

### **User Types in Editor (Auto-save)**
```
🔄 OfflineWorkspaceService.updateDocument([id]): { isOnline: false, updates: ["content"] }
💾 Updating IndexedDB...
✅ IndexedDB updated
📋 Queuing update for sync...
📋 SyncManager.queueChange(): { operation: "update", entity_type: "document", ... }
📝 Change queued: update document [uuid] (Total pending: 2)
📝 Document update queued for sync
```

---

## 🌐 Going Online & Sync - Expected Logs

### **1. Network Reconnects**
```
🌐 SyncManager: Online
✅ Back online
🌐 Network: Online
```

### **2. Sync Starts**
```
🔄 syncNow() called, isOnline: true, isSyncing: false
🔄 Starting sync...
📦 Found 2 pending changes to sync
📦 Syncing 2 changes...
```

### **3. Sync CREATE Operation**
```
   → Syncing create document [temp-id]...
   🔍 Checking for pending updates with old ID: [temp-id]
   🔄 Converting 1 pending updates from [temp-id] → [real-id]
      ↳ Converting pending change [change-id]
   ✅ All 1 pending updates converted
   ✓ Document created: [real-id]
```

### **4. Frontend Updates**
```
🔄 Document synced: [temp-id] → [real-id]
✅ Updated backend service state with synced document
📊 Sync event: X docs → removing [temp-id] and [real-id] → Y → adding [real-id]
```

### **5. Sync UPDATE Operation**
```
   → Syncing update document [real-id]...
   ✓ Document updated: [real-id]
```

### **6. Sync Complete**
```
✅ Sync complete: 2 synced, 0 failed, 0 conflicts
```

### **✅ SUCCESS**: All changes synced, no errors!

---

## 🚨 Common Issues & Their Logs

### **Issue: Workspace Not Loading After Login**
```
❌ BAD:
🔵 WorkspaceContext init triggered: { authLoading: true }
⏳ Waiting for auth to finish loading...
(gets stuck here)

✅ GOOD:
🔵 WorkspaceContext init triggered: { authLoading: false, isAuthenticated: true, hasUser: true }
🔄 Initializing workspace for user: ...
```

### **Issue: Document Not Appearing in Sidebar**
```
❌ BAD:
📊 getAllDocuments() returned 0 documents
(or document count doesn't increase)

✅ GOOD:
📊 Updated backend service: 5 → 6 documents
📊 getAllDocuments() returned 6 documents
✅ State updated with 6 documents
```

### **Issue: Sync Loop (Retrying Forever)**
```
❌ BAD:
   ✗ Document not found in IndexedDB: [old-temp-id]
⚠️ Change [id] will retry (attempt 1/3)
(repeats endlessly)

✅ GOOD:
   ⚠️ Document [old-temp-id] not found in IndexedDB (may have been converted to new ID)
   🧹 Cleaned up orphaned pending change
```

### **Issue: Content Not Saved**
```
❌ BAD:
🔍 Checking for pending updates with old ID: [temp-id]
ℹ️ No pending updates to convert
(updates were deleted instead of converted)

✅ GOOD:
🔍 Checking for pending updates with old ID: [temp-id]
🔄 Converting 1 pending updates from [temp-id] → [real-id]
✅ All 1 pending updates converted
```

---

## 🎯 Quick Debug Checklist

### **Login Issues:**
1. Look for `✅ Login successful, user set`
2. Check `authLoading: false` in init trigger
3. Verify `✅ Backend workspace initialized`
4. Confirm `✅ Workspace context initialized: ... with X docs`

### **Offline Creation Issues:**
1. Look for `📴 Document created offline, queued for sync`
2. Check `📊 Updated backend service: X → Y documents`
3. Verify `✅ State updated with Y documents`

### **Sync Issues:**
1. Look for `🔄 Converting X pending updates`
2. Check for `✅ All X pending updates converted`
3. Verify `✅ Sync complete: X synced, 0 failed`
4. No retry loops or errors

---

## 💡 Pro Tips

1. **Open Console Before Login** - Catch all initialization logs
2. **Filter by Emoji** - Search for 🔵, 📴, ✅, ❌ to find key events
3. **Count Documents** - Track document count through the flow
4. **Check Pending Changes** - Look for "Total pending: X" messages

---

**Last Updated**: Phase 2 Complete


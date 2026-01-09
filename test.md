things tha tneed to be done :
-tempaltes to be fixes ( design and the creating from design ) (  where do we use templates? we use tehmplates in the new document dialog, we use template in the home workspacace page )  to be add more comprehensive templates ( check notions and other shits ) 
 - we should bring more templates ( i know ive written this - i need a fking nice shit as notion as capcat and all other shits. )
 - workspace dahsboard whould have more templaty preview - it's too basic now ( even looks nice ) 

 - the main landing page should  get reworked wiht the premium style templates. 


- ✅ DONE: added X button next to document title to close and go back to workspace home 

- ✅ DONE: import more document types - added mammoth for Word (.docx) and xlsx for Excel (.xlsx/.xls) conversion to Markdown   
- export more types of documents ( maybe )
- organize the export - export or save - now we have export to md, and that is, we shoyld think how can we organize that better, it it's ok as it is :) 

 - ✅ DONE: wired settings page to global Zustand store (userPreferencesStore) - theme, font size, toolbar style, spellcheck, auto-save, AI settings now apply globally and persist
 - ✅ DONE: added toolbar visibility controls in Settings > Appearance - can now show/hide Action Bar, Formatting Toolbar, and Side Toolbar

 - the createion document dialog to be redesigned - now it's nice ui, but bad UX i think. 
 - ✅ DONE: updated UnifiedAIModal with premium glassmorphism styling (tabs, quick actions, buttons)

 - ✅ DONE: improved light theme contrast - stronger shadows, visible borders, better section definition in sidebar/header/cards
 - ✅ DONE: fixed recent documents card alignment in WorkspaceHome.tsx
 - the chat ai to be fixes - and implemented SIMPLE chat - ( we can let this for later, we will implement cli )
 - llm cli to be think about. this is relarted with the chat

 - to add  more fast text comands in the toolbar tiptap

 - the size - we should take care do not have initial size ( whole height ) if the editor scollable - we have problem sometimes with the scroll , this need to be redefined and taking care for it. 

 - ✅ DONE: removed collaboration icon and sidebar from Workspace.tsx

 - ✅ DONE: removed floating 'Collapse' button from AdaptiveSidebar.tsx


 - ✅ DONE: updated editor/mindmap switcher (MindmapLoadingScreen) with premium orange/amber gradient styling

 - ✅ DONE: updated mindmap dialog (UnifiedDiagramModal) with premium glassmorphism styling

 - we do not show history on not logged users for now - we should hide history if we are not on the cloud - or we shoyld implement offline history ( this to be brainstoemd , leave it for later)

 - we should fix the tauri , and test on tauri from now on 
 - ✅ DONE: updated startup scripts (start-services.sh + start-services.ps1) to ask for Web or Tauri mode interactively

 - ✅ DONE: "Workspace Settings" now works for both guests and logged-in users (removed ProtectedRoute, added dual-mode settings page)
 - ✅ DONE: Documents now correctly belong to specific workspace (fixed merge bug in DocumentDataContext - was keeping old workspace docs)
 - ✅ DONE: Export now uses actual document title (added useEffect to sync title state with documentTitle prop in WYSIWYGEditor)

 - ✅ DONE: Press Enter in New Document modal to create document (added onKeyDown handler)
 - ✅ DONE: Rename Folder now works with proper modal (created RenameFolderModal.tsx, replaced browser prompt())
 - ✅ DONE: Proper "Rename Folder" dialog title (no more "localhost:5173 says")
 - ✅ DONE: Input label changed to "New Name" in rename folder modal
"Import md" inside application is not working. Presents empty document
"Don't have a file? Try a sample" hyperlink is not working
 
 - ✅ DONE: rename na folder (RenameFolderModal implemented)
kreiranje nov dokument mora da e na top of lista
 
md sidebar - node sidebar - single node sidebar
 
kreiranje vo offline / online mode da se proveri 
 
tabot so alatki, na hover - explanation ostanuva pod main board. da se digne gore so z index. 
 
da se dodadat most used tools na isitot bar - so moznost za expand ili whatever 
 
editor label to be removed 
 
 // menu
 
prva najava na tauri - ostanat e refresh token odosno korisnikot e logiran 
levo se loadiraat dokumenti ( local only shown ) 
 
kopce za najava od landing page
 
limit na document length vo sidebar  - +3 more items are not in the preview
 
 

 - - - - testing folders , 08/01/2026
 logged off : cleared all data
 going on the workspace : i can see 2 workspaces - local workspace - cloud workspace ( when i try to switch to the cloud workspace i get this logs : 
 🔄 Switching to workspace: Cloud Workspace
WorkspaceDataContext.tsx:177 🔄 [WorkspaceData] Switching to: Cloud Workspace
WorkspaceSidebar.tsx:111 🔍 WorkspaceSidebar render: {workspace: 'Local Workspace', total: 0, rootDocs: 0, docsInFolders: 0, orphanDocs: 0, …}
WorkspaceDataContext.tsx:199 ❌ [WorkspaceData] Switch failed: Error: Workspace temp_1767866993207 not found
    at GuestWorkspaceService.switchWorkspace (GuestWorkspaceService.ts:422:13)
    at async WorkspaceDataContext.tsx:184:9
    at async handleSwitchWorkspace (Workspace.tsx:453:7)
(anonymous) @ WorkspaceDataContext.tsx:199
await in (anonymous)
handleSwitchWorkspace @ Workspace.tsx:453
onClick @ WorkspaceSwitcher.tsx:68
handleEvent @ chunk-5Q5YC75F.js?v=173a6a92:4
callCallback2 @ chunk-IYNIHSXD.js?v=173a6a92:3674
invokeGuardedCallbackDev @ chunk-IYNIHSXD.js?v=173a6a92:3699
invokeGuardedCallback @ chunk-IYNIHSXD.js?v=173a6a92:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-IYNIHSXD.js?v=173a6a92:3736
executeDispatch @ chunk-IYNIHSXD.js?v=173a6a92:7014
processDispatchQueueItemsInOrder @ chunk-IYNIHSXD.js?v=173a6a92:7034
processDispatchQueue @ chunk-IYNIHSXD.js?v=173a6a92:7043
dispatchEventsForPlugins @ chunk-IYNIHSXD.js?v=173a6a92:7051
(anonymous) @ chunk-IYNIHSXD.js?v=173a6a92:7174
batchedUpdates$1 @ chunk-IYNIHSXD.js?v=173a6a92:18913
batchedUpdates @ chunk-IYNIHSXD.js?v=173a6a92:3579
dispatchEventForPluginEventSystem @ chunk-IYNIHSXD.js?v=173a6a92:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-IYNIHSXD.js?v=173a6a92:5478
dispatchEvent @ chunk-IYNIHSXD.js?v=173a6a92:5472
dispatchDiscreteEvent @ chunk-IYNIHSXD.js?v=173a6a92:5449
Workspace.tsx:460 ❌ Failed to switch workspace: Error: Workspace temp_1767866993207 not found
    at GuestWorkspaceService.switchWorkspace (GuestWorkspaceService.ts:422:13)
    at async WorkspaceDataContext.tsx:184:9
    at async handleSwitchWorkspace (Workspace.tsx:453:7)
handleSwitchWorkspace @ Workspace.tsx:460
await in handleSwitchWorkspace
onClick @ WorkspaceSwitcher.tsx:68
handleEvent @ chunk-5Q5YC75F.js?v=173a6a92:4
callCallback2 @ chunk-IYNIHSXD.js?v=173a6a92:3674
invokeGuardedCallbackDev @ chunk-IYNIHSXD.js?v=173a6a92:3699
invokeGuardedCallback @ chunk-IYNIHSXD.js?v=173a6a92:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-IYNIHSXD.js?v=173a6a92:3736
executeDispatch @ chunk-IYNIHSXD.js?v=173a6a92:7014
processDispatchQueueItemsInOrder @ chunk-IYNIHSXD.js?v=173a6a92:7034
processDispatchQueue @ chunk-IYNIHSXD.js?v=173a6a92:7043
dispatchEventsForPlugins @ chunk-IYNIHSXD.js?v=173a6a92:7051
(anonymous) @ chunk-IYNIHSXD.js?v=173a6a92:7174
batchedUpdates$1 @ chunk-IYNIHSXD.js?v=173a6a92:18913
batchedUpdates @ chunk-IYNIHSXD.js?v=173a6a92:3579
dispatchEventForPluginEventSystem @ chunk-IYNIHSXD.js?v=173a6a92:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-IYNIHSXD.js?v=173a6a92:5478
dispatchEvent @ chunk-IYNIHSXD.js?v=173a6a92:5472
dispatchDiscreteEvent @ chunk-IYNIHSXD.js?v=173a6a92:5449
WorkspaceSidebar.tsx:111 🔍 WorkspaceSidebar render: {workspace: 'Local Workspace', total: 0, rootDocs: 0, docsInFolders: 0, orphanDocs: 0, …}

and im returned to local workspace)

- workspace sidebar ( local workspace ) has 2 folders : 
 - Getting Started folder
 - Quick Notes folder

 Creating new document - ( i dont have control if i create a document into any folder - main folder issue i guess ) , i do create document test 1, document is created in the workspace Local workspace - in the root. Move documents into getting started folder, adding some data into the document. Doing regresh, the document is still in the folder. 



i can see this logs here : 
WorkspaceSidebar.tsx:121 ⚠️ Orphan documents (folder_id points to non-existent folder): 
[{…}]
0
: 
folderId
: 
"fld_2c4e57bb-184d-4fe6-804a-df29459a016f"
title
: 
"test1"
[[Prototype]]
: 
Object
length
: 
1
[[Prototype]]
: 
Array(0)
useBackendFolders.ts:77 ✅ Loaded 2 local folder(s) for workspace ws_9bd6c434-b134-4681-9d96-c32f95eb0be0
useBackendFolders.ts:97 ✅ Built folder tree with 2 root folder(s)
WorkspaceSidebar.tsx:111 🔍 WorkspaceSidebar render: 
{workspace: 'Local Workspace', total: 1, rootDocs: 0, docsInFolders: 1, orphanDocs: 0, …}
WorkspaceSidebar.tsx:111 🔍 WorkspaceSidebar render: 
{workspace: 'Local Workspace', total: 1, rootDocs: 0, docsInFolders: 1, orphanDocs: 0, …}
106
snapshotClient.ts:174 📴 [Snapshot] Skipping retry - user not authenticated (guest/offline mode)
AutoSyncManager.ts:348 🔄 [AutoSync] App visible - checking queue
workspaceMembersClient.ts:191 📴 [WorkspaceMembersClient] getUserWorkspaces called while not authenticated; returning empty list
3
snapshotClient.ts:174 📴 [Snapshot] Skipping retry - user not authenticated (guest/offline mode)


==========================================
E2E TEST PLAN - Based on Manual Testing
==========================================

## **PHASE 1: Create Test Infrastructure**

**Create:** `e2e/folders-workspace-switching.spec.ts`

**Test Setup Pattern:**
```typescript
test.describe('Folder and Workspace Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all data before each test
    await page.evaluate(() => {
      // Clear IndexedDB
      return new Promise((resolve) => {
        const dbs = indexedDB.databases();
        dbs.then(databases => {
          const promises = databases.map(db =>
            new Promise((res) => {
              indexedDB.deleteDatabase(db.name).onsuccess = () => res();
            })
          );
          Promise.all(promises).then(resolve);
        });
      });
    });

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());

    // Navigate to workspace
    await page.goto('/workspace');
  });
});
```

## **PHASE 2: Test Suites to Create**

### **Test Suite 1: Workspace Switching Behavior**

**File:** `e2e/workspace-switching.spec.ts`

**Tests to implement:**
```typescript
test('should show local and cloud workspaces after login', async ({ page, auth }) => {
  // 1. Login with authenticated user
  // 2. Verify 2 workspaces shown: "Local Workspace" + user's cloud workspace
  // 3. Attempt to switch to cloud workspace
  // 4. Verify successful switch OR proper error handling
});

test('should handle workspace switching errors gracefully', async ({ page }) => {
  // 1. Create scenario that triggers temp ID error
  // 2. Attempt workspace switch
  // 3. Verify user is returned to current workspace
  // 4. Verify error is logged but doesn't crash app
});
```

### **Test Suite 2: Default Folder Creation**

**File:** `e2e/folder-defaults.spec.ts`

**Tests to implement:**
```typescript
test('should create default folders in local workspace', async ({ page }) => {
  // 1. Start in guest mode (no login)
  // 2. Navigate to workspace
  // 3. Verify "Getting Started" and "Quick Notes" folders exist
  // 4. Verify folders are empty (no documents)
});

test('should create default folders for new authenticated workspaces', async ({ page, auth }) => {
  // 1. Login and create new workspace
  // 2. Verify default folders are created
  // 3. Verify folders appear in sidebar
});
```

### **Test Suite 3: Document Creation & Folder Assignment**

**File:** `e2e/document-folder-creation.spec.ts`

**Tests to implement:**
```typescript
test('should create document in workspace root when no folder selected', async ({ page }) => {
  // 1. Click "New Doc" button
  // 2. Create document without folder selection
  // 3. Verify document appears in root of current workspace
  // 4. Verify document is NOT in any folder
});

test('should allow document creation directly in folders', async ({ page }) => {
  // 1. Right-click on folder in sidebar
  // 2. Select "Create Document in Folder" (if implemented)
  // 3. OR implement folder selection in New Document modal
  // 4. Verify document appears inside selected folder
});

test('should show folder assignment in document properties', async ({ page }) => {
  // 1. Create document in folder
  // 2. Open document
  // 3. Verify folder information is displayed
  // 4. Verify breadcrumb navigation shows folder path
});
```

### **Test Suite 4: Document Movement & Drag-Drop**

**File:** `e2e/document-movement.spec.ts`

**Tests to implement:**
```typescript
test('should move document from root to folder via drag-drop', async ({ page }) => {
  // 1. Create document in workspace root
  // 2. Drag document from sidebar root to folder
  // 3. Verify document appears in folder
  // 4. Verify document disappears from root
});

test('should move document between folders', async ({ page }) => {
  // 1. Create document in Folder A
  // 2. Drag to Folder B
  // 3. Verify document moved correctly
  // 4. Verify folder counts update
});

test('should handle invalid drag-drop operations', async ({ page }) => {
  // 1. Try to drag folder into document (should fail)
  // 2. Try to drag document to invalid location
  // 3. Verify operations are rejected gracefully
});
```

### **Test Suite 5: Persistence & Refresh Behavior**

**File:** `e2e/folder-persistence.spec.ts`

**Tests to implement:**
```typescript
test('should persist document folder assignment across refresh', async ({ page }) => {
  // 1. Create document and move to folder
  // 2. Add content to document
  // 3. Refresh page
  // 4. Verify document is still in folder
  // 5. Verify content is preserved
});

test('should maintain folder hierarchy across sessions', async ({ page }) => {
  // 1. Create nested folder structure
  // 2. Add documents to various folders
  // 3. Close/reopen browser
  // 4. Verify entire structure is restored
});
```

### **Test Suite 6: Orphan Document Detection**

**File:** `e2e/orphan-detection.spec.ts`

**Tests to implement:**
```typescript
test('should detect and handle orphan documents', async ({ page }) => {
  // 1. Create document in folder
  // 2. Delete folder (with documents inside)
  // 3. Verify orphan document warning appears in console
  // 4. Verify document is moved to root or handled appropriately
});

test('should clean up orphan references on folder recreation', async ({ page }) => {
  // 1. Create orphan scenario
  // 2. Recreate folder with same name/id
  // 3. Verify orphan documents are associated with new folder
});
```

### **Test Suite 7: Error Handling & Edge Cases**

**File:** `e2e/folder-error-handling.spec.ts`

**Tests to implement:**
```typescript
test('should handle folder deletion with documents', async ({ page }) => {
  // 1. Create folder with documents
  // 2. Attempt to delete folder
  // 3. Verify confirmation dialog appears
  // 4. Verify cascade delete option works
});

test('should prevent circular folder references', async ({ page }) => {
  // 1. Create nested folders A > B > C
  // 2. Try to move A into C (should fail)
  // 3. Verify error message appears
});
```

## **IMPLEMENTATION PLAN:**

**Step 1:** Create base test infrastructure with data clearing utilities
**Step 2:** Implement workspace switching tests (most critical bug)
**Step 3:** Add folder creation and default folder tests
**Step 4:** Implement document movement tests
**Step 5:** Add persistence and orphan detection tests
**Step 6:** Add error handling tests

**Each test should:**
- ✅ Start with clean browser state
- ✅ Use proper Playwright selectors
- ✅ Include both positive and negative test cases
- ✅ Verify both UI behavior and data persistence
- ✅ Include proper error handling

**You implement, I review and help debug!** 🚀


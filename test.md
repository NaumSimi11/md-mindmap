cleard indexdb : 
Promise {<pending>}
VM47042:5 🗑️ Deleting: mdreader-08a58a8a-270d-41ea-a499-4bfab021ccd0
VM47042:5 🗑️ Deleting: mdreader-doc_08a58a8a-270d-41ea-a499-4bfab021ccd0
VM47042:5 🗑️ Deleting: mdreader-yjs-storage
VM47042:9 ✅ All IndexedDB cleared

hard refresh ( browser 1 ) 
[vite] connecting...
client:618 [vite] connected.
chunk-RZQ6P3FR.js?v=bf574671:21551 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
WorkspaceService.ts:93 ✅ Workspace loaded: My Workspace
SyncManager.ts:123 🔄 SyncManager initialized
YjsDocumentManager.ts:39 🔧 YjsDocumentManager initialized
verifyImplementation.ts:558 💡 Run verifyImplementation() in console to test implementation
main.tsx:17 
╔═══════════════════════════════════════════════════════════╗
║                 MDREADER STARTING                         ║
╚═══════════════════════════════════════════════════════════╝

main.tsx:65 🔧 [Step 1] Initializing app infrastructure...
AppInitialization.ts:23 🚀 Initializing application...
AppInitialization.ts:40 🌐 Web mode detected
migrateToIndexedDB.ts:207 🔄 Checking for localStorage → IndexedDB migration...
OfflineDatabase.ts:161 ✅ Offline database initialized
migrateToIndexedDB.ts:212 ✅ Migration already completed
GuestWorkspaceService.ts:144 🔵 GuestWorkspaceService.init()
SyncManager.ts:119 🧹 Cleared all pending changes on init (temporary fix for orphaned data)
GuestWorkspaceService.ts:175 👋 Welcome back, 🔮 Mystic! (Session #8)
GuestWorkspaceService.ts:211 📦 Loaded 1 workspace(s)
GuestWorkspaceService.ts:154 ✅ GuestWorkspaceService initialized
AppInitialization.ts:52 ✅ Application initialized
AppInitialization.ts:53    - Platform: Web (Browser)
AppInitialization.ts:54    - Storage: IndexedDB (migrated from localStorage)
AppInitialization.ts:55    - Guest Workspace: Ready
AppInitialization.ts:56    - Backend Services: Ready
main.tsx:69 🔧 [Step 2] Initializing managers...
main.tsx:25 🚀 Initializing production managers...
main.tsx:29 📦 [1/2] Initializing UnifiedSyncManager...
UnifiedSyncManager.ts:100 Environment detected: {platform: 'WEB', network: 'ONLINE', auth: 'AUTHENTICATED', userId: '2b61c86b-2c86-4471-9ef6-a5dedef0ffcb', deviceId: 'device_1766226044820_8bg4kw63v'}
StorageProviderFactory.ts:57 🗄️  Creating IndexedDBStorageProvider (platform: WEB) - Reason: default canonical storage
StorageProviderFactory.ts:20 🗄️  Creating IndexedDBStorageProvider (platform: WEB)
UnifiedSyncManager.ts:104 Storage provider initialized: {provider: 'IndexedDB', used: 189689, available: 147064127853, total: 147064317542}
UnifiedSyncManager.ts:333 🔄 Connection state: CONNECTING
UnifiedSyncManager.ts:333 🔄 Connection state: CONNECTED
UnifiedSyncManager.ts:121 ✅ Sync manager initialized successfully
main.tsx:32 ✅ UnifiedSyncManager ready
main.tsx:35 📦 [2/2] Initializing DocumentLifecycleManager...
UnifiedSyncManager.ts:91 Sync manager already initialized
init @ UnifiedSyncManager.ts:91
init @ DocumentLifecycleManager.ts:88
initializeManagers @ main.tsx:37
await in initializeManagers
(anonymous) @ main.tsx:70
await in (anonymous)
(anonymous) @ main.tsx:104
DocumentLifecycleManager.ts:91 ✅ Document lifecycle manager initialized
main.tsx:38 ✅ DocumentLifecycleManager ready
main.tsx:45 
╔═══════════════════════════════════════════════════════════╗
║              MANAGERS INITIALIZED                         ║
║  ✅ UnifiedSyncManager                                    ║
║  ✅ DocumentLifecycleManager                              ║
║  ✅ YjsDocumentManager (legacy)                           ║
╚═══════════════════════════════════════════════════════════╝

main.tsx:73 🔧 [Step 3] Rendering app...
main.tsx:82 
╔═══════════════════════════════════════════════════════════╗
║              MDREADER READY                               ║
╚═══════════════════════════════════════════════════════════╝

Workspace.tsx:165 🔍 [Workspace] Looking for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:166 🔍 [Workspace] Available documents: 0
react-router-dom.js?v=bf574671:4393 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ react-router-dom.js?v=bf574671:4393
logDeprecation @ react-router-dom.js?v=bf574671:4396
logV6DeprecationWarnings @ react-router-dom.js?v=bf574671:4399
(anonymous) @ react-router-dom.js?v=bf574671:5271
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
react-router-dom.js?v=bf574671:4393 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ react-router-dom.js?v=bf574671:4393
logDeprecation @ react-router-dom.js?v=bf574671:4396
logV6DeprecationWarnings @ react-router-dom.js?v=bf574671:4402
(anonymous) @ react-router-dom.js?v=bf574671:5271
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
WorkspaceContext.tsx:155 🔵 [FIX 11] WorkspaceContext init triggered: {epoch: 'auth:guest', previousEpoch: null, isAuthenticated: false, authCheck: true, hasUser: false, …}
WorkspaceContext.tsx:213 ⏳ Authenticated but user object not ready yet, waiting 100ms...
BackendWorkspaceService.ts:746 🔍 [getDocument] Cache check for 08a58a8a-270d-41ea-a499-4bfab021ccd0: {found: true, syncStatus: 'synced', hasContent: false, contentLength: 0, updatedAt: '2025-12-20T10:28:26.221479'}
BackendWorkspaceService.ts:776 📥 [getDocument] Fetching from backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:262 ✅ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has content: <paragraph>test 2 intro changes to be pushed sync ...
BackendWorkspaceService.ts:783 ✅ [getDocument] Updated cache from backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0, content: 72 chars
YjsDocumentManager.ts:116 🆕 Creating new Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:124 📄 [EXPERT] Creating empty Yjs document (content initialized separately)
YjsDocumentManager.ts:199 📴 WebSocket disabled for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (guest mode or offline)
SnapshotManager.ts:40 📸 [Snapshot] Manager initialized for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (debounce: 3000ms)
YjsDocumentManager.ts:213 📸 [STEP 5] Snapshot manager enabled for 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:230 ✅ Yjs document created: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WorkspaceContext.tsx:884 🧬 [STEP 4] [STAGE 2 ENFORCEMENT] Hydrating from binary truth: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (180 chars b64)
WorkspaceContext.tsx:888 ✅ [STEP 4] Binary truth established. Markdown fallback will be ignored.
Workspace.tsx:182 📄 [Workspace] Document found: {id: '08a58a8a-270d-41ea-a499-4bfab021ccd0', title: 'test 2', hasContent: true, contentLength: 72, contentPreview: '<paragraph>test 2 intro changes to be pushed sync  tet test </paragraph>', …}
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:136 🚀 Requesting Yjs document from manager: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:137    Mode: Guest
useYjsDocument.ts:138    Online: true
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 2)
Workspace.tsx:165 🔍 [Workspace] Looking for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:166 🔍 [Workspace] Available documents: 1
WorkspaceContext.tsx:155 🔵 [FIX 11] WorkspaceContext init triggered: {epoch: 'auth:2b61c86b-2c86-4471-9ef6-a5dedef0ffcb', previousEpoch: null, isAuthenticated: true, authCheck: true, hasUser: true, …}
WorkspaceContext.tsx:231 🔄 Initializing workspace for authenticated user: naum {React isAuthenticated: true, Direct auth check: true, Has user object: true}
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
extensions.ts:157 ✅ [STEP 3] Yjs Collaboration enabled
extensions.ts:180 ℹ️ [STEP 3] WebSocket not available - local-first mode only
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WorkspaceContext.tsx:218 ⚠️ Still no user object after delay, proceeding with auth check
WorkspaceContext.tsx:231 🔄 Initializing workspace for authenticated user: authenticated user {React isAuthenticated: false, Direct auth check: true, Has user object: false}
WorkspaceContext.tsx:243 📦 Loaded 1 guest workspace(s) from local IndexedDB
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:136 🚀 Requesting Yjs document from manager: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:137    Mode: Authenticated
useYjsDocument.ts:138    Online: true
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 3)
YjsDocumentManager.ts:77 🔄 [UPGRADE] Adding WebSocket to existing document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:105 ✅ [UPGRADE] WebSocket added successfully for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (with auth: true)
YjsDocumentManager.ts:130 💾 IndexedDB synced for 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:181 ✅ Yjs document synced from IndexedDB: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
extensions.ts:157 ✅ [STEP 3] Yjs Collaboration enabled
extensions.ts:169 ✅ [STEP 3] Collaboration cursors enabled (WebSocket available)
BackendWorkspaceService.ts:746 🔍 [getDocument] Cache check for 08a58a8a-270d-41ea-a499-4bfab021ccd0: {found: true, syncStatus: 'synced', hasContent: true, contentLength: 72, updatedAt: '2025-12-20T10:29:55.024872'}
BackendWorkspaceService.ts:764 ✅ [getDocument] Using synced cache: 08a58a8a-270d-41ea-a499-4bfab021ccd0, content: 72 chars
YjsDocumentManager.ts:93 🌐 WebSocket status for 08a58a8a-270d-41ea-a499-4bfab021ccd0: connected
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WorkspaceContext.tsx:243 📦 Loaded 1 guest workspace(s) from local IndexedDB
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 4)
WorkspaceContext.tsx:873 ❌ [INVARIANT VIOLATION] Attempted to hydrate from binary on a non-empty Yjs doc!
hydrateYjsDocument @ WorkspaceContext.tsx:873
await in hydrateYjsDocument
(anonymous) @ WorkspaceContext.tsx:1010
await in (anonymous)
(anonymous) @ Workspace.tsx:169
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
(anonymous) @ chunk-RZQ6P3FR.js?v=bf574671:19328
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
WorkspaceContext.tsx:878 ℹ️ [STEP 4] Yjs document already has content, skipping hydration: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:182 📄 [Workspace] Document found: {id: '08a58a8a-270d-41ea-a499-4bfab021ccd0', title: 'test 2', hasContent: true, contentLength: 72, contentPreview: '<paragraph>test 2 intro changes to be pushed sync  tet test </paragraph>', …}
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:193 📦 API returned 2 workspace(s)
BackendWorkspaceService.ts:204 ✅ Synced 2 workspace(s) from backend
BackendWorkspaceService.ts:135 📦 Loaded 2 workspace(s) from cache
BackendWorkspaceService.ts:141 🔄 Syncing documents for workspace: 1a41a4cb-83c1-4849-bd26-f58c353cd029
WYSIWYGEditor.tsx:234 ✅ [STEP 3] TipTap View is now ready for 08a58a8a-270d-41ea-a499-4bfab021ccd0
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:193 📦 API returned 2 workspace(s)
Workspace.tsx:701 📋 Initial content extracted for outline (48 chars)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
(anonymous) @ chunk-RZQ6P3FR.js?v=bf574671:19328
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
(anonymous) @ chunk-RZQ6P3FR.js?v=bf574671:19328
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:204 ✅ Synced 2 workspace(s) from backend
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:149 ✅ Backend workspace service initialized
BackendWorkspaceService.ts:135 📦 Loaded 2 workspace(s) from cache
BackendWorkspaceService.ts:141 🔄 Syncing documents for workspace: 1a41a4cb-83c1-4849-bd26-f58c353cd029
WorkspaceContext.tsx:248 ☁️ Loaded 2 backend workspace(s) from cloud/cache
WorkspaceContext.tsx:281 ✅ Merged workspaces: 1 local + 2 cloud = 3 total
WorkspaceContext.tsx:282    - Local-only (can push to cloud): 1
WorkspaceContext.tsx:283    - Synced to cloud: 2
WorkspaceContext.tsx:307 ☁️ Loading cloud workspace: Naum Workspace
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:564 🔄 Syncing documents for workspace: Naum Workspace
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
switchWorkspace @ BackendWorkspaceService.ts:565
await in switchWorkspace
init @ WorkspaceContext.tsx:310
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
(anonymous) @ chunk-RZQ6P3FR.js?v=bf574671:19328
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
switchWorkspace @ BackendWorkspaceService.ts:565
await in switchWorkspace
init @ WorkspaceContext.tsx:310
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
(anonymous) @ chunk-RZQ6P3FR.js?v=bf574671:19328
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:149 ✅ Backend workspace service initialized
WorkspaceContext.tsx:248 ☁️ Loaded 2 backend workspace(s) from cloud/cache
WorkspaceContext.tsx:281 ✅ Merged workspaces: 1 local + 2 cloud = 3 total
WorkspaceContext.tsx:282    - Local-only (can push to cloud): 1
WorkspaceContext.tsx:283    - Synced to cloud: 2
WorkspaceContext.tsx:307 ☁️ Loading cloud workspace: Naum Workspace
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:564 🔄 Syncing documents for workspace: Naum Workspace
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:571 ✅ Switched to workspace: Naum Workspace
WorkspaceContext.tsx:314 ✅ Loaded 2 cloud document(s) from backend service
WorkspaceContext.tsx:320 ✅ Workspace context initialized: Naum Workspace
WorkspaceContext.tsx:321 📊 Final state: {workspaces: 3, currentWorkspace: 'Naum Workspace', documents: 1, isLocalOnly: false}
WorkspaceContext.tsx:339 ✅ [FIX 11] Epoch locked: auth:2b61c86b-2c86-4471-9ef6-a5dedef0ffcb
WorkspaceContext.tsx:342 ✅ WorkspaceContext initialization complete (isLoading = false)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
switchWorkspace @ BackendWorkspaceService.ts:565
await in switchWorkspace
init @ WorkspaceContext.tsx:310
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
switchWorkspace @ BackendWorkspaceService.ts:565
await in switchWorkspace
init @ WorkspaceContext.tsx:310
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:571 ✅ Switched to workspace: Naum Workspace
WorkspaceContext.tsx:314 ✅ Loaded 2 cloud document(s) from backend service
WorkspaceContext.tsx:320 ✅ Workspace context initialized: Naum Workspace
WorkspaceContext.tsx:321 📊 Final state: {workspaces: 3, currentWorkspace: 'Naum Workspace', documents: 0, isLocalOnly: false}
WorkspaceContext.tsx:339 ✅ [FIX 11] Epoch locked: auth:guest
WorkspaceContext.tsx:342 ✅ WorkspaceContext initialization complete (isLoading = false)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
SnapshotManager.ts:103 📸 [Snapshot] Creating snapshot for 08a58a8a-270d-41ea-a499-4bfab021ccd0
snapshotClient.ts:30 ☁️ [Snapshot] Pushing to backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0
snapshotClient.ts:49 ✅ [Snapshot] Pushed successfully: 08a58a8a-270d-41ea-a499-4bfab021ccd0
SnapshotManager.ts:116 ✅ [Snapshot] Saved for 08a58a8a-270d-41ea-a499-4bfab021ccd0




browser 2 cleared cache : 
(async () => {
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name.startsWith('mdreader-')) {
      console.log('🗑️ Deleting:', db.name);
      indexedDB.deleteDatabase(db.name);
    }
  }
  console.log('✅ All IndexedDB cleared');
})();
Promise {<pending>}
VM3951:5 🗑️ Deleting: mdreader-08a58a8a-270d-41ea-a499-4bfab021ccd0
VM3951:5 🗑️ Deleting: mdreader-yjs-storage
VM3951:9 ✅ All IndexedDB cleared

hard refresh browser 2 : 
Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
WorkspaceService.ts:93 ✅ Workspace loaded: My Workspace
SyncManager.ts:123 🔄 SyncManager initialized
YjsDocumentManager.ts:39 🔧 YjsDocumentManager initialized
verifyImplementation.ts:558 💡 Run verifyImplementation() in console to test implementation
main.tsx:17 
╔═══════════════════════════════════════════════════════════╗
║                 MDREADER STARTING                         ║
╚═══════════════════════════════════════════════════════════╝

main.tsx:65 🔧 [Step 1] Initializing app infrastructure...
AppInitialization.ts:23 🚀 Initializing application...
AppInitialization.ts:40 🌐 Web mode detected
migrateToIndexedDB.ts:207 🔄 Checking for localStorage → IndexedDB migration...
OfflineDatabase.ts:161 ✅ Offline database initialized
SyncManager.ts:119 🧹 Cleared all pending changes on init (temporary fix for orphaned data)
migrateToIndexedDB.ts:212 ✅ Migration already completed
GuestWorkspaceService.ts:144 🔵 GuestWorkspaceService.init()
GuestWorkspaceService.ts:175 👋 Welcome back, 🏔️ Pioneer! (Session #9)
GuestWorkspaceService.ts:211 📦 Loaded 1 workspace(s)
GuestWorkspaceService.ts:154 ✅ GuestWorkspaceService initialized
AppInitialization.ts:52 ✅ Application initialized
AppInitialization.ts:53    - Platform: Web (Browser)
AppInitialization.ts:54    - Storage: IndexedDB (migrated from localStorage)
AppInitialization.ts:55    - Guest Workspace: Ready
AppInitialization.ts:56    - Backend Services: Ready
main.tsx:69 🔧 [Step 2] Initializing managers...
main.tsx:25 🚀 Initializing production managers...
main.tsx:29 📦 [1/2] Initializing UnifiedSyncManager...
UnifiedSyncManager.ts:100 Environment detected: {platform: 'WEB', network: 'ONLINE', auth: 'AUTHENTICATED', userId: '2b61c86b-2c86-4471-9ef6-a5dedef0ffcb', deviceId: 'device_1766226135942_xr3pk66f1'}
StorageProviderFactory.ts:57 🗄️  Creating IndexedDBStorageProvider (platform: WEB) - Reason: default canonical storage
StorageProviderFactory.ts:20 🗄️  Creating IndexedDBStorageProvider (platform: WEB)
UnifiedSyncManager.ts:104 Storage provider initialized: {provider: 'IndexedDB', used: 41160, available: 998710127, total: 998751287}
UnifiedSyncManager.ts:333 🔄 Connection state: CONNECTING
UnifiedSyncManager.ts:333 🔄 Connection state: CONNECTED
UnifiedSyncManager.ts:121 ✅ Sync manager initialized successfully
main.tsx:32 ✅ UnifiedSyncManager ready
main.tsx:35 📦 [2/2] Initializing DocumentLifecycleManager...
UnifiedSyncManager.ts:91 Sync manager already initialized
init @ UnifiedSyncManager.ts:91
init @ DocumentLifecycleManager.ts:88
initializeManagers @ main.tsx:37
await in initializeManagers
(anonymous) @ main.tsx:70
await in (anonymous)
(anonymous) @ main.tsx:104
DocumentLifecycleManager.ts:91 ✅ Document lifecycle manager initialized
main.tsx:38 ✅ DocumentLifecycleManager ready
main.tsx:45 
╔═══════════════════════════════════════════════════════════╗
║              MANAGERS INITIALIZED                         ║
║  ✅ UnifiedSyncManager                                    ║
║  ✅ DocumentLifecycleManager                              ║
║  ✅ YjsDocumentManager (legacy)                           ║
╚═══════════════════════════════════════════════════════════╝

main.tsx:73 🔧 [Step 3] Rendering app...
main.tsx:82 
╔═══════════════════════════════════════════════════════════╗
║              MDREADER READY                               ║
╚═══════════════════════════════════════════════════════════╝

Workspace.tsx:165 🔍 [Workspace] Looking for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:166 🔍 [Workspace] Available documents: 0
react-router-dom.js?v=bf574671:4393 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ react-router-dom.js?v=bf574671:4393
logDeprecation @ react-router-dom.js?v=bf574671:4396
logV6DeprecationWarnings @ react-router-dom.js?v=bf574671:4399
(anonymous) @ react-router-dom.js?v=bf574671:5271
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
react-router-dom.js?v=bf574671:4393 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ react-router-dom.js?v=bf574671:4393
logDeprecation @ react-router-dom.js?v=bf574671:4396
logV6DeprecationWarnings @ react-router-dom.js?v=bf574671:4402
(anonymous) @ react-router-dom.js?v=bf574671:5271
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
WorkspaceContext.tsx:155 🔵 [FIX 11] WorkspaceContext init triggered: {epoch: 'auth:guest', previousEpoch: null, isAuthenticated: false, authCheck: true, hasUser: false, …}
WorkspaceContext.tsx:213 ⏳ Authenticated but user object not ready yet, waiting 100ms...
BackendWorkspaceService.ts:746 🔍 [getDocument] Cache check for 08a58a8a-270d-41ea-a499-4bfab021ccd0: {found: true, syncStatus: 'synced', hasContent: false, contentLength: 0, updatedAt: '2025-12-20T10:28:02.590395'}
BackendWorkspaceService.ts:776 📥 [getDocument] Fetching from backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:262 ✅ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has content: <paragraph>test 2 intro changes to be pushed sync ...
Workspace.tsx:165 🔍 [Workspace] Looking for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:166 🔍 [Workspace] Available documents: 0
WorkspaceContext.tsx:155 🔵 [FIX 11] WorkspaceContext init triggered: {epoch: 'auth:2b61c86b-2c86-4471-9ef6-a5dedef0ffcb', previousEpoch: null, isAuthenticated: true, authCheck: true, hasUser: true, …}
WorkspaceContext.tsx:231 🔄 Initializing workspace for authenticated user: naum {React isAuthenticated: true, Direct auth check: true, Has user object: true}
BackendWorkspaceService.ts:783 ✅ [getDocument] Updated cache from backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0, content: 67 chars
WorkspaceContext.tsx:243 📦 Loaded 1 guest workspace(s) from local IndexedDB
BackendWorkspaceService.ts:746 🔍 [getDocument] Cache check for 08a58a8a-270d-41ea-a499-4bfab021ccd0: {found: true, syncStatus: 'synced', hasContent: true, contentLength: 67, updatedAt: '2025-12-20T10:30:59.937739'}
BackendWorkspaceService.ts:764 ✅ [getDocument] Using synced cache: 08a58a8a-270d-41ea-a499-4bfab021ccd0, content: 67 chars
YjsDocumentManager.ts:116 🆕 Creating new Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:124 📄 [EXPERT] Creating empty Yjs document (content initialized separately)
YjsDocumentManager.ts:199 📴 WebSocket disabled for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (guest mode or offline)
SnapshotManager.ts:40 📸 [Snapshot] Manager initialized for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (debounce: 3000ms)
YjsDocumentManager.ts:213 📸 [STEP 5] Snapshot manager enabled for 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:230 ✅ Yjs document created: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WorkspaceContext.tsx:884 🧬 [STEP 4] [STAGE 2 ENFORCEMENT] Hydrating from binary truth: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (176 chars b64)
WorkspaceContext.tsx:888 ✅ [STEP 4] Binary truth established. Markdown fallback will be ignored.
Workspace.tsx:182 📄 [Workspace] Document found: {id: '08a58a8a-270d-41ea-a499-4bfab021ccd0', title: 'test 2', hasContent: true, contentLength: 67, contentPreview: '<paragraph>test 2 intro changes to be pushed sync  gggg</paragraph>', …}
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:136 🚀 Requesting Yjs document from manager: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:137    Mode: Guest
useYjsDocument.ts:138    Online: true
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 2)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
extensions.ts:157 ✅ [STEP 3] Yjs Collaboration enabled
extensions.ts:180 ℹ️ [STEP 3] WebSocket not available - local-first mode only
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:193 📦 API returned 2 workspace(s)
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 3)
WorkspaceContext.tsx:873 ❌ [INVARIANT VIOLATION] Attempted to hydrate from binary on a non-empty Yjs doc!
hydrateYjsDocument @ WorkspaceContext.tsx:873
await in hydrateYjsDocument
(anonymous) @ WorkspaceContext.tsx:1010
await in (anonymous)
(anonymous) @ Workspace.tsx:169
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
WorkspaceContext.tsx:878 ℹ️ [STEP 4] Yjs document already has content, skipping hydration: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:182 📄 [Workspace] Document found: {id: '08a58a8a-270d-41ea-a499-4bfab021ccd0', title: 'test 2', hasContent: true, contentLength: 67, contentPreview: '<paragraph>test 2 intro changes to be pushed sync  gggg</paragraph>', …}
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:136 🚀 Requesting Yjs document from manager: 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:137    Mode: Authenticated
useYjsDocument.ts:138    Online: true
YjsDocumentManager.ts:73 ♻️ Reusing existing Yjs document: 08a58a8a-270d-41ea-a499-4bfab021ccd0 (refCount: 4)
YjsDocumentManager.ts:77 🔄 [UPGRADE] Adding WebSocket to existing document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:105 ✅ [UPGRADE] WebSocket added successfully for 08a58a8a-270d-41ea-a499-4bfab021ccd0 (with auth: true)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: initializing for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
extensions.ts:157 ✅ [STEP 3] Yjs Collaboration enabled
extensions.ts:169 ✅ [STEP 3] Collaboration cursors enabled (WebSocket available)
WorkspaceContext.tsx:218 ⚠️ Still no user object after delay, proceeding with auth check
WorkspaceContext.tsx:231 🔄 Initializing workspace for authenticated user: authenticated user {React isAuthenticated: false, Direct auth check: true, Has user object: false}
YjsDocumentManager.ts:130 💾 IndexedDB synced for 08a58a8a-270d-41ea-a499-4bfab021ccd0
useYjsDocument.ts:181 ✅ Yjs document synced from IndexedDB: 08a58a8a-270d-41ea-a499-4bfab021ccd0
YjsDocumentManager.ts:93 🌐 WebSocket status for 08a58a8a-270d-41ea-a499-4bfab021ccd0: connected
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
WorkspaceContext.tsx:243 📦 Loaded 1 guest workspace(s) from local IndexedDB
BackendWorkspaceService.ts:204 ✅ Synced 2 workspace(s) from backend
BackendWorkspaceService.ts:135 📦 Loaded 2 workspace(s) from cache
BackendWorkspaceService.ts:141 🔄 Syncing documents for workspace: 1a41a4cb-83c1-4849-bd26-f58c353cd029
WYSIWYGEditor.tsx:234 ✅ [STEP 3] TipTap View is now ready for 08a58a8a-270d-41ea-a499-4bfab021ccd0
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
Workspace.tsx:701 📋 Initial content extracted for outline (44 chars)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:193 📦 API returned 2 workspace(s)
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:204 ✅ Synced 2 workspace(s) from backend
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:149 ✅ Backend workspace service initialized
WorkspaceContext.tsx:248 ☁️ Loaded 2 backend workspace(s) from cloud/cache
WorkspaceContext.tsx:281 ✅ Merged workspaces: 1 local + 2 cloud = 3 total
WorkspaceContext.tsx:282    - Local-only (can push to cloud): 1
WorkspaceContext.tsx:283    - Synced to cloud: 2
WorkspaceContext.tsx:298 📂 Loading local workspace: Local Workspace
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:135 📦 Loaded 2 workspace(s) from cache
BackendWorkspaceService.ts:141 🔄 Syncing documents for workspace: 1a41a4cb-83c1-4849-bd26-f58c353cd029
GuestWorkspaceService.ts:404 ✅ Switched to workspace: Local Workspace
WorkspaceContext.tsx:304 ✅ Loaded 0 local document(s) from guest service
WorkspaceContext.tsx:320 ✅ Workspace context initialized: Local Workspace
WorkspaceContext.tsx:321 📊 Final state: {workspaces: 3, currentWorkspace: 'Local Workspace', documents: 0, isLocalOnly: true}
WorkspaceContext.tsx:339 ✅ [FIX 11] Epoch locked: auth:2b61c86b-2c86-4471-9ef6-a5dedef0ffcb
WorkspaceContext.tsx:342 ✅ WorkspaceContext initialization complete (isLoading = false)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
BackendWorkspaceService.ts:968 📥 [syncDocuments] Received 2 documents from API
BackendWorkspaceService.ts:971 📥 [syncDocuments] First doc has content field? false undefined
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document 08a58a8a-270d-41ea-a499-4bfab021ccd0 (test 2) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:260 ⚠️ [mapApiDocument] Document e278ca6e-f2b0-4b3d-b1aa-f34c30e76a64 (test1) has NO content from API
mapApiDocument @ BackendWorkspaceService.ts:260
(anonymous) @ BackendWorkspaceService.ts:974
syncDocuments @ BackendWorkspaceService.ts:974
await in syncDocuments
init @ BackendWorkspaceService.ts:142
await in init
init @ WorkspaceContext.tsx:246
await in init
(anonymous) @ WorkspaceContext.tsx:346
commitHookEffectListMount @ chunk-RZQ6P3FR.js?v=bf574671:16915
commitPassiveMountOnFiber @ chunk-RZQ6P3FR.js?v=bf574671:18156
commitPassiveMountEffects_complete @ chunk-RZQ6P3FR.js?v=bf574671:18129
commitPassiveMountEffects_begin @ chunk-RZQ6P3FR.js?v=bf574671:18119
commitPassiveMountEffects @ chunk-RZQ6P3FR.js?v=bf574671:18109
flushPassiveEffectsImpl @ chunk-RZQ6P3FR.js?v=bf574671:19490
flushPassiveEffects @ chunk-RZQ6P3FR.js?v=bf574671:19447
performSyncWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18868
flushSyncCallbacks @ chunk-RZQ6P3FR.js?v=bf574671:9119
commitRootImpl @ chunk-RZQ6P3FR.js?v=bf574671:19432
commitRoot @ chunk-RZQ6P3FR.js?v=bf574671:19277
finishConcurrentRender @ chunk-RZQ6P3FR.js?v=bf574671:18805
performConcurrentWorkOnRoot @ chunk-RZQ6P3FR.js?v=bf574671:18718
workLoop @ chunk-RZQ6P3FR.js?v=bf574671:197
flushWork @ chunk-RZQ6P3FR.js?v=bf574671:176
performWorkUntilDeadline @ chunk-RZQ6P3FR.js?v=bf574671:384
BackendWorkspaceService.ts:1046 ✅ Synced documents: 2 updated, 0 added, 0 local-only preserved (total: 2)
BackendWorkspaceService.ts:149 ✅ Backend workspace service initialized
WorkspaceContext.tsx:248 ☁️ Loaded 2 backend workspace(s) from cloud/cache
WorkspaceContext.tsx:281 ✅ Merged workspaces: 1 local + 2 cloud = 3 total
WorkspaceContext.tsx:282    - Local-only (can push to cloud): 1
WorkspaceContext.tsx:283    - Synced to cloud: 2
WorkspaceContext.tsx:298 📂 Loading local workspace: Local Workspace
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
GuestWorkspaceService.ts:404 ✅ Switched to workspace: Local Workspace
WorkspaceContext.tsx:304 ✅ Loaded 0 local document(s) from guest service
WorkspaceContext.tsx:320 ✅ Workspace context initialized: Local Workspace
WorkspaceContext.tsx:321 📊 Final state: {workspaces: 3, currentWorkspace: 'Local Workspace', documents: 0, isLocalOnly: true}
WorkspaceContext.tsx:339 ✅ [FIX 11] Epoch locked: auth:guest
WorkspaceContext.tsx:342 ✅ WorkspaceContext initialization complete (isLoading = false)
WYSIWYGEditor.tsx:194 ✅ [STEP 3] Yjs document status: synced for document: 08a58a8a-270d-41ea-a499-4bfab021ccd0
SnapshotManager.ts:103 📸 [Snapshot] Creating snapshot for 08a58a8a-270d-41ea-a499-4bfab021ccd0
snapshotClient.ts:30 ☁️ [Snapshot] Pushing to backend: 08a58a8a-270d-41ea-a499-4bfab021ccd0
snapshotClient.ts:49 ✅ [Snapshot] Pushed successfully: 08a58a8a-270d-41ea-a499-4bfab021ccd0
SnapshotManager.ts:116 ✅ [Snapshot] Saved for 08a58a8a-270d-41ea-a499-4bfab021ccd0


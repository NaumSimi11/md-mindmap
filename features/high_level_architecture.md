# 🧠 Local-First + Cloud Collaboration Architecture (Web + Tauri)

**Scope**:  
- Non-authenticated & authenticated users  
- Local-only mode (Tauri & browser)  
- Cloud-synced mode (FastAPI + Hocuspocus)  
- Online/offline behavior  
- “Save locally” vs “Save online” toggles  
- Seamless upgrade from guest → account → cloud sync

**Targets**:  
- Web app (browser)  
- Desktop app (Tauri wrapper around the same frontend)

---

## 1. Core Design Principles

1. **Local-first by default**
   - User can create and work on documents **without an account**.
   - No hard dependency on network or backend.

2. **Single mental model: Document = CRDT (Yjs)**
   - Whether local or cloud, every document is a **Yjs document**.
   - Same engine for:
     - Undo/redo
     - Offline editing
     - Sync / merge

3. **Storage is pluggable**
   - Storage = “where the Yjs state lives / syncs to”.
   - For each document, we have a **storage mode**:
     - `LocalOnly`
     - `CloudOnly`
     - `HybridSync` (local + cloud sync)

4. **Cloud is an optional upgrade**
   - Local → Cloud is a one-click “Turn on cloud sync” operation.
   - Authenticated or later-authenticated users can pick which docs to sync.

5. **Collaboration only on cloud-backed docs**
   - Multi-user collab is enabled **only** when a document has a cloud identity.
   - Local-only docs = solo, offline-first.

6. **Cutting-edge, but proven tech**
   - Yjs for CRDT
   - TipTap for editor
   - Hocuspocus for collab server
   - FastAPI for app backend
   - IndexedDB & filesystem for local storage (web + Tauri)

---

## 2. Modes & Personas

### 2.1 User Context Matrix

We define three orthogonal axes:

1. **Auth State**
   - `Anonymous` (guest/no login)
   - `Authenticated` (logged-in user)

2. **Storage Mode (per document)**
   - `LocalOnly` – only local device, never touches cloud
   - `CloudOnly` – lives only in cloud (web app, possibly ephemeral local cache)
   - `HybridSync` – local copy + cloud sync (recommended for desktop)

3. **Connectivity**
   - `Online`
   - `Offline`

### 2.2 Canonical Use Cases

1. **Anonymous + LocalOnly + Tauri**
   - User installs desktop app and starts writing immediately.
   - No account, everything stored locally.
   - Can later sign up and selectively “upload to cloud”.

2. **Authenticated + LocalOnly**
   - User is logged in but chooses a “private local notebook”.
   - No cloud backup, no collab.
   - Data lives only on that device.

3. **Authenticated + HybridSync (Tauri)**
   - User works in Tauri.
   - Documents stored locally and also synced to cloud when online.
   - Process similar to Dropbox / Obsidian Sync.

4. **Authenticated + CloudOnly (Web)**
   - Pure web flow.
   - Documents live in cloud, with browser-level IndexedDB cache.
   - Collab, sharing, comments – everything available.

---

## 3. Document Identity & Metadata

### 3.1 Document Identity

Each document has:

- `local_id` (UUID v4) – generated on client when doc is created.
- `remote_id` (UUID v4) – assigned by server when doc is uploaded/created in cloud.
- `storage_mode`: `LocalOnly | CloudOnly | HybridSync`
- `last_synced_state_vector` – CRDT state vector at last successful sync (for HybridSync/CloudOnly).

### 3.2 Metadata Schema (Client-Side)

```ts
type LocalDocumentMeta = {
  localId: string;                  // always
  remoteId?: string;                // when uploaded / created in cloud
  title: string;
  createdAt: string;
  updatedAt: string;

  storageMode: "LocalOnly" | "CloudOnly" | "HybridSync";

  // For HybridSync
  lastSyncedAt?: string;
  lastSyncedStateVector?: Uint8Array;

  // Ownership/visibility (for authenticated)
  ownerUserId?: string;
  workspaceId?: string;

  // Flags
  isDirtySinceLastSync: boolean;
  isTrashed?: boolean;
};
3.3 Where Metadata Lives
Web:

IndexedDB “workspace” DB.

Tauri Desktop:

IndexedDB (via webview) or

Local SQLite/JSON file accessed via Tauri commands (recommended for robustness).

4. Storage Abstraction Layer
4.1 Unified Storage Interface
We define a storage adapter abstraction:

ts
Copy code
interface DocumentStorageAdapter {
  loadDocumentState(localId: string): Promise<Y.Doc | null>;
  saveDocumentState(localId: string, ydoc: Y.Doc): Promise<void>;

  loadMetadata(): Promise<LocalDocumentMeta[]>;
  saveMetadata(meta: LocalDocumentMeta[]): Promise<void>;
}
Implementations:

IndexedDbStorageAdapter (Web + Tauri)

TauriFsStorageAdapter (Desktop-only, file-based storage)

In-memory (for tests)

For Tauri, we can combine IndexedDB for quick UI access + filesystem for raw backups.

5. Sync Layer & Cloud Integration
5.1 Sync Roles
We separate three layers:

Local Storage Layer

Persists Y.Doc locally (Yjs + y-indexeddb OR serialized snapshots).

Sync Engine

Knows how to convert local Y.Doc ↔ Cloud Y.Doc.

Deals with HybridSync and CloudOnly.

Collab Engine (Hocuspocus)

Manages real-time Yjs updates between multiple clients for a remote_id.

5.2 Sync Engine Responsibilities
For each document with storageMode !== LocalOnly:

When online:

If remote_id exists:

Connect to Hocuspocus with remote_id as room name.

Let Yjs + Hocuspocus handle real-time merges.

If remote_id missing (first sync):

Create in FastAPI (POST /documents)

Get remote_id

Upload Yjs snapshot (via Hocuspocus or API)

Switch to HybridSync / CloudOnly.

When offline (HybridSync):

Keep editing locally.

Yjs ensures CRDT structure consistent.

On reconnect:

Hocuspocus merges offline local changes with cloud state.

5.3 StorageMode Transition Rules
LocalOnly → HybridSync

User toggles “Sync to Cloud: ON”.

If user is not authenticated:

Prompt login/signup.

After auth:

POST /documents with metadata.

Create remote doc via FastAPI or Hocuspocus.

Store remote_id, update storageMode to HybridSync.

HybridSync → LocalOnly

Dangerous; we treat as:

Stop syncing.

User can choose:

Keep a local copy and mark remote as archived/delete-only.

Or disable but keep remote as old backup.

Usually, we prefer to not fully delete remote by default.

CloudOnly → HybridSync

When in Tauri, user toggles “Keep local copy”.

Local storage adapter persists Y.Doc into local storage.

Mark storageMode as HybridSync.

6. Tauri-Specific Architecture
6.1 Tauri Layers
UI Layer

Same React/NextJS (or SPA) that runs in browser.

Uses same editor, same CollaborationManager.

Bridge Layer (Tauri Commands)

File access

Encryption (optional)

Backup/restore

Export/import

Local Storage Layout

Example filesystem layout:

text
Copy code
~/mdreader/
  config.json                      # app-level settings
  users/
    anonymous/
      workspace.db                 # or workspace.json
      docs/
        <localId>.mddoc            # serialized Yjs snapshot + metadata
    <userId>/
      workspace.db
      docs/
        <localId>.mddoc
.mddoc format (suggested):

json
Copy code
{
  "meta": {
    "localId": "...",
    "remoteId": "...",
    "title": "...",
    "storageMode": "HybridSync",
    "createdAt": "...",
    "updatedAt": "...",
    "lastSyncedAt": "...",
    "ownerUserId": "..."
  },
  "yjsState": "<base64-encoded>",   // encoded Yjs update or full state
  "version": 1
}
Tauri commands:

readDocumentFile(localId: string): Promise<MdDocFile>

writeDocumentFile(localId: string, file: MdDocFile): Promise<void>

listLocalDocuments(userScope: Anonymous | userId): Promise<string[]>

7. Auth vs Anonymous Behavior
7.1 Anonymous
Can:

Create local documents (LocalOnly)

Persist them in Tauri filesystem or browser IndexedDB.

Cannot:

Sync to cloud

Collaborate

Use multi-device access

When they try to enable:

“Sync to Cloud” toggle → prompt to sign up / log in.

7.2 Authenticated
Has:

Local workspace (like anonymous but scoped to userId)

Cloud workspace (FastAPI + Postgres + Hocuspocus)

Per document:

User chooses between LocalOnly, HybridSync, CloudOnly.

8. UI/UX Layer: Toggles & States
8.1 Document Info Panel
For each document, show:

Location:

Local only

Cloud only

Local + Cloud (synced)

Sync toggle:

“Sync to Cloud” (switch)

Status:

Up to date

Syncing...

Offline – changes will sync later

Error – tap to retry

8.2 Example State Machine per Document
mermaid
Copy code
stateDiagram-v2
    [*] --> LocalOnly

    LocalOnly --> HybridSync: "Sync to Cloud" ON\n(authenticated)
    HybridSync --> LocalOnly: "Sync to Cloud" OFF (advanced)
    HybridSync --> CloudOnly: "Clear local copy"
    CloudOnly --> HybridSync: "Keep local copy" ON
9. Collaboration & Local Mode
9.1 Local-only Docs
Still powered by Yjs:

Local CRDT for undo/redo

Offline robust editing

No WebSocket connection to Hocuspocus.

Tauri:

Can open multiple windows, but they are views over the same local Y.Doc instance (optional advanced feature).

9.2 Cloud-backed Docs
Same Y.Doc instance is:

Connected to IndexeddbPersistence (local caching)

Connected to Hocuspocus provider (cloud sync & collaboration)

Collaboration is automatically on when:

remote_id exists

storageMode is HybridSync or CloudOnly

Network is available

9.3 Authenticated Local Mode (Not Publishing)
User is logged in, but chooses to keep specific docs LocalOnly.

Behavior:

No remote_id

No Hocuspocus connection

Everything stays on local storage under that user’s scope.

10. Concrete Flows
10.1 Flow: Anonymous User Creates a Local Doc in Tauri
User opens app (no login).

Local workspace loaded from users/anonymous.

Click “New Document”.

App:

Generate local_id.

Create Y.Doc.

Persist via TauriFsStorageAdapter.

User edits; Yjs + local persistence manage everything.

Later, user signs up:

We do not auto-sync anonymous docs by default (but we can offer a “Import previous local docs into your account” flow).

10.2 Flow: Authenticated User Creates LocalOnly Doc
User signed in.

Click “New Document” → choose “Local only” (or default).

Same as anonymous, but stored under users/<userId> scope.

Cloud does not know this doc exists.

10.3 Flow: User Upgrades Local Doc to Cloud (HybridSync)
Document is currently LocalOnly.

User toggles “Sync to Cloud” ON.

If not authenticated:

Prompt login / signup.

Once authenticated:

POST /api/v1/documents to FastAPI with metadata.

Get remote_id.

Create/attach Hocuspocus room with remote_id.

Upload full Yjs state:

Either via Hocuspocus initial sync OR API call.

Set:

storageMode = "HybridSync"

remoteId = ...

lastSyncedStateVector = current state vector

From then on:

Edits sync to cloud and back.

Collab possible.

10.4 Flow: Offline Editing (HybridSync)
Document is HybridSync with existing remote_id.

Network goes offline:

Hocuspocus disconnects.

Local Y.Doc remains active.

IndexedDB / filesystem continues to persist changes.

User continues editing.

When network returns:

Hocuspocus reconnects.

Yjs merges local CRDT with latest remote CRDT.

No manual conflict resolution needed.

10.5 Flow: Save Local Copy from CloudOnly (Desktop)
Document originally created in Web (CloudOnly).

User opens it in Tauri.

In Tauri UI:

“Keep local copy for offline use” toggle.

App:

Switch storageMode to HybridSync.

Persist Y.Doc locally.

Continue syncing via Hocuspocus.

11. Security & Privacy Considerations
11.1 Local Encryption (Optional, For Later Phase)
For Tauri:

Encrypt .mddoc files using a per-user key (derived from OS keystore / keychain).

For Web:

IndexedDB is bound to browser profile; optionally implement application-layer encryption for zero-knowledge mode (future).

11.2 Logout Behavior
When user logs out:

Online sessions and access tokens cleared.

Local docs remain:

Either under users/<oldUserId>

Or optionally migrated to anonymous scope.

When logging in with another account:

Provide UI to import/migrate existing local docs.

12. Implementation Phases
Phase 1 – LocalOnly (Tauri + Web) [2–3 weeks]
Implement StorageAdapter abstraction.

Implement LocalOnly documents with Yjs + IndexedDB/Tauri FS.

Implement document metadata index on client.

Support anonymous + authenticated local work.

Phase 2 – Cloud Integration & HybridSync [3–4 weeks]
Integrate FastAPI + Hocuspocus (from previous collab plan).

Implement remoteId / storageMode wiring.

Implement “Sync to Cloud” toggle.

Implement HybridSync mode, offline editing, reconnection.

Phase 3 – Auth Flows & Migration [2–3 weeks]
Guest → account migration:

“Import local docs to account”.

Account → new device:

Cloud documents shown, optional local caching via HybridSync.

Permissions and sharing (from collab plan).

Phase 4 – UX Polish & Edge Cases [2 weeks]
Clear UI state for:

Sync errors

Conflicting edits (though CRDT handles structure, we might still show high-level notifications)

Backups & export/import:

Export .mddoc

Import .mddoc

13. Summary
Local-first architecture with Yjs for all documents (local and cloud).

Tauri acts as a powerful local environment with filesystem persistence and optional encryption.

FastAPI + Hocuspocus provide:

Cloud sync

Real-time collaboration

Permissions and sharing

StorageMode per document decides behavior:

LocalOnly → private, device-bound, no cloud

HybridSync → offline + online, sync to cloud, collab-enabled

CloudOnly → mainly for web usage

This gives you:

Anonymous use without friction.

Professional, account-based cloud experience.

Google Drive / Notion–style flexibility but built on modern local-first principles.

makefile
Copy code

::contentReference[oaicite:0]{index=0}





You said:
ok please give me md file of this. 


ChatGPT said:
Here is the complete Markdown file, clean, polished, and ready to drop into your repo as:

docs/LOCAL_FIRST_ARCHITECTURE_PLAN.md

(No extra commentary — this is the final MD output.)

markdown
Copy code
# 🧠 Local-First + Cloud Collaboration Architecture  
**Platforms**: Web + Tauri Desktop  
**Tech Stack**: FastAPI (App Backend) • Hocuspocus (Collab Backend) • Yjs • TipTap • IndexedDB • Tauri FS  
**Purpose**: Enable authenticated AND non-authenticated users to work fully offline, fully online, or hybrid — with cutting-edge collaboration, cloud sync, and local persistence.

---

## 1. Core Design Principles

### 1.1 Local-first by default  
Users must be able to create and edit documents **instantly**, without accounts and without connectivity.

### 1.2 CRDT as the universal engine  
All documents — local or cloud — use **Yjs** for structure, merges, undo/redo, and offline functionality.

### 1.3 Storage is pluggable  
Each document can live in:
- `LocalOnly`
- `CloudOnly`
- `HybridSync`

### 1.4 Cloud is optional  
Users can start as anonymous, create documents locally, then later log in and upgrade to cloud syncing with one click.

### 1.5 Collaboration only on cloud-backed docs  
Real-time editing requires a `remote_id` and a connection to the Hocuspocus server.

### 1.6 Same architecture across Web + Tauri  
Tauri adds filesystem storage while maintaining the same CRDT flow as the web app.

---

## 2. User Modes

A document’s behavior is defined across three axes:

### 2.1 Authentication State
- `Anonymous` — no account, no cloud access.
- `Authenticated` — full permissions, cloud sync, collab.

### 2.2 Document Storage Mode
- `LocalOnly`
- `CloudOnly`
- `HybridSync` (local + cloud)

### 2.3 Connectivity
- `Online`
- `Offline`

---

## 3. Document Identity & Metadata

### 3.1 Identifiers
Each document has:

- `local_id` (UUID v4)
- `remote_id` (UUID v4) — exists only if document is cloud-backed

### 3.2 Metadata Structure

```ts
type LocalDocumentMeta = {
  localId: string;
  remoteId?: string;

  title: string;
  createdAt: string;
  updatedAt: string;

  storageMode: "LocalOnly" | "CloudOnly" | "HybridSync";

  lastSyncedAt?: string;
  lastSyncedStateVector?: Uint8Array;

  ownerUserId?: string;
  workspaceId?: string;

  isDirtySinceLastSync: boolean;
  isTrashed?: boolean;
};
3.3 Storage Locations
Web: IndexedDB (local_documents, metadata)

Tauri:

IndexedDB for quick access

Tauri FS for document backups and exported .mddoc files

4. Storage Layer Abstraction
4.1 Unified Storage Interface
ts
Copy code
interface DocumentStorageAdapter {
  loadDocumentState(localId: string): Promise<Y.Doc | null>;
  saveDocumentState(localId: string, ydoc: Y.Doc): Promise<void>;
  loadMetadata(): Promise<LocalDocumentMeta[]>;
  saveMetadata(meta: LocalDocumentMeta[]): Promise<void>;
}
4.2 Implementations
IndexedDbStorageAdapter (Web + Tauri)

TauriFsStorageAdapter (Desktop-only)

In-memory adapter (testing)

5. Sync Architecture
5.1 Layered Approach
Local Persistence Layer

IndexedDB / Tauri FS store Yjs snapshots.

Sync Engine

Yjs merges offline + online changes.

Handles transitions between LocalOnly → HybridSync → CloudOnly.

Collaboration Engine (Hocuspocus)

Real-time CRDT updates

Awareness (cursors, selections, avatars)

Postgres persistence

6. StorageMode Behaviors
6.1 LocalOnly
Exists only on device.

Uses only local Yjs + IndexedDB/FS.

No Hocuspocus connection.

Best for:

Private notes

Offline-first workflows

Anonymous users

6.2 CloudOnly
Document lives in cloud (FastAPI + Hocuspocus).

Local IndexedDB is only a cache.

Automatically collaborates when multiple users join.

6.3 HybridSync
Local copy + cloud-backed document.

Edits when offline → merge when online.

Required for Tauri to support cloud collaboration.

7. Mode Transitions
7.1 LocalOnly → HybridSync
Triggered when user toggles “Sync to Cloud: ON”.

Flow:

If user anonymous → prompt login.

FastAPI POST /documents.

Server returns remote_id.

Yjs document uploaded to Hocuspocus.

Document becomes collaborative-capable.

7.2 CloudOnly → HybridSync
User in Tauri clicks “Keep local copy”.

Local snapshot saved.

Sync maintained.

7.3 HybridSync → LocalOnly
Advanced option:

Disconnect from cloud.

Remote version archived optional.

Local becomes authoritative.

8. Tauri Architecture
8.1 File Layout
php-template
Copy code
~/mdreader/
  config.json
  users/
    anonymous/
      workspace.db
      docs/
        <localId>.mddoc
    <userId>/
      workspace.db
      docs/
        <localId>.mddoc
8.2 .mddoc File Format
json
Copy code
{
  "meta": { ... },
  "yjsState": "<base64-encoded>",
  "version": 1
}
8.3 Tauri Commands
readDocumentFile(localId)

writeDocumentFile(localId, file)

listLocalDocuments()

Optional encryption via OS keychain

9. Authentication & Anonymous Use
9.1 Anonymous Users Can:
Create unlimited local docs

Persist offline forever

Export .mddoc files

Later authenticate and import/select docs to sync

9.2 Authenticated Users Can:
Create both local and cloud-backed docs

Enable or disable sync per document

Collaborate only when document has remote_id

10. Cloud Collaboration Path
10.1 Web → Cloud Flow
User loads document → requests collab token:

http
Copy code
GET /api/v1/documents/<id>/collab-token
Frontend instantiates CollaborationManager.

Connects to Hocuspocus with:

Document remote_id

collab_token

TipTap collaboration extensions activate:

Live CRDT sync

Presence

Cursor positions

10.2 Offline Mode
When offline:

Hocuspocus disconnects

Local Y.Doc continues to operate

Changes accumulated in IndexedDB/FS

When online again:

Hocuspocus reconnects

Yjs merges states

All clients update in real time

11. UI Components
11.1 Document Info Panel
Current storage mode

Sync toggle

Last synced time

“Make available offline” toggle (Tauri)

11.2 Document List
LocalOnly → colored icon (device symbol)

HybridSync → sync icon

CloudOnly → cloud icon

11.3 Editor Indicators
ConnectionStatusToCloud

SyncBar (pending operations)

PresenceAvatars

CollaborativeCursor

12. Data Flows
12.1 Creating a Document (LocalOnly)
Generate local_id

Create Y.Doc

Persist locally

Save metadata in IndexedDB/FS

12.2 Creating a Cloud Document
Same local creation flow

After “Sync to Cloud”:

FastAPI creates record

Sync engine attaches remote_id

Document becomes collaborative

12.3 Editing Offline (HybridSync)
All edits stored locally

Upon reconnect:

Automatic merge through Yjs

State synced to cloud

12.4 Saving a Local Copy (CloudOnly → HybridSync)
Download Yjs state

Persist locally

Switch mode

13. Security Considerations
13.1 Cloud
Hocuspocus accepts only JWT-authorized connections

FastAPI governs all roles & permissions

Yjs payloads contain no sensitive information outside encrypted transport

13.2 Local
Optional encryption using:

Tauri keyring (macOS keychain / Windows Credential Vault)

AES-256 app-layer encryption

13.3 Auth Switching
Logging out does not delete local documents

When logging in as different user:

Show option to import/migrate local docs

14. Implementation Roadmap
Phase 1 — Local Document Framework (2–3 weeks)
Build StorageAdapter abstraction

Implement LocalOnly flow on Web & Tauri

Metadata index, local doc list

Basic .mddoc serializer

Phase 2 — Cloud Sync & Hybrid Mode (3–4 weeks)
Integrate FastAPI collaboration token

Hocuspocus config + Postgres persistence

Document transitions:

LocalOnly → HybridSync

CloudOnly → HybridSync

Offline editing & merge behavior

Phase 3 — Auth + Migration (2–3 weeks)
Anonymous → Account migration UI

Import/export .mddoc

Device linking/resync logic

Phase 4 — UX Polish & Edge Case Handling (2–3 weeks)
Advanced sync status indicators

Error recovery flows

Backups & restore

Performance optimizations

15. Summary
This architecture supports:

Anonymous local-first editing

Authenticated hybrid cloud sync

Real-time collaboration with Yjs + Hocuspocus

Tauri-powered desktop performance and local backups

Offline editing with automatic CRDT merges

Full flexibility per document: LocalOnly, CloudOnly, HybridSync

It combines:

Google Docs–style collaboration

Obsidian-style local-first autonomy

Notion/Linear-grade CRDT architecture

Tauri-native desktop robustness

File: LOCAL_FIRST_ARCHITECTURE_PLAN.md
Last Updated: 2025

yaml
Copy code

---

If you want, I can also generate:

✓ Folder structure  
✓ Boilerplate code for adapters  
✓ Yjs serialization helpers  
✓ Tauri command implementations  
✓ Full UX specification for offline/online states  

Just say **“Generate all technical specs”** or specify which part you want next.
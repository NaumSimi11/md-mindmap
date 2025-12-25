📦 Document Storage Architecture
Three Storage Locations, Two Formats
│  1️⃣ IndexedDB (Guest/Backend Cache)                         │

┌──────────────────────────────────────────────────────────────┐│                    DOCUMENT STORAGE                          │├──────────────────────────────────────────────────────────────┤│                                                              ││  1️⃣ IndexedDB (Guest/Backend Cache)                         ││  ┌────────────────────────────────────────┐                 ││  │  Database: "MDReaderGuest"             │                 ││  │  Table: "documents"                    │                 ││  │  ├── content: "Plain Text Markdown"    │ ← 📝 Metadata  ││  │  ├── yjsStateB64: "Base64 String"      │ ← 🧬 Binary    ││  │  ├── title, tags, starred, etc.        │                 ││  │  └── syncStatus: 'local' | 'synced'    │                 ││  └────────────────────────────────────────┘                 ││                                                              ││  2️⃣ IndexedDB (Yjs - Separate Database)                     ││  ┌────────────────────────────────────────┐                 ││  │  Database: "mdreader-{documentId}"     │                 ││  │  ├── updates: Binary CRDT operations   │ ← 🧬 Real-time ││  │  ├── state: Current Yjs document       │                 ││  │  └── syncedAt: Last sync timestamp     │                 ││  └────────────────────────────────────────┘                 ││                                                              ││  3️⃣ PostgreSQL (Cloud Backend)                              ││  ┌────────────────────────────────────────┐                 ││  │  Table: "documents"                    │                 ││  │  ├── content: TEXT (Markdown)          │ ← 📝 Fallback  ││  │  ├── yjs_state: BYTEA (Binary)         │ ← 🧬 Truth     ││  │  ├── yjs_version: INTEGER              │                 ││  │  └── title, workspace_id, etc.         │                 ││  └────────────────────────────────────────┘                 ││                                                              │└──────────────────────────────────────────────────────────────┘
🔍 Detailed Breakdown
1. IndexedDB (Document Metadata + Cache)
Location: Browser storage
Databases:
MDReaderGuest (logged out)
MDReaderBackendCache (logged in)
Format:
DocumentMeta
interface DocumentMeta {  id: string;  title: string;  content: string;          // 📝 PLAIN TEXT MARKDOWN (cache/fallback)  yjsStateB64?: string;     // 🧬 BASE64-ENCODED YJS BINARY (CRDT state)  starred: boolean;  tags: string[];  syncStatus: 'local' | 'synced' | 'syncing' | 'conflict';  // ... other metadata}
Purpose:
✅ Fast metadata queries (list documents, search, filter)
✅ Fallback content (when Yjs fails)
✅ Sync state tracking
✅ Offline-first cache
2. IndexedDB (Yjs CRDT - Separate Database)
Location: Browser storage
Database Name: mdreader-{documentId} (one per document!)
Format:
Binary Yjs CRDT Operations (LargeBinary)├── Update 1: User typed "Hello"├── Update 2: User deleted "o"├── Update 3: User added bold formatting└── Current State: Merged CRDT document
Purpose:
✅ Real-time collaboration (CRDT operations)
✅ Conflict-free merging (Yjs automatic resolution)
✅ Offline editing (stores all operations locally)
✅ Undo/redo (operation history)
Created by:
import { IndexeddbPersistence } from 'y-indexeddb';const persistence = new IndexeddbPersistence(`mdreader-${documentId}`, ydoc);
3. PostgreSQL (Cloud Backend)
Location: Server database
Table: documents
Format:
CREATE TABLE documents (  id UUID PRIMARY KEY,  title VARCHAR(200),  content TEXT,                    -- 📝 PLAIN TEXT MARKDOWN (fallback)  yjs_state BYTEA,                 -- 🧬 BINARY YJS STATE (authoritative)  yjs_version INTEGER,             -- Version counter  workspace_id UUID,  -- ... other fields);
Purpose:
✅ Cloud backup (persistent storage)
✅ Multi-device sync (access from anywhere)
✅ Collaboration (shared CRDT state)
✅ Version history (snapshots)
How Binary is Exposed:
@propertydef yjs_state_b64(self) -> Optional[str]:    """Convert binary to base64 for API"""    if self.yjs_state:        return base64.b64encode(self.yjs_state).decode('utf-8')    return None
🎯 The Two Formats
Format 1: Plain Text Markdown (📝 Metadata/Cache)
Stored in:
✅ content field in IndexedDB (DocumentMeta)
✅ content field in PostgreSQL (TEXT)
Purpose:
Search/indexing
Quick previews
Legacy fallback
Markdown export
Example:
.
# Hello WorldThis is **bold** and this is *italic*.
Format 2: Yjs Binary (🧬 CRDT Truth)
Stored in:
✅ Separate Yjs IndexedDB (mdreader-{documentId})
✅ yjsStateB64 field in IndexedDB (DocumentMeta - base64 string)
✅ yjs_state field in PostgreSQL (BYTEA - binary)
Purpose:
Real-time collaboration
Conflict-free merging
Operation history
Rich text formatting
Example (binary, not human-readable):
0x01 0x03 0xa8 0x8d 0xa2 0x82 0x04 0x00 0x07 0x01 0x67 ...(CRDT operations encoding document structure + content + formatting)
Transmitted as Base64:
"AQOojaKCBAAHAQdjb250ZW50AwlwYXJhZ3JhcGgHAKiNooIEAAYEAKiNooIEAR9..."
🔄 Data Flow Example
Creating a Document Offline:
1. User types in editor   ↓2. Yjs document updated (in-memory)   ↓3. IndexeddbPersistence saves to:   IndexedDB: "mdreader-{documentId}"   └── Binary CRDT operations   ↓4. Editor serializes to Markdown:   "# Title\n\nContent"   ↓5. autoSaveDocument() saves to:   IndexedDB: "MDReaderGuest"   ├── content: "# Title\n\nContent" (plain text)   └── yjsStateB64: "AQOoja..." (binary as base64)
Pushing to Cloud:
1. User clicks "Push to Cloud"   ↓2. selectiveSyncService.pushDocument()   ├── Reads: content (markdown)   ├── Reads: yjsStateB64 (binary state)   └── POST /api/v1/documents       {         "title": "My Doc",         "content": "# Title\n\nContent",         "yjs_state_b64": "AQOoja..."       }   ↓3. Backend decodes base64 → binary   ├── Saves content as TEXT   └── Saves yjs_state as BYTEA
Loading a Document:
1. User selects document   ↓2. DocumentDataContext.getDocument()   ├── Fetches from IndexedDB or API   ├── Gets: content + yjsStateB64   └── Calls: YjsHydrationService   ↓3. YjsHydrationService.hydrateDocument()   Priority:   1️⃣ yjsStateB64 exists?       → Decode base64 → Binary      → Y.applyUpdate(ydoc, binary)      → ✅ CRDT state restored   2️⃣ No binary?      → Use content (markdown)      → Convert to HTML      → Initialize Yjs from HTML
💡 Why Two Formats?
Format	Use Case	Pros	Cons
Plain Text	Metadata, search, export	✅ Human-readable<br>✅ Easy to index<br>✅ Portable	❌ No formatting<br>❌ No conflict resolution<br>❌ No real-time collab
Yjs Binary	Real-time editing, collaboration	✅ CRDT (conflict-free)<br>✅ Rich formatting<br>✅ Operation history<br>✅ Undo/redo	❌ Binary (not human-readable)<br>❌ Requires Yjs to decode<br>❌ Larger size
🎓 Key Takeaways
Content is stored in TWO formats: Plain text (metadata) + Yjs binary (truth)
Yjs binary is authoritative: When it exists, it overrides plain text
Plain text is fallback: Used when Yjs fails or for search/export
Three storage locations: 2 IndexedDB databases + 1 PostgreSQL
Base64 encoding: Binary is encoded for JSON transmission
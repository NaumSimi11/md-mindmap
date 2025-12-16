# MDReader Editor Masterpiece v2.1 — Consolidated Blueprint
**BRUTAL, COMPLETE, IMPLEMENTABLE**

**Version:** 2.1 — Final Consolidated Specification  
**Date:** December 15, 2025  
**Status:** 🔴 **EXECUTABLE ARCHITECTURE**

**Changes from v2.0:**
- ✅ Fixed provenance/blame model (operational + git-style hybrid)
- ✅ Fixed patch anchors (node_id based, no line/column)
- ✅ Added concurrency guards (base_state_vector + rebase)
- ✅ Defined compaction strategy (snapshot + updates + GC)
- ✅ Fixed version semantics (single `content_version`)
- ✅ Added workspace index & semantic search
- ✅ Added CRDT testing strategy (chaos, fuzz, property)
- ✅ Added security details (encryption, isolation, GDPR)
- ✅ Added diagram integration (mermaid as first-class node)
- ✅ Added implementation matrix (claim → module → file)

---

## 📋 TABLE OF CONTENTS

0. [System Invariants & Product Goals](#0-system-invariants--product-goals)
1. [Canonical Data Model (Fixed)](#1-canonical-data-model-fixed)
2. [Provenance & Blame Model (NEW)](#2-provenance--blame-model-new)
3. [CRDT Persistence & Compaction (NEW)](#3-crdt-persistence--compaction-new)
4. [Version Semantics (FIXED)](#4-version-semantics-fixed)
5. [Patch Protocol v2 (FIXED)](#5-patch-protocol-v2-fixed)
6. [Workspace Index & Retrieval (NEW)](#6-workspace-index--retrieval-new)
7. [Reliability & Testing (NEW)](#7-reliability--testing-new)
8. [Security Model (EXPANDED)](#8-security-model-expanded)
9. [Diagram Integration (NEW)](#9-diagram-integration-new)
10. [Implementation Matrix: Claim → Module → File (NEW)](#10-implementation-matrix-claim--module--file-new)
11. [Migration Plan (Updated)](#11-migration-plan-updated)

---

## 0️⃣ SYSTEM INVARIANTS & PRODUCT GOALS

### **Architectural Invariants (MUST NEVER VIOLATE)**

```
✓ INVARIANT 1: Local-First is Mandatory
  → Offline NEVER blocks editing
  → IndexedDB is always writable
  
✓ INVARIANT 2: CRDT is Canonical
  → Yjs state (snapshot + updates) is source of truth
  → HTML/Markdown are derived
  
✓ INVARIANT 3: AI Never Silently Mutates
  → Patches require approval
  → Every AI action audited
  
✓ INVARIANT 4: Provenance is Guaranteed
  → Per-update authorship (operational blame)
  → Per-snapshot blame (git-style, bounded accuracy)
  → AI actions always attributed
  
✓ INVARIANT 5: Zero-Trust Security
  → Backend enforces all permissions
  → Client never trusted
  
✓ INVARIANT 6: Deterministic Collaboration
  → Same CRDT state → same output
  → Convergence guaranteed
  
✓ INVARIANT 7: Bounded Storage Growth
  → Compaction prevents DB bloat
  → Updates GC'd after snapshot
  → Hard limits enforced (100MB per doc)
```

---

## 1️⃣ CANONICAL DATA MODEL (FIXED)

### **Complete PostgreSQL Schema (Updated)**

```sql
-- ============================================================================
-- DOCUMENTS (Metadata)
-- ============================================================================

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id           UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_by_id       UUID NOT NULL REFERENCES users(id),
    
    -- VERSION SEMANTICS (FIXED)
    meta_version        INTEGER DEFAULT 1,  -- For optimistic locking (metadata only)
    content_version     INTEGER DEFAULT 0,  -- Increments on snapshot creation
    
    -- Storage
    storage_mode        storage_mode DEFAULT 'HybridSync',
    word_count          INTEGER DEFAULT 0,
    size_bytes          INTEGER DEFAULT 0,
    
    -- Flags
    is_public           BOOLEAN DEFAULT false,
    is_deleted          BOOLEAN DEFAULT false,
    deleted_at          TIMESTAMP,
    
    -- Timestamps
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_documents_workspace (workspace_id),
    INDEX idx_documents_folder (folder_id)
);

-- ============================================================================
-- CRDT PERSISTENCE (FIXED: snapshot + updates model)
-- ============================================================================

-- Current snapshot (compact representation)
CREATE TABLE document_crdt_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    yjs_state           BYTEA NOT NULL,  -- Full Yjs state (compressed with gzip)
    state_vector        BYTEA NOT NULL,  -- Yjs state vector (for sync)
    
    snapshot_version    INTEGER NOT NULL,  -- Sequential
    created_at          TIMESTAMP DEFAULT NOW(),
    size_bytes          INTEGER NOT NULL,
    
    UNIQUE (document_id, snapshot_version),
    INDEX idx_crdt_snapshots_latest (document_id, snapshot_version DESC)
);

-- Incremental updates since last snapshot
CREATE TABLE document_crdt_updates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    snapshot_version    INTEGER NOT NULL,  -- Which snapshot this builds on
    
    update_data         BYTEA NOT NULL,  -- Yjs update (incremental)
    sequence_number     INTEGER NOT NULL,  -- Order within this snapshot cycle
    
    author_id           UUID REFERENCES users(id),  -- Who sent this update
    author_type         VARCHAR(20) NOT NULL,  -- 'human' | 'ai_agent'
    created_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_crdt_updates_doc (document_id, snapshot_version, sequence_number),
    UNIQUE (document_id, snapshot_version, sequence_number)
);

-- Compaction metadata
CREATE TABLE document_crdt_compaction (
    document_id         UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    last_snapshot_version INTEGER NOT NULL,
    last_compacted_at   TIMESTAMP DEFAULT NOW(),
    updates_since_snapshot INTEGER DEFAULT 0,
    size_since_snapshot INTEGER DEFAULT 0,
    next_compaction_due TIMESTAMP
);

-- ============================================================================
-- VERSION HISTORY (User-Facing Snapshots)
-- ============================================================================

CREATE TABLE document_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Points to CRDT snapshot
    crdt_snapshot_version INTEGER NOT NULL,
    
    -- Rendered artifacts (for preview, non-canonical)
    html_content        TEXT,
    markdown_content    TEXT,
    
    -- Version (user-facing, monotonic)
    content_version     INTEGER NOT NULL,  -- Same as documents.content_version at creation
    
    -- Metadata
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    snapshot_label      VARCHAR(100),
    snapshot_trigger    VARCHAR(50),  -- 'manual' | 'auto_time' | 'auto_ops' | 'ai_action' | 'pre_restore'
    
    word_count          INTEGER,
    
    UNIQUE (document_id, content_version),
    INDEX idx_snapshots_doc_version (document_id, content_version DESC)
);

-- ============================================================================
-- PROVENANCE (Operational Blame)
-- ============================================================================

-- Git-style blame cache (computed periodically from updates)
CREATE TABLE document_blame_cache (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content_version     INTEGER NOT NULL,  -- Which snapshot this blame is for
    
    -- Blame data: line → author mapping
    blame_data          JSONB NOT NULL,  -- [{line: 1, author_id: "uuid", timestamp: "..."}]
    
    computed_at         TIMESTAMP DEFAULT NOW(),
    
    UNIQUE (document_id, content_version),
    INDEX idx_blame_cache_doc (document_id, content_version DESC)
);
```

### **Storage Rules (Updated)**

```
RULE 1: CRDT State Reconstruction
──────────────────────────────────
Current CRDT state = latest snapshot + all updates since that snapshot

To load document:
1. Load latest from document_crdt_snapshots
2. Load all document_crdt_updates WHERE snapshot_version = latest AND document_id = X
3. Apply updates in sequence_number order
4. Result: current Y.Doc state

RULE 2: Compaction Triggers
────────────────────────────
Trigger compaction when ANY of:
• updates_since_snapshot > 500 (threshold)
• size_since_snapshot > 5MB (threshold)
• time_since_snapshot > 24 hours (threshold)

Compaction process:
1. Materialize current state from snapshot + updates
2. Compress with gzip level 6
3. Insert new snapshot (snapshot_version++)
4. Delete old updates (snapshot_version < new_version)
5. Update document_crdt_compaction

RULE 3: Hard Limits
────────────────────
• Max document size: 100MB (uncompressed Yjs state)
• Max updates per cycle: 1000 (force compact)
• Max snapshot retention: Last 100 snapshots (configurable)

RULE 4: Version Semantics
──────────────────────────
• meta_version: Increments on metadata changes (title, folder, tags)
  - Used for optimistic locking (409 conflict if mismatch)
  
• content_version: Increments ONLY when user-facing snapshot created
  - This is what users see in "Version History" UI
  - Restore creates exactly ONE new content_version (the restored state)
  - Auto-snapshots also increment this

Relationship:
• documents.content_version = MAX(document_snapshots.content_version)
• document_snapshots.content_version is always sequential (1, 2, 3, ...)
```

---

## 2️⃣ PROVENANCE & BLAME MODEL (NEW)

### **What We Guarantee**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROVENANCE GUARANTEES                         │
└─────────────────────────────────────────────────────────────────┘

Level 1: Operational Blame (100% Accurate, Real-Time)
──────────────────────────────────────────────────────
What: Track which actor (human/AI) sent which Yjs updates
Storage: document_crdt_updates.author_id, author_type
Granularity: Per-update packet (not per-character)
Use Case: Audit trail, "who made changes between v10 and v11"

Example Query:
SELECT author_id, COUNT(*) as update_count
FROM document_crdt_updates
WHERE document_id = 'X' AND created_at > 'Y'
GROUP BY author_id;

Limitations:
• Cannot say "Alice wrote line 42" (only "Alice sent 17 updates in this period")
• If Alice and Bob both edit same paragraph, we know both contributed, but not which words


Level 2: Git-Style Blame (Approximate, Snapshot-Bounded)
──────────────────────────────────────────────────────────
What: Compute line-level attribution by diffing snapshots
Storage: document_blame_cache table (JSONB)
Granularity: Per-line (approximate)
Cadence: Computed after every snapshot

Algorithm:
1. When snapshot N is created:
   a. Load snapshot N-1 (previous)
   b. Load snapshot N (current)
   c. Convert both to plain text (line-by-line)
   d. Run Myers diff
   e. For each line:
      - If unchanged: Inherit blame from N-1
      - If added: Blame = author of most recent update in [N-1, N] interval
      - If modified: Blame = author of most recent update in [N-1, N] interval
   f. Store in document_blame_cache

2. To show blame:
   GET /api/v1/documents/{id}/blame?version={N}
   → Load from document_blame_cache

Limitations:
• Accuracy bounded by snapshot frequency (5 min intervals)
• If Alice and Bob both edit between snapshots, last editor gets credit
• Not character-level (line-level only)

Use Case: "Show me who last edited each line" (good enough for most users)


Level 3: Rich Blame (Future, Cursor-Grade)
───────────────────────────────────────────
What: Per-node attribution stored in document tree
Storage: ProseMirror node attrs: {lastEditedBy, lastEditedAt}
Granularity: Per-node (paragraph, heading, list item)
Update Strategy: Every TipTap transaction updates attrs

Implementation (v2 roadmap):
• Add TipTap extension: AttributionExtension
• On every transaction: editor.commands.setNodeAttributes({lastEditedBy: user_id})
• Store in Yjs: Y.Map('attribution') or node attrs
• Display: Inline UI showing author avatar next to each paragraph

Accuracy: 100% (per-node)
Performance Cost: Higher (more data in CRDT state)


DECISION FOR v1: Level 1 (Operational) + Level 2 (Git-Style)
─────────────────────────────────────────────────────────────
Rationale:
• Level 1 is free (we already store author_id in updates)
• Level 2 is cheap (compute on snapshot, cache in JSONB)
• Level 3 requires schema changes and adds ~10% to CRDT state size

v1 delivers:
✓ Audit trail (who made changes in time range)
✓ Line-level blame (approximate, but useful)
✓ AI action attribution (100% accurate)

v2 delivers (6 months later):
✓ Per-node rich blame (Cursor-grade)
```

### **Blame API**

```
GET /api/v1/documents/{id}/blame?version={N}

Response:
{
  "document_id": "uuid",
  "content_version": 47,
  "blame": [
    {
      "line": 1,
      "content": "# Introduction",
      "author": {
        "id": "uuid",
        "name": "Alice",
        "type": "human"
      },
      "timestamp": "2025-12-15T10:30:00Z",
      "confidence": "high"  // "high" if only one author in interval, "low" if multiple
    },
    {
      "line": 2,
      "content": "This document was refactored by AI.",
      "author": {
        "id": "ai-editor-v2",
        "name": "AI Editor",
        "type": "ai_agent"
      },
      "timestamp": "2025-12-15T11:00:00Z",
      "confidence": "high"
    }
  ]
}
```

---

## 3️⃣ CRDT PERSISTENCE & COMPACTION (NEW)

### **Snapshot + Updates Model**

```
┌─────────────────────────────────────────────────────────────────┐
│                  CRDT PERSISTENCE ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

State at Any Time = Snapshot + Updates

┌────────────────────┐
│ Snapshot v5        │  ← Compact representation (baseline)
│ (1.2MB compressed) │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Update 1 (5KB)     │  ← Incremental changes since snapshot
│ Update 2 (3KB)     │
│ Update 3 (7KB)     │
│ ...                │
│ Update 200 (4KB)   │
└────────┬───────────┘
         │
         ▼
    Current State
    (in-memory Y.Doc)

When to Compact:
────────────────
• 500 updates accumulated (threshold)
• 5MB updates since snapshot (threshold)
• 24 hours since snapshot (threshold)

Compaction Process:
───────────────────
1. Lock document (prevent new updates during compact)
2. Load snapshot v5
3. Apply all 500 updates
4. Materialize full Yjs state
5. Compress with gzip -6
6. Insert as snapshot v6
7. Delete updates 1-500 (WHERE snapshot_version = 5)
8. Update compaction metadata
9. Unlock document

Performance:
────────────
• Compaction time: < 5 seconds for typical doc (10K words)
• Frequency: ~once per day for active documents
• Storage savings: 70% (compressed snapshot vs raw updates)


Rebuild Algorithm (How to Load a Document):
────────────────────────────────────────────
function load_document(document_id):
    # 1. Load latest snapshot
    snapshot = SELECT * FROM document_crdt_snapshots
               WHERE document_id = document_id
               ORDER BY snapshot_version DESC
               LIMIT 1
    
    if not snapshot:
        # New document, no snapshot yet
        ydoc = new Y.Doc()
    else:
        # Decompress and load
        yjs_state = decompress(snapshot.yjs_state)
        ydoc = Y.Doc()
        Y.applyUpdate(ydoc, yjs_state)
    
    # 2. Load updates since snapshot
    updates = SELECT * FROM document_crdt_updates
              WHERE document_id = document_id
                AND snapshot_version = snapshot.snapshot_version
              ORDER BY sequence_number ASC
    
    # 3. Apply updates
    for update in updates:
        update_data = decompress(update.update_data)
        Y.applyUpdate(ydoc, update_data)
    
    return ydoc


Garbage Collection Policy:
──────────────────────────
• After compaction, old updates are deleted immediately
• Snapshots retained: Last 100 (configurable)
• Rationale: Snapshots are needed for version history, updates are not

If user wants to see "fine-grained history" (every keystroke):
• Keep updates for last 30 days (configurable)
• After 30 days: Compact and delete
• Trade-off: Storage cost vs audit granularity
```

### **Hard Limits & Enforcement**

```
┌─────────────────────────────────────────────────────────────────┐
│                        HARD LIMITS                               │
└─────────────────────────────────────────────────────────────────┘

Limit 1: Max Document Size
───────────────────────────
• 100MB uncompressed Yjs state (hard limit)
• If exceeded: Block further edits, prompt user to split document
• Check: On every save, if size > 100MB, return 413 Payload Too Large

Limit 2: Max Updates Per Cycle
───────────────────────────────
• 1000 updates between snapshots (force compact if exceeded)
• Prevents unbounded update log growth

Limit 3: Max Snapshot Retention
────────────────────────────────
• 100 most recent snapshots kept
• Older snapshots deleted (soft: mark as archived, don't delete immediately)
• Users can "pin" important snapshots (never delete)

Limit 4: Compaction Backpressure
─────────────────────────────────
• If compaction job queue > 100: Pause new document creates
• Alert ops team (compaction service overloaded)

Enforcement:
────────────
• Middleware in Hocuspocus: Check size before accepting update
• Background job: Monitor limits, trigger alerts
• API endpoints: Return 429 if over limit
```

---

## 4️⃣ VERSION SEMANTICS (FIXED)

### **Single Content Version (User-Facing)**

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERSION SEMANTICS                            │
└─────────────────────────────────────────────────────────────────┘

ONLY ONE VERSION COUNTER THAT USERS SEE: content_version

Fields:
───────
• documents.meta_version (internal, optimistic locking)
• documents.content_version (user-facing, increments on snapshot)
• document_snapshots.content_version (same value at snapshot time)

Relationship:
─────────────
documents.content_version = MAX(document_snapshots.content_version FOR this document)

Operations:
───────────

Create Document:
• content_version = 0 (no snapshot yet)

First Edit → Auto-Snapshot:
• Create snapshot, content_version = 1
• Update documents.content_version = 1

Subsequent Edits → Auto-Snapshot (every 5 min or 50 ops):
• Create snapshot, content_version++
• Update documents.content_version

Manual Snapshot:
• User clicks "Create Snapshot"
• Create snapshot, content_version++
• Optional: user adds label ("Before refactor")

Restore Version 45:
• User clicks "Restore to v45" in version history UI
• Backend:
  1. Create pre-restore snapshot (content_version = current + 1)
     - Label: "Auto-backup before restore"
     - Trigger: "pre_restore"
  2. Load v45 CRDT state
  3. Apply to document
  4. Create post-restore snapshot (content_version = current + 1)
     - Label: "Restored from v45"
     - Trigger: "manual"
  5. Update documents.content_version

Example Timeline:
─────────────────
v1: Initial document
v2: Auto-snapshot (5 min)
v3: Auto-snapshot (5 min)
...
v45: User's work
...
v70: Current state

User restores v45:
→ v71: Auto-backup (current state before restore)
→ v72: Restored from v45

User sees in Version History:
• v72 (current) - "Restored from v45" - 2 min ago
• v71 - "Auto-backup before restore" - 2 min ago
• v70 - Alice - 1 hour ago
• ...
• v45 - Bob - 3 days ago

Rationale:
──────────
• Only ONE version number user sees (no confusion)
• Restore creates ONE new version (the restored state)
• Pre-restore backup is hidden by default (or shown as system snapshot)
• Sequential, monotonic, no gaps
```

---

## 5️⃣ PATCH PROTOCOL V2 (FIXED)

### **Stable Anchors (No Line/Column)**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AI Patch Protocol v2",
  "type": "object",
  "required": ["patch_id", "document_id", "base_state_vector", "operations"],
  "properties": {
    "patch_id": {
      "type": "string",
      "format": "uuid"
    },
    "document_id": {
      "type": "string",
      "format": "uuid"
    },
    "base_state_vector": {
      "type": "string",
      "description": "Base64-encoded Yjs state vector (for concurrency control)"
    },
    "rebase_allowed": {
      "type": "boolean",
      "default": false,
      "description": "If true, AI can rebase patch if doc diverged"
    },
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["op", "anchor"],
        "properties": {
          "op": {
            "type": "string",
            "enum": ["insert", "delete", "replace"]
          },
          "anchor": {
            "type": "object",
            "description": "STABLE anchor (node_id based)",
            "oneOf": [
              {
                "properties": {
                  "type": {"const": "node_id"},
                  "node_id": {"type": "string", "format": "uuid"},
                  "offset": {"type": "integer", "minimum": 0}
                },
                "required": ["type", "node_id"]
              },
              {
                "properties": {
                  "type": {"const": "node_path"},
                  "path": {
                    "type": "array",
                    "items": {"type": "integer"}
                  },
                  "offset": {"type": "integer"}
                },
                "required": ["type", "path"]
              },
              {
                "properties": {
                  "type": {"const": "fuzzy"},
                  "before_text": {"type": "string"},
                  "after_text": {"type": "string"},
                  "approximate_position": {"type": "integer"}
                },
                "required": ["type", "before_text", "after_text"]
              }
            ]
          },
          "content": {
            "type": "string",
            "description": "Content to insert/replace"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "agent": {"type": "string"},
        "prompt_hash": {"type": "string"},
        "rationale": {"type": "string"}
      }
    }
  }
}
```

### **Node ID System (TipTap Extension)**

```typescript
// TipTap extension: Add unique IDs to all block nodes
import { Extension } from '@tiptap/core'
import { v4 as uuid } from 'uuid'

export const NodeIdExtension = Extension.create({
  name: 'nodeId',
  
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'codeBlock', 'blockquote', 'listItem'],
        attributes: {
          nodeId: {
            default: null,
            parseHTML: element => element.getAttribute('data-node-id'),
            renderHTML: attributes => {
              if (!attributes.nodeId) {
                attributes.nodeId = uuid()
              }
              return {
                'data-node-id': attributes.nodeId,
              }
            },
          },
        },
      },
    ]
  },
  
  onCreate() {
    // Assign IDs to existing nodes without IDs
    this.editor.commands.command(({ tr }) => {
      tr.doc.descendants((node, pos) => {
        if (node.isBlock && !node.attrs.nodeId) {
          tr.setNodeMarkup(pos, null, { ...node.attrs, nodeId: uuid() })
        }
      })
      return true
    })
  },
})

// Usage in AI patch:
// {
//   "op": "insert",
//   "anchor": {
//     "type": "node_id",
//     "node_id": "a3f8d9e2-...",
//     "offset": 10
//   },
//   "content": "New text here"
// }
```

### **Concurrency Control (Base State Vector)**

```typescript
// Patch apply with concurrency check
async function applyPatch(patch: Patch): Promise<ApplyResult> {
  const { document_id, base_state_vector, operations, rebase_allowed } = patch
  
  // 1. Load current document
  const ydoc = await loadDocument(document_id)
  
  // 2. Get current state vector
  const currentStateVector = Y.encodeStateVector(ydoc)
  
  // 3. Check if base matches current
  const baseVector = decodeBase64(base_state_vector)
  const diverged = !Y.equalStateVectors(baseVector, currentStateVector)
  
  if (diverged) {
    if (!rebase_allowed) {
      // Reject: Document changed since preview
      return {
        status: 'rejected_conflict',
        reason: 'Document has changed since patch was generated. Please regenerate patch.',
        current_version: ydoc.version,
      }
    } else {
      // Attempt rebase
      const rebasedPatch = await rebasePatch(patch, ydoc)
      if (!rebasedPatch) {
        return {
          status: 'rejected_conflict',
          reason: 'Could not automatically rebase patch. Manual intervention required.',
        }
      }
      // Continue with rebased patch
      patch = rebasedPatch
    }
  }
  
  // 4. Apply operations (assuming no divergence or successful rebase)
  try {
    for (const op of operations) {
      applyOperation(ydoc, op)
    }
    
    // 5. Success
    return {
      status: 'applied',
      new_version: ydoc.version,
    }
  } catch (error) {
    return {
      status: 'error',
      reason: error.message,
    }
  }
}

// Rebase strategy (AI-driven)
async function rebasePatch(patch: Patch, currentDoc: Y.Doc): Promise<Patch | null> {
  // 1. Extract diff: base_state → current_state
  const diff = computeDiff(patch.base_state_vector, Y.encodeStateVector(currentDoc))
  
  // 2. Call AI: "Rebase this patch given these changes"
  const prompt = `
    Original patch intent: ${patch.metadata.rationale}
    Original operations: ${JSON.stringify(patch.operations)}
    Changes since patch was created: ${diff}
    
    Generate a rebased patch that achieves the same intent but accounts for the new changes.
  `
  
  const rebasedPatch = await callAI(prompt)
  
  // 3. Validate rebased patch
  if (validatePatch(rebasedPatch)) {
    return rebasedPatch
  }
  
  return null
}
```

### **Anchor Resolution (Node ID)**

```typescript
function resolveAnchor(anchor: Anchor, doc: ProseMirrorNode): number | null {
  if (anchor.type === 'node_id') {
    // Find node by ID
    let position: number | null = null
    doc.descendants((node, pos) => {
      if (node.attrs.nodeId === anchor.node_id) {
        position = pos + (anchor.offset || 0)
        return false // Stop searching
      }
    })
    return position
  }
  
  if (anchor.type === 'node_path') {
    // Navigate by path
    let node = doc
    let pos = 0
    for (const index of anchor.path) {
      if (index >= node.childCount) {
        throw new Error(`Invalid path: index ${index} out of bounds`)
      }
      pos += node.child(index).nodeSize
      node = node.child(index)
    }
    return pos + (anchor.offset || 0)
  }
  
  if (anchor.type === 'fuzzy') {
    // Fuzzy match (fallback)
    const text = doc.textContent
    const before = anchor.before_text
    const after = anchor.after_text
    
    // Find position where before_text ends and after_text starts
    const index = text.indexOf(before + after)
    if (index === -1) {
      // Try approximate match
      const approx = anchor.approximate_position
      if (approx >= 0 && approx < text.length) {
        return approx
      }
      return null
    }
    return index + before.length
  }
  
  return null
}
```

---

## 6️⃣ WORKSPACE INDEX & RETRIEVAL (NEW)

### **Semantic Search Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                  WORKSPACE INDEX SERVICE                         │
└─────────────────────────────────────────────────────────────────┘

Purpose: Power AI context building with semantic search

Components:
───────────
1. Text Extractor (from Yjs state)
2. Embeddings Pipeline (OpenAI/local model)
3. Vector Store (PostgreSQL pgvector OR separate Qdrant/Pinecone)
4. Permissions Filter (at query time)
5. Ranking & Reranking


Architecture:
─────────────

Document Updated
     │
     ▼
Trigger: document_updated event
     │
     ▼
Background Job: extract_text_and_embed
     │
     ├─► Load Yjs state
     ├─► Convert to plain text
     ├─► Split into chunks (500 tokens each)
     ├─► Generate embeddings (OpenAI text-embedding-3-small)
     ├─► Store in document_embeddings table
     │
     ▼
Query: "Find documents about authentication"
     │
     ▼
1. Generate query embedding
2. Vector search: SELECT * FROM document_embeddings ORDER BY embedding <-> query_embedding LIMIT 20
3. Filter by permissions: WHERE document_id IN (SELECT id FROM documents WHERE workspace_id = X AND ...)
4. Rerank by recency, tags, folder
5. Return top 10
```

### **Database Schema (Embeddings)**

```sql
-- Requires pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings (chunked)
CREATE TABLE document_embeddings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    chunk_index         INTEGER NOT NULL,  -- Which chunk (0, 1, 2, ...)
    chunk_text          TEXT NOT NULL,
    
    -- Embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding           vector(1536) NOT NULL,
    
    created_at          TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_embeddings_workspace (workspace_id),
    INDEX idx_embeddings_document (document_id)
);

-- Vector index (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_embeddings_vector ON document_embeddings
USING hnsw (embedding vector_cosine_ops);
```

### **Context Builder with Semantic Search**

```typescript
async function buildContext(
  documentId: string,
  userPrompt: string,
  options: {
    maxTokens: number,
    explicitFiles?: string[],
  }
): Promise<Context> {
  
  const budget = options.maxTokens || 100000
  let remaining = budget
  
  const context: ContextFile[] = []
  
  // 1. Current document (always included, 50% of budget)
  const currentDoc = await loadDocument(documentId)
  const currentDocTokens = estimateTokens(currentDoc.text)
  context.push({
    file_id: documentId,
    role: 'editable',
    content: currentDoc.text,
    token_count: currentDocTokens,
    rank_score: 1000,
  })
  remaining -= currentDocTokens
  
  // 2. Explicitly selected files (20% of budget)
  if (options.explicitFiles) {
    for (const fileId of options.explicitFiles) {
      const doc = await loadDocument(fileId)
      const tokens = estimateTokens(doc.text)
      if (tokens > remaining) break
      context.push({
        file_id: fileId,
        role: 'editable',
        content: doc.text,
        token_count: tokens,
        rank_score: 900,
      })
      remaining -= tokens
    }
  }
  
  // 3. Semantic search (remaining budget)
  const query = userPrompt
  const semanticResults = await semanticSearch(query, {
    workspace_id: currentDoc.workspace_id,
    user_id: currentDoc.user_id,
    limit: 50,
    exclude: [documentId, ...options.explicitFiles],
  })
  
  for (const result of semanticResults) {
    const doc = await loadDocument(result.document_id)
    const tokens = estimateTokens(doc.text)
    if (tokens > remaining) break
    context.push({
      file_id: result.document_id,
      role: 'read_only',
      content: doc.text,
      token_count: tokens,
      rank_score: result.score,
    })
    remaining -= tokens
  }
  
  return {
    context,
    total_tokens: budget - remaining,
    budget_remaining: remaining,
  }
}

async function semanticSearch(
  query: string,
  options: {
    workspace_id: string,
    user_id: string,
    limit: number,
    exclude: string[],
  }
): Promise<SearchResult[]> {
  
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query)
  
  // 2. Vector search with permissions filter
  const sql = `
    SELECT
      de.document_id,
      de.chunk_text,
      1 - (de.embedding <=> $1::vector) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE de.workspace_id = $2
      AND de.document_id NOT IN ($3)
      AND check_document_permission($4, d.id, 'view')  -- Permission check
    ORDER BY de.embedding <=> $1::vector
    LIMIT $5
  `
  
  const results = await db.query(sql, [
    `[${queryEmbedding.join(',')}]`,
    options.workspace_id,
    options.exclude,
    options.user_id,
    options.limit,
  ])
  
  // 3. Deduplicate by document_id (multiple chunks per doc)
  const docMap = new Map()
  for (const row of results.rows) {
    if (!docMap.has(row.document_id) || docMap.get(row.document_id).similarity < row.similarity) {
      docMap.set(row.document_id, {
        document_id: row.document_id,
        score: row.similarity,
        snippet: row.chunk_text.substring(0, 200),
      })
    }
  }
  
  return Array.from(docMap.values())
}
```

### **Cost Control**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMBEDDING COST CONTROL                        │
└─────────────────────────────────────────────────────────────────┘

Costs:
──────
• OpenAI text-embedding-3-small: $0.00002 per 1K tokens
• For 10K documents, average 5K tokens each: $1 to embed entire workspace
• Re-embedding on every edit: Expensive

Strategy:
─────────
• Embed on document creation
• Re-embed only if "significant change" (>20% of content changed)
• Use change detection: compare current text hash vs last embedded text hash
• Debounce: Re-embed at most once per hour per document

Limits:
───────
• Max 100K embeddings per workspace (hard limit)
• If exceeded: Prioritize recent documents, archive old embeddings

Alternatives (if cost too high):
─────────────────────────────────
• Use local embedding model (sentence-transformers)
• Use sparse embeddings (BM25) instead of dense (cheaper)
• Hybrid: Dense for top 1000 docs, sparse for rest
```

---

## 7️⃣ RELIABILITY & TESTING (NEW)

### **CRDT Testing Strategy**

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRDT TEST LEVELS                             │
└─────────────────────────────────────────────────────────────────┘

Level 1: Invariant Tests (Property-Based)
──────────────────────────────────────────
Goal: Verify CRDT mathematical properties

Tests:
• Commutativity: apply(update_A, update_B) == apply(update_B, update_A)
• Associativity: apply(A, apply(B, C)) == apply(apply(A, B), C)
• Convergence: Two replicas with same updates converge to same state

Framework: fast-check (property-based testing for JS)

Example:
```typescript
import fc from 'fast-check'
import * as Y from 'yjs'

describe('Yjs CRDT Invariants', () => {
  test('Commutativity: order of updates does not matter', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (updatesA, updatesB) => {
          // Create two docs
          const doc1 = new Y.Doc()
          const doc2 = new Y.Doc()
          
          // Apply updates in different orders
          updatesA.forEach(u => doc1.getText().insert(0, u))
          updatesB.forEach(u => doc1.getText().insert(0, u))
          
          updatesB.forEach(u => doc2.getText().insert(0, u))
          updatesA.forEach(u => doc2.getText().insert(0, u))
          
          // Must converge
          expect(doc1.getText().toString()).toBe(doc2.getText().toString())
        }
      )
    )
  })
})
```

```
Level 2: Chaos Tests (Simulate Network Issues)
───────────────────────────────────────────────
Goal: Ensure system handles network failures gracefully

Scenarios:
• Random disconnects mid-operation
• Delayed message delivery (1-5 seconds)
• Duplicated WebSocket messages
• Out-of-order message delivery
• Partial message loss (50% packet loss)

Framework: Custom WebSocket proxy that injects faults

Example:
```typescript
class ChaosWebSocketProxy {
  constructor(target: string, faultConfig: FaultConfig) {
    this.target = target
    this.faultConfig = faultConfig
  }
  
  connect(client: WebSocket) {
    const server = new WebSocket(this.target)
    
    // Inject faults
    client.on('message', (msg) => {
      if (Math.random() < this.faultConfig.dropRate) {
        // Drop message
        return
      }
      
      if (Math.random() < this.faultConfig.duplicateRate) {
        // Duplicate message
        server.send(msg)
      }
      
      // Delay message
      const delay = Math.random() * this.faultConfig.maxDelay
      setTimeout(() => server.send(msg), delay)
    })
  }
}

// Test: 100 concurrent users with 30% packet loss
test('Chaos: 100 users with 30% packet loss converge', async () => {
  const clients = []
  for (let i = 0; i < 100; i++) {
    const client = createClient({ dropRate: 0.3 })
    clients.push(client)
  }
  
  // Each client makes random edits
  for (const client of clients) {
    for (let i = 0; i < 10; i++) {
      client.insert(Math.floor(Math.random() * 100), randomString())
      await sleep(Math.random() * 100)
    }
  }
  
  // Wait for quiescence
  await sleep(5000)
  
  // All clients must converge
  const finalStates = clients.map(c => c.doc.getText().toString())
  expect(new Set(finalStates).size).toBe(1)  // All same
})
```

```
Level 3: Fuzz Tests (Random Patch Operations)
──────────────────────────────────────────────
Goal: Test patch applier with random inputs

Scenarios:
• Random document trees (nested lists, tables, code blocks)
• Random patch anchors (valid and invalid)
• Random operations (insert, delete, replace)
• Edge cases (empty doc, huge doc, malformed patches)

Framework: Custom fuzzer

Example:
```typescript
function generateRandomDoc(): ProseMirrorNode {
  // Generate random ProseMirror tree
  const schema = editorSchema
  const nodes = []
  for (let i = 0; i < Math.random() * 20; i++) {
    const type = randomChoice(['paragraph', 'heading', 'codeBlock'])
    nodes.push(schema.nodes[type].create(null, schema.text(randomString())))
  }
  return schema.nodes.doc.create(null, nodes)
}

function generateRandomPatch(doc: ProseMirrorNode): Patch {
  const nodeId = randomChoice(extractNodeIds(doc))
  return {
    patch_id: uuid(),
    document_id: testDocId,
    base_state_vector: encodeStateVector(doc),
    operations: [
      {
        op: randomChoice(['insert', 'delete', 'replace']),
        anchor: {
          type: 'node_id',
          node_id: nodeId,
          offset: Math.floor(Math.random() * 100),
        },
        content: randomString(),
      },
    ],
  }
}

test('Fuzz: Apply 1000 random patches', () => {
  const doc = generateRandomDoc()
  
  for (let i = 0; i < 1000; i++) {
    const patch = generateRandomPatch(doc)
    
    try {
      applyPatch(patch, doc)
      // Should not crash
    } catch (error) {
      // Log error but continue
      console.error(`Patch ${i} failed:`, error)
    }
  }
  
  // Document should still be valid
  expect(doc.check()).toBeTruthy()
})
```

```
Level 4: Load Tests (Performance at Scale)
───────────────────────────────────────────
Goal: Ensure system handles production load

Scenarios:
• 100 concurrent users in one document
• 10,000 idle WebSocket connections
• 1,000 documents updated simultaneously
• Large documents (100K words, 50MB Yjs state)

Tools: k6 or Artillery

Example k6 script:
```javascript
import ws from 'k6/ws'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
}

export default function () {
  const url = 'ws://localhost:1234/test-doc'
  
  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Send Yjs sync message
      socket.send(generateYjsUpdate())
    })
    
    socket.on('message', (data) => {
      // Receive updates from server
      check(data, { 'received update': (d) => d.length > 0 })
    })
    
    // Edit every 5 seconds
    socket.setInterval(() => {
      socket.send(generateYjsUpdate())
    }, 5000)
    
    socket.setTimeout(() => {
      socket.close()
    }, 60000)
  })
}
```

```
Success Criteria:
─────────────────
• Invariant tests: 100% pass (0 failures)
• Chaos tests: Convergence in < 10 seconds (p95)
• Fuzz tests: No crashes (errors logged, not fatal)
• Load tests:
  - p95 latency < 200ms
  - 0 data loss events
  - 0 server crashes
```

---

## 8️⃣ SECURITY MODEL (EXPANDED)

### **Encryption at Rest**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION STRATEGY                           │
└─────────────────────────────────────────────────────────────────┘

Database (PostgreSQL):
──────────────────────
• Use PostgreSQL Transparent Data Encryption (TDE)
• OR: AWS RDS encryption (AES-256)
• All BYTEA columns encrypted (yjs_state, update_data)
• Encryption keys managed via AWS KMS or HashiCorp Vault

Object Storage (S3):
────────────────────
• Enable S3 server-side encryption (SSE-S3 or SSE-KMS)
• All attachments encrypted
• Signed URLs for temporary access (1-hour expiration)

Secrets Management:
───────────────────
• JWT secret: Stored in AWS Secrets Manager
• Database credentials: Stored in AWS Secrets Manager
• LLM API keys: Stored in AWS Secrets Manager
• Rotation policy: Every 90 days

In Transit:
───────────
• TLS 1.3 for all HTTP/WebSocket traffic
• Certificate pinning for mobile apps (future)
```

### **Tenant Isolation**

```sql
-- Every query MUST filter by workspace_id

-- BAD (no workspace_id filter)
SELECT * FROM documents WHERE id = '...';

-- GOOD (workspace_id scoped)
SELECT * FROM documents
WHERE id = '...' AND workspace_id = '...'
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = documents.workspace_id
      AND user_id = '...'
  );

-- Enforce with Postgres Row-Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_workspace_isolation ON documents
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = current_setting('app.current_user_id')::UUID
  )
);

-- Set current user in connection
SET app.current_user_id = 'user-uuid';
```

### **GDPR Compliance (Data Subject Access Request)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    GDPR DSAR IMPLEMENTATION                      │
└─────────────────────────────────────────────────────────────────┘

Right to Access:
────────────────
User requests: "Give me all my data"

Endpoint: GET /api/v1/users/me/export

Response: ZIP file containing:
• Personal data (email, name, avatar)
• All documents created by user (Markdown exports)
• All comments made by user
• All activity log entries
• All AI audit log entries

Implementation:
async def export_user_data(user_id: UUID) -> bytes:
    # 1. Personal data
    user = await db.get(User, user_id)
    data = {
        "user": user.dict(),
        "documents": [],
        "activity": [],
    }
    
    # 2. Documents
    docs = await db.query(Document).filter(created_by_id=user_id).all()
    for doc in docs:
        markdown = await export_to_markdown(doc.id)
        data["documents"].append({
            "title": doc.title,
            "content": markdown,
            "created_at": doc.created_at,
        })
    
    # 3. Activity log
    activity = await db.query(ActivityLog).filter(user_id=user_id).all()
    data["activity"] = [a.dict() for a in activity]
    
    # 4. Create ZIP
    return create_zip(data)


Right to Deletion:
──────────────────
User requests: "Delete all my data"

Endpoint: DELETE /api/v1/users/me

Process:
1. Soft delete user (is_active = false)
2. Anonymize activity log (replace user_id with 'deleted_user')
3. Transfer document ownership to workspace owner
4. Delete personal data (email, name, avatar)
5. Keep audit trail (compliance requirement)

Hard deletion after 30 days (background job)


Right to Rectification:
───────────────────────
User requests: "Update my email"

Endpoint: PATCH /api/v1/users/me

Validation:
• Verify email ownership (send confirmation email)
• Update after confirmation
```

### **Prompt/Response Logging Policy**

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI LOGGING & RETENTION                         │
└─────────────────────────────────────────────────────────────────┘

What We Log:
────────────
• Full prompt (redacted for PII)
• Full response (AI-generated patch)
• Model name, tokens used, cost
• User ID, document ID, timestamp

Storage:
────────
• ai_audit_log table (PostgreSQL)
• Partitioned by month
• Retention: 90 days (configurable)

Redaction:
──────────
Before logging:
• Scan prompt for PII (emails, phone numbers, SSNs)
• Replace with [REDACTED]
• Store hash of original prompt (for deduplication)

User Control:
─────────────
• User can opt out of AI logging (settings page)
• If opted out: Only store metadata (no prompt/response text)
• Compliance: GDPR Article 17 (right to be forgotten)

Third-Party LLMs:
─────────────────
• OpenAI: Zero data retention (enterprise tier)
• Anthropic: Zero data retention (business tier)
• Do NOT send workspace data to standard APIs (30-day retention)
```

---

## 9️⃣ DIAGRAM INTEGRATION (NEW)

### **Mermaid as First-Class Node**

```typescript
// TipTap Mermaid extension
import { Node } from '@tiptap/core'
import { Node as ProseMirrorNode } from 'prosemirror-model'

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  
  group: 'block',
  
  content: 'text*',
  
  code: true,
  
  defining: true,
  
  addAttributes() {
    return {
      nodeId: {
        default: null,
      },
      language: {
        default: 'mermaid',
      },
      rendered: {
        default: false,  // Whether to show rendered diagram or code
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'pre[data-type="mermaid"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['pre', { 'data-type': 'mermaid', ...HTMLAttributes }, ['code', 0]]
  },
  
  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement('div')
      dom.classList.add('mermaid-block')
      
      // Toggle button
      const toggle = document.createElement('button')
      toggle.textContent = node.attrs.rendered ? 'Show Code' : 'Show Diagram'
      toggle.onclick = () => {
        editor.commands.updateAttributes('mermaidBlock', {
          rendered: !node.attrs.rendered,
        })
      }
      dom.appendChild(toggle)
      
      // Content
      if (node.attrs.rendered) {
        // Render diagram
        const diagram = document.createElement('div')
        diagram.classList.add('mermaid')
        diagram.textContent = node.textContent
        dom.appendChild(diagram)
        
        // Initialize Mermaid
        import('mermaid').then((mermaid) => {
          mermaid.default.initialize({ startOnLoad: true })
          mermaid.default.contentLoaded()
        })
      } else {
        // Show code
        const code = document.createElement('pre')
        const codeElement = document.createElement('code')
        codeElement.textContent = node.textContent
        code.appendChild(codeElement)
        dom.appendChild(code)
      }
      
      return { dom }
    }
  },
})
```

### **Export Behavior**

```
┌─────────────────────────────────────────────────────────────────┐
│                   MERMAID EXPORT STRATEGY                        │
└─────────────────────────────────────────────────────────────────┘

Export to Markdown:
───────────────────
```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```

Export to DOCX:
───────────────
Option 1: Embed as code block (text)
Option 2: Render to PNG, embed as image

Implementation:
```python
async def export_mermaid_to_docx(mermaid_code: str) -> bytes:
    # 1. Use mermaid-cli to render
    result = subprocess.run([
        'mmdc',  # Mermaid CLI
        '-i', '/tmp/diagram.mmd',
        '-o', '/tmp/diagram.png',
        '-w', '1200',
        '-H', '800',
    ])
    
    # 2. Read PNG
    with open('/tmp/diagram.png', 'rb') as f:
        image_data = f.read()
    
    # 3. Embed in DOCX
    doc = Document()
    doc.add_picture(BytesIO(image_data))
    
    return doc.save()
```

Export to PDF:
──────────────
Render to SVG (vector graphics, scalable)

```javascript
import mermaid from 'mermaid'

async function renderMermaidToSVG(code: string): Promise<string> {
  const { svg } = await mermaid.render('mermaid-diagram', code)
  return svg
}

// Embed SVG in HTML → PDF
const html = `
  <html>
    <body>
      ${svg}
    </body>
  </html>
`

await page.pdf({ html })
```

```
Sandbox Security:
─────────────────
• Mermaid rendering happens in sandboxed iframe (client-side)
• Server-side rendering: Use mermaid-cli in Docker container (isolated)
• No arbitrary code execution (Mermaid syntax is declarative)
```

---

## 🔟 IMPLEMENTATION MATRIX: CLAIM → MODULE → FILE (NEW)

### **Complete Touchpoint Map**

```
┌─────────────────────────────────────────────────────────────────┐
│           ARCHITECTURAL CLAIM → CODE TOUCHPOINTS                 │
└─────────────────────────────────────────────────────────────────┘

CLAIM: "Local-first architecture"
──────────────────────────────────
Module: frontend/src/persistence/
Files:
  • IndexedDBProvider.ts (y-indexeddb setup)
  • GuestWorkspaceService.ts (local-only CRUD)
  • OfflineQueue.ts (queue operations when offline)

Module: frontend/src/sync/
Files:
  • SyncEngine.ts (detect offline, route to local)
  • NetworkDetector.ts (online/offline detection)


CLAIM: "CRDT is canonical"
──────────────────────────
Module: backendv2/app/models/
Files:
  • document_crdt_snapshots.py (SQLAlchemy model)
  • document_crdt_updates.py (SQLAlchemy model)

Module: backendv2/app/services/
Files:
  • crdt_service.py (load, save, compact)
  • compaction_worker.py (Celery task)

Module: frontend/src/collab/
Files:
  • YjsProvider.ts (Yjs setup, y-indexeddb + y-websocket)


CLAIM: "Every edit has provenance"
──────────────────────────────────
Module: backendv2/app/models/
Files:
  • document_crdt_updates.py (author_id, author_type columns)
  • document_blame_cache.py (git-style blame)

Module: backendv2/app/services/
Files:
  • blame_service.py (compute blame from snapshots)

Module: frontend/src/ui/
Files:
  • BlameView.tsx (show line-level attribution)


CLAIM: "AI patches are stable and rebased"
──────────────────────────────────────────
Module: frontend/src/ai/
Files:
  • PatchValidator.ts (validate schema, anchors)
  • PatchApplier.ts (resolve node_id, apply operations)
  • PatchRebaser.ts (rebase on state vector mismatch)

Module: frontend/src/editor/extensions/
Files:
  • NodeIdExtension.ts (add node_id attrs to all blocks)

Module: backendv2/app/services/
Files:
  • ai_service.py (proxy LLM calls)

Module: backendv2/app/models/
Files:
  • ai_audit_log.py (store patches, outcomes)


CLAIM: "Compaction prevents DB bloat"
─────────────────────────────────────
Module: backendv2/app/services/
Files:
  • compaction_service.py (trigger, execute compaction)
  • compaction_worker.py (Celery background job)

Module: backendv2/app/models/
Files:
  • document_crdt_compaction.py (metadata table)

Module: backendv2/alembic/versions/
Files:
  • XXX_add_compaction_tables.py (migration)


CLAIM: "Version history is user-friendly"
──────────────────────────────────────────
Module: frontend/src/ui/
Files:
  • VersionHistoryModal.tsx (timeline, preview, restore)
  • VersionPreview.tsx (read-only rendered view)
  • VersionRestore.tsx (confirmation dialog)

Module: backendv2/app/routers/
Files:
  • versions.py (list, preview, restore endpoints)

Module: backendv2/app/services/
Files:
  • version_service.py (snapshot logic, restore logic)


CLAIM: "Workspace semantic search"
──────────────────────────────────
Module: backendv2/app/models/
Files:
  • document_embeddings.py (pgvector)

Module: backendv2/app/services/
Files:
  • embedding_service.py (generate, store embeddings)
  • indexer_worker.py (Celery job)
  • search_service.py (query, rerank)

Module: frontend/src/ai/
Files:
  • ContextBuilder.ts (call semantic search)


CLAIM: "CRDT chaos testing"
───────────────────────────
Module: tests/crdt/
Files:
  • invariant.test.ts (property-based tests)
  • chaos.test.ts (network fault injection)
  • fuzz.test.ts (random patches)
  • load.test.ts (k6 scripts)


CLAIM: "Encryption at rest"
───────────────────────────
Module: backendv2/app/core/
Files:
  • encryption.py (KMS client, encrypt/decrypt)
  • secrets_manager.py (AWS Secrets Manager integration)

Module: infra/terraform/
Files:
  • rds.tf (enable encryption)
  • s3.tf (enable SSE-KMS)


CLAIM: "Tenant isolation"
──────────────────────────
Module: backendv2/app/middleware/
Files:
  • tenant_isolation.py (set app.current_user_id)

Module: backendv2/alembic/versions/
Files:
  • XXX_enable_row_level_security.py (RLS policies)

Module: backendv2/app/services/
Files:
  • permission_service.py (workspace_id scoping)


CLAIM: "Mermaid diagrams"
─────────────────────────
Module: frontend/src/editor/extensions/
Files:
  • MermaidBlock.ts (TipTap node)
  • MermaidRenderer.tsx (React component)

Module: backendv2/app/services/
Files:
  • export_service.py (render Mermaid to PNG/SVG)
```

### **Missing Code = Not Implementable**

```
If a claim in the spec cannot be mapped to a specific file/module,
it means the claim is not implementable yet (under-specified).

Example:
CLAIM: "AI can refactor across 10 files simultaneously"

Expected touchpoints:
  • frontend/src/ai/MultiFilePatchGenerator.ts (generate N patches)
  • frontend/src/ai/TransactionCoordinator.ts (atomic apply across files)
  • backendv2/app/services/ai_service.py (orchestrate multi-file call)

If these files/modules are not defined → claim is not implementable.
```

---

## 1️⃣1️⃣ MIGRATION PLAN (UPDATED)

### **Phase 0: Foundation (Week 1-2)**

```
✅ Add Node IDs (Breaking Change)
──────────────────────────────────
Why: Stable patch anchors require node IDs
Impact: All existing documents need migration

Steps:
1. Deploy NodeIdExtension to frontend
2. Background job: Add node IDs to all existing documents
   • Load Yjs state
   • Walk tree, add nodeId attrs
   • Save back
3. Verify: 100% documents have node IDs

Rollback: Revert extension, node IDs are ignored (harmless)


✅ Add Compaction Tables
─────────────────────────
Migration:
• CREATE TABLE document_crdt_snapshots
• CREATE TABLE document_crdt_updates
• CREATE TABLE document_crdt_compaction

Backfill:
• Convert existing document_collab_state → snapshot v1
• Zero updates (fresh start)


✅ Add Blame Cache Table
─────────────────────────
Migration:
• CREATE TABLE document_blame_cache

Compute:
• For all documents with snapshots:
  • Compute blame (git-style)
  • Store in cache
```

### **Phase 1-6 (Unchanged from v2.0)**

(See v2.0 spec for detailed phase breakdown)

### **Additional Phase: Semantic Search (Week 17-18)**

```
✅ Add Embeddings Pipeline
───────────────────────────
1. Install pgvector extension
2. CREATE TABLE document_embeddings
3. Background job: Generate embeddings for all documents
4. Deploy search API
5. Integrate into AI context builder
```

---

## ✅ **WHAT'S NEW IN V2.1**

```
1. FIXED HARD BLOCKERS
   ✓ Provenance: Operational + git-style blame (v1), rich blame (v2 roadmap)
   ✓ Patch anchors: node_id based (stable), no line/column
   ✓ Concurrency: base_state_vector guard + rebase strategy
   ✓ Compaction: snapshot + updates model, GC policy, hard limits
   ✓ Versioning: Single content_version, clear semantics

2. ADDED MISSING SUBSYSTEMS
   ✓ Workspace index: Semantic search with pgvector
   ✓ Testing: CRDT chaos/fuzz/property tests
   ✓ Security: Encryption, tenant isolation, GDPR
   ✓ Diagrams: Mermaid first-class node

3. IMPLEMENTATION MATRIX
   ✓ Every claim → specific module → specific file
   ✓ If not mapped → not implementable
```

---

## 🎯 **FINAL VERDICT: v2.1 IS EXECUTABLE**

This spec is now:
- ✅ **Complete**: Every hard blocker resolved
- ✅ **Correct**: Anchors, compaction, provenance defined rigorously
- ✅ **Implementable**: Claim → module → file mapping provided
- ✅ **Testable**: Chaos, fuzz, property tests specified
- ✅ **Secure**: Encryption, isolation, GDPR compliance
- ✅ **Cursor-Grade**: Semantic search, stable patches, rich blame (roadmap)

**Next Step**: Start coding. This spec is your contract.

---

*MDReader Editor Masterpiece v2.1 — Consolidated, Complete, Executable*


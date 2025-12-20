# MDReader Sync Invariants (No-Return Architecture)

This document codifies the "Laws of MDReader Sync" to prevent architectural decay and ensure the long-term health of our Local-First synchronization system.

## Law 1 — The Law of Truth
The Yjs binary blob (`yjs_state`) is the **sole authoritative source** of document content. It preserves full CRDT history, undo/redo stacks, and conflict metadata.

## Law 2 — The Law of Cache
Markdown (`content`) is a **derived, non-authoritative representation** used exclusively for:
- Database search (server-side)
- List previews
- File export
- Fallback for legacy (NULL binary) documents

It must **never** be treated as a source of truth once Yjs state exists.

## Law 3 — The Law of Sovereignty
All merge logic belongs to the **Frontend**. 
The Backend is a "Versioned Vault" that:
- Stores Yjs state as opaque bytes (`BYTEA`)
- Enforces optimistic concurrency via `expected_yjs_version`
- Signals concurrency conflicts via **HTTP 409**
- Rejects Markdown-only updates for binary-ascended documents (**HTTP 400**)

## Law 4 — The Law of Ascension
Once a document has received a Yjs binary update ("Ascension"):
- Markdown-only updates are **strictly forbidden**
- All future writes must include `yjs_state_b64`
- Hydration must prefer the binary truth; Markdown hydration is a legacy fallback path only.

## Lifecycle Invariants

1. **One-Time Hydration**: Markdown → Yjs hydration occurs exactly once in a document's lifecycle (lazy upgrade) and is gated by `fragment.length === 0`.
2. **Deterministic Merges**: Concurrency conflicts (409) trigger an automated "Pull → Local Yjs Merge → Retry Push" loop on the client.
3. **No Lossy Roundtrips**: We never read from Tiptap HTML to initialize Yjs if a binary state is available. Yjs is initialized from binary, then Tiptap reflects Yjs.

---
*Last Updated: December 19, 2025*

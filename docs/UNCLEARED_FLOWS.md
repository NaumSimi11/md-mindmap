# ❓ Unclear/To-Decide Flows

A holding area for product/UX decisions we will finalize later. Each item has options and impact notes.

---

## 1) Open Studio entrypoint (from Editor → Diagram modal)
- Current: Opens under workspace route
  - Path: `/workspace/doc/:id/mindmap?mode=generate|clean`
  - Pros: Keeps document context; round‑trip merge already wired
  - Cons: URL longer; Studio is coupled to Workspace
- Alternative: Standalone route
  - Path: `/studio2`
  - Pros: Focused environment, can open without a saved doc
  - Cons: Requires separate handoff of content; extra state plumbing
- Decision: PENDING

## 2) Editor “Open from file” behavior
- Current: Web file picker (insert or replace), drag‑and‑drop insert
- Desktop option: Tauri system dialog
  - Pros: Native UX, can open large files from disk
  - Cons: Desktop‑only code path
- Decision: ADD TAURI DIALOG (LOW EFFORT)

## 3) Diagram editing UX
- Current: Inline Mermaid node with live render; Quick Insert and AI Generate in modal
- Options:
  - Add split “code | preview” panel for Mermaid
  - Add validation hints and error markers
  - Export diagram as SVG/PNG from node toolbar
- Decision: PENDING (rank by impact)

## 4) Where to store attachments (images/diagrams)
- Web/Guest: inline/base64 or browser storage only
- Signed‑in: S3 via presigned uploads (+ metadata in DB)
- Decision: USE S3 WHEN SIGNED‑IN; INLINE WHEN GUEST

## 5) Sharing & Invites
- v1: Code‑based invites (no email send)
- v2: Email invites + roles (owner/member)
- Decision: START WITH CODE INVITES; EMAIL LATER

## 6) Collaboration (realtime)
- v1: Single‑user with comments (local metadata)
- v2: WebSocket + CRDT (Yjs)
- Decision: COMMENTS FIRST; CRDT LATER

## 7) AI key strategy (editor + studio)
- Default: BYO key (local only)
- Optional: Managed proxy (backend keys + rate limits)
- Decision: BYO DEFAULT; PROXY AS OPT‑IN

## 8) Export/Publish
- Export: HTML (standalone), PDF (print or service), DOCX (limited fidelity)
- Publish: link sharing, embed, custom domain (future)
- Decision: IMPLEMENT HTML/PDF/DOCX FIRST; PUBLISH LATER

---

## Notes
- All current diagram actions (insert, AI generate, open studio) are implemented and working in the editor.
- This file is for decisions only; see `BACKEND_FLOWS.md` and `BACKEND_IMPLEMENTATION_PLAN.md` for finalized flows/specs.

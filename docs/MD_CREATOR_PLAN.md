# MD Creator — Simple, Clear Plan

## Big Goal

Make writing (Markdown) and pictures (diagrams/mindmaps) work together like best friends, with smart AI help, fast and safe.

## The Next Big Thing

- Change the text → the diagram updates.
- Change the diagram → the text updates.
- Click in one → the other highlights the same part.

## 90-Day Path (4 phases)

### Phase 0 (Week 1–2): Make it safe and fast

- What we do:
  - Remove secret keys from code; use `.env` files.
  - Clean all HTML with a sanitizer; add a CSP.
  - Split the giant editor into smaller parts.
  - Move heavy rendering into background workers.
- Why: No leaks, no hacks, less lag.
- Done when:
  - No hardcoded keys.
  - XSS protection and CSP are on.
  - Editor split compiles cleanly.
  - App feels snappy on big files.

### Phase 1 (Week 3–5): Build the “bridge”

- What we do:
  - Switch to TypeScript for safer code (stores/composables first).
  - Create a simple “map” between document sections and diagram nodes (stable IDs).
  - Add a tiny search engine in the app (full‑text indexing in Rust).
  - Watch files for changes in the background.
- Why: We need a clean map so text and pictures can talk.
- Done when:
  - Store types exist; builds pass.
  - Each heading gets a hidden, stable ID.
  - Diagram nodes also have stable IDs.
  - Search works across all documents.

### Phase 2 (Week 6–8): Sync MVP (text ↔ diagram)

- What we do:
  - Click a heading → highlight node; click a node → highlight heading.
  - Rename a heading → node renames; rename a node → heading renames.
  - Add/remove sections ↔ add/remove nodes with friendly confirmations.
  - AI button: “Fix structure” (groups, order, levels).
- Why: This is the magic people will love.
- Done when:
  - Round‑trip edits work for titles and add/remove.
  - Selections stay in sync.
  - AI can suggest a neater outline.

### Phase 3 (Week 9–12): Smart and offline

- What we do:
  - Local search that understands meaning (vector index).
  - Ask questions about your docs and get answers with links.
  - Optional local AI model for privacy; cloud fallback.
  - Export that keeps the text–diagram links.
- Why: Powerful, private, and helpful.
- Done when:
  - “Ask your notes” returns answers with citations.
  - Local AI toggle works; falls back cleanly.
  - Export/import keeps IDs and stays in sync.

## Weekly Guide (simple steps)

- Week 1: Secrets to .env, add sanitizer + CSP.
- Week 2: Split editor; move rendering to workers.
- Week 3: Add TypeScript to stores/composables.
- Week 4: Add stable IDs to headings and diagram nodes.
- Week 5: Rust file watcher + full‑text index; simple UI search.
- Week 6: Click sync (highlighting both sides).
- Week 7: Rename sync (titles both ways).
- Week 8: Add/remove sync + AI “Fix structure”.
- Week 9: Vector index + basic semantic search.
- Week 10: RAG answers with citations.
- Week 11: Local AI toggle + streaming UI.
- Week 12: Round‑trip‑safe export/import.

## Daily Work Rhythm

- Pick one small task.
- Try it (manually or with tests).
- Build it in a small PR.
- Measure speed and memory.
- Smooth rough edges, then move on.

## Easy Words for Tricky Ideas

- Stable ID: a hidden tag that doesn’t change, so text and pictures match.
- Worker: a helper that does heavy work in the background.
- Index: a list that makes search fast.
- RAG: AI that reads your notes first, then answers.

## Risks and Safety Nets

- Matching breaks: Keep stable IDs; ask before risky changes.
- Mermaid limits: Support the common parts; show friendly errors.
- Local AI too big: Make it optional; small models first.
- Windows size grows: Keep extras optional; ship lean by default.

## How We Know It’s Working (simple numbers)

- Opens fast: under 1 second.
- Big diagram renders: under 200 ms (95% of the time).
- Memory: stays under 200 MB with big notes.
- Round‑trip edits: keep links 98% of the time.
- AI ideas accepted: over 60% of suggestions.

## Start Today (first 3 tasks)

- [ ] Add `.env.local` and remove any hardcoded keys.
- [ ] Add DOMPurify and a CSP meta tag.
- [ ] Slice `MarkdownEditor.vue` into smaller components and test the build.





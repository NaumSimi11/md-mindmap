# 🗺️ Remaining Non‑Critical Features — Prioritized Plan

**Status**: 34/59 complete (58%). Phase 1 (Critical) is 100% done. Only MathJax remains for Phase 2 parity.

---

## 🎯 Priorities at a Glance

- **P0 – Ship Readiness (High impact, Medium effort)**
  - MathJax/LaTeX support (inline/block) for parity
  - Export: PDF, DOCX, standalone HTML (single doc; batch later)
  - Bulk import/export wizard (workspace level)
  - Desktop: sanity test/build checklist (Tauri) and basic file watcher (optional)

- **P1 – Authoring & AI Quality (High impact, Medium effort)**
  - AI Smart Suggestions bar; “rewrite on hover” actions
  - Typewriter/Zen modes; word‑count goals
  - Cmd+K jump to heading; Breadcrumbs; Tabs; Split view
  - Shortcuts panel (Cmd+?) and custom keybindings

- **P1 – Context Intelligence (Medium/High impact, Medium effort)**
  - Search across context files
  - Smart context chips; context‑aware sidebar highlights
  - Token counting; streaming responses; basic rate limits

- **P2 – Collaboration & Rich Content (Medium impact, Higher effort)**
  - Comments/threads/resolve (single‑user local to start)
  - Collapsible sections and Tabs content block
  - Image drag‑drop upload + optimization; Audio embeds
  - Context files: PDF/Word/Excel text extraction; tagging; drag‑drop; ZIP export; folder icons

---

## ✅ Scope Notes

- Critical path is clear: shipping does not require collaboration or advanced publishing.
- Security: keep embeds (Gist/PDF viewer) but sanitize user HTML inserts; add CSP later.

---

## 🔧 Implementation Plan (4 Sprints)

### Sprint 1: Parity + Export (P0)
- MathJax/KaTeX end‑to‑end
  - markdown‑it: add math plugin for inline `$...$` and block `$$...$$`
  - TipTap: integrate `@tiptap/extension-math` or custom math node/view with KaTeX
  - turndown/json conversion: preserve inline and block math
- Export
  - HTML export (standalone + CSS) from TipTap doc
  - PDF export (browser print to PDF; Tauri native print for desktop)
  - DOCX export (docx library with basic formatting)
- Bulk import/export wizard (workspace)

Expected outcome: Full parity for math; one‑click export to HTML/PDF/DOCX; import/export flows in workspace.

### Sprint 2: AI & Writing Experience (P1)
- AI Smart Suggestions bar; inline rewrite on hover
- Typewriter/Zen modes; word‑count goals
- Streaming AI responses; token counter; simple per‑minute rate limit

Expected outcome: Faster authoring UX; AI feels responsive and contextual.

### Sprint 3: Navigation & Desktop Polish (P1)
- Cmd+K jump to section (headings index)
- Breadcrumbs, Tabs, Split view
- Desktop: optional file watcher + gentle background sync notification

Expected outcome: Power‑user navigation; more desktop confidence.

### Sprint 4: Collaboration (local) & Rich Content (P2)
- Comments/threads (local/offline model; data in document metadata)
- Collapsible sections, Tabs content block
- Image DnD + optimization; Audio embeds
- Context: PDF/Word/Excel parsing; tagging; folder icons; ZIP export

Expected outcome: Entry‑level collaboration; richer documents; smarter context.

---

## 🧩 Code Touchpoints

- MathJax/KaTeX
  - `src/components/editor/WYSIWYGEditor.tsx`: register math extension and NodeView
  - `src/components/editor/extensions/*`: add `MathNode.tsx` (inline/block)
  - `markdown-it` setup within editor: enable math plugin
  - `turndown` rules + `jsonToMarkdown` paths for math round‑trip

- Export
  - New helpers `src/services/export/ExportService.ts`
  - HTML export from TipTap JSON → SSR string with CSS inlined
  - PDF (web: print stylesheet; desktop: Tauri print)
  - DOCX via `docx` package mapping basic marks
  - Workspace UI hooks in `src/pages/Workspace.tsx`

- Bulk import/export wizard
  - `src/components/workspace/*` (new modal) + `WorkspaceService`

- AI Enhancements
  - `src/components/editor/*` (smart bar; hover actions)
  - Wire to `src/services/ai/AIService.ts`; use `AI_CONFIG`
  - Streaming UI; token counter in toolbar/status bar

- Navigation & Desktop
  - Cmd+K jump: index headings from TipTap doc; palette in `QuickSwitcher`
  - Tabs/Split: `Workspace` container layout updates
  - Watcher: `src/services/storage/StorageService.ts` + Tauri command glue

- Collaboration & Rich Content
  - Comments Node/Mark + side panel; persisted in document metadata
  - Collapsible/Tabs: custom TipTap nodes + markdown‑it/turndown rules
  - Media: image DnD handler; optimization pipeline (browser + Tauri)
  - Context parsing: pdf.js, mammoth, sheet parsers behind feature flags

---

## 🧪 Acceptance Criteria (per sprint)

- S1: `$E=mc^2$` and block equations render and round‑trip; Export produces valid HTML/PDF/DOCX; import/export wizard handles ≥10 docs.
- S2: Suggestions bar shows contextually; rewrite on hover works; AI streams tokens; token counter visible.
- S3: Cmd+K jumps to any heading; Tabs/Split stable; desktop watcher detects external edits and prompts.
- S4: Add comment → thread → resolve; collapsible and tabs blocks render + round‑trip; image DnD compresses large images; context parsers extract text.

---

## 🛡️ Risks & Mitigations

- Math parsing conflicts with inline `$` usage → gate with strict delimiters and escape rules; allow per‑doc toggle.
- DOCX fidelity gaps → scope to headings/paragraphs/lists/tables/code first.
- Watcher churn on large folders → debounce events; opt‑in per workspace.
- Context parsing performance → lazy parse on demand; cache extracted text.

---

## 📅 Suggested Timeline

- Week 1: Sprint 1
- Week 2: Sprint 2
- Week 3: Sprint 3
- Week 4: Sprint 4

---

## 📌 Backlog (Nice‑to‑have)

- Public links, embed codes, publish to web with SEO
- Custom domains, analytics
- Real‑time collaboration, permissions, version history



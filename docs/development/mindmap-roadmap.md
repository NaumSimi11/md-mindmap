# Ultimate Mindmap Roadmap (Web-first)

Goal: Best-in-class mindmapping inside the editor: generate from Markdown, build from scratch, edit fluidly, export/share, and enhance with AI.

## Vision

- Two modes:
  - Read-only Preview from Markdown headings (instant visualization).
  - Full Interactive Canvas for creation/editing.
- Single source of truth: neutral JSON schema. Import/export bridges to Mermaid, Markdown, and image formats.
- AI everywhere: expand node, rename branch, summarize subtree, auto-fix syntax on export.

## Architecture

- Rendering
  - Read-only: Markmap for headings visualization.
  - Editable: React Flow (@xyflow/react) + ELK (elkjs) for hierarchical layouts.
- Data model
  - JSON schema describing nodes, hierarchy, and edges.
  - Converters: JSON ⇄ React Flow; JSON ⇄ Mermaid (flowchart/mindmap/graph/sequence/class); Headings → JSON.
- Editor Integration
  - Editor toolbar buttons and modals; context menus in canvas and Markdown editor.
  - Guest credits apply to AI actions; local storage trial tracking.

## Phased Plan

### Phase 1: Markmap Preview from Headings
- Button: “Preview mindmap (headings)”.
- Panel renders Markmap from current document headings.
- Action: “Insert as Mermaid” → generate Mermaid via `MindmapGenerator` and insert fenced block.
- Docs: user guide + troubleshooting.

### Phase 2: Interactive Canvas (React Flow + ELK)
- New `MindmapCanvas.tsx` with:
  - Node CRUD: add sibling/child; rename inline; delete.
  - Reparent by drag; collapse/expand branches; zoom/pan; mini-map.
  - Keyboard: Enter/Shift+Enter, Tab/Shift+Tab, Backspace, Cmd/Ctrl+Drag.
  - Auto layout using ELK; layout options: TD/LR; smart spacing.
- Import sources: headings; existing Mermaid; JSON.
- Export: Mermaid (multiple types), JSON; copy to editor.

### Phase 3: AI Actions
- Node menu: “Expand with AI”, “Rename nodes”, “Summarize subtree”.
- Document-level: “Generate mindmap from description”.
- Validation: pre‑export mermaid render test; inline “Fix with AI” if invalid.
- Credits: decrement on successful AI calls; toasts.

### Phase 4: Import/Export & Media
- Import: Mermaid mindmap/flowchart; Markdown headings; JSON.
- Export: Mermaid, PNG/SVG (canvas), JSON.
- Share: copy link (web), file export (desktop/Tauri later).

## UX Details

- Canvas
  - Clean node cards; optional emoji/color tags; badges for collapsed count.
  - Context menu per node; Cmd/Ctrl to multi-select; rubber-band select.
  - Undo/redo stack.
- Preview
  - One-click switch between Markmap preview and Canvas edit.
  - Validate/export buttons visible near preview.

## Tech Choices

- @xyflow/react (React Flow): editor-grade graph UI, React-first, extensible nodes.
- elkjs: stable hierarchical layout; good for mindmap trees.
- markmap-lib: instant read-only visualization from headings.
- mermaid: universal share/export target in Markdown.

## Data Schema (high-level)

```
{
  title: string,
  nodes: [{ id, text, level, parent?, tags?: string[], color?: string }],
  connections: [{ from, to, type: 'hierarchy'|'association'|'flow' }]
}
```

## Testing

- Unit: generators, converters (headings→JSON, JSON→Mermaid), layout adapters.
- Integration: canvas node ops, editor insertion, AI flows, validation.
- Snapshot: Mermaid output types; export/import round-trips.

## Security & Quality

- AI prompts sanitized; no keys in logs; timeouts and rate limits enforced.
- Validate Mermaid before insert; offer “Fix with AI” on failure.
- Perf: virtualization for large trees; debounce layout.

## Deliverables per Phase

- Phase 1: Markmap preview + insert; docs; basic tests.
- Phase 2: Canvas CRUD/layout/collapse; import/export; tests.
- Phase 3: AI node/document actions; credits; tests.
- Phase 4: Import/Export formats; image export; tests.



# Context Menus & Mouse Interactions (Reference: mdtauri-main)

This document records the current right-click/aux-click behaviors implemented in the Tauri/Vue app so we can achieve parity in the React web app.

## Markdown Preview (Mermaid diagrams)

- Right-click on a rendered Mermaid diagram opens a custom context menu:
  - Action: `🤖 Enhance with AI`
    - Opens the Mermaid AI modal in enhancement mode
    - Pre-fills the modal with the existing diagram code
    - After AI generation, replaces the original diagram code in the document

- When a Mermaid render error occurs, the preview shows an inline error panel with:
  - Button: `🤖 Fix with AI`
    - Sends the broken code and the parser error to AI
    - Validates the returned code with Mermaid
    - On success, replaces the broken block and re-renders
  - Details: collapsible section with raw code

- Implementation references:
  - addDiagramContextMenu(): attaches `contextmenu` listener on diagram SVG/root and shows a positioned menu (`mermaidContextMenu` state)
  - Inline error HTML contains a `.fix-ai-btn` that calls `window.fixMermaidWithAI(index)`

## Editor (textarea)

- No custom right-click menu; native browser/OS context menu is used
- Keyboard shortcuts are implemented for formatting:
  - Ctrl/Cmd+B (bold), Ctrl/Cmd+I (italic), Ctrl/Cmd+K (link), Ctrl/Cmd+S (save)
  - Ctrl/Cmd+Shift+1/2/3 toggle Edit/Split/Preview modes
- Tab/Shift+Tab indentation handler is implemented

## Mindmap Canvas (Pro)

- Right-click (or middle-click) on empty canvas: starts panning (no context menu)
  - Mouse wheel: zoom in/out (keeps pointer position stable)
  - ESC not used; selection/pan ends on mouseup
- Left-click + drag (in milestone mode): selection rectangle for node grouping
- Click on node: selects node and opens inspector panel (no right-click menu)

- Implementation references:
  - Canvas navigation: `addCanvasNavigation()` uses `mousedown` with button 2/1 to enable panning, `wheel` to zoom, and prevents default context menu via `contextmenu` handler
  - Milestone selection signals via emitted events

## Planned Web Parity (React)

- Preview (Mermaid):
  - Replicate `🤖 Enhance with AI` on right-click with a small floating menu
  - Keep error panel with `🤖 Fix with AI` button when Mermaid render fails
- Editor: keep native menu; add optional lightweight command palette for common actions
- Mindmap: same panning/zoom interactions; no context menu planned initially

## Notes

- All AI actions must respect guest credit limits and show appropriate toasts when exhausted
- The context menu should be keyboard-accessible (open with Shift+F10 or custom hotkey) when feasible


## Enhance with AI — Planned UX & Build Phases

Phase 1 (now)
- Modal enhancements when opened from right-click:
  - Current diagram (small preview)
  - Custom prompt textarea (placeholder with examples)
  - Template chips: Add node, Add connection, Rename, Style change, Add lane
  - Generate → Validate (mermaid) → Insert & Replace
- Prompt sent: system prompt + current Mermaid + user prompt + constraints
- Replace exact fenced block on insert

Phase 2 (targeted edits)
- Parse nodes/labels; “Apply to” selector: Entire diagram or Selected nodes
- Quick actions compose prompts from selected nodes
- Style presets (dashed arrows, colors, subgraph)

Phase 3 (visual assist)
- Before/After diff preview and Undo
- Mini list of nodes with search

Validation & credits
- Pre-validate with mermaid; show error and “Fix with AI”
- Decrement guest credits on successful generation


## Editor Right‑Click Menu (Plan)

MVP items
- Always: Copy, Cut, Paste; Insert → Code block, Mermaid block, Table (3×3)
- With selection: Bold, Italic, Inline code, Wrap in link, Convert selection → Mermaid (AI)
- Inside mermaid fence: Enhance with AI, Validate diagram
- Line context (no selection): Toggle heading (H1/H2/H3), Toggle list (bullet/numbered), Duplicate line, Delete line

Context rules
- Selection: text ops + AI convert
- Inside fenced code: if mermaid → AI enhance & validate; else disable
- List/heading lines: list/heading toggles

AI actions
- Enhance selection with AI
- Convert selection to Mermaid
- Summarize selection
- Respect guest credits

Validation
- Validate diagram runs a mermaid.parse/render client‑side check
- On error: show inline toast with message and open AI Assistant in enhance mode
- Modal seeds `initialTemplatePrompt` with something like:
  "Fix validation error: <message>. Keep layout and IDs stable; minimal changes."

Phased rollout
1) Implement menu overlay and MVP actions + AI enhance/validate for mermaid blocks
2) Add line context helpers (toggle heading/list, duplicate/delete)
3) Add templates (mermaid snippets, tables) and AI converts

UX
- Menu anchors to caret in textarea; closes on click/esc
- Disabled items greyed when not applicable
- Keyboard shortcuts shown in labels
- Native menu available via Shift+Right‑Click


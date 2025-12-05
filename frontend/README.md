# MD Creator

AI‑assisted Markdown editor and mindmap studio. Create documents, diagrams (Mermaid), and presentations with a clean WYSIWYG editor and a powerful mindmap workflow.

## Quick start

Requirements: Node.js 18+ and npm.

```sh
git clone <YOUR_REPO_URL>
cd mdreader-main
npm i
npm run dev
```

App runs at `http://localhost:8080` by default.

## Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build

## Key features

- WYSIWYG + Markdown modes (round‑trip safe)
- Mermaid diagrams with inline editing and resize controls
- Outline sidebar synced with editor content
- Mindmap Studio with AI assist and round‑trip merge back to the editor
- Context files (MD/TXT/XLSX) with preview and quick insert

## Tech

Vite, React, TypeScript, Tailwind CSS, shadcn/ui, TipTap, Mermaid, React Flow.

## Contributing

Pull requests welcome. Keep changes incremental and feature‑flag risky UI additions. Run a quick smoke test: paste markdown with a mermaid diagram, toggle modes, verify outline updates, and ensure no loops in console.

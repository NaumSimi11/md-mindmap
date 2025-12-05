# Guest Dashboard & Trial Flows (Web)

Status: Draft
Owner: Web Core

## Goals
- Deliver instant value to unauthenticated users within 10s
- Showcase AI (diagram + validation) and mindmap features safely
- Provide clear free limits and frictionless path to signup/upgrade

## Scope
- Page: `/dashboard` (unauthenticated state)
- Modules: Editor, AIAssistantModal, Mindmap, Markdown+Mermaid preview
- Storage: localStorage (guest session), no backend

## UX Spec
- Top Bar
  - Guest chip with credits: `⚡ 3 free AI runs/day` (configurable)
  - Tooltip: "Sign up to keep your work and unlock more runs"
- Quick Actions
  - New Document → `/dashboard/editor` with sample markdown
  - AI Assistant → opens modal in-place with a prompt textarea and `Try sample`
  - Mindmaps → opens page with `Generate from sample`
  - Templates → opens gallery with 3 public templates
- Recent (guest)
  - Two demo docs listed; actions: Open / Duplicate
- Upsell Moments
  - When credits low, toast + badge linking to `/pricing`
  - After first success (diagram inserted or export), subtle CTA to sign up

## Functional Requirements
- Guest Credits
  - Key: `guest.ai.credits.{yyyy-mm-dd}` in localStorage
  - Default per-day: `3` (env-configurable)
  - Decrement after a successful AI call; show remaining in top bar
- Editor Preview
  - Markdown-It + Mermaid
  - Auto-fence unfenced Mermaid content
  - Error panel with "Fix with AI" button (uses validate + correctedCode)
- AI Assistant Integration
  - Uses `aiService` providers with timeout + rate-limit
  - Cleans fenced code from responses; validates before insertion
- Mindmap
  - `MindmapGenerator` provides: from headings, from selection
  - Export options: JSON, flowchart, mindmap, graph, sequence, class, markdown
  - "Insert into document" pastes a fenced Mermaid block into editor
- Persistence
  - Documents stored in localStorage only (guest session)
  - On sign up, prompt to import guest docs to account (future)

## Copy & Limits
- Badge: `⚡ 3 free AI runs today`
- Toast (credits low): `2 runs left. Create an account to get more.`
- Exhausted modal: title `You're out of free runs` → actions `Log in` `See pricing`

## Navigation Flows
- A: Writing + Diagram
  - New Document → Editor → AI Assistant → Insert → Preview → Export → Upsell
- B: Mindmap
  - Mindmaps → Generate from sample → Insert into document → Upsell
- C: Templates
  - Templates → Pick → Editor → Enhance with AI → Upsell

## Technical Notes
- AI Config: `src/config/aiConfig.ts` (Vite env)
- AI Service: `src/services/ai/AIService.ts`
- Mindmap: `src/services/MindmapGenerator.ts`
- State: lightweight Context/Zustand (`documents`, `credits`)

## Analytics (future)
- Events: `ai.run.success`, `ai.run.exhausted`, `mindmap.insert`, `export.md`, `template.open`

## Open Questions
- Exact daily credit count and reset time (UTC midnight vs local)
- Additional gating (export watermark?)


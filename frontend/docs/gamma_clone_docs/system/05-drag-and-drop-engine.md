# Drag & Drop Layout Engine — Interaction Model

## Purpose
Allow users to drag a layout or block template onto an existing block and have the block transform.

## UX expectations
- Drag source shows live preview (ghost)
- Drop target highlights valid regions
- After drop, animate morphing

## API
POST /api/transform
{ "project_id":"", "page_id":"", "block_id":"", "target_layout":"cycle" }

Response: { "block": { ... new block JSON ... }, "undo_token": "..." }

## Implementation details
- Block mapping layer contains slot mapping rules (title->card.title, paragraph->cards[].body)
- Use rollout safety: show preview first, require confirm for large transformations
- Keep an undo token for instant rollback

## Edge cases
- When content doesn't fit target shape, present "split" suggestions (e.g., convert paragraph into 3 cards).

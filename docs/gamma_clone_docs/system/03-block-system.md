# Block System — Data Model & Runtime Behavior

## Core concept
The document is a linear stack of blocks. Each block is a self-contained JSON object that declares its type, content, and styling. Blocks are renderable independently and can be transformed into other block types.

## Block schema (canonical)
{
  "id": "uuid",
  "type": "text|cards|steps|cycle|stats|hero|image|gallery|funnel",
  "content": {...},          // structure depends on type
  "style": {"padding":24, "align":"center"},
  "meta": {"created_by":"user-id","created_at":"ts"},
  "locks": {"editing_by": null}
}

## Transformation
- Transform API accepts source block + target type and returns new block JSON.
- Transformation should be loss-minimizing: preserve titles, bullets, and key phrases.

## Editing model
- Blocks support rich-text content; use ProseMirror/Slate as internal editor for text blocks.
- For non-text blocks, expose per-slot editors (e.g., card.title, card.image).

## Versioning
- Each block mutation creates a new revision entry. Keep last-N revisions inline; store deeper history in revision store.

## Rendering contract
- Renderer receives block JSON and theme token set. It must be deterministic and idempotent.

## Example transform flow
User selects paragraph -> clicks "Convert to Cards" -> frontend calls layout engine -> receives block JSON -> UI animates old->new block with transition and then patches document.

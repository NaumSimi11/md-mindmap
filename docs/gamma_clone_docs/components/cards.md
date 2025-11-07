# Card Group Component — Implementation Spec

## Purpose
Render N cards with image, title, body, and optional CTA.

## JSON contract
{
 "type":"cards",
 "content": {
   "cards":[{"title":"...","body":"...","image":"...","cta":{"label":"...","action":"..."}}]
 },
 "style": {"columns":3,"gap":24}
}

## Rendering
- Responsive columns: 1 column < 480px, 2 columns < 960px, N columns otherwise.
- Each card uses card tokens for padding, radius, and shadow.
- Lazy-load images.

## Edit UX
- Inline title editing
- Drag to reorder cards
- Add/remove cards

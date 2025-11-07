# Two-Column Component — Implementation Spec

## Purpose
Side-by-side image + text layout.

## JSON contract
{
 "type":"two_column",
 "content":{"left":{"type":"image","url":"..."},"right":{"type":"text","html":"..."}}
}

## Rendering
- Responsive stack on small screens
- Vertical alignment center

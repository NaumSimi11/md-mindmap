# Steps Component — Implementation Spec

## Purpose
Linear numbered process visualization.

## JSON contract
{
 "type":"steps",
 "content":{"steps":[{"title":"...","desc":"..."}]},
 "style":{"direction":"horizontal|vertical"}
}

## Rendering
- Use SVG or flexbox with numbered badges
- Support long content with multiline truncation

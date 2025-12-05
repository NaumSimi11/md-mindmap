# Cycle Component — Implementation Spec

## Purpose
Show circular sequence of steps where order loops.

## JSON contract
{
 "type":"cycle",
 "content":{"steps":[{"title":"...","desc":"...","icon":"..."}]},
 "style":{"orientation":"clockwise"}
}

## Rendering
- Use circle layout math to position nodes
- Connect nodes with curved SVG paths
- Support center content (summary)

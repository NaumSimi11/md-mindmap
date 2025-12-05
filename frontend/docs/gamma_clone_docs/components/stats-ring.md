# Stats Ring Component — Implementation Spec

## Purpose
Donut/pie style stat visualization.

## JSON contract
{
 "type":"stats",
 "content":{"items":[{"label":"Conversion","value":0.34}]},
 "style":{"size":160}
}

## Rendering
- Use SVG arcs
- Animate arc transitions
- Provide center label

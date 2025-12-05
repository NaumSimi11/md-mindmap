# Funnel Component — Implementation Spec

## Purpose
Visualize decreasing counts through stages.

## JSON contract
{
 "type":"funnel",
 "content":{"stages":[{"label":"Top","value":1000},{"label":"Mid","value":250}]},
 "style":{"orientation":"vertical"}
}

## Rendering
- Compute relative widths/heights by values
- Show percentage labels and absolute values

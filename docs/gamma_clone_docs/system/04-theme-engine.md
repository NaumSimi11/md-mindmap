# Theme Engine — Tokens & Runtime

## Purpose
Themes are global token sets that drive colors, typography, spacing, shadows, and component variants.

## Token structure
{
  "name":"Aurora",
  "colors": {"bg":"#0f172a","primary":"#7dd3fc","accent":"#a78bfa","muted":"#94a3b8"},
  "typography": {"h1":"48px","h2":"32px","body":"18px","font":"Inter"},
  "spacing": {"base":8},
  "radius": 16,
  "shadows": {...}
}

## Application
- The renderer accepts theme tokens and applies them to CSS variables.
- Changing theme triggers re-render of all blocks with transition.

## Overrides
- Blocks can override theme tokens locally (e.g., card.color).
- Persist only explicit overrides; otherwise inherit.

## Dev tips
- Use CSS variables for runtime performance.
- Keep token sets small and composable.

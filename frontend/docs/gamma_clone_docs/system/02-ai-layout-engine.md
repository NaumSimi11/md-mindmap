# AI Layout Engine — Design & Implementation

## Purpose
Map structured content (headings, items, relationships) to presentation block types and layout parameters.

## Responsibilities
- Classify content intent and complexity
- Recommend block types (cards, steps, funnel, etc.)
- Produce a canonical block JSON that the renderer consumes
- Provide alternative layout variants and ranking scores

## Input/Output contract
Input:
{
  "page_text": "string",
  "selected_block": { "id": "...", "text":"..." },
  "context": { "theme":"aurora","page_meta": {...}}
}

Output:
{
  "layout": "cards",
  "variants": [
    {"id":"v1","score":0.92, "block": { ... block JSON ... }},
    {"id":"v2","score":0.78, "block": { ... }}
  ],
  "explanation": "3 items => cards; presence of verbs => include icons for process"
}

## Core algorithm (pipeline)
1. Preprocess: tokenize, sentence-split, NER, dependency parse.
2. Semantic extraction: embeddings + clustering to find entities.
3. Heuristics + ML classifier:
   - If entities == 1 -> hero
   - If 2 -> comparison
   - If 3-6 -> cards / steps
   - If verbs-heavy -> process/steps
   - If percentages present -> stats
4. Template instantiation: pick template, fill slots (title, body, image_hint).
5. Scoring & rerank via a small re-ranker model.

## Implementation
- Use an LLM for high-level classification + deterministic heuristics for speed.
- Maintain a "template library" that defines constraints and parameter bindings.
- Provide an explain endpoint for human-readable rationale.

## Prompts (example)
System: "Given the following text, return the best layout type and fill its fields. Output strict JSON."
Few-shot examples: (include mapping examples for cards, steps, hero).

## Performance & caching
- Cache layout decisions keyed by block text hash.
- Use async workers for heavy models.

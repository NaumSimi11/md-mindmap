# Media Search Engine — Image Sourcing & Scoring

## Purpose
Search and score images for inline suggestion and automatic placement.

## Sources
- Unsplash API
- Pexels API
- Internal curated library (paid assets)
- AI-generated images (Diffusion service)

## Pipeline
1. Build query from block context + theme color hints
2. Fetch candidates (N=50)
3. Compute embeddings (CLIP)
4. Score by: relevance, palette-match, face/subject clarity, licensing
5. Return top K with metadata

## Response schema
[
  { "id":"u1", "url":"...", "score":0.92, "palette":["#..."], "source":"unsplash" }
]

## License handling
- Prefer CC0 or permissive sources.
- Show license badges in UI.
- Allow customers to upload own asset libraries.

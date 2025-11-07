# Context Analyzer — Document-Level Intelligence

## Purpose
Keep a live understanding of the entire document to make cross-block suggestions (image consistency, repeated themes, summarization).

## Responsibilities
- Build document embeddings every X seconds or on change
- Track entity frequency, sentiment, tone
- Expose queryable index: "find all blocks about 'growth'"

## API
GET /api/context/summary?project_id=...
Response:
{
 "topics": [{"name":"star formation","score":0.98}],
 "tone":"technical",
 "keywords":["galaxy","nebula","stars"],
 "recommendations":[{"block_id":"...","suggest":"convert to cards"}]
}

## Implementation
- Use embeddings (OpenAI/Azure embeddings or local model)
- Recompute incrementally
- Provide lightweight heuristics for UI recommendations

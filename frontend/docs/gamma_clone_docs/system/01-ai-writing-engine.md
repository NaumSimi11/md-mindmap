# AI Writing Engine — Design & Implementation

## Purpose
Provide inline, block-level AI assistants that can rewrite, summarize, expand, and transform user text. Works as a deterministic service that receives text + context and returns structured edits and metadata.

## Responsibilities
- Analyze block content + page context
- Return rewritten text variants (short/long/simplified/tonal variants)
- Extract structured data (bullets, headings, list items)
- Provide suggestions (titles, CTAs, summaries)
- Provide confidence/score & provenance for edits

## API (backend service)
POST /api/ai/writing
Request JSON:
{
  "project_id": "string",
  "page_id": "string",
  "block_id": "string",
  "input_text": "string",
  "task": "rewrite|summarize|expand|shorten|simplify|extract_bullets|title",
  "params": {"tone":"formal","length":"short"}
}

Response:
{
  "outputs": [
    {"id":"v1","text":"...","tokens":120,"score":0.92,"explanations":"changed passive->active"}
  ],
  "provenance": {"model":"gpt-5","prompt":"..."},
  "usage": {"tokens":120}
}

## Implementation notes
- Use streaming responses for large outputs (SSE / websockets).
- Keep a local cache of common rewrites to cut cost.
- Provide deterministic prompts + few-shot examples per `task`.
- Rate-limit and meter usage per project and per user for billing.

## Prompt engineering (example)
System prompt:
"You are a professional copywriter. Given the user's text, produce 3 variants: short(<=20 words), medium(40-70 words), long(>120 words). Preserve meaning. Output JSON: {\"short\":\"...\",\"medium\":\"...\",\"long\":\"...\"}."

User prompt:
"Rewrite in friendly, non-technical tone. Keep CTA at the end."

## Edge cases & safety
- Detect PII and redact before sending to third-party LLM.
- Provide opt-out for customers who want no external LLM use.
- Keep audit logs of prompt+response for compliance.

## Testing
- Unit tests on prompt outputs using fixed seeds (mock model).
- Regression tests for tone and length constraints.

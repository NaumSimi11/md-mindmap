# Database Schema — High-level

## Entities
- users (id, email, name, role)
- workspaces (id, name, owner)
- projects (id, workspace_id, title)
- pages (id, project_id, title, meta)
- blocks (id, page_id, json_content)
- revisions (id, block_id, diff, created_at)
- assets (id, owner, url, meta)

## Storage notes
- Store full block JSON in Postgres (jsonb)
- Use S3 for blobs, store URLs in assets
- Use ElasticSearch for full-text & semantic search indexing

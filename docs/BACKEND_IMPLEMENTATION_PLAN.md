# 🏗️ Backend Implementation Plan (FastAPI + PostgreSQL + S3)

**Goal**: Minimal, reliable backend to add multi‑device sync, optional AI proxy, and secure storage without breaking current client‑side UX.

- Language/Framework: Python 3.12, FastAPI
- DB: PostgreSQL (SQLAlchemy 2.x + Alembic)
- Object Storage: S3 (or Cloudflare R2/S3 compatible)
- Auth: JWT (email+password) + OAuth later (Authlib)
- Deployment: Render/Railway/Fly (API) + Neon/Supabase (Postgres) + AWS S3/R2
- Observability: OpenAPI, logging, metrics (Prometheus), Sentry (optional)

---

## 🎯 Objectives (v1 Minimal Backend)
- User accounts and workspaces
- Document CRUD with versioning and optimistic concurrency (ETag)
- Attachments via S3 presigned URLs
- Optional AI proxy endpoint to hide API keys and rate limit usage
- Backward compatible with guest/local workflows

Non‑goals (v1): real‑time collaboration, permissions matrix beyond member/owner, advanced billing.

---

## 🧱 Architecture

```
Client (Web/Tauri)
  ├─ Guest mode (localStorage / local files)  ← existing
  ├─ Signed-in mode (REST over HTTPS)
  │   ├─ Auth (JWT)
  │   ├─ Workspaces
  │   ├─ Documents + Versions
  │   ├─ Sync (since cursor)
  │   └─ Uploads (S3 presigned)
  └─ (Optional) AI → backend proxy → OpenAI/Anthropic

Backend (FastAPI)
  ├─ Routers: auth, users, workspaces, documents, uploads, sync, ai
  ├─ Services: auth, doc, versioning, storage, ai_proxy
  ├─ DB: PostgreSQL (SQLAlchemy, Alembic)
  └─ S3 client: boto3 (presign only in v1)
```

---

## 🔌 API Surface (v1)

- Auth
  - POST `/api/auth/signup` → {email, password}
  - POST `/api/auth/login` → {email, password}
  - POST `/api/auth/refresh`
  - POST `/api/auth/logout`
  - GET `/api/me` → current user

- Workspaces
  - GET `/api/workspaces` (list)
  - POST `/api/workspaces` (create)
  - GET `/api/workspaces/:id`
  - PATCH `/api/workspaces/:id`
  - DELETE `/api/workspaces/:id`

- Documents
  - GET `/api/workspaces/:wid/documents?query=&limit=&cursor=`
  - POST `/api/workspaces/:wid/documents` (create)
  - GET `/api/documents/:id` (If-None-Match for caching)
  - PUT `/api/documents/:id` (If-Match for optimistic concurrency)
  - DELETE `/api/documents/:id`
  - GET `/api/documents/:id/versions` (list)
  - POST `/api/documents/:id/versions` (snapshot)

- Sync
  - GET `/api/sync/since?cursor=<ISO or ULID>`
    - Returns changed documents, tombstones, new cursor

- Uploads (S3)
  - POST `/api/uploads/presign` → {fileName, contentType, scope: 'attachment'|'backup'}
  - Client uploads directly to S3 with returned URL + fields

- AI Proxy (optional)
  - POST `/api/ai/generate` → {provider, model, prompt, contextIds[]} with per‑user rate limit

Errors: Problem Details JSON (RFC 7807) shape with `type`, `title`, `detail`, `status`.

---

## 🗃️ Data Model (PostgreSQL)

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workspace_members (simple roles v1)
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, member
  PRIMARY KEY (workspace_id, user_id)
);

-- documents (markdown or json)
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_etag TEXT NOT NULL,         -- hash for optimistic concurrency
  deleted BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- versions (append-only snapshots)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  content_type TEXT,
  s3_key TEXT NOT NULL,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Notes:
- `content_etag` = SHA256 of content; used for If‑Match/If‑None‑Match.
- Soft delete via `deleted` + tombstones returned by sync.

---

## 🔁 Concurrency & Sync
- Read: client sends `If-None-Match: <etag>` to skip body on unchanged.
- Update: client sends `If-Match: <etag>`; server 412 if mismatch.
- Sync: `GET /sync/since?cursor=<ts/ulid>` returns changes (created, updated, deleted) and a new cursor.
- Conflict policy: last‑write‑wins only if `If-Match` satisfied; otherwise 409/412 with server copy and client responsibility to merge.

---

## 🔐 Security
- JWT access/refresh tokens (rotating refresh tokens, httpOnly in desktop/web wrapper if proxied; else stored securely client‑side).
- Password hashing: Argon2id (passlib), min password policy.
- CORS restricted to your domains.
- S3 presigned limited to specific bucket/prefix with content-type and short TTL.
- Rate limiting: `slowapi` (Redis optional) for `/ai/generate` and login.

---

## 🧰 Project Structure

```
backend/
  app/
    __init__.py
    main.py                 # FastAPI app factory
    config.py               # pydantic-settings
    deps.py                 # dependencies (db, auth)
    db.py                   # engine/session
    models/                 # SQLAlchemy models
    schemas/                # Pydantic models
    routers/
      auth.py, users.py, workspaces.py, documents.py, uploads.py, sync.py, ai.py
    services/
      auth_service.py, doc_service.py, storage_service.py, ai_proxy.py
    utils/
      crypto.py, etag.py
    middleware/
      logging.py, errors.py
  alembic/                  # migrations
  tests/
    unit/, integration/
  pyproject.toml            # poetry or hatch
  .env.example
```

---

## ⚙️ Local Setup
- Python: 3.12 (pyenv)
- Package: Poetry/Hatch
- DB: docker compose (Postgres 16)
- Migrations: Alembic (autogenerate + manual review)
- S3: LocalStack (optional) or real bucket with limited IAM user
- Run: `uvicorn app.main:app --reload`

---

## 🚀 Deployment
- API: Render/Railway/Fly.io (buildpack or Docker)
- DB: Neon/Supabase Postgres
- S3: AWS S3 / Cloudflare R2
- Secrets: environment variables (managed in provider)
- HTTPS: Provider managed (or Caddy in Fly)
- Migrations on release: `alembic upgrade head`

---

## 🧪 Testing & QA
- Unit tests (services, routers)
- Integration tests (against ephemeral Postgres)
- Contract tests for ETag/If‑Match flows
- Load test documents list/update (k6/Locust)
- CI: GitHub Actions (lint, type, test, alembic check)

---

## 📈 Observability
- OpenAPI (/docs, /openapi.json)
- Structured logs (JSON), log correlation ids
- Metrics (Prometheus exporter) and health checks (`/healthz`, `/readyz`)
- Sentry (optional)

---

## 🧭 Timeline & Milestones

- Week 0: Repo scaffold, CI, Alembic, healthz
- Week 1: Auth + Users + Workspaces
- Week 2: Documents CRUD, versions, ETag, Sync
- Week 3: S3 presign + attachments, basic AI proxy + rate limits
- Week 4: Hardening (tests, metrics, limits), docs and production deploy

---

## 🔗 Frontend Integration Plan
- Add an account switch (guest ↔ signed‑in). Keep guest mode as default.
- New client services:
  - `WorkspaceService` adapter: when signed‑in, CRUD hits REST; otherwise local.
  - Sync on focus/open; send `If‑Match/If‑None‑Match` headers; handle 412 → show merge dialog.
  - Attachments: request presign → direct upload → save metadata.
- Feature flags: enable AI proxy route when configured.

---

## ✅ Acceptance Criteria (v1)
- Users can sign up, create workspace, create/edit/delete documents across devices.
- Updates enforce optimistic concurrency with clear conflict errors.
- Sync endpoint returns incremental changes with cursor.
- Attachments upload via S3 presigned URLs.
- Optional AI proxy hides provider keys and enforces per‑user rate limits.

---

## 📦 Nice‑to‑Have (post v1)
- OAuth (Google/GitHub) via Authlib
- Team roles beyond owner/member
- Document sharing links
- Webhooks and audit logs
- Full collaboration (WebSocket + CRDT) later

---

## 🔑 Key Product Decisions & Defaults

### Auth model (Web vs Desktop)
- Desktop: Login not required. Guest mode is first‑class (offline‑first).
- Web: Guest mode allowed (localStorage) with clear persistence warning.
- Sign‑in is optional and only required to enable: multi‑device sync, cloud backup, attachments in S3, and app‑managed AI proxy.

### AI key strategy
- Default: BYO key (stored locally; never sent to backend). Works in guest and signed‑in modes.
- Optional: App‑managed AI proxy (backend keys) behind auth + rate limits.
- Workspace‑level preference: BYO vs Proxy, with per‑request override.

### Data ownership & sync semantics
- Desktop always keeps a local copy. Server acts as sync/backup when signed‑in.
- Conflicts via ETag (If‑Match). On 412, client shows a merge dialog (keep local, keep remote, manual merge).
- Soft deletes produce tombstones returned by `/sync/since`.

### Offline behavior
- All core actions work offline (create/edit/delete). Changes queue locally.
- Sync retries with exponential backoff when connectivity returns.

### Attachments policy (S3)
- Guest desktop: store attachments locally only.
- Signed‑in (web/desktop): use presigned S3 uploads; store metadata in DB.
- Optional “Backup to S3” action for existing local attachments once signed‑in.

### Privacy & telemetry
- Desktop: telemetry off by default; opt‑in toggle.
- Web: minimal anonymous usage metrics (page views, errors) – configurable; no document content.

### Security defaults
- Password hashing: Argon2id; rotate refresh tokens; short‑lived presign URLs.
- CORS restricted to app domains; rate limits on auth and AI proxy.
- Recommend OS disk encryption; app‑level document encryption is a future option.

### UX copy (high‑level)
- “Use without account” (guest) → local documents (browser or chosen folder on desktop).
- “Sign in to sync” → enable cloud backup, cross‑device access, and S3 attachments.
- “AI keys” → Use your own key locally, or use managed AI (requires sign‑in).

### Enforcement summary
- Require login: NO (except for cloud features: sync/backup/S3/proxy AI).
- Desktop parity with web maintained; desktop adds filesystem benefits and optional watcher.

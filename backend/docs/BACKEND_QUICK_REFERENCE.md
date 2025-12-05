# MD Creator Backend - Quick Reference Guide

**For Daily Development Use**

---

## 🚀 Getting Started (5 Minutes)

```bash
# Clone and setup
git clone https://github.com/mdcreator/backend.git
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Start services
docker-compose up -d

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload

# API docs: http://localhost:8000/docs
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── routers/             # API endpoints
│   ├── services/            # Business logic
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── dependencies/        # FastAPI dependencies
│   └── websocket/           # WebSocket handlers
├── alembic/                 # Database migrations
├── tests/                   # Tests
└── docker-compose.yml       # Local services
```

---

## 🔑 Environment Variables (.env)

```bash
# Essential
DATABASE_URL=postgresql://user:pass@localhost:5432/mdcreator_dev
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS
AWS_REGION=us-east-1
S3_BUCKET=mdcreator-documents-dev
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (AI Proxy)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
```

---

## 🗄️ Database Quick Commands

```bash
# Create migration
alembic revision --autogenerate -m "Add users table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current version
alembic current

# View migration history
alembic history

# Reset database (DEV ONLY!)
alembic downgrade base && alembic upgrade head

# Connect to database
psql postgresql://user:pass@localhost:5432/mdcreator_dev

# Backup database
pg_dump -U user mdcreator_dev > backup.sql
```

---

## 🧪 Testing Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_auth.py

# Run specific test
pytest tests/unit/test_auth.py::test_login

# Run integration tests only
pytest tests/integration/

# Run with output
pytest -v -s

# Run failed tests
pytest --lf

# Run tests in parallel
pytest -n 4
```

---

## 📡 Common API Patterns

### Authentication

```python
from app.dependencies.auth import get_current_user
from app.models import User

@router.get("/protected")
async def protected_route(user: User = Depends(get_current_user)):
    return {"user_id": str(user.id)}
```

### Permission Check

```python
from app.dependencies.permissions import require_permission, Permission

@router.post("/workspaces/{workspace_id}/documents")
async def create_document(
    workspace_id: str,
    _: bool = Depends(lambda: require_permission(Permission.CREATE_DOCUMENT, workspace_id))
):
    # Create document
    pass
```

### Database Query

```python
from app.database import get_db
from sqlalchemy.orm import Session

@router.get("/documents/{id}")
async def get_document(id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404)
    return document
```

### Error Handling

```python
from fastapi import HTTPException

# Not found
raise HTTPException(status_code=404, detail="Document not found")

# Forbidden
raise HTTPException(status_code=403, detail="Insufficient permissions")

# Conflict
raise HTTPException(status_code=409, detail="Edit conflict detected")

# Validation error
raise HTTPException(status_code=400, detail="Invalid input")
```

---

## 📊 Database Query Examples

### Basic CRUD

```python
from app.models import Document, User

# Create
document = Document(title="New Doc", content="...", workspace_id=ws_id, created_by=user_id)
db.add(document)
db.commit()
db.refresh(document)

# Read
document = db.query(Document).filter(Document.id == doc_id).first()

# Update
document.title = "Updated Title"
db.commit()

# Delete (soft delete)
document.deleted = True
document.deleted_at = datetime.utcnow()
db.commit()

# Hard delete
db.delete(document)
db.commit()
```

### Joins

```python
# Query with joins
results = db.query(Document, User).\
    join(User, Document.created_by == User.id).\
    filter(Document.workspace_id == workspace_id).\
    all()

# Using relationships
documents = db.query(Document).\
    options(joinedload(Document.creator)).\
    filter(Document.workspace_id == workspace_id).\
    all()
```

### Filtering

```python
# Multiple conditions
documents = db.query(Document).\
    filter(
        Document.workspace_id == workspace_id,
        Document.deleted == False,
        Document.type == 'markdown'
    ).\
    order_by(Document.updated_at.desc()).\
    limit(50).\
    all()

# OR conditions
from sqlalchemy import or_

documents = db.query(Document).\
    filter(or_(
        Document.title.like('%tutorial%'),
        Document.content.like('%tutorial%')
    )).\
    all()
```

### Pagination

```python
# Offset-based
page = 1
page_size = 20
offset = (page - 1) * page_size

documents = db.query(Document).\
    offset(offset).\
    limit(page_size).\
    all()

# Cursor-based
cursor = request.args.get('cursor', 0)
documents = db.query(Document).\
    filter(Document.id > cursor).\
    order_by(Document.id).\
    limit(20).\
    all()
```

### Full-Text Search

```python
from sqlalchemy import func

# Using tsvector
results = db.query(Document).\
    filter(
        func.to_tsvector('english', Document.content).match('search terms')
    ).\
    all()

# Using generated search_vector column
results = db.query(Document).\
    filter(
        Document.search_vector.match('search terms')
    ).\
    all()
```

---

## 🔐 Authentication Helpers

### Verify JWT Token

```python
from app.services.auth_service import CognitoAuthService

auth_service = CognitoAuthService()
claims = auth_service.verify_token(access_token)
user_id = claims['sub']
```

### Get Current User

```python
from app.dependencies.auth import get_current_user

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name
    }
```

### Optional Auth (Guest Support)

```python
from app.dependencies.auth import get_current_user_optional

@router.get("/public")
async def public_route(user: Optional[User] = Depends(get_current_user_optional)):
    if user:
        return {"message": f"Hello {user.display_name}"}
    else:
        return {"message": "Hello guest"}
```

---

## 📤 File Upload Pattern

### Generate Presigned URL

```python
import boto3

s3_client = boto3.client('s3', region_name='us-east-1')

presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': 'mdcreator-documents',
        'Key': f'attachments/{workspace_id}/{file_id}',
        'ContentType': content_type
    },
    ExpiresIn=300  # 5 minutes
)
```

### Upload Flow

```
1. Client requests presigned URL from backend
2. Backend returns presigned URL + attachment metadata
3. Client uploads file directly to S3
4. Client confirms upload completion to backend
5. Backend marks attachment as complete
```

---

## 🔄 Sync Pattern

### Get Changes Since Cursor

```python
@router.get("/sync/since")
async def sync_since(cursor: int = 0, db: Session = Depends(get_db)):
    changes = db.query(SyncLog).\
        filter(SyncLog.cursor > cursor).\
        order_by(SyncLog.cursor.asc()).\
        limit(100).\
        all()
    
    new_cursor = changes[-1].cursor if changes else cursor
    
    return {
        "changes": [c.to_dict() for c in changes],
        "cursor": new_cursor,
        "has_more": len(changes) == 100
    }
```

### Conflict Detection

```python
@router.put("/documents/{id}")
async def update_document(
    id: str,
    data: DocumentUpdate,
    if_match: str = Header(None),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == id).first()
    
    if if_match and document.content_hash != if_match:
        raise HTTPException(
            status_code=412,
            detail={
                "error": "Edit conflict",
                "server_version": {
                    "content_hash": document.content_hash,
                    "updated_at": document.updated_at.isoformat()
                }
            }
        )
    
    # Apply update
    document.content = data.content
    db.commit()
    
    return {"content_hash": document.content_hash}
```

---

## 🌐 WebSocket Pattern

### Connection Handler

```python
@app.websocket("/ws/documents/{document_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    document_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    user = await authenticate_websocket(token, db)
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message['type'] == 'cursor':
                await handle_cursor_update(document_id, message, user)
            elif message['type'] == 'yjs_update':
                await handle_yjs_update(document_id, message, user, db)
                
    except WebSocketDisconnect:
        await handle_disconnect(document_id, user)
```

---

## 🐛 Debugging Tips

### Print SQL Queries

```python
# In config
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

### FastAPI Debug Mode

```bash
# Enable auto-reload and verbose errors
uvicorn app.main:app --reload --log-level debug
```

### Database Connection Issues

```python
# Test database connection
from app.database import engine
with engine.connect() as connection:
    result = connection.execute("SELECT 1")
    print(result.fetchone())
```

### Redis Connection Test

```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
r.ping()  # Should return True
```

---

## 📦 Common Dependencies

### Auth + Database

```python
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models import User
from sqlalchemy.orm import Session

@router.get("/example")
async def example(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pass
```

### Permission Check

```python
from app.dependencies.permissions import check_workspace_access

@router.get("/workspaces/{workspace_id}/documents")
async def list_documents(
    workspace_id: str,
    membership = Depends(lambda: check_workspace_access(workspace_id))
):
    pass
```

---

## 🚨 Error Response Format

```json
{
  "type": "https://mdcreator.app/errors/edit-conflict",
  "title": "Edit Conflict",
  "status": 412,
  "detail": "Document was modified by another user",
  "server_version": {
    "content_hash": "abc123...",
    "updated_at": "2025-12-05T10:30:00Z"
  },
  "trace_id": "xyz789"
}
```

---

## 🔧 Useful Scripts

### Seed Database

```python
# scripts/seed_database.py
from app.database import SessionLocal
from app.models import User, Workspace, Document

db = SessionLocal()

# Create test user
user = User(
    cognito_sub="test_sub",
    email="test@example.com",
    display_name="Test User"
)
db.add(user)
db.commit()

# Create workspace
workspace = Workspace(
    owner_id=user.id,
    name="Test Workspace"
)
db.add(workspace)
db.commit()

print("Database seeded!")
```

### Cleanup Test Data

```python
# scripts/cleanup.py
from app.database import SessionLocal
from app.models import Document

db = SessionLocal()

# Delete test documents
db.query(Document).filter(Document.title.like('Test%')).delete()
db.commit()

print("Cleanup complete!")
```

---

## 📚 Essential Endpoints

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/{id}` - Get workspace
- `GET /api/workspaces/{id}/members` - List members

### Documents
- `GET /api/workspaces/{id}/documents` - List documents
- `POST /api/workspaces/{id}/documents` - Create document
- `GET /api/documents/{id}` - Get document
- `PUT /api/documents/{id}` - Update document
- `DELETE /api/documents/{id}` - Delete document

### Sync
- `GET /api/sync/workspaces/{id}/since?cursor=X` - Get changes
- `POST /api/sync/workspaces/{id}/push` - Push changes

---

## 🎯 Common Tasks

### Add New Endpoint

1. Create schema in `app/schemas/`
2. Add route in `app/routers/`
3. Implement service in `app/services/`
4. Add tests in `tests/`
5. Update API docs

### Add Database Table

1. Create model in `app/models/`
2. Generate migration: `alembic revision --autogenerate -m "Add table"`
3. Review and edit migration in `alembic/versions/`
4. Apply migration: `alembic upgrade head`
5. Update seed script if needed

### Add Permission Check

1. Define permission in `app/dependencies/permissions.py`
2. Add to role hierarchy
3. Use in route: `Depends(require_permission(Permission.X))`

### Add Background Task

```python
from fastapi import BackgroundTasks

@router.post("/process")
async def process(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_document, doc_id)
    return {"status": "processing"}

def process_document(doc_id: str):
    # Long-running task
    pass
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
lsof -i :8000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Migration Conflicts
```bash
# Check current version
alembic current

# Downgrade to specific version
alembic downgrade <revision_id>

# Resolve conflicts manually, then upgrade
alembic upgrade head
```

### Redis Not Connecting
```bash
# Test Redis
redis-cli ping

# Check Docker logs
docker-compose logs redis
```

---

## 📞 Quick Links

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/healthz

---

## 📖 Full Documentation

For complete documentation, see:
- [BACKEND_COMPLETE_INDEX.md](./BACKEND_COMPLETE_INDEX.md) - Master index
- [Part 1: Architecture](./BACKEND_ARCHITECTURE_BLUEPRINT.md)
- [Part 2: Database](./BACKEND_ARCHITECTURE_PART2_DATABASE.md)
- [Part 3: Auth & Sync](./BACKEND_ARCHITECTURE_PART3_AUTH_AND_SYNC.md)
- [Part 4: API](./BACKEND_ARCHITECTURE_PART4_API_COMPLETE.md)
- [Part 5: Deployment](./BACKEND_ARCHITECTURE_PART5_DEPLOYMENT_HANDOVER.md)

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0


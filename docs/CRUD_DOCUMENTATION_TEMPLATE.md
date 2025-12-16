# CRUD Phase Documentation Template

**Version**: 1.0  
**Purpose**: Standard template for documenting completed CRUD implementations  
**Usage**: Copy this template for each completed phase (Workspace, Document, Folder, etc.)

---

## Phase Information

**Phase Name**: `[e.g., Workspace CRUD]`  
**Phase Number**: `[e.g., Phase 1]`  
**Completion Date**: `[YYYY-MM-DD]`  
**API Version**: `[e.g., v1]`  
**Base Endpoint**: `[e.g., /api/v1/workspaces]`

---

## 1. CRUD Operations Overview

### Implemented Endpoints

| Method | Endpoint | Operation | Status |
|--------|----------|-----------|--------|
| POST   | `/resource` | Create | ✅ |
| GET    | `/resource` | List | ✅ |
| GET    | `/resource/{id}` | Get by ID | ✅ |
| PATCH  | `/resource/{id}` | Update | ✅ |
| DELETE | `/resource/{id}` | Delete | ✅ |
| POST   | `/resource/{id}/action` | Custom Action | ✅ |

---

## 2. Operation Flow Documentation

> **Template**: Document each operation using this structure

---

### Operation: [CREATE / LIST / GET / UPDATE / DELETE]

#### 2.1. Trigger

**How is this action started?**

```
Trigger Type: [HTTP Request / WebSocket / Event / Scheduled Job]
Initiated By: [User Action / System / External Service]
Entry Point: [Frontend Component / API Client / CLI]

Example Trigger:
- User clicks "Create Workspace" button
- Frontend component: WorkspaceSidebar.tsx
- Function: handleCreateWorkspace()
- Location: Line 123
```

#### 2.2. Request Flow

**What is being called and what is sent?**

```mermaid
sequenceDiagram
    participant Client as Client/Frontend
    participant Router as FastAPI Router
    participant Service as Service Layer
    participant DB as Database
    participant Auth as Auth Middleware

    Client->>Router: HTTP POST /api/v1/resource
    Note over Client,Router: Headers: Authorization Bearer {token}
    Note over Client,Router: Body: {request_payload}
    
    Router->>Auth: Validate JWT Token
    Auth-->>Router: User Object
    
    Router->>Service: create_resource(data, user_id)
    Note over Service: Business Logic Validation
    
    Service->>DB: INSERT INTO resources
    DB-->>Service: Created Resource Object
    
    Service-->>Router: Resource Object
    Router-->>Client: 201 Created + Resource JSON
```

#### 2.3. Request Payload

**What is sent to the endpoint?**

```typescript
// Frontend Request
interface RequestPayload {
  field1: string;        // Required: Description
  field2?: string;       // Optional: Description
  field3: boolean;       // Required: Description
}

// Example
const payload = {
  name: "My Workspace",
  slug: "my-workspace",
  is_public: false
};
```

```python
# Backend Schema (Pydantic)
class ResourceCreate(BaseModel):
    field1: str = Field(..., min_length=1, max_length=100)
    field2: Optional[str] = Field(None, max_length=500)
    field3: bool = Field(default=False)
```

#### 2.4. Request Headers

```http
POST /api/v1/resource HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### 2.5. Router Layer

**File**: `app/routers/resource.py`

```python
@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create resource",
    description="Detailed description of what this endpoint does"
)
async def create_resource(
    resource_data: ResourceCreate,           # ← Request body
    current_user: User = Depends(get_current_user),  # ← Auth dependency
    db: AsyncSession = Depends(get_db)       # ← Database session
):
    """
    What happens here:
    1. FastAPI validates request body against ResourceCreate schema
    2. get_current_user() validates JWT and returns User object
    3. get_db() provides database session
    4. Calls service layer with validated data
    5. Handles exceptions and converts to HTTP responses
    """
    service = ResourceService(db)
    
    try:
        resource = await service.create_resource(
            resource_data,
            str(current_user.id)
        )
        
        return ResourceResponse(
            id=str(resource.id),
            field1=resource.field1,
            field2=resource.field2,
            created_at=resource.created_at,
            updated_at=resource.updated_at
        )
        
    except ValueError as e:
        # Business logic error (e.g., duplicate slug)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
```

**What is expected from router?**
- ✅ Request validation (Pydantic)
- ✅ Authentication check (JWT)
- ✅ Call service layer
- ✅ Convert service response to HTTP response
- ✅ Handle exceptions → HTTP status codes

#### 2.6. Service Layer

**File**: `app/services/resource_service.py`

```python
class ResourceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_resource(
        self,
        resource_data: ResourceCreate,
        owner_id: str
    ) -> Resource:
        """
        Business Logic:
        1. Generate slug if not provided
        2. Check for duplicate slug
        3. Create database record
        4. Return created resource
        
        Raises:
            ValueError: If business rule violation (duplicate, invalid data)
        """
        
        # Step 1: Generate slug if needed
        slug = resource_data.slug
        if not slug:
            slug = self._generate_slug(resource_data.name)
        
        # Step 2: Check for duplicates
        result = await self.db.execute(
            select(Resource).where(
                and_(
                    Resource.owner_id == owner_id,
                    Resource.slug == slug,
                    Resource.is_deleted == False
                )
            )
        )
        existing = result.scalars().first()
        
        if existing:
            raise ValueError(f"Resource with slug '{slug}' already exists")
        
        # Step 3: Create resource
        resource = Resource(
            id=uuid.uuid4(),
            name=resource_data.name,
            slug=slug,
            owner_id=owner_id,
            field3=resource_data.field3,
            version=1
        )
        
        self.db.add(resource)
        await self.db.commit()
        await self.db.refresh(resource)
        
        return resource
```

**What is expected from service?**
- ✅ Business logic validation
- ✅ Database operations
- ✅ Return domain objects (not HTTP responses)
- ✅ Raise ValueError for business rule violations

#### 2.7. Database Layer

**File**: `app/models/resource.py`

```python
class Resource(Base):
    __tablename__ = "resources"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True)
    
    # Fields
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    field3 = Column(Boolean, default=False)
    
    # Soft Delete
    is_deleted = Column(Boolean, default=False)
    
    # Optimistic Locking
    version = Column(Integer, default=1)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('ix_resources_owner_slug', 'owner_id', 'slug', unique=True),
    )
```

**SQL Generated**:
```sql
INSERT INTO resources (
    id, name, slug, owner_id, field3, 
    is_deleted, version, created_at, updated_at
) VALUES (
    'uuid-here', 'My Workspace', 'my-workspace', 'user-uuid',
    false, false, 1, NOW(), NOW()
) RETURNING *;
```

#### 2.8. Response Flow

**How it's returned back?**

```mermaid
sequenceDiagram
    participant DB as Database
    participant Service as Service Layer
    participant Router as Router Layer
    participant Client as Client/Frontend

    DB-->>Service: Resource Object (ORM)
    Note over Service: resource.id, resource.name, etc.
    
    Service-->>Router: Resource Object
    Note over Router: Convert to ResourceResponse (Pydantic)
    
    Router-->>Client: HTTP 201 Created
    Note over Router,Client: Content-Type: application/json
    Note over Router,Client: Body: ResourceResponse JSON
    
    Client->>Client: Update UI State
    Note over Client: Add to local cache<br/>Show success message<br/>Navigate to resource
```

#### 2.9. Response Payload

**What is returned to the client?**

```json
// Success Response (201 Created)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": null,
  "icon": "📁",
  "is_public": false,
  "owner_id": "660e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-12-12T10:30:00.000Z",
  "updated_at": "2025-12-12T10:30:00.000Z"
}
```

```python
# Response Schema (Pydantic)
class ResourceResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    icon: str
    is_public: bool
    owner_id: str
    created_at: datetime
    updated_at: datetime
```

#### 2.10. All Possible Cases

##### ✅ Success Case (201 Created)

**Condition**: Valid request, authenticated user, no conflicts

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "...",
  "name": "My Workspace",
  ...
}
```

**Frontend Handling**:
```typescript
if (response.status === 201) {
  // Add to local state
  setWorkspaces([...workspaces, response.data]);
  
  // Show success message
  toast.success("Workspace created successfully!");
  
  // Navigate to new resource
  navigate(`/workspace/${response.data.id}`);
}
```

##### ❌ Validation Error (422 Unprocessable Entity)

**Condition**: Invalid request data (fails Pydantic validation)

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "name"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    }
  ]
}
```

**Frontend Handling**:
```typescript
if (response.status === 422) {
  // Parse validation errors
  const errors = response.data.detail;
  
  // Show field-specific errors
  errors.forEach(error => {
    const field = error.loc[error.loc.length - 1];
    setFieldError(field, error.msg);
  });
}
```

##### ❌ Unauthorized (401/403)

**Condition**: No token, invalid token, or expired token

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "detail": "Could not validate credentials"
}
```

**Frontend Handling**:
```typescript
if (response.status === 401 || response.status === 403) {
  // Clear auth state
  clearAuthToken();
  
  // Redirect to login
  navigate("/login");
  
  // Show message
  toast.error("Session expired. Please log in again.");
}
```

##### ❌ Conflict (409)

**Condition**: Business rule violation (e.g., duplicate slug)

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "detail": "Resource with slug 'my-workspace' already exists"
}
```

**Frontend Handling**:
```typescript
if (response.status === 409) {
  // Show specific error
  setFieldError("slug", response.data.detail);
  
  // Suggest alternative
  toast.error("This name is already taken. Try a different one.");
}
```

##### ❌ Server Error (500)

**Condition**: Unexpected server error (database down, etc.)

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "detail": "Internal server error"
}
```

**Frontend Handling**:
```typescript
if (response.status === 500) {
  // Show generic error
  toast.error("Something went wrong. Please try again later.");
  
  // Log to monitoring service
  logError("Create workspace failed", response);
}
```

#### 2.11. Expected vs Real Results

| Aspect | Expected | Real | Status |
|--------|----------|------|--------|
| **Response Time** | < 200ms | 150ms avg | ✅ |
| **Status Code** | 201 | 201 | ✅ |
| **Response Schema** | Matches ResourceResponse | Matches | ✅ |
| **Database Record** | Created with all fields | Created correctly | ✅ |
| **Slug Generation** | Auto-generated if empty | Works as expected | ✅ |
| **Duplicate Check** | Returns 409 | Returns 409 | ✅ |
| **Auth Check** | Returns 403 if no token | Returns 403 | ✅ |
| **Validation** | Returns 422 for invalid data | Returns 422 | ✅ |

#### 2.12. Test Coverage

```python
# Test: Success case
@pytest.mark.asyncio
async def test_create_resource_success(client, auth_headers):
    response = await client.post(
        "/api/v1/resource",
        json={"name": "Test Resource"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Resource"

# Test: Validation error
@pytest.mark.asyncio
async def test_create_resource_validation_error(client, auth_headers):
    response = await client.post(
        "/api/v1/resource",
        json={"name": ""},  # Too short
        headers=auth_headers
    )
    assert response.status_code == 422

# Test: Duplicate conflict
@pytest.mark.asyncio
async def test_create_resource_duplicate(client, auth_headers):
    # Create first resource
    await client.post(
        "/api/v1/resource",
        json={"name": "Test", "slug": "test"},
        headers=auth_headers
    )
    
    # Try to create duplicate
    response = await client.post(
        "/api/v1/resource",
        json={"name": "Test", "slug": "test"},
        headers=auth_headers
    )
    assert response.status_code == 409

# Test: Unauthorized
@pytest.mark.asyncio
async def test_create_resource_unauthorized(client):
    response = await client.post(
        "/api/v1/resource",
        json={"name": "Test"}
        # No auth headers
    )
    assert response.status_code in [401, 403]
```

---

## 3. Complete System Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Frontend UI Component]
        API_Client[API Client/Axios]
    end
    
    subgraph "API Gateway"
        CORS[CORS Middleware]
        Auth[Auth Middleware]
        Router[FastAPI Router]
    end
    
    subgraph "Business Logic"
        Service[Service Layer]
        Validation[Business Validation]
    end
    
    subgraph "Data Layer"
        ORM[SQLAlchemy ORM]
        DB[(PostgreSQL)]
    end
    
    subgraph "External Services"
        Cache[(Redis Cache)]
        Queue[Task Queue]
    end
    
    UI -->|HTTP Request| API_Client
    API_Client -->|POST /api/v1/resource| CORS
    CORS --> Auth
    Auth -->|JWT Validation| Router
    Router -->|Pydantic Validation| Service
    Service --> Validation
    Validation --> ORM
    ORM --> DB
    
    Service -.->|Optional| Cache
    Service -.->|Async Tasks| Queue
    
    DB -->|Result| ORM
    ORM -->|Domain Object| Service
    Service -->|Response| Router
    Router -->|JSON| API_Client
    API_Client -->|Update State| UI
    
    style UI fill:#e1f5ff
    style Router fill:#fff4e1
    style Service fill:#f0e1ff
    style DB fill:#e1ffe1
```

---

## 4. Data Flow Diagram

```mermaid
flowchart TD
    Start([User Action]) --> Input[Collect Input Data]
    Input --> FE_Validate{Frontend Validation}
    
    FE_Validate -->|Invalid| FE_Error[Show Validation Error]
    FE_Error --> Start
    
    FE_Validate -->|Valid| HTTP_Request[HTTP POST Request]
    HTTP_Request --> CORS_Check{CORS Check}
    
    CORS_Check -->|Fail| CORS_Error[403 CORS Error]
    CORS_Check -->|Pass| Auth_Check{Auth Check}
    
    Auth_Check -->|No Token| Auth_Error[403 Unauthorized]
    Auth_Check -->|Invalid Token| Auth_Error
    Auth_Check -->|Valid Token| Schema_Validate{Pydantic Validation}
    
    Schema_Validate -->|Invalid| Schema_Error[422 Validation Error]
    Schema_Validate -->|Valid| Service_Call[Call Service Layer]
    
    Service_Call --> Business_Logic{Business Rules}
    
    Business_Logic -->|Duplicate| Conflict_Error[409 Conflict]
    Business_Logic -->|Invalid| Business_Error[400 Bad Request]
    Business_Logic -->|Valid| DB_Check{Check Database}
    
    DB_Check -->|Exists| Conflict_Error
    DB_Check -->|Not Exists| DB_Insert[INSERT INTO Database]
    
    DB_Insert --> DB_Success{Success?}
    DB_Success -->|Fail| DB_Error[500 Server Error]
    DB_Success -->|Success| Create_Response[Create Response Object]
    
    Create_Response --> Return_201[Return 201 Created]
    Return_201 --> Update_UI[Update Frontend UI]
    Update_UI --> End([Success])
    
    CORS_Error --> End
    Auth_Error --> End
    Schema_Error --> End
    Conflict_Error --> End
    Business_Error --> End
    DB_Error --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1ffe1
    style Return_201 fill:#e1ffe1
    style CORS_Error fill:#ffe1e1
    style Auth_Error fill:#ffe1e1
    style Schema_Error fill:#ffe1e1
    style Conflict_Error fill:#ffe1e1
    style Business_Error fill:#ffe1e1
    style DB_Error fill:#ffe1e1
```

---

## 5. Error Handling Matrix

| Error Type | Status Code | Trigger | Handler | User Message | Recovery Action |
|------------|-------------|---------|---------|--------------|-----------------|
| **Validation Error** | 422 | Invalid input data | Pydantic | "Please check your input" | Show field errors |
| **Unauthorized** | 401/403 | No/invalid token | Auth middleware | "Please log in" | Redirect to login |
| **Not Found** | 404 | Resource doesn't exist | Service layer | "Resource not found" | Redirect to list |
| **Conflict** | 409 | Duplicate/constraint | Service layer | "Already exists" | Suggest alternative |
| **Forbidden** | 403 | No permission | Service layer | "Access denied" | Show error message |
| **Server Error** | 500 | Unexpected error | Exception handler | "Something went wrong" | Retry or contact support |

---

## 6. Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Response Time (p50)** | < 100ms | 85ms | ✅ |
| **Response Time (p95)** | < 200ms | 150ms | ✅ |
| **Response Time (p99)** | < 500ms | 280ms | ✅ |
| **Throughput** | > 100 req/s | 150 req/s | ✅ |
| **Error Rate** | < 1% | 0.2% | ✅ |
| **Database Query Time** | < 50ms | 35ms | ✅ |

---

## 7. Security Checklist

- [x] JWT authentication required
- [x] Input validation (Pydantic schemas)
- [x] SQL injection prevention (ORM)
- [x] CORS configuration
- [x] Rate limiting (if applicable)
- [x] Permission checks (owner/public)
- [x] Sensitive data filtering (passwords, tokens)
- [x] Audit logging (created_by, timestamps)

---

## 8. API Contract Compliance

| Requirement | Specified in Contract | Implemented | Tested |
|-------------|----------------------|-------------|--------|
| Request schema | ✅ | ✅ | ✅ |
| Response schema | ✅ | ✅ | ✅ |
| Status codes | ✅ | ✅ | ✅ |
| Error responses | ✅ | ✅ | ✅ |
| Authentication | ✅ | ✅ | ✅ |
| Validation rules | ✅ | ✅ | ✅ |
| Query parameters | ✅ | ✅ | ✅ |

---

## 9. Files Modified/Created

### Created Files
```
✅ app/schemas/resource.py          # Pydantic schemas
✅ app/services/resource_service.py # Business logic
✅ app/routers/resource.py          # API endpoints
✅ tests/test_resource.py           # Automated tests
✅ scripts/test_resource.py         # Manual test script
```

### Modified Files
```
✅ app/main.py                      # Router registration
✅ app/models/resource.py           # ORM model (if new)
✅ requirements.txt                 # Dependencies (if needed)
```

---

## 10. Next Steps

### Immediate
- [ ] Monitor production metrics
- [ ] Gather user feedback
- [ ] Fix any reported issues

### Future Enhancements
- [ ] Add caching layer
- [ ] Implement webhooks
- [ ] Add bulk operations
- [ ] Optimize database queries
- [ ] Add search functionality

---

## 11. Appendix

### A. Environment Variables
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/db
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
```

### B. Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Add resource table"

# Apply migration
alembic upgrade head
```

### C. Running Tests
```bash
# All tests
pytest tests/test_resource.py -v

# Specific test
pytest tests/test_resource.py::test_create_resource_success -v

# With coverage
pytest tests/test_resource.py --cov=app --cov-report=html
```

### D. Manual Testing
```bash
# Start server
cd backendv2
source venv/bin/activate
uvicorn app.main:app --reload

# Run manual tests
python scripts/test_resource.py
```

---

**Template Version**: 1.0  
**Last Updated**: 2025-12-12  
**Maintained By**: Development Team  
**Review Frequency**: After each CRUD phase completion

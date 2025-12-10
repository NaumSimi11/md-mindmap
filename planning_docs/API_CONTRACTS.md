# 📡 **API Contracts - Complete Specification**

**Date**: December 10, 2025  
**Purpose**: Exact API specifications for Phases 0-4  
**Status**: 🟢 **CONTRACT READY**

---

## 📋 **Table of Contents**

1. [API Standards](#1-api-standards)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [Workspace Endpoints](#3-workspace-endpoints)
4. [Document Endpoints](#4-document-endpoints)
5. [Folder Endpoints](#5-folder-endpoints)
6. [Collaboration Endpoints](#6-collaboration-endpoints)
7. [Storage Mode Endpoints](#7-storage-mode-endpoints)
8. [Migration Endpoints](#8-migration-endpoints)
9. [Error Responses](#9-error-responses)
10. [WebSocket Protocol](#10-websocket-protocol)

---

## 1. API Standards

### **1.1 Base URL**

```
Development:  http://localhost:7001
Staging:      https://api-staging.mdreader.app
Production:   https://api.mdreader.app
```

### **1.2 Request Headers**

```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
Accept: application/json
X-Client-Version: 1.0.0
```

### **1.3 Response Format**

#### **Success Response**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-10T10:00:00Z",
    "request_id": "uuid"
  }
}
```

#### **List Response**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 50,
    "has_more": true
  }
}
```

---

## 2. Authentication Endpoints

### **2.1 Register**

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "created_at": "2025-12-10T10:00:00Z"
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Validation**:
- `email`: Valid email format, unique
- `username`: 3-50 chars, alphanumeric + `_` `-`, unique
- `password`: Min 8 chars, uppercase, lowercase, digit, special char
- `full_name`: Max 100 chars (optional)

**Errors**:
- `400`: Validation error
- `409`: Email or username already exists

---

### **2.2 Login**

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2025-12-10T10:00:00Z"
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errors**:
- `400`: Missing fields
- `401`: Invalid credentials
- `429`: Rate limit exceeded (5 req/min)

---

### **2.3 Refresh Token**

**Endpoint**: `POST /api/v1/auth/refresh`

**Request**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

### **2.4 Logout**

**Endpoint**: `POST /api/v1/auth/logout`

**Headers**: `Authorization: Bearer {access_token}`

**Request**: (empty)

**Response** (204 No Content)

**Side Effects**:
- Access token added to blacklist
- Refresh token invalidated

---

### **2.5 Get Current User**

**Endpoint**: `GET /api/v1/auth/me`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Errors**:
- `401`: Invalid or expired token

---

## 3. Workspace Endpoints

### **3.1 Create Workspace**

**Endpoint**: `POST /api/v1/workspaces`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Personal workspace",
  "icon": "📁",
  "is_public": false
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Personal workspace",
  "icon": "📁",
  "is_public": false,
  "owner_id": "uuid",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Validation**:
- `name`: Required, 1-100 chars
- `slug`: Auto-generated if not provided, unique per user
- `description`: Optional, max 500 chars
- `icon`: Optional, single emoji

**Errors**:
- `400`: Validation error
- `401`: Not authenticated
- `409`: Slug already exists

---

### **3.2 List Workspaces**

**Endpoint**: `GET /api/v1/workspaces`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50, max: 100)
- `include_archived`: Include archived workspaces (default: false)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "slug": "my-workspace",
      "icon": "📁",
      "is_public": false,
      "owner_id": "uuid",
      "document_count": 42,
      "member_count": 1,
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 50,
  "has_more": false
}
```

---

### **3.3 Get Workspace**

**Endpoint**: `GET /api/v1/workspaces/{workspace_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Personal workspace",
  "icon": "📁",
  "is_public": false,
  "owner": {
    "id": "uuid",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://..."
  },
  "stats": {
    "document_count": 42,
    "folder_count": 8,
    "member_count": 1,
    "storage_used_bytes": 1048576
  },
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Errors**:
- `404`: Workspace not found
- `403`: No access to workspace

---

### **3.4 Update Workspace**

**Endpoint**: `PATCH /api/v1/workspaces/{workspace_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Request** (all fields optional):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "icon": "🚀"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "slug": "my-workspace",
  "description": "Updated description",
  "icon": "🚀",
  "is_public": false,
  "owner_id": "uuid",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T12:00:00Z"
}
```

**Errors**:
- `403`: Not workspace owner
- `404`: Workspace not found

---

### **3.5 Delete Workspace**

**Endpoint**: `DELETE /api/v1/workspaces/{workspace_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `cascade`: Delete all documents and folders (default: false)

**Response** (204 No Content)

**Errors**:
- `403`: Not workspace owner
- `404`: Workspace not found
- `400`: Cannot delete workspace with documents (if `cascade=false`)

---

## 4. Document Endpoints

### **4.1 Create Document**

**Endpoint**: `POST /api/v1/documents`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)

**Request**:
```json
{
  "title": "My Document",
  "content": "# Hello World",
  "content_type": "markdown",
  "folder_id": "uuid",
  "tags": ["work", "draft"],
  "is_public": false,
  "is_template": false,
  "storage_mode": "HybridSync"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "My Document",
  "slug": "my-document",
  "content": "# Hello World",
  "content_type": "markdown",
  "workspace_id": "uuid",
  "folder_id": "uuid",
  "tags": ["work", "draft"],
  "is_public": false,
  "is_template": false,
  "is_starred": false,
  "storage_mode": "HybridSync",
  "version": 1,
  "word_count": 2,
  "created_by_id": "uuid",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Validation**:
- `title`: Required, 1-200 chars
- `content`: Optional, max 10MB
- `content_type`: "markdown" | "html" (default: "markdown")
- `folder_id`: Must exist in same workspace
- `storage_mode`: "LocalOnly" | "HybridSync" | "CloudOnly" (default: "HybridSync")

**Errors**:
- `400`: Validation error
- `403`: No permission to create documents in workspace
- `404`: Folder or workspace not found

---

### **4.2 Get Document**

**Endpoint**: `GET /api/v1/documents/{document_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "My Document",
  "slug": "my-document",
  "content": "# Hello World\n\nThis is my document.",
  "content_type": "markdown",
  "workspace_id": "uuid",
  "folder_id": "uuid",
  "tags": ["work", "draft"],
  "is_public": false,
  "is_template": false,
  "is_starred": false,
  "storage_mode": "HybridSync",
  "version": 5,
  "word_count": 6,
  "created_by": {
    "id": "uuid",
    "username": "johndoe",
    "full_name": "John Doe"
  },
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T12:00:00Z"
}
```

**Errors**:
- `404`: Document not found
- `403`: No access to document

---

### **4.3 List Documents**

**Endpoint**: `GET /api/v1/documents/workspace/{workspace_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50, max: 100)
- `folder_id`: Filter by folder (optional)
- `tags`: Comma-separated tags (optional)
- `is_starred`: Filter starred documents (optional)
- `is_template`: Filter templates (optional)
- `sort_by`: "updated_at" | "created_at" | "title" (default: "updated_at")
- `sort_order`: "asc" | "desc" (default: "desc")

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "My Document",
      "slug": "my-document",
      "content_type": "markdown",
      "workspace_id": "uuid",
      "folder_id": "uuid",
      "tags": ["work"],
      "is_starred": false,
      "storage_mode": "HybridSync",
      "version": 5,
      "word_count": 100,
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T12:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 50,
  "has_more": false
}
```

---

### **4.4 Update Document**

**Endpoint**: `PATCH /api/v1/documents/{document_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Request** (all fields optional):
```json
{
  "title": "Updated Title",
  "content": "# Updated Content",
  "folder_id": "uuid",
  "tags": ["work", "updated"],
  "is_public": false
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "slug": "updated-title",
  "content": "# Updated Content",
  "folder_id": "uuid",
  "tags": ["work", "updated"],
  "version": 6,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

**Side Effects**:
- Version number incremented
- New entry in `document_versions` table

**Errors**:
- `403`: No edit permission
- `404`: Document not found
- `409`: Concurrent edit conflict (version mismatch)

---

### **4.5 Delete Document**

**Endpoint**: `DELETE /api/v1/documents/{document_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (204 No Content)

**Side Effects**:
- Soft delete (sets `is_deleted = true`)
- Can be restored from trash for 30 days

**Errors**:
- `403`: No delete permission
- `404`: Document not found

---

### **4.6 Star/Unstar Document**

**Endpoint**: `POST /api/v1/documents/{document_id}/star`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "is_starred": true,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

**Endpoint**: `DELETE /api/v1/documents/{document_id}/star`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "is_starred": false,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

---

### **4.7 Get Document Versions**

**Endpoint**: `GET /api/v1/documents/{document_id}/versions`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "document_id": "uuid",
      "version": 5,
      "title": "My Document",
      "content_hash": "sha256:abc123...",
      "change_summary": "Updated introduction",
      "word_count": 150,
      "created_by": {
        "id": "uuid",
        "username": "johndoe"
      },
      "created_at": "2025-12-10T12:00:00Z"
    },
    {
      "id": "uuid",
      "document_id": "uuid",
      "version": 4,
      "title": "My Document",
      "content_hash": "sha256:def456...",
      "change_summary": "Added conclusion",
      "word_count": 120,
      "created_by": {
        "id": "uuid",
        "username": "johndoe"
      },
      "created_at": "2025-12-10T11:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "has_more": false
}
```

---

### **4.8 Restore Document Version**

**Endpoint**: `POST /api/v1/documents/{document_id}/restore-version`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "version_id": "uuid"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "My Document",
  "content": "# Content from version 3",
  "version": 6,
  "restored_from_version": 3,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

**Side Effects**:
- Creates new version (not overwriting current)
- Marks as "restored from version X"

---

## 5. Folder Endpoints

### **5.1 Create Folder**

**Endpoint**: `POST /api/v1/folders`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)

**Request**:
```json
{
  "name": "Work Projects",
  "icon": "📁",
  "color": "#3b82f6",
  "parent_id": "uuid",
  "position": 0
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "name": "Work Projects",
  "icon": "📁",
  "color": "#3b82f6",
  "parent_id": "uuid",
  "position": 0,
  "created_by_id": "uuid",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Validation**:
- `name`: Required, 1-100 chars
- `icon`: Optional, single emoji
- `color`: Optional, hex color code
- `parent_id`: Must exist in same workspace
- `position`: Auto-calculated if not provided

**Errors**:
- `400`: Validation error
- `403`: No permission to create folders
- `404`: Parent folder or workspace not found

---

### **5.2 List Folders**

**Endpoint**: `GET /api/v1/folders/workspace/{workspace_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `parent_id`: Filter by parent (optional, null for root)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "Work Projects",
      "icon": "📁",
      "color": "#3b82f6",
      "parent_id": null,
      "position": 0,
      "document_count": 12,
      "created_at": "2025-12-10T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### **5.3 Get Folder Tree**

**Endpoint**: `GET /api/v1/folders/tree`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)

**Response** (200 OK):
```json
{
  "folders": [
    {
      "id": "uuid",
      "name": "Work Projects",
      "icon": "📁",
      "color": "#3b82f6",
      "parent_id": null,
      "position": 0,
      "children": [
        {
          "id": "uuid-2",
          "name": "Client A",
          "icon": "👤",
          "parent_id": "uuid",
          "position": 0,
          "children": []
        }
      ]
    }
  ]
}
```

---

### **5.4 Update Folder**

**Endpoint**: `PATCH /api/v1/folders/{folder_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)

**Request** (all fields optional):
```json
{
  "name": "Updated Name",
  "icon": "🚀",
  "color": "#10b981"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "icon": "🚀",
  "color": "#10b981",
  "updated_at": "2025-12-10T13:00:00Z"
}
```

---

### **5.5 Move Folder**

**Endpoint**: `PATCH /api/v1/folders/{folder_id}/move`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)

**Request**:
```json
{
  "parent_id": "uuid",
  "position": 2
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Work Projects",
  "parent_id": "uuid",
  "position": 2,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

**Validation**:
- Cannot move folder into itself
- Cannot create circular hierarchy

**Errors**:
- `400`: Invalid move (circular reference)
- `404`: Folder or parent not found

---

### **5.6 Delete Folder**

**Endpoint**: `DELETE /api/v1/folders/{folder_id}`

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `workspace_id`: Workspace ID (required)
- `cascade`: Delete all documents in folder (default: false)

**Response** (204 No Content)

**Errors**:
- `400`: Folder not empty (if `cascade=false`)
- `403`: No delete permission
- `404`: Folder not found

---

## 6. Collaboration Endpoints (Phase 1)

### **6.1 Get Collaboration Token**

**Endpoint**: `GET /api/v1/documents/{document_id}/collab-token`

**Headers**: `Authorization: Bearer {access_token}`

**Purpose**: Get JWT token for Hocuspocus WebSocket connection

**Response** (200 OK):
```json
{
  "token": "eyJhbGc...",
  "ws_url": "wss://hocuspocus.mdreader.app/doc:{document_id}",
  "expires_at": "2025-12-10T11:00:00Z"
}
```

**Usage**:
```typescript
const { token, ws_url } = response.data;

const provider = new HocuspocusProvider({
  url: ws_url,
  token: token,
  document: ydoc,
});
```

---

### **6.2 Get Active Collaborators**

**Endpoint**: `GET /api/v1/documents/{document_id}/collaborators`

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "collaborators": [
    {
      "user_id": "uuid",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "cursor_position": 150,
      "last_active": "2025-12-10T10:55:00Z"
    },
    {
      "user_id": "uuid-2",
      "username": "janedoe",
      "full_name": "Jane Doe",
      "avatar_url": "https://...",
      "cursor_position": 320,
      "last_active": "2025-12-10T10:56:00Z"
    }
  ],
  "total_active": 2
}
```

---

## 7. Storage Mode Endpoints (Phase 2)

### **7.1 Change Storage Mode**

**Endpoint**: `PATCH /api/v1/documents/{document_id}/storage-mode`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "storage_mode": "LocalOnly"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "storage_mode": "LocalOnly",
  "cloud_copy_deleted": true,
  "updated_at": "2025-12-10T13:00:00Z"
}
```

**Storage Mode Behavior**:

| Mode | Local Storage | Cloud Sync | Real-time Collab |
|------|--------------|------------|------------------|
| `LocalOnly` | ✅ IndexedDB | ❌ Never | ❌ Not available |
| `HybridSync` | ✅ IndexedDB | ✅ Bidirectional | ✅ Available |
| `CloudOnly` | ❌ Stream only | ✅ Primary | ✅ Available |

**Side Effects**:
- `LocalOnly`: Deletes Yjs state from `document_collab_state`
- `CloudOnly`: Clears IndexedDB for this document

---

## 8. Migration Endpoints (Phase 3)

### **8.1 Migrate Guest Documents**

**Endpoint**: `POST /api/v1/migration/guest-to-cloud`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "workspace_id": "uuid",
  "documents": [
    {
      "temp_id": "guest-doc-123",
      "title": "My Guest Document",
      "content": "# Content",
      "folder_path": "/Work/Projects"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "workspace_id": "uuid",
  "results": [
    {
      "temp_id": "guest-doc-123",
      "new_id": "uuid",
      "status": "success",
      "title": "My Guest Document"
    }
  ],
  "summary": {
    "total": 1,
    "succeeded": 1,
    "failed": 0
  }
}
```

**Errors**:
- `400`: Invalid document data
- `403`: Not authorized to create in workspace
- `413`: Payload too large (> 100 documents)

---

## 9. Error Responses

### **9.1 Standard Error Format**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "uuid",
    "timestamp": "2025-12-10T10:00:00Z"
  }
}
```

### **9.2 Error Codes**

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Input validation failed |
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 401 | `TOKEN_EXPIRED` | JWT token expired |
| 403 | `FORBIDDEN` | No permission |
| 403 | `PERMISSION_DENIED` | Specific permission missing |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (duplicate, version) |
| 409 | `SLUG_EXISTS` | Slug already taken |
| 413 | `PAYLOAD_TOO_LARGE` | Request too large |
| 422 | `UNPROCESSABLE_ENTITY` | Semantic validation error |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Temporarily unavailable |

---

## 10. WebSocket Protocol (Hocuspocus)

### **10.1 Connection**

**URL**: `wss://hocuspocus.mdreader.app/doc:{document_id}`

**Query Parameters**:
- `token`: JWT token from `/collab-token` endpoint

**Example**:
```typescript
const provider = new HocuspocusProvider({
  url: 'wss://hocuspocus.mdreader.app',
  name: `doc:${documentId}`,
  token: collabToken,
  document: ydoc,
});
```

---

### **10.2 Message Types**

#### **Client → Server**

**Auth Message** (initial)
```json
{
  "type": "auth",
  "token": "eyJhbGc..."
}
```

**Sync Message** (binary, Yjs format)
```
[Yjs binary data - state vector and updates]
```

**Awareness Message** (cursor position)
```json
{
  "type": "awareness",
  "clientID": 123,
  "user": {
    "name": "John Doe",
    "color": "#3b82f6"
  },
  "cursor": {
    "anchor": 100,
    "head": 100
  }
}
```

---

#### **Server → Client**

**Auth Success**
```json
{
  "type": "auth-success",
  "user": {
    "id": "uuid",
    "name": "John Doe"
  }
}
```

**Auth Failure**
```json
{
  "type": "auth-failed",
  "reason": "Invalid token"
}
```

**Sync Message** (binary, Yjs format)
```
[Yjs binary data - merged state]
```

**Awareness Update**
```json
{
  "type": "awareness-update",
  "clients": {
    "123": {
      "user": {
        "name": "John Doe",
        "color": "#3b82f6"
      },
      "cursor": {
        "anchor": 100,
        "head": 100
      }
    },
    "456": {
      "user": {
        "name": "Jane Doe",
        "color": "#10b981"
      },
      "cursor": {
        "anchor": 250,
        "head": 250
      }
    }
  }
}
```

---

### **10.3 Connection Lifecycle**

```
1. Connect to WebSocket
   wss://hocuspocus.mdreader.app/doc:{id}?token={jwt}
   
2. Server validates JWT
   → Success: Returns auth-success
   → Failure: Closes connection with code 401
   
3. Client sends state vector (Yjs)
   → Server calculates diff
   → Server sends missing updates
   
4. Client applies updates
   → Document synced
   
5. Continuous sync
   → Client edits → Sends update to server
   → Server broadcasts to all connected clients
   → Other clients apply update (CRDT merge)
   
6. Disconnect
   → Server removes client from awareness
   → Broadcasts awareness update to others
```

---

## 📋 **API Testing Checklist**

### **Authentication**
- [ ] Register with valid data → 201 Created
- [ ] Register with duplicate email → 409 Conflict
- [ ] Login with valid credentials → 200 OK + tokens
- [ ] Login with invalid password → 401 Unauthorized
- [ ] Refresh token → 200 OK + new tokens
- [ ] Access protected route without token → 401
- [ ] Access protected route with expired token → 401

### **Workspaces**
- [ ] Create workspace → 201 Created
- [ ] List workspaces → 200 OK with array
- [ ] Get workspace → 200 OK with details
- [ ] Update workspace → 200 OK
- [ ] Delete empty workspace → 204 No Content
- [ ] Delete workspace with documents (cascade) → 204

### **Documents**
- [ ] Create document → 201 Created
- [ ] Get document → 200 OK with content
- [ ] List documents → 200 OK with pagination
- [ ] Update document → 200 OK, version incremented
- [ ] Star/Unstar document → 200 OK
- [ ] Delete document → 204 No Content
- [ ] Get versions → 200 OK with history
- [ ] Restore version → 200 OK, new version created

### **Folders**
- [ ] Create folder → 201 Created
- [ ] List folders → 200 OK
- [ ] Get folder tree → 200 OK with hierarchy
- [ ] Update folder → 200 OK
- [ ] Move folder → 200 OK
- [ ] Delete empty folder → 204 No Content
- [ ] Delete folder with documents (cascade) → 204

### **Real-Time (Hocuspocus)**
- [ ] Connect with valid token → Connection established
- [ ] Connect without token → Connection refused (401)
- [ ] Edit document → Update broadcast to other clients
- [ ] Cursor movement → Awareness update sent
- [ ] Disconnect → Awareness update (client removed)

---

**Status**: 🟢 **CONTRACT COMPLETE**  
**Version**: 1.0  
**Last Updated**: December 10, 2025  
**Coverage**: Phases 0-4 (100%)


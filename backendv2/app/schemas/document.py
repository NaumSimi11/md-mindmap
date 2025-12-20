"""
Document Schemas
=================

Pydantic schemas for document validation and serialization.
Based on API_CONTRACTS.md Section 4.

Pattern: Input Validation (PATTERNS_ADOPTION.md)
- Strict validation at API boundary
- Type safety with Pydantic v2
- Clear error messages
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum
import re


# =========================================
# Enums
# =========================================

class ContentType(str, Enum):
    """Content type enum"""
    MARKDOWN = "markdown"
    HTML = "html"


class StorageMode(str, Enum):
    """Storage mode enum"""
    LOCAL_ONLY = "LocalOnly"
    HYBRID_SYNC = "HybridSync"
    CLOUD_ONLY = "CloudOnly"


class SortBy(str, Enum):
    """Sort field enum"""
    UPDATED_AT = "updated_at"
    CREATED_AT = "created_at"
    TITLE = "title"


class SortOrder(str, Enum):
    """Sort order enum"""
    ASC = "asc"
    DESC = "desc"


# =========================================
# Request Schemas (Input)
# =========================================

class DocumentCreate(BaseModel):
    """
    Create document request
    
    Validation (API_CONTRACTS.md 4.1):
    - id: Optional client-generated UUID (for local-first sync)
    - title: Required, 1-200 chars
    - content: Optional, max 10MB
    - content_type: "markdown" | "html" (default: "markdown")
    - folder_id: Must exist in same workspace
    - tags: Array of strings
    - is_public: Optional, default false
    - is_template: Optional, default false
    - storage_mode: "LocalOnly" | "HybridSync" | "CloudOnly" (default: "HybridSync")
    """
    id: Optional[str] = Field(
        None,
        description="Client-generated UUID (for local-first sync). If not provided, backend generates one."
    )
    
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Document title (1-200 chars)"
    )
    
    content: Optional[str] = Field(
        default="",
        max_length=10_485_760,  # 10MB
        description="Document content (max 10MB)"
    )
    
    content_type: ContentType = Field(
        default=ContentType.MARKDOWN,
        description="Content type: markdown or html"
    )
    
    folder_id: Optional[str] = Field(
        None,
        description="Optional parent folder ID"
    )
    
    tags: List[str] = Field(
        default_factory=list,
        description="Array of tags"
    )
    
    is_public: bool = Field(
        default=False,
        description="Public visibility flag"
    )
    
    is_template: bool = Field(
        default=False,
        description="Template flag"
    )
    
    storage_mode: StorageMode = Field(
        default=StorageMode.HYBRID_SYNC,
        description="Storage mode"
    )

    yjs_state_b64: Optional[str] = Field(
        None,
        description="Yjs document state (Base64 encoded binary)"
    )
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate tags (max 20 tags, each max 50 chars)"""
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Each tag must be max 50 characters")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "My Document",
                "content": "# Hello World",
                "content_type": "markdown",
                "folder_id": "550e8400-e29b-41d4-a716-446655440000",
                "tags": ["work", "draft"],
                "is_public": False,
                "is_template": False,
                "storage_mode": "HybridSync"
            }
        }
    }


class DocumentUpdate(BaseModel):
    """
    Update document request (all fields optional)
    
    Validation (API_CONTRACTS.md 4.4):
    - title: Optional, 1-200 chars
    - content: Optional, max 10MB
    - folder_id: Optional, must exist in same workspace
    - tags: Optional array
    - is_public: Optional
    """
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Document title"
    )
    
    content: Optional[str] = Field(
        None,
        max_length=10_485_760,  # 10MB
        description="Document content"
    )
    
    folder_id: Optional[str] = Field(
        None,
        description="Parent folder ID (null to move to root)"
    )
    
    tags: Optional[List[str]] = Field(
        None,
        description="Array of tags"
    )
    
    is_public: Optional[bool] = Field(
        None,
        description="Public visibility flag"
    )

    yjs_state_b64: Optional[str] = Field(
        None,
        description="Yjs document state (Base64 encoded binary)"
    )

    expected_yjs_version: Optional[int] = Field(
        None,
        description="Expected Yjs version for optimistic concurrency"
    )
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate tags"""
        if v is not None:
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            for tag in v:
                if len(tag) > 50:
                    raise ValueError("Each tag must be max 50 characters")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Updated Title",
                "content": "# Updated Content",
                "folder_id": "550e8400-e29b-41d4-a716-446655440000",
                "tags": ["work", "updated"],
                "is_public": False
            }
        }
    }


# =========================================
# Response Schemas (Output)
# =========================================

class DocumentCreator(BaseModel):
    """Document creator info (nested in DocumentDetail)"""
    id: str
    username: str
    full_name: Optional[str] = None
    
    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """
    Document response (basic info)
    
    Used in:
    - Create document (201)
    - Update document (200)
    - List documents (200, array)
    """
    id: str
    title: str
    slug: str
    content: str
    content_type: str
    workspace_id: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    is_template: bool = False
    is_starred: bool = False
    storage_mode: str
    version: int
    yjs_version: int
    yjs_state_b64: Optional[str] = None
    word_count: int
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "My Document",
                "slug": "my-document",
                "content": "# Hello World",
                "content_type": "markdown",
                "workspace_id": "550e8400-e29b-41d4-a716-446655440001",
                "folder_id": None,
                "tags": ["work", "draft"],
                "is_public": False,
                "is_template": False,
                "is_starred": False,
                "storage_mode": "HybridSync",
                "version": 1,
                "word_count": 2,
                "created_by_id": "550e8400-e29b-41d4-a716-446655440002",
                "created_at": "2025-12-10T10:00:00Z",
                "updated_at": "2025-12-10T10:00:00Z"
            }
        }
    }


class DocumentDetail(BaseModel):
    """
    Document detail response (with creator info)
    
    Used in:
    - Get document (200)
    """
    id: str
    title: str
    slug: str
    content: str
    content_type: str
    workspace_id: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    is_template: bool = False
    is_starred: bool = False
    storage_mode: str
    version: int
    yjs_version: int
    yjs_state_b64: Optional[str] = None
    word_count: int
    created_by: DocumentCreator
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "My Document",
                "slug": "my-document",
                "content": "# Hello World\n\nThis is my document.",
                "content_type": "markdown",
                "workspace_id": "550e8400-e29b-41d4-a716-446655440001",
                "folder_id": None,
                "tags": ["work", "draft"],
                "is_public": False,
                "is_template": False,
                "is_starred": False,
                "storage_mode": "HybridSync",
                "version": 5,
                "word_count": 6,
                "created_by": {
                    "id": "550e8400-e29b-41d4-a716-446655440002",
                    "username": "johndoe",
                    "full_name": "John Doe"
                },
                "created_at": "2025-12-10T10:00:00Z",
                "updated_at": "2025-12-10T12:00:00Z"
            }
        }
    }


class DocumentListItem(BaseModel):
    """Document list item (without content)"""
    id: str
    title: str
    slug: str
    content_type: str
    workspace_id: str
    folder_id: Optional[str] = None
    tags: List[str] = []
    is_starred: bool = False
    storage_mode: str
    version: int
    yjs_version: int
    word_count: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """
    List documents response (paginated)
    
    Used in:
    - List documents (200)
    """
    items: List[DocumentListItem]
    total: int
    page: int
    page_size: int
    has_more: bool
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "My Document",
                        "slug": "my-document",
                        "content_type": "markdown",
                        "workspace_id": "550e8400-e29b-41d4-a716-446655440001",
                        "folder_id": None,
                        "tags": ["work"],
                        "is_starred": False,
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
                "has_more": False
            }
        }
    }


class DocumentStarResponse(BaseModel):
    """
    Star/Unstar document response
    
    Used in:
    - Star document (200)
    - Unstar document (200)
    """
    id: str
    is_starred: bool
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "is_starred": True,
                "updated_at": "2025-12-10T13:00:00Z"
            }
        }
    }

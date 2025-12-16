"""
Workspace Schemas
==================

Pydantic schemas for workspace validation and serialization.
Based on API_CONTRACTS.md Section 3.

Pattern: Input Validation (PATTERNS_ADOPTION.md)
- Strict validation at API boundary
- Type safety with Pydantic v2
- Clear error messages
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re


# =========================================
# Request Schemas (Input)
# =========================================

class WorkspaceCreate(BaseModel):
    """
    Create workspace request
    
    Validation (API_CONTRACTS.md 3.1):
    - id: Optional client-generated UUID (for local-first sync)
    - name: Required, 1-100 chars
    - slug: Optional, auto-generated if not provided, unique per user
    - description: Optional, max 500 chars
    - icon: Optional, single emoji
    - is_public: Optional, default false
    """
    id: Optional[str] = Field(
        None,
        description="Client-generated UUID (for local-first sync). If not provided, backend generates one."
    )
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Workspace name (1-100 chars)"
    )
    
    slug: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        pattern=r'^[a-z0-9-]+$',
        description="URL-friendly slug (auto-generated if not provided)"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional workspace description"
    )
    
    icon: Optional[str] = Field(
        None,
        max_length=10,
        description="Optional emoji icon"
    )
    
    is_public: bool = Field(
        default=False,
        description="Public visibility flag"
    )
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug format (lowercase, alphanumeric, hyphens only)"""
        if v is not None:
            if not re.match(r'^[a-z0-9-]+$', v):
                raise ValueError(
                    "Slug must contain only lowercase letters, numbers, and hyphens"
                )
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "My Workspace",
                "slug": "my-workspace",
                "description": "Personal workspace",
                "icon": "📁",
                "is_public": False
            }
        }
    }


class WorkspaceUpdate(BaseModel):
    """
    Update workspace request (all fields optional)
    
    Validation (API_CONTRACTS.md 3.4):
    - name: Optional, 1-100 chars
    - description: Optional, max 500 chars
    - icon: Optional, single emoji
    - is_public: Optional
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Workspace name"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Workspace description"
    )
    
    icon: Optional[str] = Field(
        None,
        max_length=10,
        description="Emoji icon"
    )
    
    is_public: Optional[bool] = Field(
        None,
        description="Public visibility flag"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Updated Name",
                "description": "Updated description",
                "icon": "🚀"
            }
        }
    }


# =========================================
# Response Schemas (Output)
# =========================================

class WorkspaceOwner(BaseModel):
    """Workspace owner info (nested in WorkspaceDetail)"""
    id: str
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    model_config = {"from_attributes": True}


class WorkspaceStats(BaseModel):
    """Workspace statistics (nested in WorkspaceDetail)"""
    document_count: int = 0
    folder_count: int = 0
    member_count: int = 1
    storage_used_bytes: int = 0
    
    model_config = {"from_attributes": True}


class WorkspaceResponse(BaseModel):
    """
    Workspace response (basic info)
    
    Used in:
    - Create workspace (201)
    - Update workspace (200)
    - List workspaces (200, array)
    """
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "📁"
    is_public: bool = False
    owner_id: str
    created_at: datetime
    updated_at: datetime
    
    # Optional fields (only in list response)
    document_count: Optional[int] = None
    member_count: Optional[int] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "My Workspace",
                "slug": "my-workspace",
                "description": "Personal workspace",
                "icon": "📁",
                "is_public": False,
                "owner_id": "550e8400-e29b-41d4-a716-446655440001",
                "created_at": "2025-12-10T10:00:00Z",
                "updated_at": "2025-12-10T10:00:00Z"
            }
        }
    }


class WorkspaceDetail(BaseModel):
    """
    Workspace detail response (with owner and stats)
    
    Used in:
    - Get workspace (200)
    """
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "📁"
    is_public: bool = False
    owner: WorkspaceOwner
    stats: WorkspaceStats
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "My Workspace",
                "slug": "my-workspace",
                "description": "Personal workspace",
                "icon": "📁",
                "is_public": False,
                "owner": {
                    "id": "550e8400-e29b-41d4-a716-446655440001",
                    "username": "johndoe",
                    "full_name": "John Doe",
                    "avatar_url": None
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
        }
    }


class WorkspaceListResponse(BaseModel):
    """
    List workspaces response (paginated)
    
    Used in:
    - List workspaces (200)
    """
    items: List[WorkspaceResponse]
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
                        "name": "My Workspace",
                        "slug": "my-workspace",
                        "icon": "📁",
                        "is_public": False,
                        "owner_id": "550e8400-e29b-41d4-a716-446655440001",
                        "document_count": 42,
                        "member_count": 1,
                        "created_at": "2025-12-10T10:00:00Z",
                        "updated_at": "2025-12-10T10:00:00Z"
                    }
                ],
                "total": 5,
                "page": 1,
                "page_size": 50,
                "has_more": False
            }
        }
    }

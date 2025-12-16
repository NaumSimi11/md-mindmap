"""
Folder Schemas
===============

Pydantic schemas for folder request/response validation.
Based on API_CONTRACTS.md Section 5.

Pattern: Three-Layer Architecture (Schema Layer)
- Request validation
- Response serialization
- Type safety
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re


# =========================================
# Request Schemas
# =========================================

class FolderCreate(BaseModel):
    """
    Schema for POST /api/v1/folders
    
    Contract: API_CONTRACTS.md 5.1
    """
    id: Optional[str] = Field(
        None,
        description="Client-generated UUID (for local-first sync). If not provided, backend generates one."
    )
    
    name: str = Field(..., min_length=1, max_length=100, description="Folder name")
    icon: Optional[str] = Field(default="📁", max_length=10, description="Optional emoji icon")
    color: Optional[str] = Field(default=None, max_length=7, description="Optional hex color code")
    parent_id: Optional[str] = Field(default=None, description="Optional parent folder ID")
    position: Optional[int] = Field(default=0, ge=0, description="Order position")
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color code"""
        if v is None:
            return v
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color must be a valid hex code (e.g., #3b82f6)')
        return v


class FolderUpdate(BaseModel):
    """
    Schema for PATCH /api/v1/folders/{folder_id}
    
    Contract: API_CONTRACTS.md 5.4
    All fields optional
    """
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=10)
    color: Optional[str] = Field(default=None, max_length=7)
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color code"""
        if v is None:
            return v
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color must be a valid hex code (e.g., #3b82f6)')
        return v


class FolderMove(BaseModel):
    """
    Schema for PATCH /api/v1/folders/{folder_id}/move
    
    Contract: API_CONTRACTS.md 5.5
    """
    parent_id: Optional[str] = Field(default=None, description="New parent folder ID (null for root)")
    position: int = Field(..., ge=0, description="New position")


# =========================================
# Response Schemas
# =========================================

class FolderResponse(BaseModel):
    """
    Schema for folder response
    
    Contract: API_CONTRACTS.md 5.1, 5.4, 5.5
    """
    id: str
    workspace_id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    parent_id: Optional[str]
    position: int
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class FolderListItem(BaseModel):
    """
    Schema for folder list item
    
    Contract: API_CONTRACTS.md 5.2
    """
    id: str
    workspace_id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    parent_id: Optional[str]
    position: int
    document_count: int = 0
    created_at: datetime
    
    model_config = {"from_attributes": True}


class FolderListResponse(BaseModel):
    """
    Schema for folder list response
    
    Contract: API_CONTRACTS.md 5.2
    """
    items: List[FolderListItem]
    total: int


class FolderTreeNode(BaseModel):
    """
    Schema for folder tree node (recursive)
    
    Contract: API_CONTRACTS.md 5.3
    """
    id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    parent_id: Optional[str]
    position: int
    children: List['FolderTreeNode'] = []
    
    model_config = {"from_attributes": True}


class FolderTreeResponse(BaseModel):
    """
    Schema for folder tree response
    
    Contract: API_CONTRACTS.md 5.3
    """
    folders: List[FolderTreeNode]

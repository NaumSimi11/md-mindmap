"""
Folder Pydantic Schemas
Request/response models for folder API
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FolderBase(BaseModel):
    """Base folder schema"""
    name: str = Field(..., min_length=1, max_length=255)
    icon: str = Field(default="📁", max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None


class FolderCreate(FolderBase):
    """Schema for creating a folder"""
    pass


class FolderUpdate(BaseModel):
    """Schema for updating a folder"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None
    position: Optional[int] = None
    is_expanded: Optional[bool] = None


class FolderResponse(FolderBase):
    """Schema for folder response"""
    id: UUID
    workspace_id: UUID
    created_by_id: UUID
    position: int
    is_expanded: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderWithStats(FolderResponse):
    """Folder with document count"""
    document_count: int = 0
    subfolder_count: int = 0


class FolderTree(FolderResponse):
    """Folder with nested children"""
    children: List['FolderTree'] = []
    document_count: int = 0

    class Config:
        from_attributes = True


class FolderListResponse(BaseModel):
    """Paginated folder list response"""
    folders: List[FolderResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class MoveFolder(BaseModel):
    """Schema for moving a folder"""
    parent_id: Optional[UUID] = None
    position: Optional[int] = None


# For nested self-reference
FolderTree.model_rebuild()


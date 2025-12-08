"""
Workspace Schemas
Pydantic models for workspace request/response validation
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from enum import Enum
import re


class WorkspaceRoleEnum(str, Enum):
    """Workspace role enumeration"""
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class WorkspaceBase(BaseModel):
    """Base workspace schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = False


class WorkspaceCreate(WorkspaceBase):
    """Schema for workspace creation"""
    slug: Optional[str] = Field(None, min_length=3, max_length=100)
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug format"""
        if v is not None:
            if not re.match(r'^[a-z0-9-]+$', v):
                raise ValueError('Slug can only contain lowercase letters, numbers, and hyphens')
            if v.startswith('-') or v.endswith('-'):
                raise ValueError('Slug cannot start or end with a hyphen')
        return v


class WorkspaceUpdate(BaseModel):
    """Schema for workspace updates"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    is_archived: Optional[bool] = None


class WorkspaceMemberBase(BaseModel):
    """Base workspace member schema"""
    role: WorkspaceRoleEnum = WorkspaceRoleEnum.VIEWER


class WorkspaceMemberCreate(WorkspaceMemberBase):
    """Schema for adding member to workspace"""
    user_id: str  # UUID as string
    role: WorkspaceRoleEnum = WorkspaceRoleEnum.VIEWER


class WorkspaceMemberUpdate(BaseModel):
    """Schema for updating member role"""
    role: WorkspaceRoleEnum


class WorkspaceMemberResponse(WorkspaceMemberBase):
    """Schema for workspace member response"""
    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRoleEnum
    invited_by_id: Optional[UUID] = None
    invited_at: datetime
    joined_at: Optional[datetime]
    created_at: datetime
    
    # Nested user info
    user_email: Optional[str] = None
    user_username: Optional[str] = None
    user_full_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class WorkspaceResponse(WorkspaceBase):
    """Schema for workspace response"""
    id: UUID  # Changed from str to UUID
    slug: str
    owner_id: UUID  # Changed from str to UUID
    is_archived: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    member_count: Optional[int] = None
    user_role: Optional[WorkspaceRoleEnum] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            UUID: str,  # Convert UUID to string in JSON
        }
    )


class WorkspaceDetailResponse(WorkspaceResponse):
    """Detailed workspace response with members"""
    members: List[WorkspaceMemberResponse] = []
    
    class Config:
        from_attributes = True


class WorkspaceListResponse(BaseModel):
    """Paginated workspace list response"""
    workspaces: List[WorkspaceResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class WorkspaceInvitation(BaseModel):
    """Schema for workspace invitation"""
    email: str
    role: WorkspaceRoleEnum = WorkspaceRoleEnum.VIEWER
    message: Optional[str] = Field(None, max_length=500)


class WorkspaceStats(BaseModel):
    """Workspace statistics"""
    workspace_id: str
    member_count: int
    document_count: int = 0  # Will be implemented later
    total_size_bytes: int = 0  # Will be implemented later
    last_activity_at: Optional[datetime] = None


"""
Workspace Member Schemas
========================

Pydantic schemas for workspace membership requests/responses.

Role Hierarchy: owner > admin > editor > viewer
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class WorkspaceRoleEnum(str, Enum):
    """Workspace role enum for API contracts."""
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class AddWorkspaceMemberRequest(BaseModel):
    """Request to add a member to a workspace."""
    user_id: UUID = Field(..., description="User ID to add as member")
    role: WorkspaceRoleEnum = Field(..., description="Workspace role to grant")
    expires_at: Optional[datetime] = Field(None, description="Optional expiry (null = permanent)")
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        """Cannot grant owner role via add member (use transfer_ownership instead)."""
        if v == WorkspaceRoleEnum.OWNER:
            raise ValueError("Cannot grant owner role via add member. Use transfer_ownership endpoint.")
        return v


class ChangeWorkspaceMemberRoleRequest(BaseModel):
    """Request to change a member's role."""
    role: WorkspaceRoleEnum = Field(..., description="New workspace role")
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        """Cannot change to owner role (use transfer_ownership instead)."""
        if v == WorkspaceRoleEnum.OWNER:
            raise ValueError("Cannot change to owner role. Use transfer_ownership endpoint.")
        return v


class TransferWorkspaceOwnershipRequest(BaseModel):
    """Request to transfer workspace ownership."""
    new_owner_id: UUID = Field(..., description="User ID of new owner")
    demote_current_owner_to: WorkspaceRoleEnum = Field(
        WorkspaceRoleEnum.ADMIN,
        description="Role to demote current owner to (default: admin)"
    )
    
    @field_validator('demote_current_owner_to')
    @classmethod
    def validate_demote_role(cls, v):
        """Cannot demote to owner."""
        if v == WorkspaceRoleEnum.OWNER:
            raise ValueError("Cannot demote to owner role.")
        return v


class WorkspaceMemberResponse(BaseModel):
    """Response for a single workspace member."""
    id: UUID = Field(..., description="Membership ID")
    workspace_id: UUID = Field(..., description="Workspace ID")
    user_id: UUID = Field(..., description="User ID")
    email: Optional[str] = Field(None, description="User email (if available)")
    username: Optional[str] = Field(None, description="Username (if available)")
    full_name: Optional[str] = Field(None, description="Full name (if available)")
    role: WorkspaceRoleEnum = Field(..., description="Workspace role")
    granted_by: Optional[UUID] = Field(None, description="User who granted this membership")
    granted_at: datetime = Field(..., description="When membership was granted")
    expires_at: Optional[datetime] = Field(None, description="Optional expiry (null = permanent)")
    status: str = Field(..., description="Membership status (active/revoked)")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WorkspaceMemberListResponse(BaseModel):
    """Response for listing workspace members."""
    data: List[WorkspaceMemberResponse] = Field(..., description="List of workspace members")
    total: int = Field(..., description="Total count")
    workspace_id: UUID = Field(..., description="Workspace ID")


class UserWorkspaceResponse(BaseModel):
    """Response for a workspace the user is a member of."""
    id: UUID = Field(..., description="Workspace ID")
    name: str = Field(..., description="Workspace name")
    slug: str = Field(..., description="Workspace slug")
    description: Optional[str] = Field(None, description="Workspace description")
    icon: Optional[str] = Field(None, description="Workspace icon")
    owner_id: UUID = Field(..., description="Workspace owner ID")
    role: WorkspaceRoleEnum = Field(..., description="User's role in this workspace")
    member_count: int = Field(..., description="Total member count")
    document_count: int = Field(..., description="Total document count")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserWorkspaceListResponse(BaseModel):
    """Response for listing user's workspaces."""
    data: List[UserWorkspaceResponse] = Field(..., description="List of workspaces")
    total: int = Field(..., description="Total count")


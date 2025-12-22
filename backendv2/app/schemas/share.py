"""
Document Share Schemas
======================

Pydantic schemas for document sharing and permissions
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============================================================================
# Enums
# ============================================================================

class Role(str):
    """Role enum values"""
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"


class ShareStatus(str):
    """Share status enum values"""
    ACTIVE = "active"
    REVOKED = "revoked"
    PENDING = "pending"


# ============================================================================
# Request Schemas
# ============================================================================

class InviteUsersRequest(BaseModel):
    """Request to invite users by email"""
    emails: List[EmailStr] = Field(..., min_items=1, max_items=50, description="Email addresses to invite")
    role: str = Field(..., description="Role to assign (admin, editor, commenter, viewer)")
    message: Optional[str] = Field(None, max_length=500, description="Optional invite message")
    send_email: bool = Field(True, description="Whether to send email notification")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration timestamp")
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ['admin', 'editor', 'commenter', 'viewer']
        if v not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v


class ChangeMemberRoleRequest(BaseModel):
    """Request to change member role"""
    role: str = Field(..., description="New role (owner, admin, editor, commenter, viewer)")
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ['owner', 'admin', 'editor', 'commenter', 'viewer']
        if v not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v


class TransferOwnershipRequest(BaseModel):
    """Request to transfer document ownership"""
    new_owner_id: UUID = Field(..., description="UUID of new owner")


# ============================================================================
# Response Schemas
# ============================================================================

class DocumentShareResponse(BaseModel):
    """Response for document share/member"""
    id: UUID
    document_id: UUID
    principal_type: str
    principal_id: UUID
    role: str
    granted_by: Optional[UUID]
    granted_at: datetime
    expires_at: Optional[datetime]
    status: str
    
    # Additional user info (joined from User table)
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class MemberListResponse(BaseModel):
    """Response for listing document members"""
    members: List[DocumentShareResponse]
    pending_invites: List['InvitationResponse']
    
    class Config:
        from_attributes = True


class InviteCreatedResponse(BaseModel):
    """Response for created invitation"""
    invitation_id: UUID
    email: str
    role: str
    status: str
    expires_at: Optional[datetime]


class InviteUsersResponse(BaseModel):
    """Response for bulk invite operation"""
    success: bool
    invited: List[InviteCreatedResponse]
    errors: List[dict] = Field(default_factory=list, description="Any errors during invitation")
    
    class Config:
        from_attributes = True


class InvitationResponse(BaseModel):
    """Response for invitation details"""
    id: UUID
    document_id: UUID
    email: str
    role: str
    status: str
    message: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    invited_by: UUID
    inviter_name: Optional[str] = None
    inviter_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class AcceptInvitationResponse(BaseModel):
    """Response for accepting invitation"""
    success: bool
    document_id: UUID
    role: str
    message: str = "Invitation accepted successfully"


class TransferOwnershipResponse(BaseModel):
    """Response for ownership transfer"""
    success: bool
    new_owner_id: UUID
    message: str = "Ownership transferred successfully"


# ============================================================================
# Standard API Response Wrapper
# ============================================================================

class APIResponse(BaseModel):
    """Standard API response format"""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    
    class Config:
        from_attributes = True


# Rebuild models to resolve forward references
MemberListResponse.model_rebuild()


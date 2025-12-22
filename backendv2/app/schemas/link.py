"""
Share Link Schemas
==================

Pydantic schemas for shareable links
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID


# ============================================================================
# Enums
# ============================================================================

class LinkMode(str):
    """Link mode enum values"""
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"


# ============================================================================
# Request Schemas
# ============================================================================

class CreateShareLinkRequest(BaseModel):
    """Request to create share link"""
    mode: str = Field("view", description="Access mode (view, comment, edit)")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration timestamp")
    max_uses: Optional[int] = Field(None, ge=1, description="Maximum number of uses (null = unlimited)")
    password: Optional[str] = Field(None, min_length=4, max_length=100, description="Optional password protection")
    
    @validator('mode')
    def validate_mode(cls, v):
        valid_modes = ['view', 'comment', 'edit']
        if v not in valid_modes:
            raise ValueError(f"Mode must be one of: {', '.join(valid_modes)}")
        return v


class ValidateShareLinkRequest(BaseModel):
    """Request to validate share link"""
    token: str = Field(..., description="Share link token")
    password: Optional[str] = Field(None, description="Password if link is protected")


# ============================================================================
# Response Schemas
# ============================================================================

class ShareLinkResponse(BaseModel):
    """Response for share link"""
    id: UUID
    document_id: UUID
    token: str
    mode: str
    max_uses: Optional[int]
    uses_count: int
    created_by: UUID
    created_at: datetime
    expires_at: Optional[datetime]
    revoked_at: Optional[datetime]
    is_password_protected: bool = False
    
    # Computed fields
    is_active: bool = True
    is_expired: bool = False
    
    class Config:
        from_attributes = True


class CreateShareLinkResponse(BaseModel):
    """Response for created share link"""
    success: bool
    data: ShareLinkResponse
    full_url: Optional[str] = None  # Full URL with token (e.g., https://app.mdreader.com/share/{token})


class ShareLinkListResponse(BaseModel):
    """Response for listing share links"""
    success: bool
    links: list[ShareLinkResponse]


class ValidateShareLinkResponse(BaseModel):
    """Response for share link validation"""
    success: bool
    valid: bool
    document_id: Optional[UUID] = None
    mode: Optional[str] = None
    error: Optional[str] = None
    reason: Optional[str] = None  # e.g., "expired", "revoked", "max_uses_exceeded", "invalid_password"


class RevokeShareLinkResponse(BaseModel):
    """Response for revoking share link"""
    success: bool
    message: str = "Share link revoked successfully"


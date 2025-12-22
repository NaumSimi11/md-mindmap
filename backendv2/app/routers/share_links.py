"""
Share Links Router
==================

API endpoints for shareable links with tokens.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to LinkService
- /share/validate is PUBLIC (no auth required)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.link import (
    CreateShareLinkRequest,
    ShareLinkResponse,
    ShareLinkListResponse,
    ValidateShareLinkRequest,
    ValidateShareLinkResponse
)
from app.services.link_service import LinkService


router = APIRouter(prefix="/api/v1", tags=["Share Links"])


# =========================================
# Create Share Link
# =========================================

@router.post(
    "/documents/{document_id}/share-links",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create share link",
    description="Create shareable link with token. Owner/Admin only."
)
async def create_share_link(
    document_id: UUID,
    request: CreateShareLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create shareable link
    
    Permission: Owner/Admin
    
    Request:
    - mode: Access mode (view, comment, edit)
    - password: Optional password protection
    - expires_at: Optional expiration timestamp (default: 30 days)
    - max_uses: Optional maximum uses (null = unlimited)
    
    Response (201):
    - link_id: UUID
    - token: Secure token (256-bit)
    - mode: Access mode
    - expires_at: Expiration timestamp
    - max_uses: Maximum uses
    - uses_count: Current uses count
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not owner/admin)
    - 404: Document not found
    """
    try:
        link = await LinkService.create_share_link(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            mode=request.mode,
            expires_at=request.expires_at,
            max_uses=request.max_uses,
            password=request.password
        )
        
        await db.commit()
        
        return {
            "id": link.id,
            "token": link.token,
            "document_id": link.document_id,
            "mode": link.mode,
            "expires_at": link.expires_at,
            "max_uses": link.max_uses,
            "uses_count": link.uses_count,
            "created_by": link.created_by,
            "created_at": link.created_at,
            "revoked_at": link.revoked_at,
            "is_password_protected": link.password_hash is not None,
            "is_active": link.revoked_at is None and (link.expires_at is None or link.expires_at > datetime.utcnow()),
            "is_expired": link.expires_at is not None and link.expires_at <= datetime.utcnow()
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# List Share Links
# =========================================

@router.get(
    "/documents/{document_id}/share-links",
    response_model=ShareLinkListResponse,
    summary="List share links",
    description="List all share links for document. Any role can view."
)
async def list_share_links(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List share links
    
    Permission: Any role with access (viewer+)
    
    Response (200):
    - links: List of share links (including revoked)
    
    Errors:
    - 401: Not authenticated
    - 403: No access to document
    - 404: Document not found
    """
    try:
        links = await LinkService.list_share_links(
            db=db,
            document_id=document_id,
            actor_id=current_user.id
        )
        
        # Format response (hide password_hash)
        link_responses = [
            {
                "id": link.id,
                "token": link.token,
                "document_id": link.document_id,
                "mode": link.mode,
                "expires_at": link.expires_at,
                "max_uses": link.max_uses,
                "uses_count": link.uses_count,
                "created_by": link.created_by,
                "created_at": link.created_at,
                "revoked_at": link.revoked_at,
                "is_password_protected": link.password_hash is not None,
                "is_active": link.revoked_at is None and (link.expires_at is None or link.expires_at > datetime.utcnow()),
                "is_expired": link.expires_at is not None and link.expires_at <= datetime.utcnow()
            }
            for link in links
        ]
        
        return {
            "success": True,
            "links": link_responses
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Revoke Share Link
# =========================================

@router.delete(
    "/documents/{document_id}/share-links/{link_id}",
    summary="Revoke share link",
    description="Revoke share link. Owner/Admin only."
)
async def revoke_share_link(
    document_id: UUID,
    link_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Revoke share link
    
    Permission: Owner/Admin
    
    Response (200):
    - success: true
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not owner/admin)
    - 404: Link not found
    """
    try:
        await LinkService.revoke_share_link(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            link_id=link_id
        )
        
        await db.commit()
        
        return {
            "success": True,
            "message": "Share link revoked successfully"
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Validate Share Link (PUBLIC)
# =========================================

@router.post(
    "/share/validate",
    response_model=ValidateShareLinkResponse,
    summary="Validate share link (PUBLIC)",
    description="Validate share link token. No authentication required."
)
async def validate_share_link(
    request: ValidateShareLinkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate share link (PUBLIC ENDPOINT)
    
    Permission: None (public)
    
    Request:
    - token: Share link token
    - password: Optional password (if link is protected)
    
    Response (200):
    - valid: boolean
    - document_id: UUID (if valid)
    - mode: Access mode (if valid)
    - reason: Error reason (if invalid)
    
    Possible reasons:
    - invalid_token: Token not found
    - revoked: Link was revoked
    - expired: Link expired
    - max_uses_exceeded: Usage limit reached
    - password_required: Link is password-protected
    - invalid_password: Password mismatch
    
    Note: This endpoint increments uses_count on successful validation
    """
    try:
        result = await LinkService.validate_share_link(
            db=db,
            token=request.token,
            password=request.password
        )
        
        await db.commit()
        
        return result
        
    except Exception as e:
        await db.rollback()
        # Don't expose internal errors for security
        return {
            "valid": False,
            "document_id": None,
            "mode": None,
            "reason": "internal_error"
        }


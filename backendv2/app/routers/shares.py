"""
Shares Router
=============

API endpoints for document sharing, invitations, and member management.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to ShareService
- Converts exceptions to HTTP responses
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.share import (
    InviteUsersRequest,
    InviteUsersResponse,
    MemberListResponse,
    AcceptInvitationResponse,
    ChangeMemberRoleRequest,
    TransferOwnershipRequest,
    TransferOwnershipResponse,
    DocumentShareResponse,
    InvitationResponse
)
from app.services.share_service import ShareService


router = APIRouter(prefix="/api/v1", tags=["Shares"])


# =========================================
# Invite Users
# =========================================

@router.post(
    "/documents/{document_id}/invite",
    response_model=InviteUsersResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite users to document",
    description="Invite users by email. Owner/Admin only."
)
async def invite_users(
    document_id: UUID,
    request: InviteUsersRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Invite users to document by email
    
    Permission: Owner/Admin
    
    Request:
    - emails: List of email addresses (1-50)
    - role: Role to assign (admin, editor, commenter, viewer)
    - message: Optional invite message
    - send_email: Whether to send email notification (default: true)
    - expires_at: Optional expiration timestamp (default: 30 days)
    
    Response (201):
    - List of created invitations
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not owner/admin) or trying to invite to higher role
    - 404: Document not found
    """
    try:
        invitations = await ShareService.create_invitations(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            emails=request.emails,
            role=request.role,
            message=request.message,
            expires_at=request.expires_at,
            send_email=request.send_email
        )
        
        await db.commit()
        
        # Format response
        invited_list = [
            {
                "invitation_id": inv.id,
                "email": inv.email,
                "role": inv.role,
                "status": inv.status,
                "expires_at": inv.expires_at
            }
            for inv in invitations
        ]
        
        return {
            "success": True,
            "invited": invited_list,
            "errors": []
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invitations: {str(e)}"
        )


# =========================================
# List Members
# =========================================

@router.get(
    "/documents/{document_id}/members",
    response_model=MemberListResponse,
    summary="List document members",
    description="List members and pending invitations. Any role can view."
)
async def list_members(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List document members and pending invitations
    
    Permission: Any role with access (viewer+)
    
    Response (200):
    - members: List of active members with roles
    - pending_invites: List of pending invitations
    
    Errors:
    - 401: Not authenticated
    - 403: No access to document
    - 404: Document not found
    """
    try:
        members, invitations = await ShareService.list_members(
            db=db,
            document_id=document_id,
            actor_id=current_user.id
        )
        
        # Format members (join user data)
        from sqlalchemy import select
        from app.models.user import User as UserModel
        
        member_responses = []
        for member in members:
            # Get user info
            user_query = select(UserModel).where(UserModel.id == member.principal_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            member_responses.append({
                "id": member.id,
                "document_id": member.document_id,
                "principal_type": member.principal_type,
                "principal_id": member.principal_id,
                "role": member.role,
                "granted_by": member.granted_by,
                "granted_at": member.granted_at,
                "expires_at": member.expires_at,
                "status": member.status,
                "user_email": user.email if user else None,
                "user_name": user.full_name if user else None
            })
        
        # Format invitations (join inviter data)
        invitation_responses = []
        for invitation in invitations:
            inviter_query = select(UserModel).where(UserModel.id == invitation.invited_by)
            inviter_result = await db.execute(inviter_query)
            inviter = inviter_result.scalar_one_or_none()
            
            invitation_responses.append({
                "id": invitation.id,
                "document_id": invitation.document_id,
                "email": invitation.email,
                "role": invitation.role,
                "status": invitation.status,
                "message": invitation.message,
                "created_at": invitation.created_at,
                "expires_at": invitation.expires_at,
                "invited_by": invitation.invited_by,
                "inviter_name": inviter.full_name if inviter else None,
                "inviter_email": inviter.email if inviter else None
            })
        
        return {
            "members": member_responses,
            "pending_invites": invitation_responses
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Accept Invitation
# =========================================

@router.post(
    "/invitations/{token}/accept",
    response_model=AcceptInvitationResponse,
    summary="Accept invitation",
    description="Accept document invitation by token."
)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept document invitation
    
    Permission: Authenticated user with matching email
    
    Response (200):
    - document_id: Document ID
    - role: Granted role
    
    Errors:
    - 401: Not authenticated
    - 403: Email mismatch
    - 404: Invitation not found
    - 410: Invitation expired
    """
    try:
        invitation, share = await ShareService.accept_invitation(
            db=db,
            token=token,
            user_id=current_user.id
        )
        
        await db.commit()
        
        return {
            "success": True,
            "document_id": invitation.document_id,
            "role": invitation.role,
            "message": "Invitation accepted successfully"
        }
        
    except ValueError as e:
        await db.rollback()
        error_msg = str(e)
        
        if "expired" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=error_msg
            )
        elif "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )


# =========================================
# Decline Invitation
# =========================================

@router.post(
    "/invitations/{token}/decline",
    summary="Decline invitation",
    description="Decline document invitation by token."
)
async def decline_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Decline document invitation
    
    Permission: Authenticated user with matching email
    
    Response (200):
    - success: true
    
    Errors:
    - 401: Not authenticated
    - 404: Invitation not found
    """
    try:
        invitation = await ShareService.decline_invitation(
            db=db,
            token=token,
            user_id=current_user.id
        )
        
        await db.commit()
        
        return {
            "success": True,
            "message": "Invitation declined"
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =========================================
# Remove Member
# =========================================

@router.delete(
    "/documents/{document_id}/members/{member_id}",
    summary="Remove member",
    description="Remove member from document. Owner/Admin only."
)
async def remove_member(
    document_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove member from document
    
    Permission: Owner/Admin
    
    Response (200):
    - success: true
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions or trying to remove owner
    - 404: Member not found
    """
    try:
        await ShareService.remove_member(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            member_id=member_id
        )
        
        await db.commit()
        
        return {
            "success": True,
            "message": "Member removed successfully"
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Change Member Role
# =========================================

@router.post(
    "/documents/{document_id}/members/{member_id}/role",
    summary="Change member role",
    description="Change member's role. Owner/Admin only."
)
async def change_member_role(
    document_id: UUID,
    member_id: UUID,
    request: ChangeMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change member's role
    
    Permission: Owner/Admin (only owner can promote to owner)
    
    Request:
    - role: New role (owner, admin, editor, commenter, viewer)
    
    Response (200):
    - success: true
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions or trying to assign higher role
    - 404: Member not found
    """
    try:
        await ShareService.change_member_role(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            member_id=member_id,
            new_role=request.role
        )
        
        await db.commit()
        
        return {
            "success": True,
            "message": "Member role changed successfully"
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Transfer Ownership
# =========================================

@router.post(
    "/documents/{document_id}/transfer-ownership",
    response_model=TransferOwnershipResponse,
    summary="Transfer ownership",
    description="Transfer document ownership to another member. Owner only."
)
async def transfer_ownership(
    document_id: UUID,
    request: TransferOwnershipRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Transfer document ownership
    
    Permission: Owner only
    
    Request:
    - new_owner_id: UUID of new owner (must be existing member)
    
    Response (200):
    - success: true
    - new_owner_id: UUID
    
    Errors:
    - 401: Not authenticated
    - 403: Not owner
    - 404: New owner not found or not a member
    """
    try:
        await ShareService.transfer_ownership(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            new_owner_id=request.new_owner_id
        )
        
        await db.commit()
        
        return {
            "success": True,
            "new_owner_id": request.new_owner_id,
            "message": "Ownership transferred successfully"
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


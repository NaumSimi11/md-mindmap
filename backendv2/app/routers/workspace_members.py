"""
Workspace Members Router
========================

Pattern: Three-Layer Architecture (Router layer)
Purpose: HTTP API for workspace membership management

Endpoints:
- POST   /api/v1/workspaces/{workspace_id}/members           - Add member
- GET    /api/v1/workspaces/{workspace_id}/members           - List members
- DELETE /api/v1/workspaces/{workspace_id}/members/{user_id} - Remove member
- PATCH  /api/v1/workspaces/{workspace_id}/members/{user_id}/role - Change role
- POST   /api/v1/workspaces/{workspace_id}/transfer-ownership - Transfer ownership
- GET    /api/v1/users/me/workspaces                         - Get user's workspaces

Role Requirements:
- Add/Remove/Change: Admin or Owner
- Transfer Ownership: Owner only
- List: Any member (viewer+)
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.models.document import Document
from app.schemas.workspace_member import (
    AddWorkspaceMemberRequest,
    ChangeWorkspaceMemberRoleRequest,
    TransferWorkspaceOwnershipRequest,
    WorkspaceMemberResponse,
    WorkspaceMemberListResponse,
    UserWorkspaceResponse,
    UserWorkspaceListResponse
)
from app.services.workspace_member_service import WorkspaceMemberService


router = APIRouter(prefix="/api/v1", tags=["workspace-members"])


# ============================================================================
# Add Member
# ============================================================================

@router.post(
    "/workspaces/{workspace_id}/members",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add member to workspace",
    description="Add a user as a member of a workspace. Requires admin or owner role."
)
async def add_workspace_member(
    workspace_id: UUID,
    request: AddWorkspaceMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a member to a workspace.
    
    **Permission**: Admin or Owner
    
    **Returns**: Created workspace membership
    
    **Errors**:
    - 403: Not authorized (requires admin/owner)
    - 404: Workspace or user not found
    - 409: User is already a member
    - 422: Validation error (e.g., trying to grant owner role)
    """
    try:
        # Check permission (admin or owner)
        await WorkspaceMemberService.assert_workspace_role(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            required_role=WorkspaceRole.ADMIN
        )
        
        # Add member
        membership = await WorkspaceMemberService.add_member(
            db=db,
            workspace_id=workspace_id,
            user_id=request.user_id,
            role=WorkspaceRole(request.role.value),
            granted_by=current_user.id,
            expires_at=request.expires_at
        )
        
        await db.commit()
        await db.refresh(membership)
        
        # Build response
        return WorkspaceMemberResponse(
            id=membership.id,
            workspace_id=membership.workspace_id,
            user_id=membership.user_id,
            email=membership.user.email if membership.user else None,
            username=membership.user.username if membership.user else None,
            full_name=membership.user.full_name if membership.user else None,
            role=membership.role.value,
            granted_by=membership.granted_by,
            granted_at=membership.granted_at,
            expires_at=membership.expires_at,
            status=membership.status,
            created_at=membership.created_at,
            updated_at=membership.updated_at
        )
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "forbidden" in error_msg or "not a workspace member" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif "already a member" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# List Members
# ============================================================================

@router.get(
    "/workspaces/{workspace_id}/members",
    response_model=WorkspaceMemberListResponse,
    summary="List workspace members",
    description="List all members of a workspace. Requires membership (viewer+)."
)
async def list_workspace_members(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all members of a workspace.
    
    **Permission**: Any member (viewer or higher)
    
    **Returns**: List of workspace members
    
    **Errors**:
    - 403: Not a workspace member
    - 404: Workspace not found
    """
    try:
        # Check permission (any member)
        await WorkspaceMemberService.assert_workspace_role(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            required_role=WorkspaceRole.VIEWER
        )
        
        # List members
        members = await WorkspaceMemberService.list_members(
            db=db,
            workspace_id=workspace_id
        )
        
        # Build response
        member_responses = [
            WorkspaceMemberResponse(
                id=m.id,
                workspace_id=m.workspace_id,
                user_id=m.user_id,
                email=m.user.email if m.user else None,
                username=m.user.username if m.user else None,
                full_name=m.user.full_name if m.user else None,
                role=m.role.value,
                granted_by=m.granted_by,
                granted_at=m.granted_at,
                expires_at=m.expires_at,
                status=m.status,
                created_at=m.created_at,
                updated_at=m.updated_at
            )
            for m in members
        ]
        
        return WorkspaceMemberListResponse(
            data=member_responses,
            total=len(member_responses),
            workspace_id=workspace_id
        )
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "forbidden" in error_msg or "not a workspace member" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# Remove Member
# ============================================================================

@router.delete(
    "/workspaces/{workspace_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove member from workspace",
    description="Remove a member from a workspace. Requires admin or owner role. Cannot remove owner."
)
async def remove_workspace_member(
    workspace_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a member from a workspace.
    
    **Permission**: Admin or Owner
    
    **Returns**: 204 No Content
    
    **Errors**:
    - 403: Not authorized or trying to remove owner
    - 404: Member not found
    """
    try:
        # Check permission (admin or owner)
        await WorkspaceMemberService.assert_workspace_role(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            required_role=WorkspaceRole.ADMIN
        )
        
        # Remove member
        await WorkspaceMemberService.remove_member(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            removed_by=current_user.id
        )
        
        await db.commit()
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "forbidden" in error_msg or "cannot remove" in error_msg or "not a workspace member" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# Change Member Role
# ============================================================================

@router.patch(
    "/workspaces/{workspace_id}/members/{user_id}/role",
    response_model=WorkspaceMemberResponse,
    summary="Change member role",
    description="Change a member's role in a workspace. Requires admin or owner. Cannot change owner role."
)
async def change_workspace_member_role(
    workspace_id: UUID,
    user_id: UUID,
    request: ChangeWorkspaceMemberRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change a member's role.
    
    **Permission**: Admin or Owner
    
    **Returns**: Updated workspace membership
    
    **Errors**:
    - 403: Not authorized or trying to change owner role
    - 404: Member not found
    - 422: Validation error (e.g., trying to promote to owner)
    """
    try:
        # Check permission (admin or owner)
        await WorkspaceMemberService.assert_workspace_role(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            required_role=WorkspaceRole.ADMIN
        )
        
        # Change role
        membership = await WorkspaceMemberService.change_member_role(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            new_role=WorkspaceRole(request.role.value),
            changed_by=current_user.id
        )
        
        await db.commit()
        await db.refresh(membership)
        
        # Build response
        return WorkspaceMemberResponse(
            id=membership.id,
            workspace_id=membership.workspace_id,
            user_id=membership.user_id,
            email=membership.user.email if membership.user else None,
            username=membership.user.username if membership.user else None,
            full_name=membership.user.full_name if membership.user else None,
            role=membership.role.value,
            granted_by=membership.granted_by,
            granted_at=membership.granted_at,
            expires_at=membership.expires_at,
            status=membership.status,
            created_at=membership.created_at,
            updated_at=membership.updated_at
        )
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "forbidden" in error_msg or "cannot change" in error_msg or "not a workspace member" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# Transfer Ownership
# ============================================================================

@router.post(
    "/workspaces/{workspace_id}/transfer-ownership",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Transfer workspace ownership",
    description="Transfer workspace ownership to another user. Owner only."
)
async def transfer_workspace_ownership(
    workspace_id: UUID,
    request: TransferWorkspaceOwnershipRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transfer workspace ownership.
    
    **Permission**: Owner only
    
    **Returns**: 204 No Content
    
    **Errors**:
    - 403: Not the owner
    - 404: New owner not found
    """
    try:
        # Transfer ownership (includes permission check)
        await WorkspaceMemberService.transfer_ownership(
            db=db,
            workspace_id=workspace_id,
            new_owner_id=request.new_owner_id,
            current_owner_id=current_user.id,
            demote_current_owner_to=WorkspaceRole(request.demote_current_owner_to.value)
        )
        
        await db.commit()
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "forbidden" in error_msg or "only owner" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# Get User's Workspaces
# ============================================================================

@router.get(
    "/users/me/workspaces",
    response_model=UserWorkspaceListResponse,
    summary="Get user's workspaces",
    description="Get all workspaces the current user is a member of."
)
async def get_user_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all workspaces the user is a member of.
    
    **Permission**: Authenticated user
    
    **Returns**: List of workspaces with user's role and metadata
    """
    try:
        # Get user's workspaces
        workspaces_with_roles = await WorkspaceMemberService.get_user_workspaces(
            db=db,
            user_id=current_user.id
        )
        
        # Get member count and document count for each workspace
        workspace_responses = []
        for workspace, role in workspaces_with_roles:
            # Count members
            member_count_result = await db.execute(
                select(func.count())
                .select_from(WorkspaceMember)
                .where(
                    WorkspaceMember.workspace_id == workspace.id,
                    WorkspaceMember.status == "active"
                )
            )
            member_count = member_count_result.scalar() or 0
            
            # Count documents
            doc_count_result = await db.execute(
                select(func.count())
                .select_from(Document)
                .where(
                    Document.workspace_id == workspace.id,
                    Document.is_deleted == False
                )
            )
            document_count = doc_count_result.scalar() or 0
            
            workspace_responses.append(
                UserWorkspaceResponse(
                    id=workspace.id,
                    name=workspace.name,
                    slug=workspace.slug,
                    description=workspace.description,
                    icon=workspace.icon,
                    owner_id=workspace.owner_id,
                    role=role.value,
                    member_count=member_count,
                    document_count=document_count,
                    created_at=workspace.created_at,
                    updated_at=workspace.updated_at
                )
            )
        
        return UserWorkspaceListResponse(
            data=workspace_responses,
            total=len(workspace_responses)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


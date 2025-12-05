"""
Workspaces Router
API endpoints for workspace management and collaboration
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceRole
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceDetailResponse,
    WorkspaceListResponse,
    WorkspaceMemberCreate,
    WorkspaceMemberUpdate,
    WorkspaceMemberResponse,
    WorkspaceStats,
)
from app.services.workspace import WorkspaceService

router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new workspace
    
    - **name**: Workspace name (required)
    - **slug**: Optional URL-friendly identifier (auto-generated if not provided)
    - **description**: Optional description
    - **is_public**: Whether workspace is publicly visible (default: false)
    
    The authenticated user becomes the workspace owner
    """
    try:
        workspace = WorkspaceService.create_workspace(db, workspace_data, current_user.id)
        return WorkspaceResponse.model_validate(workspace)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all workspaces accessible by the current user
    
    Returns workspaces where user is:
    - Owner
    - Member (any role)
    
    Supports pagination and filtering
    """
    workspaces, total = WorkspaceService.get_user_workspaces(
        db,
        current_user.id,
        include_archived=include_archived,
        page=page,
        page_size=page_size
    )
    
    has_more = (page * page_size) < total
    
    return WorkspaceListResponse(
        workspaces=[WorkspaceResponse.model_validate(w) for w in workspaces],
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


@router.get("/{workspace_id}", response_model=WorkspaceDetailResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed workspace information including members
    
    Requires:
    - Workspace owner, member, or public workspace
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format"
        )
    
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_uuid, current_user.id)
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
    
    # Get members if user has access
    members = WorkspaceService.get_workspace_members(db, workspace_uuid, current_user.id)
    
    response_data = WorkspaceResponse.model_validate(workspace).model_dump()
    response_data["members"] = [
        WorkspaceMemberResponse.model_validate(m) for m in members
    ]
    
    return WorkspaceDetailResponse(**response_data)


@router.get("/slug/{slug}", response_model=WorkspaceResponse)
async def get_workspace_by_slug(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get workspace by its URL-friendly slug
    
    Requires:
    - Workspace owner, member, or public workspace
    """
    workspace = WorkspaceService.get_workspace_by_slug(db, slug, current_user.id)
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
    
    return WorkspaceResponse.model_validate(workspace)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update workspace information
    
    Requires:
    - Owner or Admin role
    
    Can update:
    - name
    - description
    - is_public
    - is_archived
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format"
        )
    
    try:
        workspace = WorkspaceService.update_workspace(
            db, workspace_uuid, workspace_data, current_user.id
        )
        
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
        
        return WorkspaceResponse.model_validate(workspace)
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a workspace (soft delete)
    
    Requires:
    - Workspace owner only
    
    This is a soft delete - data is not permanently removed
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format"
        )
    
    try:
        success = WorkspaceService.delete_workspace(db, workspace_uuid, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# ==================== Member Management ====================


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_workspace_member(
    workspace_id: str,
    member_data: WorkspaceMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a member to workspace
    
    Requires:
    - Owner or Admin role
    
    Roles:
    - owner: Full control (automatically assigned to workspace creator)
    - admin: Can manage members and settings
    - editor: Can create/edit/delete documents
    - viewer: Read-only access
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        member_user_uuid = uuid.UUID(member_data.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    try:
        member = WorkspaceService.add_member(
            db,
            workspace_uuid,
            current_user.id,
            member_user_uuid,
            member_data.role
        )
        
        return WorkspaceMemberResponse.model_validate(member)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all members of a workspace
    
    Requires:
    - Workspace member (any role)
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format"
        )
    
    members = WorkspaceService.get_workspace_members(db, workspace_uuid, current_user.id)
    
    return [WorkspaceMemberResponse.model_validate(m) for m in members]


@router.patch("/{workspace_id}/members/{member_id}", response_model=WorkspaceMemberResponse)
async def update_workspace_member(
    workspace_id: str,
    member_id: str,
    member_data: WorkspaceMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a member's role
    
    Requires:
    - Owner or Admin role
    
    Cannot change owner's role
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    try:
        member = WorkspaceService.update_member_role(
            db,
            workspace_uuid,
            member_uuid,
            current_user.id,
            member_data.role
        )
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return WorkspaceMemberResponse.model_validate(member)
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{workspace_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_workspace_member(
    workspace_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from workspace
    
    Requires:
    - Owner or Admin role
    
    Cannot remove workspace owner
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    try:
        success = WorkspaceService.remove_member(
            db,
            workspace_uuid,
            member_uuid,
            current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{workspace_id}/stats", response_model=WorkspaceStats)
async def get_workspace_stats(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get workspace statistics
    
    Requires:
    - Workspace member (any role)
    
    Returns:
    - Member count
    - Document count (future)
    - Storage usage (future)
    - Last activity (future)
    """
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workspace ID format"
        )
    
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_uuid, current_user.id)
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
    
    members = WorkspaceService.get_workspace_members(db, workspace_uuid, current_user.id)
    
    return WorkspaceStats(
        workspace_id=str(workspace_id),
        member_count=len(members),
        document_count=0,  # TODO: Implement when documents are ready
        total_size_bytes=0,  # TODO: Implement when file storage is ready
        last_activity_at=workspace.updated_at
    )


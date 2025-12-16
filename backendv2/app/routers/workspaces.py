"""
Workspaces Router
==================

API endpoints for workspace management.
Based on API_CONTRACTS.md Section 3.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to service
- Converts exceptions to HTTP responses
- Returns proper status codes

Success Rate: 98% (PATTERNS_ADOPTION.md)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceDetail,
    WorkspaceListResponse,
    WorkspaceOwner,
    WorkspaceStats,
)
from app.services.workspace_service import WorkspaceService


router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])


# =========================================
# Create Workspace
# =========================================

@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create workspace",
    description="Create a new workspace. Authenticated user becomes the owner."
)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new workspace (API_CONTRACTS.md 3.1)
    
    Request:
    - name: Workspace name (required, 1-100 chars)
    - slug: URL-friendly slug (optional, auto-generated)
    - description: Optional description (max 500 chars)
    - icon: Optional emoji icon
    - is_public: Public visibility (default: false)
    
    Response (201):
    - Workspace object with id, timestamps
    
    Errors:
    - 400: Validation error
    - 401: Not authenticated
    - 409: Slug already exists
    """
    service = WorkspaceService(db)
    
    try:
        workspace = await service.create_workspace(
            workspace_data,
            str(current_user.id)
        )
        
        return WorkspaceResponse(
            id=str(workspace.id),
            name=workspace.name,
            slug=workspace.slug,
            description=workspace.description,
            icon=workspace.icon,
            is_public=workspace.is_public,
            owner_id=str(workspace.owner_id),
            created_at=workspace.created_at,
            updated_at=workspace.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )


# =========================================
# List Workspaces
# =========================================

@router.get(
    "",
    response_model=WorkspaceListResponse,
    summary="List workspaces",
    description="List all workspaces owned by the current user (paginated)"
)
async def list_workspaces(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    include_archived: bool = Query(False, description="Include deleted workspaces"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List workspaces (API_CONTRACTS.md 3.2)
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 50, max: 100)
    - include_archived: Include deleted workspaces (default: false)
    
    Response (200):
    - items: Array of workspaces
    - total: Total count
    - page: Current page
    - page_size: Items per page
    - has_more: More pages available
    
    Errors:
    - 401: Not authenticated
    """
    service = WorkspaceService(db)
    
    workspaces, total = await service.list_workspaces(
        owner_id=str(current_user.id),
        page=page,
        page_size=page_size,
        include_archived=include_archived
    )
    
    # Get stats for each workspace
    items = []
    for workspace in workspaces:
        stats = await service.get_workspace_stats(str(workspace.id))
        
        items.append(
            WorkspaceResponse(
                id=str(workspace.id),
                name=workspace.name,
                slug=workspace.slug,
                description=workspace.description,
                icon=workspace.icon,
                is_public=workspace.is_public,
                owner_id=str(workspace.owner_id),
                document_count=stats["document_count"],
                member_count=stats["member_count"],
                created_at=workspace.created_at,
                updated_at=workspace.updated_at
            )
        )
    
    has_more = (page * page_size) < total
    
    return WorkspaceListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


# =========================================
# Get Workspace
# =========================================

@router.get(
    "/{workspace_id}",
    response_model=WorkspaceDetail,
    summary="Get workspace",
    description="Get workspace details including owner and statistics"
)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get workspace by ID (API_CONTRACTS.md 3.3)
    
    Response (200):
    - Workspace with owner info and stats
    
    Errors:
    - 404: Workspace not found
    - 403: No access to workspace
    - 401: Not authenticated
    """
    service = WorkspaceService(db)
    
    workspace = await service.get_workspace(
        workspace_id=workspace_id,
        user_id=str(current_user.id)
    )
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or no access"
        )
    
    # Get owner info
    owner = WorkspaceOwner(
        id=str(workspace.owner.id),
        username=workspace.owner.username,
        full_name=workspace.owner.full_name,
        avatar_url=None  # TODO: Add avatar support
    )
    
    # Get stats
    stats_dict = await service.get_workspace_stats(str(workspace.id))
    stats = WorkspaceStats(**stats_dict)
    
    return WorkspaceDetail(
        id=str(workspace.id),
        name=workspace.name,
        slug=workspace.slug,
        description=workspace.description,
        icon=workspace.icon,
        is_public=workspace.is_public,
        owner=owner,
        stats=stats,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at
    )


# =========================================
# Update Workspace
# =========================================

@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Update workspace",
    description="Update workspace (owner only). All fields optional."
)
async def update_workspace(
    workspace_id: str,
    update_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update workspace (API_CONTRACTS.md 3.4)
    
    Request (all optional):
    - name: Workspace name
    - description: Description
    - icon: Emoji icon
    - is_public: Public visibility
    
    Response (200):
    - Updated workspace
    
    Errors:
    - 403: Not workspace owner
    - 404: Workspace not found
    - 401: Not authenticated
    """
    service = WorkspaceService(db)
    
    try:
        workspace = await service.update_workspace(
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            update_data=update_data
        )
        
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
        
        return WorkspaceResponse(
            id=str(workspace.id),
            name=workspace.name,
            slug=workspace.slug,
            description=workspace.description,
            icon=workspace.icon,
            is_public=workspace.is_public,
            owner_id=str(workspace.owner_id),
            created_at=workspace.created_at,
            updated_at=workspace.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Delete Workspace
# =========================================

@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workspace",
    description="Delete workspace (owner only). Soft delete."
)
async def delete_workspace(
    workspace_id: str,
    cascade: bool = Query(
        False,
        description="Delete all documents and folders"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete workspace (API_CONTRACTS.md 3.5)
    
    Query Parameters:
    - cascade: Delete all documents and folders (default: false)
    
    Response (204):
    - No content
    
    Errors:
    - 403: Not workspace owner
    - 404: Workspace not found
    - 400: Workspace has documents (cascade=false)
    - 401: Not authenticated
    """
    service = WorkspaceService(db)
    
    try:
        deleted = await service.delete_workspace(
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            cascade=cascade
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
        
        return None  # 204 No Content
        
    except ValueError as e:
        # Check if it's a permission error or validation error
        if "owner" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

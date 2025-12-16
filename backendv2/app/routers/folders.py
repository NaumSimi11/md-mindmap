"""
Folders Router
==============

API endpoints for folder management.
Based on API_CONTRACTS.md Section 5.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to service
- Converts exceptions to HTTP responses
- Returns proper status codes
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.folder_service import FolderService
from app.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderMove,
    FolderResponse,
    FolderListItem,
    FolderListResponse,
    FolderTreeNode,
    FolderTreeResponse
)

router = APIRouter(
    prefix="/api/v1/folders",
    tags=["Folders"]
)


@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create folder",
    description="Create new folder in workspace (API_CONTRACTS.md 5.1)"
)
async def create_folder(
    folder_data: FolderCreate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new folder
    
    Contract: API_CONTRACTS.md 5.1
    - Only workspace owner can create folders
    - Parent folder must exist in same workspace
    - Returns 201 with folder data
    
    Errors:
    - 400: Validation error
    - 403: No permission to create folders
    - 404: Parent folder or workspace not found
    """
    service = FolderService(db)
    
    try:
        folder = await service.create_folder(
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            folder_id=folder_data.id,  # 🔥 LOCAL-FIRST: Pass client-generated ID
            name=folder_data.name,
            icon=folder_data.icon,
            color=folder_data.color,
            parent_id=folder_data.parent_id,
            position=folder_data.position
        )
        
        return FolderResponse(
            id=str(folder.id),
            workspace_id=str(folder.workspace_id),
            name=folder.name,
            icon=folder.icon,
            color=folder.color,
            parent_id=str(folder.parent_id) if folder.parent_id else None,
            position=folder.position,
            created_by_id=str(folder.created_by_id),
            created_at=folder.created_at,
            updated_at=folder.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        elif "permission" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )


@router.get(
    "/workspace/{workspace_id}",
    response_model=FolderListResponse,
    summary="List folders",
    description="List folders in workspace (API_CONTRACTS.md 5.2)"
)
async def list_folders(
    workspace_id: str,
    parent_id: Optional[str] = Query(None, description="Filter by parent (null for root)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List folders in workspace
    
    Contract: API_CONTRACTS.md 5.2
    - Returns folders filtered by parent
    - Includes document count for each folder
    - Ordered by position
    
    Errors:
    - 403: No access to workspace
    - 404: Workspace not found
    """
    service = FolderService(db)
    
    try:
        folders, total = await service.list_folders(
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            parent_id=parent_id
        )
        
        items = [
            FolderListItem(
                id=str(f.id),
                workspace_id=str(f.workspace_id),
                name=f.name,
                icon=f.icon,
                color=f.color,
                parent_id=str(f.parent_id) if f.parent_id else None,
                position=f.position,
                document_count=getattr(f, 'document_count', 0),
                created_at=f.created_at
            )
            for f in folders
        ]
        
        return FolderListResponse(items=items, total=total)
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )


@router.get(
    "/tree",
    response_model=FolderTreeResponse,
    summary="Get folder tree",
    description="Get hierarchical folder tree (API_CONTRACTS.md 5.3)"
)
async def get_folder_tree(
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get hierarchical folder tree
    
    Contract: API_CONTRACTS.md 5.3
    - Returns nested folder structure
    - Root folders at top level
    - Children recursively populated
    
    Errors:
    - 403: No access to workspace
    - 404: Workspace not found
    """
    service = FolderService(db)
    
    try:
        root_folders = await service.get_folder_tree(
            workspace_id=workspace_id,
            user_id=str(current_user.id)
        )
        
        def build_tree_node(folder) -> FolderTreeNode:
            """Recursively build tree node"""
            # Access children from manually set attribute (not SQLAlchemy relationship)
            folder_children = []
            if hasattr(folder, 'children') and isinstance(folder.children, list):
                folder_children = folder.children
            
            children = [
                build_tree_node(child)
                for child in folder_children
            ]
            
            return FolderTreeNode(
                id=str(folder.id),
                name=folder.name,
                icon=folder.icon,
                color=folder.color,
                parent_id=str(folder.parent_id) if folder.parent_id else None,
                position=folder.position,
                children=children
            )
        
        tree_nodes = [build_tree_node(f) for f in root_folders]
        
        return FolderTreeResponse(folders=tree_nodes)
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )


@router.patch(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Update folder",
    description="Update folder metadata (API_CONTRACTS.md 5.4)"
)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update folder metadata
    
    Contract: API_CONTRACTS.md 5.4
    - Only workspace owner can update folders
    - All fields optional
    - Returns updated folder
    
    Errors:
    - 403: No permission to update
    - 404: Folder not found
    """
    service = FolderService(db)
    
    try:
        folder = await service.update_folder(
            folder_id=folder_id,
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            name=folder_data.name,
            icon=folder_data.icon,
            color=folder_data.color
        )
        
        return FolderResponse(
            id=str(folder.id),
            workspace_id=str(folder.workspace_id),
            name=folder.name,
            icon=folder.icon,
            color=folder.color,
            parent_id=str(folder.parent_id) if folder.parent_id else None,
            position=folder.position,
            created_by_id=str(folder.created_by_id),
            created_at=folder.created_at,
            updated_at=folder.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )


@router.patch(
    "/{folder_id}/move",
    response_model=FolderResponse,
    summary="Move folder",
    description="Move folder to new parent/position (API_CONTRACTS.md 5.5)"
)
async def move_folder(
    folder_id: str,
    move_data: FolderMove,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Move folder to new parent/position
    
    Contract: API_CONTRACTS.md 5.5
    - Only workspace owner can move folders
    - Validates no circular references
    - Returns updated folder
    
    Errors:
    - 400: Invalid move (circular reference)
    - 403: No permission to move
    - 404: Folder or parent not found
    """
    service = FolderService(db)
    
    try:
        folder = await service.move_folder(
            folder_id=folder_id,
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            parent_id=move_data.parent_id,
            position=move_data.position
        )
        
        return FolderResponse(
            id=str(folder.id),
            workspace_id=str(folder.workspace_id),
            name=folder.name,
            icon=folder.icon,
            color=folder.color,
            parent_id=str(folder.parent_id) if folder.parent_id else None,
            position=folder.position,
            created_by_id=str(folder.created_by_id),
            created_at=folder.created_at,
            updated_at=folder.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e)
        if "circular" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete folder",
    description="Delete folder (soft delete) (API_CONTRACTS.md 5.6)"
)
async def delete_folder(
    folder_id: str,
    workspace_id: str = Query(..., description="Workspace ID"),
    cascade: bool = Query(False, description="Delete all documents in folder"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete folder (soft delete)
    
    Contract: API_CONTRACTS.md 5.6
    - Only workspace owner can delete folders
    - Requires cascade=true if folder has documents
    - Returns 204 No Content
    
    Errors:
    - 400: Folder not empty (if cascade=false)
    - 403: No permission to delete
    - 404: Folder not found
    """
    service = FolderService(db)
    
    try:
        await service.delete_folder(
            folder_id=folder_id,
            workspace_id=workspace_id,
            user_id=str(current_user.id),
            cascade=cascade
        )
        
        return None
    
    except ValueError as e:
        error_msg = str(e)
        if "not empty" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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

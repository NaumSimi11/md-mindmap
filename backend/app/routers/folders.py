"""
Folder Router
API endpoints for folder operations
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.folder import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FolderTree,
    FolderListResponse,
    MoveFolder,
)
from app.services.folder import FolderService
from app.services.workspace import WorkspaceService

router = APIRouter(prefix="/api/v1/folders", tags=["folders"])


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_data: FolderCreate,
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new folder
    
    Requires workspace access
    """
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    try:
        folder = FolderService.create_folder(
            db=db,
            workspace_id=workspace_id,
            user_id=current_user.id,
            folder_data=folder_data
        )
        return folder
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/workspace/{workspace_id}", response_model=List[FolderResponse])
def list_folders(
    workspace_id: UUID,
    parent_id: Optional[UUID] = Query(None, description="Parent folder ID (null for root)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List folders in workspace
    
    - If parent_id is provided: Get folders in that parent
    - If parent_id is None: Get root folders only
    - To get all folders, use /tree endpoint
    """
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    folders = FolderService.list_folders(db, workspace_id, parent_id)
    return folders


@router.get("/workspace/{workspace_id}/tree", response_model=List[FolderTree])
def get_folder_tree(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get folder hierarchy as nested tree
    
    Returns all folders organized in a nested structure
    """
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    tree = FolderService.get_folder_tree(db, workspace_id)
    return tree


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: UUID,
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get folder by ID"""
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    folder = FolderService.get_folder(db, folder_id, workspace_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    return folder


@router.patch("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: UUID,
    folder_data: FolderUpdate,
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update folder"""
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    try:
        folder = FolderService.update_folder(db, folder_id, workspace_id, folder_data)
        return folder
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{folder_id}/move", response_model=FolderResponse)
def move_folder(
    folder_id: UUID,
    move_data: MoveFolder,
    workspace_id: UUID = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Move folder to new parent"""
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    try:
        folder = FolderService.move_folder(
            db=db,
            folder_id=folder_id,
            workspace_id=workspace_id,
            parent_id=move_data.parent_id,
            position=move_data.position
        )
        return folder
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: UUID,
    workspace_id: UUID = Query(..., description="Workspace ID"),
    cascade: bool = Query(False, description="Delete all contents recursively"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete folder
    
    - cascade=false: Only delete if empty (default)
    - cascade=true: Delete all subfolders and documents
    """
    # Verify workspace access
    workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    try:
        FolderService.delete_folder(db, folder_id, workspace_id, cascade)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


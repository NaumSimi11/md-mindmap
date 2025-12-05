"""
Files Router
API endpoints for file upload, download, and management
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uuid
import io

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.file import (
    FileUploadResponse,
    FileResponse,
    FileListResponse,
    FileStats,
)
from app.services.file import FileService

router = APIRouter(prefix="/api/v1/files", tags=["Files"])


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    workspace_id: Optional[str] = Query(None),
    document_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file
    
    Can be attached to workspace or document
    """
    try:
        # Read file content
        content = await file.read()
        
        # Parse UUIDs
        workspace_uuid = uuid.UUID(workspace_id) if workspace_id else None
        document_uuid = uuid.UUID(document_id) if document_id else None
        
        # Upload
        file_record = FileService.upload_file(
            db,
            content,
            file.filename,
            current_user.id,
            workspace_uuid,
            document_uuid
        )
        
        return FileUploadResponse(**file_record.to_response())
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{file_id}", response_model=FileResponse)
async def get_file_info(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file metadata"""
    try:
        file_uuid = uuid.UUID(file_id)
        file_record = FileService.get_file_by_id(db, file_uuid, current_user.id)
        
        if not file_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
        return FileResponse(**file_record.to_response())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file ID")


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download file content"""
    try:
        file_uuid = uuid.UUID(file_id)
        
        # Get file record
        file_record = FileService.get_file_by_id(db, file_uuid, current_user.id)
        if not file_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
        # Get content
        content = FileService.get_file_content(db, file_uuid, current_user.id)
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File content not found")
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(content),
            media_type=file_record.mime_type,
            headers={
                "Content-Disposition": f'attachment; filename="{file_record.original_filename}"'
            }
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file ID")


@router.get("/workspace/{workspace_id}", response_model=FileListResponse)
async def list_workspace_files(
    workspace_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    mime_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files in workspace"""
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        
        files, total = FileService.list_workspace_files(
            db, workspace_uuid, current_user.id, page, page_size, mime_type
        )
        
        return FileListResponse(
            files=[FileResponse(**f.to_response()) for f in files],
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")


@router.get("/document/{document_id}/attachments", response_model=list[FileResponse])
async def list_document_files(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files attached to document"""
    try:
        document_uuid = uuid.UUID(document_id)
        files = FileService.list_document_files(db, document_uuid, current_user.id)
        
        return [FileResponse(**f.to_response()) for f in files]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete file (soft delete)"""
    try:
        file_uuid = uuid.UUID(file_id)
        success = FileService.delete_file(db, file_uuid, current_user.id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/workspace/{workspace_id}/stats", response_model=FileStats)
async def get_workspace_file_stats(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file statistics for workspace"""
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        stats = FileService.get_workspace_stats(db, workspace_uuid, current_user.id)
        
        if not stats:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
        return FileStats(
            total_files=stats["total_files"],
            total_size_bytes=stats["total_size_bytes"],
            total_size_mb=stats["total_size_mb"],
            by_mime_type=stats["by_mime_type"],
            by_storage={"local": stats["total_files"]}
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")


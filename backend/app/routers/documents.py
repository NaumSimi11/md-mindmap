"""
Documents Router  
API endpoints for document management, versioning, and search
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentVersionResponse,
    DocumentVersionListResponse,
    DocumentStats,
)
from app.services.document import DocumentService

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: DocumentCreate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new document in workspace (requires editor/admin)"""
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        document = DocumentService.create_document(db, workspace_uuid, document_data, current_user.id)
        return DocumentResponse.model_validate(document)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/workspace/{workspace_id}", response_model=DocumentListResponse)
async def list_workspace_documents(
    workspace_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    is_template: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents in workspace"""
    try:
        workspace_uuid = uuid.UUID(workspace_id)
        tags_list = tags.split(",") if tags else None
        
        documents, total = DocumentService.get_workspace_documents(
            db, workspace_uuid, current_user.id, page, page_size, tags_list, is_template
        )
        
        return DocumentListResponse(
            documents=[DocumentResponse.model_validate(d) for d in documents],
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document by ID"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.get_document_by_id(db, document_uuid, current_user.id)
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        # Increment view count
        document.increment_views()
        db.commit()
        
        # Get version count
        versions = DocumentService.get_document_versions(db, document_uuid, current_user.id)
        
        response_data = DocumentResponse.model_validate(document).model_dump()
        response_data["version_count"] = len(versions)
        
        return DocumentDetailResponse(**response_data)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update document (creates new version if content changed)"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.update_document(db, document_uuid, document_data, current_user.id)
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        return DocumentResponse.model_validate(document)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete document (soft delete)"""
    try:
        document_uuid = uuid.UUID(document_id)
        success = DocumentService.delete_document(db, document_uuid, current_user.id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== Version Management ====================


@router.get("/{document_id}/versions", response_model=DocumentVersionListResponse)
async def list_document_versions(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all versions of a document"""
    try:
        document_uuid = uuid.UUID(document_id)
        versions = DocumentService.get_document_versions(db, document_uuid, current_user.id)
        
        return DocumentVersionListResponse(
            versions=[DocumentVersionResponse.model_validate(v) for v in versions],
            total=len(versions)
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")


@router.get("/{document_id}/versions/{version_number}", response_model=DocumentVersionResponse)
async def get_document_version(
    document_id: str,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific version of document"""
    try:
        document_uuid = uuid.UUID(document_id)
        version = DocumentService.get_document_version(db, document_uuid, version_number, current_user.id)
        
        if not version:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
        
        return DocumentVersionResponse.model_validate(version)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID")


@router.post("/{document_id}/restore/{version_number}", response_model=DocumentResponse)
async def restore_document_version(
    document_id: str,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore document to previous version (creates new version)"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.restore_version(db, document_uuid, version_number, current_user.id)
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document or version not found")
        
        return DocumentResponse.model_validate(document)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== Search ====================


@router.get("/search/all", response_model=DocumentListResponse)
async def search_documents(
    q: Optional[str] = Query(None, description="Search query"),
    workspace_id: Optional[str] = Query(None, description="Filter by workspace"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search documents across all accessible workspaces"""
    try:
        workspace_uuid = uuid.UUID(workspace_id) if workspace_id else None
        tags_list = tags.split(",") if tags else None
        
        documents, total = DocumentService.search_documents(
            db, current_user.id, q, workspace_uuid, tags_list, page, page_size
        )
        
        return DocumentListResponse(
            documents=[DocumentResponse.model_validate(d) for d in documents],
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")


@router.get("/{document_id}/stats", response_model=DocumentStats)
async def get_document_stats(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document statistics"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.get_document_by_id(db, document_uuid, current_user.id)
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        versions = DocumentService.get_document_versions(db, document_uuid, current_user.id)
        last_version = versions[0] if versions else None
        
        return DocumentStats(
            document_id=str(document_id),
            version_count=len(versions),
            view_count=document.view_count,
            word_count=document.word_count,
            last_edited_at=document.updated_at,
            last_edited_by_id=str(last_version.created_by_id) if last_version and last_version.created_by_id else None
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")


# ==================== Star/Unstar ====================


@router.post("/{document_id}/star", response_model=DocumentResponse)
async def star_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Star a document"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.update_document(
            db, 
            document_uuid, 
            DocumentUpdate(is_starred=True),
            current_user.id
        )
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        return DocumentResponse.model_validate(document)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{document_id}/star", response_model=DocumentResponse)
async def unstar_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unstar a document"""
    try:
        document_uuid = uuid.UUID(document_id)
        document = DocumentService.update_document(
            db, 
            document_uuid, 
            DocumentUpdate(is_starred=False),
            current_user.id
        )
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
        return DocumentResponse.model_validate(document)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


"""
Document Router
===============

FastAPI endpoints for document operations.
Based on API_CONTRACTS.md Section 4.

Pattern: Three-Layer Architecture (Router layer)
- HTTP request/response handling
- Delegates to service layer
- Converts service errors to HTTP exceptions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetail,
    DocumentListResponse,
    DocumentListItem,
    DocumentStarResponse,
    DocumentCreator,
    SortBy,
    SortOrder
)


router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


# =========================================
# Document CRUD Endpoints
# =========================================

@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create document",
    description="Create a new document in a workspace. User must have access to workspace."
)
async def create_document(
    workspace_id: str = Query(..., description="Workspace ID"),
    document_data: DocumentCreate = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create document
    
    Flow:
    1. Validate request (Pydantic)
    2. Check authentication (JWT)
    3. Check workspace access
    4. Check folder access (if provided)
    5. Create document
    
    Returns:
    - 201: Document created
    - 400: Validation error
    - 403: No permission
    - 404: Workspace/folder not found
    """
    service = DocumentService(db)
    
    try:
        document = await service.create_document(
            workspace_id,
            document_data,
            str(current_user.id)
        )
        
        return DocumentResponse(
            id=str(document.id),
            title=document.title,
            slug=document.slug,
            content=document.content,
            content_type=document.content_type,
            workspace_id=str(document.workspace_id),
            folder_id=str(document.folder_id) if document.folder_id else None,
            tags=document.tags,
            is_public=document.is_public,
            is_template=document.is_template,
            is_starred=document.is_starred,
            storage_mode=document.storage_mode.value,
            version=document.version,
            word_count=document.word_count,
            created_by_id=str(document.created_by_id),
            created_at=document.created_at,
            updated_at=document.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        elif "no access" in error_msg or "no permission" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


@router.get(
    "/{document_id}",
    response_model=DocumentDetail,
    summary="Get document",
    description="Get document by ID. User must have access to document."
)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get document
    
    Access control:
    - Document creator
    - Workspace owner
    - Public documents
    
    Returns:
    - 200: Document found
    - 403: No access
    - 404: Document not found
    """
    service = DocumentService(db)
    
    try:
        document = await service.get_document(
            document_id,
            str(current_user.id)
        )
        
        # Load creator relationship
        await db.refresh(document, ["created_by"])
        
        return DocumentDetail(
            id=str(document.id),
            title=document.title,
            slug=document.slug,
            content=document.content,
            content_type=document.content_type,
            workspace_id=str(document.workspace_id),
            folder_id=str(document.folder_id) if document.folder_id else None,
            tags=document.tags,
            is_public=document.is_public,
            is_template=document.is_template,
            is_starred=document.is_starred,
            storage_mode=document.storage_mode.value,
            version=document.version,
            word_count=document.word_count,
            created_by=DocumentCreator(
                id=str(document.created_by.id),
                username=document.created_by.username,
                full_name=document.created_by.full_name
            ),
            created_at=document.created_at,
            updated_at=document.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )


@router.get(
    "/workspace/{workspace_id}",
    response_model=DocumentListResponse,
    summary="List documents",
    description="List documents in workspace with filtering and pagination."
)
async def list_documents(
    workspace_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    folder_id: Optional[str] = Query(None, description="Filter by folder"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    is_starred: Optional[bool] = Query(None, description="Filter starred documents"),
    is_template: Optional[bool] = Query(None, description="Filter templates"),
    sort_by: SortBy = Query(SortBy.UPDATED_AT, description="Sort field"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List documents
    
    Filters:
    - folder_id: Filter by folder
    - tags: Comma-separated tags (OR logic)
    - is_starred: Filter starred documents
    - is_template: Filter templates
    
    Sorting:
    - sort_by: updated_at | created_at | title
    - sort_order: asc | desc
    
    Returns:
    - 200: Documents list
    - 403: No access to workspace
    - 404: Workspace not found
    """
    service = DocumentService(db)
    
    # Parse tags
    tags_list = None
    if tags:
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    try:
        documents, total = await service.list_documents(
            workspace_id,
            str(current_user.id),
            page=page,
            page_size=page_size,
            folder_id=folder_id,
            tags=tags_list,
            is_starred=is_starred,
            is_template=is_template,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        items = [
            DocumentListItem(
                id=str(doc.id),
                title=doc.title,
                slug=doc.slug,
                content_type=doc.content_type,
                workspace_id=str(doc.workspace_id),
                folder_id=str(doc.folder_id) if doc.folder_id else None,
                tags=doc.tags,
                is_starred=doc.is_starred,
                storage_mode=doc.storage_mode.value,
                version=doc.version,
                word_count=doc.word_count,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            )
            for doc in documents
        ]
        
        return DocumentListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document",
    description="Update document. Only creator or workspace owner can update."
)
async def update_document(
    document_id: str,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update document
    
    Permission:
    - Document creator
    - Workspace owner
    
    Returns:
    - 200: Document updated
    - 403: No permission
    - 404: Document not found
    """
    service = DocumentService(db)
    
    try:
        document = await service.update_document(
            document_id,
            document_data,
            str(current_user.id)
        )
        
        return DocumentResponse(
            id=str(document.id),
            title=document.title,
            slug=document.slug,
            content=document.content,
            content_type=document.content_type,
            workspace_id=str(document.workspace_id),
            folder_id=str(document.folder_id) if document.folder_id else None,
            tags=document.tags,
            is_public=document.is_public,
            is_template=document.is_template,
            is_starred=document.is_starred,
            storage_mode=document.storage_mode.value,
            version=document.version,
            word_count=document.word_count,
            created_by_id=str(document.created_by_id),
            created_at=document.created_at,
            updated_at=document.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        elif "no permission" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document",
    description="Delete document (soft delete). Only creator or workspace owner can delete."
)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete document
    
    Permission:
    - Document creator
    - Workspace owner
    
    Side effects:
    - Soft delete (is_deleted = true)
    - Can be restored from trash
    
    Returns:
    - 204: Document deleted
    - 403: No permission
    - 404: Document not found
    """
    service = DocumentService(db)
    
    try:
        await service.delete_document(
            document_id,
            str(current_user.id)
        )
        
        return None
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )


# =========================================
# Star/Unstar Endpoints
# =========================================

@router.post(
    "/{document_id}/star",
    response_model=DocumentStarResponse,
    summary="Star document",
    description="Star document for quick access. Only creator can star."
)
async def star_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Star document
    
    Permission:
    - Document creator only
    
    Returns:
    - 200: Document starred
    - 403: Not creator
    - 404: Document not found
    """
    service = DocumentService(db)
    
    try:
        document = await service.star_document(
            document_id,
            str(current_user.id)
        )
        
        return DocumentStarResponse(
            id=str(document.id),
            is_starred=document.is_starred,
            updated_at=document.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )


@router.delete(
    "/{document_id}/star",
    response_model=DocumentStarResponse,
    summary="Unstar document",
    description="Remove star from document. Only creator can unstar."
)
async def unstar_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Unstar document
    
    Permission:
    - Document creator only
    
    Returns:
    - 200: Document unstarred
    - 403: Not creator
    - 404: Document not found
    """
    service = DocumentService(db)
    
    try:
        document = await service.unstar_document(
            document_id,
            str(current_user.id)
        )
        
        return DocumentStarResponse(
            id=str(document.id),
            is_starred=document.is_starred,
            updated_at=document.updated_at
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )

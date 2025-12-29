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
import base64

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
            yjs_version=document.yjs_version,
            yjs_state_b64=base64.b64encode(document.yjs_state).decode('utf-8') if document.yjs_state else None,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


@router.get(
    "/shared-with-me",
    response_model=DocumentListResponse,
    summary="List documents shared with me",
    description="List documents explicitly shared with the current user (doc-only access or restricted docs)."
)
async def get_shared_with_me_documents(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List documents shared with me
    
    Returns documents where:
    - User has explicit document_shares but is NOT a workspace member, OR
    - Document has access_model='restricted' and user has explicit doc_share
    
    Returns:
    - 200: Documents list
    """
    from app.services.share_service import ShareService
    
    try:
        documents = await ShareService.list_shared_with_me_documents(db, current_user.id)
        
        # Convert to response format
        items = []
        for doc in documents:
            items.append(DocumentListItem(
                id=str(doc.id),
                title=doc.title,
                slug=doc.slug,
                content_type=doc.content_type,
                workspace_id=str(doc.workspace_id),
                folder_id=str(doc.folder_id) if doc.folder_id else None,
                tags=doc.tags or [],
                is_starred=doc.is_starred or False,
                storage_mode=doc.storage_mode.value if doc.storage_mode else 'cloud',
                version=doc.version or 1,
                yjs_version=doc.yjs_version or 0,
                word_count=doc.word_count or 0,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            ))
        
        return DocumentListResponse(
            items=items,
            total=len(items),
            page=page,
            page_size=page_size,
            has_more=False
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch shared documents: {str(e)}"
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
            yjs_version=document.yjs_version,
            yjs_state_b64=base64.b64encode(document.yjs_state).decode('utf-8') if document.yjs_state else None,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        elif "invariant violation" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
                yjs_version=doc.yjs_version,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        elif "invariant violation" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
            yjs_version=document.yjs_version,
            yjs_state_b64=base64.b64encode(document.yjs_state).decode('utf-8') if document.yjs_state else None,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        elif "invariant violation" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        elif "invariant violation" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
        elif "concurrency conflict" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        elif "invariant violation" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )


# =========================================
# Snapshot Endpoints (for SnapshotManager)
# =========================================

@router.post(
    "/{document_id}/snapshot",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Save document snapshot"
)
async def save_snapshot(
    document_id: str,
    snapshot_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save document snapshot (from SnapshotManager)"""
    service = DocumentService(db)
    
    try:
        yjs_state_b64 = snapshot_data.get('yjs_state')
        html_content = snapshot_data.get('html', '')
        
        if not yjs_state_b64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="yjs_state is required"
            )
        
        # Create DocumentUpdate model
        update_data = DocumentUpdate(
            content=html_content,
            yjs_state_b64=yjs_state_b64,
            expected_yjs_version=None  # Snapshot always accepted
        )
        
        await service.update_document(
            document_id=document_id,
            document_data=update_data,
            user_id=str(current_user.id)
        )
        
        return None
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get(
    "/{document_id}/snapshot",
    summary="Fetch document snapshot"
)
async def fetch_snapshot(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch document snapshot (for restore)"""
    service = DocumentService(db)
    
    try:
        document = await service.get_document(document_id=document_id, user_id=str(current_user.id))
        
        if not document.yjs_state:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No snapshot found")
        
        return {
            "yjs_state": base64.b64encode(document.yjs_state).decode('utf-8'),
            "html": document.content or "",
            "updated_at": document.updated_at.isoformat()
        }
    
    except ValueError as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

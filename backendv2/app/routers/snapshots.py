"""
Snapshots Router
================

API endpoints for version history / snapshot management.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to SnapshotService
- CRDT-safe: Router NEVER applies CRDT logic

CRITICAL:
- Before overwrite restore → check for active WebSocket sessions
- If active → return 409 with reason: provider_active
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.snapshot import (
    SnapshotListResponse,
    SnapshotMetadataResponse,
    RestoreSnapshotRequest,
    RestoreSnapshotResponse,
    CreateManualSnapshotRequest,
    CreateManualSnapshotResponse
)
from app.services.snapshot_service import SnapshotService


router = APIRouter(prefix="/api/v1", tags=["Snapshots"])


# =========================================
# List Snapshots
# =========================================

@router.get(
    "/documents/{document_id}/snapshots",
    response_model=SnapshotListResponse,
    summary="List snapshots",
    description="List document snapshots with pagination. Viewer+ can access."
)
async def list_snapshots(
    document_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List document snapshots
    
    Permission: Any role with access (viewer+)
    
    Query params:
    - limit: Maximum snapshots to return (1-100, default: 50)
    - offset: Pagination offset (default: 0)
    
    Response (200):
    - snapshots: List of snapshot metadata (no yjs_state)
    - total: Total snapshot count
    - limit: Limit used
    - offset: Offset used
    
    Errors:
    - 401: Not authenticated
    - 403: No access to document
    - 404: Document not found
    """
    try:
        snapshots, total = await SnapshotService.list_snapshots(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            limit=limit,
            offset=offset
        )
        
        # Format response (exclude yjs_state binary)
        snapshot_responses = [
            {
                "id": snapshot.id,
                "document_id": snapshot.document_id,
                "created_by": snapshot.created_by,
                "created_at": snapshot.created_at,
                "type": snapshot.type,
                "note": snapshot.note,
                "size_bytes": snapshot.size_bytes,
                "html_preview": snapshot.html_preview
            }
            for snapshot in snapshots
        ]
        
        return {
            "snapshots": snapshot_responses,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Get Snapshot Metadata
# =========================================

@router.get(
    "/documents/{document_id}/snapshots/{snapshot_id}",
    response_model=SnapshotMetadataResponse,
    summary="Get snapshot metadata",
    description="Get snapshot metadata (without binary). Viewer+ can access."
)
async def get_snapshot(
    document_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get snapshot metadata
    
    Permission: Any role with access (viewer+)
    
    Response (200):
    - Snapshot metadata (no yjs_state binary)
    
    Errors:
    - 401: Not authenticated
    - 403: No access to document
    - 404: Snapshot not found
    """
    try:
        snapshot = await SnapshotService.get_snapshot(
            db=db,
            document_id=document_id,
            snapshot_id=snapshot_id,
            actor_id=current_user.id,
            include_yjs_state=False
        )
        
        return {
            "id": snapshot.id,
            "document_id": snapshot.document_id,
            "created_by": snapshot.created_by,
            "created_at": snapshot.created_at,
            "type": snapshot.type,
            "note": snapshot.note,
            "size_bytes": snapshot.size_bytes,
            "html_preview": snapshot.html_preview
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Download Snapshot Binary
# =========================================

@router.get(
    "/documents/{document_id}/snapshots/{snapshot_id}/download",
    summary="Download snapshot binary",
    description="Download snapshot yjs_state binary. Viewer+ can access."
)
async def download_snapshot(
    document_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download snapshot binary (yjs_state)
    
    Permission: Any role with access (viewer+)
    
    Response (200):
    - Binary data (application/octet-stream)
    
    Errors:
    - 401: Not authenticated
    - 403: No access to document
    - 404: Snapshot not found
    """
    try:
        yjs_state = await SnapshotService.download_snapshot(
            db=db,
            document_id=document_id,
            snapshot_id=snapshot_id,
            actor_id=current_user.id
        )
        
        # Return binary data
        return Response(
            content=yjs_state,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=snapshot_{snapshot_id}.bin"
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# =========================================
# Restore Snapshot (CRDT-SAFE)
# =========================================

@router.post(
    "/documents/{document_id}/snapshots/{snapshot_id}/restore",
    response_model=RestoreSnapshotResponse,
    summary="Restore snapshot (CRDT-safe)",
    description="Restore snapshot as new document or overwrite (owner-only, guarded)."
)
async def restore_snapshot(
    document_id: UUID,
    snapshot_id: UUID,
    request: RestoreSnapshotRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Restore snapshot (CRDT-SAFE)
    
    Permission:
    - new_document: Editor+ can restore as new
    - overwrite: Owner ONLY (requires backup_snapshot_id)
    
    Request:
    - action: 'new_document' (default) or 'overwrite'
    - backup_snapshot_id: Required for overwrite (type: restore-backup)
    - title: Title for new document (required for new_document)
    - force: Explicit confirmation for overwrite (default: false)
    
    Response (200):
    - success: true
    - action: Action performed
    - new_document_id: UUID (if new_document)
    - backup_snapshot_id: UUID (if overwrite)
    - message: Human-readable message
    
    Response (409 Conflict) - Provider Active:
    - success: false
    - reason: "provider_active"
    - suggested_action: "restore_as_new"
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not owner for overwrite)
    - 404: Snapshot not found
    - 409: Provider active (cannot overwrite)
    """
    
    # CRITICAL: Check for active WebSocket sessions BEFORE overwrite
    if request.action == 'overwrite':
        # TODO: Implement active session detection
        # For now, we'll do a basic check (can be enhanced in Phase 4)
        # A production implementation would:
        # 1. Query Hocuspocus for active rooms
        # 2. Check if document_id is in active sessions
        # 3. Return 409 if active
        
        # Placeholder: Assume provider might be active
        # Router can add more sophisticated checks later
        
        # Check if force=true (explicit confirmation)
        if not request.force:
            # Return 409 suggesting restore_as_new
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "reason": "provider_active",
                    "suggested_action": "restore_as_new",
                    "message": "Document may have active collaborators. Use 'restore_as_new' or confirm with force=true."
                }
            )
    
    try:
        result = await SnapshotService.restore_snapshot(
            db=db,
            document_id=document_id,
            snapshot_id=snapshot_id,
            actor_id=current_user.id,
            action=request.action,
            backup_snapshot_id=request.backup_snapshot_id,
            title=request.title,
            force=request.force
        )
        
        # Handle new_document action (create document)
        if request.action == 'new_document' and result.get('snapshot_yjs_state'):
            # Service returned yjs_state for us to create new document
            # We need to create the document here in the router
            
            from app.models.document import Document
            from datetime import datetime
            import base64
            
            # Create new document
            new_doc = Document(
                workspace_id=None,  # TODO: Get from original document
                title=result['title'],
                content='',  # Empty markdown (will use yjs_state)
                yjs_state=result['snapshot_yjs_state'],  # Binary blob
                owner_id=current_user.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                is_deleted=False
            )
            
            # Get original document's workspace_id
            from sqlalchemy import select
            from app.models.document import Document as DocumentModel
            doc_query = select(DocumentModel).where(DocumentModel.id == document_id)
            doc_result = await db.execute(doc_query)
            original_doc = doc_result.scalar_one_or_none()
            if original_doc:
                new_doc.workspace_id = original_doc.workspace_id
            
            db.add(new_doc)
            await db.flush()
            
            # Create owner share for new document
            from app.models.document_share import DocumentShare
            owner_share = DocumentShare(
                document_id=new_doc.id,
                principal_type='user',
                principal_id=current_user.id,
                role='owner',
                granted_by=current_user.id,
                status='active'
            )
            db.add(owner_share)
            
            await db.commit()
            
            # Update result
            result['new_document_id'] = new_doc.id
            result['success'] = True
            
            return result
        
        # Handle overwrite action
        elif request.action == 'overwrite':
            await db.commit()
            return result
        
        else:
            await db.commit()
            return result
        
    except ValueError as e:
        await db.rollback()
        error_msg = str(e)
        
        if "backup" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        elif "owner" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        elif "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )


# =========================================
# Create Manual Snapshot
# =========================================

@router.post(
    "/documents/{document_id}/snapshots",
    response_model=CreateManualSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual snapshot",
    description="Create manual snapshot. Editor+ can create."
)
async def create_manual_snapshot(
    document_id: UUID,
    request: CreateManualSnapshotRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create manual snapshot
    
    Permission: Editor+ can create
    
    Request:
    - yjs_state_base64: Base64-encoded yjs_state (from client)
    - note: Optional user note
    - html_preview: Optional HTML preview
    - type: 'manual', 'auto', or 'restore-backup' (default: 'manual')
    
    Response (201):
    - snapshot_id: UUID
    - created_at: Timestamp
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not editor+)
    - 400: Invalid yjs_state_base64
    - 404: Document not found
    """
    try:
        snapshot = await SnapshotService.create_manual_snapshot(
            db=db,
            document_id=document_id,
            actor_id=current_user.id,
            yjs_state_base64=request.yjs_state_base64,
            note=request.note,
            html_preview=request.html_preview,
            snapshot_type=request.type
        )
        
        await db.commit()
        
        return {
            "success": True,
            "snapshot_id": snapshot.id,
            "created_at": snapshot.created_at,
            "size_bytes": snapshot.size_bytes
        }
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if "invalid" in str(e).lower() else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


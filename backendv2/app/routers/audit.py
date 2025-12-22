"""
Audit Router
============

API endpoints for audit log access.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to AuditService
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import AuditService
from app.services.share_service import ShareService


router = APIRouter(prefix="/api/v1", tags=["Audit"])


# =========================================
# Get Document Audit Logs
# =========================================

@router.get(
    "/documents/{document_id}/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get document audit logs",
    description="Get audit trail for document. Owner/Admin only."
)
async def get_document_audit_logs(
    document_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get document audit logs
    
    Permission: Owner/Admin only
    
    Query params:
    - limit: Maximum logs to return (1-500, default: 100)
    - offset: Pagination offset (default: 0)
    
    Response (200):
    - logs: List of audit log entries
    - total: Total log count
    - limit: Limit used
    - offset: Offset used
    
    Audit log entries include:
    - action: Action performed (e.g. invite_sent, role_changed, link_created)
    - actor_id: User who performed action
    - document_id: Document ID
    - metadata: JSONB metadata (varies by action)
    - created_at: Timestamp
    
    Errors:
    - 401: Not authenticated
    - 403: Insufficient permissions (not owner/admin)
    - 404: Document not found
    """
    try:
        # Check permission (Owner/Admin only)
        await ShareService.assert_role(
            db=db,
            document_id=document_id,
            user_id=current_user.id,
            min_role='admin'
        )
        
        # Get logs
        logs, total = await AuditService.get_document_logs(
            db=db,
            document_id=document_id,
            limit=limit,
            offset=offset
        )
        
        # Format response
        log_responses = [
            {
                "id": log.id,
                "action": log.action,
                "actor_id": log.actor_id,
                "document_id": log.document_id,
                "metadata": log.log_metadata,
                "created_at": log.created_at
            }
            for log in logs
        ]
        
        return {
            "logs": log_responses,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


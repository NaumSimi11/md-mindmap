"""
Batch Operations Router
========================

API endpoints for batch document operations.
Enables efficient bulk sync for offline-first workflows.

Pattern: Three-Layer Architecture (Router Layer)
- HTTP handling ONLY
- Delegates business logic to service
- Converts exceptions to HTTP responses
- Returns proper status codes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.batch import (
    BatchDocumentRequest,
    BatchDocumentResponse,
    BatchOperationStatus,
)
from app.services.batch_service import BatchService


router = APIRouter(prefix="/api/v1", tags=["Batch Operations"])


# =========================================
# Batch Document Operations
# =========================================

@router.post(
    "/documents/batch",
    response_model=BatchDocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch document operations",
    description="Process multiple document operations (create/update/delete) in one request"
)
async def batch_document_operations(
    request: BatchDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Batch document operations
    
    Allows multiple create/update/delete operations in one request.
    Useful for syncing offline changes when coming back online.
    
    Request:
    - workspace_id: Workspace ID (all operations must be in same workspace)
    - operations: List of operations (1-100 operations per batch)
    - atomic: If true, all operations succeed or all fail (default: false)
    
    Response (200):
    - total: Total number of operations
    - successful: Number of successful operations
    - failed: Number of failed operations
    - results: Array of results (one per operation)
    - processing_time_ms: Total processing time
    
    Operation Types:
    - create: Create new document
    - update: Update existing document
    - delete: Soft-delete document
    
    Operation Statuses:
    - success: Operation completed successfully
    - conflict: Version conflict (optimistic locking)
    - error: Operation failed (validation, permissions, etc.)
    - skipped: Operation skipped (atomic mode failure)
    
    Errors:
    - 400: Validation error
    - 401: Not authenticated
    - 403: No permission to workspace
    - 409: Atomic mode conflict (all operations rolled back)
    """
    service = BatchService(db)
    
    try:
        # Process batch operations
        results, processing_time_ms = await service.process_batch(
            workspace_id=request.workspace_id,
            operations=request.operations,
            user_id=str(current_user.id),
            atomic=request.atomic
        )
        
        # Count successes and failures
        successful = sum(1 for r in results if r.status == BatchOperationStatus.SUCCESS)
        failed = sum(1 for r in results if r.status in [
            BatchOperationStatus.ERROR,
            BatchOperationStatus.CONFLICT,
            BatchOperationStatus.SKIPPED
        ])
        
        return BatchDocumentResponse(
            total=len(results),
            successful=successful,
            failed=failed,
            results=results,
            processing_time_ms=processing_time_ms
        )
    
    except ValueError as e:
        error_msg = str(e).lower()
        
        # Atomic mode failure
        if request.atomic and ("failed" in error_msg or "conflict" in error_msg):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Atomic batch failed: {str(e)}"
            )
        
        # Permission or validation errors
        if "no access" in error_msg or "no permission" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )
        
        # Other business logic errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        # Unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch processing failed: {str(e)}"
        )


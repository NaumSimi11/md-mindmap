"""
Batch Operations Service
=========================

Business logic for batch document operations.
Enables efficient bulk sync for offline-first workflows.

Pattern: Service Layer (PATTERNS_ADOPTION.md)
- Business logic ONLY
- No HTTP concerns
- Raises ValueError for business errors
- Database operations via SQLAlchemy
"""

import time
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.document import Document
from app.schemas.batch import (
    BatchDocumentOperation,
    BatchOperationType,
    BatchOperationResult,
    BatchOperationStatus,
)
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.document_service import DocumentService


class BatchService:
    """
    Batch operations service
    
    Handles bulk document operations (create/update/delete).
    Provides atomic and non-atomic modes.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.document_service = DocumentService(db)
    
    async def process_batch(
        self,
        workspace_id: str,
        operations: List[BatchDocumentOperation],
        user_id: str,
        atomic: bool = False
    ) -> Tuple[List[BatchOperationResult], int]:
        """
        Process batch of document operations
        
        Args:
            workspace_id: Workspace ID (all operations must be in same workspace)
            operations: List of operations to process
            user_id: User ID (for permissions)
            atomic: If True, all operations succeed or all fail
        
        Returns:
            Tuple of (results, processing_time_ms)
        
        Raises:
            ValueError: If atomic=True and any operation fails
        """
        start_time = time.time()
        results: List[BatchOperationResult] = []
        
        # Sort operations by type (create → update → delete)
        # This ensures dependencies are handled correctly
        sorted_ops = self._sort_operations(operations)
        
        # Track document ID mappings (client ID → server ID)
        id_mapping = {}
        
        try:
            for op in sorted_ops:
                result = await self._process_single_operation(
                    workspace_id,
                    op,
                    user_id,
                    id_mapping
                )
                results.append(result)
                
                # If atomic mode and operation failed, rollback and raise
                if atomic and result.status != BatchOperationStatus.SUCCESS:
                    await self.db.rollback()
                    raise ValueError(f"Operation {op.client_id} failed: {result.error}")
                
                # Track successful document ID mappings
                if result.status == BatchOperationStatus.SUCCESS and result.document_id:
                    id_mapping[op.client_id] = result.document_id
            
            # Commit all changes (if not already committed)
            if not atomic:
                await self.db.commit()
            
        except Exception as e:
            await self.db.rollback()
            if atomic:
                raise
            # In non-atomic mode, mark remaining operations as skipped
            for op in operations:
                if not any(r.client_id == op.client_id for r in results):
                    results.append(BatchOperationResult(
                        client_id=op.client_id,
                        status=BatchOperationStatus.SKIPPED,
                        error=f"Skipped due to previous error: {str(e)}"
                    ))
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        return results, processing_time_ms
    
    async def _process_single_operation(
        self,
        workspace_id: str,
        operation: BatchDocumentOperation,
        user_id: str,
        id_mapping: dict
    ) -> BatchOperationResult:
        """
        Process a single operation
        
        Args:
            workspace_id: Workspace ID
            operation: Operation to process
            user_id: User ID
            id_mapping: Map of client IDs to server IDs
        
        Returns:
            BatchOperationResult with status and details
        """
        try:
            if operation.operation == BatchOperationType.CREATE:
                return await self._handle_create(workspace_id, operation, user_id)
            
            elif operation.operation == BatchOperationType.UPDATE:
                return await self._handle_update(workspace_id, operation, user_id, id_mapping)
            
            elif operation.operation == BatchOperationType.DELETE:
                return await self._handle_delete(operation, user_id, id_mapping)
            
            else:
                return BatchOperationResult(
                    client_id=operation.client_id,
                    status=BatchOperationStatus.ERROR,
                    error=f"Unknown operation type: {operation.operation}"
                )
        
        except ValueError as e:
            error_msg = str(e).lower()
            
            # Detect conflicts
            if "version" in error_msg or "conflict" in error_msg:
                return BatchOperationResult(
                    client_id=operation.client_id,
                    status=BatchOperationStatus.CONFLICT,
                    document_id=operation.document_id,
                    error=str(e),
                    conflict_data={
                        "expected_version": operation.expected_version,
                        "error_message": str(e)
                    }
                )
            
            # Other business logic errors
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                document_id=operation.document_id,
                error=str(e)
            )
        
        except Exception as e:
            # Unexpected errors
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                document_id=operation.document_id,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def _handle_create(
        self,
        workspace_id: str,
        operation: BatchDocumentOperation,
        user_id: str
    ) -> BatchOperationResult:
        """Handle CREATE operation"""
        if not operation.data or not isinstance(operation.data, DocumentCreate):
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                error="Missing or invalid document data for create operation"
            )
        
        # Create document
        document = await self.document_service.create_document(
            workspace_id,
            operation.data,
            user_id
        )
        
        return BatchOperationResult(
            client_id=operation.client_id,
            status=BatchOperationStatus.SUCCESS,
            document_id=str(document.id),
            version=document.version
        )
    
    async def _handle_update(
        self,
        workspace_id: str,
        operation: BatchDocumentOperation,
        user_id: str,
        id_mapping: dict
    ) -> BatchOperationResult:
        """Handle UPDATE operation"""
        if not operation.data or not isinstance(operation.data, DocumentUpdate):
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                error="Missing or invalid document data for update operation"
            )
        
        # Resolve document ID (might be a client ID from a previous create)
        document_id = operation.document_id
        if not document_id:
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                error="Missing document_id for update operation"
            )
        
        # Check if this is a reference to a document created in this batch
        if document_id in id_mapping:
            document_id = id_mapping[document_id]
        
        # Update document
        document = await self.document_service.update_document(
            document_id,
            operation.data,
            user_id
        )
        
        return BatchOperationResult(
            client_id=operation.client_id,
            status=BatchOperationStatus.SUCCESS,
            document_id=str(document.id),
            version=document.version
        )
    
    async def _handle_delete(
        self,
        operation: BatchDocumentOperation,
        user_id: str,
        id_mapping: dict
    ) -> BatchOperationResult:
        """Handle DELETE operation"""
        # Resolve document ID
        document_id = operation.document_id
        if not document_id:
            return BatchOperationResult(
                client_id=operation.client_id,
                status=BatchOperationStatus.ERROR,
                error="Missing document_id for delete operation"
            )
        
        # Check if this is a reference to a document created in this batch
        if document_id in id_mapping:
            document_id = id_mapping[document_id]
        
        # Delete document (soft delete)
        await self.document_service.delete_document(document_id, user_id)
        
        return BatchOperationResult(
            client_id=operation.client_id,
            status=BatchOperationStatus.SUCCESS,
            document_id=document_id
        )
    
    def _sort_operations(
        self,
        operations: List[BatchDocumentOperation]
    ) -> List[BatchDocumentOperation]:
        """
        Sort operations by type: create → update → delete
        
        This ensures:
        - Documents are created before they're updated
        - Documents are updated before they're deleted
        - Dependencies are handled correctly
        """
        create_ops = [op for op in operations if op.operation == BatchOperationType.CREATE]
        update_ops = [op for op in operations if op.operation == BatchOperationType.UPDATE]
        delete_ops = [op for op in operations if op.operation == BatchOperationType.DELETE]
        
        return create_ops + update_ops + delete_ops


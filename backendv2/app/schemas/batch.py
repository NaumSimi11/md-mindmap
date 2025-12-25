"""
Batch Operations Schemas
=========================

Pydantic schemas for batch document operations.
Enables efficient bulk sync for offline-first workflows.

Pattern: Input Validation (PATTERNS_ADOPTION.md)
- Strict validation at API boundary
- Type safety with Pydantic v2
- Clear error messages
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

from app.schemas.document import DocumentCreate, DocumentUpdate


# =========================================
# Enums
# =========================================

class BatchOperationType(str, Enum):
    """Batch operation type"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class BatchOperationStatus(str, Enum):
    """Batch operation result status"""
    SUCCESS = "success"
    CONFLICT = "conflict"
    ERROR = "error"
    SKIPPED = "skipped"


# =========================================
# Request Schemas (Input)
# =========================================

class BatchDocumentOperation(BaseModel):
    """
    Single operation in a batch request
    
    Supports:
    - create: Create new document
    - update: Update existing document
    - delete: Soft-delete document
    """
    operation: BatchOperationType = Field(
        ...,
        description="Operation type: create, update, or delete"
    )
    
    client_id: str = Field(
        ...,
        description="Client-side operation ID (for tracking/deduplication)"
    )
    
    document_id: Optional[str] = Field(
        None,
        description="Document ID (required for update/delete, optional for create)"
    )
    
    data: Optional[DocumentCreate | DocumentUpdate] = Field(
        None,
        description="Document data (required for create/update, null for delete)"
    )
    
    expected_version: Optional[int] = Field(
        None,
        description="Expected document version (for optimistic locking)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "operation": "create",
                    "client_id": "op_1234",
                    "data": {
                        "id": "doc_abc123",
                        "title": "New Document",
                        "content": "# Hello",
                        "yjs_state_b64": "AQOojaKCBAAH..."
                    }
                },
                {
                    "operation": "update",
                    "client_id": "op_5678",
                    "document_id": "doc_abc123",
                    "data": {
                        "title": "Updated Title",
                        "content": "# Updated"
                    },
                    "expected_version": 2
                },
                {
                    "operation": "delete",
                    "client_id": "op_9012",
                    "document_id": "doc_xyz789"
                }
            ]
        }
    }


class BatchDocumentRequest(BaseModel):
    """
    Batch document operations request
    
    Allows multiple create/update/delete operations in one request.
    Operations are processed in order (create → update → delete).
    """
    workspace_id: str = Field(
        ...,
        description="Workspace ID (all operations must be in same workspace)"
    )
    
    operations: List[BatchDocumentOperation] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of operations (1-100 operations per batch)"
    )
    
    atomic: bool = Field(
        default=False,
        description="If true, all operations succeed or all fail (transaction)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
                "operations": [
                    {
                        "operation": "create",
                        "client_id": "op_1",
                        "data": {
                            "title": "Doc 1",
                            "content": "Content 1"
                        }
                    },
                    {
                        "operation": "create",
                        "client_id": "op_2",
                        "data": {
                            "title": "Doc 2",
                            "content": "Content 2"
                        }
                    }
                ],
                "atomic": False
            }
        }
    }


# =========================================
# Response Schemas (Output)
# =========================================

class BatchOperationResult(BaseModel):
    """
    Result of a single operation in a batch
    """
    client_id: str = Field(
        ...,
        description="Client-side operation ID (matches request)"
    )
    
    status: BatchOperationStatus = Field(
        ...,
        description="Operation result: success, conflict, error, or skipped"
    )
    
    document_id: Optional[str] = Field(
        None,
        description="Document ID (for successful create/update operations)"
    )
    
    version: Optional[int] = Field(
        None,
        description="New document version (for successful operations)"
    )
    
    error: Optional[str] = Field(
        None,
        description="Error message (if status is error or conflict)"
    )
    
    conflict_data: Optional[dict] = Field(
        None,
        description="Conflict details (if status is conflict)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "client_id": "op_1",
                    "status": "success",
                    "document_id": "doc_abc123",
                    "version": 1
                },
                {
                    "client_id": "op_2",
                    "status": "conflict",
                    "document_id": "doc_xyz789",
                    "error": "Version mismatch: expected 2, got 3",
                    "conflict_data": {
                        "expected_version": 2,
                        "current_version": 3,
                        "last_modified_by": "user_456",
                        "last_modified_at": "2025-12-24T10:00:00Z"
                    }
                },
                {
                    "client_id": "op_3",
                    "status": "error",
                    "error": "Document not found"
                }
            ]
        }
    }


class BatchDocumentResponse(BaseModel):
    """
    Batch document operations response
    
    Returns results for all operations, including successes and failures.
    """
    total: int = Field(
        ...,
        description="Total number of operations"
    )
    
    successful: int = Field(
        ...,
        description="Number of successful operations"
    )
    
    failed: int = Field(
        ...,
        description="Number of failed operations (errors + conflicts)"
    )
    
    results: List[BatchOperationResult] = Field(
        ...,
        description="Results for each operation (in same order as request)"
    )
    
    processing_time_ms: int = Field(
        ...,
        description="Total processing time in milliseconds"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 3,
                "successful": 2,
                "failed": 1,
                "results": [
                    {
                        "client_id": "op_1",
                        "status": "success",
                        "document_id": "doc_abc123",
                        "version": 1
                    },
                    {
                        "client_id": "op_2",
                        "status": "success",
                        "document_id": "doc_def456",
                        "version": 1
                    },
                    {
                        "client_id": "op_3",
                        "status": "error",
                        "error": "Document not found"
                    }
                ],
                "processing_time_ms": 245
            }
        }
    }


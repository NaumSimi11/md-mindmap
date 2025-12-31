"""
Document Snapshot Schemas
=========================

Pydantic schemas for version history/snapshots

CRITICAL: Snapshots are WRITE-ONLY artifacts.
Server never applies/merges CRDT ops from snapshots.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID


# ============================================================================
# Enums
# ============================================================================

class SnapshotType(str):
    """Snapshot type enum values"""
    AUTO = "auto"
    MANUAL = "manual"
    RESTORE_BACKUP = "restore-backup"


class RestoreAction(str):
    """Restore action enum values"""
    NEW_DOCUMENT = "new_document"  # Default: restore as new document
    OVERWRITE = "overwrite"  # Owner-only: overwrite current document


# ============================================================================
# Request Schemas
# ============================================================================

class CreateSnapshotRequest(BaseModel):
    """Request to create manual snapshot"""
    note: Optional[str] = Field(None, max_length=500, description="Optional note for this snapshot")
    yjs_state_base64: str = Field(..., description="Base64-encoded Yjs state (WRITE-ONLY)")
    html_preview: Optional[str] = Field(None, description="Optional HTML preview for UI")


# Alias for router compatibility
class CreateManualSnapshotRequest(BaseModel):
    """Request to create manual snapshot"""
    yjs_state_base64: str = Field(..., description="Base64-encoded Yjs state (WRITE-ONLY)")
    note: Optional[str] = Field(None, max_length=500, description="Optional note for this snapshot")
    html_preview: Optional[str] = Field(None, description="Optional HTML preview for UI")
    type: str = Field("manual", description="Snapshot type (manual, auto, restore-backup)")
    
    @validator('type')
    def validate_type(cls, v):
        valid_types = ['manual', 'auto', 'restore-backup']
        if v not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v


class RestoreSnapshotRequest(BaseModel):
    """Request to restore snapshot"""
    action: str = Field("new_document", description="Restore action (new_document or overwrite)")
    title: Optional[str] = Field(None, description="Title for new document (required for new_document action)")
    backup_snapshot_id: Optional[UUID] = Field(None, description="Required for overwrite: ID of backup snapshot created before restore")
    force: bool = Field(False, description="Force overwrite (Owner-only, requires explicit confirmation)")
    
    @validator('action')
    def validate_action(cls, v):
        valid_actions = ['new_document', 'overwrite']
        if v not in valid_actions:
            raise ValueError(f"Action must be one of: {', '.join(valid_actions)}")
        return v
    
    @validator('backup_snapshot_id', always=True)
    def validate_backup(cls, v, values):
        if values.get('action') == 'overwrite' and not v:
            raise ValueError("backup_snapshot_id is required for overwrite action")
        return v


# ============================================================================
# Response Schemas
# ============================================================================

class SnapshotMetadataResponse(BaseModel):
    """Response for snapshot metadata (list view)"""
    id: UUID
    document_id: UUID
    type: str
    created_at: datetime
    created_by: Optional[UUID]
    note: Optional[str]
    size_bytes: Optional[int]
    html_preview: Optional[str] = None  # Include HTML preview for UI
    
    # Computed/joined fields
    creator_name: Optional[str] = None
    creator_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class SnapshotDetailResponse(SnapshotMetadataResponse):
    """Response for snapshot detail (includes preview)"""
    html_preview: Optional[str] = None
    
    class Config:
        from_attributes = True


class SnapshotListResponse(BaseModel):
    """Response for listing snapshots"""
    snapshots: list[SnapshotMetadataResponse]
    total: int
    limit: int
    offset: int


class CreateSnapshotResponse(BaseModel):
    """Response for created snapshot"""
    success: bool
    snapshot_id: UUID
    message: str = "Snapshot created successfully"


# Alias for router compatibility
class CreateManualSnapshotResponse(BaseModel):
    """Response for created manual snapshot"""
    success: bool
    snapshot_id: UUID
    created_at: datetime
    size_bytes: int


class RestoreSnapshotResponse(BaseModel):
    """Response for snapshot restore"""
    success: bool
    action: str
    new_document_id: Optional[UUID] = None  # Set for new_document action
    backup_snapshot_id: Optional[UUID] = None  # Set for overwrite action
    message: str
    warning: Optional[str] = None  # e.g., "Provider may be active, restore-as-new recommended"


class RestoreConflictResponse(BaseModel):
    """Response when restore is blocked (409 Conflict)"""
    success: bool = False
    error: str = "Cannot overwrite: provider is active"
    reason: str = "provider_active"
    suggested_action: str = "restore_as_new"
    active_connections: int = 0


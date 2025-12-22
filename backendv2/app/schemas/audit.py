"""
Audit Log Schemas
=================

Pydantic schemas for audit logs
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


# ============================================================================
# Response Schemas
# ============================================================================

class AuditLogResponse(BaseModel):
    """Response for audit log entry"""
    id: UUID
    actor_id: Optional[UUID]
    document_id: Optional[UUID]
    action: str
    metadata: Optional[dict[str, Any]]
    created_at: datetime
    
    # Computed/joined fields
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Response for listing audit logs"""
    logs: list[AuditLogResponse]
    total: int
    limit: int
    offset: int


# ============================================================================
# Common Audit Actions (for reference)
# ============================================================================

class AuditAction:
    """Common audit action constants"""
    # Invitations
    INVITE_SENT = "invite_sent"
    INVITE_ACCEPTED = "invite_accepted"
    INVITE_DECLINED = "invite_declined"
    INVITE_CANCELLED = "invite_cancelled"
    
    # Members
    ROLE_CHANGED = "role_changed"
    MEMBER_REMOVED = "member_removed"
    OWNERSHIP_TRANSFERRED = "ownership_transferred"
    
    # Share Links
    LINK_CREATED = "link_created"
    LINK_REVOKED = "link_revoked"
    LINK_USED = "link_used"
    
    # Snapshots
    SNAPSHOT_CREATED = "snapshot_created"
    SNAPSHOT_RESTORED_NEW = "snapshot_restored_new_document"
    SNAPSHOT_RESTORED_OVERWRITE = "snapshot_restored_overwrite"
    SNAPSHOT_BACKUP_CREATED = "snapshot_backup_created"
    
    # Document
    DOCUMENT_CREATED = "document_created"
    DOCUMENT_DELETED = "document_deleted"


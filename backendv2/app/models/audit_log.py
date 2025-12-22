"""
Audit Log Model
===============

Pattern: Three-Layer Architecture (Model layer)
Purpose: Audit trail for sharing and snapshot actions
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey,
    Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class AuditLog(Base):
    """
    AuditLog: Audit trail for sharing/snapshot/permission actions
    
    Fields:
    - id: UUID primary key
    - actor_id: User who performed action (null for system)
    - document_id: Document affected (null for workspace-level actions)
    - action: Action type (e.g., 'invite_sent', 'role_changed', 'snapshot_restored')
    - metadata: Free-form JSONB metadata (email, role, snapshot_id, etc.)
    - created_at: When action occurred
    
    Relationships:
    - actor: User who performed action
    - document: Document affected
    
    Common Actions:
    - invite_sent: User sent invitation
    - invite_accepted: User accepted invitation
    - invite_declined: User declined invitation
    - role_changed: User role was changed
    - member_removed: User was removed from document
    - ownership_transferred: Document ownership transferred
    - link_created: Share link created
    - link_revoked: Share link revoked
    - snapshot_created: Snapshot created
    - snapshot_restored: Snapshot restored (new doc or overwrite)
    """
    
    __tablename__ = "audit_logs"
    
    # =========================================
    # Primary Key
    # =========================================
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )
    
    # =========================================
    # Foreign Keys
    # =========================================
    actor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="User who performed action (null for system)"
    )
    
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Document affected (null for workspace-level actions)"
    )
    
    # =========================================
    # Log Fields
    # =========================================
    action = Column(
        String(50),
        nullable=False,
        index=True,
        doc="Action type (e.g., 'invite_sent', 'role_changed')"
    )
    
    log_metadata = Column(
        JSONB,
        nullable=True,
        name="metadata",  # Column name in DB remains 'metadata'
        doc="Free-form metadata (email, role, snapshot_id, old_role, new_role, etc.)"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    
    # =========================================
    # Relationships
    # =========================================
    actor = relationship("User", foreign_keys=[actor_id])
    document = relationship("Document", back_populates="audit_logs")
    
    # =========================================
    # Indexes
    # =========================================
    __table_args__ = (
        Index('ix_audit_logs_document_created', 'document_id', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(action={self.action}, actor_id={self.actor_id}, document_id={self.document_id})>"


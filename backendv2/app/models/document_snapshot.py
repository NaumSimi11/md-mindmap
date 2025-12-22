"""
Document Snapshot Model
=======================

Pattern: Three-Layer Architecture (Model layer)
Purpose: Version history snapshots (CRDT-safe, WRITE-ONLY)

CRITICAL CONSTRAINTS:
- Snapshots are WRITE-ONLY artifacts
- Server NEVER applies/merges CRDT ops from snapshots
- yjs_state is stored as opaque binary blob
- Restore overwrite is Owner-only and must be guarded
- Default restore action is "restore-as-new"
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, BigInteger, DateTime, ForeignKey, Text,
    Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class DocumentSnapshot(Base):
    """
    DocumentSnapshot: Version history snapshot (CRDT-safe)
    
    Fields:
    - id: UUID primary key
    - document_id: Document this snapshot belongs to
    - created_by: User who created snapshot (null for system/auto)
    - created_at: When snapshot was created
    - type: 'auto', 'manual', 'restore-backup'
    - yjs_state: WRITE-ONLY CRDT binary (opaque blob, NEVER modified by server)
    - html_preview: Optional HTML preview for UI display
    - note: Optional user note for manual snapshots
    - size_bytes: Snapshot size for monitoring
    
    Relationships:
    - document: Parent document
    - creator: User who created snapshot (null for system)
    
    IMPORTANT:
    - yjs_state is BYTEA (binary) and treated as opaque blob
    - Server never parses or modifies this field
    - Restore operations create NEW documents or require explicit overwrite flow
    """
    
    __tablename__ = "document_snapshots"
    
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
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who created snapshot (null for system/auto)"
    )
    
    # =========================================
    # Snapshot Fields
    # =========================================
    type = Column(
        String(20),
        nullable=False,
        index=True,
        doc="Type: 'auto', 'manual', 'restore-backup'"
    )
    
    yjs_state = Column(
        BYTEA,
        nullable=False,
        doc="WRITE-ONLY CRDT binary (opaque blob, NEVER modified by server)"
    )
    
    html_preview = Column(
        Text,
        nullable=True,
        doc="Optional HTML preview for UI display"
    )
    
    note = Column(
        Text,
        nullable=True,
        doc="Optional user note for manual snapshots"
    )
    
    size_bytes = Column(
        BigInteger,
        nullable=True,
        doc="Snapshot size in bytes for monitoring"
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
    document = relationship("Document", back_populates="snapshots")
    creator = relationship("User", foreign_keys=[created_by])
    
    # =========================================
    # Constraints
    # =========================================
    __table_args__ = (
        CheckConstraint("type IN ('auto', 'manual', 'restore-backup')", name='ck_document_snapshots_type'),
        Index('ix_document_snapshots_document_created', 'document_id', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<DocumentSnapshot(id={self.id}, document_id={self.document_id}, type={self.type})>"


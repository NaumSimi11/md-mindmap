"""
Share Link Model
================

Pattern: Three-Layer Architecture (Model layer)
Purpose: Shareable links with tokens for document access
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey,
    Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class ShareLink(Base):
    """
    ShareLink: Shareable link with token for document access
    
    Fields:
    - id: UUID primary key
    - document_id: Document being shared
    - token: Cryptographically random token (URL-safe)
    - mode: 'view', 'comment', 'edit'
    - password_hash: Optional bcrypt hash for password protection
    - max_uses: Maximum number of uses (null = unlimited)
    - uses_count: Current usage count
    - created_by: User who created link
    - created_at: When link was created
    - expires_at: Optional expiration
    - revoked_at: When link was revoked (null = active)
    
    Relationships:
    - document: Document being shared
    - creator: User who created link
    """
    
    __tablename__ = "share_links"
    
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
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # =========================================
    # Link Fields
    # =========================================
    token = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
        doc="Cryptographically random token (URL-safe)"
    )
    
    mode = Column(
        String(20),
        nullable=False,
        default='view',
        doc="Access mode: 'view', 'comment', 'edit'"
    )
    
    password_hash = Column(
        String(255),
        nullable=True,
        doc="Optional bcrypt hash for password protection"
    )
    
    max_uses = Column(
        Integer,
        nullable=True,
        doc="Maximum number of uses (null = unlimited)"
    )
    
    uses_count = Column(
        Integer,
        nullable=False,
        default=0,
        doc="Current usage count"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    expires_at = Column(
        DateTime,
        nullable=True,
        index=True,
        doc="Optional expiration timestamp"
    )
    
    revoked_at = Column(
        DateTime,
        nullable=True,
        doc="When link was revoked (null = active)"
    )
    
    # =========================================
    # Relationships
    # =========================================
    document = relationship("Document", back_populates="share_links")
    creator = relationship("User", foreign_keys=[created_by])
    
    # =========================================
    # Constraints
    # =========================================
    __table_args__ = (
        CheckConstraint("mode IN ('view', 'comment', 'edit')", name='ck_share_links_mode'),
        CheckConstraint("uses_count >= 0", name='ck_share_links_uses_count'),
    )
    
    def __repr__(self) -> str:
        return f"<ShareLink(token={self.token[:8]}..., document_id={self.document_id}, mode={self.mode})>"


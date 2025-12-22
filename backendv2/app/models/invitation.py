"""
Invitation Model
================

Pattern: Three-Layer Architecture (Model layer)
Purpose: Pending email invitations for document sharing
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Text,
    Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class Invitation(Base):
    """
    Invitation: Pending email invite for document access
    
    Fields:
    - id: UUID primary key
    - document_id: Document being shared
    - email: Invitee email address
    - invited_by: User who sent invitation
    - role: Role to grant upon acceptance
    - token: Secure random token for accept link
    - status: 'pending', 'accepted', 'declined', 'cancelled'
    - message: Optional invite message
    - created_at: When invitation was created
    - expires_at: Optional expiration
    - accepted_at: When invitation was accepted
    
    Relationships:
    - document: Document being shared
    - inviter: User who sent invitation
    """
    
    __tablename__ = "invitations"
    
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
    
    invited_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # =========================================
    # Invitation Fields
    # =========================================
    email = Column(
        String(255),
        nullable=False,
        index=True,
        doc="Invitee email address"
    )
    
    role = Column(
        String(20),
        nullable=False,
        doc="Role to grant: 'admin', 'editor', 'commenter', 'viewer'"
    )
    
    token = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
        doc="Secure random token for accept link"
    )
    
    status = Column(
        String(20),
        nullable=False,
        default='pending',
        index=True,
        doc="Status: 'pending', 'accepted', 'declined', 'cancelled'"
    )
    
    message = Column(
        Text,
        nullable=True,
        doc="Optional invite message from sender"
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
        doc="Optional expiration timestamp"
    )
    
    accepted_at = Column(
        DateTime,
        nullable=True,
        doc="When invitation was accepted"
    )
    
    # =========================================
    # Relationships
    # =========================================
    document = relationship("Document", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])
    
    # =========================================
    # Constraints
    # =========================================
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'editor', 'commenter', 'viewer')", name='ck_invitations_role'),
        CheckConstraint("status IN ('pending', 'accepted', 'declined', 'cancelled')", name='ck_invitations_status'),
    )
    
    def __repr__(self) -> str:
        return f"<Invitation(email={self.email}, document_id={self.document_id}, status={self.status})>"


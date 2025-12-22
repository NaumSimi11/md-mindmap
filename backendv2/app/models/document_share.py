"""
Document Share Model
====================

Pattern: Three-Layer Architecture (Model layer)
Purpose: Permission/role management for documents

Roles (hierarchical):
- owner: Full control including transfer ownership
- admin: Manage members, create links, all editor permissions
- editor: Edit content, create manual snapshots
- commenter: Comment and view
- viewer: Read-only

Principal Types:
- user: Individual user access
- workspace: Workspace-wide access (future feature)
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey,
    Index, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class DocumentShare(Base):
    """
    DocumentShare: Permission/role assignment for documents
    
    Fields:
    - id: UUID primary key
    - document_id: Document being shared
    - principal_type: 'user' or 'workspace'
    - principal_id: User ID or Workspace ID
    - role: 'owner', 'admin', 'editor', 'commenter', 'viewer'
    - granted_by: User who granted this permission
    - granted_at: When permission was granted
    - expires_at: Optional expiration timestamp
    - status: 'active', 'revoked', 'pending'
    
    Relationships:
    - document: Parent document
    - granted_by_user: User who granted permission
    
    Constraints:
    - Unique (document_id, principal_type, principal_id)
    - role must be one of: owner, admin, editor, commenter, viewer
    - principal_type must be: user or workspace
    - status must be: active, revoked, pending
    """
    
    __tablename__ = "document_shares"
    
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
        index=True,
        doc="Document being shared"
    )
    
    principal_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="User ID or Workspace ID"
    )
    
    granted_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who granted this permission"
    )
    
    # =========================================
    # Permission Fields
    # =========================================
    principal_type = Column(
        String(20),
        nullable=False,
        doc="Principal type: 'user' or 'workspace'"
    )
    
    role = Column(
        String(20),
        nullable=False,
        index=True,
        doc="Role: 'owner', 'admin', 'editor', 'commenter', 'viewer'"
    )
    
    status = Column(
        String(20),
        nullable=False,
        default='active',
        doc="Status: 'active', 'revoked', 'pending'"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    granted_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        doc="When permission was granted"
    )
    
    expires_at = Column(
        DateTime,
        nullable=True,
        doc="Optional expiration timestamp"
    )
    
    # =========================================
    # Relationships
    # =========================================
    document = relationship("Document", back_populates="shares")
    granted_by_user = relationship("User", foreign_keys=[granted_by])
    
    # =========================================
    # Constraints
    # =========================================
    __table_args__ = (
        UniqueConstraint('document_id', 'principal_type', 'principal_id', name='uq_document_shares_principal'),
        CheckConstraint("principal_type IN ('user', 'workspace')", name='ck_document_shares_principal_type'),
        CheckConstraint("role IN ('owner', 'admin', 'editor', 'commenter', 'viewer')", name='ck_document_shares_role'),
        CheckConstraint("status IN ('active', 'revoked', 'pending')", name='ck_document_shares_status'),
    )
    
    def __repr__(self) -> str:
        return f"<DocumentShare(document_id={self.document_id}, principal_id={self.principal_id}, role={self.role})>"


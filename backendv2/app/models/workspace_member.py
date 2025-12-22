"""
WorkspaceMember Model
=====================

Pattern: Three-Layer Architecture (Model layer only)
Security: Workspace-level permissions with role hierarchy
Features: Membership management, role-based access control

Architecture:
- Workspace roles cascade to documents (via access_model=inherited)
- Permission resolution: effective_role = max(workspace_role, doc_role)
- "Shared with me" = doc shares without workspace membership
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.database import Base


class WorkspaceRole(str, enum.Enum):
    """
    Workspace role hierarchy (owner > admin > editor > viewer)
    
    Owner:  billing, delete workspace, all membership, all settings
    Admin:  manage members, create/delete docs (no workspace deletion)
    Editor: create docs, edit all inherited docs
    Viewer: read-only inherited docs
    
    Note: No "Commenter" at workspace level (that's document-specific)
    """
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"
    
    def __lt__(self, other):
        """Enable role comparison for permission resolution."""
        if not isinstance(other, WorkspaceRole):
            return NotImplemented
        order = [self.VIEWER, self.EDITOR, self.ADMIN, self.OWNER]
        return order.index(self) < order.index(other)
    
    def __le__(self, other):
        return self == other or self < other
    
    def __gt__(self, other):
        if not isinstance(other, WorkspaceRole):
            return NotImplemented
        return not self <= other
    
    def __ge__(self, other):
        return self == other or self > other


class WorkspaceMember(Base):
    """
    WorkspaceMember: User membership in a workspace with role-based permissions
    
    Fields:
    - id: UUID primary key
    - workspace_id: Workspace this membership belongs to
    - user_id: User who is a member
    - role: Workspace role (owner/admin/editor/viewer)
    - granted_by: User who granted this membership
    - granted_at: When membership was granted
    - expires_at: Optional expiry (null = permanent)
    - status: 'active' or 'revoked'
    - created_at, updated_at: Timestamps
    
    Relationships:
    - workspace: Parent workspace
    - user: Member user
    - granted_by_user: User who granted this membership
    
    Invariants:
    - Unique (workspace_id, user_id)
    - At least one owner per workspace (enforced in service layer)
    - Owner role cannot be revoked (unless transferring ownership)
    """
    
    __tablename__ = "workspace_members"
    
    # =========================================
    # Primary Key
    # =========================================
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        index=True
    )
    
    # =========================================
    # Membership Fields
    # =========================================
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Workspace this membership belongs to"
    )
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="User who is a member"
    )
    
    role = Column(
        SQLEnum(WorkspaceRole, name='workspace_role', create_type=False),
        default=WorkspaceRole.VIEWER,
        nullable=False,
        index=True,
        doc="Workspace role: owner/admin/editor/viewer"
    )
    
    # =========================================
    # Audit Fields
    # =========================================
    granted_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who granted this membership"
    )
    
    granted_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        doc="When membership was granted"
    )
    
    expires_at = Column(
        DateTime,
        nullable=True,
        doc="Optional expiry (null = permanent)"
    )
    
    status = Column(
        String(20),
        default="active",
        nullable=False,
        index=True,
        doc="Membership status: 'active' or 'revoked'"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # =========================================
    # Relationships
    # =========================================
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], back_populates="workspace_memberships")
    granted_by_user = relationship("User", foreign_keys=[granted_by])
    
    # =========================================
    # Indexes
    # =========================================
    __table_args__ = (
        Index('ix_workspace_members_workspace_user', 'workspace_id', 'user_id', unique=True),
        Index('ix_workspace_members_active', 'status', postgresql_where=(status == 'active')),
    )
    
    def __repr__(self) -> str:
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role={self.role})>"


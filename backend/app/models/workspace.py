"""
Workspace Model
Represents workspaces for organizing documents and team collaboration
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Text, Boolean, Enum as SQLEnum, ForeignKey, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.models.base import BaseModel, SoftDeleteMixin


class WorkspaceRole(str, enum.Enum):
    """Roles for workspace members"""
    OWNER = "owner"        # Full control, can delete workspace
    ADMIN = "admin"        # Can manage members and settings
    EDITOR = "editor"      # Can create/edit/delete documents
    VIEWER = "viewer"      # Read-only access


class Workspace(BaseModel, SoftDeleteMixin):
    """
    Workspace model for organizing documents and collaboration
    
    Fields:
        id: Unique identifier (UUID)
        name: Workspace name
        slug: URL-friendly identifier
        description: Optional workspace description
        owner_id: User who created the workspace
        
        # Settings
        is_public: Whether workspace is publicly visible
        is_archived: Whether workspace is archived
        
        # Metadata
        settings: JSON settings (future use)
        
        # Relationships
        owner: User who owns the workspace
        members: List of workspace members
        
        # Timestamps (from BaseModel)
        created_at: When workspace was created
        updated_at: When workspace was last updated
        
        # Soft delete (from SoftDeleteMixin)
        is_deleted: Whether workspace is soft-deleted
        deleted_at: When workspace was deleted
    """
    
    __tablename__ = "workspaces"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Basic info
    name = Column(
        String(100),
        nullable=False,
        index=True
    )
    slug = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=True)
    
    # Owner
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Settings
    is_public = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    
    # Relationships
    owner = relationship("User", back_populates="owned_workspaces", foreign_keys=[owner_id])
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_workspaces_owner_deleted', 'owner_id', 'is_deleted'),
        Index('ix_workspaces_slug_deleted', 'slug', 'is_deleted'),
    )
    
    def archive(self) -> None:
        """Archive this workspace"""
        self.is_archived = True
    
    def unarchive(self) -> None:
        """Unarchive this workspace"""
        self.is_archived = False
    
    def make_public(self) -> None:
        """Make workspace publicly visible"""
        self.is_public = True
    
    def make_private(self) -> None:
        """Make workspace private"""
        self.is_public = False
    
    def get_member(self, user_id: uuid.UUID) -> Optional['WorkspaceMember']:
        """Get a specific member by user ID"""
        return next((m for m in self.members if m.user_id == user_id and not m.is_deleted), None)
    
    def is_member(self, user_id: uuid.UUID) -> bool:
        """Check if a user is a member of this workspace"""
        return self.get_member(user_id) is not None
    
    def get_member_role(self, user_id: uuid.UUID) -> Optional[WorkspaceRole]:
        """Get the role of a specific member"""
        member = self.get_member(user_id)
        return member.role if member else None
    
    def can_user_edit(self, user_id: uuid.UUID) -> bool:
        """Check if user has edit permissions"""
        if user_id == self.owner_id:
            return True
        role = self.get_member_role(user_id)
        return role in [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR]
    
    def can_user_admin(self, user_id: uuid.UUID) -> bool:
        """Check if user has admin permissions"""
        if user_id == self.owner_id:
            return True
        role = self.get_member_role(user_id)
        return role in [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]
    
    def __repr__(self) -> str:
        return f"<Workspace(id={self.id}, name={self.name}, owner_id={self.owner_id})>"


class WorkspaceMember(BaseModel, SoftDeleteMixin):
    """
    Workspace membership and roles
    
    Represents the many-to-many relationship between users and workspaces
    with role-based permissions
    """
    
    __tablename__ = "workspace_members"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Foreign keys
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Role
    role = Column(
        SQLEnum(WorkspaceRole, name="workspace_role"),
        nullable=False,
        default=WorkspaceRole.VIEWER
    )
    
    # Invitation metadata
    invited_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    invited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    joined_at = Column(DateTime, nullable=True)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], back_populates="workspace_memberships")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_workspace_members_user_workspace', 'user_id', 'workspace_id', unique=True),
        Index('ix_workspace_members_workspace_deleted', 'workspace_id', 'is_deleted'),
        Index('ix_workspace_members_user_deleted', 'user_id', 'is_deleted'),
    )
    
    def accept_invitation(self) -> None:
        """Mark invitation as accepted"""
        self.joined_at = datetime.utcnow()
    
    def promote(self) -> None:
        """Promote member to next role level"""
        role_hierarchy = [WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER]
        current_index = role_hierarchy.index(self.role)
        if current_index < len(role_hierarchy) - 1:
            self.role = role_hierarchy[current_index + 1]
    
    def demote(self) -> None:
        """Demote member to previous role level"""
        role_hierarchy = [WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER]
        current_index = role_hierarchy.index(self.role)
        if current_index > 0:
            self.role = role_hierarchy[current_index - 1]
    
    def change_role(self, new_role: WorkspaceRole) -> None:
        """Change member's role"""
        self.role = new_role
    
    def __repr__(self) -> str:
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role={self.role})>"


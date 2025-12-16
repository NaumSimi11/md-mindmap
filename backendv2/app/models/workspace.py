"""
Workspace Model
===============

Pattern: Three-Layer Architecture (Model layer only)
Security: Optimistic locking, soft delete
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, ForeignKey, Index, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class Workspace(Base):
    """
    Workspace: Top-level container for documents and folders
    
    Fields:
    - id: UUID primary key
    - name: Workspace name
    - slug: URL-friendly slug (unique per owner)
    - description: Optional description
    - icon: Optional emoji icon
    - is_public: Public visibility flag
    - owner_id: User who owns this workspace
    - is_deleted: Soft delete flag
    - version: Optimistic locking
    - created_at, updated_at: Timestamps
    
    Relationships:
    - owner: User who owns this workspace
    - documents: Documents in this workspace
    - folders: Folders in this workspace
    """
    
    __tablename__ = "workspaces"
    
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
    # Workspace Fields
    # =========================================
    name = Column(
        String(100),
        nullable=False,
        doc="Workspace name (1-100 chars)"
    )
    
    slug = Column(
        String(100),
        nullable=False,
        index=True,
        doc="URL-friendly slug (unique per owner)"
    )
    
    description = Column(
        Text,
        nullable=True,
        doc="Optional workspace description"
    )
    
    icon = Column(
        String(10),
        nullable=True,
        default="📁",
        doc="Optional emoji icon"
    )
    
    is_public = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Public visibility flag"
    )
    
    # =========================================
    # Owner (Foreign Key to User)
    # =========================================
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="User who owns this workspace"
    )
    
    # =========================================
    # Status Fields
    # =========================================
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Soft delete flag"
    )
    
    # =========================================
    # Optimistic Locking
    # =========================================
    version = Column(
        Integer,
        default=1,
        nullable=False,
        doc="Optimistic lock version"
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
    owner = relationship("User", back_populates="workspaces")
    documents = relationship(
        "Document",
        back_populates="workspace",
        cascade="all, delete-orphan"
    )
    folders = relationship(
        "Folder",
        back_populates="workspace",
        cascade="all, delete-orphan"
    )
    
    # =========================================
    # Indexes
    # =========================================
    __table_args__ = (
        Index('ix_workspaces_owner_slug', 'owner_id', 'slug', unique=True),
        Index('ix_workspaces_owner_active', 'owner_id', 'is_deleted'),
    )
    
    def __repr__(self) -> str:
        return f"<Workspace(id={self.id}, name={self.name}, owner_id={self.owner_id})>"


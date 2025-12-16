"""
Folder Model
============

Pattern: Three-Layer Architecture (Model layer only)
Security: Optimistic locking, soft delete
Features: Hierarchical structure, drag-and-drop support
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class Folder(Base):
    """
    Folder: Hierarchical organization for documents
    
    Fields:
    - id: UUID primary key
    - name: Folder name
    - icon: Optional emoji icon
    - color: Optional hex color
    - workspace_id: Parent workspace
    - parent_id: Optional parent folder (for hierarchy)
    - position: Order position (for drag-and-drop)
    - created_by_id: User who created this
    - is_deleted: Soft delete
    - version: Optimistic locking
    - created_at, updated_at: Timestamps
    
    Relationships:
    - workspace: Parent workspace
    - parent: Optional parent folder
    - children: Child folders
    - documents: Documents in this folder
    - created_by: User who created this
    
    Hierarchy:
    - Root folders: parent_id = NULL
    - Nested folders: parent_id = parent folder's id
    - No circular references (validated in service layer)
    """
    
    __tablename__ = "folders"
    
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
    # Folder Fields
    # =========================================
    name = Column(
        String(100),
        nullable=False,
        doc="Folder name (1-100 chars)"
    )
    
    icon = Column(
        String(10),
        nullable=True,
        default="📁",
        doc="Optional emoji icon"
    )
    
    color = Column(
        String(7),
        nullable=True,
        doc="Optional hex color code (e.g., #3b82f6)"
    )
    
    # =========================================
    # Relationships (Foreign Keys)
    # =========================================
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Parent workspace"
    )
    
    parent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Optional parent folder (for hierarchy)"
    )
    
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="User who created this folder"
    )
    
    # =========================================
    # Ordering (for drag-and-drop)
    # =========================================
    position = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Order position (for drag-and-drop)"
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
        nullable=False,
        index=True
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
    workspace = relationship("Workspace", back_populates="folders")
    parent = relationship(
        "Folder",
        remote_side=[id],
        back_populates="children"
    )
    children = relationship(
        "Folder",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document",
        back_populates="folder"
    )
    created_by = relationship("User", back_populates="folders")
    
    # =========================================
    # Indexes
    # =========================================
    __table_args__ = (
        Index('ix_folders_workspace_parent', 'workspace_id', 'parent_id'),
        Index('ix_folders_parent_position', 'parent_id', 'position'),
    )
    
    def __repr__(self) -> str:
        return f"<Folder(id={self.id}, name={self.name}, workspace_id={self.workspace_id})>"


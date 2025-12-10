"""
Folder Model
Hierarchical folder structure for document organization
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, SoftDeleteMixin, TimestampMixin


class Folder(BaseModel, TimestampMixin, SoftDeleteMixin):
    """Folder for organizing documents"""
    
    __tablename__ = "folders"

    id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("uuid_generate_v4()"),
    )
    workspace_id = Column(
        PG_UUID(as_uuid=True), ForeignKey("workspaces.id"), index=True, nullable=False
    )
    created_by_id = Column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    parent_id = Column(
        PG_UUID(as_uuid=True), ForeignKey("folders.id"), index=True, nullable=True
    )

    name = Column(String, index=True, nullable=False)
    icon = Column(String, default="📁", nullable=False)
    color = Column(String, nullable=True)  # Hex color for UI
    position = Column(Integer, default=0, nullable=False)  # For custom ordering
    is_expanded = Column(Boolean, default=True, nullable=False)  # UI state

    # Relationships
    workspace = relationship("Workspace", back_populates="folders")
    created_by = relationship("User", back_populates="folders_created")
    parent = relationship("Folder", remote_side=[id], back_populates="children")
    children = relationship(
        "Folder", back_populates="parent", cascade="all, delete-orphan"
    )
    documents = relationship("Document", back_populates="folder")

    __table_args__ = (
        # Index for efficient retrieval of folders within a workspace
        Index('ix_folders_workspace_deleted', 'workspace_id', 'is_deleted'),
        # Index for efficient retrieval of child folders
        Index('ix_folders_parent', 'parent_id', 'position'),
    )


"""
Document Models
Represents markdown documents with versioning, tags, and collaboration
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index, DateTime, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.models.base import BaseModel, SoftDeleteMixin


class Document(BaseModel, SoftDeleteMixin):
    """
    Document model for markdown files
    
    Fields:
        id: Unique identifier (UUID)
        title: Document title
        slug: URL-friendly identifier
        content: Current markdown content
        workspace_id: Parent workspace
        created_by_id: User who created the document
        
        # Metadata
        version: Current version number
        is_public: Public visibility
        is_template: Is this a template document
        tags: Array of tags for categorization
        metadata: JSON field for custom metadata
        
        # Stats
        view_count: Number of views
        word_count: Approximate word count
        
        # Relationships
        workspace: Parent workspace
        created_by: User who created
        versions: Version history
        
        # Timestamps (from BaseModel)
        created_at, updated_at
        
        # Soft delete (from SoftDeleteMixin)
        is_deleted, deleted_at
    """
    
    __tablename__ = "documents"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Basic info
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    
    # Foreign keys
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    folder_id = Column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Metadata
    version = Column(Integer, default=1, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    is_template = Column(Boolean, default=False, nullable=False, index=True)
    is_starred = Column(Boolean, default=False, nullable=False, index=True)
    tags = Column(ARRAY(String), default=[], nullable=False)
    doc_metadata = Column(JSONB, default={}, nullable=False)
    
    # Stats
    view_count = Column(Integer, default=0, nullable=False)
    word_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="documents")
    created_by = relationship("User", back_populates="documents_created", foreign_keys=[created_by_id])
    folder = relationship("Folder", back_populates="documents", foreign_keys=[folder_id])
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    files = relationship("File", back_populates="document", cascade="all, delete-orphan")
    presences = relationship("DocumentPresence", back_populates="document", cascade="all, delete-orphan")
    active_sessions = relationship("UserSession", back_populates="current_document")
    
    # Indexes
    __table_args__ = (
        Index('ix_documents_workspace_deleted', 'workspace_id', 'is_deleted'),
        Index('ix_documents_workspace_created', 'workspace_id', 'created_at'),
        Index('ix_documents_title_search', 'title'),
        Index('ix_documents_tags', 'tags', postgresql_using='gin'),
    )
    
    def increment_views(self) -> None:
        """Increment view count"""
        self.view_count += 1
    
    def update_word_count(self) -> None:
        """Update word count from content"""
        if self.content:
            self.word_count = len(self.content.split())
        else:
            self.word_count = 0
    
    def add_tag(self, tag: str) -> None:
        """Add a tag if not already present"""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """Remove a tag if present"""
        if tag in self.tags:
            self.tags.remove(tag)
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title}, workspace_id={self.workspace_id})>"


class DocumentVersion(BaseModel):
    """
    Document version history
    
    Stores every save of a document for version control and recovery
    """
    
    __tablename__ = "document_versions"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Foreign keys
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Version data
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=False)
    
    # Change tracking
    change_summary = Column(String(500), nullable=True)
    word_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    version_metadata = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="versions")
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    # Indexes
    __table_args__ = (
        Index('ix_document_versions_document_version', 'document_id', 'version_number', unique=True),
        Index('ix_document_versions_created', 'document_id', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<DocumentVersion(document_id={self.document_id}, version={self.version_number})>"


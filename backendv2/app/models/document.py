"""
Document Model
==============

Pattern: Three-Layer Architecture (Model layer only)
Security: Optimistic locking, soft delete
Features: Yjs collaboration support, storage modes, starred docs
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, ForeignKey,
    Index, Text, Enum as SQLEnum, LargeBinary
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
import enum

from app.database import Base


class StorageMode(str, enum.Enum):
    """
    Document storage mode (Phase 2)
    
    LocalOnly: Stored only in IndexedDB (no cloud sync)
    HybridSync: Stored in IndexedDB + Cloud (bidirectional sync)
    CloudOnly: Stored only in cloud (streamed to IndexedDB)
    """
    LOCAL_ONLY = "LocalOnly"
    HYBRID_SYNC = "HybridSync"
    CLOUD_ONLY = "CloudOnly"


class Document(Base):
    """
    Document: Markdown/Rich text content
    
    Fields:
    - id: UUID primary key
    - title: Document title
    - slug: URL-friendly slug
    - content: Markdown/HTML content (for metadata only, Yjs handles real content)
    - content_type: "markdown" or "html"
    - workspace_id: Parent workspace
    - folder_id: Optional parent folder
    - created_by_id: User who created this
    - tags: Array of tags
    - is_public: Public visibility
    - is_template: Template flag
    - is_starred: Starred by creator
    - storage_mode: LocalOnly | HybridSync | CloudOnly (Phase 2)
    - version: Document version (for optimistic locking)
    - yjs_version: Yjs document version (for collaboration)
    - word_count: Cached word count
    - is_deleted: Soft delete
    - created_at, updated_at: Timestamps
    
    Relationships:
    - workspace: Parent workspace
    - folder: Optional parent folder
    - created_by: User who created this
    - yjs_state: Yjs collaboration state (Phase 1)
    - versions: Document version history (Phase 1)
    """
    
    __tablename__ = "documents"
    
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
    # Document Fields
    # =========================================
    title = Column(
        String(200),
        nullable=False,
        doc="Document title (1-200 chars)"
    )
    
    slug = Column(
        String(200),
        nullable=False,
        index=True,
        doc="URL-friendly slug"
    )
    
    content = Column(
        Text,
        nullable=True,
        default="",
        doc="Markdown/HTML content (metadata only, Yjs handles real content)"
    )
    
    content_type = Column(
        String(20),
        default="markdown",
        nullable=False,
        doc="Content type: 'markdown' or 'html'"
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
    
    folder_id = Column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Optional parent folder"
    )
    
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="User who created this document"
    )
    
    # =========================================
    # Metadata
    # =========================================
    tags = Column(
        ARRAY(String),
        default=[],
        nullable=False,
        doc="Array of tags for organization"
    )
    
    is_public = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Public visibility flag"
    )
    
    is_template = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Template flag (for template library)"
    )
    
    is_starred = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Starred by creator (quick access)"
    )
    
    # =========================================
    # Storage Mode (Phase 2)
    # =========================================
    storage_mode = Column(
        SQLEnum(StorageMode),
        default=StorageMode.HYBRID_SYNC,
        nullable=False,
        index=True,
        doc="Storage mode: LocalOnly | HybridSync | CloudOnly"
    )
    
    # =========================================
    # Versioning
    # =========================================
    version = Column(
        Integer,
        default=1,
        nullable=False,
        doc="Document version (optimistic locking for metadata)"
    )
    
    yjs_version = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Yjs document version (for collaboration state)"
    )

    yjs_state = Column(
        LargeBinary,
        nullable=True,
        doc="Yjs collaboration state (Phase 1)"
    )

    size = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Document size in bytes (monitoring)"
    )
    
    # =========================================
    # Computed Fields (cached)
    # =========================================
    word_count = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Cached word count (updated on save)"
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
        nullable=False,
        index=True
    )
    
    # =========================================
    # Relationships
    # =========================================
    workspace = relationship("Workspace", back_populates="documents")
    folder = relationship("Folder", back_populates="documents")
    created_by = relationship("User", back_populates="documents")
    # yjs_state = relationship("YjsState", back_populates="document", uselist=False)  # Phase 1
    # versions = relationship("DocumentVersion", back_populates="document")  # Phase 1
    
    # =========================================
    # Indexes
    # =========================================
    __table_args__ = (
        Index('ix_documents_workspace_folder', 'workspace_id', 'folder_id'),
        Index('ix_documents_workspace_starred', 'workspace_id', 'is_starred'),
        Index('ix_documents_created_by', 'created_by_id'),
    )
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title}, workspace_id={self.workspace_id})>"


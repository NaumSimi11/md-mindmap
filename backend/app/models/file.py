"""
File & Attachment Models
Handles file uploads, attachments, and storage metadata
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, ForeignKey, Index, BigInteger, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.models.base import BaseModel, SoftDeleteMixin


class File(BaseModel, SoftDeleteMixin):
    """
    File model for uploaded files and attachments
    
    Supports both local storage and cloud (S3) storage.
    Tracks file metadata, ownership, and usage.
    """
    
    __tablename__ = "files"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # File info
    filename = Column(String(255), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Local path or S3 key
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False, index=True)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA256 hash
    
    # Storage
    storage_type = Column(String(20), default="local", nullable=False)  # "local" or "s3"
    storage_bucket = Column(String(100), nullable=True)  # S3 bucket name
    storage_region = Column(String(50), nullable=True)  # S3 region
    
    # Ownership & context
    uploaded_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Status
    is_public = Column(Boolean, default=False, nullable=False)
    scan_status = Column(String(20), default="pending", nullable=False)  # pending, clean, infected
    
    # Metadata
    file_metadata = Column(JSONB, default={}, nullable=False)
    
    # Access tracking
    download_count = Column(Integer, default=0, nullable=False)
    last_accessed_at = Column(DateTime, nullable=True)
    
    # Relationships
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    document = relationship("Document", foreign_keys=[document_id])
    
    # Indexes
    __table_args__ = (
        Index('ix_files_workspace_deleted', 'workspace_id', 'is_deleted'),
        Index('ix_files_document_deleted', 'document_id', 'is_deleted'),
        Index('ix_files_hash_size', 'file_hash', 'file_size'),  # Deduplication
        Index('ix_files_mime_type', 'mime_type'),
    )
    
    def increment_downloads(self) -> None:
        """Increment download counter"""
        self.download_count += 1
        self.last_accessed_at = datetime.utcnow()
    
    def mark_clean(self) -> None:
        """Mark file as clean (passed virus scan)"""
        self.scan_status = "clean"
    
    def mark_infected(self) -> None:
        """Mark file as infected"""
        self.scan_status = "infected"
    
    @property
    def size_mb(self) -> float:
        """File size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self) -> bool:
        """Check if file is an image"""
        return self.mime_type.startswith("image/")
    
    @property
    def is_document(self) -> bool:
        """Check if file is a document"""
        doc_types = ["application/pdf", "text/", "application/msword"]
        return any(self.mime_type.startswith(t) for t in doc_types)
    
    def to_response(self) -> dict:
        """Safe response without internal paths"""
        return {
            "id": str(self.id),
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "size_mb": self.size_mb,
            "mime_type": self.mime_type,
            "is_image": self.is_image,
            "is_document": self.is_document,
            "storage_type": self.storage_type,
            "download_count": self.download_count,
            "scan_status": self.scan_status,
            "uploaded_by_id": str(self.uploaded_by_id) if self.uploaded_by_id else None,
            "workspace_id": str(self.workspace_id) if self.workspace_id else None,
            "document_id": str(self.document_id) if self.document_id else None,
            "created_at": self.created_at.isoformat(),
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
        }
    
    def __repr__(self) -> str:
        return f"<File(id={self.id}, filename={self.filename}, size={self.size_mb}MB)>"


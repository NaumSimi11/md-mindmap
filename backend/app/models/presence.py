"""
Presence & Session Models
Tracks user presence, sessions, and real-time activity
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, ForeignKey, Index, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.models.base import BaseModel


class UserSession(BaseModel):
    """
    User session tracking for WebSocket connections
    
    Tracks active connections, last seen, and session metadata
    """
    
    __tablename__ = "user_sessions"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # User & connection
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    connection_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Session info
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Client info
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    device_type = Column(String(50), nullable=True)  # web, desktop, mobile
    
    # Context
    current_workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    current_document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Metadata
    session_metadata = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    workspace = relationship("Workspace", foreign_keys=[current_workspace_id])
    document = relationship("Document", foreign_keys=[current_document_id])
    
    # Indexes
    __table_args__ = (
        Index('ix_user_sessions_user_active', 'user_id', 'is_active'),
        Index('ix_user_sessions_workspace', 'current_workspace_id', 'is_active'),
        Index('ix_user_sessions_document', 'current_document_id', 'is_active'),
    )
    
    def update_last_seen(self) -> None:
        """Update last seen timestamp"""
        self.last_seen_at = datetime.utcnow()
    
    def deactivate(self) -> None:
        """Mark session as inactive"""
        self.is_active = False
        self.last_seen_at = datetime.utcnow()
    
    def to_response(self) -> dict:
        """Convert to response dict"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "connection_id": self.connection_id,
            "is_active": self.is_active,
            "last_seen_at": self.last_seen_at.isoformat(),
            "device_type": self.device_type,
            "current_workspace_id": str(self.current_workspace_id) if self.current_workspace_id else None,
            "current_document_id": str(self.current_document_id) if self.current_document_id else None,
        }
    
    def __repr__(self) -> str:
        return f"<UserSession(user_id={self.user_id}, active={self.is_active})>"


class DocumentPresence(BaseModel):
    """
    Document presence tracking
    
    Tracks who is viewing/editing each document in real-time
    """
    
    __tablename__ = "document_presence"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Document & user
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_editing = Column(Boolean, default=False, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Cursor position (for live cursors)
    cursor_line = Column(Integer, nullable=True)
    cursor_column = Column(Integer, nullable=True)
    
    # Selection range
    selection_start_line = Column(Integer, nullable=True)
    selection_start_column = Column(Integer, nullable=True)
    selection_end_line = Column(Integer, nullable=True)
    selection_end_column = Column(Integer, nullable=True)
    
    # Metadata
    presence_metadata = Column(JSONB, default={}, nullable=False)
    
    # Relationships
    document = relationship("Document", foreign_keys=[document_id])
    user = relationship("User", foreign_keys=[user_id])
    session = relationship("UserSession", foreign_keys=[session_id])
    
    # Indexes
    __table_args__ = (
        Index('ix_document_presence_doc_active', 'document_id', 'is_active'),
        Index('ix_document_presence_user', 'user_id', 'is_active'),
        Index('ix_document_presence_doc_user', 'document_id', 'user_id', unique=True),
    )
    
    def update_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity_at = datetime.utcnow()
    
    def update_cursor(self, line: int, column: int) -> None:
        """Update cursor position"""
        self.cursor_line = line
        self.cursor_column = column
        self.update_activity()
    
    def update_selection(
        self,
        start_line: int,
        start_column: int,
        end_line: int,
        end_column: int
    ) -> None:
        """Update selection range"""
        self.selection_start_line = start_line
        self.selection_start_column = start_column
        self.selection_end_line = end_line
        self.selection_end_column = end_column
        self.update_activity()
    
    def clear_selection(self) -> None:
        """Clear selection"""
        self.selection_start_line = None
        self.selection_start_column = None
        self.selection_end_line = None
        self.selection_end_column = None
        self.update_activity()
    
    def to_response(self) -> dict:
        """Convert to response dict"""
        return {
            "id": str(self.id),
            "document_id": str(self.document_id),
            "user_id": str(self.user_id),
            "is_active": self.is_active,
            "is_editing": self.is_editing,
            "last_activity_at": self.last_activity_at.isoformat(),
            "cursor": {
                "line": self.cursor_line,
                "column": self.cursor_column
            } if self.cursor_line is not None else None,
            "selection": {
                "start": {"line": self.selection_start_line, "column": self.selection_start_column},
                "end": {"line": self.selection_end_line, "column": self.selection_end_column}
            } if self.selection_start_line is not None else None,
        }
    
    def __repr__(self) -> str:
        return f"<DocumentPresence(doc={self.document_id}, user={self.user_id}, active={self.is_active})>"


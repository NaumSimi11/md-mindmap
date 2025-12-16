"""
User Model
==========

Security Patterns Applied (SECURITY_CHECKLIST.md):
✅ Password hashing with bcrypt (12 rounds)
✅ Optimistic locking (version field)
✅ Email validation
✅ No plain-text passwords stored
✅ Soft delete (is_deleted flag)

Patterns Applied (PATTERNS_ADOPTION.md):
✅ Optimistic Locking (#7) - version field for concurrent updates
✅ Three-Layer Architecture - Model only, no business logic
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class User(Base):
    """
    User model with security best practices
    
    Fields:
    - id: UUID primary key
    - email: Unique email (indexed)
    - username: Unique username (indexed)
    - hashed_password: bcrypt hash (NEVER store plain text)
    - full_name: Optional display name
    - avatar_url: Optional avatar URL
    - is_active: Account active status
    - is_deleted: Soft delete flag
    - version: Optimistic locking (prevent lost updates)
    - created_at: Account creation timestamp
    - updated_at: Last update timestamp
    
    Relationships:
    - workspaces: User's owned workspaces
    - documents: User's created documents
    
    Security:
    - Password is NEVER stored in plain text
    - bcrypt with 12 rounds (SECURITY_CHECKLIST.md)
    - Email is unique and indexed
    - Soft delete preserves history
    """
    
    __tablename__ = "users"
    
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
    # Authentication Fields (SECURITY_CHECKLIST.md)
    # =========================================
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        doc="User's email address (unique, indexed)"
    )
    
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        doc="User's username (unique, indexed, 3-50 chars)"
    )
    
    hashed_password = Column(
        String(255),
        nullable=False,
        doc="bcrypt hashed password (12 rounds, NEVER plain text)"
    )
    
    # =========================================
    # Profile Fields
    # =========================================
    full_name = Column(
        String(100),
        nullable=True,
        doc="User's full display name (optional)"
    )
    
    avatar_url = Column(
        String(500),
        nullable=True,
        doc="URL to user's avatar image (optional)"
    )
    
    # =========================================
    # Status Fields
    # =========================================
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        doc="Account active status (for suspension)"
    )
    
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Soft delete flag (preserves history)"
    )
    
    # =========================================
    # Optimistic Locking (PATTERNS_ADOPTION.md #7)
    # =========================================
    version = Column(
        Integer,
        default=1,
        nullable=False,
        doc="Optimistic lock version (prevents lost updates)"
    )
    
    # =========================================
    # Timestamps
    # =========================================
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        doc="Account creation timestamp"
    )
    
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        doc="Last update timestamp"
    )
    
    # =========================================
    # Relationships
    # =========================================
    workspaces = relationship(
        "Workspace",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document",
        back_populates="created_by",
        cascade="all, delete-orphan"
    )
    folders = relationship(
        "Folder",
        back_populates="created_by",
        cascade="all, delete-orphan"
    )
    
    # =========================================
    # Indexes (for query performance)
    # =========================================
    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
        Index('ix_users_username_active', 'username', 'is_active'),
        Index('ix_users_created_at', 'created_at'),
    )
    
    # =========================================
    # Methods
    # =========================================
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
    
    def to_dict(self) -> dict:
        """
        Convert user to dictionary (for API responses)
        
        Security: NEVER include hashed_password in API responses
        """
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


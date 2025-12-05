"""
User Model
Represents authenticated users in the system
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, Text, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import BaseModel, SoftDeleteMixin


class User(BaseModel, SoftDeleteMixin):
    """
    User model for authentication and profile management
    
    Fields:
        id: Unique identifier (UUID)
        email: User's email address (unique, indexed)
        username: Display name (unique, indexed)
        hashed_password: Argon2id hashed password
        full_name: Optional full name
        avatar_url: Optional profile picture URL
        bio: Optional user biography
        
        # Status flags
        is_active: Whether user account is active
        is_verified: Whether email is verified
        is_superuser: Whether user has admin privileges
        
        # Timestamps
        email_verified_at: When email was verified
        last_login_at: Last successful login
        password_changed_at: Last password change
        
        # Soft delete (from SoftDeleteMixin)
        is_deleted: Whether user is soft-deleted
        deleted_at: When user was deleted
        
        # Audit (from BaseModel)
        created_at: When user was created
        updated_at: When user was last updated
    """
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Authentication
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )
    hashed_password = Column(
        String(255),
        nullable=False
    )
    
    # Profile
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Status flags
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    email_verified_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    
    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner", foreign_keys="Workspace.owner_id")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", foreign_keys="WorkspaceMember.user_id")
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
        Index('ix_users_username_active', 'username', 'is_active'),
    )
    
    def verify_email(self) -> None:
        """Mark email as verified"""
        self.is_verified = True
        self.email_verified_at = datetime.utcnow()
    
    def update_last_login(self) -> None:
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
    
    def change_password(self, new_hashed_password: str) -> None:
        """Update password and timestamp"""
        self.hashed_password = new_hashed_password
        self.password_changed_at = datetime.utcnow()
    
    def deactivate(self) -> None:
        """Deactivate user account"""
        self.is_active = False
    
    def activate(self) -> None:
        """Activate user account"""
        self.is_active = True
    
    def to_dict_safe(self) -> dict:
        """Return safe dictionary without sensitive data"""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "is_superuser": self.is_superuser,
            "email_verified_at": self.email_verified_at.isoformat() if self.email_verified_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"


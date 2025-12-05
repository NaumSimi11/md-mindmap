"""
Base Model Classes
Provides common fields and functionality for all models
"""

from datetime import datetime
from typing import Any
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.ext.declarative import declared_attr
from app.database import Base


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    
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


class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    
    deleted_at = Column(DateTime, nullable=True, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    def soft_delete(self) -> None:
        """Mark record as deleted"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """Restore soft-deleted record"""
        self.is_deleted = False
        self.deleted_at = None


class BaseModel(Base, TimestampMixin):
    """
    Abstract base model with common fields
    All models should inherit from this
    """
    __abstract__ = True
    
    def to_dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self) -> str:
        """String representation of model"""
        columns = [f"{col.name}={getattr(self, col.name)!r}" for col in self.__table__.columns]
        return f"{self.__class__.__name__}({', '.join(columns[:3])}...)"


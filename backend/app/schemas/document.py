"""
Document Schemas
Pydantic models for document request/response validation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re


class DocumentBase(BaseModel):
    """Base document schema"""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(default="")
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False
    is_template: bool = False


class DocumentCreate(DocumentBase):
    """Schema for document creation"""
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug format"""
        if v is not None:
            if not re.match(r'^[a-z0-9-]+$', v):
                raise ValueError('Slug can only contain lowercase letters, numbers, and hyphens')
        return v
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate and clean tags"""
        # Remove duplicates and empty strings
        cleaned = list(set([tag.strip().lower() for tag in v if tag.strip()]))
        return cleaned[:20]  # Max 20 tags


class DocumentUpdate(BaseModel):
    """Schema for document updates"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_template: Optional[bool] = None
    change_summary: Optional[str] = Field(None, max_length=500)
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate and clean tags"""
        if v is None:
            return None
        cleaned = list(set([tag.strip().lower() for tag in v if tag.strip()]))
        return cleaned[:20]


class DocumentResponse(DocumentBase):
    """Schema for document response"""
    id: str
    slug: str
    workspace_id: str
    created_by_id: Optional[str]
    version: int
    view_count: int
    word_count: int
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    workspace_name: Optional[str] = None
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    """Detailed document response with version history"""
    metadata: Dict[str, Any] = {}
    version_count: int = 0
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Paginated document list response"""
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class DocumentVersionResponse(BaseModel):
    """Schema for document version response"""
    id: str
    document_id: str
    version_number: int
    title: str
    content: str
    change_summary: Optional[str]
    word_count: int
    created_by_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DocumentVersionListResponse(BaseModel):
    """List of document versions"""
    versions: List[DocumentVersionResponse]
    total: int


class DocumentStats(BaseModel):
    """Document statistics"""
    document_id: str
    version_count: int
    view_count: int
    word_count: int
    last_edited_at: datetime
    last_edited_by_id: Optional[str]


class DocumentSearchQuery(BaseModel):
    """Schema for document search"""
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    workspace_id: Optional[str] = None
    is_template: Optional[bool] = None
    created_by_id: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


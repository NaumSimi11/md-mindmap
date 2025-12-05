"""
File Schemas
Pydantic models for file upload and response validation
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response after successful file upload"""
    id: str
    filename: str
    original_filename: str
    file_size: int
    size_mb: float
    mime_type: str
    storage_type: str
    scan_status: str
    uploaded_by_id: Optional[str]
    workspace_id: Optional[str]
    document_id: Optional[str]
    download_count: int
    created_at: datetime
    is_image: bool
    is_document: bool
    
    class Config:
        from_attributes = True


class FileResponse(BaseModel):
    """Standard file response"""
    id: str
    filename: str
    original_filename: str
    file_size: int
    size_mb: float
    mime_type: str
    storage_type: str
    scan_status: str
    uploaded_by_id: Optional[str]
    workspace_id: Optional[str]
    document_id: Optional[str]
    download_count: int
    last_accessed_at: Optional[datetime]
    created_at: datetime
    is_image: bool
    is_document: bool
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    """Paginated file list"""
    files: list[FileResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class FileStats(BaseModel):
    """File statistics"""
    total_files: int
    total_size_bytes: int
    total_size_mb: float
    by_mime_type: dict[str, int]
    by_storage: dict[str, int]


class FileQuery(BaseModel):
    """File search/filter query"""
    workspace_id: Optional[str] = None
    document_id: Optional[str] = None
    mime_type: Optional[str] = None
    filename: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


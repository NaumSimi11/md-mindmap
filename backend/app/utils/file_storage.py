"""
File Storage Utilities
Handles file upload, storage, and retrieval (local + S3-ready)
"""

import os
import hashlib
import mimetypes
from pathlib import Path
from typing import Optional, Tuple, BinaryIO
import uuid
from datetime import datetime

from app.config import settings


class FileStorageService:
    """
    File storage abstraction layer
    Supports local storage now, S3 later
    """
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        self.allowed_extensions = set(settings.allowed_extensions_list)
        
        # Ensure upload directory exists
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """
        Validate file before upload
        
        Returns:
            (is_valid, error_message)
        """
        # Check size
        if file_size > self.max_size_bytes:
            return False, f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB"
        
        if file_size == 0:
            return False, "File is empty"
        
        # Check extension
        ext = Path(filename).suffix.lower()
        if ext not in self.allowed_extensions:
            return False, f"File type not allowed. Allowed: {', '.join(self.allowed_extensions)}"
        
        return True, None
    
    def calculate_hash(self, file_content: bytes) -> str:
        """Calculate SHA256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    def generate_unique_filename(self, original_filename: str, file_hash: str) -> str:
        """
        Generate unique filename for storage
        Format: {timestamp}_{hash[:12]}_{sanitized_name}
        """
        # Sanitize filename
        safe_name = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
        safe_name = safe_name.strip().replace(" ", "_")
        
        # Add timestamp and hash prefix
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        hash_prefix = file_hash[:12]
        
        return f"{timestamp}_{hash_prefix}_{safe_name}"
    
    def get_storage_path(self, filename: str, workspace_id: Optional[uuid.UUID] = None) -> Path:
        """
        Get storage path for file
        Organizes files by workspace: uploads/{workspace_id}/{filename}
        """
        if workspace_id:
            workspace_dir = self.upload_dir / str(workspace_id)
            workspace_dir.mkdir(parents=True, exist_ok=True)
            return workspace_dir / filename
        else:
            return self.upload_dir / filename
    
    def save_file_local(
        self,
        file_content: bytes,
        original_filename: str,
        workspace_id: Optional[uuid.UUID] = None
    ) -> Tuple[str, str, str]:
        """
        Save file to local storage
        
        Returns:
            (stored_filename, file_path, file_hash)
        """
        # Calculate hash
        file_hash = self.calculate_hash(file_content)
        
        # Generate unique filename
        stored_filename = self.generate_unique_filename(original_filename, file_hash)
        
        # Get storage path
        file_path = self.get_storage_path(stored_filename, workspace_id)
        
        # Write file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Return relative path for database
        relative_path = str(file_path.relative_to(self.upload_dir))
        
        return stored_filename, relative_path, file_hash
    
    def read_file_local(self, file_path: str) -> Optional[bytes]:
        """Read file from local storage"""
        full_path = self.upload_dir / file_path
        
        if not full_path.exists():
            return None
        
        if not full_path.is_file():
            return None
        
        with open(full_path, 'rb') as f:
            return f.read()
    
    def delete_file_local(self, file_path: str) -> bool:
        """Delete file from local storage"""
        full_path = self.upload_dir / file_path
        
        if not full_path.exists():
            return False
        
        try:
            full_path.unlink()
            return True
        except Exception:
            return False
    
    def get_mime_type(self, filename: str) -> str:
        """Detect MIME type from filename"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"
    
    def check_duplicate(self, file_hash: str, file_size: int) -> bool:
        """
        Check if file already exists (by hash + size)
        Useful for deduplication
        """
        # This will be implemented in service layer with DB check
        return False
    
    # S3 methods (for future implementation)
    def save_file_s3(self, file_content: bytes, filename: str) -> str:
        """Save file to S3 (future)"""
        raise NotImplementedError("S3 storage not yet implemented")
    
    def read_file_s3(self, s3_key: str) -> bytes:
        """Read file from S3 (future)"""
        raise NotImplementedError("S3 storage not yet implemented")
    
    def delete_file_s3(self, s3_key: str) -> bool:
        """Delete file from S3 (future)"""
        raise NotImplementedError("S3 storage not yet implemented")


# Global instance
storage = FileStorageService()


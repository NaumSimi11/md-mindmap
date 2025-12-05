"""
File Service
Business logic for file uploads and management
"""

from typing import List, Optional, Tuple, BinaryIO
from sqlalchemy.orm import Session
from sqlalchemy import and_
import uuid

from app.models.file import File
from app.models.workspace import Workspace
from app.models.document import Document
from app.services.workspace import WorkspaceService
from app.services.document import DocumentService
from app.utils.file_storage import storage


class FileService:
    """Service for file management"""
    
    @staticmethod
    def upload_file(
        db: Session,
        file_content: bytes,
        filename: str,
        user_id: uuid.UUID,
        workspace_id: Optional[uuid.UUID] = None,
        document_id: Optional[uuid.UUID] = None
    ) -> File:
        """
        Upload a file
        
        Validates, stores, and creates database record
        """
        # Validate file
        is_valid, error = storage.validate_file(filename, len(file_content))
        if not is_valid:
            raise ValueError(error)
        
        # Check workspace access if provided
        if workspace_id:
            workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
            if not workspace:
                raise PermissionError("Workspace not found or access denied")
            if not workspace.can_user_edit(user_id):
                raise PermissionError("User does not have edit permissions")
        
        # Check document access if provided
        if document_id:
            document = DocumentService.get_document_by_id(db, document_id, user_id)
            if not document:
                raise PermissionError("Document not found or access denied")
            workspace_id = document.workspace_id  # Link to document's workspace
        
        # Store file
        stored_filename, file_path, file_hash = storage.save_file_local(
            file_content, filename, workspace_id
        )
        
        # Get MIME type
        mime_type = storage.get_mime_type(filename)
        
        # Create database record
        file_record = File(
            filename=stored_filename,
            original_filename=filename,
            file_path=file_path,
            file_size=len(file_content),
            mime_type=mime_type,
            file_hash=file_hash,
            storage_type="local",
            uploaded_by_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
            scan_status="clean"  # In production, would scan first
        )
        
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        
        return file_record
    
    @staticmethod
    def get_file_by_id(
        db: Session,
        file_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[File]:
        """Get file by ID with access check"""
        file_record = db.query(File).filter(
            File.id == file_id,
            File.is_deleted == False
        ).first()
        
        if not file_record:
            return None
        
        # Check access
        if file_record.is_public:
            return file_record
        
        if file_record.workspace_id:
            workspace = WorkspaceService.get_workspace_by_id(db, file_record.workspace_id, user_id)
            if not workspace:
                return None
        elif file_record.uploaded_by_id != user_id:
            # Private file, not in workspace, not owner
            return None
        
        return file_record
    
    @staticmethod
    def get_file_content(
        db: Session,
        file_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[bytes]:
        """
        Get file content from storage
        
        Increments download counter
        """
        file_record = FileService.get_file_by_id(db, file_id, user_id)
        
        if not file_record:
            return None
        
        # Get content based on storage type
        if file_record.storage_type == "local":
            content = storage.read_file_local(file_record.file_path)
        else:
            raise NotImplementedError("S3 storage not yet implemented")
        
        # Increment download count
        file_record.increment_downloads()
        db.commit()
        
        return content
    
    @staticmethod
    def list_workspace_files(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        mime_type: Optional[str] = None
    ) -> Tuple[List[File], int]:
        """List all files in workspace"""
        # Check access
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        if not workspace:
            return [], 0
        
        query = db.query(File).filter(
            File.workspace_id == workspace_id,
            File.is_deleted == False
        )
        
        if mime_type:
            query = query.filter(File.mime_type.like(f"{mime_type}%"))
        
        total = query.count()
        
        offset = (page - 1) * page_size
        files = query.order_by(File.created_at.desc()).offset(offset).limit(page_size).all()
        
        return files, total
    
    @staticmethod
    def list_document_files(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> List[File]:
        """List all files attached to document"""
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        if not document:
            return []
        
        return db.query(File).filter(
            File.document_id == document_id,
            File.is_deleted == False
        ).order_by(File.created_at.desc()).all()
    
    @staticmethod
    def delete_file(
        db: Session,
        file_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Soft delete file
        
        Requires: Owner or workspace editor
        """
        file_record = FileService.get_file_by_id(db, file_id, user_id)
        
        if not file_record:
            return False
        
        # Check permissions
        if file_record.uploaded_by_id != user_id:
            if file_record.workspace_id:
                workspace = WorkspaceService.get_workspace_by_id(db, file_record.workspace_id, user_id)
                if not workspace.can_user_edit(user_id):
                    raise PermissionError("User does not have delete permissions")
            else:
                raise PermissionError("Cannot delete file uploaded by another user")
        
        file_record.soft_delete()
        db.commit()
        
        return True
    
    @staticmethod
    def get_workspace_stats(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> dict:
        """Get file statistics for workspace"""
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        if not workspace:
            return {}
        
        files = db.query(File).filter(
            File.workspace_id == workspace_id,
            File.is_deleted == False
        ).all()
        
        total_size = sum(f.file_size for f in files)
        by_mime = {}
        for f in files:
            mime_base = f.mime_type.split('/')[0]
            by_mime[mime_base] = by_mime.get(mime_base, 0) + 1
        
        return {
            "total_files": len(files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "by_mime_type": by_mime,
        }


"""
Document Service
Business logic for document management and versioning
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_, func
import uuid
import re

from app.models.document import Document, DocumentVersion
from app.models.workspace import Workspace
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.workspace import WorkspaceService


class DocumentService:
    """Service for handling document operations"""
    
    @staticmethod
    def generate_slug(title: str) -> str:
        """Generate URL-friendly slug from title"""
        slug = title.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        return slug[:255]
    
    @staticmethod
    def create_document(
        db: Session,
        workspace_id: uuid.UUID,
        document_data: DocumentCreate,
        user_id: uuid.UUID
    ) -> Document:
        """
        Create a new document in a workspace
        
        Requires: Editor or Admin permissions in workspace
        """
        # Check workspace access
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        if not workspace:
            raise ValueError("Workspace not found or access denied")
        
        # Check edit permissions
        if not workspace.can_user_edit(user_id):
            raise PermissionError("User does not have edit permissions")
        
        # Generate slug
        slug = document_data.slug or DocumentService.generate_slug(document_data.title)
        
        # Ensure unique slug in workspace
        counter = 1
        original_slug = slug
        while db.query(Document).filter(
            Document.workspace_id == workspace_id,
            Document.slug == slug,
            Document.is_deleted == False
        ).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
            if counter > 100:
                raise ValueError("Unable to generate unique slug")
        
        # Create document
        document = Document(
            title=document_data.title,
            slug=slug,
            content=document_data.content,
            workspace_id=workspace_id,
            created_by_id=user_id,
            tags=document_data.tags,
            is_public=document_data.is_public,
            is_template=document_data.is_template,
            version=1
        )
        
        document.update_word_count()
        
        db.add(document)
        db.flush()  # Get document ID
        
        # Create initial version
        version = DocumentVersion(
            document_id=document.id,
            version_number=1,
            content=document.content,
            title=document.title,
            created_by_id=user_id,
            change_summary="Initial version"
        )
        version.word_count = document.word_count
        
        db.add(version)
        db.commit()
        db.refresh(document)
        
        return document
    
    @staticmethod
    def get_document_by_id(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[Document]:
        """
        Get document by ID with access check
        """
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            return None
        
        # Check workspace access
        workspace = WorkspaceService.get_workspace_by_id(db, document.workspace_id, user_id)
        if not workspace:
            return None
        
        return document
    
    @staticmethod
    def get_workspace_documents(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        tags: Optional[List[str]] = None,
        is_template: Optional[bool] = None
    ) -> Tuple[List[Document], int]:
        """
        Get all documents in a workspace with filtering
        """
        # Check workspace access
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        if not workspace:
            return [], 0
        
        query = db.query(Document).filter(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False
        )
        
        # Apply filters
        if tags:
            query = query.filter(Document.tags.overlap(tags))
        
        if is_template is not None:
            query = query.filter(Document.is_template == is_template)
        
        # Get total
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        documents = query.order_by(Document.updated_at.desc()).offset(offset).limit(page_size).all()
        
        return documents, total
    
    @staticmethod
    def update_document(
        db: Session,
        document_id: uuid.UUID,
        document_data: DocumentUpdate,
        user_id: uuid.UUID
    ) -> Optional[Document]:
        """
        Update document and create new version if content changed
        """
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        
        if not document:
            return None
        
        # Check edit permissions
        workspace = WorkspaceService.get_workspace_by_id(db, document.workspace_id, user_id)
        if not workspace.can_user_edit(user_id):
            raise PermissionError("User does not have edit permissions")
        
        # Track if content changed
        content_changed = False
        
        # Update fields
        if document_data.title is not None:
            document.title = document_data.title
        
        if document_data.content is not None and document_data.content != document.content:
            document.content = document_data.content
            document.update_word_count()
            content_changed = True
        
        if document_data.tags is not None:
            document.tags = document_data.tags
        
        if document_data.is_public is not None:
            document.is_public = document_data.is_public
        
        if document_data.is_template is not None:
            document.is_template = document_data.is_template
        
        # Create new version if content changed
        if content_changed:
            document.version += 1
            
            version = DocumentVersion(
                document_id=document.id,
                version_number=document.version,
                content=document.content,
                title=document.title,
                created_by_id=user_id,
                change_summary=document_data.change_summary or f"Version {document.version}",
                word_count=document.word_count
            )
            
            db.add(version)
        
        db.commit()
        db.refresh(document)
        
        return document
    
    @staticmethod
    def delete_document(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Soft delete document
        
        Requires: Editor or Admin permissions
        """
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        
        if not document:
            return False
        
        # Check permissions
        workspace = WorkspaceService.get_workspace_by_id(db, document.workspace_id, user_id)
        if not workspace.can_user_edit(user_id):
            raise PermissionError("User does not have edit permissions")
        
        document.soft_delete()
        db.commit()
        
        return True
    
    @staticmethod
    def get_document_versions(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> List[DocumentVersion]:
        """
        Get all versions of a document
        """
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        
        if not document:
            return []
        
        return db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).all()
    
    @staticmethod
    def get_document_version(
        db: Session,
        document_id: uuid.UUID,
        version_number: int,
        user_id: uuid.UUID
    ) -> Optional[DocumentVersion]:
        """
        Get a specific version of a document
        """
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        
        if not document:
            return None
        
        return db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version_number
        ).first()
    
    @staticmethod
    def restore_version(
        db: Session,
        document_id: uuid.UUID,
        version_number: int,
        user_id: uuid.UUID
    ) -> Optional[Document]:
        """
        Restore a document to a previous version
        
        Creates a new version with the old content
        """
        document = DocumentService.get_document_by_id(db, document_id, user_id)
        
        if not document:
            return None
        
        # Check permissions
        workspace = WorkspaceService.get_workspace_by_id(db, document.workspace_id, user_id)
        if not workspace.can_user_edit(user_id):
            raise PermissionError("User does not have edit permissions")
        
        # Get the version to restore
        old_version = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version_number
        ).first()
        
        if not old_version:
            return None
        
        # Update document with old content
        document.content = old_version.content
        document.title = old_version.title
        document.update_word_count()
        document.version += 1
        
        # Create new version
        new_version = DocumentVersion(
            document_id=document.id,
            version_number=document.version,
            content=document.content,
            title=document.title,
            created_by_id=user_id,
            change_summary=f"Restored from version {version_number}",
            word_count=document.word_count
        )
        
        db.add(new_version)
        db.commit()
        db.refresh(document)
        
        return document
    
    @staticmethod
    def search_documents(
        db: Session,
        user_id: uuid.UUID,
        query: Optional[str] = None,
        workspace_id: Optional[uuid.UUID] = None,
        tags: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Tuple[List[Document], int]:
        """
        Search documents across accessible workspaces
        """
        # Get user's workspaces
        user_workspaces, _ = WorkspaceService.get_user_workspaces(db, user_id, page=1, page_size=1000)
        workspace_ids = [ws.id for ws in user_workspaces]
        
        if not workspace_ids:
            return [], 0
        
        # Build query
        doc_query = db.query(Document).filter(
            Document.workspace_id.in_(workspace_ids),
            Document.is_deleted == False
        )
        
        # Filter by workspace if specified
        if workspace_id:
            doc_query = doc_query.filter(Document.workspace_id == workspace_id)
        
        # Search in title or content
        if query:
            search_pattern = f"%{query}%"
            doc_query = doc_query.filter(
                or_(
                    Document.title.ilike(search_pattern),
                    Document.content.ilike(search_pattern)
                )
            )
        
        # Filter by tags
        if tags:
            doc_query = doc_query.filter(Document.tags.overlap(tags))
        
        # Get total
        total = doc_query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        documents = doc_query.order_by(Document.updated_at.desc()).offset(offset).limit(page_size).all()
        
        return documents, total


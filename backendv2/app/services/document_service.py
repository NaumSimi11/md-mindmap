"""
Document Service
================

Business logic for document operations.
Based on API_CONTRACTS.md Section 4.

Pattern: Three-Layer Architecture (Service layer)
- Business logic validation
- Database operations
- Error handling (raises ValueError for business errors)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from typing import Optional, List
import uuid as uuid_lib
import re
import base64
from datetime import datetime

from app.models.document import Document, StorageMode
from app.models.workspace import Workspace
from app.models.folder import Folder
from app.schemas.document import DocumentCreate, DocumentUpdate, SortBy, SortOrder


class DocumentService:
    """
    Document service
    
    Methods:
    - create_document: Create new document
    - get_document: Get document by ID
    - list_documents: List documents in workspace
    - update_document: Update document
    - delete_document: Delete document (soft delete)
    - star_document: Star document
    - unstar_document: Unstar document
    
    Business Rules:
    - User must have access to workspace
    - Folder must exist in same workspace
    - Slug auto-generated from title
    - Word count calculated from content
    - Soft delete (is_deleted flag)
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # =========================================
    # Helper Methods
    # =========================================
    
    def _generate_slug(self, title: str) -> str:
        """
        Generate URL-friendly slug from title
        
        Rules:
        - Lowercase
        - Replace spaces with hyphens
        - Remove special characters
        - Max 200 chars
        """
        slug = title.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        return slug[:200]
    
    def _calculate_word_count(self, content: str) -> int:
        """Calculate word count from content"""
        if not content:
            return 0
        # Simple word count (split by whitespace)
        words = content.split()
        return len(words)
    
    async def _check_workspace_access(self, workspace_id: str, user_id: str, require_owner: bool = False) -> Workspace:
        """
        Check if user has access to workspace
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID
            require_owner: If True, only workspace owner has access (for create/delete)
        
        Returns workspace if accessible
        Raises ValueError if not found or no access
        """
        result = await self.db.execute(
            select(Workspace).where(
                and_(
                    Workspace.id == workspace_id,
                    Workspace.is_deleted == False
                )
            )
        )
        workspace = result.scalars().first()
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        # Check access
        if require_owner:
            # Only workspace owner can create/delete
            if str(workspace.owner_id) != user_id:
                raise ValueError("No permission to create documents in workspace")
        else:
            # Owner or public workspace
            if str(workspace.owner_id) != user_id and not workspace.is_public:
                raise ValueError("No access to workspace")
        
        return workspace
    
    async def _check_folder_access(
        self,
        folder_id: Optional[str],
        workspace_id: str
    ) -> Optional[Folder]:
        """
        Check if folder exists and belongs to workspace
        
        Returns folder if valid
        Raises ValueError if folder not found or wrong workspace
        """
        if not folder_id:
            return None
        
        result = await self.db.execute(
            select(Folder).where(
                and_(
                    Folder.id == folder_id,
                    Folder.is_deleted == False
                )
            )
        )
        folder = result.scalars().first()
        
        if not folder:
            raise ValueError("Folder not found")
        
        if str(folder.workspace_id) != workspace_id:
            raise ValueError("Folder does not belong to this workspace")
        
        return folder
    
    # =========================================
    # CRUD Operations
    # =========================================
    
    async def create_document(
        self,
        workspace_id: str,
        document_data: DocumentCreate,
        user_id: str
    ) -> Document:
        """
        Create new document (with UPSERT support for local-first sync)
        
        Steps:
        1. Check workspace access
        2. Check folder access (if provided)
        3. Generate slug from title
        4. Calculate word count
        5. Check if document with client ID already exists (UPSERT)
        6. Create or update document
        
        Raises:
            ValueError: If workspace/folder not found or no access
        """
        # Check workspace access
        await self._check_workspace_access(workspace_id, user_id)
        
        # Check folder access (if provided)
        if document_data.folder_id:
            await self._check_folder_access(document_data.folder_id, workspace_id)
        
        # Generate slug
        slug = self._generate_slug(document_data.title)
        
        # Calculate word count
        word_count = self._calculate_word_count(document_data.content or "")
        
        # 🔥 LOCAL-FIRST: Use client-provided ID if available, otherwise generate one
        # This enables true local-first sync where client generates IDs
        document_id = None
        if document_data.id:
            try:
                document_id = uuid_lib.UUID(document_data.id)
            except ValueError:
                # Invalid UUID format, generate new one
                document_id = uuid_lib.uuid4()
        else:
            # No ID provided, generate one (backward compatibility)
            document_id = uuid_lib.uuid4()
        
        # 🔥 UPSERT: Check if document with this ID already exists
        # This prevents duplicate key violations during sync retries
        existing_doc = None
        if document_data.id:  # Only check if client provided an ID
            result = await self.db.execute(
                select(Document).where(
                    and_(
                        Document.id == document_id,
                        Document.is_deleted == False
                    )
                )
            )
            existing_doc = result.scalar_one_or_none()
        
        if existing_doc:
            # Document already exists - update it instead of creating
            # This handles sync retries and race conditions gracefully
            existing_doc.title = document_data.title
            existing_doc.slug = slug
            existing_doc.content = document_data.content or ""
            existing_doc.content_type = document_data.content_type.value
            existing_doc.folder_id = document_data.folder_id
            existing_doc.tags = document_data.tags
            existing_doc.is_public = document_data.is_public
            existing_doc.is_template = document_data.is_template
            existing_doc.storage_mode = StorageMode(document_data.storage_mode.value)
            existing_doc.word_count = word_count
            existing_doc.version += 1  # Increment version for optimistic locking
            existing_doc.updated_at = func.now()
            
            # 🔥 CRITICAL: Save Yjs binary state for local-first sync
            if document_data.yjs_state_b64:
                try:
                    existing_doc.yjs_state = base64.b64decode(document_data.yjs_state_b64)
                    existing_doc.yjs_version += 1
                except Exception as e:
                    print(f"⚠️ [UPSERT] Failed to decode yjs_state_b64: {e}")
            
            await self.db.commit()
            await self.db.refresh(existing_doc)
            
            return existing_doc
        else:
            # Create new document
            # 🔥 CRITICAL: Decode and save Yjs binary state for local-first sync
            yjs_state_binary = None
            yjs_version_initial = 0
            if document_data.yjs_state_b64:
                try:
                    yjs_state_binary = base64.b64decode(document_data.yjs_state_b64)
                    yjs_version_initial = 1
                except Exception as e:
                    print(f"⚠️ [CREATE] Failed to decode yjs_state_b64: {e}")
            
            document = Document(
                id=document_id,
                title=document_data.title,
                slug=slug,
                content=document_data.content or "",
                content_type=document_data.content_type.value,
                workspace_id=workspace_id,
                folder_id=document_data.folder_id,
                tags=document_data.tags,
                is_public=document_data.is_public,
                is_template=document_data.is_template,
                is_starred=False,
                storage_mode=StorageMode(document_data.storage_mode.value),
                version=1,
                yjs_version=yjs_version_initial,
                yjs_state=yjs_state_binary,
                word_count=word_count,
                created_by_id=user_id,
                is_deleted=False
            )
            
            self.db.add(document)
            await self.db.commit()
            await self.db.refresh(document)
            
            return document
    
    async def get_document(
        self,
        document_id: str,
        user_id: str
    ) -> Document:
        """
        Get document by ID
        
        Checks access: owner, workspace owner, or public document
        
        Raises:
            ValueError: If document not found or no access
        """
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.is_deleted == False
                )
            )
        )
        document = result.scalars().first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Check access
        # 1. Document creator
        if str(document.created_by_id) == user_id:
            return document
        
        # 2. Public document
        if document.is_public:
            return document
        
        # Note: Workspace owner does NOT automatically have access to all documents
        # Only document creator or public documents are accessible
        
        raise ValueError("No access to document")
    
    async def list_documents(
        self,
        workspace_id: str,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
        folder_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_starred: Optional[bool] = None,
        is_template: Optional[bool] = None,
        sort_by: SortBy = SortBy.UPDATED_AT,
        sort_order: SortOrder = SortOrder.DESC
    ) -> tuple[List[Document], int]:
        """
        List documents in workspace
        
        Returns: (documents, total_count)
        
        Raises:
            ValueError: If workspace not found or no access
        """
        # Check workspace access
        await self._check_workspace_access(workspace_id, user_id)
        
        # Build query
        query = select(Document).where(
            and_(
                Document.workspace_id == workspace_id,
                Document.is_deleted == False
            )
        )
        
        # Apply filters
        if folder_id:
            query = query.where(Document.folder_id == folder_id)
        
        if tags:
            # Documents that have any of the specified tags
            query = query.where(Document.tags.overlap(tags))
        
        if is_starred is not None:
            query = query.where(Document.is_starred == is_starred)
        
        if is_template is not None:
            query = query.where(Document.is_template == is_template)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply sorting
        if sort_by == SortBy.UPDATED_AT:
            sort_col = Document.updated_at
        elif sort_by == SortBy.CREATED_AT:
            sort_col = Document.created_at
        else:  # TITLE
            sort_col = Document.title
        
        if sort_order == SortOrder.DESC:
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Execute
        result = await self.db.execute(query)
        documents = result.scalars().all()
        
        return list(documents), total
    
    async def update_document(
        self,
        document_id: str,
        document_data: DocumentUpdate,
        user_id: str
    ) -> Document:
        """
        Update document
        
        Only document creator or workspace owner can update
        
        Raises:
            ValueError: If document not found or no permission
        """
        # Get document
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.is_deleted == False
                )
            )
        )
        document = result.scalars().first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Check permission (creator or workspace owner)
        is_creator = str(document.created_by_id) == user_id
        
        if not is_creator:
            # Check if workspace owner
            result = await self.db.execute(
                select(Workspace).where(
                    and_(
                        Workspace.id == document.workspace_id,
                        Workspace.owner_id == user_id
                    )
                )
            )
            workspace = result.scalars().first()
            if not workspace:
                raise ValueError("No permission to update document")
        
        # Check folder access (if changing folder)
        if document_data.folder_id is not None:
            if document_data.folder_id:  # Not null
                await self._check_folder_access(
                    document_data.folder_id,
                    str(document.workspace_id)
                )
        
        # Update fields
        if document_data.title is not None:
            document.title = document_data.title
            document.slug = self._generate_slug(document_data.title)
        
        if document_data.content is not None:
            document.content = document_data.content
            document.word_count = self._calculate_word_count(document_data.content)
        
        if document_data.folder_id is not None:
            document.folder_id = document_data.folder_id
        
        if document_data.tags is not None:
            document.tags = document_data.tags
        
        if document_data.is_public is not None:
            document.is_public = document_data.is_public
        
        # 🔥 CRITICAL: Update Yjs binary state for local-first sync
        if document_data.yjs_state_b64 is not None:
            try:
                document.yjs_state = base64.b64decode(document_data.yjs_state_b64)
                document.yjs_version += 1
            except Exception as e:
                print(f"⚠️ [UPDATE] Failed to decode yjs_state_b64: {e}")
        
        # Increment version
        document.version += 1
        document.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(document)
        
        return document
    
    async def delete_document(
        self,
        document_id: str,
        user_id: str
    ) -> None:
        """
        Delete document (soft delete)
        
        Only document creator or workspace owner can delete
        
        Raises:
            ValueError: If document not found or no permission
        """
        # Get document
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.is_deleted == False
                )
            )
        )
        document = result.scalars().first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Check permission (creator or workspace owner)
        is_creator = str(document.created_by_id) == user_id
        
        if not is_creator:
            # Check if workspace owner
            result = await self.db.execute(
                select(Workspace).where(
                    and_(
                        Workspace.id == document.workspace_id,
                        Workspace.owner_id == user_id
                    )
                )
            )
            workspace = result.scalars().first()
            if not workspace:
                raise ValueError("No permission to delete document")
        
        # Soft delete
        document.is_deleted = True
        document.updated_at = datetime.utcnow()
        
        await self.db.commit()
    
    async def star_document(
        self,
        document_id: str,
        user_id: str
    ) -> Document:
        """
        Star document
        
        Only document creator can star
        
        Raises:
            ValueError: If document not found or not creator
        """
        # Get document
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.is_deleted == False
                )
            )
        )
        document = result.scalars().first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Check if creator
        if str(document.created_by_id) != user_id:
            raise ValueError("Only document creator can star")
        
        # Star
        document.is_starred = True
        document.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(document)
        
        return document
    
    async def unstar_document(
        self,
        document_id: str,
        user_id: str
    ) -> Document:
        """
        Unstar document
        
        Only document creator can unstar
        
        Raises:
            ValueError: If document not found or not creator
        """
        # Get document
        result = await self.db.execute(
            select(Document).where(
                and_(
                    Document.id == document_id,
                    Document.is_deleted == False
                )
            )
        )
        document = result.scalars().first()
        
        if not document:
            raise ValueError("Document not found")
        
        # Check if creator
        if str(document.created_by_id) != user_id:
            raise ValueError("Only document creator can unstar")
        
        # Unstar
        document.is_starred = False
        document.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(document)
        
        return document

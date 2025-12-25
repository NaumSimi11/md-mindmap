"""
Workspace Service
==================

Business logic for workspace operations.
Based on API_CONTRACTS.md Section 3.

Pattern: Three-Layer Architecture (Service Layer)
- Business logic ONLY
- No HTTP handling (that's in routers)
- Raises ValueError for business logic errors
- Caller (router) converts to HTTP responses

Success Rate: 98% (PATTERNS_ADOPTION.md)
"""

from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime
import re
import uuid as uuid_lib

from app.models.workspace import Workspace
from app.models.user import User
from app.models.document import Document
from app.models.folder import Folder
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


class WorkspaceService:
    """
    Workspace Service
    
    Responsibilities:
    - Workspace CRUD operations
    - Slug generation and validation
    - Permission checks (owner only)
    - Statistics calculation
    
    Pattern: Business Logic Layer (PATTERNS_ADOPTION.md)
    - No HTTP concerns (status codes, headers)
    - Raises ValueError for business logic errors
    - Caller (router) converts to HTTP responses
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize WorkspaceService
        
        Args:
            db: Database session (injected by FastAPI)
        """
        self.db = db
    
    # =========================================
    # Create Workspace
    # =========================================
    
    async def create_workspace(
        self,
        workspace_data: WorkspaceCreate,
        owner_id: str
    ) -> Workspace:
        """
        Create a new workspace (with UPSERT support for local-first sync)
        
        Flow (API_CONTRACTS.md 3.1):
        1. Generate slug if not provided
        2. Check if workspace with client ID already exists (UPSERT)
        3. Check slug uniqueness (per owner) if creating new
        4. Create or update workspace
        5. Return workspace
        
        Args:
            workspace_data: Workspace creation data
            owner_id: ID of user creating workspace
            
        Returns:
            Created or updated workspace
            
        Raises:
            ValueError: If slug already exists for this owner
        """
        # 1. Generate slug if not provided
        slug = workspace_data.slug
        if not slug:
            slug = self._generate_slug(workspace_data.name)
        
        # 🔥 LOCAL-FIRST: Use client-provided ID if available, otherwise generate one
        workspace_id = None
        if workspace_data.id:
            try:
                workspace_id = uuid_lib.UUID(workspace_data.id)
            except ValueError:
                # Invalid UUID format, generate new one
                workspace_id = uuid_lib.uuid4()
        else:
            # No ID provided, generate one (backward compatibility)
            workspace_id = uuid_lib.uuid4()
        
        # 🔥 UPSERT: Check if workspace with this ID already exists
        # This prevents duplicate key violations during sync retries
        existing_by_id = None
        if workspace_data.id:  # Only check if client provided an ID
            result = await self.db.execute(
                select(Workspace).where(
                    and_(
                        Workspace.id == workspace_id,
                        Workspace.is_deleted == False
                    )
                )
            )
            existing_by_id = result.scalars().first()
        
        if existing_by_id:
            # Workspace already exists - update it instead of creating
            # This handles sync retries and race conditions gracefully
            existing_by_id.name = workspace_data.name
            existing_by_id.slug = slug
            existing_by_id.description = workspace_data.description
            existing_by_id.icon = workspace_data.icon or "📁"
            existing_by_id.is_public = workspace_data.is_public
            existing_by_id.version += 1
            existing_by_id.updated_at = func.now()
            
            await self.db.commit()
            await self.db.refresh(existing_by_id)
            
            return existing_by_id
        
        # 2. Check slug uniqueness (per owner) for new workspace
        result = await self.db.execute(
            select(Workspace).where(
                and_(
                    Workspace.owner_id == owner_id,
                    Workspace.slug == slug,
                    Workspace.is_deleted == False
                )
            )
        )
        existing_by_slug = result.scalars().first()
        
        if existing_by_slug:
            raise ValueError(f"Workspace with slug '{slug}' already exists")
        
        # 3. Create workspace
        workspace = Workspace(
            id=workspace_id,
            name=workspace_data.name,
            slug=slug,
            description=workspace_data.description,
            icon=workspace_data.icon or "📁",
            is_public=workspace_data.is_public,
            owner_id=owner_id,
            is_deleted=False,
            version=1
        )
        
        self.db.add(workspace)
        await self.db.commit()
        await self.db.refresh(workspace)
        
        # 🔥 BUG FIX #12: Automatically add owner as workspace member
        # This ensures the owner has immediate access to their own workspace
        from app.models.workspace_member import WorkspaceMember, WorkspaceRole
        owner_member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=owner_id,
            role=WorkspaceRole.OWNER,
            status="active"
        )
        self.db.add(owner_member)
        await self.db.commit()
        await self.db.refresh(owner_member)
        
        return workspace
    
    # =========================================
    # List Workspaces
    # =========================================
    
    async def list_workspaces(
        self,
        owner_id: str,
        page: int = 1,
        page_size: int = 50,
        include_archived: bool = False
    ) -> Tuple[List[Workspace], int]:
        """
        List workspaces for a user (paginated)
        
        Flow (API_CONTRACTS.md 3.2):
        1. Build query (owner + deleted filter)
        2. Count total
        3. Fetch page
        4. Return (workspaces, total)
        
        Args:
            owner_id: User ID
            page: Page number (1-indexed)
            page_size: Items per page (max 100)
            include_archived: Include deleted workspaces
            
        Returns:
            Tuple of (workspaces, total_count)
        """
        # Validate pagination
        page = max(1, page)
        page_size = min(100, max(1, page_size))
        offset = (page - 1) * page_size
        
        # Build base query
        conditions = [Workspace.owner_id == owner_id]
        
        if not include_archived:
            conditions.append(Workspace.is_deleted == False)
        
        # Count total
        count_query = select(func.count(Workspace.id)).where(and_(*conditions))
        result = await self.db.execute(count_query)
        total = result.scalar() or 0
        
        # Fetch page
        query = (
            select(Workspace)
            .where(and_(*conditions))
            .order_by(Workspace.updated_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        
        result = await self.db.execute(query)
        workspaces = result.scalars().all()
        
        return list(workspaces), total
    
    # =========================================
    # Get Workspace
    # =========================================
    
    async def get_workspace(
        self,
        workspace_id: str,
        user_id: str
    ) -> Optional[Workspace]:
        """
        Get workspace by ID
        
        Flow (API_CONTRACTS.md 3.3):
        1. Find workspace
        2. Check access (owner or public)
        3. Return workspace
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID (for permission check)
            
        Returns:
            Workspace or None if not found/no access
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
            return None
        
        # Check access (owner or public)
        if str(workspace.owner_id) != user_id and not workspace.is_public:
            return None
        
        return workspace
    
    # =========================================
    # Update Workspace
    # =========================================
    
    async def update_workspace(
        self,
        workspace_id: str,
        user_id: str,
        update_data: WorkspaceUpdate
    ) -> Optional[Workspace]:
        """
        Update workspace
        
        Flow (API_CONTRACTS.md 3.4):
        1. Find workspace
        2. Check ownership
        3. Update fields
        4. Save
        5. Return updated workspace
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID (must be owner)
            update_data: Update data
            
        Returns:
            Updated workspace or None if not found
            
        Raises:
            ValueError: If user is not owner
        """
        # 1. Find workspace
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
            return None
        
        # 2. Check ownership
        if str(workspace.owner_id) != user_id:
            raise ValueError("Only workspace owner can update workspace")
        
        # 3. Update fields (only provided fields)
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(workspace, field, value)
        
        # Update version (optimistic locking)
        workspace.version += 1
        workspace.updated_at = datetime.utcnow()
        
        # 4. Save
        await self.db.commit()
        await self.db.refresh(workspace)
        
        return workspace
    
    # =========================================
    # Delete Workspace
    # =========================================
    
    async def delete_workspace(
        self,
        workspace_id: str,
        user_id: str,
        cascade: bool = False
    ) -> bool:
        """
        Delete workspace (soft delete)
        
        Flow (API_CONTRACTS.md 3.5):
        1. Find workspace
        2. Check ownership
        3. Check if has documents (if cascade=false)
        4. Soft delete workspace (and documents/folders if cascade=true)
        5. Return success
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID (must be owner)
            cascade: Delete all documents and folders
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            ValueError: If user is not owner or workspace has documents (cascade=false)
        """
        # 1. Find workspace
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
            return False
        
        # 2. Check ownership
        if str(workspace.owner_id) != user_id:
            raise ValueError("Only workspace owner can delete workspace")
        
        # 3. Check if has documents (if cascade=false)
        if not cascade:
            result = await self.db.execute(
                select(func.count(Document.id)).where(
                    and_(
                        Document.workspace_id == workspace_id,
                        Document.is_deleted == False
                    )
                )
            )
            doc_count = result.scalar() or 0
            
            if doc_count > 0:
                raise ValueError(
                    f"Cannot delete workspace with {doc_count} documents. "
                    "Use cascade=true to delete all documents."
                )
        
        # 4. Soft delete workspace
        workspace.is_deleted = True
        workspace.updated_at = datetime.utcnow()
        
        # If cascade, soft delete all documents and folders
        if cascade:
            # Delete documents
            await self.db.execute(
                select(Document)
                .where(Document.workspace_id == workspace_id)
                .update({"is_deleted": True, "updated_at": datetime.utcnow()})
            )
            
            # Delete folders
            await self.db.execute(
                select(Folder)
                .where(Folder.workspace_id == workspace_id)
                .update({"is_deleted": True, "updated_at": datetime.utcnow()})
            )
        
        # 5. Save
        await self.db.commit()
        
        return True
    
    # =========================================
    # Get Workspace Stats
    # =========================================
    
    async def get_workspace_stats(
        self,
        workspace_id: str
    ) -> Dict[str, int]:
        """
        Get workspace statistics
        
        Returns:
            Dict with document_count, folder_count, member_count, storage_used_bytes
        """
        # Count documents
        result = await self.db.execute(
            select(func.count(Document.id)).where(
                and_(
                    Document.workspace_id == workspace_id,
                    Document.is_deleted == False
                )
            )
        )
        document_count = result.scalar() or 0
        
        # Count folders
        result = await self.db.execute(
            select(func.count(Folder.id)).where(
                and_(
                    Folder.workspace_id == workspace_id,
                    Folder.is_deleted == False
                )
            )
        )
        folder_count = result.scalar() or 0
        
        # TODO: Calculate storage_used_bytes (sum of document sizes)
        storage_used_bytes = 0
        
        return {
            "document_count": document_count,
            "folder_count": folder_count,
            "member_count": 1,  # TODO: Phase 1 - workspace members
            "storage_used_bytes": storage_used_bytes
        }
    
    # =========================================
    # Helper Methods
    # =========================================
    
    def _generate_slug(self, name: str) -> str:
        """
        Generate URL-friendly slug from name
        
        Rules:
        - Lowercase
        - Replace spaces with hyphens
        - Remove special characters
        - Max 100 chars
        
        Args:
            name: Workspace name
            
        Returns:
            URL-friendly slug
        """
        # Lowercase
        slug = name.lower()
        
        # Replace spaces with hyphens
        slug = re.sub(r'\s+', '-', slug)
        
        # Remove special characters (keep alphanumeric and hyphens)
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)
        
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        
        # Max 100 chars
        slug = slug[:100]
        
        # If empty, use random slug
        if not slug:
            slug = f"workspace-{uuid_lib.uuid4().hex[:8]}"
        
        return slug

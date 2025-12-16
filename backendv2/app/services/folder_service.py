"""
Folder Service
==============

Business logic for folder operations.
Based on API_CONTRACTS.md Section 5.

Pattern: Three-Layer Architecture (Service Layer)
- Business logic ONLY
- No HTTP handling
- Raises ValueError for business errors
- Database interactions via AsyncSession
"""

from typing import Optional, List, Set
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid as uuid_lib

from app.models.folder import Folder
from app.models.workspace import Workspace
from app.models.document import Document


class FolderService:
    """
    Service for folder operations
    
    Methods:
    - create_folder: Create new folder
    - list_folders: List folders in workspace
    - get_folder_tree: Get hierarchical folder tree
    - update_folder: Update folder metadata
    - move_folder: Move folder to new parent/position
    - delete_folder: Delete folder (soft delete)
    
    Access Control:
    - Only workspace owner can create/update/delete folders
    - Workspace members can read folders
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _check_workspace_access(self, workspace_id: str, user_id: str, require_owner: bool = False) -> Workspace:
        """
        Check if user has access to workspace
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID
            require_owner: If True, only workspace owner has access
        
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
            # Only workspace owner can create/update/delete
            if str(workspace.owner_id) != user_id:
                raise ValueError("No permission to modify folders in workspace")
        else:
            # Owner or public workspace
            if str(workspace.owner_id) != user_id and not workspace.is_public:
                raise ValueError("No access to workspace")
        
        return workspace
    
    async def _check_circular_reference(self, folder_id: str, new_parent_id: Optional[str]) -> bool:
        """
        Check if moving folder would create circular reference
        
        Returns True if circular, False if safe
        """
        if new_parent_id is None:
            return False
        
        if folder_id == new_parent_id:
            return True
        
        # Walk up parent chain
        current_parent_id = new_parent_id
        visited: Set[str] = set()
        
        while current_parent_id:
            if current_parent_id == folder_id:
                return True
            
            if current_parent_id in visited:
                # Already circular in existing structure
                return True
            
            visited.add(current_parent_id)
            
            # Get parent's parent
            result = await self.db.execute(
                select(Folder.parent_id).where(Folder.id == current_parent_id)
            )
            parent = result.scalar()
            current_parent_id = str(parent) if parent else None
        
        return False
    
    async def create_folder(
        self,
        workspace_id: str,
        user_id: str,
        name: str,
        folder_id: Optional[str] = None,  # 🔥 LOCAL-FIRST: Client-generated ID
        icon: Optional[str] = "📁",
        color: Optional[str] = None,
        parent_id: Optional[str] = None,
        position: Optional[int] = 0
    ) -> Folder:
        """
        Create new folder (with UPSERT support for local-first sync)
        
        Contract: API_CONTRACTS.md 5.1
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID (creator)
            name: Folder name (1-100 chars)
            folder_id: Optional client-generated ID (for local-first sync)
            icon: Optional emoji icon
            color: Optional hex color
            parent_id: Optional parent folder ID
            position: Order position
        
        Returns:
            Created or updated folder
        
        Raises:
            ValueError: Validation error or no permission
        """
        # Check workspace access (require owner)
        await self._check_workspace_access(workspace_id, user_id, require_owner=True)
        
        # Check parent folder exists (if provided)
        if parent_id:
            result = await self.db.execute(
                select(Folder).where(
                    and_(
                        Folder.id == parent_id,
                        Folder.workspace_id == workspace_id,
                        Folder.is_deleted == False
                    )
                )
            )
            parent_folder = result.scalars().first()
            if not parent_folder:
                raise ValueError("Parent folder not found")
        
        # 🔥 LOCAL-FIRST: Use client-provided ID if available, otherwise generate one
        final_folder_id = None
        if folder_id:
            try:
                final_folder_id = uuid_lib.UUID(folder_id)
            except ValueError:
                # Invalid UUID format, generate new one
                final_folder_id = uuid_lib.uuid4()
        else:
            # No ID provided, generate one (backward compatibility)
            final_folder_id = uuid_lib.uuid4()
        
        # 🔥 UPSERT: Check if folder with this ID already exists
        # This prevents duplicate key violations during sync retries
        existing_folder = None
        if folder_id:  # Only check if client provided an ID
            result = await self.db.execute(
                select(Folder).where(
                    and_(
                        Folder.id == final_folder_id,
                        Folder.is_deleted == False
                    )
                )
            )
            existing_folder = result.scalars().first()
        
        if existing_folder:
            # Folder already exists - update it instead of creating
            # This handles sync retries and race conditions gracefully
            existing_folder.name = name
            existing_folder.icon = icon
            existing_folder.color = color
            existing_folder.parent_id = parent_id
            existing_folder.position = position or 0
            existing_folder.version += 1
            existing_folder.updated_at = func.now()
            
            await self.db.commit()
            await self.db.refresh(existing_folder)
            
            return existing_folder
        
        # Create new folder
        folder = Folder(
            id=final_folder_id,
            workspace_id=workspace_id,
            name=name,
            icon=icon,
            color=color,
            parent_id=parent_id,
            position=position or 0,
            created_by_id=user_id,
            is_deleted=False,
            version=1
        )
        
        self.db.add(folder)
        await self.db.commit()
        await self.db.refresh(folder)
        
        return folder
    
    async def list_folders(
        self,
        workspace_id: str,
        user_id: str,
        parent_id: Optional[str] = None
    ) -> tuple[List[Folder], int]:
        """
        List folders in workspace
        
        Contract: API_CONTRACTS.md 5.2
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID
            parent_id: Filter by parent (None for root folders)
        
        Returns:
            Tuple of (folders, total_count)
        
        Raises:
            ValueError: No access to workspace
        """
        # Check workspace access
        await self._check_workspace_access(workspace_id, user_id, require_owner=False)
        
        # Build query
        query = select(Folder).where(
            and_(
                Folder.workspace_id == workspace_id,
                Folder.is_deleted == False
            )
        )
        
        # Filter by parent
        if parent_id is None:
            query = query.where(Folder.parent_id.is_(None))
        else:
            query = query.where(Folder.parent_id == parent_id)
        
        # Order by position
        query = query.order_by(Folder.position.asc(), Folder.created_at.asc())
        
        # Execute
        result = await self.db.execute(query)
        folders = result.scalars().all()
        
        # Get document counts for each folder
        for folder in folders:
            count_result = await self.db.execute(
                select(func.count(Document.id)).where(
                    and_(
                        Document.folder_id == folder.id,
                        Document.is_deleted == False
                    )
                )
            )
            folder.document_count = count_result.scalar() or 0
        
        return list(folders), len(folders)
    
    async def get_folder_tree(
        self,
        workspace_id: str,
        user_id: str
    ) -> List[Folder]:
        """
        Get hierarchical folder tree
        
        Contract: API_CONTRACTS.md 5.3
        
        Args:
            workspace_id: Workspace ID
            user_id: User ID
        
        Returns:
            List of root folders with children populated
        
        Raises:
            ValueError: No access to workspace
        """
        # Check workspace access
        await self._check_workspace_access(workspace_id, user_id, require_owner=False)
        
        # Get all folders in workspace
        result = await self.db.execute(
            select(Folder).where(
                and_(
                    Folder.workspace_id == workspace_id,
                    Folder.is_deleted == False
                )
            ).order_by(Folder.position.asc())
        )
        all_folders = list(result.scalars().all())
        
        # Convert to simple objects to avoid SQLAlchemy relationship issues
        from types import SimpleNamespace
        
        folder_objects = []
        for f in all_folders:
            folder_obj = SimpleNamespace(
                id=f.id,
                name=f.name,
                icon=f.icon,
                color=f.color,
                parent_id=f.parent_id,
                position=f.position,
                children=[]
            )
            folder_objects.append(folder_obj)
        
        # Build folder map
        folder_map = {str(f.id): f for f in folder_objects}
        
        # Build tree structure
        root_folders = []
        
        # Build parent-child relationships
        for folder in folder_objects:
            if folder.parent_id is None:
                root_folders.append(folder)
            else:
                parent = folder_map.get(str(folder.parent_id))
                if parent:
                    parent.children.append(folder)
        
        return root_folders
    
    async def update_folder(
        self,
        folder_id: str,
        workspace_id: str,
        user_id: str,
        name: Optional[str] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None
    ) -> Folder:
        """
        Update folder metadata
        
        Contract: API_CONTRACTS.md 5.4
        
        Args:
            folder_id: Folder ID
            workspace_id: Workspace ID
            user_id: User ID
            name: New name (optional)
            icon: New icon (optional)
            color: New color (optional)
        
        Returns:
            Updated folder
        
        Raises:
            ValueError: Folder not found or no permission
        """
        # Check workspace access (require owner)
        await self._check_workspace_access(workspace_id, user_id, require_owner=True)
        
        # Get folder
        result = await self.db.execute(
            select(Folder).where(
                and_(
                    Folder.id == folder_id,
                    Folder.workspace_id == workspace_id,
                    Folder.is_deleted == False
                )
            )
        )
        folder = result.scalars().first()
        
        if not folder:
            raise ValueError("Folder not found")
        
        # Update fields
        if name is not None:
            folder.name = name
        if icon is not None:
            folder.icon = icon
        if color is not None:
            folder.color = color
        
        folder.version += 1
        folder.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(folder)
        
        return folder
    
    async def move_folder(
        self,
        folder_id: str,
        workspace_id: str,
        user_id: str,
        parent_id: Optional[str],
        position: int
    ) -> Folder:
        """
        Move folder to new parent/position
        
        Contract: API_CONTRACTS.md 5.5
        
        Args:
            folder_id: Folder ID
            workspace_id: Workspace ID
            user_id: User ID
            parent_id: New parent folder ID (None for root)
            position: New position
        
        Returns:
            Updated folder
        
        Raises:
            ValueError: Invalid move (circular reference) or no permission
        """
        # Check workspace access (require owner)
        await self._check_workspace_access(workspace_id, user_id, require_owner=True)
        
        # Get folder
        result = await self.db.execute(
            select(Folder).where(
                and_(
                    Folder.id == folder_id,
                    Folder.workspace_id == workspace_id,
                    Folder.is_deleted == False
                )
            )
        )
        folder = result.scalars().first()
        
        if not folder:
            raise ValueError("Folder not found")
        
        # Check parent exists (if provided)
        if parent_id:
            result = await self.db.execute(
                select(Folder).where(
                    and_(
                        Folder.id == parent_id,
                        Folder.workspace_id == workspace_id,
                        Folder.is_deleted == False
                    )
                )
            )
            parent_folder = result.scalars().first()
            if not parent_folder:
                raise ValueError("Parent folder not found")
        
        # Check for circular reference
        is_circular = await self._check_circular_reference(folder_id, parent_id)
        if is_circular:
            raise ValueError("Cannot move folder into itself or create circular hierarchy")
        
        # Update folder
        folder.parent_id = parent_id
        folder.position = position
        folder.version += 1
        folder.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(folder)
        
        return folder
    
    async def delete_folder(
        self,
        folder_id: str,
        workspace_id: str,
        user_id: str,
        cascade: bool = False
    ) -> None:
        """
        Delete folder (soft delete)
        
        Contract: API_CONTRACTS.md 5.6
        
        Args:
            folder_id: Folder ID
            workspace_id: Workspace ID
            user_id: User ID
            cascade: If True, delete all documents in folder
        
        Raises:
            ValueError: Folder not found, not empty, or no permission
        """
        # Check workspace access (require owner)
        await self._check_workspace_access(workspace_id, user_id, require_owner=True)
        
        # Get folder
        result = await self.db.execute(
            select(Folder).where(
                and_(
                    Folder.id == folder_id,
                    Folder.workspace_id == workspace_id,
                    Folder.is_deleted == False
                )
            )
        )
        folder = result.scalars().first()
        
        if not folder:
            raise ValueError("Folder not found")
        
        # Check if folder has documents
        doc_count_result = await self.db.execute(
            select(func.count(Document.id)).where(
                and_(
                    Document.folder_id == folder_id,
                    Document.is_deleted == False
                )
            )
        )
        doc_count = doc_count_result.scalar() or 0
        
        if doc_count > 0 and not cascade:
            raise ValueError("Folder is not empty. Use cascade=true to delete all documents.")
        
        # Delete documents if cascade
        if cascade and doc_count > 0:
            documents_result = await self.db.execute(
                select(Document).where(
                    and_(
                        Document.folder_id == folder_id,
                        Document.is_deleted == False
                    )
                )
            )
            documents = documents_result.scalars().all()
            for doc in documents:
                doc.is_deleted = True
                doc.updated_at = datetime.utcnow()
        
        # Soft delete folder
        folder.is_deleted = True
        folder.updated_at = datetime.utcnow()
        
        await self.db.commit()

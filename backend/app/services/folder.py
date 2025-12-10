"""
Folder Service
Business logic for folder operations
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.document import Document
from app.schemas.folder import FolderCreate, FolderUpdate, FolderWithStats, FolderTree


class FolderService:
    """Service for folder operations"""

    @staticmethod
    def create_folder(
        db: Session,
        workspace_id: UUID,
        user_id: UUID,
        folder_data: FolderCreate
    ) -> Folder:
        """Create a new folder"""
        # Validate parent folder if provided
        if folder_data.parent_id:
            parent = db.query(Folder).filter(
                Folder.id == folder_data.parent_id,
                Folder.workspace_id == workspace_id,
                Folder.is_deleted == False
            ).first()
            
            if not parent:
                raise ValueError("Parent folder not found")

        # Get position for new folder
        max_position = db.query(func.max(Folder.position)).filter(
            Folder.workspace_id == workspace_id,
            Folder.parent_id == folder_data.parent_id,
            Folder.is_deleted == False
        ).scalar() or 0

        folder = Folder(
            workspace_id=workspace_id,
            created_by_id=user_id,
            name=folder_data.name,
            icon=folder_data.icon,
            color=folder_data.color,
            parent_id=folder_data.parent_id,
            position=max_position + 1,
        )
        
        db.add(folder)
        db.commit()
        db.refresh(folder)
        
        return folder

    @staticmethod
    def get_folder(
        db: Session,
        folder_id: UUID,
        workspace_id: UUID
    ) -> Optional[Folder]:
        """Get folder by ID"""
        return db.query(Folder).filter(
            Folder.id == folder_id,
            Folder.workspace_id == workspace_id,
            Folder.is_deleted == False
        ).first()

    @staticmethod
    def list_folders(
        db: Session,
        workspace_id: UUID,
        parent_id: Optional[UUID] = None
    ) -> List[Folder]:
        """List folders in workspace (optionally filtered by parent)"""
        query = db.query(Folder).filter(
            Folder.workspace_id == workspace_id,
            Folder.is_deleted == False
        )
        
        if parent_id is not None:
            query = query.filter(Folder.parent_id == parent_id)
        else:
            # Root folders only if parent_id is explicitly None
            query = query.filter(Folder.parent_id.is_(None))
        
        return query.order_by(Folder.position).all()

    @staticmethod
    def list_all_folders(
        db: Session,
        workspace_id: UUID
    ) -> List[Folder]:
        """List ALL folders in workspace (for tree building)"""
        return db.query(Folder).filter(
            Folder.workspace_id == workspace_id,
            Folder.is_deleted == False
        ).order_by(Folder.position).all()

    @staticmethod
    def get_folder_tree(
        db: Session,
        workspace_id: UUID
    ) -> List[FolderTree]:
        """Get folder hierarchy as nested tree"""
        # Get all folders
        all_folders = FolderService.list_all_folders(db, workspace_id)
        
        # Build folder map
        folder_map = {folder.id: folder for folder in all_folders}
        
        # Count documents per folder
        document_counts = db.query(
            Document.folder_id,
            func.count(Document.id).label('count')
        ).filter(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False,
            Document.folder_id.isnot(None)
        ).group_by(Document.folder_id).all()
        
        doc_count_map = {folder_id: count for folder_id, count in document_counts}
        
        # Build tree
        def build_tree(parent_id: Optional[UUID]) -> List[FolderTree]:
            children = []
            for folder in all_folders:
                if folder.parent_id == parent_id:
                    folder_tree = FolderTree(
                        id=folder.id,
                        workspace_id=folder.workspace_id,
                        created_by_id=folder.created_by_id,
                        name=folder.name,
                        icon=folder.icon,
                        color=folder.color,
                        parent_id=folder.parent_id,
                        position=folder.position,
                        is_expanded=folder.is_expanded,
                        is_deleted=folder.is_deleted,
                        created_at=folder.created_at,
                        updated_at=folder.updated_at,
                        document_count=doc_count_map.get(folder.id, 0),
                        children=build_tree(folder.id)
                    )
                    children.append(folder_tree)
            return sorted(children, key=lambda f: f.position)
        
        return build_tree(None)

    @staticmethod
    def update_folder(
        db: Session,
        folder_id: UUID,
        workspace_id: UUID,
        folder_data: FolderUpdate
    ) -> Folder:
        """Update folder"""
        folder = FolderService.get_folder(db, folder_id, workspace_id)
        if not folder:
            raise ValueError("Folder not found")

        # Update fields
        if folder_data.name is not None:
            folder.name = folder_data.name
        if folder_data.icon is not None:
            folder.icon = folder_data.icon
        if folder_data.color is not None:
            folder.color = folder_data.color
        if folder_data.position is not None:
            folder.position = folder_data.position
        if folder_data.is_expanded is not None:
            folder.is_expanded = folder_data.is_expanded
        
        # Handle parent change (move folder)
        if folder_data.parent_id is not None:
            if folder_data.parent_id != folder.parent_id:
                # Validate new parent
                if folder_data.parent_id:
                    parent = FolderService.get_folder(db, folder_data.parent_id, workspace_id)
                    if not parent:
                        raise ValueError("Parent folder not found")
                    
                    # Prevent circular reference
                    if FolderService._is_descendant(db, folder.id, folder_data.parent_id):
                        raise ValueError("Cannot move folder to its own descendant")
                
                folder.parent_id = folder_data.parent_id

        db.commit()
        db.refresh(folder)
        
        return folder

    @staticmethod
    def delete_folder(
        db: Session,
        folder_id: UUID,
        workspace_id: UUID,
        cascade: bool = False
    ) -> None:
        """Delete folder (soft delete)"""
        folder = FolderService.get_folder(db, folder_id, workspace_id)
        if not folder:
            raise ValueError("Folder not found")

        if cascade:
            # Delete all subfolders and documents
            FolderService._delete_folder_recursive(db, folder)
        else:
            # Only delete if empty
            has_children = db.query(Folder).filter(
                Folder.parent_id == folder_id,
                Folder.is_deleted == False
            ).count() > 0
            
            has_documents = db.query(Document).filter(
                Document.folder_id == folder_id,
                Document.is_deleted == False
            ).count() > 0
            
            if has_children or has_documents:
                raise ValueError("Folder is not empty. Use cascade=true to delete with contents.")
            
            folder.is_deleted = True
        
        db.commit()

    @staticmethod
    def move_folder(
        db: Session,
        folder_id: UUID,
        workspace_id: UUID,
        parent_id: Optional[UUID],
        position: Optional[int] = None
    ) -> Folder:
        """Move folder to new parent"""
        folder = FolderService.get_folder(db, folder_id, workspace_id)
        if not folder:
            raise ValueError("Folder not found")

        # Validate new parent
        if parent_id:
            parent = FolderService.get_folder(db, parent_id, workspace_id)
            if not parent:
                raise ValueError("Parent folder not found")
            
            # Prevent circular reference
            if FolderService._is_descendant(db, folder.id, parent_id):
                raise ValueError("Cannot move folder to its own descendant")

        folder.parent_id = parent_id
        
        if position is not None:
            folder.position = position
        else:
            # Set to end
            max_position = db.query(func.max(Folder.position)).filter(
                Folder.workspace_id == workspace_id,
                Folder.parent_id == parent_id,
                Folder.is_deleted == False
            ).scalar() or 0
            folder.position = max_position + 1

        db.commit()
        db.refresh(folder)
        
        return folder

    @staticmethod
    def _is_descendant(db: Session, ancestor_id: UUID, potential_descendant_id: UUID) -> bool:
        """Check if potential_descendant is a descendant of ancestor"""
        folder = db.query(Folder).filter(Folder.id == potential_descendant_id).first()
        if not folder:
            return False
        
        if folder.parent_id == ancestor_id:
            return True
        
        if folder.parent_id:
            return FolderService._is_descendant(db, ancestor_id, folder.parent_id)
        
        return False

    @staticmethod
    def _delete_folder_recursive(db: Session, folder: Folder) -> None:
        """Recursively delete folder and all contents"""
        # Delete all documents in folder
        db.query(Document).filter(
            Document.folder_id == folder.id
        ).update({"is_deleted": True})
        
        # Delete all subfolders
        subfolders = db.query(Folder).filter(
            Folder.parent_id == folder.id,
            Folder.is_deleted == False
        ).all()
        
        for subfolder in subfolders:
            FolderService._delete_folder_recursive(db, subfolder)
        
        # Delete this folder
        folder.is_deleted = True


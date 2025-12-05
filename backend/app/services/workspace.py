"""
Workspace Service
Business logic for workspace and member management
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_
import uuid
import re

from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


class WorkspaceService:
    """Service for handling workspace operations"""
    
    @staticmethod
    def generate_slug(name: str) -> str:
        """
        Generate a URL-friendly slug from workspace name
        
        Args:
            name: Workspace name
            
        Returns:
            URL-friendly slug
        """
        # Convert to lowercase and replace spaces with hyphens
        slug = name.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
        slug = re.sub(r'[-\s]+', '-', slug)   # Replace spaces/multiple hyphens
        slug = slug.strip('-')                 # Remove leading/trailing hyphens
        return slug[:100]  # Limit length
    
    @staticmethod
    def create_workspace(
        db: Session,
        workspace_data: WorkspaceCreate,
        owner_id: uuid.UUID
    ) -> Workspace:
        """
        Create a new workspace
        
        Args:
            db: Database session
            workspace_data: Workspace creation data
            owner_id: User ID of the owner
            
        Returns:
            Created workspace instance
            
        Raises:
            ValueError: If slug already exists
        """
        # Generate slug if not provided
        slug = workspace_data.slug or WorkspaceService.generate_slug(workspace_data.name)
        
        # Check if slug exists
        existing = db.query(Workspace).filter(
            Workspace.slug == slug,
            Workspace.is_deleted == False
        ).first()
        
        if existing:
            # Try with suffix
            counter = 1
            while existing and counter < 100:
                new_slug = f"{slug}-{counter}"
                existing = db.query(Workspace).filter(
                    Workspace.slug == new_slug,
                    Workspace.is_deleted == False
                ).first()
                if not existing:
                    slug = new_slug
                    break
                counter += 1
            
            if existing:
                raise ValueError("Unable to generate unique slug")
        
        # Create workspace
        workspace = Workspace(
            name=workspace_data.name,
            slug=slug,
            description=workspace_data.description,
            owner_id=owner_id,
            is_public=workspace_data.is_public,
        )
        
        try:
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            return workspace
        except IntegrityError as e:
            db.rollback()
            raise ValueError(f"Failed to create workspace: {e}")
    
    @staticmethod
    def get_workspace_by_id(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None
    ) -> Optional[Workspace]:
        """
        Get workspace by ID
        
        Args:
            db: Database session
            workspace_id: Workspace UUID
            user_id: Optional user ID to check access
            
        Returns:
            Workspace if found and accessible, None otherwise
        """
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.is_deleted == False
        ).first()
        
        if not workspace:
            return None
        
        # Check access if user_id provided
        if user_id and not workspace.is_public:
            if workspace.owner_id != user_id and not workspace.is_member(user_id):
                return None
        
        return workspace
    
    @staticmethod
    def get_workspace_by_slug(
        db: Session,
        slug: str,
        user_id: Optional[uuid.UUID] = None
    ) -> Optional[Workspace]:
        """Get workspace by slug with access check"""
        workspace = db.query(Workspace).filter(
            Workspace.slug == slug,
            Workspace.is_deleted == False
        ).first()
        
        if not workspace:
            return None
        
        if user_id and not workspace.is_public:
            if workspace.owner_id != user_id and not workspace.is_member(user_id):
                return None
        
        return workspace
    
    @staticmethod
    def get_user_workspaces(
        db: Session,
        user_id: uuid.UUID,
        include_archived: bool = False,
        page: int = 1,
        page_size: int = 50
    ) -> Tuple[List[Workspace], int]:
        """
        Get all workspaces accessible by a user
        
        Args:
            db: Database session
            user_id: User UUID
            include_archived: Whether to include archived workspaces
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (workspaces list, total count)
        """
        query = db.query(Workspace).filter(
            and_(
                Workspace.is_deleted == False,
                or_(
                    Workspace.owner_id == user_id,
                    Workspace.id.in_(
                        db.query(WorkspaceMember.workspace_id).filter(
                            WorkspaceMember.user_id == user_id,
                            WorkspaceMember.is_deleted == False
                        )
                    )
                )
            )
        )
        
        if not include_archived:
            query = query.filter(Workspace.is_archived == False)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        workspaces = query.order_by(Workspace.updated_at.desc()).offset(offset).limit(page_size).all()
        
        return workspaces, total
    
    @staticmethod
    def update_workspace(
        db: Session,
        workspace_id: uuid.UUID,
        workspace_data: WorkspaceUpdate,
        user_id: uuid.UUID
    ) -> Optional[Workspace]:
        """
        Update workspace
        
        Requires admin permissions
        """
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            return None
        
        # Check permissions
        if not workspace.can_user_admin(user_id):
            raise PermissionError("User does not have admin permissions")
        
        # Update fields
        if workspace_data.name is not None:
            workspace.name = workspace_data.name
        if workspace_data.description is not None:
            workspace.description = workspace_data.description
        if workspace_data.is_public is not None:
            workspace.is_public = workspace_data.is_public
        if workspace_data.is_archived is not None:
            workspace.is_archived = workspace_data.is_archived
        
        db.commit()
        db.refresh(workspace)
        return workspace
    
    @staticmethod
    def delete_workspace(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Soft delete workspace (owner only)
        
        Args:
            db: Database session
            workspace_id: Workspace UUID
            user_id: User UUID
            
        Returns:
            True if deleted, False if not found or not owner
        """
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            return False
        
        # Only owner can delete
        if workspace.owner_id != user_id:
            raise PermissionError("Only workspace owner can delete")
        
        workspace.soft_delete()
        db.commit()
        return True
    
    @staticmethod
    def add_member(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        member_user_id: uuid.UUID,
        role: WorkspaceRole = WorkspaceRole.VIEWER
    ) -> WorkspaceMember:
        """
        Add a member to workspace
        
        Requires admin permissions
        """
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        # Check permissions
        if not workspace.can_user_admin(user_id):
            raise PermissionError("User does not have admin permissions")
        
        # Check if already a member
        existing = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == member_user_id,
            WorkspaceMember.is_deleted == False
        ).first()
        
        if existing:
            raise ValueError("User is already a member")
        
        # Create member
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=member_user_id,
            role=role,
            invited_by_id=user_id
        )
        member.accept_invitation()  # Auto-accept for now
        
        db.add(member)
        db.commit()
        db.refresh(member)
        return member
    
    @staticmethod
    def update_member_role(
        db: Session,
        workspace_id: uuid.UUID,
        member_id: uuid.UUID,
        user_id: uuid.UUID,
        new_role: WorkspaceRole
    ) -> Optional[WorkspaceMember]:
        """
        Update a member's role
        
        Requires admin permissions
        """
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            return None
        
        # Check permissions
        if not workspace.can_user_admin(user_id):
            raise PermissionError("User does not have admin permissions")
        
        # Get member
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.is_deleted == False
        ).first()
        
        if not member:
            return None
        
        # Cannot change owner's role
        if member.user_id == workspace.owner_id:
            raise PermissionError("Cannot change owner's role")
        
        member.change_role(new_role)
        db.commit()
        db.refresh(member)
        return member
    
    @staticmethod
    def remove_member(
        db: Session,
        workspace_id: uuid.UUID,
        member_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Remove a member from workspace
        
        Requires admin permissions
        """
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            return False
        
        # Check permissions
        if not workspace.can_user_admin(user_id):
            raise PermissionError("User does not have admin permissions")
        
        # Get member
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.is_deleted == False
        ).first()
        
        if not member:
            return False
        
        # Cannot remove owner
        if member.user_id == workspace.owner_id:
            raise PermissionError("Cannot remove workspace owner")
        
        member.soft_delete()
        db.commit()
        return True
    
    @staticmethod
    def get_workspace_members(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> List[WorkspaceMember]:
        """Get all members of a workspace"""
        workspace = WorkspaceService.get_workspace_by_id(db, workspace_id, user_id)
        
        if not workspace:
            return []
        
        return db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.is_deleted == False
        ).all()


"""
Workspace Member Service
========================

Business logic for workspace membership management.

Architecture:
- Service layer raises ValueError for business logic errors
- Router layer converts to HTTP exceptions (403, 404, 409, etc.)
- Database layer uses async SQLAlchemy

Role Hierarchy: owner > admin > editor > viewer
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.models.user import User
from app.services.audit_service import AuditService


class WorkspaceMemberService:
    """
    Service for managing workspace memberships.
    
    Invariants:
    - Every workspace has at least one owner
    - Owner role cannot be removed (only transferred)
    - Only owner can delete workspace
    - Only owner/admin can manage members
    """
    
    @staticmethod
    async def assert_workspace_role(
        db: AsyncSession,
        user_id: UUID,
        workspace_id: UUID,
        required_role: WorkspaceRole
    ) -> WorkspaceRole:
        """
        Assert user has required workspace role.
        
        Args:
            db: Database session
            user_id: User requesting action
            workspace_id: Workspace to check
            required_role: Minimum required role
            
        Returns:
            User's actual role (>= required_role)
            
        Raises:
            ValueError: If user lacks required role or not a member
        """
        # Get user's role in workspace
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active"
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise ValueError("Forbidden: Not a workspace member")
        
        if membership.role < required_role:
            raise ValueError(f"Forbidden: Requires {required_role.value} role")
        
        return membership.role
    
    @staticmethod
    async def get_workspace_role(
        db: AsyncSession,
        user_id: UUID,
        workspace_id: UUID
    ) -> Optional[WorkspaceRole]:
        """
        Get user's role in a workspace (for permission resolution).
        
        Returns:
            WorkspaceRole if member, None if not a member
        """
        result = await db.execute(
            select(WorkspaceMember.role)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active"
            )
        )
        role = result.scalar_one_or_none()
        return role
    
    @staticmethod
    async def add_member(
        db: AsyncSession,
        workspace_id: UUID,
        user_id: UUID,
        role: WorkspaceRole,
        granted_by: UUID,
        expires_at: Optional[datetime] = None
    ) -> WorkspaceMember:
        """
        Add a member to a workspace.
        
        Args:
            db: Database session
            workspace_id: Workspace to add member to
            user_id: User to add
            role: Role to grant (cannot be OWNER)
            granted_by: User granting membership
            expires_at: Optional expiry
            
        Returns:
            Created WorkspaceMember
            
        Raises:
            ValueError: If workspace not found, user not found, role is OWNER,
                       or member already exists
        """
        # Validate workspace exists
        workspace = await db.get(Workspace, workspace_id)
        if not workspace or workspace.is_deleted:
            raise ValueError("Workspace not found")
        
        # Validate user exists
        user = await db.get(User, user_id)
        if not user or user.is_deleted:
            raise ValueError("User not found")
        
        # Cannot grant owner role via add_member
        if role == WorkspaceRole.OWNER:
            raise ValueError("Cannot grant owner role. Use transfer_ownership instead.")
        
        # Check if member already exists
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing and existing.status == "active":
            raise ValueError("User is already a member")
        
        # Create membership
        membership = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
            granted_by=granted_by,
            granted_at=datetime.utcnow(),
            expires_at=expires_at,
            status="active"
        )
        
        db.add(membership)
        await db.flush()
        
        # Audit log
        await AuditService.create_audit_log(
            db=db,
            actor_id=granted_by,
            action="workspace_member_added",
            log_metadata={
                "workspace_id": str(workspace_id),
                "user_id": str(user_id),
                "role": role.value
            }
        )
        
        return membership
    
    @staticmethod
    async def list_members(
        db: AsyncSession,
        workspace_id: UUID
    ) -> List[WorkspaceMember]:
        """
        List all active members of a workspace.
        
        Args:
            db: Database session
            workspace_id: Workspace to list members for
            
        Returns:
            List of WorkspaceMember (with user relationship loaded)
        """
        result = await db.execute(
            select(WorkspaceMember)
            .options(joinedload(WorkspaceMember.user))
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.status == "active"
            )
            .order_by(
                # Owner first, then by role, then by name
                WorkspaceMember.role.desc(),
                WorkspaceMember.granted_at
            )
        )
        members = result.scalars().all()
        return list(members)
    
    @staticmethod
    async def remove_member(
        db: AsyncSession,
        workspace_id: UUID,
        user_id: UUID,
        removed_by: UUID
    ) -> None:
        """
        Remove a member from a workspace.
        
        Args:
            db: Database session
            workspace_id: Workspace to remove member from
            user_id: User to remove
            removed_by: User performing removal
            
        Raises:
            ValueError: If member not found or trying to remove owner
        """
        # Get membership
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active"
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise ValueError("Member not found")
        
        # Cannot remove owner
        if membership.role == WorkspaceRole.OWNER:
            raise ValueError("Cannot remove workspace owner. Transfer ownership first.")
        
        # Revoke membership
        membership.status = "revoked"
        membership.updated_at = datetime.utcnow()
        
        await db.flush()
        
        # Audit log
        await AuditService.create_audit_log(
            db=db,
            actor_id=removed_by,
            action="workspace_member_removed",
            log_metadata={
                "workspace_id": str(workspace_id),
                "user_id": str(user_id),
                "previous_role": membership.role.value
            }
        )
    
    @staticmethod
    async def change_member_role(
        db: AsyncSession,
        workspace_id: UUID,
        user_id: UUID,
        new_role: WorkspaceRole,
        changed_by: UUID
    ) -> WorkspaceMember:
        """
        Change a member's role.
        
        Args:
            db: Database session
            workspace_id: Workspace
            user_id: User whose role to change
            new_role: New role (cannot be OWNER)
            changed_by: User performing change
            
        Returns:
            Updated WorkspaceMember
            
        Raises:
            ValueError: If member not found, new_role is OWNER, or trying to change owner
        """
        # Get membership
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active"
            )
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            raise ValueError("Member not found")
        
        # Cannot change owner role
        if membership.role == WorkspaceRole.OWNER:
            raise ValueError("Cannot change owner role. Use transfer_ownership instead.")
        
        # Cannot change to owner role
        if new_role == WorkspaceRole.OWNER:
            raise ValueError("Cannot promote to owner. Use transfer_ownership instead.")
        
        old_role = membership.role
        membership.role = new_role
        membership.updated_at = datetime.utcnow()
        
        await db.flush()
        
        # Audit log
        await AuditService.create_audit_log(
            db=db,
            actor_id=changed_by,
            action="workspace_member_role_changed",
            log_metadata={
                "workspace_id": str(workspace_id),
                "user_id": str(user_id),
                "old_role": old_role.value,
                "new_role": new_role.value
            }
        )
        
        return membership
    
    @staticmethod
    async def transfer_ownership(
        db: AsyncSession,
        workspace_id: UUID,
        new_owner_id: UUID,
        current_owner_id: UUID,
        demote_current_owner_to: WorkspaceRole = WorkspaceRole.ADMIN
    ) -> None:
        """
        Transfer workspace ownership.
        
        Args:
            db: Database session
            workspace_id: Workspace
            new_owner_id: User to make new owner
            current_owner_id: Current owner (for verification)
            demote_current_owner_to: Role to demote current owner to
            
        Raises:
            ValueError: If current owner is not owner, new owner not found, etc.
        """
        # Validate current owner
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_owner_id,
                WorkspaceMember.status == "active"
            )
        )
        current_owner_membership = result.scalar_one_or_none()
        
        if not current_owner_membership or current_owner_membership.role != WorkspaceRole.OWNER:
            raise ValueError("Forbidden: Only owner can transfer ownership")
        
        # Get new owner membership (or validate user exists)
        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == new_owner_id,
                WorkspaceMember.status == "active"
            )
        )
        new_owner_membership = result.scalar_one_or_none()
        
        # If new owner is not a member, validate user exists
        if not new_owner_membership:
            new_user = await db.get(User, new_owner_id)
            if not new_user or new_user.is_deleted:
                raise ValueError("New owner not found")
            
            # Add as member with owner role
            new_owner_membership = WorkspaceMember(
                workspace_id=workspace_id,
                user_id=new_owner_id,
                role=WorkspaceRole.OWNER,
                granted_by=current_owner_id,
                granted_at=datetime.utcnow(),
                status="active"
            )
            db.add(new_owner_membership)
        else:
            # Promote existing member to owner
            new_owner_membership.role = WorkspaceRole.OWNER
            new_owner_membership.updated_at = datetime.utcnow()
        
        # Demote current owner
        current_owner_membership.role = demote_current_owner_to
        current_owner_membership.updated_at = datetime.utcnow()
        
        # Update workspace.owner_id (if that column exists - depends on design)
        workspace = await db.get(Workspace, workspace_id)
        if workspace:
            workspace.owner_id = new_owner_id
            workspace.updated_at = datetime.utcnow()
        
        await db.flush()
        
        # Audit log
        await AuditService.create_audit_log(
            db=db,
            actor_id=current_owner_id,
            action="workspace_ownership_transferred",
            log_metadata={
                "workspace_id": str(workspace_id),
                "previous_owner_id": str(current_owner_id),
                "new_owner_id": str(new_owner_id),
                "demoted_to": demote_current_owner_to.value
            }
        )
    
    @staticmethod
    async def get_user_workspaces(
        db: AsyncSession,
        user_id: UUID
    ) -> List[tuple[Workspace, WorkspaceRole]]:
        """
        Get all workspaces a user is a member of.
        
        Args:
            db: Database session
            user_id: User to get workspaces for
            
        Returns:
            List of (Workspace, WorkspaceRole) tuples
        """
        result = await db.execute(
            select(Workspace, WorkspaceMember.role)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active",
                Workspace.is_deleted == False
            )
            .order_by(Workspace.created_at.desc())
        )
        return list(result.all())


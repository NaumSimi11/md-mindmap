"""
Share Service
=============

Pattern: Three-Layer Architecture (Service layer)
Purpose: Document sharing, invitations, and permission management

Role Hierarchy (highest to lowest):
- owner > admin > editor > commenter > viewer

Permission Resolution (Phase 4 - Workspace Permissions):
- Workspace roles cascade to documents (via access_model=inherited)
- Restricted docs ignore workspace membership (access_model=restricted)
- effective_role = max(workspace_role, doc_role) for inherited docs
"""

from typing import Optional, List, Tuple
from uuid import UUID
import secrets
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload

from app.models.document_share import DocumentShare
from app.models.invitation import Invitation
from app.models.user import User
from app.models.document import Document, DocumentAccessModel
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.services.audit_service import AuditService, log_invite_sent, log_role_changed


# ============================================================================
# Role Hierarchy
# ============================================================================

ROLE_HIERARCHY = {
    'owner': 5,
    'admin': 4,
    'editor': 3,
    'commenter': 2,
    'viewer': 1
}

WORKSPACE_ROLE_TO_DOC_ROLE = {
    WorkspaceRole.OWNER: 'owner',
    WorkspaceRole.ADMIN: 'admin',
    WorkspaceRole.EDITOR: 'editor',
    WorkspaceRole.VIEWER: 'viewer'
}


def role_level(role: str) -> int:
    """Get numeric level for role (higher = more permissions)"""
    return ROLE_HIERARCHY.get(role, 0)


def role_ge(user_role: str, required_role: str) -> bool:
    """Check if user role >= required role"""
    return role_level(user_role) >= role_level(required_role)


def max_role(role1: Optional[str], role2: Optional[str]) -> Optional[str]:
    """Return the higher of two roles (or None if both are None)"""
    if role1 is None and role2 is None:
        return None
    if role1 is None:
        return role2
    if role2 is None:
        return role1
    return role1 if role_level(role1) >= role_level(role2) else role2


# ============================================================================
# Share Service
# ============================================================================

class ShareService:
    """
    Service for document sharing and permissions
    """
    
    @staticmethod
    async def assert_role(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        min_role: str
    ) -> str:
        """
        Assert user has minimum role for document.
        
        Permission Resolution (Phase 4 - Workspace Permissions):
        1. Get document and check access_model
        2. If restricted: only doc shares (+ creator)
        3. If inherited: max(workspace_role, doc_role)
        
        Args:
            db: Database session
            document_id: Document ID
            user_id: User ID
            min_role: Minimum required role
            
        Returns:
            User's effective role (string)
            
        Raises:
            ValueError: If user doesn't have sufficient permissions
        """
        # Step 0: Get document
        doc = await db.get(Document, document_id)
        if not doc or doc.is_deleted:
            raise ValueError("Document not found")
        
        # Step 1: Get workspace role (if member)
        workspace_role_str: Optional[str] = None
        result = await db.execute(
            select(WorkspaceMember.role)
            .where(
                WorkspaceMember.workspace_id == doc.workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active"
            )
        )
        workspace_role = result.scalar_one_or_none()
        if workspace_role:
            workspace_role_str = WORKSPACE_ROLE_TO_DOC_ROLE.get(workspace_role)
        
        # Step 2: Get document share role
        doc_role: Optional[str] = None
        result = await db.execute(
            select(DocumentShare.role)
            .where(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == user_id,
                DocumentShare.status == 'active'
            )
        )
        doc_role = result.scalar_one_or_none()
        
        # Step 3: Resolve effective role based on access_model
        effective_role: Optional[str] = None
        
        if doc.access_model == DocumentAccessModel.RESTRICTED:
            # Restricted: only doc shares (+ creator)
            if user_id == doc.created_by_id:
                effective_role = 'owner'
            else:
                effective_role = doc_role
        else:
            # Inherited (default): max(workspace_role, doc_role)
            effective_role = max_role(workspace_role_str, doc_role)
        
        # Step 4: Check if user has access
        if effective_role is None:
            raise ValueError("Forbidden: No access to this document")
        
        # Step 5: Check if user has required role
        if not role_ge(effective_role, min_role):
            raise ValueError(f"Forbidden: Requires {min_role} role (you have: {effective_role})")
        
        return effective_role
    
    @staticmethod
    async def get_user_role(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID
    ) -> Optional[str]:
        """
        Get user's role for document (returns None if no access)
        """
        query = select(DocumentShare.role).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == user_id,
                DocumentShare.status == 'active'
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_members(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID
    ) -> Tuple[List[DocumentShare], List[Invitation]]:
        """
        List document members and pending invitations
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User requesting list
            
        Returns:
            Tuple of (members, pending_invitations)
            
        Raises:
            ValueError: If actor doesn't have permission
        """
        # Check permission (viewer+ can see members)
        await ShareService.assert_role(db, document_id, actor_id, 'viewer')
        
        # Get members
        members_query = select(DocumentShare).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.status == 'active'
            )
        ).options(joinedload(DocumentShare.granted_by_user))
        
        members_result = await db.execute(members_query)
        members = members_result.scalars().all()
        
        # Get pending invitations
        invites_query = select(Invitation).where(
            and_(
                Invitation.document_id == document_id,
                Invitation.status == 'pending'
            )
        ).options(joinedload(Invitation.inviter))
        
        invites_result = await db.execute(invites_query)
        invitations = invites_result.scalars().all()
        
        return members, invitations
    
    @staticmethod
    async def create_invitations(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        emails: List[str],
        role: str,
        message: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        send_email: bool = True
    ) -> List[Invitation]:
        """
        Create invitations for users
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User sending invitations
            emails: List of email addresses
            role: Role to grant
            message: Optional invite message
            expires_at: Optional expiration
            send_email: Whether to send email notification
            
        Returns:
            List of created Invitation objects
            
        Raises:
            ValueError: If actor doesn't have permission or invalid role
        """
        # Check permission (owner/admin can invite, optionally editor)
        actor_role = await ShareService.assert_role(db, document_id, actor_id, 'admin')
        
        # Validate: cannot invite to higher role than inviter
        if not role_ge(actor_role, role):
            raise ValueError(f"Cannot invite to role '{role}' (higher than your role '{actor_role}')")
        
        # Fetch actor (inviter) info for email
        actor_query = select(User).where(User.id == actor_id)
        actor_result = await db.execute(actor_query)
        actor = actor_result.scalar_one_or_none()
        inviter_name = actor.full_name or actor.email.split("@")[0] if actor else "Someone"
        
        # Fetch document info for email
        doc_query = select(Document).where(Document.id == document_id)
        doc_result = await db.execute(doc_query)
        doc = doc_result.scalar_one_or_none()
        document_title = doc.title if doc else "Untitled Document"
        
        # Default expiration: 30 days
        if not expires_at:
            expires_at = datetime.utcnow() + timedelta(days=30)
        
        invitations = []
        
        for email in emails:
            # Generate secure token
            token = secrets.token_urlsafe(32)
            
            # Create invitation
            invitation = Invitation(
                document_id=document_id,
                email=email,
                invited_by=actor_id,
                role=role,
                token=token,
                status='pending',
                message=message,
                expires_at=expires_at
            )
            
            db.add(invitation)
            invitations.append(invitation)
            
            # Audit log
            await log_invite_sent(db, actor_id, document_id, email, role)
        
        await db.flush()
        
        # Optionally send email notifications
        if send_email:
            # Local import to avoid circular dependency at import time
            from app.services.email_service import email_service

            for invitation in invitations:
                # Fire-and-forget to avoid blocking the main request too much.
                # Errors are logged server-side by the email backend.
                try:
                    asyncio.create_task(
                        email_service.send_invitation_email(
                            invitation,
                            inviter_name=inviter_name,
                            document_title=document_title,
                        )
                    )
                except RuntimeError:
                    # No running loop (e.g. script usage) – degrade gracefully.
                    await email_service.send_invitation_email(
                        invitation,
                        inviter_name=inviter_name,
                        document_title=document_title,
                    )
        
        return invitations
    
    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        token: str,
        user_id: UUID
    ) -> Tuple[Invitation, DocumentShare]:
        """
        Accept invitation
        
        Args:
            db: Database session
            token: Invitation token
            user_id: User accepting invitation
            
        Returns:
            Tuple of (Invitation, created DocumentShare)
            
        Raises:
            ValueError: If invitation not found, expired, or invalid
        """
        # Find invitation
        query = select(Invitation).where(
            Invitation.token == token
        )
        result = await db.execute(query)
        invitation = result.scalar_one_or_none()
        
        if not invitation:
            raise ValueError("Invitation not found")
        
        if invitation.status != 'pending':
            raise ValueError(f"Invitation already {invitation.status}")
        
        if invitation.expires_at and invitation.expires_at < datetime.utcnow():
            raise ValueError("Invitation has expired")
        
        # Get user email to verify match
        user_query = select(User).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        # Verify email matches (case-insensitive)
        if user.email.lower() != invitation.email.lower():
            raise ValueError("Invitation email does not match your account")
        
        # Create document share
        share = DocumentShare(
            document_id=invitation.document_id,
            principal_type='user',
            principal_id=user_id,
            role=invitation.role,
            granted_by=invitation.invited_by,
            status='active'
        )
        
        db.add(share)
        
        # Update invitation
        invitation.status = 'accepted'
        invitation.accepted_at = datetime.utcnow()
        
        await db.flush()
        
        # Audit log
        await AuditService.log_action(
            db,
            action='invite_accepted',
            actor_id=user_id,
            document_id=invitation.document_id,
            metadata={"invitation_id": str(invitation.id), "role": invitation.role}
        )
        
        return invitation, share
    
    @staticmethod
    async def decline_invitation(
        db: AsyncSession,
        token: str,
        user_id: UUID
    ) -> Invitation:
        """
        Decline invitation
        """
        # Find invitation
        query = select(Invitation).where(
            Invitation.token == token
        )
        result = await db.execute(query)
        invitation = result.scalar_one_or_none()
        
        if not invitation:
            raise ValueError("Invitation not found")
        
        if invitation.status != 'pending':
            raise ValueError(f"Invitation already {invitation.status}")
        
        # Update invitation
        invitation.status = 'declined'
        
        await db.flush()
        
        # Audit log
        await AuditService.log_action(
            db,
            action='invite_declined',
            actor_id=user_id,
            document_id=invitation.document_id,
            metadata={"invitation_id": str(invitation.id)}
        )
        
        return invitation
    
    @staticmethod
    async def remove_member(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        member_id: UUID
    ):
        """
        Remove member from document
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User removing member
            member_id: User to remove
            
        Raises:
            ValueError: If actor doesn't have permission or trying to remove owner
        """
        # Check permission (owner/admin can remove)
        actor_role = await ShareService.assert_role(db, document_id, actor_id, 'admin')
        
        # Get member share
        member_query = select(DocumentShare).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == member_id,
                DocumentShare.status == 'active'
            )
        )
        member_result = await db.execute(member_query)
        member_share = member_result.scalar_one_or_none()
        
        if not member_share:
            raise ValueError("Member not found")
        
        # Cannot remove owner (must transfer first)
        if member_share.role == 'owner':
            raise ValueError("Cannot remove owner. Transfer ownership first.")
        
        # Cannot remove self if owner (must transfer first)
        if actor_id == member_id and actor_role == 'owner':
            raise ValueError("Owner cannot remove themselves. Transfer ownership first.")
        
        # Revoke share
        member_share.status = 'revoked'
        
        await db.flush()
        
        # Audit log
        await AuditService.log_action(
            db,
            action='member_removed',
            actor_id=actor_id,
            document_id=document_id,
            metadata={"member_id": str(member_id), "role": member_share.role}
        )
    
    @staticmethod
    async def change_member_role(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        member_id: UUID,
        new_role: str
    ):
        """
        Change member role
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User changing role
            member_id: User whose role to change
            new_role: New role to assign
            
        Raises:
            ValueError: If actor doesn't have permission or invalid role
        """
        # Check permission (owner/admin can change roles)
        actor_role = await ShareService.assert_role(db, document_id, actor_id, 'admin')
        
        # Get member share
        member_query = select(DocumentShare).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == member_id,
                DocumentShare.status == 'active'
            )
        )
        member_result = await db.execute(member_query)
        member_share = member_result.scalar_one_or_none()
        
        if not member_share:
            raise ValueError("Member not found")
        
        # Cannot change role to higher than actor's role
        if not role_ge(actor_role, new_role):
            raise ValueError(f"Cannot assign role '{new_role}' (higher than your role '{actor_role}')")
        
        # Only owner can promote to owner
        if new_role == 'owner' and actor_role != 'owner':
            raise ValueError("Only owner can promote to owner")
        
        old_role = member_share.role
        member_share.role = new_role
        
        await db.flush()
        
        # Audit log
        await log_role_changed(db, actor_id, document_id, member_id, old_role, new_role)
    
    @staticmethod
    async def transfer_ownership(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        new_owner_id: UUID
    ):
        """
        Transfer document ownership
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: Current owner
            new_owner_id: New owner
            
        Raises:
            ValueError: If actor is not owner or new owner not found
        """
        # Check permission (only owner can transfer)
        actor_role = await ShareService.assert_role(db, document_id, actor_id, 'owner')
        
        # assert_role already checks for 'owner', so if we're here, actor is owner
        # No need for additional check
        
        # Get actor's share to update it
        actor_query = select(DocumentShare).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == actor_id,
                DocumentShare.status == 'active'
            )
        )
        actor_result = await db.execute(actor_query)
        actor_share_obj = actor_result.scalar_one_or_none()
        
        # Get new owner share
        new_owner_query = select(DocumentShare).where(
            and_(
                DocumentShare.document_id == document_id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == new_owner_id,
                DocumentShare.status == 'active'
            )
        )
        new_owner_result = await db.execute(new_owner_query)
        new_owner_share = new_owner_result.scalar_one_or_none()
        
        if not new_owner_share:
            raise ValueError("New owner must already have access to document")
        
        # Transfer: old owner becomes admin, new owner becomes owner
        if actor_share_obj:
            actor_share_obj.role = 'admin'
        new_owner_share.role = 'owner'
        
        await db.flush()
        
        # Audit log
        await AuditService.log_action(
            db,
            action='ownership_transferred',
            actor_id=actor_id,
            document_id=document_id,
            metadata={
                "old_owner_id": str(actor_id),
                "new_owner_id": str(new_owner_id)
            }
        )
    
    @staticmethod
    async def list_shared_with_me_documents(
        db: AsyncSession,
        user_id: UUID
    ) -> List[Document]:
        """
        Lists documents where the user has explicit document_shares but is not a workspace member,
        or documents with access_model='restricted' where the user has an explicit doc_share.
        
        This implements the "Shared with me" view.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of documents explicitly shared with the user
        """
        # Subquery to find workspaces the user is a member of
        user_workspace_memberships_sq = select(WorkspaceMember.workspace_id).where(
            and_(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == 'active'
            )
        ).subquery()
        
        # Query for documents where:
        # 1. User has an explicit document share AND
        # 2. EITHER the document is restricted OR the user is NOT a member of the document's workspace
        query = select(Document).distinct(Document.id).join(
            DocumentShare,
            and_(
                DocumentShare.document_id == Document.id,
                DocumentShare.principal_type == 'user',
                DocumentShare.principal_id == user_id,
                DocumentShare.status == 'active'
            )
        ).where(
            and_(
                Document.is_deleted == False,
                or_(
                    Document.access_model == DocumentAccessModel.RESTRICTED,
                    ~Document.workspace_id.in_(select(user_workspace_memberships_sq))
                )
            )
        ).options(
            joinedload(Document.workspace),
            joinedload(Document.created_by)
        )
        
        result = await db.execute(query)
        return list(result.scalars().unique().all())


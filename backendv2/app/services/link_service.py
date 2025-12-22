"""
Link Service
============

Pattern: Three-Layer Architecture (Service layer)
Purpose: Share link management with tokens, expiry, and password protection
"""

from typing import Optional, List
from uuid import UUID
import secrets
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
import bcrypt

from app.models.share_link import ShareLink
from app.services.share_service import ShareService
from app.services.audit_service import log_link_created


class LinkService:
    """
    Service for share link management
    """
    
    @staticmethod
    async def create_share_link(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        mode: str = 'view',
        expires_at: Optional[datetime] = None,
        max_uses: Optional[int] = None,
        password: Optional[str] = None
    ) -> ShareLink:
        """
        Create share link with secure token
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User creating link
            mode: Access mode ('view', 'comment', 'edit')
            expires_at: Optional expiration timestamp
            max_uses: Optional maximum uses (null = unlimited)
            password: Optional password protection
            
        Returns:
            Created ShareLink
            
        Raises:
            ValueError: If actor doesn't have permission
        """
        # Check permission (owner/admin can create links, optionally editor)
        # For now: owner/admin only (product decision)
        await ShareService.assert_role(db, document_id, actor_id, 'admin')
        
        # Validate mode
        valid_modes = ['view', 'comment', 'edit']
        if mode not in valid_modes:
            raise ValueError(f"Mode must be one of: {', '.join(valid_modes)}")
        
        # Default expiration: 30 days
        if not expires_at:
            expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Generate secure token (32 bytes = 256 bits)
        token = secrets.token_urlsafe(32)
        
        # Hash password if provided
        password_hash = None
        if password:
            # Bcrypt hash (UTF-8 encoded)
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Create share link
        link = ShareLink(
            document_id=document_id,
            token=token,
            mode=mode,
            password_hash=password_hash,
            max_uses=max_uses,
            uses_count=0,
            created_by=actor_id,
            expires_at=expires_at
        )
        
        db.add(link)
        await db.flush()
        
        # Audit log
        await log_link_created(db, actor_id, document_id, link.id, mode)
        
        return link
    
    @staticmethod
    async def list_share_links(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID
    ) -> List[ShareLink]:
        """
        List share links for document
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User requesting list
            
        Returns:
            List of ShareLink objects
            
        Raises:
            ValueError: If actor doesn't have permission
        """
        # Check permission (viewer+ can see links)
        await ShareService.assert_role(db, document_id, actor_id, 'viewer')
        
        # Get all links (including revoked for audit purposes)
        query = select(ShareLink).where(
            ShareLink.document_id == document_id
        ).order_by(ShareLink.created_at.desc())
        
        result = await db.execute(query)
        links = result.scalars().all()
        
        return links
    
    @staticmethod
    async def revoke_share_link(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        link_id: UUID
    ):
        """
        Revoke share link
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User revoking link
            link_id: Link ID to revoke
            
        Raises:
            ValueError: If actor doesn't have permission or link not found
        """
        # Check permission (owner/admin can revoke)
        await ShareService.assert_role(db, document_id, actor_id, 'admin')
        
        # Get link
        query = select(ShareLink).where(
            and_(
                ShareLink.id == link_id,
                ShareLink.document_id == document_id
            )
        )
        result = await db.execute(query)
        link = result.scalar_one_or_none()
        
        if not link:
            raise ValueError("Share link not found")
        
        if link.revoked_at:
            raise ValueError("Share link already revoked")
        
        # Revoke link
        link.revoked_at = datetime.utcnow()
        
        await db.flush()
        
        # Audit log
        from app.services.audit_service import AuditService
        await AuditService.log_action(
            db,
            action='link_revoked',
            actor_id=actor_id,
            document_id=document_id,
            metadata={"link_id": str(link_id), "mode": link.mode}
        )
    
    @staticmethod
    async def validate_share_link(
        db: AsyncSession,
        token: str,
        password: Optional[str] = None
    ) -> dict:
        """
        Validate share link and increment usage count
        
        Args:
            db: Database session
            token: Share link token
            password: Optional password (if link is protected)
            
        Returns:
            Dict with validation result:
            {
                "valid": bool,
                "document_id": UUID or None,
                "mode": str or None,
                "reason": str or None  # if invalid
            }
        """
        # Find link by token
        query = select(ShareLink).where(
            ShareLink.token == token
        )
        result = await db.execute(query)
        link = result.scalar_one_or_none()
        
        if not link:
            return {
                "valid": False,
                "document_id": None,
                "mode": None,
                "reason": "invalid_token"
            }
        
        # Check if revoked
        if link.revoked_at:
            return {
                "valid": False,
                "document_id": link.document_id,
                "mode": None,
                "reason": "revoked"
            }
        
        # Check if expired
        if link.expires_at and link.expires_at < datetime.utcnow():
            return {
                "valid": False,
                "document_id": link.document_id,
                "mode": None,
                "reason": "expired"
            }
        
        # Check max uses
        if link.max_uses is not None and link.uses_count >= link.max_uses:
            return {
                "valid": False,
                "document_id": link.document_id,
                "mode": None,
                "reason": "max_uses_exceeded"
            }
        
        # Check password if protected
        if link.password_hash:
            if not password:
                return {
                    "valid": False,
                    "document_id": link.document_id,
                    "mode": None,
                    "reason": "password_required"
                }
            
            # Verify password
            password_match = bcrypt.checkpw(
                password.encode('utf-8'),
                link.password_hash.encode('utf-8')
            )
            
            if not password_match:
                return {
                    "valid": False,
                    "document_id": link.document_id,
                    "mode": None,
                    "reason": "invalid_password"
                }
        
        # Valid! Increment usage count atomically
        await db.execute(
            update(ShareLink)
            .where(ShareLink.id == link.id)
            .values(uses_count=ShareLink.uses_count + 1)
        )
        await db.flush()
        
        # Audit log (link used)
        from app.services.audit_service import AuditService
        await AuditService.log_action(
            db,
            action='link_used',
            actor_id=None,  # Guest/anonymous
            document_id=link.document_id,
            metadata={"link_id": str(link.id), "mode": link.mode, "uses_count": link.uses_count + 1}
        )
        
        return {
            "valid": True,
            "document_id": link.document_id,
            "mode": link.mode,
            "reason": None
        }


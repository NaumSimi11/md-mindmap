"""
Audit Service
=============

Pattern: Three-Layer Architecture (Service layer)
Purpose: Audit logging for sharing, permissions, and snapshot actions
"""

from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.models.audit_log import AuditLog
from app.schemas.audit import AuditAction


class AuditService:
    """
    Service for audit logging
    
    Provides simple API for logging actions with metadata
    """
    
    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        actor_id: Optional[UUID] = None,
        document_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Log an action to audit trail
        
        Args:
            db: Database session
            action: Action type (e.g., 'invite_sent', 'role_changed')
            actor_id: User who performed action (null for system)
            document_id: Document affected (null for workspace-level)
            metadata: Free-form metadata dict
            
        Returns:
            Created AuditLog entry
        """
        log_entry = AuditLog(
            actor_id=actor_id,
            document_id=document_id,
            action=action,
            log_metadata=metadata or {}
        )
        
        db.add(log_entry)
        await db.flush()
        
        return log_entry
    
    @staticmethod
    async def get_document_logs(
        db: AsyncSession,
        document_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[list[AuditLog], int]:
        """
        Get audit logs for a document
        
        Args:
            db: Database session
            document_id: Document ID
            limit: Maximum number of logs to return
            offset: Pagination offset
            
        Returns:
            Tuple of (logs, total_count)
        """
        # Query logs
        query = select(AuditLog).where(
            AuditLog.document_id == document_id
        ).order_by(
            desc(AuditLog.created_at)
        ).limit(limit).offset(offset)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Count total
        count_query = select(AuditLog).where(
            AuditLog.document_id == document_id
        )
        count_result = await db.execute(count_query)
        total = len(count_result.scalars().all())
        
        return logs, total


# ============================================================================
# Convenience functions for common audit actions
# ============================================================================

async def log_invite_sent(
    db: AsyncSession,
    actor_id: UUID,
    document_id: UUID,
    email: str,
    role: str
):
    """Log invitation sent"""
    await AuditService.log_action(
        db,
        action=AuditAction.INVITE_SENT,
        actor_id=actor_id,
        document_id=document_id,
        metadata={"email": email, "role": role}
    )


async def log_role_changed(
    db: AsyncSession,
    actor_id: UUID,
    document_id: UUID,
    member_id: UUID,
    old_role: str,
    new_role: str
):
    """Log role change"""
    await AuditService.log_action(
        db,
        action=AuditAction.ROLE_CHANGED,
        actor_id=actor_id,
        document_id=document_id,
        metadata={
            "member_id": str(member_id),
            "old_role": old_role,
            "new_role": new_role
        }
    )


async def log_link_created(
    db: AsyncSession,
    actor_id: UUID,
    document_id: UUID,
    link_id: UUID,
    mode: str
):
    """Log share link creation"""
    await AuditService.log_action(
        db,
        action=AuditAction.LINK_CREATED,
        actor_id=actor_id,
        document_id=document_id,
        metadata={"link_id": str(link_id), "mode": mode}
    )


async def log_snapshot_restored(
    db: AsyncSession,
    actor_id: UUID,
    document_id: UUID,
    snapshot_id: UUID,
    action: str,
    new_document_id: Optional[UUID] = None
):
    """Log snapshot restore"""
    metadata = {
        "snapshot_id": str(snapshot_id),
        "restore_action": action
    }
    if new_document_id:
        metadata["new_document_id"] = str(new_document_id)
    
    audit_action = (
        AuditAction.SNAPSHOT_RESTORED_NEW if action == "new_document"
        else AuditAction.SNAPSHOT_RESTORED_OVERWRITE
    )
    
    await AuditService.log_action(
        db,
        action=audit_action,
        actor_id=actor_id,
        document_id=document_id,
        metadata=metadata
    )


"""
Snapshot Service
================

Pattern: Three-Layer Architecture (Service layer)
Purpose: Version history / snapshot management (CRDT-safe)

CRITICAL CONSTRAINTS:
- Snapshots are WRITE-ONLY artifacts
- Server NEVER applies/merges CRDT ops from snapshots
- yjs_state is stored as opaque binary blob
- Restore overwrite is Owner-only and guarded
- Default restore action is "restore-as-new"

NO Yjs logic in this service. All snapshot operations are storage-only.
"""

from typing import Optional, List, Tuple
from uuid import UUID
import base64
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc

from app.models.document_snapshot import DocumentSnapshot
from app.models.document import Document
from app.services.share_service import ShareService, role_level
from app.services.audit_service import log_snapshot_restored, AuditService


class SnapshotService:
    """
    Service for snapshot/version history management
    
    CRITICAL: All operations are WRITE-ONLY storage.
    Server never applies CRDT ops from snapshots.
    """
    
    @staticmethod
    async def list_snapshots(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[DocumentSnapshot], int]:
        """
        List snapshots for document
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User requesting list
            limit: Maximum snapshots to return
            offset: Pagination offset
            
        Returns:
            Tuple of (snapshots, total_count)
            
        Raises:
            ValueError: If actor doesn't have permission
        """
        # Check permission (viewer+ can list snapshots)
        await ShareService.assert_role(db, document_id, actor_id, 'viewer')
        
        # Query snapshots (ordered by created_at desc)
        query = select(DocumentSnapshot).where(
            DocumentSnapshot.document_id == document_id
        ).order_by(
            desc(DocumentSnapshot.created_at)
        ).limit(limit).offset(offset)
        
        result = await db.execute(query)
        snapshots = result.scalars().all()
        
        # Count total
        count_query = select(func.count()).select_from(DocumentSnapshot).where(
            DocumentSnapshot.document_id == document_id
        )
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0
        
        return snapshots, total
    
    @staticmethod
    async def get_snapshot(
        db: AsyncSession,
        document_id: UUID,
        snapshot_id: UUID,
        actor_id: UUID,
        include_yjs_state: bool = False
    ) -> DocumentSnapshot:
        """
        Get snapshot metadata (and optionally binary state)
        
        Args:
            db: Database session
            document_id: Document ID
            snapshot_id: Snapshot ID
            actor_id: User requesting snapshot
            include_yjs_state: Whether to include yjs_state binary (for download)
            
        Returns:
            DocumentSnapshot
            
        Raises:
            ValueError: If actor doesn't have permission or snapshot not found
        """
        # Check permission (viewer+ can get snapshots)
        await ShareService.assert_role(db, document_id, actor_id, 'viewer')
        
        # Get snapshot
        query = select(DocumentSnapshot).where(
            and_(
                DocumentSnapshot.id == snapshot_id,
                DocumentSnapshot.document_id == document_id
            )
        )
        
        result = await db.execute(query)
        snapshot = result.scalar_one_or_none()
        
        if not snapshot:
            raise ValueError("Snapshot not found")
        
        # By default, don't load yjs_state (large binary)
        # Use download_snapshot for that
        
        return snapshot
    
    @staticmethod
    async def download_snapshot(
        db: AsyncSession,
        document_id: UUID,
        snapshot_id: UUID,
        actor_id: UUID
    ) -> bytes:
        """
        Download snapshot binary (yjs_state)
        
        Args:
            db: Database session
            document_id: Document ID
            snapshot_id: Snapshot ID
            actor_id: User requesting download
            
        Returns:
            yjs_state as bytes (opaque CRDT binary)
            
        Raises:
            ValueError: If actor doesn't have permission or snapshot not found
        """
        # Check permission (viewer+ can download)
        await ShareService.assert_role(db, document_id, actor_id, 'viewer')
        
        # Get snapshot with yjs_state
        query = select(DocumentSnapshot).where(
            and_(
                DocumentSnapshot.id == snapshot_id,
                DocumentSnapshot.document_id == document_id
            )
        )
        
        result = await db.execute(query)
        snapshot = result.scalar_one_or_none()
        
        if not snapshot:
            raise ValueError("Snapshot not found")
        
        # Return yjs_state as bytes (opaque blob)
        return snapshot.yjs_state
    
    @staticmethod
    async def restore_snapshot(
        db: AsyncSession,
        document_id: UUID,
        snapshot_id: UUID,
        actor_id: UUID,
        action: str,
        backup_snapshot_id: Optional[UUID] = None,
        title: Optional[str] = None,
        force: bool = False
    ) -> dict:
        """
        Restore snapshot (CRDT-safe)
        
        Args:
            db: Database session
            document_id: Document ID
            snapshot_id: Snapshot ID to restore
            actor_id: User performing restore
            action: 'new_document' or 'overwrite'
            backup_snapshot_id: Required for overwrite (type: restore-backup)
            title: Title for new document (required for new_document)
            force: Force overwrite (Owner-only confirmation)
            
        Returns:
            Dict with restore result:
            {
                "success": bool,
                "action": str,
                "new_document_id": UUID or None,
                "backup_snapshot_id": UUID or None,
                "message": str
            }
            
        Raises:
            ValueError: If actor doesn't have permission or invalid action
            
        CRITICAL RULES:
        - new_document: Allowed for Editor+ (creates copy)
        - overwrite: Owner ONLY + requires backup_snapshot_id
        - Server NEVER applies CRDT ops to live sessions
        - If provider may be active → return 409 in router (not here)
        """
        # Validate action
        valid_actions = ['new_document', 'overwrite']
        if action not in valid_actions:
            raise ValueError(f"Action must be one of: {', '.join(valid_actions)}")
        
        # Get snapshot
        snapshot_query = select(DocumentSnapshot).where(
            and_(
                DocumentSnapshot.id == snapshot_id,
                DocumentSnapshot.document_id == document_id
            )
        )
        snapshot_result = await db.execute(snapshot_query)
        snapshot = snapshot_result.scalar_one_or_none()
        
        if not snapshot:
            raise ValueError("Snapshot not found")
        
        # =====================================================================
        # ACTION: new_document (DEFAULT - creates copy)
        # =====================================================================
        if action == 'new_document':
            # Check permission (editor+ can restore as new)
            actor_share = await ShareService.assert_role(db, document_id, actor_id, 'editor')
            
            if not title:
                # Get original document title and append " (Copy)"
                doc_query = select(Document).where(Document.id == document_id)
                doc_result = await db.execute(doc_query)
                original_doc = doc_result.scalar_one_or_none()
                title = f"{original_doc.title if original_doc else 'Untitled'} (Restored)"
            
            # Create new document (simplified - full implementation needs workspace_id, etc.)
            # For now, return metadata for router to handle document creation
            # The router will:
            # 1. Create new document via document service
            # 2. Store snapshot.yjs_state as new document's yjs_state
            # 3. Return new document ID
            
            # Audit log
            await log_snapshot_restored(
                db,
                actor_id,
                document_id,
                snapshot_id,
                action='new_document',
                new_document_id=None  # Router will log this after doc creation
            )
            
            return {
                "success": True,
                "action": "new_document",
                "snapshot_yjs_state": snapshot.yjs_state,  # Router uses this to create doc
                "title": title,
                "message": "Snapshot restored as new document"
            }
        
        # =====================================================================
        # ACTION: overwrite (OWNER ONLY - replaces current doc)
        # =====================================================================
        elif action == 'overwrite':
            # Check permission (OWNER ONLY)
            actor_share = await ShareService.assert_role(db, document_id, actor_id, 'owner')
            
            if actor_share.role != 'owner':
                raise ValueError("Only owner can overwrite document with snapshot")
            
            # CRITICAL: Require backup_snapshot_id
            if not backup_snapshot_id:
                raise ValueError("backup_snapshot_id is required for overwrite action")
            
            # Verify backup snapshot exists and is type 'restore-backup'
            backup_query = select(DocumentSnapshot).where(
                and_(
                    DocumentSnapshot.id == backup_snapshot_id,
                    DocumentSnapshot.document_id == document_id,
                    DocumentSnapshot.type == 'restore-backup'
                )
            )
            backup_result = await db.execute(backup_query)
            backup_snapshot = backup_result.scalar_one_or_none()
            
            if not backup_snapshot:
                raise ValueError("Invalid backup_snapshot_id: must be type 'restore-backup'")
            
            # Check if backup was created recently (within last 5 minutes)
            time_since_backup = (datetime.utcnow() - backup_snapshot.created_at).total_seconds()
            if time_since_backup > 300:  # 5 minutes
                raise ValueError("Backup snapshot is too old (>5 minutes). Create a fresh backup.")
            
            # WARNING: Cannot detect if provider is active from service layer
            # Router SHOULD check for active WebSocket sessions before calling this
            # If router detects active sessions, it should return 409 instead of calling this
            
            # Get current document
            doc_query = select(Document).where(Document.id == document_id)
            doc_result = await db.execute(doc_query)
            document = doc_result.scalar_one_or_none()
            
            if not document:
                raise ValueError("Document not found")
            
            # CRITICAL: Update document's yjs_state (STORAGE ONLY)
            # Server NEVER pushes this to active WebSocket sessions
            # Client must coordinate to reload after provider paused
            document.yjs_state = snapshot.yjs_state
            document.updated_at = datetime.utcnow()
            
            await db.flush()
            
            # Audit log
            await log_snapshot_restored(
                db,
                actor_id,
                document_id,
                snapshot_id,
                action='overwrite',
                new_document_id=None
            )
            
            return {
                "success": True,
                "action": "overwrite",
                "backup_snapshot_id": backup_snapshot_id,
                "message": "Snapshot restored (overwrite). Reload document to see changes.",
                "warning": "Provider must be paused. Reload required."
            }
    
    @staticmethod
    async def create_manual_snapshot(
        db: AsyncSession,
        document_id: UUID,
        actor_id: UUID,
        yjs_state_base64: str,
        note: Optional[str] = None,
        html_preview: Optional[str] = None,
        snapshot_type: str = 'manual'
    ) -> DocumentSnapshot:
        """
        Create manual snapshot (called by router/client)
        
        Args:
            db: Database session
            document_id: Document ID
            actor_id: User creating snapshot
            yjs_state_base64: Base64-encoded yjs_state (from client)
            note: Optional user note
            html_preview: Optional HTML preview
            snapshot_type: 'manual', 'auto', or 'restore-backup'
            
        Returns:
            Created DocumentSnapshot
            
        Raises:
            ValueError: If actor doesn't have permission
        """
        # Check permission (editor+ can create manual snapshots)
        await ShareService.assert_role(db, document_id, actor_id, 'editor')
        
        # Decode base64 to bytes
        try:
            yjs_state = base64.b64decode(yjs_state_base64)
        except Exception as e:
            raise ValueError(f"Invalid yjs_state_base64: {e}")
        
        # Create snapshot
        snapshot = DocumentSnapshot(
            document_id=document_id,
            created_by=actor_id,
            type=snapshot_type,
            yjs_state=yjs_state,
            html_preview=html_preview,
            note=note,
            size_bytes=len(yjs_state)
        )
        
        db.add(snapshot)
        await db.flush()
        
        # Audit log
        await AuditService.log_action(
            db,
            action='snapshot_created',
            actor_id=actor_id,
            document_id=document_id,
            metadata={
                "snapshot_id": str(snapshot.id),
                "type": snapshot_type,
                "size_bytes": len(yjs_state)
            }
        )
        
        return snapshot


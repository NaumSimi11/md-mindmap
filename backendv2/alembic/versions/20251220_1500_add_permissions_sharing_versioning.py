"""add permissions sharing and versioning tables

Revision ID: 20251220150000
Revises: 082c00808f87
Create Date: 2025-12-20 15:00:00.000000

This migration adds:
1. document_shares - permission/role management
2. invitations - pending email invites
3. share_links - shareable links with tokens
4. document_snapshots - version history (CRDT-safe, WRITE-ONLY)
5. audit_logs - audit trail for sharing/snapshot actions

IMPORTANT: Snapshots are WRITE-ONLY artifacts. Server never applies/merges CRDT ops.
Restore overwrite is Owner-only and guarded; default restore action is restore-as-new.

Backfill Strategy:
- For existing documents, create owner entry in document_shares using documents.created_by_id
- If created_by_id is NULL (shouldn't happen), log warning and skip (manual fix required)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime, timedelta

# revision identifiers, used by Alembic.
revision: str = '20251220150000'
down_revision: Union[str, None] = '082c00808f87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================================
    # 1. document_shares - Permission/Role Management
    # =========================================================================
    op.create_table(
        'document_shares',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('principal_type', sa.String(20), nullable=False),  # 'user' or 'workspace'
        sa.Column('principal_id', postgresql.UUID(as_uuid=True), nullable=False),  # user_id or workspace_id
        sa.Column('role', sa.String(20), nullable=False),  # 'owner', 'admin', 'editor', 'commenter', 'viewer'
        sa.Column('granted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('granted_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),  # 'active', 'revoked', 'pending'
        sa.CheckConstraint("principal_type IN ('user', 'workspace')", name='ck_document_shares_principal_type'),
        sa.CheckConstraint("role IN ('owner', 'admin', 'editor', 'commenter', 'viewer')", name='ck_document_shares_role'),
        sa.CheckConstraint("status IN ('active', 'revoked', 'pending')", name='ck_document_shares_status'),
        sa.UniqueConstraint('document_id', 'principal_type', 'principal_id', name='uq_document_shares_principal'),
    )
    op.create_index('ix_document_shares_document_id', 'document_shares', ['document_id'])
    op.create_index('ix_document_shares_principal', 'document_shares', ['principal_id'])
    op.create_index('ix_document_shares_role', 'document_shares', ['role'])
    
    # =========================================================================
    # 2. invitations - Pending Email Invites
    # =========================================================================
    op.create_table(
        'invitations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('invited_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('token', sa.String(64), nullable=False, unique=True),  # secure random token
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),  # 'pending', 'accepted', 'declined', 'cancelled'
        sa.Column('message', sa.Text, nullable=True),  # optional invite message
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('accepted_at', sa.DateTime, nullable=True),
        sa.CheckConstraint("role IN ('admin', 'editor', 'commenter', 'viewer')", name='ck_invitations_role'),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'declined', 'cancelled')", name='ck_invitations_status'),
    )
    op.create_index('ix_invitations_document_id', 'invitations', ['document_id'])
    op.create_index('ix_invitations_email', 'invitations', ['email'])
    op.create_index('ix_invitations_token', 'invitations', ['token'])
    op.create_index('ix_invitations_status', 'invitations', ['status'])
    
    # =========================================================================
    # 3. share_links - Shareable Links with Tokens
    # =========================================================================
    op.create_table(
        'share_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(64), nullable=False, unique=True),  # cryptographically random
        sa.Column('mode', sa.String(20), nullable=False, server_default='view'),  # 'view', 'comment', 'edit'
        sa.Column('password_hash', sa.String(255), nullable=True),  # bcrypt hash if password protected
        sa.Column('max_uses', sa.Integer, nullable=True),  # null = unlimited
        sa.Column('uses_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('revoked_at', sa.DateTime, nullable=True),
        sa.CheckConstraint("mode IN ('view', 'comment', 'edit')", name='ck_share_links_mode'),
        sa.CheckConstraint("uses_count >= 0", name='ck_share_links_uses_count'),
    )
    op.create_index('ix_share_links_document_id', 'share_links', ['document_id'])
    op.create_index('ix_share_links_token', 'share_links', ['token'])
    op.create_index('ix_share_links_expires_at', 'share_links', ['expires_at'])
    
    # =========================================================================
    # 4. document_snapshots - Version History (CRDT-Safe, WRITE-ONLY)
    # =========================================================================
    op.create_table(
        'document_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),  # null for system/auto
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
        sa.Column('type', sa.String(20), nullable=False),  # 'auto', 'manual', 'restore-backup'
        sa.Column('yjs_state', postgresql.BYTEA, nullable=False),  # WRITE-ONLY CRDT binary (opaque blob)
        sa.Column('html_preview', sa.Text, nullable=True),  # optional HTML preview for UI
        sa.Column('note', sa.Text, nullable=True),  # user note for manual snapshots
        sa.Column('size_bytes', sa.BigInteger, nullable=True),  # snapshot size for monitoring
        sa.CheckConstraint("type IN ('auto', 'manual', 'restore-backup')", name='ck_document_snapshots_type'),
    )
    op.create_index('ix_document_snapshots_document_created', 'document_snapshots', ['document_id', sa.text('created_at DESC')])
    op.create_index('ix_document_snapshots_type', 'document_snapshots', ['type'])
    
    # =========================================================================
    # 5. audit_logs - Audit Trail for Sharing/Snapshot Actions
    # =========================================================================
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),  # e.g., 'invite_sent', 'role_changed', 'snapshot_restored'
        sa.Column('metadata', postgresql.JSONB, nullable=True),  # free-form metadata (email, role, snapshot_id, etc.)
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_audit_logs_document_created', 'audit_logs', ['document_id', sa.text('created_at DESC')])
    op.create_index('ix_audit_logs_actor', 'audit_logs', ['actor_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    
    # =========================================================================
    # 6. Backfill: Create owner entries for existing documents
    # =========================================================================
    # Strategy: For each existing document, create a document_shares entry
    # with role='owner' and principal_id=documents.created_by_id
    #
    # If created_by_id is NULL (shouldn't happen with current schema),
    # we log a warning and skip (manual intervention required).
    
    print("🔄 Backfilling document_shares with owner entries...")
    
    # Use raw SQL for efficient backfill
    op.execute("""
        INSERT INTO document_shares (document_id, principal_type, principal_id, role, granted_by, granted_at, status)
        SELECT 
            id AS document_id,
            'user' AS principal_type,
            created_by_id AS principal_id,
            'owner' AS role,
            created_by_id AS granted_by,
            created_at AS granted_at,
            'active' AS status
        FROM documents
        WHERE created_by_id IS NOT NULL
        AND NOT is_deleted
        ON CONFLICT (document_id, principal_type, principal_id) DO NOTHING;
    """)
    
    # Log warning for documents with NULL created_by_id (if any)
    op.execute("""
        DO $$
        DECLARE
            orphan_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO orphan_count
            FROM documents
            WHERE created_by_id IS NULL AND NOT is_deleted;
            
            IF orphan_count > 0 THEN
                RAISE WARNING '⚠️  Found % document(s) with NULL created_by_id. These require manual owner assignment.', orphan_count;
            ELSE
                RAISE NOTICE '✅ All documents have valid owners.';
            END IF;
        END $$;
    """)
    
    print("✅ Backfill complete!")


def downgrade() -> None:
    """
    Rollback: Drop all tables in reverse order
    """
    op.drop_table('audit_logs')
    op.drop_table('document_snapshots')
    op.drop_table('share_links')
    op.drop_table('invitations')
    op.drop_table('document_shares')


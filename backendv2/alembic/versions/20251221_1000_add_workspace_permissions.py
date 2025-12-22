"""add workspace permissions and document access model

Revision ID: 20251221100000
Revises: 20251220150000
Create Date: 2025-12-21 10:00:00.000000

This migration adds workspace-level permissions:
1. workspace_role enum (owner, admin, editor, viewer)
2. document_access_model enum (inherited, restricted)
3. workspace_members table - workspace membership with roles
4. documents.access_model column - permission inheritance control

Architecture Guarantees:
- Every document has workspace_id (already enforced)
- Workspace roles cascade to documents by default (via access_model=inherited)
- Restricted docs ignore workspace membership (access_model=restricted)
- Permission resolution: effective_role = max(workspace_role, doc_role) for inherited docs
- "Shared with me" is a VIEW (doc shares without workspace membership)

Backfill Strategy:
- For existing workspaces, create workspace_members entry with role='owner' for workspace.owner_id
- All documents default to access_model='inherited'
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20251221100000'
down_revision: Union[str, None] = '20251220150000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================================
    # 1. Create Enums (with IF NOT EXISTS check)
    # =========================================================================
    print("📦 Creating enums...")
    
    # workspace_role enum
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
                CREATE TYPE workspace_role AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
            END IF;
        END $$;
    """)
    
    # document_access_model enum
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_access_model') THEN
                CREATE TYPE document_access_model AS ENUM ('INHERITED', 'RESTRICTED');
            END IF;
        END $$;
    """)
    
    print("✅ Enums created!")
    
    # =========================================================================
    # 2. workspace_members - Workspace Membership with Roles
    # =========================================================================
    print("📦 Creating workspace_members table...")
    
    # Use raw SQL to avoid SQLAlchemy's automatic enum creation
    op.execute("""
        CREATE TABLE workspace_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role workspace_role NOT NULL DEFAULT 'VIEWER'::workspace_role,
            granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
            granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_workspace_members_workspace_user UNIQUE (workspace_id, user_id),
            CONSTRAINT ck_workspace_members_status CHECK (status IN ('active', 'revoked'))
        );
    """)
    
    # Indexes for efficient queries
    op.execute("CREATE INDEX ix_workspace_members_workspace ON workspace_members(workspace_id);")
    op.execute("CREATE INDEX ix_workspace_members_user ON workspace_members(user_id);")
    op.execute("CREATE INDEX ix_workspace_members_status ON workspace_members(status) WHERE status = 'active';")
    op.execute("CREATE INDEX ix_workspace_members_role ON workspace_members(role);")
    
    print("✅ workspace_members table created!")
    
    # =========================================================================
    # 3. Add access_model to documents
    # =========================================================================
    print("📦 Adding access_model to documents...")
    
    # Use raw SQL to avoid SQLAlchemy's automatic enum creation
    op.execute("""
        ALTER TABLE documents
        ADD COLUMN access_model document_access_model NOT NULL DEFAULT 'INHERITED'::document_access_model;
    """)
    
    # Index for restricted docs (rare, so partial index)
    op.execute("""
        CREATE INDEX ix_documents_access_model_restricted
        ON documents(access_model)
        WHERE access_model = 'RESTRICTED';
    """)
    
    print("✅ access_model column added!")
    
    # =========================================================================
    # 4. Backfill: Create workspace_members entries for existing workspace owners
    # =========================================================================
    print("🔄 Backfilling workspace_members with owner entries...")
    
    # For each workspace, create a workspace_members entry for the owner
    op.execute("""
        INSERT INTO workspace_members (workspace_id, user_id, role, granted_by, granted_at, status)
        SELECT 
            id AS workspace_id,
            owner_id AS user_id,
            'OWNER' AS role,
            owner_id AS granted_by,
            created_at AS granted_at,
            'active' AS status
        FROM workspaces
        WHERE owner_id IS NOT NULL
        AND NOT is_deleted
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
    """)
    
    # Log results
    op.execute("""
        DO $$
        DECLARE
            backfill_count INTEGER;
            orphan_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO backfill_count FROM workspace_members WHERE role = 'OWNER';
            SELECT COUNT(*) INTO orphan_count FROM workspaces WHERE owner_id IS NULL AND NOT is_deleted;
            
            RAISE NOTICE '✅ Backfilled % workspace owner(s)', backfill_count;
            
            IF orphan_count > 0 THEN
                RAISE WARNING '⚠️  Found % workspace(s) with NULL owner_id. Manual owner assignment required.', orphan_count;
            END IF;
        END $$;
    """)
    
    print("✅ Backfill complete!")
    
    # =========================================================================
    # 5. Verification Checks
    # =========================================================================
    print("🔍 Running verification checks...")
    
    op.execute("""
        DO $$
        DECLARE
            doc_count INTEGER;
            workspace_count INTEGER;
            member_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO doc_count FROM documents WHERE NOT is_deleted;
            SELECT COUNT(*) INTO workspace_count FROM workspaces WHERE NOT is_deleted;
            SELECT COUNT(*) INTO member_count FROM workspace_members WHERE status = 'active';
            
            RAISE NOTICE '📊 Database state:';
            RAISE NOTICE '   - Active documents: %', doc_count;
            RAISE NOTICE '   - Active workspaces: %', workspace_count;
            RAISE NOTICE '   - Active workspace members: %', member_count;
            RAISE NOTICE '   - All documents default to access_model=inherited';
            RAISE NOTICE '✅ Workspace permissions ready!';
        END $$;
    """)


def downgrade() -> None:
    """
    Rollback: Remove workspace permissions
    """
    print("🔄 Rolling back workspace permissions...")
    
    # Drop indexes
    op.drop_index('ix_documents_access_model_restricted', 'documents')
    op.drop_index('ix_workspace_members_role', 'workspace_members')
    op.drop_index('ix_workspace_members_status', 'workspace_members')
    op.drop_index('ix_workspace_members_user', 'workspace_members')
    op.drop_index('ix_workspace_members_workspace', 'workspace_members')
    
    # Drop access_model column
    op.drop_column('documents', 'access_model')
    
    # Drop workspace_members table
    op.drop_table('workspace_members')
    
    # Drop enums
    op.execute("DROP TYPE workspace_role;")
    op.execute("DROP TYPE document_access_model;")
    
    print("✅ Rollback complete!")


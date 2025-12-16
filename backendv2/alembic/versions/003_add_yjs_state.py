"""add yjs state to documents

Revision ID: 003
Revises: 002
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = None  # Will be set based on existing migrations
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add yjs_state column (binary data)
    op.add_column('documents', sa.Column('yjs_state', sa.LargeBinary(), nullable=True))
    
    # Add yjs_version column (for optimistic locking)
    op.add_column('documents', sa.Column('yjs_version', sa.Integer(), nullable=False, server_default='0'))
    
    # Add size column (for monitoring)
    op.add_column('documents', sa.Column('size', sa.Integer(), nullable=False, server_default='0'))
    
    # Create index on yjs_version for faster queries
    op.create_index('ix_documents_yjs_version', 'documents', ['yjs_version'])
    
    print("✅ Added Yjs state columns to documents table")


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_documents_yjs_version', table_name='documents')
    
    # Remove columns
    op.drop_column('documents', 'size')
    op.drop_column('documents', 'yjs_version')
    op.drop_column('documents', 'yjs_state')
    
    print("✅ Removed Yjs state columns from documents table")


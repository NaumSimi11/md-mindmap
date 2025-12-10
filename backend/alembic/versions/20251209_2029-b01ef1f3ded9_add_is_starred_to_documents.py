"""add_is_starred_to_documents

Revision ID: b01ef1f3ded9
Revises: f0e0835707b7
Create Date: 2025-12-09 20:29:21.596095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b01ef1f3ded9"
down_revision: Union[str, None] = "f0e0835707b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_starred column to documents table
    op.add_column('documents', sa.Column('is_starred', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index('ix_documents_is_starred', 'documents', ['is_starred'], unique=False)


def downgrade() -> None:
    # Remove is_starred column
    op.drop_index('ix_documents_is_starred', table_name='documents')
    op.drop_column('documents', 'is_starred')

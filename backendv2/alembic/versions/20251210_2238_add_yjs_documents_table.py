"""add_yjs_documents_table

Revision ID: 1000072ee1a9
Revises: 8ace9f92e93b
Create Date: 2025-12-10 22:38:56.623079

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1000072ee1a9'
down_revision: Union[str, None] = '8ace9f92e93b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE yjs_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL UNIQUE,
            yjs_state BYTEA NOT NULL,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
        
        CREATE INDEX idx_yjs_documents_document_id ON yjs_documents(document_id);
        CREATE INDEX idx_yjs_documents_updated_at ON yjs_documents(updated_at);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS yjs_documents CASCADE;")


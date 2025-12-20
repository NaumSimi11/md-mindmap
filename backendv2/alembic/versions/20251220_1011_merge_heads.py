"""merge heads

Revision ID: 082c00808f87
Revises: 003, 1000072ee1a9
Create Date: 2025-12-20 10:11:31.165026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '082c00808f87'
down_revision: Union[str, None] = ('003', '1000072ee1a9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass


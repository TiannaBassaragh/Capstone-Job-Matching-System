"""add_expires_at_to_job_post

Revision ID: f3a2b1c9d8e7
Revises: 84f19d97964b
Create Date: 2026-05-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a2b1c9d8e7'
down_revision: Union[str, Sequence[str], None] = '84f19d97964b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('job_post', sa.Column('expires_at', sa.TIMESTAMP(), nullable=True))


def downgrade() -> None:
    op.drop_column('job_post', 'expires_at')

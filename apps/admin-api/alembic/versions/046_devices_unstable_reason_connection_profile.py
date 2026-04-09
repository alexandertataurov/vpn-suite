"""Add devices.unstable_reason and connection_profile.

Revision ID: 046
Revises: 045
Create Date: 2026-02-28

"""

import sqlalchemy as sa

from alembic import op

revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("devices", sa.Column("unstable_reason", sa.String(64), nullable=True))
    op.add_column("devices", sa.Column("connection_profile", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("devices", "connection_profile")
    op.drop_column("devices", "unstable_reason")

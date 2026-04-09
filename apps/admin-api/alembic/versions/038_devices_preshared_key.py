"""Add devices.preshared_key for sync-peer and repair.

Revision ID: 038
Revises: 037
Create Date: 2026-02-25

"""

import sqlalchemy as sa

from alembic import op

revision = "038"
down_revision = "037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("preshared_key", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "preshared_key")

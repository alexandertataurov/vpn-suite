"""Add servers.preshared_key for WireGuard issued configs.

Revision ID: 037
Revises: 036
Create Date: 2026-02-25

"""

import sqlalchemy as sa

from alembic import op

revision = "037"
down_revision = "036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("preshared_key", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("servers", "preshared_key")

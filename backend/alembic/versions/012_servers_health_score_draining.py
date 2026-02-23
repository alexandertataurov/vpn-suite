"""Add servers.health_score and servers.is_draining for control-plane.

Revision ID: 012
Revises: 011
Create Date: 2026-02-13

"""

import sqlalchemy as sa

from alembic import op

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("health_score", sa.Float(), nullable=True),
    )
    op.add_column(
        "servers",
        sa.Column("is_draining", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(
        "idx_servers_status_health",
        "servers",
        ["status", "health_score"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_servers_status_health", table_name="servers")
    op.drop_column("servers", "is_draining")
    op.drop_column("servers", "health_score")

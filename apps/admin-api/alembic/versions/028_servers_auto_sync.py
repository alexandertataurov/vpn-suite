"""Add auto_sync_enabled, auto_sync_interval_sec to servers.

Revision ID: 028
Revises: 027
Create Date: 2026-02-15

"""

import sqlalchemy as sa

from alembic import op

revision = "028"
down_revision = "027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column(
            "auto_sync_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
    )
    op.add_column(
        "servers",
        sa.Column(
            "auto_sync_interval_sec", sa.Integer(), nullable=False, server_default=sa.text("60")
        ),
    )


def downgrade() -> None:
    op.drop_column("servers", "auto_sync_interval_sec")
    op.drop_column("servers", "auto_sync_enabled")

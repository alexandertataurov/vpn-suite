"""Add limit columns to servers.

Revision ID: 006
Revises: 005
Create Date: 2026-02-12

"""

import sqlalchemy as sa

from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("servers", sa.Column("traffic_limit_gb", sa.Float(), nullable=True))
    op.add_column("servers", sa.Column("speed_limit_mbps", sa.Float(), nullable=True))
    op.add_column("servers", sa.Column("max_connections", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("servers", "max_connections")
    op.drop_column("servers", "speed_limit_mbps")
    op.drop_column("servers", "traffic_limit_gb")

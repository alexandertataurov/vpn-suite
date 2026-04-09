"""Add servers.vpn_endpoint for AmneziaWG client config (VPN host:port).

Revision ID: 010
Revises: 009
Create Date: 2026-02-13

"""

import sqlalchemy as sa

from alembic import op

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("vpn_endpoint", sa.String(256), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("servers", "vpn_endpoint")

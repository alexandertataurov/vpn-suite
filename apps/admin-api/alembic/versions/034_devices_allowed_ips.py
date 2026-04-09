"""devices.allowed_ips for server peer config (client tunnel address).

Revision ID: 034
Revises: 033
Create Date: 2026-02-22

"""

import sqlalchemy as sa

from alembic import op

revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("allowed_ips", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "allowed_ips")

"""devices.data_limit_bytes, devices.expires_at.

Revision ID: 031
Revises: 030
Create Date: 2026-02-18

"""

import sqlalchemy as sa

from alembic import op

revision = "031"
down_revision = "030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("data_limit_bytes", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "expires_at")
    op.drop_column("devices", "data_limit_bytes")

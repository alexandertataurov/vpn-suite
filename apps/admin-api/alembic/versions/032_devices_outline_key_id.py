"""devices.outline_key_id (legacy schema; removed in 035).

Revision ID: 032
Revises: 031
Create Date: 2026-02-19

"""

import sqlalchemy as sa

from alembic import op

revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("outline_key_id", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "outline_key_id")

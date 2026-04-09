"""Add referrals.source_channel.

Revision ID: 059
Revises: 058
Create Date: 2026-03-07

"""

import sqlalchemy as sa

from alembic import op

revision = "059"
down_revision = "058"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "referrals",
        sa.Column("source_channel", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("referrals", "source_channel")

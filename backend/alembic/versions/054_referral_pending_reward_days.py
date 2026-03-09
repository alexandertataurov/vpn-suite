"""Add referrals.pending_reward_days.

Revision ID: 054
Revises: 053
Create Date: 2026-03-07

"""

import sqlalchemy as sa

from alembic import op

revision = "054"
down_revision = "053"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "referrals",
        sa.Column("pending_reward_days", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("referrals", "pending_reward_days")

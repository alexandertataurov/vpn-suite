"""Add subscription.reminder_winback_sent_at for win-back automation.

Revision ID: 057
Revises: 056
Create Date: 2026-03-07

"""

import sqlalchemy as sa

from alembic import op

revision = "057"
down_revision = "056"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column("reminder_winback_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "reminder_winback_sent_at")

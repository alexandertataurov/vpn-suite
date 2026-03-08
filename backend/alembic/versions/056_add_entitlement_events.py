"""Add entitlement_events ledger.

Revision ID: 056
Revises: 055
Create Date: 2026-03-07

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "056"
down_revision = "055"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "entitlement_events",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "subscription_id",
            sa.String(32),
            sa.ForeignKey("subscriptions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_entitlement_events_event_type", "entitlement_events", ["event_type"])
    op.create_index("ix_entitlement_events_user_id", "entitlement_events", ["user_id"])
    op.create_index("ix_entitlement_events_subscription_id", "entitlement_events", ["subscription_id"])


def downgrade() -> None:
    op.drop_table("entitlement_events")

"""payments, payment_events (idempotency by external_id).

Revision ID: 007
Revises: 006
Create Date: 2026-02-12

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "subscription_id",
            sa.String(32),
            sa.ForeignKey("subscriptions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("webhook_payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_payments_external_id", "payments", ["external_id"], unique=True)
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_subscription_id", "payments", ["subscription_id"])
    op.create_index("ix_payments_provider_status", "payments", ["provider", "status"])

    op.create_table(
        "payment_events",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "payment_id",
            sa.String(32),
            sa.ForeignKey("payments.id", ondelete="CASCADE"),
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
    op.create_index("ix_payment_events_payment_id", "payment_events", ["payment_id"])


def downgrade() -> None:
    op.drop_table("payment_events")
    op.drop_table("payments")

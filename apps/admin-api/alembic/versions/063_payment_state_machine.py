"""Canonical payment state machine fields.

Revision ID: 063
Revises: 062
Create Date: 2026-04-27
"""

import sqlalchemy as sa
from alembic import op

revision = "063"
down_revision = "062"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("payments", sa.Column("kind", sa.String(32), nullable=True))
    op.add_column("payments", sa.Column("source", sa.String(32), nullable=True))
    op.add_column("payments", sa.Column("idempotency_key", sa.String(255), nullable=True))
    op.add_column("payments", sa.Column("provider_payment_id", sa.String(255), nullable=True))
    op.add_column("payments", sa.Column("provider_status", sa.String(64), nullable=True))
    op.add_column("payments", sa.Column("invoice_url", sa.String(1024), nullable=True))
    op.add_column("payments", sa.Column("expected_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("payments", sa.Column("paid_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("payments", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("payments", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "payments", sa.Column("subscription_applied_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("payments", sa.Column("failure_code", sa.String(64), nullable=True))
    op.add_column("payments", sa.Column("failure_message", sa.String(255), nullable=True))
    op.add_column(
        "payments", sa.Column("telegram_payment_charge_id", sa.String(255), nullable=True)
    )

    op.execute(
        """
        UPDATE payments
        SET
            kind = COALESCE(NULLIF(webhook_payload->>'kind', ''), 'subscription'),
            source = CASE
                WHEN external_id LIKE 'webapp:%' THEN 'webapp'
                WHEN external_id LIKE 'bot:%' THEN 'bot'
                ELSE 'webhook'
            END,
            provider_payment_id = external_id,
            provider_status = status,
            expected_amount = amount,
            paid_amount = CASE WHEN status = 'completed' THEN amount ELSE NULL END,
            paid_at = CASE WHEN status = 'completed' THEN created_at ELSE NULL END,
            subscription_applied_at = CASE
                WHEN status = 'completed' AND COALESCE(webhook_payload->>'kind', '') <> 'donation'
                THEN created_at
                ELSE NULL
            END,
            status = CASE
                WHEN status = 'completed' THEN 'succeeded'
                ELSE status
            END
        """
    )
    op.alter_column("payments", "kind", existing_type=sa.String(32), nullable=False)
    op.alter_column("payments", "source", existing_type=sa.String(32), nullable=False)

    op.create_index(
        "uq_payments_provider_provider_payment_id",
        "payments",
        ["provider", "provider_payment_id"],
        unique=True,
        postgresql_where=sa.text("provider_payment_id IS NOT NULL"),
    )
    op.create_index(
        "uq_payments_source_idempotency_key",
        "payments",
        ["source", "idempotency_key"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )
    op.create_index(
        "uq_payments_telegram_payment_charge_id",
        "payments",
        ["telegram_payment_charge_id"],
        unique=True,
        postgresql_where=sa.text("telegram_payment_charge_id IS NOT NULL"),
    )
    op.create_index("idx_payments_status_expires_at", "payments", ["status", "expires_at"])


def downgrade() -> None:
    op.drop_index("idx_payments_status_expires_at", table_name="payments")
    op.drop_index("uq_payments_telegram_payment_charge_id", table_name="payments")
    op.drop_index("uq_payments_source_idempotency_key", table_name="payments")
    op.drop_index("uq_payments_provider_provider_payment_id", table_name="payments")
    op.execute("UPDATE payments SET status = 'completed' WHERE status = 'succeeded'")
    op.drop_column("payments", "telegram_payment_charge_id")
    op.drop_column("payments", "failure_message")
    op.drop_column("payments", "failure_code")
    op.drop_column("payments", "subscription_applied_at")
    op.drop_column("payments", "expires_at")
    op.drop_column("payments", "paid_at")
    op.drop_column("payments", "paid_amount")
    op.drop_column("payments", "expected_amount")
    op.drop_column("payments", "invoice_url")
    op.drop_column("payments", "provider_status")
    op.drop_column("payments", "provider_payment_id")
    op.drop_column("payments", "idempotency_key")
    op.drop_column("payments", "source")
    op.drop_column("payments", "kind")

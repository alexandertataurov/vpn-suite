"""Add subscription state split and grace fields (spec v2).

Revision ID: 052
Revises: 051
Create Date: 2026-03-07

"""

from alembic import op
import sqlalchemy as sa


revision = "052"
down_revision = "051"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column(
            "subscription_status",
            sa.String(32),
            nullable=False,
            server_default=sa.text("'active'"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "access_status",
            sa.String(32),
            nullable=False,
            server_default=sa.text("'enabled'"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "billing_status",
            sa.String(32),
            nullable=False,
            server_default=sa.text("'paid'"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "renewal_status",
            sa.String(32),
            nullable=False,
            server_default=sa.text("'auto_renew_on'"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column("grace_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("grace_reason", sa.String(64), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "cancel_at_period_end",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "accrued_bonus_days",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    conn = op.get_bind()
    conn.execute(
        sa.text("""
            UPDATE subscriptions SET
                subscription_status = CASE
                    WHEN status = 'pending' THEN 'pending'
                    WHEN status = 'active' THEN 'active'
                    WHEN status = 'cancelled' THEN 'cancelled'
                    WHEN status = 'paused' OR status = 'expired' THEN 'expired'
                    ELSE 'active'
                END,
                access_status = CASE
                    WHEN status = 'pending' THEN 'blocked'
                    WHEN status = 'active' THEN 'enabled'
                    WHEN status = 'cancelled' THEN 'blocked'
                    WHEN status = 'paused' THEN 'paused'
                    WHEN status = 'expired' THEN 'blocked'
                    ELSE 'enabled'
                END,
                renewal_status = CASE WHEN auto_renew THEN 'auto_renew_on' ELSE 'auto_renew_off' END
        """)
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "accrued_bonus_days")
    op.drop_column("subscriptions", "cancel_at_period_end")
    op.drop_column("subscriptions", "grace_reason")
    op.drop_column("subscriptions", "grace_until")
    op.drop_column("subscriptions", "renewal_status")
    op.drop_column("subscriptions", "billing_status")
    op.drop_column("subscriptions", "access_status")
    op.drop_column("subscriptions", "subscription_status")

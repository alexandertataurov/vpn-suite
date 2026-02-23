"""Add indexes for subscriptions and payments hot paths.

Revision ID: 016
Revises: 015
Create Date: 2026-02-14

"""

from alembic import op

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_subscriptions_status_valid_until",
        "subscriptions",
        ["status", "valid_until"],
        unique=False,
        postgresql_where="status = 'active'",
    )
    op.create_index(
        "idx_subscriptions_user_status",
        "subscriptions",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "idx_payments_created_at",
        "payments",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_payments_created_at",
        table_name="payments",
    )
    op.drop_index(
        "idx_subscriptions_user_status",
        table_name="subscriptions",
    )
    op.drop_index(
        "idx_subscriptions_status_valid_until",
        table_name="subscriptions",
    )

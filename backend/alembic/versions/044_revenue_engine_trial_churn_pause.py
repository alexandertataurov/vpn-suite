"""Revenue engine: trial, churn_surveys, pause, referral reward_days.

Revision ID: 044
Revises: 043
Create Date: 2026-02-27

"""

import sqlalchemy as sa

from alembic import op

revision = "044"
down_revision = "043"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Subscriptions: trial and pause
    op.add_column(
        "subscriptions",
        sa.Column("is_trial", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "subscriptions",
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("paused_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("pause_reason", sa.String(64), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("reminder_3d_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("reminder_1d_sent_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Referrals: reward_days
    op.add_column(
        "referrals",
        sa.Column("reward_days", sa.Integer(), nullable=False, server_default="7"),
    )

    # Churn surveys
    op.create_table(
        "churn_surveys",
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
            sa.ForeignKey("subscriptions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reason", sa.String(32), nullable=False),
        sa.Column("discount_offered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_churn_surveys_user_id", "churn_surveys", ["user_id"])
    op.create_index("ix_churn_surveys_created_at", "churn_surveys", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_churn_surveys_created_at", table_name="churn_surveys")
    op.drop_index("ix_churn_surveys_user_id", table_name="churn_surveys")
    op.drop_table("churn_surveys")

    op.drop_column("referrals", "reward_days")

    op.drop_column("subscriptions", "reminder_1d_sent_at")
    op.drop_column("subscriptions", "reminder_3d_sent_at")
    op.drop_column("subscriptions", "pause_reason")
    op.drop_column("subscriptions", "paused_at")
    op.drop_column("subscriptions", "trial_ends_at")
    op.drop_column("subscriptions", "is_trial")

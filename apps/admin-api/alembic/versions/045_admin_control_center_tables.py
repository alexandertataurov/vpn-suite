"""Admin control center: retention_rules, price_history, abuse_signals, churn_risk_scores, promo_campaigns.

Revision ID: 045
Revises: 044
Create Date: 2026-02-27

"""

import sqlalchemy as sa

from alembic import op

revision = "045"
down_revision = "044"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "retention_rules",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("condition_json", sa.dialects.postgresql.JSONB(), nullable=False),
        sa.Column("action_type", sa.String(32), nullable=False),
        sa.Column("action_params", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_retention_rules_enabled", "retention_rules", ["enabled"])

    op.create_table(
        "price_history",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "plan_id", sa.String(32), sa.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("price_amount_old", sa.Numeric(12, 2), nullable=True),
        sa.Column("price_amount_new", sa.Numeric(12, 2), nullable=False),
        sa.Column("promo_pct_old", sa.Integer(), nullable=True),
        sa.Column("promo_pct_new", sa.Integer(), nullable=True),
        sa.Column(
            "changed_by_admin_id",
            sa.String(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("revenue_impact_estimate", sa.Numeric(12, 2), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_price_history_plan_id_created_at", "price_history", ["plan_id", "created_at"]
    )

    op.create_table(
        "abuse_signals",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("signal_type", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(32), nullable=False),
        sa.Column("payload", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.String(32), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_abuse_signals_user_id_created_at", "abuse_signals", ["user_id", "created_at"]
    )

    op.create_table(
        "churn_risk_scores",
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
            nullable=True,
        ),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("factors", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_churn_risk_scores_user_id_computed_at", "churn_risk_scores", ["user_id", "computed_at"]
    )

    op.create_table(
        "promo_campaigns",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("discount_percent", sa.Integer(), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("target_rule", sa.String(64), nullable=True),
        sa.Column("max_redemptions", sa.Integer(), nullable=True),
        sa.Column("extra_params", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("promo_campaigns")
    op.drop_index("ix_churn_risk_scores_user_id_computed_at", table_name="churn_risk_scores")
    op.drop_table("churn_risk_scores")
    op.drop_index("ix_abuse_signals_user_id_created_at", table_name="abuse_signals")
    op.drop_table("abuse_signals")
    op.drop_index("ix_price_history_plan_id_created_at", table_name="price_history")
    op.drop_table("price_history")
    op.drop_index("ix_retention_rules_enabled", table_name="retention_rules")
    op.drop_table("retention_rules")

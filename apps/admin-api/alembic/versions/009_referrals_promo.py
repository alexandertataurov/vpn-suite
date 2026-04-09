"""referrals, promo_codes, promo_redemptions for Growth.

Revision ID: 009
Revises: 008
Create Date: 2026-02-12

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "referrals",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "referrer_user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "referee_user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("referral_code", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("reward_applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_referrals_referrer", "referrals", ["referrer_user_id"])
    op.create_index("ix_referrals_referee", "referrals", ["referee_user_id"])
    op.create_unique_constraint("uq_referrals_referee", "referrals", ["referee_user_id"])

    op.create_table(
        "promo_codes",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("value", sa.Numeric(12, 2), nullable=False),
        sa.Column("constraints", postgresql.JSONB(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("created_by", sa.BigInteger(), nullable=True),
        sa.Column("updated_by", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_unique_constraint("uq_promo_codes_code", "promo_codes", ["code"])

    op.create_table(
        "promo_redemptions",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "promo_code_id",
            sa.String(32),
            sa.ForeignKey("promo_codes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "payment_id",
            sa.String(32),
            sa.ForeignKey("payments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("subscription_id", sa.String(32), nullable=True),
        sa.Column(
            "redeemed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_promo_redemptions_user", "promo_redemptions", ["user_id"])
    op.create_index("ix_promo_redemptions_promo", "promo_redemptions", ["promo_code_id"])


def downgrade() -> None:
    op.drop_table("promo_redemptions")
    op.drop_table("promo_codes")
    op.drop_table("referrals")

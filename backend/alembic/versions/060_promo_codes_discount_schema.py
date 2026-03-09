"""Promo codes: discount_xtr, limits, idempotency; promo_redemptions discount_applied, unique constraint.

Revision ID: 060
Revises: 059
Create Date: 2026-03-08

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "060"
down_revision = "059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "promo_codes",
        sa.Column("discount_xtr", sa.Integer(), nullable=True),
    )
    op.add_column(
        "promo_codes",
        sa.Column("max_uses_per_user", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "promo_codes",
        sa.Column("global_use_limit", sa.Integer(), nullable=True),
    )
    op.add_column(
        "promo_codes",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "promo_codes",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "promo_codes",
        sa.Column("applicable_plan_ids", postgresql.ARRAY(sa.Text()), nullable=True),
    )
    op.execute("UPDATE promo_codes SET discount_xtr = COALESCE((value)::int, 0) WHERE discount_xtr IS NULL")
    op.alter_column(
        "promo_codes",
        "discount_xtr",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="0",
    )
    op.alter_column(
        "promo_codes",
        "discount_xtr",
        existing_type=sa.Integer(),
        server_default=None,
    )

    op.add_column(
        "promo_redemptions",
        sa.Column("discount_applied_xtr", sa.Integer(), nullable=True),
    )
    op.execute("UPDATE promo_redemptions SET discount_applied_xtr = 0 WHERE discount_applied_xtr IS NULL")
    op.alter_column(
        "promo_redemptions",
        "discount_applied_xtr",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="0",
    )
    op.alter_column(
        "promo_redemptions",
        "discount_applied_xtr",
        existing_type=sa.Integer(),
        server_default=None,
    )

    op.create_unique_constraint(
        "uq_promo_redemptions_promo_user",
        "promo_redemptions",
        ["promo_code_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_promo_redemptions_promo_user",
        "promo_redemptions",
        type_="unique",
    )
    op.drop_column("promo_redemptions", "discount_applied_xtr")
    op.drop_column("promo_codes", "applicable_plan_ids")
    op.drop_column("promo_codes", "expires_at")
    op.drop_column("promo_codes", "is_active")
    op.drop_column("promo_codes", "global_use_limit")
    op.drop_column("promo_codes", "max_uses_per_user")
    op.drop_column("promo_codes", "discount_xtr")

"""Add promo_redemptions.created_at and ix_audit_logs_admin_id.

Revision ID: 015
Revises: 014
Create Date: 2026-02-14

"""

import sqlalchemy as sa

from alembic import op

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "promo_redemptions",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_audit_logs_admin_id",
        "audit_logs",
        ["admin_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_audit_logs_admin_id", table_name="audit_logs")
    op.drop_column("promo_redemptions", "created_at")

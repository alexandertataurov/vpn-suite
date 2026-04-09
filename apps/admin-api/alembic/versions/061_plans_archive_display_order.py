"""Add plans.is_archived and plans.display_order.

Revision ID: 061
Revises: 060
Create Date: 2026-03-09

"""

import sqlalchemy as sa

from alembic import op

revision = "061"
down_revision = "060"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "plans",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "plans",
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("plans", "is_archived", server_default=None)
    op.alter_column("plans", "display_order", server_default=None)


def downgrade() -> None:
    op.drop_column("plans", "display_order")
    op.drop_column("plans", "is_archived")

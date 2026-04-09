"""Add plans.device_limit.

Revision ID: 058
Revises: 057
Create Date: 2026-03-07

"""

import sqlalchemy as sa

from alembic import op

revision = "058"
down_revision = "057"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "plans",
        sa.Column("device_limit", sa.Integer(), nullable=False, server_default="1"),
    )
    op.alter_column("plans", "device_limit", server_default=None)


def downgrade() -> None:
    op.drop_column("plans", "device_limit")

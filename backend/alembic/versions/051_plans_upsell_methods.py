"""Add plans.upsell_methods (JSONB).

Revision ID: 051
Revises: 050
Create Date: 2026-03-07

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "051"
down_revision = "050"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "plans",
        sa.Column("upsell_methods", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("plans", "upsell_methods")

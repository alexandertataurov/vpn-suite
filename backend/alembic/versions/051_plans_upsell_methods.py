"""Add plans.upsell_methods (JSONB).

Revision ID: 051
Revises: 050
Create Date: 2026-03-07

"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

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

"""servers.integration_type for AWG vs Outline.

Revision ID: 033
Revises: 032
Create Date: 2026-02-21

"""

import sqlalchemy as sa

from alembic import op

revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("integration_type", sa.String(16), nullable=False, server_default="awg"),
    )


def downgrade() -> None:
    op.drop_column("servers", "integration_type")

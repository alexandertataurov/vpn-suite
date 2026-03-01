"""Drop servers.integration_type (schema cleanup).

Revision ID: 036
Revises: 035
Create Date: 2026-02-23

"""

import sqlalchemy as sa

from alembic import op

revision = "036"
down_revision = "035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("servers", "integration_type")


def downgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("integration_type", sa.String(16), nullable=False, server_default="awg"),
    )

"""Drop servers.integration_type (Outline removal).

Revision ID: 036
Revises: 035
Create Date: 2026-02-23

"""

from sqlalchemy import sa

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

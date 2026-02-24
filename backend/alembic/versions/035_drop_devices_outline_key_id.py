"""Drop devices.outline_key_id (Outline removal).

Revision ID: 035
Revises: 034
Create Date: 2026-02-23

"""

from alembic import op

revision = "035"
down_revision = "034"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("devices", "outline_key_id")


def downgrade() -> None:
    from sqlalchemy import sa

    op.add_column("devices", sa.Column("outline_key_id", sa.String(32), nullable=True))

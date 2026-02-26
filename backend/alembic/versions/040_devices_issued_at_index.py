"""Add index on devices.issued_at for list default sort.

Revision ID: 040
Revises: 039
Create Date: 2026-02-25

"""

import sqlalchemy as sa

from alembic import op

revision = "040"
down_revision = "039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_devices_issued_at",
        "devices",
        ["issued_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_devices_issued_at", table_name="devices")

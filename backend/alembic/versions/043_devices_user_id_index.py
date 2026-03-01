"""Add index on devices.user_id for per-user listings.

Revision ID: 043
Revises: 042
Create Date: 2026-02-27
"""

from alembic import op

revision = "043"
down_revision = "042"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_devices_user_id",
        "devices",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_devices_user_id", table_name="devices")

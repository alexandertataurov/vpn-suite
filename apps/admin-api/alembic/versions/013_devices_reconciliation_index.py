"""Add partial index on devices for reconciliation (server_id, active only).

Revision ID: 013
Revises: 012
Create Date: 2026-02-13

"""

from sqlalchemy import text

from alembic import op

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_devices_server_id_active",
        "devices",
        ["server_id"],
        unique=False,
        postgresql_where=text("revoked_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("idx_devices_server_id_active", table_name="devices")

"""Add Device fields for state reconciliation (apply_status, last_applied_at, etc.).

Revision ID: 041
Revises: 040
Create Date: 2026-02-26

"""

import sqlalchemy as sa

from alembic import op

revision = "041"
down_revision = "040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("apply_status", sa.String(32), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("last_applied_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("last_seen_handshake_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("last_error", sa.Text(), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("protocol_version", sa.String(16), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("obfuscation_profile", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_devices_apply_status",
        "devices",
        ["apply_status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_devices_apply_status", table_name="devices")
    op.drop_column("devices", "obfuscation_profile")
    op.drop_column("devices", "protocol_version")
    op.drop_column("devices", "last_error")
    op.drop_column("devices", "last_seen_handshake_at")
    op.drop_column("devices", "last_applied_at")
    op.drop_column("devices", "apply_status")

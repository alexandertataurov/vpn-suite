"""issued_configs table and devices.issued_by_admin_id

Revision ID: 024
Revises: 023
Create Date: 2026-02-15

"""

import sqlalchemy as sa

from alembic import op

revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column(
            "issued_by_admin_id",
            sa.String(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_devices_issued_by_admin_id",
        "devices",
        ["issued_by_admin_id"],
        unique=False,
    )

    op.create_table(
        "issued_configs",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "device_id",
            sa.String(32),
            sa.ForeignKey("devices.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("profile_type", sa.String(16), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("download_token_hash", sa.String(64), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "issued_by_admin_id",
            sa.String(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("config_encrypted", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_issued_configs_download_token_hash",
        "issued_configs",
        ["download_token_hash"],
        unique=False,
    )
    op.create_index("ix_issued_configs_device_id", "issued_configs", ["device_id"])
    op.create_index("ix_issued_configs_server_id", "issued_configs", ["server_id"])


def downgrade() -> None:
    op.drop_index("ix_issued_configs_server_id", table_name="issued_configs")
    op.drop_index("ix_issued_configs_device_id", table_name="issued_configs")
    op.drop_index("ix_issued_configs_download_token_hash", table_name="issued_configs")
    op.drop_table("issued_configs")
    op.drop_index("ix_devices_issued_by_admin_id", table_name="devices")
    op.drop_column("devices", "issued_by_admin_id")

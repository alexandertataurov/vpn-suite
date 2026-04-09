"""devices, profile_issues

Revision ID: 004
Revises: 003
Create Date: 2026-02-12

"""

import sqlalchemy as sa

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "devices",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "subscription_id",
            sa.String(32),
            sa.ForeignKey("subscriptions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("device_name", sa.String(128), nullable=True),
        sa.Column("public_key", sa.String(128), nullable=False),
        sa.Column("config_amnezia_hash", sa.String(64), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_devices_user_id", "devices", ["user_id"])
    op.create_index("ix_devices_subscription_id", "devices", ["subscription_id"])
    op.create_index("ix_devices_server_id", "devices", ["server_id"])

    op.create_table(
        "profile_issues",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "device_id",
            sa.String(32),
            sa.ForeignKey("devices.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("config_version", sa.String(64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_profile_issues_device_id", "profile_issues", ["device_id"])


def downgrade() -> None:
    op.drop_index("ix_profile_issues_device_id", "profile_issues")
    op.drop_table("profile_issues")
    op.drop_index("ix_devices_server_id", "devices")
    op.drop_index("ix_devices_subscription_id", "devices")
    op.drop_index("ix_devices_user_id", "devices")
    op.drop_table("devices")

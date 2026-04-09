"""Add relay delivery fields for servers and devices.

Revision ID: 062
Revises: 061
Create Date: 2026-04-09

"""

import sqlalchemy as sa

from alembic import op

revision = "062"
down_revision = "061"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("kind", sa.String(length=32), nullable=False, server_default="awg_node"),
    )
    op.add_column(
        "devices",
        sa.Column("delivery_mode", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("client_facing_server_id", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("upstream_server_id", sa.String(length=32), nullable=True),
    )
    op.create_foreign_key(
        "fk_devices_client_facing_server_id_servers",
        "devices",
        "servers",
        ["client_facing_server_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_devices_upstream_server_id_servers",
        "devices",
        "servers",
        ["upstream_server_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.execute("UPDATE devices SET client_facing_server_id = server_id")
    op.execute("UPDATE devices SET delivery_mode = 'awg_native' WHERE delivery_mode IS NULL")
    op.alter_column("devices", "delivery_mode", nullable=False)
    op.alter_column("servers", "kind", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_devices_upstream_server_id_servers", "devices", type_="foreignkey")
    op.drop_constraint(
        "fk_devices_client_facing_server_id_servers", "devices", type_="foreignkey"
    )
    op.drop_column("devices", "upstream_server_id")
    op.drop_column("devices", "client_facing_server_id")
    op.drop_column("devices", "delivery_mode")
    op.drop_column("servers", "kind")

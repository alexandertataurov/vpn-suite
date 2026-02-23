"""Add control-plane resource tables (ip pools, port allocations, events).

Revision ID: 014
Revises: 013
Create Date: 2026-02-14

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ip_pools",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("server_id", sa.String(length=32), nullable=False),
        sa.Column("cidr", sa.String(length=64), nullable=False),
        sa.Column("gateway_ip", sa.String(length=64), nullable=True),
        sa.Column("total_ips", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("used_ips", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["server_id"], ["servers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("server_id", "cidr", name="uq_ip_pools_server_cidr"),
    )
    op.create_index("ix_ip_pools_server_id", "ip_pools", ["server_id"], unique=False)
    op.create_index("ix_ip_pools_active", "ip_pools", ["is_active"], unique=False)

    op.create_table(
        "port_allocations",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("server_id", sa.String(length=32), nullable=False),
        sa.Column("port", sa.Integer(), nullable=False),
        sa.Column(
            "protocol", sa.String(length=16), nullable=False, server_default=sa.text("'udp'")
        ),
        sa.Column(
            "purpose", sa.String(length=64), nullable=False, server_default=sa.text("'peer'")
        ),
        sa.Column("device_id", sa.String(length=32), nullable=True),
        sa.Column("is_reserved", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["server_id"], ["servers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "server_id", "port", "protocol", name="uq_port_alloc_server_port_proto"
        ),
    )
    op.create_index("ix_port_alloc_server_id", "port_allocations", ["server_id"], unique=False)
    op.create_index("ix_port_alloc_reserved", "port_allocations", ["is_reserved"], unique=False)

    op.create_table(
        "control_plane_events",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column(
            "severity", sa.String(length=16), nullable=False, server_default=sa.text("'info'")
        ),
        sa.Column(
            "source",
            sa.String(length=64),
            nullable=False,
            server_default=sa.text("'control-plane'"),
        ),
        sa.Column("server_id", sa.String(length=32), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["server_id"], ["servers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cp_events_type", "control_plane_events", ["event_type"], unique=False)
    op.create_index("ix_cp_events_server", "control_plane_events", ["server_id"], unique=False)
    op.create_index("ix_cp_events_created", "control_plane_events", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_cp_events_created", table_name="control_plane_events")
    op.drop_index("ix_cp_events_server", table_name="control_plane_events")
    op.drop_index("ix_cp_events_type", table_name="control_plane_events")
    op.drop_table("control_plane_events")

    op.drop_index("ix_port_alloc_reserved", table_name="port_allocations")
    op.drop_index("ix_port_alloc_server_id", table_name="port_allocations")
    op.drop_table("port_allocations")

    op.drop_index("ix_ip_pools_active", table_name="ip_pools")
    op.drop_index("ix_ip_pools_server_id", table_name="ip_pools")
    op.drop_table("ip_pools")

"""Add latency probe table for geo-aware placement.

Revision ID: 018
Revises: 017
Create Date: 2026-02-14

"""

import sqlalchemy as sa

from alembic import op

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "latency_probes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agent_id", sa.String(length=64), nullable=False),
        sa.Column("source_region", sa.String(length=64), nullable=False),
        sa.Column("server_id", sa.String(length=32), nullable=False),
        sa.Column("latency_ms", sa.Float(), nullable=False),
        sa.Column("jitter_ms", sa.Float(), nullable=True),
        sa.Column("packet_loss_pct", sa.Float(), nullable=True),
        sa.Column("probe_ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["server_id"], ["servers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_latency_probes_server_ts", "latency_probes", ["server_id", "probe_ts"], unique=False
    )
    op.create_index(
        "ix_latency_probes_region_ts", "latency_probes", ["source_region", "probe_ts"], unique=False
    )
    op.create_index(
        "ix_latency_probes_agent_ts", "latency_probes", ["agent_id", "probe_ts"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_latency_probes_agent_ts", table_name="latency_probes")
    op.drop_index("ix_latency_probes_region_ts", table_name="latency_probes")
    op.drop_index("ix_latency_probes_server_ts", table_name="latency_probes")
    op.drop_table("latency_probes")

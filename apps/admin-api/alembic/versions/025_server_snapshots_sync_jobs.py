"""server_snapshots, sync_jobs, servers.last_snapshot_at

Revision ID: 025
Revises: 024
Create Date: 2026-02-15

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("last_snapshot_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "server_snapshots",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ts_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_server_snapshots_server_id", "server_snapshots", ["server_id"])
    op.create_index("ix_server_snapshots_ts_utc", "server_snapshots", ["ts_utc"])
    op.create_table(
        "sync_jobs",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("mode", sa.String(16), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_sync_jobs_server_id", "sync_jobs", ["server_id"])
    op.create_index("ix_sync_jobs_status", "sync_jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_sync_jobs_status", table_name="sync_jobs")
    op.drop_index("ix_sync_jobs_server_id", table_name="sync_jobs")
    op.drop_table("sync_jobs")
    op.drop_index("ix_server_snapshots_ts_utc", table_name="server_snapshots")
    op.drop_index("ix_server_snapshots_server_id", table_name="server_snapshots")
    op.drop_table("server_snapshots")
    op.drop_column("servers", "last_snapshot_at")

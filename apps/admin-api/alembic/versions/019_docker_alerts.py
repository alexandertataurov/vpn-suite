"""docker_alerts fallback telemetry alerts

Revision ID: 019
Revises: 018
Create Date: 2026-02-14

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "docker_alerts",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("fingerprint", sa.String(128), nullable=False),
        sa.Column("rule", sa.String(128), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("host_id", sa.String(64), nullable=False),
        sa.Column("container_id", sa.String(64), nullable=True),
        sa.Column("container_name", sa.String(255), nullable=True),
        sa.Column("context", postgresql.JSONB(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status_note", sa.Text(), nullable=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_docker_alerts_fingerprint", "docker_alerts", ["fingerprint"])
    op.create_index("ix_docker_alerts_host_id", "docker_alerts", ["host_id"])
    op.create_index("ix_docker_alerts_container_id", "docker_alerts", ["container_id"])
    op.create_index("ix_docker_alerts_resolved_at", "docker_alerts", ["resolved_at"])
    op.execute(
        "CREATE UNIQUE INDEX ux_docker_alerts_open_fingerprint "
        "ON docker_alerts (fingerprint) WHERE resolved_at IS NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_docker_alerts_open_fingerprint")
    op.drop_index("ix_docker_alerts_resolved_at", table_name="docker_alerts")
    op.drop_index("ix_docker_alerts_container_id", table_name="docker_alerts")
    op.drop_index("ix_docker_alerts_host_id", table_name="docker_alerts")
    op.drop_index("ix_docker_alerts_fingerprint", table_name="docker_alerts")
    op.drop_table("docker_alerts")

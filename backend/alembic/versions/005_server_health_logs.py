"""server_health_logs

Revision ID: 005
Revises: 004
Create Date: 2026-02-12

"""

import sqlalchemy as sa

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "server_health_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("latency_ms", sa.Float(), nullable=True),
        sa.Column("handshake_ok", sa.Boolean(), nullable=True),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_server_health_logs_server_id", "server_health_logs", ["server_id"])
    op.create_index("ix_server_health_logs_ts", "server_health_logs", ["ts"])


def downgrade() -> None:
    op.drop_index("ix_server_health_logs_ts", "server_health_logs")
    op.drop_index("ix_server_health_logs_server_id", "server_health_logs")
    op.drop_table("server_health_logs")

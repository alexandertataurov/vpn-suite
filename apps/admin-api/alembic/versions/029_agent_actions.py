"""agent_actions and agent_action_logs for queued agent mutations.

Revision ID: 029
Revises: 028
Create Date: 2026-02-18

"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "029"
down_revision = "028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agent_actions",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("payload", JSONB, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column(
            "requested_by",
            sa.String(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("correlation_id", sa.String(64), nullable=True),
    )
    op.create_index("ix_agent_actions_server_id_status", "agent_actions", ["server_id", "status"])
    op.create_index("ix_agent_actions_requested_at", "agent_actions", ["requested_at"])

    op.create_table(
        "agent_action_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column(
            "action_id",
            sa.String(32),
            sa.ForeignKey("agent_actions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ts", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("level", sa.String(16), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("meta", JSONB, nullable=True),
    )
    op.create_index("ix_agent_action_logs_action_id", "agent_action_logs", ["action_id"])


def downgrade() -> None:
    op.drop_index("ix_agent_action_logs_action_id", table_name="agent_action_logs")
    op.drop_table("agent_action_logs")
    op.drop_index("ix_agent_actions_requested_at", table_name="agent_actions")
    op.drop_index("ix_agent_actions_server_id_status", table_name="agent_actions")
    op.drop_table("agent_actions")

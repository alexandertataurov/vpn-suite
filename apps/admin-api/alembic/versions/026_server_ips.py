"""Add server_ips table (per-server IP with role and state).

Revision ID: 026
Revises: 025
Create Date: 2026-02-15

"""

import sqlalchemy as sa

from alembic import op

revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "server_ips",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("server_id", sa.String(length=32), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=False),
        sa.Column(
            "role", sa.String(length=16), nullable=False, server_default=sa.text("'secondary'")
        ),
        sa.Column("state", sa.String(length=32), nullable=False, server_default=sa.text("'good'")),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["server_id"], ["servers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_server_ips_server_id", "server_ips", ["server_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_server_ips_server_id", table_name="server_ips")
    op.drop_table("server_ips")

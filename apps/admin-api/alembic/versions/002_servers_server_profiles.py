"""servers, server_profiles

Revision ID: 002
Revises: 001
Create Date: 2026-02-12

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "servers",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("region", sa.String(64), nullable=False),
        sa.Column("api_endpoint", sa.String(512), nullable=False),
        sa.Column("public_key", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "server_profiles",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "server_id",
            sa.String(32),
            sa.ForeignKey("servers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("dns", postgresql.JSONB(), nullable=True),
        sa.Column("mtu", sa.Integer(), nullable=True),
        sa.Column("request_params", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_server_profiles_server_id", "server_profiles", ["server_id"])


def downgrade() -> None:
    op.drop_index("ix_server_profiles_server_id", "server_profiles")
    op.drop_table("server_profiles")
    op.drop_table("servers")

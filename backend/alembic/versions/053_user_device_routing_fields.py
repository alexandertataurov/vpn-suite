"""Add user and device fields for routing/confirmation (spec v2).

Revision ID: 053
Revises: 052
Create Date: 2026-03-07

"""

import sqlalchemy as sa

from alembic import op

revision = "053"
down_revision = "052"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("first_connected_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("last_connection_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("preferred_server_id", sa.String(32), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "server_auto_select",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("platform", sa.String(32), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("last_connection_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "last_connection_confirmed_at")
    op.drop_column("devices", "platform")
    op.drop_column("users", "last_active_at")
    op.drop_column("users", "server_auto_select")
    op.drop_column("users", "preferred_server_id")
    op.drop_column("users", "last_connection_confirmed_at")
    op.drop_column("users", "first_connected_at")

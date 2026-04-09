"""Add Server fields for public key sync tracking (public_key_synced_at, key_status).

Revision ID: 042
Revises: 041
Create Date: 2026-02-26

"""

import sqlalchemy as sa

from alembic import op

revision = "042"
down_revision = "041"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("public_key_synced_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "servers",
        sa.Column("key_status", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("servers", "key_status")
    op.drop_column("servers", "public_key_synced_at")

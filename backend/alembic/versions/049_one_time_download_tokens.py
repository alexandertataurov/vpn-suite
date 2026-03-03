"""One-time download tokens for link-based config delivery.

Revision ID: 049
Revises: 048
Create Date: 2026-03-03

"""

from alembic import op
import sqlalchemy as sa


revision = "049"
down_revision = "048"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "one_time_download_tokens",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("device_id", sa.String(length=32), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["device_id"],
            ["devices.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_one_time_download_tokens_token_hash",
        "one_time_download_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_one_time_download_tokens_device_id",
        "one_time_download_tokens",
        ["device_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_one_time_download_tokens_device_id", table_name="one_time_download_tokens")
    op.drop_index("ix_one_time_download_tokens_token_hash", table_name="one_time_download_tokens")
    op.drop_table("one_time_download_tokens")


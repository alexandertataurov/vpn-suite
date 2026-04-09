"""servers created_at index for list order

Revision ID: 020
Revises: 019
Create Date: 2026-02-15

"""

from alembic import op

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_servers_created_at",
        "servers",
        ["created_at"],
        unique=False,
        postgresql_ops={"created_at": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_servers_created_at", table_name="servers")

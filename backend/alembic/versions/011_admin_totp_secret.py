"""Add admin_users.totp_secret for 2FA (TOTP).

Revision ID: 011
Revises: 010
Create Date: 2026-02-13

"""

import sqlalchemy as sa

from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("totp_secret", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "totp_secret")

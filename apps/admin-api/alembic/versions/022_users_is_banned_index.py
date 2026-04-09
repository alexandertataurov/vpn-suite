"""users is_banned index for status filter

Revision ID: 022
Revises: 021
Create Date: 2026-02-15
"""

from alembic import op

revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_users_is_banned", "users", ["is_banned"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_is_banned", table_name="users")

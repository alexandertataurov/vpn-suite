"""Add subscriptions.auto_renew.

Revision ID: 050
Revises: 049
Create Date: 2026-03-06

"""

import sqlalchemy as sa

from alembic import op

revision = "050"
down_revision = "049"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column(
            "auto_renew",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "auto_renew")

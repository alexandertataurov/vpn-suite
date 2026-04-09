"""Add users onboarding state fields.

Revision ID: 048
Revises: 047
Create Date: 2026-02-28

"""

import sqlalchemy as sa

from alembic import op

revision = "048"
down_revision = "047"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("users", sa.Column("onboarding_step", sa.Integer(), nullable=True))
    op.add_column(
        "users",
        sa.Column("onboarding_version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.execute(
        """
        UPDATE users u
        SET onboarding_completed_at = NOW(),
            onboarding_step = 2
        WHERE EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id)
           OR EXISTS (SELECT 1 FROM devices d WHERE d.user_id = u.id)
        """
    )


def downgrade() -> None:
    op.drop_column("users", "onboarding_version")
    op.drop_column("users", "onboarding_step")
    op.drop_column("users", "onboarding_completed_at")

"""audit_logs request_id for traceability

Revision ID: 023
Revises: 022
Create Date: 2026-02-15

"""

import sqlalchemy as sa

from alembic import op

revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "audit_logs",
        sa.Column("request_id", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("audit_logs", "request_id")

"""Add progress_pct, job_type, logs_tail to sync_jobs.

Revision ID: 027
Revises: 026
Create Date: 2026-02-15

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sync_jobs",
        sa.Column(
            "job_type", sa.String(length=32), nullable=False, server_default=sa.text("'sync'")
        ),
    )
    op.add_column(
        "sync_jobs",
        sa.Column("progress_pct", sa.Integer(), nullable=True),
    )
    op.add_column(
        "sync_jobs",
        sa.Column("logs_tail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("sync_jobs", "logs_tail")
    op.drop_column("sync_jobs", "progress_pct")
    op.drop_column("sync_jobs", "job_type")

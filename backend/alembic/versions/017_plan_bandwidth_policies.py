"""Add per-plan bandwidth throttling policies.

Revision ID: 017
Revises: 016
Create Date: 2026-02-14

"""

import sqlalchemy as sa

from alembic import op

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "plan_bandwidth_policies",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("plan_id", sa.String(length=32), nullable=False),
        sa.Column("rate_mbps", sa.Integer(), nullable=False),
        sa.Column("ceil_mbps", sa.Integer(), nullable=True),
        sa.Column("burst_kb", sa.Integer(), nullable=False, server_default=sa.text("256")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default=sa.text("3")),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("plan_id", name="uq_plan_bandwidth_policies_plan_id"),
    )
    op.create_index(
        "ix_plan_bw_policy_enabled", "plan_bandwidth_policies", ["enabled"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_plan_bw_policy_enabled", table_name="plan_bandwidth_policies")
    op.drop_table("plan_bandwidth_policies")

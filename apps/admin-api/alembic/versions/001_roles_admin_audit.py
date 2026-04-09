"""roles, admin_users, audit_logs

Revision ID: 001
Revises:
Create Date: 2026-02-12

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("permissions", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_roles_name", "roles", ["name"], unique=True)

    op.create_table(
        "admin_users",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role_id", sa.String(32), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_admin_users_email", "admin_users", ["email"], unique=True)
    op.create_index("ix_admin_users_role_id", "admin_users", ["role_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("admin_id", sa.String(32), nullable=True),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("resource_type", sa.String(64), nullable=False),
        sa.Column("resource_id", sa.String(128), nullable=True),
        sa.Column("old_new", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("admin_users")
    op.drop_table("roles")

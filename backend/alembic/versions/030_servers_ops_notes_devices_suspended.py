"""servers ops_notes + cert fields; devices suspended_at.

Revision ID: 030
Revises: 029
Create Date: 2026-02-18

"""

import sqlalchemy as sa

from alembic import op

revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "servers",
        sa.Column("ops_notes", sa.Text(), nullable=True),
    )
    op.add_column(
        "servers",
        sa.Column("ops_notes_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "servers",
        sa.Column(
            "ops_notes_updated_by",
            sa.String(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "servers",
        sa.Column("cert_fingerprint", sa.String(64), nullable=True),
    )
    op.add_column(
        "servers",
        sa.Column("cert_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "devices",
        sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "suspended_at")
    op.drop_column("servers", "cert_expires_at")
    op.drop_column("servers", "cert_fingerprint")
    op.drop_column("servers", "ops_notes_updated_by")
    op.drop_column("servers", "ops_notes_updated_at")
    op.drop_column("servers", "ops_notes")

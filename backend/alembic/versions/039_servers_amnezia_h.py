"""Add servers.amnezia_h1..h4 for CSPRNG obfuscation (H1–H4).

Revision ID: 039
Revises: 038
Create Date: 2026-02-25

"""

import sqlalchemy as sa

from alembic import op

revision = "039"
down_revision = "038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("servers", sa.Column("amnezia_h1", sa.BigInteger(), nullable=True))
    op.add_column("servers", sa.Column("amnezia_h2", sa.BigInteger(), nullable=True))
    op.add_column("servers", sa.Column("amnezia_h3", sa.BigInteger(), nullable=True))
    op.add_column("servers", sa.Column("amnezia_h4", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("servers", "amnezia_h4")
    op.drop_column("servers", "amnezia_h3")
    op.drop_column("servers", "amnezia_h2")
    op.drop_column("servers", "amnezia_h1")

"""Add server_profiles.disable_ipv6_on_unstable_route.

Revision ID: 047
Revises: 046
Create Date: 2026-02-28

"""

import sqlalchemy as sa

from alembic import op

revision = "047"
down_revision = "046"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("server_profiles")}
    if "disable_ipv6_on_unstable_route" not in columns:
        op.add_column(
            "server_profiles",
            sa.Column(
                "disable_ipv6_on_unstable_route",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("server_profiles")}
    if "disable_ipv6_on_unstable_route" in columns:
        op.drop_column("server_profiles", "disable_ipv6_on_unstable_route")

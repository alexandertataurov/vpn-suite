"""
Alembic-style migration stub: add disable_ipv6_on_unstable_route to server_profiles.

This project currently does not ship full Alembic env in the repo snapshot, but the
upgrade() / downgrade() helpers are compatible with a standard Alembic setup.
Wire it into your Alembic environment as needed.
"""

from typing import Any

from sqlalchemy import Boolean, Column


def upgrade(op: Any) -> None:  # type: ignore[unused-argument]
    # op is expected to be an Alembic Operations object when run under Alembic.
    try:
        op.add_column(  # type: ignore[attr-defined]
            "server_profiles",
            Column(
                "disable_ipv6_on_unstable_route",
                Boolean(),
                nullable=False,
                server_default="false",
            ),
        )
    except Exception:
        # If migrations are managed elsewhere, this is a no-op placeholder.
        return


def downgrade(op: Any) -> None:  # type: ignore[unused-argument]
    try:
        op.drop_column("server_profiles", "disable_ipv6_on_unstable_route")  # type: ignore[attr-defined]
    except Exception:
        return

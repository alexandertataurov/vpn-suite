"""
Alembic-style migration stub: add unstable_reason and connection_profile to devices.

This keeps DB schema in sync with Device model for safeguard-reissue flow.
"""

from typing import Any

from sqlalchemy import Column, String


def upgrade(op: Any) -> None:  # type: ignore[unused-argument]
    try:
        op.add_column(  # type: ignore[attr-defined]
            "devices",
            Column("unstable_reason", String(length=64), nullable=True),
        )
        op.add_column(  # type: ignore[attr-defined]
            "devices",
            Column("connection_profile", String(length=32), nullable=True),
        )
    except Exception:
        return


def downgrade(op: Any) -> None:  # type: ignore[unused-argument]
    try:
        op.drop_column("devices", "unstable_reason")  # type: ignore[attr-defined]
        op.drop_column("devices", "connection_profile")  # type: ignore[attr-defined]
    except Exception:
        return

"""Backfill subscription_status and access_status from legacy status (spec §14.1).

Safe to run multiple times; only updates rows where derived state differs from current.
Run: `python apps/admin-api/scripts/backfill_subscription_state.py` from repo root, or `./manage.sh run backfill-subscription-state`.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# apps/admin-api/scripts/ -> apps/admin-api/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models import Subscription

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger(__name__)


def _derived_state(legacy_status: str, valid_until, now) -> tuple[str, str]:
    """Spec §14.1: Legacy status -> subscription_status, access_status."""
    if legacy_status == "pending":
        return ("pending", "blocked")
    if legacy_status == "active":
        return ("active", "enabled")
    if legacy_status == "paused":
        sub_status = "expired" if valid_until and valid_until < now else "active"
        return (sub_status, "paused")
    if legacy_status == "cancelled":
        access = "enabled" if valid_until and valid_until > now else "blocked"
        return ("cancelled", access)
    # expired or unknown
    return ("expired", "blocked")


async def run_backfill(session: AsyncSession) -> int:
    """Update subscriptions where subscription_status/access_status don't match legacy. Returns count updated."""
    now = datetime.now(timezone.utc)
    result = await session.execute(select(Subscription))
    updated = 0
    for sub in result.scalars().all():
        sub_status, access_status = _derived_state(sub.status, sub.valid_until, now)
        if sub.subscription_status != sub_status or sub.access_status != access_status:
            sub.subscription_status = sub_status
            sub.access_status = access_status
            updated += 1
    return updated


async def main() -> int:
    async with async_session_factory() as session:
        n = await run_backfill(session)
        await session.commit()
        _log.info("Backfill subscription state: %d updated", n)
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

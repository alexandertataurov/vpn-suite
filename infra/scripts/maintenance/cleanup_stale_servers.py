#!/usr/bin/env python3
"""Mark stale docker servers inactive when no heartbeat and no running container."""

from __future__ import annotations

import argparse
import asyncio
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if (ROOT / "apps" / "admin-api" / "app").exists():
    sys.path.insert(0, str(ROOT / "apps" / "admin-api"))
elif Path("/app/app").exists():
    sys.path.insert(0, "/app")
else:
    sys.path.insert(0, str(ROOT))

from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX  # noqa: E402
from app.core.database import async_session_factory  # noqa: E402
from app.core.redis_client import get_redis  # noqa: E402
from app.models import Server  # noqa: E402
from sqlalchemy import select  # noqa: E402


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _docker_running_names() -> set[str]:
    try:
        r = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode != 0:
            return set()
        return {line.strip() for line in r.stdout.splitlines() if line.strip()}
    except Exception:
        return set()


async def _has_heartbeat(server_id: str) -> bool:
    try:
        r = get_redis()
        raw = await r.get(f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id}")
        return bool(raw)
    except Exception:
        return False


async def main() -> int:
    parser = argparse.ArgumentParser(description="Deactivate stale docker servers.")
    parser.add_argument(
        "--older-than-hours",
        type=int,
        default=24,
        help="Only deactivate servers last seen before this threshold (default: 24h).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes.")
    args = parser.parse_args()

    cutoff = _now() - timedelta(hours=max(1, args.older_than_hours))
    running = _docker_running_names()
    stale: list[Server] = []

    async with async_session_factory() as session:
        rows = await session.execute(select(Server))
        servers = rows.scalars().all()
        for s in servers:
            api = s.api_endpoint or ""
            if not api.startswith("docker://"):
                continue
            name = api[len("docker://") :].strip()
            if name and name in running:
                continue
            last_ts = s.last_snapshot_at or s.created_at
            if last_ts and last_ts >= cutoff:
                continue
            if await _has_heartbeat(s.id):
                continue
            stale.append(s)

        if not stale:
            print("No stale docker servers found.")
            return 0

        print(f"Found {len(stale)} stale docker servers (cutoff: {cutoff.isoformat()}).")
        for s in stale:
            print(f"- {s.id} name={s.name} api_endpoint={s.api_endpoint} last_seen={s.last_seen_at}")

        if args.dry_run:
            print("Dry-run: no changes written.")
            return 0

        for s in stale:
            s.is_active = False
            s.status = "unreachable"
        await session.commit()
        print("Deactivated stale docker servers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

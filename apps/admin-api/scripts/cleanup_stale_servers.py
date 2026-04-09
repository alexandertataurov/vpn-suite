#!/usr/bin/env python3
"""Delete inactive server rows (optionally docker-only) older than a cutoff."""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.database import async_session_factory
from app.models import (
    AgentAction,
    ControlPlaneEvent,
    Device,
    IpPool,
    IssuedConfig,
    LatencyProbe,
    PortAllocation,
    Server,
    ServerHealthLog,
    ServerIp,
    ServerProfile,
    ServerSnapshot,
    SyncJob,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def main() -> int:
    parser = argparse.ArgumentParser(description="Delete inactive server rows.")
    parser.add_argument(
        "--older-than-hours",
        type=int,
        default=24,
        help="Only delete rows with last_snapshot/created older than this (default: 24h).",
    )
    parser.add_argument(
        "--only-docker",
        action="store_true",
        help="Only delete rows with api_endpoint starting with docker://",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not delete; just print matches.",
    )
    args = parser.parse_args()

    cutoff = _now() - timedelta(hours=max(1, args.older_than_hours))

    async with async_session_factory() as session:
        stmt = select(Server).where(Server.is_active.is_(False))
        if args.only_docker:
            stmt = stmt.where(Server.api_endpoint.like("docker://%"))
        rows = await session.execute(stmt)
        servers = rows.scalars().all()

        to_delete: list[Server] = []
        for s in servers:
            last_ts = s.last_snapshot_at or s.created_at
            if last_ts and last_ts >= cutoff:
                continue
            to_delete.append(s)

        if not to_delete:
            print("No inactive servers eligible for deletion.")
            return 0

        print(f"Found {len(to_delete)} inactive servers eligible for deletion.")
        for s in to_delete:
            print(
                f"- {s.id} name={s.name} api={s.api_endpoint} "
                f"last_snapshot={s.last_snapshot_at} created={s.created_at}"
            )

        if args.dry_run:
            print("Dry-run: no changes written.")
            return 0

        server_ids = [s.id for s in to_delete]
        # Delete dependent rows first to avoid FK violations.
        for model in (
            Device,
            IssuedConfig,
            PortAllocation,
            IpPool,
            ServerIp,
            ServerProfile,
            ServerSnapshot,
            ServerHealthLog,
            SyncJob,
            AgentAction,
            LatencyProbe,
            ControlPlaneEvent,
        ):
            await session.execute(delete(model).where(model.server_id.in_(server_ids)))
        await session.execute(delete(Server).where(Server.id.in_(server_ids)))
        await session.commit()
        print(f"Deleted {len(to_delete)} inactive server rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

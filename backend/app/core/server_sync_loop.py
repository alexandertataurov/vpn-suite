"""Background task: auto-sync server snapshots from AmneziaWG nodes (rate-limited, backoff)."""

import asyncio
import json
import logging
import time
import uuid

from sqlalchemy import select

# #region agent log
DEBUG_LOG_PATH = "/opt/vpn-suite/.cursor/debug.log"
DEBUG_LOG_FALLBACK = "/tmp/vpn-suite-debug.log"


def _agent_log(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    for path in (DEBUG_LOG_PATH, DEBUG_LOG_FALLBACK):
        try:
            with open(path, "a") as f:
                f.write(
                    json.dumps(
                        {
                            "location": location,
                            "message": message,
                            "data": data,
                            "timestamp": int(time.time() * 1000),
                            "hypothesisId": hypothesis_id,
                        }
                    )
                    + "\n"
                )
            break
        except Exception:
            continue


# #endregion

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.metrics import (
    server_snapshot_staleness_seconds,
    server_sync_latency_seconds,
    server_sync_total,
)
from app.models import Server, SyncJob
from app.services.node_runtime import NodeRuntimeAdapter
from app.services.server_sync_service import run_sync_for_server

_log = logging.getLogger(__name__)

# Per-server backoff: server_id -> (next_retry_ts, fail_count)
_backoff: dict[str, tuple[float, int]] = {}
_backoff_lock = asyncio.Lock()

INTERVAL = settings.server_sync_interval_seconds
MIN_INTERVAL = max(15, settings.server_sync_min_interval_seconds)
MAX_CONCURRENT = max(1, settings.server_sync_max_concurrent)
BACKOFF_MAX = max(60, settings.server_sync_backoff_max_seconds)
SKIP_DRAINING = settings.server_sync_skip_draining


async def _should_skip(server_id: str) -> bool:
    async with _backoff_lock:
        entry = _backoff.get(server_id)
        if entry is None:
            return False
        next_ts, _ = entry
        return time.time() < next_ts


async def _record_failure(server_id: str) -> None:
    async with _backoff_lock:
        fail_count = _backoff.get(server_id, (0, 0))[1] + 1
        # Exponential: 60, 120, 240, ... cap at BACKOFF_MAX
        delay = min(60 * (2 ** (fail_count - 1)), BACKOFF_MAX)
        next_ts = time.time() + delay
        _backoff[server_id] = (next_ts, fail_count)
        _log.debug(
            "Server sync backoff server_id=%s fail_count=%s delay=%ss", server_id, fail_count, delay
        )


async def _record_success(server_id: str) -> None:
    async with _backoff_lock:
        _backoff.pop(server_id, None)


def _server_ids_due_for_sync(servers: list, now: float) -> list[str]:
    """Return server ids where (now - last_snapshot_at) >= effective_interval."""
    out = []
    for s in servers:
        interval_sec = getattr(s, "auto_sync_interval_sec", None) or INTERVAL
        effective = max(interval_sec, MIN_INTERVAL)
        last_ts = getattr(s, "last_snapshot_at", None)
        last_run = last_ts.timestamp() if last_ts else 0.0
        if now - last_run >= effective:
            out.append(s.id)
    return out


async def _run_one_sync(
    server_id: str,
    adapter: NodeRuntimeAdapter,
    semaphore: asyncio.Semaphore,
) -> None:
    async with semaphore:
        if await _should_skip(server_id):
            return
        started = time.perf_counter()
        try:
            async with async_session_factory() as session:
                job_id = uuid.uuid4().hex[:32]
                job = SyncJob(
                    id=job_id,
                    server_id=server_id,
                    mode="auto",
                    job_type="sync",
                    status="pending",
                    request_id=None,
                )
                session.add(job)
                await session.commit()
            async with async_session_factory() as session:
                success, err = await run_sync_for_server(session, server_id, job_id, None, adapter)
                await session.commit()
            elapsed = time.perf_counter() - started
            if success:
                await _record_success(server_id)
                server_sync_total.labels(mode="auto", status="success").inc()
                server_sync_latency_seconds.observe(elapsed)
                server_snapshot_staleness_seconds.labels(server_id=server_id).set(0)
                _log.debug("Auto-sync ok server_id=%s latency_s=%.2f", server_id, elapsed)
            else:
                await _record_failure(server_id)
                server_sync_total.labels(mode="auto", status="failure").inc()
                server_sync_latency_seconds.observe(elapsed)
                # #region agent log
                _agent_log(
                    "server_sync_loop.py:_run_one_sync",
                    "auto-sync failed",
                    {"server_id": server_id, "error": err},
                    "C",
                )
                # #endregion
                _log.warning("Auto-sync failed server_id=%s: %s", server_id, err)
        except Exception as e:
            await _record_failure(server_id)
            server_sync_total.labels(mode="auto", status="failure").inc()
            server_sync_latency_seconds.observe(time.perf_counter() - started)
            # #region agent log
            _agent_log(
                "server_sync_loop.py:_run_one_sync",
                "auto-sync exception",
                {"server_id": server_id, "error": str(type(e).__name__)},
                "C",
            )
            # #endregion
            _log.warning("Auto-sync error server_id=%s: %s", server_id, e)


async def run_server_sync_loop(get_adapter) -> None:
    """Periodically sync all active servers; jitter, concurrency limit, backoff on failure."""
    # #region agent log
    _agent_log(
        "server_sync_loop.py:run_server_sync_loop",
        "sync loop start",
        {"INTERVAL": INTERVAL, "INTERVAL_le0": INTERVAL <= 0},
        "B",
    )
    # #endregion
    if INTERVAL <= 0:
        _log.info("Server sync loop disabled (interval=%s)", INTERVAL)
        return
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    while True:
        try:
            jitter = (int(time.time() * 1e6) % 15000) / 1000.0  # 0–15s
            await asyncio.sleep(INTERVAL + jitter)
            adapter = get_adapter() if callable(get_adapter) else None
            if adapter is None:
                _log.warning("Server sync skipped: no adapter")
                continue
            now = time.time()
            async with async_session_factory() as session:
                stmt = select(Server).where(Server.is_active.is_(True))
                if SKIP_DRAINING:
                    stmt = stmt.where(Server.is_draining.is_(False))
                stmt = stmt.limit(200)
                r = await session.execute(stmt)
                servers = list(r.scalars().unique().all())
            server_ids = _server_ids_due_for_sync(servers, now)
            # #region agent log
            _agent_log(
                "server_sync_loop.py:run_server_sync_loop",
                "servers due for sync",
                {
                    "servers_count": len(servers),
                    "due_count": len(server_ids),
                    "first_due_id": server_ids[0] if server_ids else None,
                },
                "D",
            )
            # #endregion
            if not server_ids:
                continue
            await asyncio.gather(*[_run_one_sync(sid, adapter, semaphore) for sid in server_ids])
        except asyncio.CancelledError:
            break
        except Exception as e:
            _log.exception("Server sync loop error: %s", e)

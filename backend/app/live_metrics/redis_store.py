from __future__ import annotations

import json
import logging
import time
from typing import Optional

from app.core.metrics import (
    live_events_in_total,
    live_redis_write_latency_seconds,
)
from app.core.redis_client import get_redis
from app.live_metrics.models import ClusterLiveSnapshot

_log = logging.getLogger(__name__)

LIVE_CLUSTER_KEY = "live:nodes:state"
LIVE_DEGRADATION_KEY = "live:meta:degradation_mode"

# TTLs for hot-state keys (seconds)
CLUSTER_TTL_SECONDS = 30


async def write_cluster_snapshot(
    snapshot: ClusterLiveSnapshot,
) -> None:
    """Persist the current cluster snapshot into Redis hot state."""
    started = time.perf_counter()
    try:
        redis = get_redis()
    except Exception as exc:  # pragma: no cover - defensive guard
        _log.debug("Live metrics: Redis not initialized: %s", exc)
        return
    try:
        payload = snapshot.model_dump(mode="json")
        data = json.dumps(payload, default=str)
        await redis.set(LIVE_CLUSTER_KEY, data, ex=CLUSTER_TTL_SECONDS)
        live_events_in_total.inc()
    except Exception as exc:
        _log.debug("Live metrics: write_cluster_snapshot failed: %s", exc)
    finally:
        live_redis_write_latency_seconds.observe(time.perf_counter() - started)


async def read_cluster_snapshot_raw() -> Optional[dict]:
    """Internal helper: return raw snapshot dict from Redis, or None."""
    try:
        redis = get_redis()
        raw = await redis.get(LIVE_CLUSTER_KEY)
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="replace")
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:  # pragma: no cover - defensive guard
        _log.debug("Live metrics: read_cluster_snapshot_raw failed: %s", exc)
        return None


async def set_degradation_mode(mode: str) -> None:
    """Set current degradation mode string in Redis (best-effort)."""
    try:
        redis = get_redis()
        await redis.set(LIVE_DEGRADATION_KEY, mode)
    except Exception as exc:  # pragma: no cover
        _log.debug("Live metrics: set_degradation_mode failed: %s", exc)


async def get_degradation_mode() -> Optional[str]:
    """Return current degradation mode string from Redis, or None."""
    try:
        redis = get_redis()
        raw = await redis.get(LIVE_DEGRADATION_KEY)
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="replace")
        return str(raw)
    except Exception as exc:  # pragma: no cover
        _log.debug("Live metrics: get_degradation_mode failed: %s", exc)
        return None


from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, Dict, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ
from app.core.metrics import (
    live_connections,
    live_dropped_updates_total,
    live_events_out_total,
    live_fanout_latency_seconds,
    live_reconnect_rate,
)
from app.core.rbac import require_permission
from app.live_metrics.redis_store import get_degradation_mode, read_cluster_snapshot_raw

router = APIRouter(prefix="/live", tags=["live"])
_log = logging.getLogger(__name__)

_CURRENT_CONNECTIONS = 0
_CONNECTION_LOCK = asyncio.Lock()


def _compute_patch(
    prev: Optional[Dict[str, Any]],
    curr: Dict[str, Any],
) -> Tuple[str, Dict[str, Any]]:
    """Return (event_type, payload) where payload is either full snapshot or a patch.

    The patch contains only nodes whose state changed (by shallow dict compare) plus
    the current summary.
    """
    if prev is None:
        return "snapshot", curr

    prev_nodes = (prev.get("nodes") or {}) if isinstance(prev.get("nodes"), dict) else {}
    curr_nodes = (curr.get("nodes") or {}) if isinstance(curr.get("nodes"), dict) else {}

    changed: Dict[str, Any] = {}
    for node_id, node_val in curr_nodes.items():
        prev_val = prev_nodes.get(node_id)
        if prev_val != node_val:
            changed[node_id] = node_val

    # Nothing changed: caller may still emit keepalive separately.
    if not changed:
        return "noop", {}

    payload = {
        "ts": curr.get("ts"),
        "summary": curr.get("summary") or {},
        "nodes": changed,
        "mode": curr.get("mode") or "normal",
        "degradation_reason": curr.get("degradation_reason"),
    }
    return "patch", payload


async def _live_events(
    request: Request,
    min_interval_ms: int,
) -> Any:
    """Async generator producing SSE events from Redis-backed live snapshot."""
    global _CURRENT_CONNECTIONS

    # Clamp interval: never faster than 500ms, never slower than 10s from this generator.
    base_interval = max(0.5, min(10.0, float(min_interval_ms) / 1000.0))
    max_event_bytes = int(getattr(settings, "live_obs_max_event_bytes", 64_000))

    prev_snapshot: Optional[Dict[str, Any]] = None
    consecutive_errors = 0

    while True:
        if await request.is_disconnected():
            break

        started = time.perf_counter()
        try:
            raw = await read_cluster_snapshot_raw()
            if not raw:
                # No data yet – emit degraded message occasionally.
                mode = await get_degradation_mode() or "circuit_open"
                payload = {"mode": mode, "reason": "no_snapshot"}
                data = json.dumps(payload, default=str)
                yield f"event: degraded\ndata: {data}\n\n"
                live_events_out_total.inc()
                consecutive_errors = 0
            else:
                event_type, payload = _compute_patch(prev_snapshot, raw)
                prev_snapshot = raw
                if event_type != "noop":
                    data = json.dumps(payload, default=str)
                    if len(data.encode("utf-8")) > max_event_bytes:
                        live_dropped_updates_total.inc()
                    else:
                        yield f"event: {event_type}\ndata: {data}\n\n"
                        live_events_out_total.inc()
                        live_fanout_latency_seconds.observe(time.perf_counter() - started)
                else:
                    # Lightweight keepalive so intermediaries keep connection open.
                    keepalive = json.dumps({"ts": raw.get("ts")}, default=str)
                    yield f"event: keepalive\ndata: {keepalive}\n\n"
                    live_events_out_total.inc()
                consecutive_errors = 0
        except asyncio.CancelledError:
            break
        except Exception as exc:  # pragma: no cover - defensive guard
            _log.exception("Live metrics stream iteration failed: %s", exc)
            consecutive_errors += 1
            if consecutive_errors >= 3:
                mode = await get_degradation_mode() or "degraded"
                payload = {"mode": mode, "reason": "internal_error"}
                data = json.dumps(payload, default=str)
                yield f"event: degraded\ndata: {data}\n\n"
                live_events_out_total.inc()
                break

        # Simple backoff based on current degradation mode.
        mode = await get_degradation_mode()
        interval = base_interval
        if mode in ("degraded", "tier1_slow"):
            interval = max(interval, 2.0)
        elif mode in ("tier2_paused", "circuit_open"):
            interval = max(interval, 5.0)

        elapsed = time.perf_counter() - started
        sleep_for = max(0.1, interval - elapsed)
        await asyncio.sleep(sleep_for)


@router.get("/metrics")
async def live_metrics_stream(
    request: Request,
    min_interval_ms: int = 1000,
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """SSE stream: cluster + node live metrics from Redis hot state.

    - One stream per admin/operator dashboard page.
    - Backed by Redis hot-state keys populated by live_metrics.aggregator_worker.
    - Emits `snapshot`, `patch`, `keepalive`, and `degraded` events.
    """
    global _CURRENT_CONNECTIONS

    max_conns = int(getattr(settings, "live_obs_sse_max_connections", 2000))
    reconnect_header = request.headers.get("last-event-id") or request.headers.get("x-last-event-id")
    if reconnect_header:
        live_reconnect_rate.inc()

    async with _CONNECTION_LOCK:
        if _CURRENT_CONNECTIONS >= max_conns:
            raise HTTPException(status_code=503, detail="Live stream capacity exceeded")
        _CURRENT_CONNECTIONS += 1
        live_connections.inc()

    async def event_generator() -> Any:
        try:
            async for chunk in _live_events(request, min_interval_ms=min_interval_ms):
                yield chunk
        finally:
            global _CURRENT_CONNECTIONS
            async with _CONNECTION_LOCK:
                _CURRENT_CONNECTIONS = max(0, _CURRENT_CONNECTIONS - 1)
                live_connections.dec()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


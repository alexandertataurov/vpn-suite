from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings
from app.core.metrics import live_node_staleness_seconds, live_queue_depth
from app.core.redis_client import get_redis
from app.core.telemetry_polling_task import push_dashboard_timeseries
from app.live_metrics.models import ClusterLiveSnapshot, ClusterLiveSummary, NodeLiveState
from app.live_metrics.redis_store import set_degradation_mode, write_cluster_snapshot
from app.services.snapshot_cache import (
    DEFAULT_ENV,
    SNAPSHOT_STALE_THRESHOLD_SECONDS,
    get_snapshot_meta,
    get_snapshot_nodes,
    get_snapshot_sessions,
)

_log = logging.getLogger(__name__)


async def _build_snapshot() -> tuple[ClusterLiveSnapshot | None, str]:
    """Build a ClusterLiveSnapshot from existing snapshot + telemetry caches.

    Returns (snapshot or None, degradation_mode).
    """
    nodes_payload = await get_snapshot_nodes(DEFAULT_ENV)
    meta_payload = await get_snapshot_meta(DEFAULT_ENV)

    if not nodes_payload or "list" not in nodes_payload:
        # No data yet – circuit open for live pipeline.
        now = datetime.now(timezone.utc)
        snap = ClusterLiveSnapshot(
            ts=now.timestamp(),
            updated_at=now,
            summary=ClusterLiveSummary(),
            nodes={},
            mode="circuit_open",
            degradation_reason="no_snapshot",
        )
        return snap, "circuit_open"

    now_ts = int(datetime.now(timezone.utc).timestamp())
    snapshot_ts = int(meta_payload.get("snapshot_ts") or now_ts)
    age_s = now_ts - snapshot_ts

    summary_raw = nodes_payload.get("summary") or {}
    node_list: list[dict[str, Any]] = nodes_payload.get("list") or []

    total_nodes = int(summary_raw.get("total") or len(node_list))
    online_nodes = int(summary_raw.get("online") or 0)
    degraded_nodes = int(summary_raw.get("degraded") or 0)
    down_nodes = int(summary_raw.get("down") or 0)

    total_peers = 0
    total_rx = 0
    total_tx = 0
    stale_nodes = 0

    nodes: dict[str, NodeLiveState] = {}

    # Reset histogram each build by just emitting new observations; old buckets decay via rate().
    for row in node_list:
        node_id = str(row.get("id") or "")
        if not node_id:
            continue
        name = (row.get("name") or "")[:64] or None
        region = (row.get("region") or "")[:32] or None
        status = str(row.get("health") or "unknown")
        stale = bool(row.get("stale"))
        last_ts = row.get("last_success_ts")
        last_ts_int = int(last_ts) if isinstance(last_ts, int | float) else None
        heartbeat_age_s = None
        if last_ts_int:
            heartbeat_age_s = max(0.0, float(snapshot_ts - last_ts_int))
            live_node_staleness_seconds.observe(heartbeat_age_s)
        elif snapshot_ts and status != "unknown":
            # Treat completely missing timestamps as very stale.
            live_node_staleness_seconds.observe(float(SNAPSHOT_STALE_THRESHOLD_SECONDS + 1))

        peers = int(row.get("peers") or 0)
        rx = int(row.get("rx") or 0)
        tx = int(row.get("tx") or 0)

        total_peers += peers
        total_rx += rx
        total_tx += tx
        if stale:
            stale_nodes += 1

        nodes[node_id] = NodeLiveState(
            node_id=node_id,
            name=name,
            region=region,
            status=status,
            heartbeat_age_s=heartbeat_age_s,
            peer_count=peers or None,
            rx_bytes=rx or None,
            tx_bytes=tx or None,
            stale=stale,
        )

    if total_nodes == 0 and nodes:
        total_nodes = len(nodes)

    summary = ClusterLiveSummary(
        total_nodes=total_nodes,
        online_nodes=online_nodes,
        degraded_nodes=degraded_nodes,
        down_nodes=down_nodes,
        total_peers=total_peers,
        total_rx_bytes=total_rx,
        total_tx_bytes=total_tx,
        stale_nodes=stale_nodes,
    )

    mode = "normal"
    degradation_reason = None
    if age_s > SNAPSHOT_STALE_THRESHOLD_SECONDS:
        mode = "degraded"
        degradation_reason = "snapshot_stale"

    snapshot = ClusterLiveSnapshot(
        ts=float(snapshot_ts),
        updated_at=datetime.fromtimestamp(snapshot_ts, tz=timezone.utc),
        summary=summary,
        nodes=nodes,
        mode=mode,
        degradation_reason=degradation_reason,
    )
    return snapshot, mode if mode != "normal" else "normal"


async def run_live_metrics_aggregator() -> None:
    """Background loop: build and write live cluster snapshot into Redis.

    This loop is intentionally cheap:
    - Reads only Redis-backed snapshot/telemetry data.
    - Does not hit Prometheus or the DB directly.
    """
    interval = max(0.5, float(getattr(settings, "live_obs_agg_interval_seconds", 1.0)))
    _log.info("Live metrics aggregator starting (interval=%.2fs)", interval)

    # Sanity check Redis on startup; if unavailable, we still loop but stay in circuit_open.
    try:
        _ = get_redis()
    except Exception as exc:  # pragma: no cover
        _log.warning("Live metrics aggregator: Redis not initialized at startup: %s", exc)

    while True:
        loop_started = time.perf_counter()
        try:
            snapshot, mode = await _build_snapshot()
            if snapshot is not None:
                await write_cluster_snapshot(snapshot)
                await set_degradation_mode(mode)
                # Populate dashboard timeseries so GET /overview/operator has fresh TX/RX/peers
                # when live_obs is enabled and telemetry_poll_loop is not running (e.g. agent mode).
                s = snapshot.summary
                # For dashboard peers, prefer handshake-based active session count from
                # sessions snapshot when available; fallback to total_peers.
                cluster_peers = s.total_peers
                try:
                    sessions = await get_snapshot_sessions(DEFAULT_ENV)
                except Exception:
                    sessions = None
                if isinstance(sessions, dict):
                    try:
                        active = int(sessions.get("active_sessions") or 0)
                    except (TypeError, ValueError):
                        active = 0
                    if active >= 0:
                        cluster_peers = active
                await push_dashboard_timeseries(
                    cluster_peers=cluster_peers,
                    cluster_rx=s.total_rx_bytes,
                    cluster_tx=s.total_tx_bytes,
                )
        except asyncio.CancelledError:
            _log.info("Live metrics aggregator cancelled")
            raise
        except Exception as exc:
            _log.exception("Live metrics aggregator iteration failed: %s", exc)

        # Expose a simple queue-depth approximation for observability (1 when
        # we are behind the target interval, 0 otherwise).
        behind = max(0.0, time.perf_counter() - loop_started - interval)
        live_queue_depth.set(1 if behind > 0 else 0)

        await asyncio.sleep(interval)

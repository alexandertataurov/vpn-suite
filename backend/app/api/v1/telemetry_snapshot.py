"""Telemetry snapshot API: single GET from cache for UI (no node/Prometheus fan-out)."""

from __future__ import annotations

import asyncio
import gzip
import json
import logging
import time
from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse

from app.core.constants import PERM_CLUSTER_READ, REDIS_KEY_TELEMETRY_LAST_SNAPSHOT_REQUEST
from app.core.metrics import telemetry_snapshot_request_duration_seconds
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.schemas.telemetry_snapshot import (
    DeviceEntryOut,
    DevicesSnapshotOut,
    DeviceSummaryOut,
    NodeEntryOut,
    NodesSnapshotOut,
    NodeSummaryOut,
    SessionsSnapshotOut,
    SnapshotMetaOut,
    TelemetrySnapshotOut,
)
from app.services.snapshot_cache import (
    DEFAULT_ENV,
    SNAPSHOT_STALE_THRESHOLD_SECONDS,
    get_snapshot_devices,
    get_snapshot_meta,
    get_snapshot_nodes,
    get_snapshot_sessions,
)

router = APIRouter(prefix="/telemetry", tags=["telemetry-snapshot"])
STREAM_INTERVAL_SEC = 2.0
COMPRESS_THRESHOLD_BYTES = 50 * 1024
_log = logging.getLogger(__name__)

SCOPE_VALUES = Literal["devices", "nodes", "sessions", "all"]
FIELDS_VALUES = frozenset(
    {"meta", "nodes.summary", "nodes.list", "devices.summary", "devices.list", "sessions"}
)


def _parse_fields(fields_str: str | None) -> frozenset[str] | None:
    """Return set of requested field names, or None if fields param not used."""
    if not fields_str or not fields_str.strip():
        return None
    return frozenset(s.strip() for s in fields_str.split(",") if s.strip()) & FIELDS_VALUES


def _build_meta_with_freshness(meta: dict | None, now_ts: int) -> SnapshotMetaOut:
    """Ensure meta has freshness set from snapshot_ts age when reading."""
    if not meta:
        return SnapshotMetaOut(
            snapshot_ts=0,
            cursor="",
            freshness="stale",
            incidents_count=0,
            stale_node_ids=[],
            partial_failure=True,
        )
    snapshot_ts = int(meta.get("snapshot_ts") or 0)
    age = now_ts - snapshot_ts if snapshot_ts else 999999
    freshness = meta.get("freshness") or "unknown"
    if age > SNAPSHOT_STALE_THRESHOLD_SECONDS and freshness == "fresh":
        freshness = "stale"
    return SnapshotMetaOut(
        snapshot_ts=snapshot_ts,
        cursor=meta.get("cursor") or "",
        freshness=freshness,
        incidents_count=int(meta.get("incidents_count") or 0),
        stale_node_ids=list(meta.get("stale_node_ids") or []),
        partial_failure=bool(meta.get("partial_failure")),
    )


@router.get("/snapshot", response_model=TelemetrySnapshotOut)
async def get_telemetry_snapshot(
    scope: SCOPE_VALUES = Query("all", description="devices|nodes|sessions|all"),
    since: str | None = Query(
        None,
        description="Cursor for delta; when set, server may return only changes (currently returns full snapshot)",
    ),
    fields: str | None = Query(
        None,
        description="Comma-separated: meta, nodes.summary, nodes.list, devices.summary, devices.list, sessions. When set, only these sections are returned (smaller payload).",
    ),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Return UI-ready telemetry snapshot from cache only. One request per page. Target < 100KB. Use meta.cursor for next since=. Optional fields= reduces payload (e.g. fields=meta,nodes.summary)."""
    started = time.perf_counter()
    env = DEFAULT_ENV
    now_ts = int(time.time())
    requested_fields = _parse_fields(fields)

    if requested_fields is not None:
        include_nodes = "nodes.summary" in requested_fields or "nodes.list" in requested_fields
        include_devices = (
            "devices.summary" in requested_fields or "devices.list" in requested_fields
        )
        include_sessions = "sessions" in requested_fields
        include_nodes_list = "nodes.list" in requested_fields
        include_devices_list = "devices.list" in requested_fields
    else:
        include_nodes = scope in ("nodes", "all")
        include_devices = scope in ("devices", "all")
        include_sessions = scope in ("sessions", "all")
        include_nodes_list = include_nodes
        include_devices_list = include_devices

    nodes_data = await get_snapshot_nodes(env) if include_nodes else None
    devices_data = await get_snapshot_devices(env) if include_devices else None
    sessions_data = await get_snapshot_sessions(env) if include_sessions else None
    meta_data = await get_snapshot_meta(env)
    if not meta_data and (include_nodes or include_devices or include_sessions):
        _log.debug(
            "telemetry snapshot cache empty (meta_data missing); ensure telemetry_snapshot_aggregator and telemetry poll are running"
        )

    meta = _build_meta_with_freshness(meta_data, now_ts)

    nodes_out = None
    if include_nodes and nodes_data:
        summary = nodes_data.get("summary") or {}
        list_raw = (nodes_data.get("list") or []) if include_nodes_list else []
        list_entries = []
        for e in list_raw:
            if not isinstance(e, dict) or not e.get("id"):
                continue
            try:
                list_entries.append(NodeEntryOut(**e))
            except Exception:
                continue
        nodes_out = NodesSnapshotOut(
            summary=NodeSummaryOut(
                total=int(summary.get("total") or 0),
                online=int(summary.get("online") or 0),
                degraded=int(summary.get("degraded") or 0),
                down=int(summary.get("down") or 0),
            ),
            list=list_entries,
        )

    devices_out = None
    if include_devices and devices_data:
        summary = devices_data.get("summary") or {}
        list_raw = (devices_data.get("list") or []) if include_devices_list else []
        device_entries = []
        for e in list_raw:
            if not isinstance(e, dict) or not e.get("id"):
                continue
            try:
                device_entries.append(DeviceEntryOut(**e))
            except Exception:
                continue
        devices_out = DevicesSnapshotOut(
            summary=DeviceSummaryOut(
                total=int(summary.get("total") or 0),
                handshake_ok=int(summary.get("handshake_ok") or 0),
                needs_reconcile=int(summary.get("needs_reconcile") or 0),
                stale=int(summary.get("stale") or 0),
            ),
            list=device_entries,
        )

    sessions_out = None
    if include_sessions and sessions_data:
        sessions_out = SessionsSnapshotOut(
            active_sessions=int(sessions_data.get("active_sessions") or 0),
            incidents_count=int(sessions_data.get("incidents_count") or 0),
        )

    out = TelemetrySnapshotOut(
        nodes=nodes_out,
        devices=devices_out,
        sessions=sessions_out,
        meta=meta,
    )
    fields_filter = "minimal" if requested_fields is not None else "full"
    telemetry_snapshot_request_duration_seconds.labels(
        scope=scope, fields_filter=fields_filter
    ).observe(time.perf_counter() - started)
    try:
        redis = get_redis()
        await redis.set(REDIS_KEY_TELEMETRY_LAST_SNAPSHOT_REQUEST, str(now_ts), ex=300)
    except Exception:
        pass
    body_bytes = out.model_dump_json().encode("utf-8")
    if len(body_bytes) > COMPRESS_THRESHOLD_BYTES:
        return Response(
            content=gzip.compress(body_bytes),
            media_type="application/json",
            headers={"Content-Encoding": "gzip"},
        )
    return out


async def _telemetry_stream_events():
    """Async generator: emit snapshot meta (counts, freshness, stale_node_ids) every 2s."""
    while True:
        try:
            meta = await get_snapshot_meta(DEFAULT_ENV)
            nodes = await get_snapshot_nodes(DEFAULT_ENV)
            devices = await get_snapshot_devices(DEFAULT_ENV)
            now_ts = int(time.time())
            snapshot_ts = int(meta.get("snapshot_ts") or 0) if meta else 0
            age = now_ts - snapshot_ts if snapshot_ts else 999999
            freshness = (meta.get("freshness") or "unknown") if meta else "unknown"
            if age > SNAPSHOT_STALE_THRESHOLD_SECONDS and freshness == "fresh":
                freshness = "stale"
            node_summary = (nodes.get("summary") or {}) if nodes else {}
            device_summary = (devices.get("summary") or {}) if devices else {}
            payload = {
                "snapshot_ts": snapshot_ts,
                "cursor": (meta.get("cursor") or "") if meta else "",
                "freshness": freshness,
                "incidents_count": int(meta.get("incidents_count") or 0) if meta else 0,
                "stale_node_ids": list(meta.get("stale_node_ids") or []) if meta else [],
                "partial_failure": bool(meta.get("partial_failure")) if meta else False,
                "nodes": node_summary,
                "devices": device_summary,
            }
            yield f"event: snapshot.meta\ndata: {json.dumps(payload)}\n\n"
        except asyncio.CancelledError:
            break
        except Exception as e:
            _log.debug("Telemetry stream iteration failed: %s", e)
        await asyncio.sleep(STREAM_INTERVAL_SEC)


@router.get("/stream")
async def telemetry_stream(
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """SSE stream: snapshot meta (counts, freshness, stale_node_ids) every ~2s. Small payloads."""
    return StreamingResponse(
        _telemetry_stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

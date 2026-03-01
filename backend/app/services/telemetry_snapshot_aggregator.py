"""Fan-in aggregator: read Redis telemetry + DB metadata, compute UI-ready snapshot, write snapshot cache."""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.core.constants import REDIS_KEY_TELEMETRY_SERVER_PREFIX
from app.core.database import async_session_factory
from app.core.redis_client import get_redis
from app.models import Device, Server
from app.services.device_telemetry_cache import (
    TELEMETRY_SUMMARY_KEY,
    device_telemetry_key,
)
from app.services.snapshot_cache import (
    DEFAULT_ENV,
    SNAPSHOT_STALE_THRESHOLD_SECONDS,
    set_snapshot_devices,
    set_snapshot_meta,
    set_snapshot_nodes,
    set_snapshot_sessions,
)

_log = logging.getLogger(__name__)

HANDSHAKE_OK_SEC = 120
TRAFFIC_RECENT_RX_TX_MIN = 1


def _valid_allowed_ips(allowed_ips: str | None) -> bool:
    if not allowed_ips or not (allowed_ips := allowed_ips.strip()):
        return False
    if allowed_ips in ("(none)", "none", "0.0.0.0/0", "::/0"):
        return False
    return "/32" in allowed_ips or "/128" in allowed_ips


def _node_health_from_status(status: str | None) -> str:
    if not status:
        return "broken"
    s = status.lower()
    if s in ("healthy", "ok"):
        return "ok"
    if s == "degraded":
        return "degraded"
    return "broken"


def _parse_last_updated_ts(data: dict | None) -> int | None:
    if not data:
        return None
    lu = data.get("last_updated")
    if not lu:
        return None
    try:
        if isinstance(lu, int | float):
            return int(lu)
        dt = datetime.fromisoformat(lu.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except (TypeError, ValueError):
        return None


async def run_snapshot_aggregator(env: str = DEFAULT_ENV) -> None:
    """Load servers/devices from DB, telemetry from Redis; build and write snapshot cache."""
    now_ts = int(datetime.now(timezone.utc).timestamp())
    stale_threshold = now_ts - SNAPSHOT_STALE_THRESHOLD_SECONDS
    server_list: list[tuple[str, str, str, str]] = []
    device_list: list[tuple[str, str, str | None]] = []

    async with async_session_factory() as session:
        r = await session.execute(
            select(Server.id, Server.name, Server.region, Server.status).where(
                Server.is_active.is_(True)
            )
        )
        server_list = [
            (str(s.id), s.name or "", s.region or "", s.status or "unknown") for s in r.all()
        ]
        if server_list:
            dev_r = await session.execute(
                select(Device.id, Device.server_id, Device.allowed_ips).where(
                    Device.server_id.in_([s[0] for s in server_list]),
                    Device.revoked_at.is_(None),
                )
            )
            device_list = [(str(row[0]), str(row[1]), row[2]) for row in dev_r.all()]

    redis = get_redis()
    server_keys = [f"{REDIS_KEY_TELEMETRY_SERVER_PREFIX}{s[0]}" for s in server_list]
    server_raw_list = await redis.mget(server_keys) if server_keys else []
    device_keys = [device_telemetry_key(d[0]) for d in device_list]
    device_raw_list = await redis.mget(device_keys) if device_keys else []
    summary_raw = await redis.get(TELEMETRY_SUMMARY_KEY)
    summary: dict = {}
    if summary_raw:
        try:
            summary = json.loads(summary_raw)
        except json.JSONDecodeError:
            pass

    telemetry_by_server: dict[str, dict] = {}
    for i, raw in enumerate(server_raw_list or []):
        if i < len(server_list) and raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    telemetry_by_server[server_list[i][0]] = data
            except json.JSONDecodeError:
                pass

    device_telemetry_by_id: dict[str, dict] = {}
    for i, raw in enumerate(device_raw_list or []):
        if i < len(device_list) and raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    device_telemetry_by_id[device_list[i][0]] = data
            except json.JSONDecodeError:
                pass

    node_entries: list[dict[str, Any]] = []
    online_count = 0
    degraded_count = 0
    down_count = 0
    stale_node_ids: list[str] = []

    for sid, name, region, status in server_list:
        telem = telemetry_by_server.get(sid)
        last_ts = _parse_last_updated_ts(telem)
        stale = last_ts is None or last_ts < stale_threshold
        if stale:
            stale_node_ids.append(sid)
        health = _node_health_from_status(status)
        if health == "ok":
            online_count += 1
        elif health == "degraded":
            degraded_count += 1
        else:
            down_count += 1
        rx = int(telem.get("total_rx_bytes") or 0) if telem else 0
        tx = int(telem.get("total_tx_bytes") or 0) if telem else 0
        peers = int(telem.get("peers_count") or 0) if telem else 0
        node_entries.append(
            {
                "id": sid,
                "name": name[:64] if name else "",
                "region": region[:32] if region else "",
                "health": health,
                "handshake_age_s": None,
                "traffic_recent": (rx + tx) >= TRAFFIC_RECENT_RX_TX_MIN,
                "peers": peers,
                "rx": rx,
                "tx": tx,
                "stale": stale,
                "last_success_ts": last_ts,
            }
        )
    nodes_payload = {
        "summary": {
            "total": len(server_list),
            "online": online_count,
            "degraded": degraded_count,
            "down": down_count,
        },
        "list": node_entries,
    }

    handshake_ok = 0
    needs_reconcile = 0
    device_stale_count = 0
    device_entries: list[dict[str, Any]] = []
    for did, server_id, allowed_ips_db in device_list:
        row = device_telemetry_by_id.get(did)
        last_ts = int(row.get("last_updated_ts", 0)) if row else 0
        stale = last_ts == 0 or last_ts < stale_threshold
        if stale:
            device_stale_count += 1
        handshake_age_s = row.get("handshake_age_sec") if row else None
        allowed_ips_on_node = (row.get("allowed_ips_on_node") or "").strip() if row else ""
        allowed_ips_ok = _valid_allowed_ips(allowed_ips_on_node or allowed_ips_db)
        rx = int(row.get("transfer_rx_bytes") or 0) if row else 0
        tx = int(row.get("transfer_tx_bytes") or 0) if row else 0
        traffic_recent = (rx + tx) >= TRAFFIC_RECENT_RX_TX_MIN
        if handshake_age_s is not None and handshake_age_s <= HANDSHAKE_OK_SEC and allowed_ips_ok:
            handshake_ok += 1
        elif not allowed_ips_ok or (
            handshake_age_s is not None and handshake_age_s > HANDSHAKE_OK_SEC
        ):
            needs_reconcile += 1
        device_entries.append(
            {
                "id": did,
                "server_id": server_id,
                "handshake_age_s": handshake_age_s,
                "allowed_ips_ok": allowed_ips_ok,
                "traffic_recent": traffic_recent,
                "stale": stale,
            }
        )
    devices_payload = {
        "summary": {
            "total": len(device_list),
            "handshake_ok": handshake_ok,
            "needs_reconcile": needs_reconcile,
            "stale": device_stale_count,
        },
        "list": device_entries,
    }

    active_sessions = int(summary.get("handshake_ok_count") or 0)
    sessions_payload = {
        "active_sessions": active_sessions,
        "incidents_count": 0,
    }

    freshness = "fresh"
    if stale_node_ids or device_stale_count > 0:
        freshness = "degraded"
    meta_payload = {
        "snapshot_ts": now_ts,
        "cursor": f"{now_ts}:0",
        "freshness": freshness,
        "incidents_count": 0,
        "stale_node_ids": stale_node_ids,
        "partial_failure": len(stale_node_ids) > 0,
    }

    await set_snapshot_nodes(nodes_payload, env)
    await set_snapshot_devices(devices_payload, env)
    await set_snapshot_sessions(sessions_payload, env)
    await set_snapshot_meta(meta_payload, env)
    _log.debug(
        "Snapshot aggregator wrote nodes=%s devices=%s stale_nodes=%s",
        len(node_entries),
        len(device_entries),
        len(stale_node_ids),
    )

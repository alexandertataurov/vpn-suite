"""Device telemetry cache: read/write per-device peer state (handshake, rx/tx) from Redis."""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.redis_client import get_redis
from app.schemas.device import (
    ConfigStateStatus,
    DeviceTelemetryOut,
    NodeHealthStatus,
    ReconciliationStatus,
)

_log = logging.getLogger(__name__)
DEVICE_TELEMETRY_PREFIX = "device_telemetry:"
DEVICE_TELEMETRY_TTL = 120  # 2 min; align with poll interval
TELEMETRY_LAST_UPDATED_KEY = "device_telemetry:last_updated"
TELEMETRY_SUMMARY_KEY = "device_telemetry:summary"
TELEMETRY_SUMMARY_TTL = 300
HANDSHAKE_OK_SEC = 120  # 2 min


def _valid_allowed_ips(allowed_ips: str | None) -> bool:
    """True if allowed_ips is a valid server-side peer value (client /32), not (none) or 0.0.0.0/0."""
    if not allowed_ips or not (allowed_ips := allowed_ips.strip()):
        return False
    if allowed_ips in ("(none)", "none", "0.0.0.0/0", "::/0"):
        return False
    return "/32" in allowed_ips or "/128" in allowed_ips


def compute_reconciliation_status(
    *,
    revoked: bool,
    allowed_ips_db: str | None,
    peer_present: bool,
    handshake_age_sec: int | None,
    node_health: NodeHealthStatus,
) -> ReconciliationStatus:
    """Compute reconciliation_status from device + cache row."""
    if revoked:
        return "needs_reconcile" if peer_present else "ok"
    if not _valid_allowed_ips(allowed_ips_db):
        return "broken"
    if node_health == "offline":
        return "needs_reconcile"
    if not peer_present:
        return "needs_reconcile"
    if handshake_age_sec is not None and handshake_age_sec > HANDSHAKE_OK_SEC:
        return "needs_reconcile"
    return "ok"


def compute_config_state(has_consumed: bool, has_pending: bool) -> ConfigStateStatus:
    if has_consumed:
        return "used"
    if has_pending:
        return "pending"
    return "issued"


def device_telemetry_key(device_id: str) -> str:
    return f"{DEVICE_TELEMETRY_PREFIX}{device_id}"


def _handshake_ok(handshake_ts: int | None, handshake_age_sec: int | None) -> bool:
    if handshake_ts and handshake_ts > 0 and handshake_age_sec is not None:
        return handshake_age_sec <= HANDSHAKE_OK_SEC
    return False


async def write_device_telemetry(
    device_id: str,
    server_id: str,
    *,
    handshake_ts: int | None = None,
    transfer_rx: int = 0,
    transfer_tx: int = 0,
    allowed_ips_on_node: str | None = None,
    node_reachable: bool = True,
) -> tuple[bool, bool, bool]:
    """Write one device's telemetry to Redis (called from poll loop). Returns (handshake_ok, no_handshake, traffic_zero)."""
    now_ts = int(datetime.now(timezone.utc).timestamp())
    handshake_age_sec = None
    if handshake_ts and handshake_ts > 0:
        handshake_age_sec = now_ts - handshake_ts
    h_ok = _handshake_ok(handshake_ts, handshake_age_sec)
    no_h = not h_ok and (handshake_ts is None or handshake_ts == 0)
    tz = (transfer_rx or 0) + (transfer_tx or 0) == 0
    payload = {
        "device_id": device_id,
        "server_id": server_id,
        "handshake_ts": handshake_ts,
        "handshake_age_sec": handshake_age_sec,
        "transfer_rx_bytes": transfer_rx,
        "transfer_tx_bytes": transfer_tx,
        "allowed_ips_on_node": allowed_ips_on_node or None,
        "peer_present": True,
        "node_health": "online" if node_reachable else "offline",
        "last_updated_ts": now_ts,
    }
    try:
        redis = get_redis()
        key = device_telemetry_key(device_id)
        await redis.set(key, json.dumps(payload), ex=DEVICE_TELEMETRY_TTL)
        await redis.set(TELEMETRY_LAST_UPDATED_KEY, str(now_ts), ex=DEVICE_TELEMETRY_TTL * 2)
    except Exception as e:
        _log.debug("Device telemetry write failed device_id=%s: %s", device_id[:8], e)
    return (h_ok, no_h, tz)


def _norm_public_key(pk: str | None) -> str:
    if not pk:
        return ""
    return (pk.strip().replace("\n", "").replace("\r", "") or "")


async def write_device_telemetry_from_heartbeat_peers(
    server_id: str,
    peers: list[dict],
    pk_to_device_id: dict[str, str],
) -> int:
    """Write device telemetry from agent heartbeat peers. pk_to_device_id maps normalized public_key -> device_id. Returns count written."""
    if not peers or not pk_to_device_id:
        return 0
    now_ts = int(datetime.now(timezone.utc).timestamp())
    written = 0
    for p in peers:
        if not isinstance(p, dict) or not p.get("public_key"):
            continue
        pk = _norm_public_key(str(p.get("public_key") or ""))
        if not pk:
            continue
        dev_id = pk_to_device_id.get(pk)
        if not dev_id:
            continue
        age = p.get("last_handshake_age_sec")
        hs_ts = (now_ts - int(age)) if isinstance(age, (int, float)) and age is not None else 0
        handshake_ts = hs_ts if hs_ts > 0 else None
        rx = int(p.get("rx_bytes") or 0)
        tx = int(p.get("tx_bytes") or 0)
        allowed_ips = (p.get("allowed_ips") or "").strip() or None
        try:
            await write_device_telemetry(
                dev_id,
                server_id,
                handshake_ts=handshake_ts,
                transfer_rx=rx,
                transfer_tx=tx,
                allowed_ips_on_node=allowed_ips,
                node_reachable=True,
            )
            written += 1
        except Exception as e:
            _log.debug("Heartbeat telemetry write failed device_id=%s: %s", dev_id[:8], e)
    if written > 0:
        try:
            redis = get_redis()
            await redis.set(TELEMETRY_LAST_UPDATED_KEY, str(now_ts), ex=DEVICE_TELEMETRY_TTL * 2)
        except Exception:
            pass
    return written


async def get_device_telemetry_bulk(
    device_ids: list[str],
) -> dict[str, DeviceTelemetryOut]:
    """Return telemetry for given device_ids from Redis. Missing keys omitted."""
    if not device_ids:
        return {}
    try:
        redis = get_redis()
        device_ids_str = [str(d) for d in device_ids]
        keys = [device_telemetry_key(did) for did in device_ids_str]
        raw_list = await redis.mget(keys)
        out: dict[str, DeviceTelemetryOut] = {}
        for i, did in enumerate(device_ids_str):
            raw = raw_list[i] if i < len(raw_list) else None
            if not raw:
                continue
            try:
                s = raw.decode("utf-8") if isinstance(raw, bytes) else raw
                data = json.loads(s)
            except (json.JSONDecodeError, TypeError):
                continue
            if not isinstance(data, dict):
                continue
            stored_id = data.get("device_id")
            if stored_id is None or str(stored_id) != did:
                continue
            last_ts = data.get("last_updated_ts")
            last_updated = (
                datetime.fromtimestamp(last_ts, tz=timezone.utc) if last_ts else None
            )
            handshake_ts = data.get("handshake_ts")
            handshake_latest_at = (
                datetime.fromtimestamp(handshake_ts, tz=timezone.utc)
                if handshake_ts and handshake_ts > 0
                else None
            )
            out[did] = DeviceTelemetryOut(
                device_id=did,
                handshake_latest_at=handshake_latest_at,
                handshake_age_sec=data.get("handshake_age_sec"),
                transfer_rx_bytes=data.get("transfer_rx_bytes"),
                transfer_tx_bytes=data.get("transfer_tx_bytes"),
                endpoint=data.get("endpoint"),
                allowed_ips_on_node=data.get("allowed_ips_on_node"),
                peer_present=bool(data.get("peer_present")),
                node_health=data.get("node_health") or "unknown",
                config_state="issued",
                reconciliation_status="ok",
                telemetry_reason=data.get("telemetry_reason"),
                last_updated=last_updated,
            )
        return out
    except Exception as e:
        _log.debug("Device telemetry bulk read failed: %s", e)
        return {}


async def set_telemetry_summary(
    handshake_ok_count: int,
    no_handshake_count: int,
    traffic_zero_count: int,
) -> None:
    """Write aggregate counts to Redis (called from poll loop)."""
    try:
        redis = get_redis()
        now_ts = int(datetime.now(timezone.utc).timestamp())
        payload = json.dumps({
            "handshake_ok_count": handshake_ok_count,
            "no_handshake_count": no_handshake_count,
            "traffic_zero_count": traffic_zero_count,
            "last_updated_ts": now_ts,
        })
        await redis.set(TELEMETRY_LAST_UPDATED_KEY, str(now_ts), ex=TELEMETRY_SUMMARY_TTL * 2)
        await redis.set(TELEMETRY_SUMMARY_KEY, payload, ex=TELEMETRY_SUMMARY_TTL)
    except Exception as e:
        _log.debug("Telemetry summary write failed: %s", e)


async def get_telemetry_summary() -> dict:
    """Return {handshake_ok_count, no_handshake_count, traffic_zero_count, last_updated_ts} from Redis."""
    try:
        redis = get_redis()
        raw = await redis.get(TELEMETRY_SUMMARY_KEY)
        if not raw:
            return {}
        s = raw.decode("utf-8") if isinstance(raw, bytes) else raw
        return json.loads(s)
    except Exception:
        return {}


async def get_telemetry_last_updated() -> datetime | None:
    """Return global last_updated timestamp for device telemetry cache."""
    try:
        redis = get_redis()
        raw = await redis.get(TELEMETRY_LAST_UPDATED_KEY)
        if not raw:
            return None
        ts = int(raw) if isinstance(raw, str) else int(raw.decode("utf-8"))
        return datetime.fromtimestamp(ts, tz=timezone.utc)
    except Exception:
        return None


def merge_telemetry_into_device(
    device: dict[str, Any],
    telemetry: DeviceTelemetryOut | None,
) -> DeviceTelemetryOut | None:
    """Enrich telemetry with reconciliation_status and config_state from device. Returns same or new DeviceTelemetryOut."""
    if telemetry is None:
        return None
    revoked = bool(device.get("revoked_at"))
    allowed_ips_db = device.get("allowed_ips")
    has_consumed = device.get("has_consumed_config", False)
    has_pending = device.get("has_pending_config", False)
    recon = compute_reconciliation_status(
        revoked=revoked,
        allowed_ips_db=allowed_ips_db,
        peer_present=telemetry.peer_present,
        handshake_age_sec=telemetry.handshake_age_sec,
        node_health=telemetry.node_health,
    )
    config_state = compute_config_state(has_consumed, has_pending)
    return DeviceTelemetryOut(
        device_id=telemetry.device_id,
        handshake_latest_at=telemetry.handshake_latest_at,
        handshake_age_sec=telemetry.handshake_age_sec,
        transfer_rx_bytes=telemetry.transfer_rx_bytes,
        transfer_tx_bytes=telemetry.transfer_tx_bytes,
        endpoint=telemetry.endpoint,
        allowed_ips_on_node=telemetry.allowed_ips_on_node,
        peer_present=telemetry.peer_present,
        node_health=telemetry.node_health,
        config_state=config_state,
        reconciliation_status=recon,
        telemetry_reason=telemetry.telemetry_reason,
        last_updated=telemetry.last_updated,
    )

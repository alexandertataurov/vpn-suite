"""Background task: periodic telemetry poll (peers, traffic) per server, cache in Redis."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.metrics import vpn_node_traffic_rx_bytes, vpn_node_traffic_tx_bytes
from app.core.redis_client import get_redis
from app.models import Server
from app.services.node_runtime import NodeRuntimeAdapter
from app.services.node_runtime_docker import node_id_from_docker_api_endpoint

_log = logging.getLogger(__name__)
INTERVAL = settings.node_telemetry_interval_seconds
TTL = settings.node_telemetry_cache_ttl_seconds
DASHBOARD_TIMESERIES_KEY = "dashboard:timeseries:cluster"
DASHBOARD_TIMESERIES_TTL_SECONDS = 24 * 3600  # keep last 24h


def _serialize_dt(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.isoformat()


async def _poll_server(
    server_id: str,
    runtime_adapter: NodeRuntimeAdapter,
    node_id_override: str | None = None,
) -> dict | None:
    """Fetch telemetry from node; return dict or None on failure."""
    node_id = node_id_override if node_id_override is not None else server_id
    try:
        raw = await runtime_adapter.list_peers(node_id)
        now_ts = int(datetime.now(timezone.utc).timestamp())
        online = sum(
            1
            for p in raw
            if int(p.get("last_handshake") or 0) > 0
            and (now_ts - int(p.get("last_handshake") or 0)) <= 180
        )
        total_rx = sum(int(p.get("transfer_rx") or 0) for p in raw)
        total_tx = sum(int(p.get("transfer_tx") or 0) for p in raw)
        if total_rx == 0 and total_tx == 0:
            for p in raw:
                tb = p.get("traffic_bytes")
                if tb:
                    total_rx = total_rx + tb
        return {
            "peers_count": len(raw),
            "online_count": online,
            "total_rx_bytes": total_rx if total_rx else None,
            "total_tx_bytes": total_tx if total_tx else None,
            "last_updated": _serialize_dt(datetime.now(timezone.utc)),
        }
    except Exception as e:
        _log.debug("Telemetry poll failed server_id=%s: %s", server_id, type(e).__name__)
        return None


async def run_telemetry_poll_loop(get_adapter) -> None:
    """Poll telemetry every INTERVAL, cache in Redis. Graceful on errors."""
    if INTERVAL <= 0:
        _log.info("Telemetry poll disabled (interval=%s)", INTERVAL)
        return
    while True:
        try:
            adapter = get_adapter() if callable(get_adapter) else None
            if adapter is None:
                _log.warning("Telemetry poll skipped: runtime adapter is unavailable")
                await asyncio.sleep(INTERVAL)
                continue
            async with async_session_factory() as session:
                r = await session.execute(
                    select(Server.id, Server.api_endpoint).where(Server.is_active.is_(True))
                )
                servers = r.all()
            redis = get_redis()
            cluster_peers = 0
            cluster_rx = 0
            cluster_tx = 0
            vpn_node_traffic_rx_bytes.clear()
            vpn_node_traffic_tx_bytes.clear()
            for server_id, api_endpoint in servers:
                node_id = node_id_from_docker_api_endpoint(api_endpoint or "") or server_id
                try:
                    data = await _poll_server(
                        server_id, runtime_adapter=adapter, node_id_override=node_id
                    )
                    if data:
                        key = f"telemetry:server:{server_id}"
                        await redis.set(key, json.dumps(data), ex=TTL)
                        peers = data.get("peers_count") or 0
                        rx = data.get("total_rx_bytes") or 0
                        tx = data.get("total_tx_bytes") or 0
                        cluster_peers += peers
                        cluster_rx += rx
                        cluster_tx += tx
                        vpn_node_traffic_rx_bytes.labels(server_id=server_id).set(rx)
                        vpn_node_traffic_tx_bytes.labels(server_id=server_id).set(tx)
                except Exception as e:
                    _log.debug("Telemetry cache write failed server_id=%s: %s", server_id, e)
            if servers:
                await _push_dashboard_timeseries(redis, cluster_peers, cluster_rx, cluster_tx)
        except Exception as e:
            _log.exception("Telemetry poll loop error: %s", e)
        await asyncio.sleep(INTERVAL)


async def _push_dashboard_timeseries(
    redis,
    cluster_peers: int,
    cluster_rx: int,
    cluster_tx: int,
) -> None:
    """Append one cluster aggregate point to Redis sorted set; keep last 24h."""
    try:
        now = datetime.now(timezone.utc)
        ts = int(now.timestamp())
        payload = json.dumps({"ts": ts, "peers": cluster_peers, "rx": cluster_rx, "tx": cluster_tx})
        await redis.zadd(DASHBOARD_TIMESERIES_KEY, {payload: ts})
        cutoff = ts - DASHBOARD_TIMESERIES_TTL_SECONDS
        await redis.zremrangebyscore(DASHBOARD_TIMESERIES_KEY, "-inf", cutoff)
    except Exception as e:
        _log.debug("Dashboard timeseries push failed: %s", type(e).__name__)


async def push_dashboard_timeseries(
    cluster_peers: int,
    cluster_rx: int,
    cluster_tx: int,
) -> None:
    """Public helper to append one cluster aggregate point to Redis."""
    try:
        redis = get_redis()
    except Exception:
        return
    await _push_dashboard_timeseries(redis, cluster_peers, cluster_rx, cluster_tx)


async def get_dashboard_timeseries(
    window_seconds: int = DASHBOARD_TIMESERIES_TTL_SECONDS,
) -> list[dict]:
    """Return list of {ts, peers, rx, tx} for dashboard (last 24h)."""
    try:
        redis = get_redis()
        now_ts = int(datetime.now(timezone.utc).timestamp())
        cutoff = now_ts - window_seconds
        raw_list = await redis.zrangebyscore(DASHBOARD_TIMESERIES_KEY, cutoff, "+inf")
        out = []
        for raw in raw_list:
            try:
                s = raw.decode("utf-8") if isinstance(raw, bytes) else raw
                out.append(json.loads(s))
            except (json.JSONDecodeError, TypeError):
                continue
        out.sort(key=lambda x: x.get("ts") or 0)
        return out
    except Exception:
        return []


async def get_cached_telemetry(server_id: str) -> dict | None:
    """Return cached telemetry dict from Redis, or None."""
    try:
        redis = get_redis()
        key = f"telemetry:server:{server_id}"
        raw = await redis.get(key)
        if raw:
            return json.loads(raw)  # type: ignore[no-any-return]
    except Exception:
        pass
    return None

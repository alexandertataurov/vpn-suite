"""Background task: periodic telemetry poll (peers, traffic) per server, cache in Redis."""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.constants import REDIS_KEY_TELEMETRY_LAST_SNAPSHOT_REQUEST
from app.core.database import async_session_factory
from app.core.metrics import (
    telemetry_poll_duration_seconds,
    telemetry_poll_last_success_timestamp,
    telemetry_poll_runs_total,
    telemetry_poll_server_failures_total,
    telemetry_poll_server_success_total,
    vpn_node_traffic_rx_bytes,
    vpn_node_traffic_tx_bytes,
)
from app.core.redis_client import get_redis
from app.models import Device, Server
from app.services.device_telemetry_cache import set_telemetry_summary, write_device_telemetry
from app.services.telemetry_snapshot_aggregator import run_snapshot_aggregator

try:
    from app.api.v1.server_utils import _agent_heartbeat_server_ids, get_agent_heartbeat
except ImportError:
    _agent_heartbeat_server_ids = None
    get_agent_heartbeat = None
from app.services.node_runtime import NodeRuntimeAdapter
from app.services.node_runtime_docker import node_id_from_docker_api_endpoint

_log = logging.getLogger(__name__)
INTERVAL = settings.node_telemetry_interval_seconds
TTL = settings.node_telemetry_cache_ttl_seconds
CONCURRENCY = max(0, getattr(settings, "node_telemetry_concurrency", 0))
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
) -> tuple[dict | None, list[dict]]:
    """Fetch telemetry from node; return (aggregates_dict or None, raw_peers_list)."""
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
        aggregates = {
            "peers_count": len(raw),
            "online_count": online,
            "total_rx_bytes": total_rx if total_rx else None,
            "total_tx_bytes": total_tx if total_tx else None,
            "last_updated": _serialize_dt(datetime.now(timezone.utc)),
        }
        return (aggregates, raw)
    except Exception as e:
        _log.debug("Telemetry poll failed server_id=%s: %s", server_id, type(e).__name__)
        return (None, [])


async def _fetch_one_server(
    server_id: str,
    api_endpoint: str | None,
    adapter: NodeRuntimeAdapter | None,
) -> tuple[str, dict | None, list[dict]]:
    """Return (server_id, data, raw_peers) for one server. Used for concurrent polling."""
    node_id = node_id_from_docker_api_endpoint(api_endpoint or "") or server_id
    data = None
    raw_peers: list[dict] = []
    if settings.node_discovery == "agent" and get_agent_heartbeat:
        hb = await get_agent_heartbeat(server_id)
        peers_list = hb.get("peers") if hb else None
        if not isinstance(peers_list, list):
            if hb and _log.isEnabledFor(logging.INFO):
                _log.info(
                    "Telemetry agent server_id=%s heartbeat has no peers list (keys=%s)",
                    server_id,
                    list(hb.keys())[:20],
                )
        if hb and isinstance(peers_list, list):
            now_ts = int(datetime.now(timezone.utc).timestamp())
            for p in peers_list:
                pk = (p.get("public_key") or "").strip() if isinstance(p, dict) else ""
                if pk:
                    age = p.get("last_handshake_age_sec")
                    hs_ts = (
                        (now_ts - int(age))
                        if isinstance(age, int | float) and age is not None
                        else 0
                    )
                    raw_peers.append(
                        {
                            "public_key": (pk.replace("\n", "").replace("\r", "") or pk),
                            "allowed_ips": p.get("allowed_ips") or "",
                            "last_handshake": hs_ts if hs_ts > 0 else 0,
                            "transfer_rx": p.get("rx_bytes") or 0,
                            "transfer_tx": p.get("tx_bytes") or 0,
                        }
                    )
            online = sum(
                1
                for q in raw_peers
                if isinstance(q.get("last_handshake"), int)
                and q["last_handshake"] > 0
                and (now_ts - q["last_handshake"]) <= 180
            )
            total_rx = sum(int(q.get("transfer_rx") or 0) for q in raw_peers)
            total_tx = sum(int(q.get("transfer_tx") or 0) for q in raw_peers)
            data = {
                "peers_count": len(raw_peers),
                "online_count": online,
                "total_rx_bytes": total_rx or None,
                "total_tx_bytes": total_tx or None,
                "last_updated": _serialize_dt(datetime.now(timezone.utc)),
            }
        elif hb:
            # Heartbeat has no peers list: use top-level total_rx_bytes/total_tx_bytes/peer_count
            # so dashboard timeseries (Cluster throughput, Traffic bytes) get data.
            total_rx = int(hb.get("total_rx_bytes") or 0)
            total_tx = int(hb.get("total_tx_bytes") or 0)
            peer_count = int(hb.get("peer_count") or 0)
            data = {
                "peers_count": peer_count,
                "online_count": peer_count,
                "total_rx_bytes": total_rx or None,
                "total_tx_bytes": total_tx or None,
                "last_updated": _serialize_dt(datetime.now(timezone.utc)),
            }
    if data is None and adapter is not None:
        data, raw_peers = await _poll_server(
            server_id, runtime_adapter=adapter, node_id_override=node_id
        )
    return (server_id, data, raw_peers)


async def run_telemetry_poll_loop(get_adapter) -> None:
    """Poll telemetry every INTERVAL, cache in Redis. Graceful on errors."""
    if INTERVAL <= 0:
        _log.info("Telemetry poll disabled (interval=%s)", INTERVAL)
        return
    while True:
        loop_start = time.perf_counter()
        try:
            adapter = get_adapter() if callable(get_adapter) else None
            if adapter is None:
                _log.warning("Telemetry poll skipped: runtime adapter is unavailable")
                telemetry_poll_runs_total.labels(status="skipped").inc()
                await asyncio.sleep(INTERVAL)
                continue
            async with async_session_factory() as session:
                # Fetch all servers to build stable alias mapping (devices may reference old/inactive ids).
                r_all = await session.execute(select(Server.id, Server.api_endpoint, Server.is_active))
                all_servers = r_all.all()
                servers = [(sid, ep) for (sid, ep, is_active) in all_servers if bool(is_active)]
                server_ids = [s[0] for s in servers]
                # In agent mode include server_ids that have heartbeats in Redis (devices may be under that id)
                if settings.node_discovery == "agent" and _agent_heartbeat_server_ids:
                    hb_ids = await _agent_heartbeat_server_ids()
                    if hb_ids:
                        server_ids = list(set(server_ids) | hb_ids)
                # Map node identifiers (e.g. docker:<container_id>) back to canonical Server.id.
                # Devices may be stored under either identifier depending on issuance mode and discovery.
                alias_to_canonical: dict[str, str] = {}
                if all_servers:
                    # Prefer an active server id as canonical for a given api_endpoint.
                    endpoint_to_canonical: dict[str, str] = {}
                    for sid, api_endpoint, is_active in all_servers:
                        ep = str(api_endpoint or "")
                        if not ep:
                            continue
                        if bool(is_active):
                            endpoint_to_canonical[ep] = str(sid)
                        else:
                            endpoint_to_canonical.setdefault(ep, str(sid))
                    for sid, api_endpoint, _ in all_servers:
                        canonical = str(sid)
                        ep = str(api_endpoint or "")
                        if ep and ep in endpoint_to_canonical:
                            canonical = endpoint_to_canonical[ep]
                        alias_to_canonical[str(sid)] = canonical
                        node_id = node_id_from_docker_api_endpoint(ep) or str(sid)
                        alias_to_canonical[str(node_id)] = canonical
                if server_ids:
                    for sid in server_ids:
                        alias_to_canonical.setdefault(str(sid), str(sid))
                pk_to_device: dict[str, tuple[str, str]] = {}
                if server_ids:
                    server_aliases = list(set(alias_to_canonical.keys()))
                    dev_r = await session.execute(
                        select(Device.id, Device.public_key, Device.server_id).where(
                            Device.server_id.in_(server_aliases), Device.revoked_at.is_(None)
                        )
                    )
                    dev_rows = dev_r.all()

                    def _norm_pk(pk: str | None) -> str:
                        if not pk:
                            return ""
                        return pk.strip().replace("\n", "").replace("\r", "") or ""

                    for row in dev_rows:
                        dev_id, pubkey, srv_id = row[0], row[1], row[2]
                        if pubkey and srv_id:
                            pk = _norm_pk(pubkey)
                            if pk:
                                srv = str(srv_id)
                                canonical = alias_to_canonical.get(srv, srv)
                                # Store under both ids so peer telemetry can match regardless of which id is used.
                                pk_to_device[f"{srv}:{pk}"] = (dev_id, srv)
                                pk_to_device[f"{canonical}:{pk}"] = (dev_id, canonical)
                    if dev_rows and not pk_to_device and _log.isEnabledFor(logging.INFO):
                        _log.info(
                            "Telemetry poll: %s active devices for server_ids %s but none had public_key (sample pubkey len=%s)",
                            len(dev_rows),
                            server_ids,
                            len((dev_rows[0][1] or "").strip()) if dev_rows else 0,
                        )
            redis = get_redis()
            cluster_seen_pubkeys: set[str] = set()
            cluster_rx = 0
            cluster_tx = 0
            cluster_online = 0
            cluster_online_sources = 0
            h_ok_count = 0
            no_handshake_count = 0
            traffic_zero_count = 0
            vpn_node_traffic_rx_bytes.clear()
            vpn_node_traffic_tx_bytes.clear()
            # Poll list: DB servers + any heartbeat-only server_ids (agent mode) so we fetch all
            server_ids_from_db = {s[0] for s in servers}
            poll_list: list[tuple[str, str | None]] = list(servers)
            if settings.node_discovery == "agent" and server_ids:
                for sid in server_ids:
                    if sid not in server_ids_from_db:
                        poll_list.append((sid, None))
            if CONCURRENCY > 0 and len(poll_list) > 1:
                results_list: list[tuple[str, dict | None, list[dict]]] = []
                for i in range(0, len(poll_list), CONCURRENCY):
                    chunk = poll_list[i : i + CONCURRENCY]
                    tasks = [_fetch_one_server(sid, ep, adapter) for sid, ep in chunk]
                    chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
                    for r in chunk_results:
                        if isinstance(r, Exception):
                            _log.debug("Telemetry fetch failed: %s", r)
                            continue
                        results_list.append(r)
                fetched = results_list
            else:
                fetched = []
                for server_id, api_endpoint in poll_list:
                    try:
                        r = await _fetch_one_server(server_id, api_endpoint, adapter)
                        fetched.append(r)
                    except Exception as e:
                        _log.debug("Telemetry fetch failed server_id=%s: %s", server_id, e)
                        telemetry_poll_server_failures_total.labels(
                            server_id=server_id, reason=type(e).__name__
                        ).inc()

            for server_id, data, raw_peers in fetched:
                try:
                    if data:
                        key = f"telemetry:server:{server_id}"
                        await redis.set(key, json.dumps(data), ex=TTL)
                        rx = data.get("total_rx_bytes") or 0
                        tx = data.get("total_tx_bytes") or 0
                        cluster_rx += rx
                        cluster_tx += tx
                        if "online_count" in data and data.get("online_count") is not None:
                            try:
                                online_val = int(data.get("online_count"))  # type: ignore[arg-type]
                            except (TypeError, ValueError):
                                online_val = None
                            if online_val is not None:
                                cluster_online += max(online_val, 0)
                                cluster_online_sources += 1
                        vpn_node_traffic_rx_bytes.labels(server_id=server_id).set(rx)
                        vpn_node_traffic_tx_bytes.labels(server_id=server_id).set(tx)
                        telemetry_poll_server_success_total.labels(server_id=server_id).inc()
                        telemetry_poll_last_success_timestamp.labels(server_id=server_id).set(
                            int(datetime.now(timezone.utc).timestamp())
                        )
                        matched_this_server = 0
                        for p in raw_peers:
                            raw_pk = str(p.get("public_key") or "").strip()
                            pubkey = raw_pk.replace("\n", "").replace("\r", "") if raw_pk else ""
                            if not pubkey:
                                continue
                            cluster_seen_pubkeys.add(pubkey)
                            composite = f"{server_id}:{pubkey}"
                            if composite in pk_to_device:
                                matched_this_server += 1
                                dev_id, _ = pk_to_device[composite]
                                hs = int(p.get("last_handshake") or 0)
                                rtt_raw = p.get("rtt_ms")
                                rtt_ms = (
                                    int(rtt_raw)
                                    if rtt_raw is not None and isinstance(rtt_raw, int | float)
                                    else None
                                )
                                if rtt_ms is not None and (rtt_ms < 0 or rtt_ms > 60000):
                                    rtt_ms = None
                                h_ok, no_h, tz = await write_device_telemetry(
                                    dev_id,
                                    server_id,
                                    handshake_ts=hs if hs > 0 else None,
                                    transfer_rx=int(p.get("transfer_rx") or 0),
                                    transfer_tx=int(p.get("transfer_tx") or 0),
                                    rtt_ms=rtt_ms,
                                    allowed_ips_on_node=str(p.get("allowed_ips") or "").strip()
                                    or None,
                                    node_reachable=True,
                                )
                                if h_ok:
                                    h_ok_count += 1
                                    _log.info(
                                        "handshake seen",
                                        extra={
                                            "event": "handshake_seen",
                                            "device_id": dev_id,
                                            "server_id": server_id,
                                        },
                                    )
                                if no_h:
                                    no_handshake_count += 1
                                if tz:
                                    traffic_zero_count += 1
                        if (
                            raw_peers
                            and matched_this_server == 0
                            and pk_to_device
                            and _log.isEnabledFor(logging.INFO)
                        ):
                            sample_peer_pk = (raw_peers[0].get("public_key") or "")[:44]
                            sample_map_keys = list(pk_to_device.keys())[:3]
                            _log.info(
                                "Telemetry poll server_id=%s: %s peers from heartbeat, 0 matched to devices (sample peer pk=%s, map keys=%s)",
                                server_id,
                                len(raw_peers),
                                sample_peer_pk,
                                sample_map_keys,
                            )
                    else:
                        telemetry_poll_server_failures_total.labels(
                            server_id=server_id, reason="no_data"
                        ).inc()
                except Exception as e:
                    _log.debug("Telemetry cache write failed server_id=%s: %s", server_id, e)
                    telemetry_poll_server_failures_total.labels(
                        server_id=server_id, reason=type(e).__name__
                    ).inc()
            if cluster_online_sources > 0:
                cluster_peers_connected = int(cluster_online)
            else:
                cluster_peers_connected = len(cluster_seen_pubkeys)
            # Push whenever we polled, or when there was nothing to poll (no servers, no heartbeats)
            # so the dashboard gets a steady stream of points and shows 0 B/s instead of stale/empty.
            await _push_dashboard_timeseries(redis, cluster_peers_connected, cluster_rx, cluster_tx)
            await set_telemetry_summary(h_ok_count, no_handshake_count, traffic_zero_count)
            _log.info(
                "Telemetry poll done servers=%s devices_in_map=%s peers_connected=%s handshake_ok=%s no_handshake=%s traffic_zero=%s",
                len(servers),
                len(pk_to_device),
                cluster_peers_connected,
                h_ok_count,
                no_handshake_count,
                traffic_zero_count,
            )
            try:
                await run_snapshot_aggregator()
            except Exception as agg_e:
                _log.debug("Snapshot aggregator failed: %s", agg_e)
            telemetry_poll_runs_total.labels(status="ok").inc()
        except Exception as e:
            _log.exception("Telemetry poll loop error: %s", e)
            telemetry_poll_runs_total.labels(status="error").inc()
        finally:
            telemetry_poll_duration_seconds.observe(time.perf_counter() - loop_start)
        sleep_interval = INTERVAL
        idle_interval = getattr(settings, "node_telemetry_interval_idle_seconds", 0)
        if idle_interval > 0:
            try:
                r = get_redis()
                if await r.get(REDIS_KEY_TELEMETRY_LAST_SNAPSHOT_REQUEST) is None:
                    sleep_interval = idle_interval
            except Exception:
                pass
        await asyncio.sleep(sleep_interval)


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

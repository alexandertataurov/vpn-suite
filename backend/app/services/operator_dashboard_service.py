"""Operator dashboard aggregation: Prometheus + DB + Redis."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select

from app.core.config import settings
from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
from app.core.database import async_session_factory
from app.core.logging_config import extra_for_event
from app.core.metrics import (
    overview_operator_latency_seconds,
    overview_operator_requests_total,
    prometheus_query_failures_total,
)
from app.core.redis_client import get_redis
from app.core.telemetry_polling_task import get_dashboard_timeseries
from app.models import Device, Server, ServerSnapshot
from app.services.snapshot_cache import get_snapshot_nodes, get_snapshot_devices

_log = logging.getLogger(__name__)


def _group_server_name(name: str) -> str:
    """Group servers by base name (strip trailing digits, e.g. amnezia-awg2 → amnezia-awg)."""
    name = (name or "").strip()
    return name.rstrip("0123456789")


# Operator dashboard freshness: request-time aggregation. Aligns with frontend telemetry-freshness (30s/120s).
FRESH_S = 30
DEGRADED_S = 120
TIME_RANGE_SECONDS = {"5m": 300, "15m": 900, "1h": 3600, "6h": 21600, "24h": 86400}


def _scalar_from_result(rows: list[dict[str, Any]]) -> float | int | None:
    if not rows or not isinstance(rows[0], dict):
        return None
    val = rows[0].get("value")
    if not isinstance(val, list | tuple) or len(val) < 2:
        return None
    try:
        v = float(val[1])
        return int(v) if v == int(v) else v
    except (TypeError, ValueError):
        return None


def _ts_from_result(rows: list[dict[str, Any]]) -> float | None:
    if not rows or not isinstance(rows[0], dict):
        return None
    val = rows[0].get("value")
    if not isinstance(val, list | tuple) or len(val) < 1:
        return None
    try:
        return float(val[0])
    except (TypeError, ValueError):
        return None


def _freshness(age_s: float | None) -> str:
    if age_s is None:
        return "unknown"
    if age_s <= FRESH_S:
        return "fresh"
    if age_s <= DEGRADED_S:
        return "degraded"
    return "stale"


async def fetch_operator_dashboard(
    time_range: str = "1h",
    request: Any | None = None,
) -> dict[str, Any]:
    """Aggregate health strip, cluster matrix, incidents, servers, timeseries."""
    from app.services.prometheus_query_service import PrometheusQueryService

    started = time.perf_counter()
    now = datetime.now(timezone.utc)
    data_status = "ok"
    last_successful_sample_ts: str | None = None
    prom_failures = 0
    _log.info(
        "operator dashboard request",
        extra=extra_for_event(
            event="overview_operator_request",
            route="/api/v1/overview/operator",
            method="GET",
            entity_id=time_range,
        ),
    )

    prom = PrometheusQueryService()
    servers: list[Any] = []
    async with async_session_factory() as db:
        result = await db.execute(
            select(
                Server.id,
                Server.name,
                Server.region,
                Server.status,
                Server.api_endpoint,
            ).where(Server.is_active.is_(True))
        )
        servers = list(result.all())
        # Fallback: show all servers when none are active (e.g. offline until agent connects)
        if not servers:
            fallback = await db.execute(
                select(
                    Server.id,
                    Server.name,
                    Server.region,
                    Server.status,
                    Server.api_endpoint,
                )
            )
            servers = list(fallback.all())

    # Docker discovery mode: limit operator view to VPN containers and dedupe by name.
    if getattr(settings, "node_discovery", "docker") == "docker":
        raw = getattr(settings, "docker_vpn_container_prefixes", "amnezia-awg") or "amnezia-awg"
        prefixes = [p.strip() for p in raw.split(",") if p.strip()]
        if prefixes:
            filtered: list[Any] = []
            for s in servers:
                name = (getattr(s, "name", "") or "").strip()
                if not any(name.startswith(p) for p in prefixes):
                    continue
                filtered.append(s)
            servers = filtered

        by_name: dict[str, Any] = {}

        def _status_score(row: Any) -> int:
            status = (getattr(row, "status", "") or "").lower()
            if status in ("healthy", "ok"):
                return 3
            if status == "degraded":
                return 2
            if status in ("offline", "unreachable", "down", "error"):
                return 1
            return 0

        for s in servers:
            raw_name = (getattr(s, "name", "") or "").strip() or str(getattr(s, "id", ""))
            group = _group_server_name(raw_name)
            existing = by_name.get(group)
            if existing is None or _status_score(s) >= _status_score(existing):
                by_name[group] = s

        servers = list(by_name.values())

    server_ids = [str(s.id) for s in servers]
    server_by_id = {str(s.id): s for s in servers}

    health_strip: dict[str, Any] = {
        "api_status": "unknown",
        "prometheus_status": "down",
        "total_nodes": len(servers),
        "online_nodes": 0,
        "active_sessions": 0,
        "peers_active": None,
        "handshake_max_age_sec": None,
        "total_throughput_bps": 0,
        "avg_latency_ms": None,
        "error_rate_pct": 0.0,
        "last_updated": now.isoformat(),
        "refresh_mode": "polling",
        "freshness": "unknown",
    }

    cluster_matrix: list[dict[str, Any]] = []
    incidents: list[dict[str, Any]] = []
    server_rows: list[dict[str, Any]] = []
    timeseries_points: list[dict[str, int]] = []
    user_sessions: dict[str, Any] = {
        "active_users": 0,
        "new_sessions_per_min": None,
        "peak_concurrency_24h": None,
        "delta_1h": None,
        "delta_24h": None,
    }

    # DB fallbacks
    async with async_session_factory() as db:
        peers_total = (
            await db.execute(
                select(func.count()).select_from(Device).where(Device.revoked_at.is_(None))
            )
        ).scalar_one_or_none() or 0
    health_strip["active_sessions"] = peers_total
    user_sessions["active_users"] = peers_total

    region_counts: dict[str, dict[str, int]] = {}
    for s in servers:
        r = s.region or "unknown"
        if r not in region_counts:
            region_counts[r] = {"total": 0, "online": 0}
        region_counts[r]["total"] += 1
        if s.status in ("healthy", "ok", "degraded"):
            region_counts[r]["online"] += 1
            health_strip["online_nodes"] += 1

    if prom.enabled:
        queries = {
            "api_up": 'up{job="admin-api"}',
            "vpn_nodes_total": "sum(vpn_nodes_total)",
            "vpn_nodes_online": 'sum(vpn_nodes_total{status=~"healthy|ok|degraded"})',
            "vpn_cluster_load": "vpn_cluster_load",
            "vpn_peers": 'vpn_peers_total{status="active"}',
            "agent_peers_active": "sum(agent_peers_active)",
            "agent_handshake_max_age": "max(agent_last_handshake_max_age_seconds)",
            "error_rate": (
                'sum(rate(http_requests_total{job="admin-api",status_class="5xx"}[5m])) '
                '/ (sum(rate(http_requests_total{job="admin-api"}[5m])) + 1e-9) * 100'
            ),
            "latency_p50": (
                "histogram_quantile(0.5, "
                'sum(rate(http_request_duration_seconds_bucket{job="admin-api"}[5m])) by (le)) * 1000'
            ),
        }
        tasks = {k: prom.query(v) for k, v in queries.items()}
        results: dict[str, list] = {}
        batch = await asyncio.gather(*tasks.values(), return_exceptions=True)
        for k, res in zip(tasks.keys(), batch, strict=False):
            if isinstance(res, Exception):
                prom_failures += 1
                prometheus_query_failures_total.labels(query_name=k).inc()
                _log.warning(
                    "operator prometheus query failed",
                    extra=extra_for_event(
                        event="prometheus_query_failed",
                        route="/api/v1/overview/operator",
                        method="GET",
                        entity_id=k,
                        error_kind="external",
                        error_code="PROM_QUERY_FAILED",
                        error_severity="warning",
                        error_retryable=True,
                    ),
                )
                results[k] = []
            else:
                results[k] = res or []

        if prom_failures > 0:
            data_status = "degraded"
        core_query_names = (
            "api_up",
            "vpn_nodes_online",
            "vpn_cluster_load",
            "vpn_peers",
            "error_rate",
            "latency_p50",
        )
        if not any(results.get(name) for name in core_query_names):
            data_status = "degraded"
            prom_failures += 1
            prometheus_query_failures_total.labels(query_name="core_batch_empty").inc()
            _log.warning(
                "operator prometheus core batch empty",
                extra=extra_for_event(
                    event="prometheus_query_failed",
                    route="/api/v1/overview/operator",
                    method="GET",
                    entity_id="core_batch_empty",
                    error_kind="external",
                    error_code="PROM_CORE_EMPTY",
                    error_severity="warning",
                    error_retryable=True,
                ),
            )

        api_up = _scalar_from_result(results.get("api_up", []))
        if api_up is not None:
            health_strip["api_status"] = "ok" if api_up == 1 else "down"
            health_strip["prometheus_status"] = "ok"
        elif prom.enabled:
            # Prometheus not scraped yet or no data: show API as ok (we're serving), Prometheus as degraded
            health_strip["api_status"] = "ok"
            health_strip["prometheus_status"] = "degraded"

        vpn_online = _scalar_from_result(results.get("vpn_nodes_online", []))
        if vpn_online is not None:
            health_strip["online_nodes"] = int(vpn_online)

        cluster_load = _scalar_from_result(
            results.get("vpn_cluster_load", [])
        ) or _scalar_from_result(results.get("vpn_peers", []))
        if cluster_load is not None:
            health_strip["active_sessions"] = int(cluster_load)
            user_sessions["active_users"] = int(cluster_load)

        err = _scalar_from_result(results.get("error_rate", []))
        if err is not None:
            health_strip["error_rate_pct"] = round(float(err), 2)
            if health_strip["api_status"] == "ok" and float(err) >= 5:
                health_strip["api_status"] = "degraded"
            elif health_strip["api_status"] == "ok" and float(err) >= 1:
                health_strip["api_status"] = "degraded"

        lat = _scalar_from_result(results.get("latency_p50", []))
        if lat is not None:
            health_strip["avg_latency_ms"] = round(float(lat), 1)

        peers_active = _scalar_from_result(results.get("agent_peers_active", []))
        if peers_active is not None:
            health_strip["peers_active"] = int(peers_active)

        hs_max = _scalar_from_result(results.get("agent_handshake_max_age", []))
        if hs_max is not None:
            health_strip["handshake_max_age_sec"] = int(hs_max)

        # Incidents
        if api_up == 0:
            incidents.append(
                {
                    "severity": "critical",
                    "entity": "admin-api",
                    "metric": "up",
                    "value": 0,
                    "timestamp": now.isoformat(),
                    "status": "open",
                    "affected_servers": len(servers),
                    "link": "/servers",
                }
            )

        if err is not None and float(err) > 5:
            incidents.append(
                {
                    "severity": "warning",
                    "entity": "cluster",
                    "metric": "error_rate_pct",
                    "value": float(err),
                    "timestamp": now.isoformat(),
                    "status": "open",
                    "affected_servers": len(servers),
                    "link": "/audit",
                }
            )

        # Per-server telemetry: prefer snapshot cache (no N×Prometheus); else fallback
        telemetry_map: dict[str, dict] = {}
        snapshot_nodes_data = await get_snapshot_nodes()
        if snapshot_nodes_data and (snapshot_nodes_data.get("list")):
            node_list = snapshot_nodes_data.get("list") or []
            for n in node_list:
                sid = n.get("id")
                if not sid:
                    continue
                health_val = (
                    1.0
                    if n.get("health") == "ok"
                    else (0.5 if n.get("health") == "degraded" else 0.0)
                )
                telemetry_map[sid] = {
                    "health": health_val,
                    "peers": int(n.get("peers") or 0),
                    "cpu": None,
                    "ram": None,
                    "rx": int(n.get("rx") or 0),
                    "tx": int(n.get("tx") or 0),
                    "last_ts": n.get("last_success_ts"),
                }
            if prom.enabled:
                try:
                    cpu_results = await prom.query("vpn_node_cpu_utilization")
                    for r in cpu_results or []:
                        if isinstance(r, dict):
                            node_id = (r.get("metric") or {}).get("node_id")
                            if node_id and node_id in telemetry_map:
                                val = r.get("value")
                                if isinstance(val, list | tuple) and len(val) >= 2:
                                    try:
                                        telemetry_map[node_id]["cpu"] = float(val[1])
                                    except (TypeError, ValueError):
                                        pass
                except Exception:
                    prom_failures += 1
                    prometheus_query_failures_total.labels(query_name="vpn_node_cpu_batch").inc()
                try:
                    ram_results = await prom.query("vpn_node_memory_utilization")
                    for r in ram_results or []:
                        if isinstance(r, dict):
                            node_id = (r.get("metric") or {}).get("node_id")
                            if node_id and node_id in telemetry_map:
                                val = r.get("value")
                                if isinstance(val, list | tuple) and len(val) >= 2:
                                    try:
                                        telemetry_map[node_id]["ram"] = float(val[1])
                                    except (TypeError, ValueError):
                                        pass
                except Exception:
                    prom_failures += 1
                    prometheus_query_failures_total.labels(query_name="vpn_node_ram_batch").inc()
        elif server_ids:
            for sid in server_ids:
                telemetry_map[sid] = {
                    "health": None,
                    "peers": None,
                    "cpu": None,
                    "ram": None,
                    "rx": None,
                    "tx": None,
                    "last_ts": None,
                }
            if prom.enabled:
                try:
                    cpu_results = await prom.query("vpn_node_cpu_utilization")
                    for r in cpu_results or []:
                        if isinstance(r, dict):
                            node_id = (r.get("metric") or {}).get("node_id")
                            if node_id and node_id in telemetry_map:
                                val = r.get("value")
                                if isinstance(val, list | tuple) and len(val) >= 2:
                                    try:
                                        telemetry_map[node_id]["cpu"] = float(val[1])
                                    except (TypeError, ValueError):
                                        pass
                except Exception:
                    prom_failures += 1
                    prometheus_query_failures_total.labels(query_name="vpn_node_cpu_batch").inc()
                try:
                    ram_results = await prom.query("vpn_node_memory_utilization")
                    for r in ram_results or []:
                        if isinstance(r, dict):
                            node_id = (r.get("metric") or {}).get("node_id")
                            if node_id and node_id in telemetry_map:
                                val = r.get("value")
                                if isinstance(val, list | tuple) and len(val) >= 2:
                                    try:
                                        telemetry_map[node_id]["ram"] = float(val[1])
                                    except (TypeError, ValueError):
                                        pass
                except Exception:
                    prom_failures += 1
                    prometheus_query_failures_total.labels(query_name="vpn_node_ram_batch").inc()

        # Redis telemetry overlay for all servers (peers, rx, tx, cpu, ram, last_ts)
        if telemetry_map and server_ids:
            try:
                redis = get_redis()
                for sid in server_ids:
                    if sid not in telemetry_map:
                        continue
                    raw = await redis.get(f"telemetry:server:{sid}")
                    if not raw:
                        continue
                    try:
                        data = json.loads(raw)
                        if not isinstance(data, dict):
                            continue
                        if telemetry_map[sid].get("peers") is None:
                            telemetry_map[sid]["peers"] = data.get("peers_count")
                        if telemetry_map[sid].get("rx") is None:
                            telemetry_map[sid]["rx"] = data.get("total_rx_bytes")
                        if telemetry_map[sid].get("tx") is None:
                            telemetry_map[sid]["tx"] = data.get("total_tx_bytes")
                        if (
                            telemetry_map[sid].get("cpu") is None
                            and data.get("cpu_pct") is not None
                        ):
                            try:
                                telemetry_map[sid]["cpu"] = float(data["cpu_pct"])
                            except (TypeError, ValueError):
                                pass
                        if (
                            telemetry_map[sid].get("ram") is None
                            and data.get("ram_pct") is not None
                        ):
                            try:
                                telemetry_map[sid]["ram"] = float(data["ram_pct"])
                            except (TypeError, ValueError):
                                pass
                        if telemetry_map[sid].get("last_ts") is None:
                            lu = data.get("last_updated")
                            if lu:
                                try:
                                    dt = datetime.fromisoformat(str(lu).replace("Z", "+00:00"))
                                    telemetry_map[sid]["last_ts"] = dt.timestamp()
                                except (ValueError, TypeError):
                                    pass
                    except json.JSONDecodeError:
                        pass
            except Exception:
                pass

        # Agent heartbeat fallback
        try:
            redis = get_redis()
            for sid in server_ids:
                raw = await redis.get(f"{REDIS_KEY_AGENT_HB_PREFIX}{sid}")
                if raw and sid in telemetry_map:
                    try:
                        hb = json.loads(raw)
                        if telemetry_map[sid]["health"] is None and "health_score" in hb:
                            hs = hb["health_score"]
                            telemetry_map[sid]["health"] = (
                                float(hs) * 100 if float(hs) <= 1 else float(hs)
                            )
                        if telemetry_map[sid]["peers"] is None and "peer_count" in hb:
                            telemetry_map[sid]["peers"] = int(hb["peer_count"])
                        if "ts_utc" in hb:
                            try:
                                dt = datetime.fromisoformat(
                                    str(hb["ts_utc"]).replace("Z", "+00:00")
                                )
                                telemetry_map[sid]["last_ts"] = dt.timestamp()
                            except (ValueError, TypeError):
                                pass
                    except (json.JSONDecodeError, TypeError, ValueError):
                        pass
        except Exception:
            pass

        snapshot_map: dict[str, dict[str, float | None]] = {}
        if server_ids:
            async with async_session_factory() as db:
                r = await db.execute(
                    select(ServerSnapshot)
                    .where(ServerSnapshot.server_id.in_(server_ids))
                    .where(ServerSnapshot.status == "success")
                    .distinct(ServerSnapshot.server_id)
                    .order_by(ServerSnapshot.server_id, ServerSnapshot.ts_utc.desc())
                )
                rows = r.scalars().all()
                for snap in rows:
                    res = (snap.payload_json or {}).get("resources") or {}
                    snapshot_map[str(snap.server_id)] = {
                        "cpu": res.get("cpu_pct"),
                        "ram": res.get("ram_pct"),
                        "ts": snap.ts_utc.timestamp() if snap.ts_utc else None,
                    }

        docker_containers_by_name: dict[str, Any] = {}
        if request is not None and server_ids:
            app_obj = getattr(request, "app", None)
            state = getattr(app_obj, "state", None) if app_obj is not None else None
            service = (
                getattr(state, "docker_telemetry_service", None) if state is not None else None
            )
            if service is not None:
                try:
                    containers = await service.list_containers("local")
                    docker_containers_by_name = {
                        getattr(c, "name"): c for c in containers if getattr(c, "name", None)
                    }
                except Exception:
                    docker_containers_by_name = {}

        for sid in server_ids:
            s = server_by_id.get(sid)
            if not s:
                continue
            tm = telemetry_map.get(sid, {})
            snap = snapshot_map.get(sid)
            if snap and (tm.get("cpu") is None or tm.get("ram") is None):
                # Prometheus CPU/RAM metrics are missing; fall back to last snapshot resources.
                if tm.get("cpu") is None:
                    tm["cpu"] = snap.get("cpu")
                if tm.get("ram") is None:
                    tm["ram"] = snap.get("ram")
                if tm.get("last_ts") is None and snap.get("ts") is not None:
                    tm["last_ts"] = snap.get("ts")
            if (tm.get("cpu") is None or tm.get("ram") is None) and docker_containers_by_name:
                api_ep = getattr(s, "api_endpoint", None) or ""
                container_name = ""
                if isinstance(api_ep, str) and api_ep.startswith("docker://"):
                    container_name = api_ep[len("docker://") :].strip().split("/")[0]
                if not container_name:
                    container_name = (getattr(s, "name", "") or "").strip()
                c = docker_containers_by_name.get(container_name)
                if c is not None:
                    cpu_val = getattr(c, "cpu_pct", None)
                    mem_val = getattr(c, "mem_pct", None)
                    if tm.get("cpu") is None and cpu_val is not None:
                        try:
                            tm["cpu"] = float(cpu_val)
                        except (TypeError, ValueError):
                            pass
                    if tm.get("ram") is None and mem_val is not None:
                        try:
                            tm["ram"] = float(mem_val)
                        except (TypeError, ValueError):
                            pass
            if tm.get("health") is None and tm.get("peers") is None:
                data_status = "degraded"
            last_ts = tm.get("last_ts")
            age_s = (now.timestamp() - last_ts) if last_ts else None
            rx = tm.get("rx") or 0
            tx = tm.get("tx") or 0
            throughput = float(rx) + float(tx)
            server_rows.append(
                {
                    "id": sid,
                    "name": s.name or sid,
                    "region": s.region or "—",
                    "ip": (s.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0]
                    if s.api_endpoint
                    else "—",
                    "status": "online"
                    if s.status in ("healthy", "ok")
                    else ("degraded" if s.status == "degraded" else "offline"),
                    "cpu_pct": tm.get("cpu"),
                    "ram_pct": tm.get("ram"),
                    "users": int(tm.get("peers") or 0),
                    "throughput_bps": int(throughput),
                    "last_heartbeat": datetime.fromtimestamp(last_ts, tz=timezone.utc).isoformat()
                    if last_ts
                    else None,
                    "freshness": _freshness(age_s),
                    "to": f"/servers/{sid}",
                }
            )

        # Stale nodes incident
        for row in server_rows:
            if row["freshness"] == "stale":
                incidents.append(
                    {
                        "severity": "warning",
                        "entity": row["name"],
                        "metric": "freshness",
                        "value": "stale",
                        "timestamp": now.isoformat(),
                        "status": "open",
                        "affected_servers": 1,
                        "link": row["to"],
                    }
                )

    else:
        data_status = "degraded"
        for s in servers:
            server_rows.append(
                {
                    "id": s.id,
                    "name": s.name or s.id,
                    "region": s.region or "—",
                    "ip": (s.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0]
                    if s.api_endpoint
                    else "—",
                    "status": "online"
                    if s.status in ("healthy", "ok")
                    else ("degraded" if s.status == "degraded" else "offline"),
                    "cpu_pct": None,
                    "ram_pct": None,
                    "users": 0,
                    "throughput_bps": 0,
                    "last_heartbeat": None,
                    "freshness": "unknown",
                    "to": f"/servers/{s.id}",
                }
            )

    for region, counts in region_counts.items():
        region_servers = [r for r in server_rows if (r.get("region") or "—") == region]
        cpu_vals = [r["cpu_pct"] for r in region_servers if r.get("cpu_pct") is not None]
        ram_vals = [r["ram_pct"] for r in region_servers if r.get("ram_pct") is not None]
        cpu_avg = round(sum(cpu_vals) / len(cpu_vals), 1) if cpu_vals else None
        ram_avg = round(sum(ram_vals) / len(ram_vals), 1) if ram_vals else None
        cluster_matrix.append(
            {
                "region": region,
                "total_nodes": counts["total"],
                "online": counts["online"],
                "cpu_avg": cpu_avg,
                "ram_avg": ram_avg,
                "users": sum(r["users"] for r in region_servers),
                "throughput": sum(r["throughput_bps"] for r in region_servers),
                "error_pct": health_strip["error_rate_pct"],
                "latency_p95": None,
                "health": "ok"
                if counts["online"] == counts["total"]
                else ("degraded" if counts["online"] > 0 else "down"),
            }
        )

    # Timeseries from Redis (defensive: malformed pts or missing keys never break response)
    window = TIME_RANGE_SECONDS.get(time_range, 3600)
    timeseries_points = []
    try:
        pts = await get_dashboard_timeseries(window)
        for p in pts or []:
            if not isinstance(p, dict):
                continue
            try:
                ts = int(p.get("ts") or 0)
            except (TypeError, ValueError):
                continue
            timeseries_points.append(
                {
                    "ts": ts,
                    "peers": int(p.get("peers") or 0),
                    "rx": int(p.get("rx") or 0),
                    "tx": int(p.get("tx") or 0),
                }
            )
    except Exception as e:
        _log.debug("get_dashboard_timeseries failed: %s", e)
    # Ensure multiple points so frontend charts render (avoids flat/empty when Redis is empty or stale)
    if not timeseries_points:
        now_ts = int(now.timestamp())
        n_pts = min(10, max(5, window // 60))
        step = max(30, window // n_pts)
        timeseries_points = [
            {"ts": now_ts - (n_pts - 1 - i) * step, "peers": 0, "rx": 0, "tx": 0}
            for i in range(n_pts)
        ]

    # P95 latency over time (Prometheus range query) for continuous chart
    latency_timeseries: list[dict[str, float]] = []
    if prom.enabled and window > 0:
        try:
            end_dt = now
            start_dt = now - timedelta(seconds=window)
            step = max(15, min(60, window // 20))
            p95_expr = (
                "histogram_quantile(0.95, "
                'sum(rate(http_request_duration_seconds_bucket{job="admin-api"}[5m])) by (le)) * 1000'
            )
            range_result = await prom.query_range(
                p95_expr, start=start_dt, end=end_dt, step_seconds=step
            )
            if range_result and isinstance(range_result[0], dict):
                values = range_result[0].get("values") or []
                for item in values:
                    if not isinstance(item, list | tuple) or len(item) < 2:
                        continue
                    try:
                        ts_float = float(item[0])
                        val_float = float(item[1])
                        if ts_float and val_float >= 0:
                            latency_timeseries.append(
                                {"ts": int(ts_float), "latency_ms": round(val_float, 1)}
                            )
                    except (TypeError, ValueError):
                        continue
        except Exception as e:
            _log.debug("latency range query failed: %s", e)

    last_ts = timeseries_points[-1]["ts"] if timeseries_points else None
    # Fallback: when timeseries is empty but Prometheus has data, use Prometheus sample ts
    if last_ts is None and prom.enabled and results:
        for name in ("vpn_cluster_load", "api_up", "vpn_peers"):
            ts = _ts_from_result(results.get(name, []))
            if ts is not None:
                last_ts = ts
                break
    age_s = (now.timestamp() - last_ts) if last_ts else None
    health_strip["freshness"] = _freshness(age_s)
    if last_ts:
        last_successful_sample_ts = datetime.fromtimestamp(last_ts, tz=timezone.utc).isoformat()
    # If Redis timeseries are fresh (traffic/throughput source), treat as ok so we don't show
    # "Prometheus/telemetry is degraded" when only Prometheus VPN metrics are missing.
    if data_status == "degraded" and age_s is not None and age_s <= DEGRADED_S:
        data_status = "ok"

    # Prefer handshake-based active session count from telemetry snapshot when available.
    # This treats "connected peers" as devices with a recent handshake AND valid allowed_ips,
    # matching the Telemetry page semantics (devices.summary.handshake_ok).
    try:
        devices_snapshot = await get_snapshot_devices()
    except Exception:
        devices_snapshot = None
    if isinstance(devices_snapshot, dict):
        try:
            handshake_ok = int(
                (devices_snapshot.get("summary") or {}).get("handshake_ok") or 0
            )
        except (TypeError, ValueError):
            handshake_ok = 0
        if handshake_ok > 0:
            health_strip["peers_active"] = handshake_ok

    # Populate strip from timeseries when Prometheus and telemetry summary did not (peers_active, total_throughput_bps)
    if timeseries_points:
        last_pt = timeseries_points[-1]
        if health_strip.get("peers_active") is None and last_pt.get("peers") is not None:
            health_strip["peers_active"] = int(last_pt["peers"])
        if len(timeseries_points) >= 2:
            p1, p2 = timeseries_points[-2], timeseries_points[-1]
            dt = max(0.001, float(p2["ts"] - p1["ts"]))
            delta_rx = int(p2.get("rx") or 0) - int(p1.get("rx") or 0)
            delta_tx = int(p2.get("tx") or 0) - int(p1.get("tx") or 0)
            health_strip["total_throughput_bps"] = max(0, int((delta_rx + delta_tx) / dt))

    if data_status == "degraded":
        _log.warning(
            "operator dashboard partial response",
            extra=extra_for_event(
                event="overview_operator_partial",
                route="/api/v1/overview/operator",
                method="GET",
                status_code=200,
                error_kind="external",
                error_code="DEGRADED_DATA",
                error_severity="warning",
                error_retryable=True,
            ),
        )

    duration_s = max(0.0, time.perf_counter() - started)
    overview_operator_latency_seconds.observe(duration_s)
    overview_operator_requests_total.labels(status=data_status).inc()

    return {
        "health_strip": health_strip,
        "cluster_matrix": cluster_matrix,
        "incidents": incidents,
        "servers": server_rows,
        "timeseries": timeseries_points,
        "latency_timeseries": latency_timeseries,
        "user_sessions": user_sessions,
        "last_updated": now.isoformat(),
        "data_status": data_status,
        "last_successful_sample_ts": last_successful_sample_ts,
    }

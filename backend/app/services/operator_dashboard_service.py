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

_log = logging.getLogger(__name__)

FRESH_S = 30
DEGRADED_S = 120
TIME_RANGE_SECONDS = {"5m": 300, "15m": 900, "1h": 3600, "6h": 21600, "24h": 86400}


def _scalar_from_result(rows: list[dict[str, Any]]) -> float | int | None:
    if not rows or not isinstance(rows[0], dict):
        return None
    val = rows[0].get("value")
    if not isinstance(val, (list, tuple)) or len(val) < 2:
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
    if not isinstance(val, (list, tuple)) or len(val) < 1:
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


async def fetch_operator_dashboard(time_range: str = "1h") -> dict[str, Any]:
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
        "outline_keys_total": None,
        "outline_traffic_bps": None,
        "outline_status": "unknown",
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
                "sum(rate(http_requests_total{job=\"admin-api\",status_class=\"5xx\"}[5m])) "
                "/ (sum(rate(http_requests_total{job=\"admin-api\"}[5m])) + 1e-9) * 100"
            ),
            "latency_p50": (
                "histogram_quantile(0.5, "
                "sum(rate(http_request_duration_seconds_bucket{job=\"admin-api\"}[5m])) by (le)) * 1000"
            ),
            "outline_keys_total": "outline_access_keys_total",
            "outline_traffic_bps": "sum(rate(shadowsocks_data_bytes[5m]))",
            "outline_ss_up": 'up{job="outline-ss"}',
            "outline_poller_up": 'up{job="outline-poller"}',
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
        core_query_names = ("api_up", "vpn_nodes_online", "vpn_cluster_load", "vpn_peers", "error_rate", "latency_p50")
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

        vpn_online = _scalar_from_result(results.get("vpn_nodes_online", []))
        if vpn_online is not None:
            health_strip["online_nodes"] = int(vpn_online)

        cluster_load = _scalar_from_result(results.get("vpn_cluster_load", [])) or _scalar_from_result(
            results.get("vpn_peers", [])
        )
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

        outline_keys = _scalar_from_result(results.get("outline_keys_total", []))
        if outline_keys is not None:
            health_strip["outline_keys_total"] = int(outline_keys)

        outline_traffic = _scalar_from_result(results.get("outline_traffic_bps", []))
        if outline_traffic is not None:
            health_strip["outline_traffic_bps"] = int(outline_traffic)

        outline_ss_up = _scalar_from_result(results.get("outline_ss_up", []))
        outline_poller_up = _scalar_from_result(results.get("outline_poller_up", []))
        if outline_ss_up == 1 and outline_poller_up == 1:
            health_strip["outline_status"] = "ok"
        elif outline_ss_up == 0 or outline_poller_up == 0:
            health_strip["outline_status"] = "down"

        # Incidents
        if api_up == 0:
            incidents.append({
                "severity": "critical",
                "entity": "admin-api",
                "metric": "up",
                "value": 0,
                "timestamp": now.isoformat(),
                "status": "open",
                "affected_servers": len(servers),
                "link": "/servers",
            })

        if err is not None and float(err) > 5:
            incidents.append({
                "severity": "warning",
                "entity": "cluster",
                "metric": "error_rate_pct",
                "value": float(err),
                "timestamp": now.isoformat(),
                "status": "open",
                "affected_servers": len(servers),
                "link": "/audit",
            })

        if outline_ss_up == 0 or outline_poller_up == 0:
            incidents.append({
                "severity": "warning",
                "entity": "outline",
                "metric": "outline_status",
                "value": health_strip.get("outline_status"),
                "timestamp": now.isoformat(),
                "status": "open",
                "affected_servers": 1,
                "link": "/integrations/outline",
            })

        # Per-server telemetry
        telemetry_map: dict[str, dict] = {}
        if server_ids:
            for sid in server_ids:
                h_rows = []
                p_rows = []
                cpu_rows = []
                ram_rows = []
                rx_rows = []
                tx_rows = []
                try:
                    h_rows = await prom.query(f'vpn_node_health{{node_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_health").inc()
                    _log.warning(
                        "operator prometheus query failed",
                        extra=extra_for_event(
                            event="prometheus_query_failed",
                            route="/api/v1/overview/operator",
                            method="GET",
                            entity_id="vpn_node_health",
                            error_kind="external",
                            error_code="PROM_QUERY_FAILED",
                            error_severity="warning",
                            error_retryable=True,
                        ),
                    )
                try:
                    p_rows = await prom.query(f'vpn_node_peers{{node_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_peers").inc()
                    _log.warning(
                        "operator prometheus query failed",
                        extra=extra_for_event(
                            event="prometheus_query_failed",
                            route="/api/v1/overview/operator",
                            method="GET",
                            entity_id="vpn_node_peers",
                            error_kind="external",
                            error_code="PROM_QUERY_FAILED",
                            error_severity="warning",
                            error_retryable=True,
                        ),
                    )
                try:
                    rx_rows = await prom.query(f'vpn_node_traffic_rx_bytes{{server_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_traffic_rx_bytes").inc()
                    _log.warning(
                        "operator prometheus query failed",
                        extra=extra_for_event(
                            event="prometheus_query_failed",
                            route="/api/v1/overview/operator",
                            method="GET",
                            entity_id="vpn_node_traffic_rx_bytes",
                            error_kind="external",
                            error_code="PROM_QUERY_FAILED",
                            error_severity="warning",
                            error_retryable=True,
                        ),
                    )
                try:
                    tx_rows = await prom.query(f'vpn_node_traffic_tx_bytes{{server_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_traffic_tx_bytes").inc()
                    _log.warning(
                        "operator prometheus query failed",
                        extra=extra_for_event(
                            event="prometheus_query_failed",
                            route="/api/v1/overview/operator",
                            method="GET",
                            entity_id="vpn_node_traffic_tx_bytes",
                            error_kind="external",
                            error_code="PROM_QUERY_FAILED",
                            error_severity="warning",
                            error_retryable=True,
                        ),
                    )
                try:
                    cpu_rows = await prom.query(f'vpn_node_cpu_utilization{{node_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_cpu").inc()
                try:
                    ram_rows = await prom.query(f'vpn_node_memory_utilization{{node_id="{sid}"}}')
                except Exception:
                    prom_failures += 1
                    data_status = "degraded"
                    prometheus_query_failures_total.labels(query_name="vpn_node_ram").inc()

                telemetry_map[sid] = {
                    "health": _scalar_from_result(h_rows),
                    "peers": _scalar_from_result(p_rows),
                    "cpu": _scalar_from_result(cpu_rows),
                    "ram": _scalar_from_result(ram_rows),
                    "rx": _scalar_from_result(rx_rows),
                    "tx": _scalar_from_result(tx_rows),
                    "last_ts": _ts_from_result(h_rows) or _ts_from_result(p_rows),
                }

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
                            telemetry_map[sid]["health"] = float(hs) * 100 if float(hs) <= 1 else float(hs)
                        if telemetry_map[sid]["peers"] is None and "peer_count" in hb:
                            telemetry_map[sid]["peers"] = int(hb["peer_count"])
                        if "ts_utc" in hb:
                            try:
                                dt = datetime.fromisoformat(str(hb["ts_utc"]).replace("Z", "+00:00"))
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
                    snapshot_map[snap.server_id] = {
                        "cpu": res.get("cpu_pct"),
                        "ram": res.get("ram_pct"),
                        "ts": snap.ts_utc.timestamp() if snap.ts_utc else None,
                    }

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
            if tm.get("health") is None and tm.get("peers") is None:
                data_status = "degraded"
            last_ts = tm.get("last_ts")
            age_s = (now.timestamp() - last_ts) if last_ts else None
            rx = tm.get("rx") or 0
            tx = tm.get("tx") or 0
            throughput = float(rx) + float(tx)
            server_rows.append({
                "id": sid,
                "name": s.name or sid,
                "region": s.region or "—",
                "ip": (s.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0] if s.api_endpoint else "—",
                "status": "online" if s.status in ("healthy", "ok") else ("degraded" if s.status == "degraded" else "offline"),
                "cpu_pct": tm.get("cpu"),
                "ram_pct": tm.get("ram"),
                "users": int(tm.get("peers") or 0),
                "throughput_bps": int(throughput),
                "last_heartbeat": datetime.fromtimestamp(last_ts, tz=timezone.utc).isoformat() if last_ts else None,
                "freshness": _freshness(age_s),
                "to": f"/servers/{sid}",
            })

        # Outline row (aggregated)
        if health_strip.get("outline_keys_total") is not None:
            server_rows.append({
                "id": "outline",
                "name": "Outline",
                "region": "outline",
                "ip": "—",
                "status": "online" if health_strip.get("outline_status") == "ok" else "offline",
                "cpu_pct": None,
                "ram_pct": None,
                "users": int(health_strip.get("outline_keys_total") or 0),
                "throughput_bps": int(health_strip.get("outline_traffic_bps") or 0),
                "last_heartbeat": None,
                "freshness": "unknown",
                "to": "/integrations/outline",
            })

        # Stale nodes incident
        for row in server_rows:
            if row["freshness"] == "stale":
                incidents.append({
                    "severity": "warning",
                    "entity": row["name"],
                    "metric": "freshness",
                    "value": "stale",
                    "timestamp": now.isoformat(),
                    "status": "open",
                    "affected_servers": 1,
                    "link": row["to"],
                })

    else:
        data_status = "degraded"
        for s in servers:
            server_rows.append({
                "id": s.id,
                "name": s.name or s.id,
                "region": s.region or "—",
                "ip": (s.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0] if s.api_endpoint else "—",
                "status": "online" if s.status in ("healthy", "ok") else ("degraded" if s.status == "degraded" else "offline"),
                "cpu_pct": None,
                "ram_pct": None,
                "users": 0,
                "throughput_bps": 0,
                "last_heartbeat": None,
                "freshness": "unknown",
                "to": f"/servers/{s.id}",
            })

    for region, counts in region_counts.items():
        cluster_matrix.append({
            "region": region,
            "total_nodes": counts["total"],
            "online": counts["online"],
            "cpu_avg": None,
            "ram_avg": None,
            "users": sum(
                r["users"] for r in server_rows
                if (r.get("region") or "—") == region
            ),
            "throughput": sum(
                r["throughput_bps"] for r in server_rows
                if (r.get("region") or "—") == region
            ),
            "error_pct": health_strip["error_rate_pct"],
            "latency_p95": None,
            "health": "ok" if counts["online"] == counts["total"] else ("degraded" if counts["online"] > 0 else "down"),
        })

    # Timeseries from Redis
    window = TIME_RANGE_SECONDS.get(time_range, 3600)
    pts = await get_dashboard_timeseries(window)
    timeseries_points = [{"ts": p["ts"], "peers": p["peers"], "rx": p["rx"], "tx": p["tx"]} for p in pts]
    last_ts = pts[-1]["ts"] if pts else None
    age_s = (now.timestamp() - last_ts) if last_ts else None
    health_strip["freshness"] = _freshness(age_s)
    if last_ts:
        last_successful_sample_ts = datetime.fromtimestamp(last_ts, tz=timezone.utc).isoformat()

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
        "user_sessions": user_sessions,
        "last_updated": now.isoformat(),
        "data_status": data_status,
        "last_successful_sample_ts": last_successful_sample_ts,
    }

"""High-level Docker telemetry service (hosts, containers, metrics, logs, alerts)."""

from __future__ import annotations

import asyncio
import hashlib
import json
import math
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.metrics import (
    docker_telemetry_cache_hits_total,
    docker_telemetry_cache_misses_total,
    docker_telemetry_upstream_failures_total,
    docker_telemetry_upstream_latency_seconds,
)
from app.core.redis_client import get_redis
from app.models import DockerAlert
from app.schemas.docker_telemetry import (
    AlertItem,
    ContainerLogLine,
    ContainerMetricsPoint,
    ContainerMetricsTimeseries,
    ContainerPort,
    ContainerSummary,
    HostSummary,
)
from app.services.docker_engine_client import DockerEngineClient, parse_docker_timestamp
from app.services.docker_logs_service import to_log_line
from app.services.prometheus_query_service import PrometheusQueryService

_DURATION_RE = re.compile(r"^(\d+)([smhd])$")
_HEX_RE = re.compile(r"[0-9a-f]{12,64}", re.I)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _duration_to_seconds(value: str | None, *, default_seconds: int) -> int:
    if not value:
        return default_seconds
    raw = value.strip().lower()
    match = _DURATION_RE.match(raw)
    if not match:
        return default_seconds
    amount = int(match.group(1))
    unit = match.group(2)
    if unit == "s":
        return amount
    if unit == "m":
        return amount * 60
    if unit == "h":
        return amount * 3600
    return amount * 86400


def _value_float(value: Any) -> float | None:
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(out) or math.isinf(out):
        return None
    return out


def _value_int(value: Any) -> int | None:
    num = _value_float(value)
    if num is None:
        return None
    return int(num)


def _env_hash(env_list: list[str] | None) -> str:
    if not env_list:
        return "sha256:" + hashlib.sha256(b"").hexdigest()[:16]
    normalized = "\n".join(sorted(str(v) for v in env_list)).encode("utf-8", errors="replace")
    return "sha256:" + hashlib.sha256(normalized).hexdigest()[:16]


def _image_tag(image: str | None) -> str | None:
    if not image:
        return None
    if "@" in image:
        return image.split("@", 1)[1]
    if ":" not in image:
        return "latest"
    return image.rsplit(":", 1)[-1]


def _calc_cpu_pct(stats: dict[str, Any]) -> float | None:
    cpu_stats = stats.get("cpu_stats") or {}
    prev_cpu = stats.get("precpu_stats") or {}
    cpu_total = _value_float((cpu_stats.get("cpu_usage") or {}).get("total_usage"))
    prev_total = _value_float((prev_cpu.get("cpu_usage") or {}).get("total_usage"))
    system = _value_float(cpu_stats.get("system_cpu_usage"))
    prev_system = _value_float(prev_cpu.get("system_cpu_usage"))
    if cpu_total is None or prev_total is None or system is None or prev_system is None:
        return None
    cpu_delta = cpu_total - prev_total
    system_delta = system - prev_system
    if cpu_delta <= 0 or system_delta <= 0:
        return None
    online_cpus = _value_float(cpu_stats.get("online_cpus"))
    if online_cpus is None or online_cpus <= 0:
        percpu = (cpu_stats.get("cpu_usage") or {}).get("percpu_usage") or []
        online_cpus = float(len(percpu) or 1)
    return max(0.0, (cpu_delta / system_delta) * online_cpus * 100.0)


def _extract_short_container_id(labels: dict[str, str]) -> str | None:
    for _, raw in labels.items():
        if not raw:
            continue
        matches = _HEX_RE.findall(str(raw))
        if matches:
            best = max(matches, key=len)
            return best[:12].lower()
    return None


class DockerTelemetryService:
    def __init__(self) -> None:
        self._docker = DockerEngineClient()
        self._prom = PrometheusQueryService()
        self._semaphore = asyncio.Semaphore(max(1, settings.docker_telemetry_stats_concurrency))
        self._circuit: dict[str, dict[str, float]] = {}
        # Prometheus snapshot is relatively expensive; cache it briefly to keep UI polling fast.
        self._prom_snapshot_cached_at: float = 0.0
        self._prom_snapshot_cache: dict[str, dict[str, float | int | None]] = {}

    async def list_hosts(self) -> list[HostSummary]:
        # PERF: hosts listing is polled frequently by the UI. Avoid calling list_containers(), which
        # is expensive (Prometheus snapshot + per-container inspect/stats). Use the lightweight
        # Docker containers list to compute coarse counts.
        out: list[HostSummary] = []
        for host in self._docker.hosts():
            started = time.perf_counter()
            try:
                if self._is_circuit_open(host.host_id):
                    raise RuntimeError("circuit open")

                ping_ok = await self._with_retries(
                    host.host_id,
                    "ping",
                    lambda: self._docker.ping(host.host_id),
                )
                if not ping_ok:
                    raise RuntimeError("unreachable")

                rows = await self._with_retries(
                    host.host_id,
                    "list_containers_light",
                    lambda: self._docker.list_containers(host.host_id, all_containers=True),
                )
                running = 0
                unhealthy = 0
                loops = 0
                for r in rows:
                    if not isinstance(r, dict):
                        continue
                    state = str(r.get("State") or "").lower()
                    status_text = str(r.get("Status") or "").lower()
                    if state == "running":
                        running += 1
                    if "unhealthy" in status_text:
                        unhealthy += 1
                    if state == "restarting" or "restarting" in status_text:
                        loops += 1

                out.append(
                    HostSummary(
                        host_id=host.host_id,
                        name=host.name,
                        endpoint_kind=host.endpoint_kind,  # type: ignore[arg-type]
                        is_reachable=True,
                        containers_total=len(rows),
                        running=running,
                        stopped=max(len(rows) - running, 0),
                        unhealthy=unhealthy,
                        restart_loops=loops,
                        last_seen_at=_now_utc(),
                    )
                )
                self._record_success(host.host_id)
                docker_telemetry_upstream_latency_seconds.labels(
                    upstream="docker", endpoint="hosts"
                ).observe(time.perf_counter() - started)
            except Exception:
                out.append(
                    HostSummary(
                        host_id=host.host_id,
                        name=host.name,
                        endpoint_kind=host.endpoint_kind,  # type: ignore[arg-type]
                        is_reachable=False,
                        last_seen_at=None,
                    )
                )
                self._record_failure(host.host_id)
                docker_telemetry_upstream_failures_total.labels(
                    upstream="docker", endpoint="hosts"
                ).inc()
        return out

    async def list_containers(
        self, host_id: str, *, force_refresh: bool = False
    ) -> list[ContainerSummary]:
        cache_key = f"telemetry:docker:containers:{host_id}"
        if not force_refresh:
            cached = await self._cache_get_containers(cache_key)
            if cached is not None:
                docker_telemetry_cache_hits_total.labels(scope="containers").inc()
                return cached
        docker_telemetry_cache_misses_total.labels(scope="containers").inc()

        if self._is_circuit_open(host_id):
            raise RuntimeError(f"Docker host {host_id} is temporarily unavailable")

        ping_ok = await self._with_retries(
            host_id,
            "ping",
            lambda: self._docker.ping(host_id),
        )
        if not ping_ok:
            self._record_failure(host_id)
            raise RuntimeError(f"Docker host {host_id} is unreachable")

        started = time.perf_counter()
        rows = await self._with_retries(
            host_id,
            "list_containers",
            lambda: self._docker.list_containers(host_id, all_containers=True),
        )
        prom_snapshot = await self._get_prometheus_snapshot()

        # Building per-container summaries can be expensive (inspect + stats). Keep it bounded; if the
        # budget is exceeded, return minimal summaries for remaining containers.
        # Keep this tight: containers listing is polled and must stay within UI latency SLO.
        summary_budget_s = min(1.0, float(settings.docker_telemetry_request_timeout_seconds))
        tasks = [
            asyncio.create_task(self._build_container_summary(host_id, row, prom_snapshot))
            for row in rows
        ]
        done, pending = await asyncio.wait(tasks, timeout=summary_budget_s)
        for task in pending:
            task.cancel()
        summaries: list[ContainerSummary] = []
        for row, task in zip(rows, tasks, strict=True):
            if task in done:
                try:
                    summaries.append(task.result())
                    continue
                except Exception:
                    pass
            docker_telemetry_upstream_failures_total.labels(
                upstream="docker", endpoint="container_summary"
            ).inc()
            summaries.append(self._minimal_summary_from_row(host_id, row))
        summaries.sort(key=lambda x: x.name)

        self._record_success(host_id)
        await self._cache_set(cache_key, [item.model_dump(mode="json") for item in summaries])
        docker_telemetry_upstream_latency_seconds.labels(
            upstream="docker", endpoint="containers"
        ).observe(time.perf_counter() - started)
        return summaries

    async def get_container_metrics(
        self,
        host_id: str,
        container_id: str,
        *,
        range_raw: str | None,
        step_raw: str | None,
    ) -> ContainerMetricsTimeseries:
        range_seconds = min(
            settings.docker_telemetry_metrics_max_range_seconds,
            max(30, _duration_to_seconds(range_raw, default_seconds=3600)),
        )
        step_seconds = max(
            settings.docker_telemetry_metrics_min_step_seconds,
            _duration_to_seconds(step_raw, default_seconds=15),
        )
        step_seconds = min(step_seconds, settings.docker_telemetry_metrics_max_step_seconds)
        end = _now_utc()
        start = end - timedelta(seconds=range_seconds)

        points = await self._query_prometheus_timeseries(
            container_id=container_id,
            start=start,
            end=end,
            step_seconds=step_seconds,
        )
        if not points:
            snapshot = await self._fallback_container_point(host_id, container_id)
            if snapshot is not None:
                points = [snapshot]

        return ContainerMetricsTimeseries(
            host_id=host_id,
            container_id=container_id,
            from_ts=start,
            to_ts=end,
            step_seconds=step_seconds,
            points=points,
        )

    async def get_container_logs(
        self,
        host_id: str,
        container_id: str,
        *,
        tail: int,
        since: datetime | None,
    ) -> list[ContainerLogLine]:
        # Avoid slow/opaque failures when container logs are inherently unreadable.
        # Example: log driver "none" yields "does not support reading" after a costly logs call.
        try:
            inspect = await self._with_retries(
                host_id,
                "inspect_container",
                lambda: self._docker.inspect_container(host_id, container_id),
            )
            log_driver = ((inspect.get("HostConfig") or {}).get("LogConfig") or {}).get("Type")
            driver = str(log_driver or "").strip().lower()
            if driver and driver not in {"json-file", "journald", "local"}:
                raise RuntimeError(
                    "container logs unavailable: logging driver does not support reading"
                )
        except RuntimeError:
            raise
        except Exception:
            # If inspect fails, continue and let the logs call surface the error contract.
            pass

        bounded_tail = max(1, min(tail, settings.docker_logs_max_tail))
        since_epoch = int(since.timestamp()) if since else None
        logs_budget_s = min(2.0, float(settings.docker_telemetry_request_timeout_seconds))
        stdout, stderr = await asyncio.wait_for(
            asyncio.gather(
                self._docker.container_logs(
                    host_id, container_id, tail=bounded_tail, since=since_epoch, stream="stdout"
                ),
                self._docker.container_logs(
                    host_id, container_id, tail=bounded_tail, since=since_epoch, stream="stderr"
                ),
            ),
            timeout=logs_budget_s,
        )
        merged = [to_log_line(ts, "stdout", msg) for ts, msg in stdout] + [
            to_log_line(ts, "stderr", msg) for ts, msg in stderr
        ]
        merged.sort(key=lambda x: x.ts)
        return merged[-bounded_tail:]

    async def list_alerts(
        self,
        host_id: str | None,
        *,
        db: AsyncSession,
    ) -> list[AlertItem]:
        prom_alerts = await self._prometheus_alerts(host_id)
        if prom_alerts:
            return prom_alerts

        stmt = select(DockerAlert).order_by(desc(DockerAlert.created_at)).limit(200)
        if host_id:
            stmt = stmt.where(DockerAlert.host_id == host_id)
        rows = (await db.execute(stmt)).scalars().all()
        out: list[AlertItem] = []
        for row in rows:
            out.append(
                AlertItem(
                    id=row.id,
                    severity=(
                        row.severity
                        if row.severity in {"critical", "warning", "info"}
                        else "warning"
                    ),
                    rule=row.rule,
                    host_id=row.host_id,
                    container_id=row.container_id,
                    container_name=row.container_name,
                    created_at=row.created_at,
                    status="resolved" if row.resolved_at else "firing",
                    context=row.context or {},
                )
            )
        return out

    async def _cache_get_containers(self, key: str) -> list[ContainerSummary] | None:
        try:
            redis = get_redis()
            raw = await redis.get(key)
            if not raw:
                return None
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                return None
            return [ContainerSummary(**item) for item in parsed if isinstance(item, dict)]
        except Exception:
            return None

    async def _cache_set(self, key: str, payload: list[dict[str, Any]]) -> None:
        try:
            redis = get_redis()
            await redis.set(
                key, json.dumps(payload), ex=settings.docker_telemetry_cache_ttl_seconds
            )
        except Exception:
            pass

    async def _with_retries(self, host_id: str, endpoint: str, operation):
        retries = max(0, settings.docker_telemetry_retry_count)
        last_error: Exception | None = None
        for attempt in range(retries + 1):
            try:
                return await operation()
            except Exception as exc:  # noqa: PERF203
                last_error = exc
                if attempt >= retries:
                    break
                await asyncio.sleep(0.15 * (attempt + 1))
        docker_telemetry_upstream_failures_total.labels(upstream="docker", endpoint=endpoint).inc()
        self._record_failure(host_id)
        if last_error is not None:
            raise last_error
        raise RuntimeError(f"docker operation failed: {endpoint}")

    def _is_circuit_open(self, host_id: str) -> bool:
        state = self._circuit.get(host_id)
        if not state:
            return False
        open_until = state.get("open_until", 0.0)
        if open_until <= time.time():
            return False
        return True

    def _record_failure(self, host_id: str) -> None:
        now = time.time()
        state = self._circuit.setdefault(host_id, {"failures": 0.0, "open_until": 0.0})
        state["failures"] = float(state.get("failures", 0.0) + 1.0)
        threshold = float(settings.docker_telemetry_circuit_fail_threshold)
        if state["failures"] >= threshold:
            state["open_until"] = now + float(settings.docker_telemetry_circuit_open_seconds)
            state["failures"] = 0.0

    def _record_success(self, host_id: str) -> None:
        self._circuit[host_id] = {"failures": 0.0, "open_until": 0.0}

    async def _build_container_summary(
        self,
        host_id: str,
        row: dict[str, Any],
        prom_snapshot: dict[str, dict[str, float | int | None]],
    ) -> ContainerSummary:
        full_container_id = str(row.get("Id") or "")
        container_id = full_container_id[:12]
        prom_metrics = prom_snapshot.get(container_id.lower(), {}) if prom_snapshot else {}
        # /stats is the main latency driver for the containers listing. When Prometheus is enabled,
        # prefer Prometheus metrics (or return null metrics) rather than blocking on /stats.
        use_stats = not self._prom.enabled
        async with self._semaphore:
            try:
                inspect = await self._docker.inspect_container(
                    host_id, full_container_id or container_id
                )
            except Exception:
                inspect = {}
            stats: dict[str, Any] = {}
            if use_stats:
                try:
                    stats = await self._docker.container_stats(
                        host_id, full_container_id or container_id
                    )
                except Exception:
                    # Stopped/exited containers often reject /stats. Keep them in response with null metrics.
                    stats = {}

        labels = (inspect.get("Config") or {}).get("Labels") or row.get("Labels") or {}
        if not isinstance(labels, dict):
            labels = {}

        state_info = inspect.get("State") or {}
        started_at = parse_docker_timestamp(state_info.get("StartedAt"))
        created_at = parse_docker_timestamp(inspect.get("Created"))
        if created_at is None:
            created_epoch = _value_int(row.get("Created"))
            if created_epoch:
                created_at = datetime.fromtimestamp(created_epoch, tz=timezone.utc)
        now = _now_utc()
        uptime_seconds = int((now - started_at).total_seconds()) if started_at else None

        restart_count = _value_int(state_info.get("RestartCount"))
        if restart_count is None:
            restart_count = _value_int(inspect.get("RestartCount")) or 0

        health_status = "none"
        health = state_info.get("Health") or {}
        if isinstance(health, dict) and health.get("Status"):
            health_status = str(health.get("Status"))

        state = str(state_info.get("Status") or row.get("State") or "created")
        is_restart_loop = state == "restarting" or (
            restart_count >= settings.docker_alert_restart_loop_threshold
            and uptime_seconds is not None
            and uptime_seconds < 600
        )

        memory_stats = stats.get("memory_stats") or {}
        mem_bytes = _value_int(memory_stats.get("usage"))
        mem_limit = _value_int(memory_stats.get("limit"))
        mem_pct = ((mem_bytes / mem_limit) * 100.0) if mem_bytes and mem_limit else None

        networks = (stats.get("networks") or {}) if isinstance(stats.get("networks"), dict) else {}
        net_rx = 0
        net_tx = 0
        for payload in networks.values():
            if not isinstance(payload, dict):
                continue
            net_rx += _value_int(payload.get("rx_bytes")) or 0
            net_tx += _value_int(payload.get("tx_bytes")) or 0

        blk_read = 0
        blk_write = 0
        for item in (stats.get("blkio_stats") or {}).get("io_service_bytes_recursive") or []:
            if not isinstance(item, dict):
                continue
            op = str(item.get("op") or "").lower()
            value = _value_int(item.get("value")) or 0
            if op == "read":
                blk_read += value
            elif op == "write":
                blk_write += value

        cpu_pct = _calc_cpu_pct(stats)

        if prom_metrics.get("cpu_pct") is not None:
            cpu_pct = _value_float(prom_metrics.get("cpu_pct"))
        if prom_metrics.get("mem_bytes") is not None:
            mem_bytes = _value_int(prom_metrics.get("mem_bytes"))
        if prom_metrics.get("mem_limit_bytes") is not None:
            mem_limit = _value_int(prom_metrics.get("mem_limit_bytes"))
        if mem_bytes and mem_limit:
            mem_pct = (mem_bytes / mem_limit) * 100.0
        if mem_pct is None and mem_bytes:
            host_mem_total = None
            host_entry = prom_snapshot.get("__host_mem_total_bytes__")
            if isinstance(host_entry, dict):
                host_mem_total = _value_int(host_entry.get("value"))
            if host_mem_total and host_mem_total > 0:
                mem_pct = (mem_bytes / host_mem_total) * 100.0

        if prom_metrics.get("net_rx_bytes") is not None:
            net_rx = _value_int(prom_metrics.get("net_rx_bytes")) or 0
        if prom_metrics.get("net_tx_bytes") is not None:
            net_tx = _value_int(prom_metrics.get("net_tx_bytes")) or 0
        if prom_metrics.get("blk_read_bytes") is not None:
            blk_read = _value_int(prom_metrics.get("blk_read_bytes")) or 0
        if prom_metrics.get("blk_write_bytes") is not None:
            blk_write = _value_int(prom_metrics.get("blk_write_bytes")) or 0

        ports: list[ContainerPort] = []
        for item in row.get("Ports") or []:
            if not isinstance(item, dict):
                continue
            private_port = _value_int(item.get("PrivatePort"))
            if private_port is None:
                continue
            ports.append(
                ContainerPort(
                    ip=str(item.get("IP") or "0.0.0.0"),
                    private_port=private_port,
                    public_port=_value_int(item.get("PublicPort")),
                    protocol=(
                        str(item.get("Type") or "tcp").lower()
                        if str(item.get("Type") or "tcp").lower() in {"tcp", "udp"}
                        else "tcp"
                    ),
                )
            )

        image = str((inspect.get("Config") or {}).get("Image") or row.get("Image") or "")
        compose_service = str(labels.get("com.docker.compose.service") or "") or None
        compose_project = str(labels.get("com.docker.compose.project") or "") or None

        return ContainerSummary(
            host_id=host_id,
            container_id=container_id,
            name=(
                str(row.get("Names", [""])[0]).lstrip("/")
                if isinstance(row.get("Names"), list) and row.get("Names")
                else str(inspect.get("Name") or "").lstrip("/")
            ),
            compose_service=compose_service,
            compose_project=compose_project,
            image=image,
            image_tag=_image_tag(image),
            state=state,
            health_status=(
                health_status
                if health_status in {"healthy", "unhealthy", "starting", "none"}
                else "none"
            ),
            restart_count=restart_count,
            is_restart_loop=is_restart_loop,
            uptime_seconds=uptime_seconds,
            cpu_pct=cpu_pct,
            mem_bytes=mem_bytes,
            mem_limit_bytes=mem_limit,
            mem_pct=mem_pct,
            net_rx_bytes=net_rx or None,
            net_tx_bytes=net_tx or None,
            blk_read_bytes=blk_read or None,
            blk_write_bytes=blk_write or None,
            ports=ports,
            image_version=_image_tag(image),
            env_hash=_env_hash((inspect.get("Config") or {}).get("Env") or []),
            error_rate_5m=None,
            created_at=created_at,
            started_at=started_at,
        )

    def _minimal_summary_from_row(self, host_id: str, row: dict[str, Any]) -> ContainerSummary:
        container_id = str(row.get("Id") or "")[:12]
        created_at = None
        created_epoch = _value_int(row.get("Created"))
        if created_epoch:
            created_at = datetime.fromtimestamp(created_epoch, tz=timezone.utc)

        state = str(row.get("State") or "created")
        image = str(row.get("Image") or "")
        ports: list[ContainerPort] = []
        for item in row.get("Ports") or []:
            if not isinstance(item, dict):
                continue
            private_port = _value_int(item.get("PrivatePort"))
            if private_port is None:
                continue
            protocol = str(item.get("Type") or "tcp").lower()
            ports.append(
                ContainerPort(
                    ip=str(item.get("IP") or "0.0.0.0"),
                    private_port=private_port,
                    public_port=_value_int(item.get("PublicPort")),
                    protocol=(protocol if protocol in {"tcp", "udp"} else "tcp"),
                )
            )

        names = row.get("Names") if isinstance(row.get("Names"), list) else []
        raw_name = str(names[0]) if names else container_id

        return ContainerSummary(
            host_id=host_id,
            container_id=container_id,
            name=raw_name.lstrip("/"),
            compose_service=None,
            compose_project=None,
            image=image,
            image_tag=_image_tag(image),
            state=state,
            health_status="none",
            restart_count=0,
            is_restart_loop=state == "restarting",
            uptime_seconds=None,
            cpu_pct=None,
            mem_bytes=None,
            mem_limit_bytes=None,
            mem_pct=None,
            net_rx_bytes=None,
            net_tx_bytes=None,
            blk_read_bytes=None,
            blk_write_bytes=None,
            ports=ports,
            image_version=_image_tag(image),
            env_hash=_env_hash([]),
            error_rate_5m=None,
            created_at=created_at,
            started_at=None,
        )

    async def _get_prometheus_snapshot(self) -> dict[str, dict[str, float | int | None]]:
        if not self._prom.enabled:
            return {}
        # Fast path: brief in-process cache to keep /containers within SLO during UI polling.
        now = time.time()
        cache_ttl_s = min(5.0, float(settings.docker_telemetry_cache_ttl_seconds))
        if self._prom_snapshot_cache and (now - self._prom_snapshot_cached_at) <= cache_ttl_s:
            return self._prom_snapshot_cache

        expressions = {
            "cpu_pct": "sum by (id, name) (rate(container_cpu_usage_seconds_total[5m])) * 100",
            "mem_bytes": "sum by (id, name) (container_memory_working_set_bytes)",
            "mem_limit_bytes": "sum by (id, name) (container_spec_memory_limit_bytes)",
            "net_rx_bytes": "sum by (id, name) (container_network_receive_bytes_total)",
            "net_tx_bytes": "sum by (id, name) (container_network_transmit_bytes_total)",
            "blk_read_bytes": "sum by (id, name) (container_fs_reads_bytes_total)",
            "blk_write_bytes": "sum by (id, name) (container_fs_writes_bytes_total)",
            "host_mem_total_bytes": "max(node_memory_MemTotal_bytes)",
        }
        # Keep overall snapshot time bounded; partial results are acceptable and should not
        # block the containers listing response.
        started = time.perf_counter()
        budget_s = min(0.6, float(settings.docker_telemetry_request_timeout_seconds))
        tasks = {
            metric: asyncio.create_task(self._prom.query(expr))
            for metric, expr in expressions.items()
        }
        done, pending = await asyncio.wait(tasks.values(), timeout=budget_s)
        for task in pending:
            task.cancel()
        rows: dict[str, list[dict[str, Any]] | Exception] = {}
        for metric, task in tasks.items():
            if task not in done:
                rows[metric] = TimeoutError("prometheus snapshot budget exceeded")
                continue
            try:
                rows[metric] = task.result()
            except Exception as exc:  # noqa: PERF203
                rows[metric] = exc

        docker_telemetry_upstream_latency_seconds.labels(
            upstream="prometheus", endpoint="snapshot"
        ).observe(time.perf_counter() - started)

        out: dict[str, dict[str, float | int | None]] = {}
        host_mem_total = None
        for metric_name, payload in rows.items():
            if isinstance(payload, Exception):
                docker_telemetry_upstream_failures_total.labels(
                    upstream="prometheus", endpoint="snapshot"
                ).inc()
                continue
            if metric_name == "host_mem_total_bytes":
                try:
                    if payload:
                        v = payload[0].get("value")
                        if v and len(v) >= 2:
                            host_mem_total = _value_int(v[1])
                except Exception:
                    host_mem_total = None
                continue
            for row in payload:
                labels = row.get("metric") if isinstance(row, dict) else None
                value = row.get("value") if isinstance(row, dict) else None
                if not isinstance(labels, dict) or not isinstance(value, list) or len(value) < 2:
                    continue
                container_id = _extract_short_container_id(
                    {str(k): str(v) for k, v in labels.items() if isinstance(v, str)}
                )
                if not container_id:
                    continue
                metric_value = _value_float(value[1])
                if metric_value is None:
                    continue
                item = out.setdefault(container_id, {})
                item[metric_name] = metric_value
        if host_mem_total:
            out["__host_mem_total_bytes__"] = {"value": host_mem_total}
        if not out and self._prom_snapshot_cache:
            # Degrade gracefully: keep using the last snapshot rather than stalling the UI.
            return self._prom_snapshot_cache
        self._prom_snapshot_cache = out
        self._prom_snapshot_cached_at = now
        return out

    async def _query_prometheus_timeseries(
        self,
        *,
        container_id: str,
        start: datetime,
        end: datetime,
        step_seconds: int,
    ) -> list[ContainerMetricsPoint]:
        if not self._prom.enabled:
            return []
        cid = re.escape(container_id[:12])
        expressions = {
            "cpu_pct": f'sum(rate(container_cpu_usage_seconds_total{{id=~".*{cid}.*"}}[5m])) * 100',
            "mem_bytes": f'sum(container_memory_working_set_bytes{{id=~".*{cid}.*"}})',
            "mem_limit_bytes": f'sum(container_spec_memory_limit_bytes{{id=~".*{cid}.*"}})',
            "net_rx_bps": f'sum(rate(container_network_receive_bytes_total{{id=~".*{cid}.*"}}[5m]))',
            "net_tx_bps": f'sum(rate(container_network_transmit_bytes_total{{id=~".*{cid}.*"}}[5m]))',
            "blk_read_bps": f'sum(rate(container_fs_reads_bytes_total{{id=~".*{cid}.*"}}[5m]))',
            "blk_write_bps": f'sum(rate(container_fs_writes_bytes_total{{id=~".*{cid}.*"}}[5m]))',
        }
        rows = await asyncio.gather(
            *[
                self._prom.query_range(
                    expr,
                    start=start,
                    end=end,
                    step_seconds=step_seconds,
                )
                for expr in expressions.values()
            ],
            return_exceptions=True,
        )
        series_map: dict[int, dict[str, float | None]] = {}
        mem_limit: dict[int, float | None] = {}
        for metric_name, payload in zip(expressions.keys(), rows, strict=True):
            if isinstance(payload, Exception) or not payload:
                continue
            first_series = payload[0]
            values = first_series.get("values") if isinstance(first_series, dict) else None
            if not isinstance(values, list):
                continue
            for item in values:
                if not isinstance(item, list) or len(item) < 2:
                    continue
                ts = _value_int(item[0])
                val = _value_float(item[1])
                if ts is None:
                    continue
                if metric_name == "mem_limit_bytes":
                    mem_limit[ts] = val
                    continue
                bucket = series_map.setdefault(ts, {})
                bucket[metric_name] = val

        if not series_map:
            return []

        points: list[ContainerMetricsPoint] = []
        for ts in sorted(series_map.keys()):
            bucket = series_map[ts]
            mem_bytes = _value_int(bucket.get("mem_bytes"))
            limit = mem_limit.get(ts)
            mem_pct = None
            if mem_bytes is not None and limit and limit > 0:
                mem_pct = (mem_bytes / limit) * 100.0
            points.append(
                ContainerMetricsPoint(
                    ts=datetime.fromtimestamp(ts, tz=timezone.utc),
                    cpu_pct=bucket.get("cpu_pct"),
                    mem_bytes=mem_bytes,
                    mem_pct=mem_pct,
                    net_rx_bps=bucket.get("net_rx_bps"),
                    net_tx_bps=bucket.get("net_tx_bps"),
                    blk_read_bps=bucket.get("blk_read_bps"),
                    blk_write_bps=bucket.get("blk_write_bps"),
                )
            )
        return points

    async def _fallback_container_point(
        self, host_id: str, container_id: str
    ) -> ContainerMetricsPoint | None:
        try:
            stats = await self._docker.container_stats(host_id, container_id)
        except Exception:
            return None
        memory_stats = stats.get("memory_stats") or {}
        mem_bytes = _value_int(memory_stats.get("usage"))
        limit = _value_int(memory_stats.get("limit"))
        mem_pct = ((mem_bytes / limit) * 100.0) if mem_bytes and limit else None
        return ContainerMetricsPoint(
            ts=_now_utc(),
            cpu_pct=_calc_cpu_pct(stats),
            mem_bytes=mem_bytes,
            mem_pct=mem_pct,
            net_rx_bps=None,
            net_tx_bps=None,
            blk_read_bps=None,
            blk_write_bps=None,
        )

    async def _prometheus_alerts(self, host_id: str | None) -> list[AlertItem]:
        raw = await self._prom.alerts()
        out: list[AlertItem] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            labels = item.get("labels") if isinstance(item.get("labels"), dict) else {}
            annotations = (
                item.get("annotations") if isinstance(item.get("annotations"), dict) else {}
            )
            alertname = str(labels.get("alertname") or "")
            if not alertname:
                continue
            low_name = alertname.lower()
            if "docker" not in low_name and "container" not in low_name:
                continue
            alert_host = str(labels.get("host_id") or labels.get("instance") or "local")
            if host_id and alert_host != host_id:
                continue
            severity = str(labels.get("severity") or "warning").lower()
            if severity not in {"critical", "warning", "info"}:
                severity = "warning"
            created_at = (
                parse_docker_timestamp(str(item.get("activeAt") or item.get("startsAt") or ""))
                or _now_utc()
            )
            status = str(item.get("state") or "firing").lower()
            out.append(
                AlertItem(
                    id=f"prom:{alertname}:{alert_host}:{labels.get('container_id') or labels.get('id') or ''}",
                    severity=severity,  # type: ignore[arg-type]
                    rule=alertname,
                    host_id=alert_host,
                    container_id=(
                        str(labels.get("container_id") or labels.get("id") or "") or None
                    ),
                    container_name=(
                        str(labels.get("container_name") or labels.get("name") or "") or None
                    ),
                    created_at=created_at,
                    status=("resolved" if status in {"inactive", "resolved"} else "firing"),
                    context={
                        "labels": labels,
                        "annotations": annotations,
                        "value": item.get("value"),
                    },
                )
            )
        out.sort(key=lambda x: x.created_at, reverse=True)
        return out

"""Fallback alert evaluator for Docker telemetry when Prometheus alerts are unavailable."""

from __future__ import annotations

import hashlib
import shutil
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import DockerAlert
from app.services.docker_telemetry_service import DockerTelemetryService


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _fingerprint(rule: str, host_id: str, container_id: str | None) -> str:
    raw = f"{rule}:{host_id}:{container_id or '-'}".encode("utf-8", errors="replace")
    return hashlib.sha256(raw).hexdigest()


class DockerAlertRuleEngine:
    def __init__(self, telemetry: DockerTelemetryService) -> None:
        self._telemetry = telemetry

    async def evaluate_once(self, db: AsyncSession) -> int:
        now = _now_utc()
        active_rules: list[dict[str, Any]] = []
        host_ids: set[str] = set()

        hosts = await self._telemetry.list_hosts()
        for host in hosts:
            if not host.is_reachable:
                continue
            host_ids.add(host.host_id)
            containers = await self._telemetry.list_containers(host.host_id, force_refresh=True)
            for container in containers:
                if container.health_status == "unhealthy":
                    active_rules.append(
                        {
                            "rule": "DockerContainerUnhealthy",
                            "severity": "critical",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {
                                "health_status": container.health_status,
                                "state": container.state,
                            },
                        }
                    )
                if container.is_restart_loop:
                    active_rules.append(
                        {
                            "rule": "DockerContainerRestartLoop",
                            "severity": "critical",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {
                                "restart_count": container.restart_count,
                                "uptime_seconds": container.uptime_seconds,
                            },
                        }
                    )
                if (container.cpu_pct or 0) >= settings.docker_alert_high_cpu_critical_pct:
                    active_rules.append(
                        {
                            "rule": "DockerContainerHighCPUCritical",
                            "severity": "critical",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {"cpu_pct": container.cpu_pct},
                        }
                    )
                elif (container.cpu_pct or 0) >= settings.docker_alert_high_cpu_warning_pct:
                    active_rules.append(
                        {
                            "rule": "DockerContainerHighCPUWarning",
                            "severity": "warning",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {"cpu_pct": container.cpu_pct},
                        }
                    )

                if (container.mem_pct or 0) >= settings.docker_alert_high_mem_critical_pct:
                    active_rules.append(
                        {
                            "rule": "DockerContainerHighMemoryCritical",
                            "severity": "critical",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {"mem_pct": container.mem_pct},
                        }
                    )
                elif (container.mem_pct or 0) >= settings.docker_alert_high_mem_warning_pct:
                    active_rules.append(
                        {
                            "rule": "DockerContainerHighMemoryWarning",
                            "severity": "warning",
                            "host_id": host.host_id,
                            "container_id": container.container_id,
                            "container_name": container.name,
                            "context": {"mem_pct": container.mem_pct},
                        }
                    )

        total, used, free = shutil.disk_usage("/")
        used_pct = ((used / total) * 100.0) if total else 0.0
        if used_pct >= settings.docker_alert_disk_pressure_pct:
            active_rules.append(
                {
                    "rule": "DockerHostDiskPressure",
                    "severity": "warning",
                    "host_id": "local",
                    "container_id": None,
                    "container_name": None,
                    "context": {"used_pct": used_pct, "free_bytes": free},
                }
            )
            host_ids.add("local")

        if not host_ids:
            await self._cleanup_resolved(db, now)
            return 0

        rows = await db.execute(
            select(DockerAlert).where(
                DockerAlert.resolved_at.is_(None),
                DockerAlert.host_id.in_(sorted(host_ids)),
            )
        )
        open_alerts = {row.fingerprint: row for row in rows.scalars().all()}

        active_fingerprints: set[str] = set()
        for rule in active_rules:
            fingerprint = _fingerprint(rule["rule"], rule["host_id"], rule["container_id"])
            active_fingerprints.add(fingerprint)
            existing = open_alerts.get(fingerprint)
            if existing:
                existing.last_seen_at = now
                existing.context = rule["context"]
                existing.severity = rule["severity"]
                existing.rule = rule["rule"]
                existing.container_name = rule["container_name"]
                continue
            db.add(
                DockerAlert(
                    fingerprint=fingerprint,
                    rule=rule["rule"],
                    severity=rule["severity"],
                    host_id=rule["host_id"],
                    container_id=rule["container_id"],
                    container_name=rule["container_name"],
                    context=rule["context"],
                    first_seen_at=now,
                    last_seen_at=now,
                    resolved_at=None,
                )
            )

        for fingerprint, alert in open_alerts.items():
            if fingerprint in active_fingerprints:
                continue
            alert.resolved_at = now
            alert.last_seen_at = now

        await self._cleanup_resolved(db, now)
        return len(active_fingerprints)

    async def _cleanup_resolved(self, db: AsyncSession, now: datetime) -> None:
        ttl_seconds = max(60, settings.docker_alert_resolved_ttl_seconds)
        threshold = now - timedelta(seconds=ttl_seconds)
        await db.execute(
            delete(DockerAlert).where(
                DockerAlert.resolved_at.is_not(None),
                DockerAlert.resolved_at < threshold,
            )
        )

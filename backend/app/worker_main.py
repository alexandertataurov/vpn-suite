"""Background worker entrypoint for VPN Suite control plane.

Runs reconciliation, telemetry, health checks, server sync, limits, and node scan
loops in a dedicated process, separate from the HTTP admin-api service.
"""

from __future__ import annotations

import asyncio
import logging

from app.core.admin_control_center_task import run_admin_control_center_loops
from app.core.anomaly_metrics_task import run_anomaly_metrics_export_loop
from app.core.config import settings
from app.core.device_expiry_task import run_device_expiry_loop
from app.core.docker_alert_polling_task import run_docker_alert_poll_loop
from app.core.handshake_quality_gate_task import run_handshake_quality_gate_loop
from app.core.health_check_task import run_health_check_loop
from app.core.limits_check_task import run_limits_check_loop
from app.core.logging_config import configure_logging, extra_for_event, set_log_context
from app.core.node_scan_task import run_node_scan_loop, run_node_scan_once
from app.core.onboarding_abandonment_task import run_onboarding_abandonment_loop
from app.core.redaction import redact_for_log
from app.core.redis_client import check_redis, close_redis, init_redis
from app.core.revenue_metrics_task import run_revenue_metrics_loop
from app.core.server_sync_loop import run_server_sync_loop
from app.core.grace_on_expiry_task import run_grace_on_expiry_loop
from app.core.subscription_expiry_reminder_task import run_subscription_reminder_loop
from app.core.telemetry_polling_task import run_telemetry_poll_loop
from app.live_metrics.aggregator_worker import run_live_metrics_aggregator
from app.services.docker_telemetry_service import DockerTelemetryService
from app.services.node_runtime import TimingNodeRuntimeAdapter
from app.services.reconciliation_engine import reconcile_all_nodes, run_reconciliation_loop

_log = logging.getLogger(__name__)


def _create_node_runtime_adapter():
    from app.core.config import settings as _settings

    if _settings.node_discovery == "docker":
        from app.services.node_runtime_docker import DockerNodeRuntimeAdapter

        prefixes = (
            getattr(_settings, "docker_vpn_container_prefixes", "amnezia-awg") or "amnezia-awg"
        )
        return DockerNodeRuntimeAdapter(container_filter=prefixes, interface="awg0")
    if _settings.node_discovery == "agent":
        from app.services.node_runtime_agent import AgentNodeRuntimeAdapter

        return AgentNodeRuntimeAdapter()
    raise ValueError(f"NODE_DISCOVERY={_settings.node_discovery!r} not supported")


async def _run_worker_loops() -> None:
    settings.validate_production_secrets()
    _log.info(
        "worker startup: config loaded",
        extra=extra_for_event(event="worker.startup"),
    )
    raw_adapter = _create_node_runtime_adapter()
    adapter = TimingNodeRuntimeAdapter(raw_adapter, adapter_name=settings.node_discovery)
    docker_telemetry_service = DockerTelemetryService()

    async def _get_adapter():
        return adapter

    await init_redis()
    redis_ok = await check_redis()
    _log.info(
        "worker startup: dependencies check",
        extra=extra_for_event(
            event="worker.startup",
            entity_id=f"redis={'ok' if redis_ok else 'fail'}",
        ),
    )

    health_task = asyncio.create_task(run_health_check_loop(lambda: adapter))
    revenue_metrics_task = asyncio.create_task(run_revenue_metrics_loop())
    anomaly_metrics_task = asyncio.create_task(run_anomaly_metrics_export_loop(_get_adapter))
    docker_alert_task = asyncio.create_task(
        run_docker_alert_poll_loop(lambda: docker_telemetry_service)
    )
    device_expiry_task = asyncio.create_task(run_device_expiry_loop())
    reminder_task = None
    if getattr(settings, "telegram_bot_token", None):
        reminder_task = asyncio.create_task(run_subscription_reminder_loop())
    grace_task = (
        asyncio.create_task(run_grace_on_expiry_loop())
        if getattr(settings, "grace_window_hours", 0) > 0
        else None
    )
    handshake_gate_task = asyncio.create_task(run_handshake_quality_gate_loop())
    sync_task = asyncio.create_task(run_server_sync_loop(lambda: adapter))
    admin_control_center_task = asyncio.create_task(run_admin_control_center_loops())
    onboarding_abandonment_task = asyncio.create_task(run_onboarding_abandonment_loop())
    limits_task = None
    telemetry_task = None
    recon_task = None
    scan_task = None
    live_metrics_task = None

    if settings.node_discovery == "docker":
        limits_task = asyncio.create_task(run_limits_check_loop(lambda: adapter))
        telemetry_task = asyncio.create_task(run_telemetry_poll_loop(lambda: adapter))
        recon_task = asyncio.create_task(run_reconciliation_loop(lambda: adapter))
        try:
            await run_node_scan_once(lambda: adapter)
        except Exception as exc:  # pragma: no cover - defensive logging
            _log.warning("Worker initial node scan failed: %s", redact_for_log(str(exc)))
        try:
            await reconcile_all_nodes(adapter)
        except Exception as exc:  # pragma: no cover - defensive logging
            _log.warning("Worker initial reconciliation failed: %s", redact_for_log(str(exc)))
        scan_task = asyncio.create_task(run_node_scan_loop(lambda: adapter))

    if getattr(settings, "live_obs_enabled", False):
        live_metrics_task = asyncio.create_task(run_live_metrics_aggregator())
    else:
        telemetry_task = asyncio.create_task(run_telemetry_poll_loop(lambda: adapter))
        recon_task = asyncio.create_task(run_reconciliation_loop(lambda: adapter))
        try:
            await run_node_scan_once(lambda: adapter)
        except Exception as exc:  # pragma: no cover - defensive logging
            _log.warning("Worker initial topology refresh failed: %s", redact_for_log(str(exc)))
        scan_task = asyncio.create_task(run_node_scan_loop(lambda: adapter))

    try:
        # Run indefinitely until cancelled by process manager.
        await asyncio.Event().wait()
    finally:
        health_task.cancel()
        revenue_metrics_task.cancel()
        anomaly_metrics_task.cancel()
        if reminder_task is not None:
            reminder_task.cancel()
        admin_control_center_task.cancel()
        for t in (
            limits_task,
            telemetry_task,
            recon_task,
            scan_task,
            sync_task,
            handshake_gate_task,
            live_metrics_task,
            grace_task,
            onboarding_abandonment_task,
        ):
            if t is not None:
                t.cancel()
        docker_alert_task.cancel()
        device_expiry_task.cancel()
        for t in (
            health_task,
            revenue_metrics_task,
            anomaly_metrics_task,
            limits_task,
            telemetry_task,
            recon_task,
            scan_task,
            device_expiry_task,
            reminder_task,
            grace_task,
            docker_alert_task,
            sync_task,
            handshake_gate_task,
            live_metrics_task,
            admin_control_center_task,
            onboarding_abandonment_task,
        ):
            if t is None:
                continue
            try:
                await t
            except asyncio.CancelledError:
                pass
        await close_redis()


def main() -> None:
    configure_logging(
        log_json=settings.log_json,
        log_level=settings.log_level,
        env=settings.environment,
    )
    set_log_context(service="admin-worker", env=settings.environment, version="0.1.0-rc.1")
    try:
        asyncio.run(_run_worker_loops())
    except KeyboardInterrupt:
        _log.info("Worker shutdown requested via KeyboardInterrupt")


if __name__ == "__main__":
    main()

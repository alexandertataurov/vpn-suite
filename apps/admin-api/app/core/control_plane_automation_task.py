"""Background task: periodic control-plane automation cycle."""

import asyncio
import logging

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.redaction import redact_for_log
from app.services.control_plane_service import apply_plan_bandwidth_policies, run_automation_cycle
from app.services.topology_engine import TopologyEngine

_log = logging.getLogger(__name__)


async def run_control_plane_automation_loop(get_adapter) -> None:
    """Run automation cycle every configured interval. Disabled when flag false or interval <= 0."""
    if (
        not settings.control_plane_automation_enabled
    ) or settings.control_plane_automation_interval_seconds <= 0:
        _log.info(
            "Control-plane automation disabled (enabled=%s interval=%s)",
            settings.control_plane_automation_enabled,
            settings.control_plane_automation_interval_seconds,
        )
        return
    interval = settings.control_plane_automation_interval_seconds
    while True:
        try:
            adapter = get_adapter() if callable(get_adapter) else None
            if adapter is None:
                _log.warning("Control-plane automation skipped: runtime adapter unavailable")
                await asyncio.sleep(interval)
                continue
            topo = await TopologyEngine(adapter).get_topology()
            async with async_session_factory() as session:
                result = await run_automation_cycle(
                    session,
                    topo,
                    high_watermark=settings.control_plane_rebalance_high_watermark,
                    target_watermark=settings.control_plane_rebalance_target_watermark,
                    max_moves_per_node=settings.control_plane_rebalance_max_moves_per_node,
                    unhealthy_health_threshold=settings.control_plane_unhealthy_health_threshold,
                    execute_rebalance=settings.control_plane_rebalance_execute_enabled,
                    rebalance_batch_size=settings.control_plane_rebalance_batch_size,
                    rebalance_max_executions_per_cycle=settings.control_plane_rebalance_max_executions_per_cycle,
                    rebalance_stop_on_error=settings.control_plane_rebalance_stop_on_error,
                    rebalance_rollback_on_error=settings.control_plane_rebalance_rollback_on_error,
                    runtime_adapter=adapter,
                    sync_server_state=True,
                )
                if settings.control_plane_throttling_enabled:
                    await apply_plan_bandwidth_policies(
                        session,
                        topo,
                        runtime_adapter=adapter,
                        dry_run=settings.control_plane_throttling_dry_run,
                    )
                await session.commit()
                _log.info(
                    "Control-plane automation cycle completed failed=%s moves=%s paused=%s resumed=%s",
                    result.failed_nodes,
                    result.rebalance_moves,
                    result.paused_nodes,
                    result.resumed_nodes,
                )
        except Exception as exc:
            _log.exception("Control-plane automation loop error: %s", redact_for_log(str(exc)))
        await asyncio.sleep(interval)

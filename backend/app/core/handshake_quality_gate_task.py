"""Background task: mark devices ERROR when no handshake within X min; promote to VERIFIED when handshake seen."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update

from app.core.config import settings
from app.core.database import async_session_factory
from app.models import Device
from app.services.device_telemetry_cache import get_device_telemetry_bulk

try:
    from app.core.metrics import (
        vpn_devices_no_handshake,
        vpn_handshake_latency_seconds,
        vpn_peer_unstable_events_total,
    )
except Exception:
    vpn_devices_no_handshake = None  # type: ignore[assignment]
    vpn_handshake_latency_seconds = None  # type: ignore[assignment]
    vpn_peer_unstable_events_total = None  # type: ignore[assignment]

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 60
NO_HANDSHAKE_REASON = "no_handshake_within_gate"
APPLIED_OR_VERIFIED = ("APPLIED", "VERIFIED")
STATES_ELIGIBLE_FOR_VERIFIED = ("APPLIED", "NO_HANDSHAKE", "ERROR")


async def run_handshake_quality_gate_once() -> int:
    """Check APPLIED devices older than gate; mark ERROR if no handshake. Promote to VERIFIED when handshake seen. Returns count marked ERROR."""
    gate_minutes = getattr(settings, "handshake_quality_gate_minutes", 5) or 5
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=gate_minutes)
    marked = 0
    async with async_session_factory() as session:
        # Pass 1: APPLIED + past gate + no handshake -> ERROR
        r = await session.execute(
            select(Device.id, Device.last_applied_at).where(
                Device.apply_status == "APPLIED",
                Device.last_applied_at.isnot(None),
                Device.last_applied_at < cutoff,
                Device.revoked_at.is_(None),
                Device.unstable_reason.is_(None),
            )
        )
        rows = r.all()
        if rows:
            device_ids = [row[0] for row in rows]
            telemetry = await get_device_telemetry_bulk(device_ids)
            for device_id, last_applied_at in rows:
                data = telemetry.get(device_id)
                if data is None:
                    continue
                has_handshake = data.handshake_latest_at is not None or (
                    data.handshake_age_sec is not None and data.handshake_age_sec >= 0
                )
                if has_handshake:
                    continue
                await session.execute(
                    update(Device)
                    .where(Device.id == device_id)
                    .values(
                        apply_status="ERROR",
                        last_error=NO_HANDSHAKE_REASON,
                        unstable_reason=NO_HANDSHAKE_REASON,
                    )
                )
                marked += 1
                _log.info(
                    "handshake quality gate: marked ERROR (no handshake)",
                    extra={
                        "event": "no_handshake_marked",
                        "device_id": device_id,
                        "last_applied_at": last_applied_at.isoformat() if last_applied_at else None,
                    },
                )
                if vpn_peer_unstable_events_total is not None:
                    try:
                        vpn_peer_unstable_events_total.labels(reason=NO_HANDSHAKE_REASON).inc()
                    except Exception:
                        pass
        if marked:
            await session.commit()

        # Pass 2: APPLIED / NO_HANDSHAKE / ERROR + handshake seen -> VERIFIED, set handshake_latency
        r2 = await session.execute(
            select(Device.id, Device.server_id, Device.last_applied_at).where(
                Device.apply_status.in_(STATES_ELIGIBLE_FOR_VERIFIED),
                Device.revoked_at.is_(None),
            )
        )
        rows2 = r2.all()
        if rows2:
            device_ids2 = [row[0] for row in rows2]
            telemetry2 = await get_device_telemetry_bulk(device_ids2)
            verified_count = 0
            for device_id, server_id, last_applied_at in rows2:
                data = telemetry2.get(device_id)
                if data is None:
                    continue
                has_handshake = data.handshake_latest_at is not None or (
                    data.handshake_age_sec is not None and data.handshake_age_sec >= 0
                )
                if not has_handshake:
                    continue
                await session.execute(
                    update(Device)
                    .where(Device.id == device_id)
                    .values(
                        apply_status="VERIFIED",
                        last_error=None,
                        unstable_reason=None,
                    )
                )
                verified_count += 1
                if (
                    vpn_handshake_latency_seconds is not None
                    and last_applied_at is not None
                    and data.handshake_latest_at is not None
                ):
                    try:
                        lat = (data.handshake_latest_at - last_applied_at).total_seconds()
                        if lat >= 0:
                            vpn_handshake_latency_seconds.labels(
                                device_id=device_id,
                                server_id=server_id or "",
                            ).set(lat)
                    except Exception:
                        pass
            if verified_count:
                await session.commit()

        if vpn_devices_no_handshake is not None:
            count_result = await session.execute(
                select(func.count())
                .select_from(Device)
                .where(
                    Device.apply_status.in_(("NO_HANDSHAKE", "ERROR")),
                    Device.revoked_at.is_(None),
                )
            )
            vpn_devices_no_handshake.set(count_result.scalar() or 0)
    return marked


async def run_handshake_quality_gate_loop() -> None:
    """Loop: every INTERVAL_SECONDS run quality gate check."""
    while True:
        try:
            await run_handshake_quality_gate_once()
        except Exception as e:
            _log.exception("Handshake quality gate task error: %s", e)
        await asyncio.sleep(INTERVAL_SECONDS)

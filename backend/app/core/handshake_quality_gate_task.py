"""Background task: mark devices NO_HANDSHAKE when no handshake within X min after apply."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update

from app.core.config import settings
from app.core.database import async_session_factory
from app.models import Device
from app.services.device_telemetry_cache import get_device_telemetry_bulk

try:
    from app.core.metrics import vpn_devices_no_handshake
except Exception:
    vpn_devices_no_handshake = None  # type: ignore[assignment]

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 60
NO_HANDSHAKE_REASON = "no_handshake_within_gate"


async def run_handshake_quality_gate_once() -> int:
    """Check APPLIED devices with last_applied_at older than gate; mark NO_HANDSHAKE if no handshake. Returns count marked."""
    gate_minutes = getattr(settings, "handshake_quality_gate_minutes", 5) or 5
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=gate_minutes)
    marked = 0
    async with async_session_factory() as session:
        r = await session.execute(
            select(Device.id, Device.last_applied_at).where(
                Device.apply_status == "APPLIED",
                Device.last_applied_at.isnot(None),
                Device.last_applied_at < cutoff,
                Device.revoked_at.is_(None),
            )
        )
        rows = r.all()
        if not rows:
            if vpn_devices_no_handshake is not None:
                count_result = await session.execute(
                    select(func.count()).select_from(Device).where(
                        Device.apply_status == "NO_HANDSHAKE",
                        Device.revoked_at.is_(None),
                    )
                )
                vpn_devices_no_handshake.set(count_result.scalar() or 0)
            return 0
        device_ids = [row[0] for row in rows]
        telemetry = await get_device_telemetry_bulk(device_ids)
        for device_id, last_applied_at in rows:
            data = telemetry.get(device_id)
            if data is None:
                continue  # No telemetry yet; skip to avoid false positive
            has_handshake = (
                data.handshake_latest_at is not None
                or (data.handshake_age_sec is not None and data.handshake_age_sec >= 0)
            )
            if has_handshake:
                continue
            await session.execute(
                update(Device)
                .where(Device.id == device_id)
                .values(
                    apply_status="NO_HANDSHAKE",
                    last_error=NO_HANDSHAKE_REASON,
                )
            )
            marked += 1
            _log.info(
                "handshake quality gate: marked NO_HANDSHAKE",
                extra={
                    "event": "no_handshake_marked",
                    "device_id": device_id,
                    "last_applied_at": last_applied_at.isoformat() if last_applied_at else None,
                },
            )
        if marked:
            await session.commit()
        if vpn_devices_no_handshake is not None:
            count_result = await session.execute(
                select(func.count()).select_from(Device).where(
                    Device.apply_status == "NO_HANDSHAKE",
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

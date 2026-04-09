"""SSE stream for devices: emit devices.changed with full payload per spec."""

import asyncio
import json
import logging
import time

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.core.constants import PERM_CLUSTER_READ
from app.core.database import async_session_factory
from app.core.rbac import require_permission
from app.models import Device

router = APIRouter(prefix="/devices", tags=["devices"])
_log = logging.getLogger(__name__)

STREAM_INTERVAL_SEC = 15.0
STREAM_CONSECUTIVE_ERROR_MAX = 5
STREAM_BACKOFF_SEC = 30.0
STREAM_DEVICE_LIMIT = 200


async def _fetch_devices_summary():
    """Return minimal device list (id, server_id, revoked_at) limit 200."""
    async with async_session_factory() as db:
        stmt = (
            select(Device.id, Device.server_id, Device.revoked_at, Device.issued_at)
            .order_by(Device.issued_at.desc())
            .limit(STREAM_DEVICE_LIMIT)
        )
        rows = (await db.execute(stmt)).all()
        return [
            {
                "id": r.id,
                "server_id": r.server_id,
                "revoked_at": r.revoked_at.isoformat() if r.revoked_at else None,
                "issued_at": r.issued_at.isoformat() if r.issued_at else None,
            }
            for r in rows
        ]


async def _devices_stream_events():
    """Emit devices.changed every STREAM_INTERVAL_SEC. data: devices per spec."""
    consecutive_errors = 0
    while True:
        try:
            devices = await _fetch_devices_summary()
            payload = {"event": "devices.changed", "data": devices, "ts": time.time()}
            yield f"event: devices.changed\ndata: {json.dumps(payload, default=str)}\n\n"
            consecutive_errors = 0
        except asyncio.CancelledError:
            break
        except Exception:
            _log.exception("Devices stream iteration failed")
            consecutive_errors += 1
            if consecutive_errors >= STREAM_CONSECUTIVE_ERROR_MAX:
                await asyncio.sleep(STREAM_BACKOFF_SEC)
                consecutive_errors = 0
        await asyncio.sleep(STREAM_INTERVAL_SEC)


@router.get("/stream")
async def devices_stream(
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """SSE stream: devices.changed every ~15s. Frontend invalidates on event (push vs poll)."""
    return StreamingResponse(
        _devices_stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

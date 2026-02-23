import asyncio
import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select

from app.api.v1.server_utils import _agent_heartbeat_server_ids, _display_is_active
from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ
from app.core.database import async_session_factory
from app.core.rbac import require_permission
from app.models import Server, ServerHealthLog
from app.schemas.server import normalize_server_status

router = APIRouter(prefix="/servers", tags=["servers"])
logger = logging.getLogger(__name__)

STREAM_CONSECUTIVE_ERROR_MAX = 5
STREAM_BACKOFF_SEC = 30.0
STREAM_PAGE_SIZE = 200
STREAM_INTERVAL_SEC = 3.0


async def _servers_stream_events():
    """Async generator: emit server.status (and optional server.telemetry) every 3s. Throttled."""
    consecutive_errors = 0
    while True:
        try:
            async with async_session_factory() as db:
                stmt = select(Server).order_by(Server.created_at.desc()).limit(STREAM_PAGE_SIZE)
                rows = (await db.execute(stmt)).scalars().all()
                if settings.node_discovery == "agent":
                    heartbeat_ids = await _agent_heartbeat_server_ids()
                    if heartbeat_ids:
                        rows = [s for s in rows if s.id in heartbeat_ids]
                    else:
                        rows = []
                if rows:
                    last_q = (
                        select(
                            ServerHealthLog.server_id, func.max(ServerHealthLog.ts).label("last_ts")
                        )
                        .where(ServerHealthLog.server_id.in_([s.id for s in rows]))
                        .group_by(ServerHealthLog.server_id)
                    )
                    last_seen_map = {
                        r.server_id: r.last_ts for r in (await db.execute(last_q)).all()
                    }
                    payload = [
                        {
                            "id": s.id,
                            "status": normalize_server_status(s.status),
                            "is_active": _display_is_active(s, last_seen_map.get(s.id)),
                            "last_seen_at": last_seen_map.get(s.id),
                            "health_score": getattr(s, "health_score", None),
                            "is_draining": getattr(s, "is_draining", False),
                            "last_snapshot_at": getattr(s, "last_snapshot_at", None),
                        }
                        for s in rows
                    ]
                    yield f"event: server.status\ndata: {json.dumps(payload, default=str)}\n\n"
            consecutive_errors = 0
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Servers stream iteration failed")
            consecutive_errors += 1
            if consecutive_errors >= STREAM_CONSECUTIVE_ERROR_MAX:
                logger.warning(
                    "Servers stream: %s consecutive errors, backoff %s s",
                    consecutive_errors,
                    STREAM_BACKOFF_SEC,
                )
                await asyncio.sleep(STREAM_BACKOFF_SEC)
                consecutive_errors = 0
        await asyncio.sleep(STREAM_INTERVAL_SEC)


@router.get("/stream")
async def servers_stream(
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """SSE stream: server.status (and optional server.telemetry) events. One stream per page. Throttled ~3s."""
    return StreamingResponse(
        _servers_stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

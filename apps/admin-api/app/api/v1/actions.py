"""Actions API: GET /actions/{action_id} (progress and logs)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_SERVERS_READ
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.rbac import require_permission
from app.schemas.action import ActionOut, AgentActionLogOut
from app.services.agent_action_service import get_action

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("/{action_id}", response_model=ActionOut)
async def get_action_by_id(
    action_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return action and recent logs (progress)."""
    action = await get_action(db, action_id, load_logs=True)
    if not action:
        raise not_found_404("Action", action_id)
    logs_out = [
        AgentActionLogOut(ts=log.ts, level=log.level, message=log.message, meta=log.meta)
        for log in (action.logs or [])
    ]
    logs_out.sort(key=lambda x: x.ts)
    return ActionOut(
        id=action.id,
        server_id=action.server_id,
        type=action.type,
        status=action.status,
        requested_by=action.requested_by,
        requested_at=action.requested_at,
        started_at=action.started_at,
        finished_at=action.finished_at,
        error=action.error,
        correlation_id=action.correlation_id,
        logs=logs_out,
    )

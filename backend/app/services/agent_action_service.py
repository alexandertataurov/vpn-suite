"""Agent action queue: create, get, append_log, set_status, get_pending (for poll)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentAction, AgentActionLog


async def create_action(
    session: AsyncSession,
    *,
    server_id: str,
    type: str,
    payload: dict | None = None,
    requested_by: str | None = None,
    correlation_id: str | None = None,
) -> AgentAction:
    action = AgentAction(
        server_id=server_id,
        type=type,
        payload=payload,
        status="pending",
        requested_by=requested_by,
        correlation_id=correlation_id,
    )
    session.add(action)
    await session.flush()
    return action


async def get_action(
    session: AsyncSession,
    action_id: str,
    *,
    load_logs: bool = True,
) -> AgentAction | None:
    result = await session.execute(select(AgentAction).where(AgentAction.id == action_id))
    action = result.scalar_one_or_none()
    if action and load_logs:
        await session.refresh(action, ["logs"])
        if action.logs:
            action.logs.sort(key=lambda log: log.ts)
    return action


async def append_log(
    session: AsyncSession,
    action_id: str,
    *,
    level: str,
    message: str,
    meta: dict | None = None,
) -> None:
    log = AgentActionLog(action_id=action_id, level=level, message=message, meta=meta)
    session.add(log)
    await session.flush()


async def set_status(
    session: AsyncSession,
    action_id: str,
    status: str,
    *,
    error: str | None = None,
    started_at: datetime | None = None,
    finished_at: datetime | None = None,
) -> bool:
    result = await session.execute(select(AgentAction).where(AgentAction.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        return False
    action.status = status
    if error is not None:
        action.error = error
    if started_at is not None:
        action.started_at = started_at
    if finished_at is not None:
        action.finished_at = finished_at
    await session.flush()
    return True


async def get_pending_action(
    session: AsyncSession,
    server_id: str,
) -> AgentAction | None:
    """Return oldest pending action for server_id. Caller should then set status to running."""
    result = await session.execute(
        select(AgentAction)
        .where(AgentAction.server_id == server_id, AgentAction.status == "pending")
        .order_by(AgentAction.requested_at.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_actions(
    session: AsyncSession,
    server_id: str,
    *,
    status_filter: list[str] | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[AgentAction], int]:
    """Return (actions, total) for server_id with optional status filter and pagination."""
    base = select(AgentAction).where(AgentAction.server_id == server_id)
    count_stmt = (
        select(func.count()).select_from(AgentAction).where(AgentAction.server_id == server_id)
    )
    if status_filter:
        base = base.where(AgentAction.status.in_(status_filter))
        count_stmt = count_stmt.where(AgentAction.status.in_(status_filter))
    total = (await session.execute(count_stmt)).scalar() or 0
    stmt = base.order_by(AgentAction.requested_at.desc()).offset(offset).limit(limit)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    for a in rows:
        await session.refresh(a, ["logs"])
        if a.logs:
            a.logs.sort(key=lambda log: log.ts)
    return list(rows), total

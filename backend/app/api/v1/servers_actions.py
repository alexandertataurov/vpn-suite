"""Server actions: POST /servers/{server_id}/actions (create queued action)."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import generate_h_params
from app.core.constants import PERM_SERVERS_READ, PERM_SERVERS_WRITE
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.logging_config import request_id_ctx
from app.core.rate_limit import rate_limit_server_actions
from app.core.rbac import require_permission
from app.models import Server
from app.schemas.action import (
    ALLOWED_ACTION_TYPES,
    ActionCreate,
    ActionCreateOut,
    ActionListOut,
    ActionOut,
    AgentActionLogOut,
)
from app.services.agent_action_service import create_action, list_actions
from app.services.audit_service import log_audit


class RotateObfuscationHOut(BaseModel):
    """New H1–H4 stored on server; node-agent will apply via action apply_obfuscation_h."""

    h1: int
    h2: int
    h3: int
    h4: int
    action_id: str

servers_actions_router = APIRouter()


@servers_actions_router.post(
    "/{server_id}/rotate-obfuscation-h",
    response_model=RotateObfuscationHOut,
    status_code=status.HTTP_200_OK,
)
async def rotate_server_obfuscation_h(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Generate new H1–H4, save to server, and enqueue apply_obfuscation_h for node-agent to sync to AmneziaWG container."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    admin_id = str(admin.id) if hasattr(admin, "id") else ""
    await rate_limit_server_actions(request, server_id, admin_id)
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    H1, H2, H3, H4 = generate_h_params()
    server.amnezia_h1, server.amnezia_h2, server.amnezia_h3, server.amnezia_h4 = H1, H2, H3, H4
    await db.flush()
    action = await create_action(
        db,
        server_id=server_id,
        type="apply_obfuscation_h",
        payload={"h1": H1, "h2": H2, "h3": H3, "h4": H4},
        requested_by=admin_id,
        correlation_id=rid,
    )
    await log_audit(
        db,
        admin_id=admin_id,
        action="server.rotate_obfuscation_h",
        resource_type="server",
        resource_id=server_id,
        old_new={"h1": H1, "h2": H2, "h3": H3, "h4": H4, "action_id": action.id},
        request_id=rid,
    )
    await db.commit()
    return RotateObfuscationHOut(h1=H1, h2=H2, h3=H3, h4=H4, action_id=action.id)


@servers_actions_router.post(
    "/{server_id}/actions", response_model=ActionCreateOut, status_code=status.HTTP_201_CREATED
)
async def create_server_action(
    request: Request,
    server_id: str,
    body: ActionCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Create a queued action for the server (sync, apply_peers, drain, undrain, etc.). Agent picks up via poll."""
    if body.type not in ALLOWED_ACTION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid action type: {body.type}. Allowed: {sorted(ALLOWED_ACTION_TYPES)}",
        )
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    admin_id = str(admin.id) if hasattr(admin, "id") else ""
    await rate_limit_server_actions(request, server_id, admin_id)
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    # Drain/undrain: apply immediately in DB so UI sees it; agent will still poll and report for audit.
    if body.type == "drain":
        server.is_draining = True
        await db.flush()
    elif body.type == "undrain":
        server.is_draining = False
        await db.flush()
    action = await create_action(
        db,
        server_id=server_id,
        type=body.type,
        payload=body.payload,
        requested_by=admin_id,
        correlation_id=rid,
    )
    await log_audit(
        db,
        admin_id=admin_id,
        action="action.create",
        resource_type="agent_action",
        resource_id=action.id,
        old_new={"server_id": server_id, "type": body.type, "status": "pending"},
        request_id=rid,
    )
    await db.commit()
    return ActionCreateOut(action_id=action.id, correlation_id=action.correlation_id)


@servers_actions_router.get("/{server_id}/actions", response_model=ActionListOut)
async def list_server_actions(
    server_id: str,
    status: str | None = Query(
        None,
        description="Comma-separated statuses: pending, running, completed, failed",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """List actions for a server with optional status filter and pagination."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    if not result.scalar_one_or_none():
        raise not_found_404("Server", server_id)
    status_filter = None
    if status:
        status_filter = [s.strip() for s in status.split(",") if s.strip()]
    actions, total = await list_actions(
        db, server_id, status_filter=status_filter, limit=limit, offset=offset
    )
    items = [
        ActionOut(
            id=a.id,
            server_id=a.server_id,
            type=a.type,
            status=a.status,
            requested_by=a.requested_by,
            requested_at=a.requested_at,
            started_at=a.started_at,
            finished_at=a.finished_at,
            error=a.error,
            correlation_id=a.correlation_id,
            logs=[
                AgentActionLogOut(ts=log.ts, level=log.level, message=log.message, meta=log.meta)
                for log in (a.logs or [])
            ],
        )
        for a in actions
    ]
    return ActionListOut(items=items, total=total)

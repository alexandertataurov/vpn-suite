"""Frontend error logging (optional observability)."""

import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.logging_config import extra_for_event, request_id_ctx

_log = logging.getLogger(__name__)

router = APIRouter(prefix="/log", tags=["log"])


class FrontendErrorIn(BaseModel):
    message: str
    stack: str | None = None
    component_stack: str | None = Field(default=None, alias="componentStack")
    route: str | None = None
    build_hash: str | None = Field(default=None, alias="buildHash")
    user_agent: str | None = Field(default=None, alias="userAgent")

    model_config = {"populate_by_name": True}


@router.post("/frontend-error", status_code=204)
async def log_frontend_error(request: Request, body: FrontendErrorIn):
    """Accept frontend error reports; log at ERROR. No auth required (rate-limited by global middleware)."""
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    route = (body.route or "")[:200] or None
    stack = (
        (body.stack[:1000] + "...") if body.stack and len(body.stack) > 1000 else (body.stack or "")
    )
    component_stack = (
        (body.component_stack[:500] + "...")
        if body.component_stack and len(body.component_stack) > 500
        else (body.component_stack or "")
    )
    extra = extra_for_event(
        event="frontend.error",
        route=route,
        entity_id=(body.build_hash or "")[:64] or None,
        error_code="E_FRONTEND_ERROR",
        error_kind="frontend",
        error_severity="error",
        error_retryable=False,
    )
    _log.error(
        "frontend_error request_id=%s route=%s build_hash=%s user_agent=%s message=%s stack=%s component_stack=%s",
        rid,
        route or "",
        (body.build_hash or "")[:64],
        (body.user_agent or "")[:256],
        (body.message or "")[:500],
        stack,
        component_stack,
        extra=extra,
    )
    return None

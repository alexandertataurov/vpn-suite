"""Admin News: broadcast messages to all users (Telegram)."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_WRITE
from app.core.database import get_db
from app.core.news_broadcast_task import (
    enqueue_news_broadcast,
    get_news_broadcast_status,
    get_recent_news_broadcasts,
    send_telegram_message,
)
from app.core.rbac import require_permission
from app.core.redaction import redact_for_log
from app.models import User

router = APIRouter(prefix="/admin/news", tags=["admin-news"])


class NewsTargetFilters(BaseModel):
    search: str | None = None
    is_banned: bool | None = None
    plan_id: str | None = None
    region: str | None = None


class NewsSendTarget(BaseModel):
    kind: str = Field(default="all", pattern="^(all|user_ids|tg_ids|filters)$")
    user_ids: list[int] | None = None
    tg_ids: list[int] | None = None
    filters: NewsTargetFilters | None = None
    include_banned: bool | None = None


class NewsBroadcastRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3500)
    parse_mode: str | None = Field(default="HTML", description="Telegram parse_mode: HTML/MarkdownV2 or null")
    include_banned: bool = False
    target: NewsSendTarget | None = None


class NewsBroadcastResponse(BaseModel):
    broadcast_id: str
    status: str


class DirectMessageRequest(BaseModel):
    user_id: int
    text: str = Field(..., min_length=1, max_length=3500)
    parse_mode: str | None = Field(default="HTML", description="Telegram parse_mode: HTML/MarkdownV2 or null")


class DirectMessageResponse(BaseModel):
    user_id: int
    tg_id: int
    status: str
    error: str | None = None


def _normalize_parse_mode(value: str | None) -> str | None:
    parse_mode = (value or "").strip() or None
    if parse_mode not in (None, "HTML", "MarkdownV2"):
        raise HTTPException(status_code=400, detail="parse_mode must be HTML, MarkdownV2, or null")
    return parse_mode


@router.post("/broadcast", response_model=NewsBroadcastResponse)
async def create_news_broadcast(
    request: Request,
    body: NewsBroadcastRequest,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    parse_mode = _normalize_parse_mode(body.parse_mode)
    target = body.target.model_dump(exclude_none=True) if body.target else None
    include_banned = (
        bool(body.target.include_banned)
        if body.target is not None and body.target.include_banned is not None
        else bool(body.include_banned)
    )

    created_by = str(getattr(getattr(request.state, "principal", None), "admin_id", "") or "admin")
    broadcast_id = await enqueue_news_broadcast(
        text=text,
        parse_mode=parse_mode,
        include_banned=include_banned,
        created_by=created_by,
        target=target,
    )
    request.state.audit_resource_type = "news_broadcast"
    request.state.audit_resource_id = broadcast_id
    request.state.audit_old_new = {
        "created": {
            "include_banned": include_banned,
            "parse_mode": parse_mode,
            "target": target or {"kind": "all"},
            "text_preview": redact_for_log(text[:120]),
        }
    }
    return NewsBroadcastResponse(broadcast_id=broadcast_id, status="queued")


@router.post("/direct", response_model=DirectMessageResponse)
async def send_direct_message(
    request: Request,
    body: DirectMessageRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    parse_mode = _normalize_parse_mode(body.parse_mode)
    user = (await db.execute(select(User).where(User.id == body.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.tg_id:
        raise HTTPException(status_code=409, detail="User does not have a Telegram id")
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        raise HTTPException(status_code=503, detail="Telegram bot token is not configured")
    async with httpx.AsyncClient(timeout=10.0) as client:
        ok, err = await send_telegram_message(
            client,
            token=token,
            tg_id=int(user.tg_id),
            text=text,
            parse_mode=parse_mode,
        )
    request.state.audit_resource_type = "direct_message"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {
        "created": {"user_id": user.id, "tg_id": user.tg_id, "text_preview": redact_for_log(text[:120])}
    }
    if not ok:
        return DirectMessageResponse(user_id=user.id, tg_id=user.tg_id, status="failed", error=err)
    return DirectMessageResponse(user_id=user.id, tg_id=user.tg_id, status="sent")


@router.get("/broadcast/{broadcast_id}")
async def news_broadcast_status(
    broadcast_id: str,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    data = await get_news_broadcast_status(broadcast_id)
    if not data:
        raise HTTPException(status_code=404, detail="not found")
    # Return safe subset; keep text in response for admin copy/paste.
    return {
        "id": data.get("id", broadcast_id),
        "status": data.get("status", ""),
        "created_at": data.get("created_at", ""),
        "started_at": data.get("started_at", ""),
        "finished_at": data.get("finished_at", ""),
        "total": int(data.get("total", "0") or 0),
        "sent": int(data.get("sent", "0") or 0),
        "failed": int(data.get("failed", "0") or 0),
        "last_error": data.get("last_error", ""),
        "parse_mode": data.get("parse_mode", "") or None,
        "include_banned": data.get("include_banned", "0") == "1",
        "text": data.get("text", ""),
    }


@router.get("/broadcasts")
async def recent_news_broadcasts(
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
    limit: int = Query(20, ge=1, le=50),
):
    rows = await get_recent_news_broadcasts(limit)
    return [
        {
            "id": row.get("id", ""),
            "status": row.get("status", ""),
            "created_at": row.get("created_at", ""),
            "finished_at": row.get("finished_at", ""),
            "total": int(row.get("total", "0") or 0),
            "sent": int(row.get("sent", "0") or 0),
            "failed": int(row.get("failed", "0") or 0),
            "last_error": row.get("last_error", ""),
            "parse_mode": row.get("parse_mode", "") or None,
            "include_banned": row.get("include_banned", "0") == "1",
            "text": row.get("text", ""),
        }
        for row in rows
    ]

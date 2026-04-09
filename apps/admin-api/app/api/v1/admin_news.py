"""Admin News: broadcast messages to all users (Telegram)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.constants import PERM_CLUSTER_WRITE
from app.core.rbac import require_permission
from app.core.redaction import redact_for_log
from app.core.news_broadcast_task import enqueue_news_broadcast, get_news_broadcast_status

router = APIRouter(prefix="/admin/news", tags=["admin-news"])


class NewsBroadcastRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3500)
    parse_mode: str | None = Field(default="HTML", description="Telegram parse_mode: HTML/MarkdownV2 or null")
    include_banned: bool = False


class NewsBroadcastResponse(BaseModel):
    broadcast_id: str
    status: str


@router.post("/broadcast", response_model=NewsBroadcastResponse)
async def create_news_broadcast(
    request: Request,
    body: NewsBroadcastRequest,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    parse_mode = (body.parse_mode or "").strip() or None
    if parse_mode not in (None, "HTML", "MarkdownV2"):
        raise HTTPException(status_code=400, detail="parse_mode must be HTML, MarkdownV2, or null")

    created_by = str(getattr(getattr(request.state, "principal", None), "admin_id", "") or "admin")
    broadcast_id = await enqueue_news_broadcast(
        text=text,
        parse_mode=parse_mode,
        include_banned=bool(body.include_banned),
        created_by=created_by,
    )
    request.state.audit_resource_type = "news_broadcast"
    request.state.audit_resource_id = broadcast_id
    request.state.audit_old_new = {
        "created": {
            "include_banned": bool(body.include_banned),
            "parse_mode": parse_mode,
            "text_preview": redact_for_log(text[:120]),
        }
    }
    return NewsBroadcastResponse(broadcast_id=broadcast_id, status="queued")


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


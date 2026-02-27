"""Admin DevOps: node discovery, sync status, reconciliation, queue, Redis/DB health."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ
from app.core.database import check_db
from app.core.redis_client import check_redis
from app.core.rbac import require_permission

router = APIRouter(prefix="/admin/devops", tags=["admin-devops"])


class DevOpsHealthOut(BaseModel):
    redis_ok: bool
    db_ok: bool
    node_discovery: str
    node_scan_interval_seconds: int
    node_mode: str
    reconciliation_interval_seconds: int
    reconciliation_read_only: bool


@router.get("/health", response_model=DevOpsHealthOut)
async def get_devops_health(
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Redis, DB, node discovery, sync and reconciliation config status."""
    redis_ok = await check_redis()
    db_ok = await check_db()
    return DevOpsHealthOut(
        redis_ok=redis_ok,
        db_ok=db_ok,
        node_discovery=getattr(settings, "node_discovery", "docker"),
        node_scan_interval_seconds=getattr(settings, "node_scan_interval_seconds", 300),
        node_mode=getattr(settings, "node_mode", "mock"),
        reconciliation_interval_seconds=getattr(settings, "reconciliation_interval_seconds", 60),
        reconciliation_read_only=getattr(settings, "reconciliation_read_only", False),
    )

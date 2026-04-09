"""Audit log API: list logs (RBAC)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bot_auth import require_audit_read
from app.core.database import get_db
from app.models import AuditLog
from app.schemas.audit import AuditLogList, AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=AuditLogList)
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_audit_read),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    resource_type: str | None = Query(
        None, description="Filter by resource_type e.g. server, device"
    ),
    resource_id: str | None = Query(None, description="Filter by resource_id (e.g. server_id)"),
    request_id: str | None = Query(None, description="Filter by request_id for traceability"),
):
    stmt = select(AuditLog)
    count_stmt = select(func.count()).select_from(AuditLog)
    if resource_type is not None:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
        count_stmt = count_stmt.where(AuditLog.resource_type == resource_type)
    if resource_id is not None:
        stmt = stmt.where(AuditLog.resource_id == resource_id)
        count_stmt = count_stmt.where(AuditLog.resource_id == resource_id)
    if request_id is not None:
        stmt = stmt.where(AuditLog.request_id == request_id)
        count_stmt = count_stmt.where(AuditLog.request_id == request_id)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    result = await db.execute(stmt.order_by(AuditLog.id.desc()).limit(limit).offset(offset))
    rows = result.scalars().all()
    return AuditLogList(
        items=[AuditLogOut.model_validate(r) for r in rows],
        total=total,
    )

"""Audit log service."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


async def log_audit(
    session: AsyncSession,
    *,
    admin_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    old_new: dict | None = None,
    request_id: str | None = None,
) -> None:
    entry = AuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_new=old_new,
        request_id=request_id,
    )
    session.add(entry)

"""RBAC: require permission dependency."""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.models import AdminUser, Role


def require_permission(permission: str):
    """Dependency: current admin must have this permission (or '*')."""

    async def _check(
        request: Request,
        admin: AdminUser = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db),
    ) -> AdminUser:
        result = await db.execute(select(Role).where(Role.id == admin.role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No role")
        perms: list = role.permissions if isinstance(role.permissions, list) else []
        if "*" not in perms and permission not in perms:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        request.state.audit_admin_id = admin.id
        request.state.audit_action = f"{request.method} {request.url.path}"
        request.state.audit_resource_type = request.url.path.strip("/").split("/")[0] or "api"
        return admin

    return _check

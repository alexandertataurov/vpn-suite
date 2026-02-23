"""Bot API Key auth: X-API-Key allows bot-only scope (by-tg, issue, reset). No admin permissions."""

import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_admin_optional
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models import AdminUser, Role


class BotPrincipal:
    """Caller authenticated via X-API-Key (bot); no admin permissions."""

    __slots__ = ()


class WebAppPrincipal:
    """Caller authenticated via Bearer session token (WebApp)."""

    __slots__ = ("tg_id",)

    def __init__(self, tg_id: int):
        self.tg_id = tg_id


async def get_admin_or_bot(
    request: Request,
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    admin: AdminUser | None = Depends(get_current_admin_optional),
) -> AdminUser | BotPrincipal | WebAppPrincipal:
    """Accept JWT (admin), X-API-Key (bot), or Bearer session token (WebApp)."""
    if admin is not None:
        return admin
    if (
        x_api_key
        and settings.bot_api_key
        and secrets.compare_digest(x_api_key, settings.bot_api_key)
    ):
        return BotPrincipal()
    # WebApp session token (Bearer)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = decode_token(token)
        if payload and payload.get("type") == "webapp" and payload.get("sub"):
            try:
                return WebAppPrincipal(tg_id=int(payload["sub"]))
            except (ValueError, TypeError):
                pass
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_admin(
    principal: AdminUser | BotPrincipal | WebAppPrincipal = Depends(get_admin_or_bot),
) -> AdminUser:
    """Use on admin-only routes (e.g. audit): reject bot/webapp with 403."""
    if isinstance(principal, BotPrincipal | WebAppPrincipal):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return principal


async def require_audit_read(
    request: Request,
    principal: AdminUser | BotPrincipal | WebAppPrincipal = Depends(get_admin_or_bot),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    """Audit route: 403 for bot, else check audit:read permission."""
    if isinstance(principal, BotPrincipal | WebAppPrincipal):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    result = await db.execute(select(Role).where(Role.id == principal.role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No role")
    perms: list = role.permissions if isinstance(role.permissions, list) else []
    if "*" not in perms and "audit:read" not in perms:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    request.state.audit_admin_id = principal.id
    return principal

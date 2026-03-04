"""Auth: login, refresh, logout (refresh blocklist), current user dependency."""

import hashlib
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.core.config import settings
from app.core.database import get_db
from app.core.logging_config import extra_for_event, get_security_logger
from app.core.metrics import auth_failures_total
from app.core.rate_limit import rate_limit_login_failure
from app.core.redis_client import get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models import AdminUser
from app.schemas.auth import LoginRequest, LogoutRequest, TokenResponse, TotpSetupResponse

_log = logging.getLogger(__name__)
_security_log = get_security_logger()
REFRESH_BLOCKLIST_PREFIX = "refresh_blocklist:"

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


async def get_admin_by_email(session: AsyncSession, email: str) -> AdminUser | None:
    """Look up admin by email (case-insensitive)."""
    norm = (email or "").strip().lower()
    if not norm:
        return None
    result = await session.execute(select(AdminUser).where(func.lower(AdminUser.email) == norm))
    return result.scalar_one_or_none()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email is required",
        )
    user = await get_admin_by_email(db, email)
    if not user or not verify_password(body.password, user.password_hash):
        auth_failures_total.labels(reason="invalid_credentials").inc()
        ip = request.client.host if request.client else None
        _security_log.info(
            "auth login failed",
            extra=extra_for_event(
                event="auth.login.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
                ip=ip,
            ),
        )
        await rate_limit_login_failure(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    totp_secret = getattr(user, "totp_secret", None)
    if totp_secret:
        import pyotp

        if not body.totp_code or not pyotp.TOTP(totp_secret).verify(body.totp_code, valid_window=1):
            auth_failures_total.labels(reason="invalid_totp").inc()
            ip = request.client.host if request.client else None
            _security_log.info(
                "auth login failed",
                extra=extra_for_event(
                    event="auth.login.failed",
                    error_code="E_AUTH_INVALID",
                    error_kind="auth",
                    error_severity="warn",
                    error_retryable=False,
                    entity_id=str(user.id),
                    ip=ip,
                ),
            )
            await rate_limit_login_failure(request)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing TOTP code",
            )
    _log.info(
        "auth login success",
        extra=extra_for_event(
            event="auth.login.success",
            entity_id=str(user.id),
        ),
    )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


def _refresh_blocklist_key(token: str) -> str:
    return REFRESH_BLOCKLIST_PREFIX + hashlib.sha256(token.encode()).hexdigest()


@router.post("/logout")
async def logout(body: LogoutRequest):
    """Revoke refresh token: add to blocklist so it cannot be used for /refresh."""
    payload = decode_token(body.refresh_token)
    if payload and payload.get("type") == "refresh" and "exp" in payload:
        ttl = max(1, int(payload["exp"]) - __import__("time").time())
        try:
            r = get_redis()
            await r.setex(_refresh_blocklist_key(body.refresh_token), ttl, "1")
        except Exception as e:
            _log.warning("Logout blocklist set failed: %s", type(e).__name__)
    return {"status": "ok"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    if not credentials or credentials.scheme.lower() != "bearer":
        auth_failures_total.labels(reason="missing_refresh_token").inc()
        _log.info(
            "auth refresh failed",
            extra=extra_for_event(
                event="auth.refresh.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token"
        )
    token = credentials.credentials
    try:
        r = get_redis()
        if await r.get(_refresh_blocklist_key(token)):
            auth_failures_total.labels(reason="token_revoked").inc()
            _log.info(
                "auth refresh failed",
                extra=extra_for_event(
                    event="auth.refresh.failed",
                    error_code="E_AUTH_EXPIRED",
                    error_kind="auth",
                    error_severity="warn",
                    error_retryable=False,
                ),
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")
    except Exception:
        logger = logging.getLogger(__name__)
        if settings.refresh_blocklist_fail_closed:
            logger.warning(
                "Refresh token blocklist check failed; failing closed because REFRESH_BLOCKLIST_FAIL_CLOSED=1",
                exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication temporarily unavailable",
            )
        logger.debug(
            "Refresh token blocklist check failed (fail-open because REFRESH_BLOCKLIST_FAIL_CLOSED=0)",
            exc_info=True,
        )
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        auth_failures_total.labels(reason="invalid_refresh_token").inc()
        _log.info(
            "auth refresh failed",
            extra=extra_for_event(
                event="auth.refresh.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    sub = payload.get("sub")
    if not sub:
        auth_failures_total.labels(reason="invalid_refresh_token").inc()
        _log.info(
            "auth refresh failed",
            extra=extra_for_event(
                event="auth.refresh.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    result = await db.execute(select(AdminUser).where(AdminUser.id == sub))
    user = result.scalar_one_or_none()
    if not user:
        auth_failures_total.labels(reason="user_not_found").inc()
        _log.info(
            "auth refresh failed",
            extra=extra_for_event(
                event="auth.refresh.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
                entity_id=str(sub),
            ),
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # Rotation: invalidate used refresh token so it cannot be reused (replay protection)
    ttl = max(1, int(payload.get("exp", 0)) - int(time.time()))
    try:
        r = get_redis()
        await r.setex(_refresh_blocklist_key(token), ttl, "1")
    except Exception as e:
        _log.warning("Refresh token rotation blocklist set failed: %s", type(e).__name__)

    _log.info(
        "auth refresh success",
        extra=extra_for_event(event="auth.refresh.success", entity_id=str(user.id)),
    )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def get_current_admin_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AdminUser | None:
    """Return admin if valid Bearer token; else None (no 401). Used with bot API key fallback."""
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    result = await db.execute(select(AdminUser).where(AdminUser.id == sub))
    return result.scalar_one_or_none()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    user = await get_current_admin_optional(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/totp/setup", response_model=TotpSetupResponse)
async def totp_setup(
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_admin),
):
    """Enable 2FA: generate TOTP secret, store on user, return provisioning_uri for QR."""
    import pyotp

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    user.totp_secret = secret
    await db.commit()
    await db.refresh(user)
    return TotpSetupResponse(
        secret=secret,
        provisioning_uri=totp.provisioning_uri(name=user.email, issuer_name="VPN Suite"),
    )


@router.post("/totp/disable")
async def totp_disable(
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_admin),
):
    """Disable 2FA: clear TOTP secret."""
    user.totp_secret = None
    await db.commit()
    return {"status": "ok"}

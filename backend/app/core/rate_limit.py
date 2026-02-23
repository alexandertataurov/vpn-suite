"""Rate limit: login by IP; global API by IP. Fail-open if Redis down."""

import logging

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.error_responses import error_body
from app.core.logging_config import extra_for_event, get_security_logger, request_id_ctx
from app.core.redis_client import get_redis

_log = logging.getLogger(__name__)
_security_log = get_security_logger()

KEY_PREFIX_LOGIN = "ratelimit:login:"  # failure attempts only
KEY_PREFIX_API = "ratelimit:api:"
MAX_LOGIN_ATTEMPTS = settings.login_rate_limit
LOGIN_WINDOW = settings.login_rate_window_seconds
API_LIMIT = settings.api_rate_limit_per_minute
API_WINDOW = settings.api_rate_limit_window_seconds


class GlobalAPIRateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limit for /api/v1 (and /api/*). Skip if api_rate_limit_per_minute is 0. Fail-open if Redis down."""

    async def dispatch(self, request: StarletteRequest, call_next):
        if API_LIMIT <= 0 or not request.url.path.startswith("/api/"):
            return await call_next(request)
        ip = request.client.host if request.client else "unknown"
        key = f"{KEY_PREFIX_API}{ip}"
        try:
            r = get_redis()
            n = await r.incr(key)
            if n == 1:
                await r.expire(key, API_WINDOW)
            if n > API_LIMIT:
                rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
                client_ip = request.client.host if request.client else None
                _security_log.info(
                    "rate limit hit",
                    extra=extra_for_event(
                        event="rate_limit.hit",
                        error_code="E_RATE_LIMIT",
                        error_kind="rate_limit",
                        error_severity="warn",
                        error_retryable=True,
                        ip=client_ip,
                    ),
                )
                body = error_body(
                    code="RATE_LIMIT_EXCEEDED",
                    message="Too many requests. Try again later.",
                    status_code=429,
                    request_id=rid,
                )
                return JSONResponse(status_code=429, content=body)
        except Exception as e:
            _log.warning("API rate limit skipped (Redis unavailable): %s", type(e).__name__)
        return await call_next(request)


async def rate_limit_login_failure(request: Request) -> None:
    """Raise 429 if *failed* login attempts from IP exceed limit. Fail-open if Redis unavailable.

    Important: do not count successful logins, otherwise admins can get locked out during normal use.
    """
    try:
        r = get_redis()
        ip = request.client.host if request.client else "unknown"
        key = f"{KEY_PREFIX_LOGIN}{ip}"
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, LOGIN_WINDOW)
        if n > MAX_LOGIN_ATTEMPTS:
            client_ip = request.client.host if request.client else None
            _security_log.info(
                "rate limit hit (login)",
                extra=extra_for_event(
                    event="rate_limit.hit",
                    error_code="E_RATE_LIMIT",
                    error_kind="rate_limit",
                    error_severity="warn",
                    error_retryable=True,
                    ip=client_ip,
                ),
            )
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Try again later.",
            )
    except HTTPException:
        raise
    except Exception as e:
        _log.warning("Rate limit check skipped (Redis unavailable): %s", type(e).__name__)
        if getattr(settings, "login_rate_limit_fail_closed", False):
            raise HTTPException(
                status_code=503,
                detail="Service temporarily unavailable. Try again later.",
            )


KEY_PREFIX_ADMIN_ISSUE = "ratelimit:admin_issue:"
KEY_PREFIX_CONFIG_DOWNLOAD = "ratelimit:config_dl:"
KEY_PREFIX_SERVER_ACTIONS = "ratelimit:server_actions:"
KEY_PREFIX_OUTLINE_KEYS = "ratelimit:outline_keys:"
ADMIN_ISSUE_LIMIT = 30
ADMIN_ISSUE_WINDOW = 60
CONFIG_DOWNLOAD_IP_LIMIT = 60
CONFIG_DOWNLOAD_TOKEN_LIMIT = 5
CONFIG_DOWNLOAD_WINDOW = 60
SERVER_ACTIONS_PER_USER_PER_SERVER_LIMIT = 10
SERVER_ACTIONS_WINDOW = 60
OUTLINE_KEYS_MUTATE_LIMIT = 10
OUTLINE_KEYS_MUTATE_WINDOW = 60


async def rate_limit_admin_issue(request: Request) -> None:
    """Dependency: limit POST /servers/:id/peers per IP. Fail-open if Redis down."""
    try:
        r = get_redis()
        ip = request.client.host if request.client else "unknown"
        key = f"{KEY_PREFIX_ADMIN_ISSUE}{ip}"
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, ADMIN_ISSUE_WINDOW)
        if n > ADMIN_ISSUE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many peer issuance requests. Try again later.",
            )
    except HTTPException:
        raise
    except Exception as e:
        _log.warning("Admin issue rate limit skipped: %s", type(e).__name__)


async def rate_limit_server_actions(request: Request, server_id: str, admin_id: str) -> None:
    """Dependency: limit POST /servers/:id/actions per (user, server). Fail-open if Redis down."""
    try:
        r = get_redis()
        key = f"{KEY_PREFIX_SERVER_ACTIONS}{admin_id}:{server_id}"
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, SERVER_ACTIONS_WINDOW)
        if n > SERVER_ACTIONS_PER_USER_PER_SERVER_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many actions for this server. Try again later.",
            )
    except HTTPException:
        raise
    except Exception as e:
        _log.warning("Server actions rate limit skipped: %s", type(e).__name__)


async def rate_limit_config_download(request: Request, token: str) -> None:
    """Check rate limit for config download/qr: per IP and per token. Call from route."""
    try:
        r = get_redis()
        ip = request.client.host if request.client else "unknown"
        key_ip = f"{KEY_PREFIX_CONFIG_DOWNLOAD}ip:{ip}"
        key_tok = f"{KEY_PREFIX_CONFIG_DOWNLOAD}tok:{token[:32]}"
        n_ip = await r.incr(key_ip)
        if n_ip == 1:
            await r.expire(key_ip, CONFIG_DOWNLOAD_WINDOW)
        n_tok = await r.incr(key_tok)
        if n_tok == 1:
            await r.expire(key_tok, CONFIG_DOWNLOAD_WINDOW)
        if n_ip > CONFIG_DOWNLOAD_IP_LIMIT or n_tok > CONFIG_DOWNLOAD_TOKEN_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many download requests. Try again later.",
            )
    except HTTPException:
        raise
    except Exception:
        logging.getLogger(__name__).debug("Config download rate limit check failed", exc_info=True)


async def rate_limit_outline_keys_mutate(request: Request, admin_id: str) -> None:
    """Limit POST/DELETE outline keys per admin. Fail-open if Redis down."""
    try:
        r = get_redis()
        key = f"{KEY_PREFIX_OUTLINE_KEYS}{admin_id}"
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, OUTLINE_KEYS_MUTATE_WINDOW)
        if n > OUTLINE_KEYS_MUTATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many Outline key create/revoke requests. Try again later.",
            )
    except HTTPException:
        raise
    except Exception as e:
        _log.warning("Outline keys rate limit skipped: %s", type(e).__name__)

"""Middleware: set request_id in context and state, log request/response as JSON (no secrets)."""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings
from app.core.logging_config import (
    correlation_id_ctx,
    extra_for_event,
    request_id_ctx,
    trace_id_ctx,
)
from app.core.prometheus_middleware import path_template

_log = logging.getLogger(__name__)


def _client_ip(request: Request) -> str | None:
    """Extract client IP from X-Forwarded-For, X-Real-IP, or direct client."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return None


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Assign request_id, log api.request.start/end with event taxonomy."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        correlation_id = request.headers.get("X-Correlation-ID") or request_id
        token = request_id_ctx.set(request_id)
        trace_token = trace_id_ctx.set(correlation_id)
        correlation_token = correlation_id_ctx.set(correlation_id)
        request.state.request_id = request_id
        request.state.correlation_id = correlation_id
        route = path_template(request.url.path)
        client_ip = _client_ip(request)
        _log.info(
            "request started",
            extra=extra_for_event(
                event="api.request.start",
                route=route,
                method=request.method,
                ip=client_ip,
            ),
        )
        start = time.perf_counter()
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Correlation-ID"] = correlation_id
            duration_ms = (time.perf_counter() - start) * 1000
            admin_id = getattr(request.state, "audit_admin_id", None)
            extra_dict = extra_for_event(
                event="api.request.end",
                route=route,
                method=request.method,
                status_code=response.status_code,
                duration_ms=duration_ms,
                actor_id=str(admin_id)[:32] if admin_id else None,
                ip=client_ip,
            )
            _log.info("request finished", extra=extra_dict)
            threshold = getattr(settings, "slow_request_threshold_ms", 0) or 0
            if threshold > 0 and duration_ms > threshold:
                _log.warning(
                    "slow request",
                    extra=extra_for_event(
                        event="api.request.slow",
                        route=route,
                        method=request.method,
                        status_code=response.status_code,
                        duration_ms=duration_ms,
                        ip=client_ip,
                    ),
                )
            return response
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            _log.warning(
                "request finished with unhandled exception",
                extra=extra_for_event(
                    event="api.request.end",
                    route=route,
                    method=request.method,
                    status_code=500,
                    duration_ms=duration_ms,
                    ip=client_ip,
                    error_code="E_INTERNAL",
                    error_kind="internal",
                    error_severity="error",
                    error_retryable=False,
                ),
            )
            raise
        finally:
            request_id_ctx.reset(token)
            trace_id_ctx.reset(trace_token)
            correlation_id_ctx.reset(correlation_token)

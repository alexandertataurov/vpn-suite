"""Unified API error shape: { success, data, error: { code, message }, meta }."""

from datetime import datetime, timezone

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


def error_body(
    code: str,
    message: str,
    status_code: int = 500,
    details: dict | None = None,
    request_id: str | None = None,
    correlation_id: str | None = None,
) -> dict:
    meta: dict = {"timestamp": datetime.now(timezone.utc).isoformat(), "code": status_code}
    if request_id:
        meta["request_id"] = request_id
    if correlation_id:
        meta["correlation_id"] = correlation_id
    return {
        "success": False,
        "data": None,
        "error": {"code": code, "message": message, **({"details": details} if details else {})},
        "meta": meta,
    }


def not_found_404(resource: str, identifier: str | None = None) -> HTTPException:
    """Raise HTTP 404 with unified detail shape (code NOT_FOUND, message)."""
    message = f"{resource} not found"
    if identifier is not None:
        message = f"{resource} {identifier!r} not found"
    return HTTPException(
        status_code=404,
        detail={"code": "NOT_FOUND", "message": message},
    )


_STATUS_TO_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
}


def http_exception_to_error_response(request: Request, exc: Exception) -> JSONResponse:
    """Convert HTTPException to unified error shape. detail may be str or dict with code/message."""
    if not isinstance(exc, HTTPException):
        raise exc
    details = None
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        code = exc.detail["code"]
        message = exc.detail.get("message", str(exc.detail))
        details = exc.detail.get("details")
    else:
        code = _STATUS_TO_CODE.get(exc.status_code, "ERROR")
        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    from app.core.metrics import http_errors_total
    from app.core.prometheus_middleware import path_template

    http_errors_total.labels(path_template=path_template(request.url.path), error_type=code).inc()
    rid = getattr(request.state, "request_id", None)
    cid = getattr(request.state, "correlation_id", None)
    body = error_body(
        code=code,
        message=message,
        status_code=exc.status_code,
        details=details if isinstance(details, dict) else None,
        request_id=rid,
        correlation_id=cid,
    )
    return JSONResponse(status_code=exc.status_code, content=body)

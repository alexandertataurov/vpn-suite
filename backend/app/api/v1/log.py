"""Frontend observability ingestion: error events + batched telemetry events."""

from __future__ import annotations

import logging
import math
import random
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging_config import extra_for_event, request_id_ctx
from app.core.metrics import (
    frontend_errors_total,
    frontend_telemetry_batches_total,
    frontend_telemetry_events_total,
    frontend_web_vital_ms,
    frontend_web_vital_score,
)
from app.schemas.frontend_telemetry import (
    FrontendTelemetryBatchIn,
    FrontendTelemetryBatchOut,
)

_log = logging.getLogger(__name__)

router = APIRouter(prefix="/log", tags=["log"])

_SENSITIVE_KEY_MARKERS = (
    "password",
    "token",
    "secret",
    "authorization",
    "cookie",
    "email",
    "phone",
    "ip",
    "private_key",
    "preshared",
)
_ALWAYS_KEEP_EVENTS = {"frontend_error", "login_failure"}


class FrontendErrorIn(BaseModel):
    message: str
    stack: str | None = None
    component_stack: str | None = Field(default=None, alias="componentStack")
    route: str | None = None
    build_hash: str | None = Field(default=None, alias="buildHash")
    user_agent: str | None = Field(default=None, alias="userAgent")

    model_config = {"populate_by_name": True}


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(marker in lowered for marker in _SENSITIVE_KEY_MARKERS)


def _redact_value(value: Any, *, depth: int = 0) -> Any:
    if depth > 5:
        return "[truncated]"
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for k, v in value.items():
            key = str(k)
            if _is_sensitive_key(key):
                out[key] = "[redacted]"
            else:
                out[key] = _redact_value(v, depth=depth + 1)
        return out
    if isinstance(value, list):
        return [_redact_value(v, depth=depth + 1) for v in value[:50]]
    if isinstance(value, str):
        return value[:500]
    return value


def _should_accept_event(event_name: str) -> bool:
    if event_name in _ALWAYS_KEEP_EVENTS:
        return True
    rate = settings.admin_telemetry_sample_rate
    if rate >= 1.0:
        return True
    if rate <= 0.0:
        return False
    return random.random() <= rate


def _observe_web_vital(app: str, payload: dict[str, Any], context: dict[str, Any] | None) -> None:
    name = str(payload.get("name") or "")[:32]
    if not name:
        return
    unit = str(payload.get("unit") or "ms").lower()
    try:
        value = float(payload.get("value") or 0)
    except (TypeError, ValueError):
        return
    if not math.isfinite(value):
        return
    if value < 0:
        value = 0
    route = payload.get("route")
    if not route and isinstance(context, dict):
        route = context.get("route")
    route_label = str(route)[:200] if route else "unknown"
    if unit == "score":
        frontend_web_vital_score.labels(app=app, name=name, route=route_label).observe(value)
    else:
        frontend_web_vital_ms.labels(app=app, name=name, route=route_label).observe(value)


@router.post("/frontend-error", status_code=204)
async def log_frontend_error(request: Request, body: FrontendErrorIn):
    """Accept frontend error reports; log at ERROR."""
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    route = (body.route or "")[:200] or None
    app_label = "unknown"
    if route:
        if route.startswith("/admin"):
            app_label = "admin"
        elif route.startswith("/webapp"):
            app_label = "miniapp"
    frontend_errors_total.labels(app=app_label).inc()
    stack = (
        (body.stack[:1000] + "...") if body.stack and len(body.stack) > 1000 else (body.stack or "")
    )
    component_stack = (
        (body.component_stack[:500] + "...")
        if body.component_stack and len(body.component_stack) > 500
        else (body.component_stack or "")
    )
    extra = extra_for_event(
        event="frontend.error",
        route=route,
        entity_id=(body.build_hash or "")[:64] or None,
        error_code="E_FRONTEND_ERROR",
        error_kind="frontend",
        error_severity="error",
        error_retryable=False,
    )
    _log.error(
        "frontend_error request_id=%s route=%s build_hash=%s user_agent=%s message=%s stack=%s component_stack=%s",
        rid,
        route or "",
        (body.build_hash or "")[:64],
        (body.user_agent or "")[:256],
        (body.message or "")[:500],
        stack,
        component_stack,
        extra=extra,
    )
    return None


@router.post("/events", response_model=FrontendTelemetryBatchOut)
async def ingest_frontend_events(
    request: Request,
    body: FrontendTelemetryBatchIn,
):
    """Accept batched frontend telemetry events with validation, sampling, and redaction.

    This endpoint intentionally allows unauthenticated writes so login-failure telemetry
    (emitted before a JWT exists) is still captured. Payload shape is constrained by schema,
    sensitive keys are redacted, and global API rate limiting still applies.
    """
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    if body.schema_version != "1.0":
        frontend_telemetry_batches_total.labels(result="dropped").inc()
        for event in body.events:
            frontend_telemetry_events_total.labels(event=event.event, result="dropped").inc()
        return FrontendTelemetryBatchOut(
            accepted=0,
            dropped=len(body.events),
            request_id=rid,
        )

    if not settings.admin_telemetry_events_enabled:
        frontend_telemetry_batches_total.labels(result="disabled").inc()
        for event in body.events:
            frontend_telemetry_events_total.labels(event=event.event, result="dropped").inc()
        return FrontendTelemetryBatchOut(
            accepted=0,
            dropped=len(body.events),
            request_id=rid,
        )

    accepted = 0
    dropped = 0
    for event in body.events:
        if not _should_accept_event(event.event):
            dropped += 1
            frontend_telemetry_events_total.labels(event=event.event, result="dropped").inc()
            continue

        redacted_payload = _redact_value(event.payload)
        redacted_context = _redact_value(event.context)
        frontend_telemetry_events_total.labels(event=event.event, result="accepted").inc()
        accepted += 1
        if event.event == "web_vital":
            _observe_web_vital(
                "admin",
                event.payload if isinstance(event.payload, dict) else {},
                event.context if isinstance(event.context, dict) else None,
            )
        _log.info(
            "frontend_event event=%s ts=%s payload=%s context=%s",
            event.event,
            event.ts.isoformat(),
            redacted_payload,
            redacted_context,
            extra=extra_for_event(
                event="frontend.event",
                route=(str(redacted_context.get("route", ""))[:200] or None)
                if isinstance(redacted_context, dict)
                else None,
                entity_id=event.event,
            ),
        )

    frontend_telemetry_batches_total.labels(result="accepted" if accepted else "dropped").inc()
    return FrontendTelemetryBatchOut(accepted=accepted, dropped=dropped, request_id=rid)

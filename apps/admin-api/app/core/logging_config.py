"""Structured logging: JSON with request_id, trace_id, event, level, message. No secrets in logs."""

import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
trace_id_ctx: ContextVar[str | None] = ContextVar("trace_id", default=None)
span_id_ctx: ContextVar[str | None] = ContextVar("span_id", default=None)
correlation_id_ctx: ContextVar[str | None] = ContextVar("correlation_id", default=None)

# Optional static context set at startup (service, env, version)
_log_context: dict[str, str] = {}

# LogRecord extra keys for structured fields (event, route, method, status_code, duration_ms, etc.)
_EXTRA_KEYS = frozenset(
    {
        "event",
        "route",
        "method",
        "status_code",
        "duration_ms",
        "result_count",
        "query_params",
        "actor_id",
        "entity_id",
        "ip",
        "profile_mode",
        "server_id",
        "user_id",
        "validation_errors",
        "emitted_bytes",
        "error_kind",
        "error_code",
        "error_severity",
        "error_retryable",
    }
)


def set_log_context(service: str = "", env: str = "", version: str = "") -> None:
    """Set static fields included in every JSON log line. Call after configure_logging."""
    global _log_context
    _log_context["service"] = service
    _log_context["env"] = env
    _log_context["version"] = version


def _get_level(record: logging.LogRecord) -> str:
    return record.levelname.lower() if record.levelname else "info"


class JsonFormatter(logging.Formatter):
    """Format log records as one-line JSON. Injects request_id, trace_id, static context, and extras."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "level": _get_level(record),
            "message": record.getMessage(),
            "logger": record.name,
        }
        for k, v in _log_context.items():
            if v:
                payload[k] = v
        rid = request_id_ctx.get()
        tid = trace_id_ctx.get()
        sid = span_id_ctx.get()
        # Fallback: read trace_id/span_id from OTel span when in traced request
        if not tid or not sid:
            try:
                from opentelemetry import trace

                span = trace.get_current_span()
                if span and span.is_recording():
                    ctx = span.get_span_context()
                    if ctx.trace_id and not tid:
                        tid = format(ctx.trace_id, "032x")
                    if ctx.span_id and not sid:
                        sid = format(ctx.span_id, "016x")
            except Exception:
                pass
        cid = correlation_id_ctx.get() or rid or tid
        if rid:
            payload["request_id"] = rid
        if tid:
            payload["trace_id"] = tid
        if sid:
            payload["span_id"] = sid
        if cid:
            payload["correlation_id"] = cid
        for key in _EXTRA_KEYS:
            if hasattr(record, key):
                val = getattr(record, key)
                if val is not None:
                    out_key = key if key != "error_kind" else "error.kind"
                    if out_key == "error.kind":
                        payload["error"] = payload.get("error") or {}
                        payload["error"]["kind"] = val
                    elif key == "error_code":
                        payload["error"] = payload.get("error") or {}
                        payload["error"]["code"] = val
                    elif key == "error_severity":
                        payload["error"] = payload.get("error") or {}
                        payload["error"]["severity"] = val
                    elif key == "error_retryable":
                        payload["error"] = payload.get("error") or {}
                        payload["error"]["retryable"] = val
                    else:
                        payload[out_key] = val
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def extra_for_event(
    event: str,
    route: str | None = None,
    method: str | None = None,
    status_code: int | None = None,
    duration_ms: float | None = None,
    actor_id: str | None = None,
    entity_id: str | None = None,
    ip: str | None = None,
    result_count: int | None = None,
    query_params: dict[str, Any] | None = None,
    error_code: str | None = None,
    error_kind: str | None = None,
    error_severity: str | None = None,
    error_retryable: bool | None = None,
) -> dict[str, Any]:
    """Build extra dict for logger.info(..., extra=extra_for_event(...))."""
    out: dict[str, Any] = {"event": event}
    if route is not None:
        out["route"] = route
    if ip is not None:
        out["ip"] = ip
    if method is not None:
        out["method"] = method
    if status_code is not None:
        out["status_code"] = status_code
    if duration_ms is not None:
        out["duration_ms"] = round(duration_ms, 2)
    if result_count is not None:
        out["result_count"] = result_count
    if query_params is not None:
        out["query_params"] = query_params
    if actor_id is not None:
        out["actor_id"] = actor_id
    if entity_id is not None:
        out["entity_id"] = entity_id
    if error_code is not None:
        out["error_code"] = error_code
    if error_kind is not None:
        out["error_kind"] = error_kind
    if error_severity is not None:
        out["error_severity"] = error_severity
    if error_retryable is not None:
        out["error_retryable"] = error_retryable
    return out


def _resolve_log_level(env: str, log_level: str) -> int:
    if log_level:
        return getattr(logging, log_level.upper(), logging.INFO)
    return logging.DEBUG if env and env.lower() == "development" else logging.INFO


def get_security_logger(name: str = "app.security") -> logging.Logger:
    """Logger for security-sensitive events (auth failures, rate limit). Same JSON handler, filterable by logger name."""
    return logging.getLogger(name)


def configure_logging(
    log_json: bool = True,
    log_level: str = "",
    env: str = "development",
) -> None:
    """Configure root logger: JSON formatter when log_json, level from LOG_LEVEL or env."""
    root = logging.getLogger()
    if not root.handlers:
        root.addHandler(logging.StreamHandler())
    if log_json:
        root.handlers[0].setFormatter(JsonFormatter())
    root.setLevel(_resolve_log_level(env, log_level))

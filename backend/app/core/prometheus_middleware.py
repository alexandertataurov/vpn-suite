"""Middleware: record Prometheus + OTLP metrics for HTTP requests (dual-emit)."""

import time

from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.otel_metrics import record_http_request

REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path_template", "status_class"],
)
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path_template"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)


def path_template(path: str) -> str:
    """Normalize path to template (e.g. /api/v1/users/123 -> /api/v1/users/{id})."""
    parts = path.strip("/").split("/")
    if not parts:
        return "/"
    # Heuristic: digit or 32-char hex -> {id}
    out = []
    for p in parts:
        if p.isdigit() or (len(p) == 32 and all(c in "0123456789abcdef" for c in p.lower())):
            out.append("{id}")
        else:
            out.append(p)
    return "/" + "/".join(out)


def _status_class(status: int) -> str:
    if status < 300:
        return "2xx"
    if status < 400:
        return "3xx"
    if status < 500:
        return "4xx"
    return "5xx"


def _get_trace_ids():
    """Return (trace_id, span_id) from current OTel span if available."""
    try:
        from opentelemetry import trace

        span = trace.get_current_span()
        if span and span.is_recording():
            ctx = span.get_span_context()
            tid = format(ctx.trace_id, "032x") if ctx.trace_id else None
            sid = format(ctx.span_id, "016x") if ctx.span_id else None
            return tid, sid
    except Exception:
        pass
    return None, None


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Record request count and duration for Prometheus + OTLP. Records 5xx on unhandled exception."""

    async def dispatch(self, request: Request, call_next):
        path_tpl = path_template(request.url.path)
        start = time.perf_counter()
        try:
            response = await call_next(request)
            duration = time.perf_counter() - start
            status_cl = _status_class(response.status_code)
            REQUESTS_TOTAL.labels(
                method=request.method, path_template=path_tpl, status_class=status_cl
            ).inc()
            REQUEST_DURATION.labels(method=request.method, path_template=path_tpl).observe(duration)
            trace_id, span_id = _get_trace_ids()
            record_http_request(request.method, path_tpl, status_cl, duration, trace_id, span_id)
            return response
        except Exception:
            duration = time.perf_counter() - start
            REQUESTS_TOTAL.labels(
                method=request.method, path_template=path_tpl, status_class="5xx"
            ).inc()
            REQUEST_DURATION.labels(method=request.method, path_template=path_tpl).observe(duration)
            trace_id, span_id = _get_trace_ids()
            record_http_request(request.method, path_tpl, "5xx", duration, trace_id, span_id)
            raise

"""Middleware: record per-request DB query count and time to Prometheus."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.db_metrics import get_and_reset, set_request_context
from app.core.metrics import db_queries_per_request, db_time_per_request_seconds
from app.core.prometheus_middleware import path_template


class DbMetricsMiddleware(BaseHTTPMiddleware):
    """Set request context for DB metrics at start; at end record count and time to Prometheus."""

    async def dispatch(self, request: Request, call_next):
        set_request_context()
        response = await call_next(request)
        count, total_sec = get_and_reset()
        if count > 0:
            path_tpl = path_template(request.url.path)
            db_queries_per_request.labels(
                method=request.method, path_template=path_tpl
            ).observe(count)
            db_time_per_request_seconds.labels(
                method=request.method, path_template=path_tpl
            ).observe(total_sec)
        return response

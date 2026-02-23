"""Prometheus metrics for Telegram VPN Bot (panel request count by status)."""

from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest

bot_requests_total = Counter(
    "bot_requests_total",
    "Total HTTP requests from bot to admin-api",
    ["status_class"],  # 2xx, 4xx, 5xx, error (timeout/connect)
)


def _status_class(status_code: int | None) -> str:
    if status_code is None:
        return "error"
    if status_code < 300:
        return "2xx"
    if status_code < 400:
        return "3xx"
    if status_code < 500:
        return "4xx"
    return "5xx"


def record_request(status_code: int | None) -> None:
    bot_requests_total.labels(status_class=_status_class(status_code)).inc()


def metrics_output() -> bytes:
    return generate_latest()


def metrics_content_type() -> str:
    return CONTENT_TYPE_LATEST

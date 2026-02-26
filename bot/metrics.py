"""Prometheus metrics for Telegram VPN Bot (panel request count by status)."""

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

bot_requests_total = Counter(
    "bot_requests_total",
    "Total HTTP requests from bot to admin-api",
    ["status_class"],  # 2xx, 4xx, 5xx, error (timeout/connect)
)

bot_request_latency_seconds = Histogram(
    "bot_request_latency_seconds",
    "Latency of bot HTTP calls to admin-api (aggregated)",
    ["status_class"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0),
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


def record_request(status_code: int | None, latency_seconds: float | None = None) -> None:
    status_class = _status_class(status_code)
    bot_requests_total.labels(status_class=status_class).inc()
    if latency_seconds is not None:
        bot_request_latency_seconds.labels(status_class=status_class).observe(latency_seconds)


def metrics_output() -> bytes:
    return generate_latest()


def metrics_content_type() -> str:
    return CONTENT_TYPE_LATEST

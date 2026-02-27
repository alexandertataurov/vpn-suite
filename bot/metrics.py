"""Prometheus metrics for Telegram VPN Bot (panel request count by status)."""

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

bot_commands_total = Counter(
    "bot_commands_total",
    "Total bot commands by command name",
    ["command"],
)
bot_trial_activations_total = Counter(
    "bot_trial_activations_total",
    "Trial activations",
)
bot_payment_start_total = Counter(
    "bot_payment_start_total",
    "Payment flow started",
)
bot_payment_success_total = Counter(
    "bot_payment_success_total",
    "Payment completed successfully",
)
bot_payment_confirm_total = Counter(
    "bot_payment_confirm_total",
    "Backend payment confirm (sync) by result",
    ["status"],  # ok, fail
)
bot_events_total = Counter(
    "bot_events_total",
    "Funnel/analytics events sent to backend",
    ["event_type"],
)
bot_retries_total = Counter(
    "bot_retries_total",
    "HTTP retries to admin-api",
)

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


def record_command(command: str) -> None:
    """Increment command counter."""
    bot_commands_total.labels(command=command).inc()


def record_trial_activation() -> None:
    """Increment trial activation counter."""
    bot_trial_activations_total.inc()


def record_payment_start() -> None:
    """Increment payment start counter."""
    bot_payment_start_total.inc()


def record_payment_success() -> None:
    """Increment payment success counter."""
    bot_payment_success_total.inc()


def record_payment_confirm(success: bool) -> None:
    """Increment payment confirm (backend sync) counter."""
    bot_payment_confirm_total.labels(status="ok" if success else "fail").inc()


def record_event_sent(event_type: str) -> None:
    """Increment events sent to backend (funnel/analytics)."""
    bot_events_total.labels(event_type=event_type).inc()


def record_retry() -> None:
    """Increment retry counter (admin-api call retried)."""
    bot_retries_total.inc()


def record_request(status_code: int | None, latency_seconds: float | None = None) -> None:
    status_class = _status_class(status_code)
    bot_requests_total.labels(status_class=status_class).inc()
    if latency_seconds is not None:
        bot_request_latency_seconds.labels(status_class=status_class).observe(latency_seconds)


def metrics_output() -> bytes:
    return generate_latest()


def metrics_content_type() -> str:
    return CONTENT_TYPE_LATEST

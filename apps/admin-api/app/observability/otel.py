"""Unified OTel init: traces + metrics from env or settings."""

from __future__ import annotations

import os

from app.core.config import settings
from app.core.otel_metrics import setup_otel_metrics
from app.core.otel_tracing import setup_otel_tracing


def init_otel(app, *, service_version: str | None = None) -> None:
    """Configure OTel traces and metrics. Uses OTEL_EXPORTER_OTLP_ENDPOINT or settings."""
    endpoint = os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        settings.otel_traces_endpoint or "",
    )
    service_name = os.environ.get("SERVICE_NAME", "admin-api")
    service_version = os.environ.get("SERVICE_VERSION") or service_version or "0.0.0"
    environment = os.environ.get("DEPLOYMENT_ENV", settings.environment)

    setup_otel_tracing(
        app,
        endpoint,
        service_version=service_version,
        environment=environment,
    )
    setup_otel_metrics(
        endpoint,
        service_name=service_name,
        service_version=service_version,
        environment=environment,
        export_interval_ms=100,
    )

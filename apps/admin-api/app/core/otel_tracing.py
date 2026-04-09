"""OpenTelemetry tracing setup for admin-api. OTLP export to otel-collector → Tempo."""

from __future__ import annotations

import logging
import os
import socket

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

_log = logging.getLogger(__name__)


def setup_otel_tracing(
    app,
    endpoint: str,
    service_version: str | None = None,
    environment: str | None = None,
) -> None:
    """Configure OTLP trace export and instrument FastAPI. Call once after app creation."""
    if not endpoint or not endpoint.strip():
        return
    endpoint = endpoint.strip()
    # gRPC endpoint: host:port or http://host:port (SDK accepts both)
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        endpoint = endpoint.replace("http://", "").replace("https://", "").rstrip("/")
    # Avoid noisy exporter errors when collector isn't present.
    # If the endpoint is unreachable at startup, disable tracing.
    host = endpoint
    port = 4317
    if ":" in endpoint:
        host_part, port_part = endpoint.rsplit(":", 1)
        host = host_part or host
        try:
            port = int(port_part)
        except Exception:
            port = 4317
    try:
        sock = socket.create_connection((host, port), timeout=0.4)
        sock.close()
    except Exception as e:
        _log.warning("OTEL collector unreachable (tracing disabled): %s", e)
        return
    try:
        resource = Resource.create(
            {
                "service.name": "admin-api",
                "service.version": service_version or os.environ.get("API_VERSION", "0.0.0"),
                "deployment.environment": environment or os.environ.get("ENVIRONMENT", "default"),
                "host.id": os.environ.get("HOSTNAME", "unknown"),
            }
        )
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(
            BatchSpanProcessor(
                exporter,
                max_export_batch_size=512,
                schedule_delay_millis=100,
            )
        )
        from opentelemetry import trace

        trace.set_tracer_provider(provider)
        FastAPIInstrumentor.instrument_app(app)
        _log.info("OTEL tracing enabled: endpoint=%s", endpoint)
    except Exception as e:
        _log.warning("OTEL tracing setup failed (tracing disabled): %s", e)

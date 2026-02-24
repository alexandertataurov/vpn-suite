"""OpenTelemetry tracing setup for admin-api. OTLP export to otel-collector → Tempo."""

from __future__ import annotations

import logging

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

_log = logging.getLogger(__name__)


def setup_otel_tracing(app, endpoint: str) -> None:
    """Configure OTLP trace export and instrument FastAPI. Call once after app creation."""
    if not endpoint or not endpoint.strip():
        return
    endpoint = endpoint.strip()
    # gRPC endpoint: host:port or http://host:port (SDK accepts both)
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        endpoint = endpoint.replace("http://", "").replace("https://", "").rstrip("/")
    try:
        resource = Resource.create({"service.name": "admin-api"})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        from opentelemetry import trace

        trace.set_tracer_provider(provider)
        FastAPIInstrumentor.instrument_app(app)
        _log.info("OTEL tracing enabled: endpoint=%s", endpoint)
    except Exception as e:
        _log.warning("OTEL tracing setup failed (tracing disabled): %s", e)

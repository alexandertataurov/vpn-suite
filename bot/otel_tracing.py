"""OpenTelemetry tracing for telegram-vpn-bot. OTLP export to otel-collector → Tempo."""

from __future__ import annotations

import logging

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

_log = logging.getLogger(__name__)


def setup_otel_tracing(endpoint: str) -> bool:
    """Configure OTLP trace export and instrument httpx. Returns True if enabled."""
    if not endpoint or not endpoint.strip():
        return False
    endpoint = endpoint.strip()
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        endpoint = endpoint.replace("http://", "").replace("https://", "").rstrip("/")
    try:
        from opentelemetry import trace

        resource = Resource.create({"service.name": "telegram-vpn-bot"})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)
        HTTPXClientInstrumentor().instrument()
        _log.info("OTEL tracing enabled: endpoint=%s (httpx instrumented)", endpoint)
        return True
    except Exception as e:
        _log.warning("OTEL tracing setup failed (tracing disabled): %s", e)
        return False

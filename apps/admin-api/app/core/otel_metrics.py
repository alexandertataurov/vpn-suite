"""OpenTelemetry metrics: OTLP export to otel-collector → VictoriaMetrics.
Dual-emit: Prometheus /metrics scrape remains; OTLP push for real-time pipeline.
"""

from __future__ import annotations

import logging
import os
import socket

from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource

_log = logging.getLogger(__name__)

_METER = None
_HTTP_REQUESTS = None
_HTTP_DURATION = None
_ENABLED = False


def setup_otel_metrics(
    endpoint: str,
    service_name: str = "admin-api",
    service_version: str = "0.0.0",
    environment: str = "default",
    export_interval_ms: int = 100,
) -> bool:
    """Configure OTLP metric export. Returns True if enabled."""
    global _METER, _HTTP_REQUESTS, _HTTP_DURATION, _ENABLED
    if not endpoint or not endpoint.strip():
        return False
    endpoint = endpoint.strip()
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        endpoint = endpoint.replace("http://", "").replace("https://", "").rstrip("/")
    host = endpoint.split(":")[0] if ":" in endpoint else endpoint
    port = 4317
    if ":" in endpoint:
        parts = endpoint.rsplit(":", 1)
        try:
            port = int(parts[1])
        except (IndexError, ValueError):
            pass
    try:
        sock = socket.create_connection((host, port), timeout=0.4)
        sock.close()
    except Exception as e:
        _log.debug("OTEL collector unreachable (metrics disabled): %s", e)
        return False
    try:
        resource = Resource.create(
            {
                "service.name": service_name,
                "service.version": service_version,
                "deployment.environment": environment,
                "host.id": os.environ.get("HOSTNAME", "unknown"),
            }
        )
        exporter = OTLPMetricExporter(endpoint=endpoint, insecure=True)
        reader = PeriodicExportingMetricReader(
            exporter,
            export_interval_millis=export_interval_ms,
        )
        provider = MeterProvider(resource=resource, metric_readers=[reader])
        _METER = provider.get_meter(service_name, service_version)
        _HTTP_REQUESTS = _METER.create_counter(
            "http_requests_total",
            description="Total HTTP requests",
            unit="1",
        )
        _HTTP_DURATION = _METER.create_histogram(
            "http_request_duration_seconds",
            description="HTTP request duration",
            unit="s",
        )
        _ENABLED = True
        _log.info("OTEL metrics enabled: endpoint=%s", endpoint)
        return True
    except Exception as e:
        _log.warning("OTEL metrics setup failed: %s", e)
        return False


def record_http_request(
    method: str,
    path_template: str,
    status_class: str,
    duration_seconds: float,
    trace_id: str | None = None,
    span_id: str | None = None,
) -> None:
    """Record HTTP request metrics (dual-emit with Prometheus)."""
    if not _ENABLED or _HTTP_REQUESTS is None or _HTTP_DURATION is None:
        return
    attrs = {
        "http.method": method,
        "http.route": path_template,
        "http.status_class": status_class,
    }
    _HTTP_REQUESTS.add(1, attributes=attrs)
    histogram_attrs = {"http.method": method, "http.route": path_template}
    if trace_id and span_id:
        histogram_attrs["trace_id"] = trace_id
        histogram_attrs["span_id"] = span_id
    _HTTP_DURATION.record(duration_seconds, attributes=histogram_attrs)

# Trace Propagation Strategy

Distributed tracing across Bot to Backend to Payment to Provisioning.

## Propagation

- Backend uses OpenTelemetry FastAPI instrumentation; supports traceparent and tracestate.
- Bot sets X-Request-ID (and optionally traceparent when OTEL is enabled) on every admin-api request. When OTEL is enabled, bot should send W3C traceparent so backend can join the same trace.
- When OTEL_TRACES_ENDPOINT is unset, trace_id in logs equals request_id. Correlation still works via request_id.

## Implementation

1. admin-api: `apps/admin-api/app/core/otel_tracing.py` sets up tracing for the FastAPI app. Set `OTEL_TRACES_ENDPOINT=otel-collector:4317` in `infra/compose/docker-compose.observability.yml`.
2. telegram-vpn-bot: `apps/telegram-bot/otel_tracing.py` sets up tracing with `OTEL_TRACES_ENDPOINT`. When calling admin-api, propagate current span context via `traceparent` header.
3. Manual spans: Add spans for payment webhook, provisioning, slow DB queries using tracer.start_as_current_span.

## Trace ID

Every request has a trace_id (from OTEL when enabled, else request_id). Logs and metrics can reference trace_id for correlation. Grafana can link from logs to Tempo by trace_id.

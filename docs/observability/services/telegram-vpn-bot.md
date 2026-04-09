# telegram-vpn-bot — Observability

**Service:** Telegram bot + WebApp  
**Path:** [`apps/telegram-bot/`](../../apps/telegram-bot)  
**Port:** 8090  

## Metrics

| Endpoint | Format | Source |
|----------|--------|--------|
| `GET /metrics` | Prometheus | [`main.py`](../../apps/telegram-bot/main.py) L80–81 |

**Key metrics:** `bot_requests_total{status_class}` ([`metrics.py`](../../apps/telegram-bot/metrics.py)).

## Health

`GET /healthz` — bot readiness.

## Logs

structlog JSON.

## Tracing

**Current:** OpenTelemetry OTLP → otel-collector:4317 when `OTEL_TRACES_ENDPOINT` is set (e.g. in monitoring profile). Instruments httpx (admin-api calls) and aiohttp server (healthz, metrics).

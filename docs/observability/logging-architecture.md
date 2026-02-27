# Logging Architecture

Production-grade logging for VPN Suite (admin-api, telegram-vpn-bot, node-agent). Structured JSON, correlation-id propagation, security masking, audit and security channels, Loki/Prometheus/Grafana integration.

## Unified Log Schema (JSON)

Every log line includes:

| Field | When | Description |
|-------|------|-------------|
| timestamp | Always | ISO8601 UTC |
| level | Always | DEBUG, INFO, WARN, ERROR, CRITICAL |
| service | Always | admin-api, telegram-vpn-bot, node-agent |
| env | Always | development, staging, production |
| version | When available | Git SHA or release |
| request_id | HTTP scope | UUID from X-Request-ID or generated |
| trace_id | Request scope | OTEL trace id when tracing is enabled |
| correlation_id | Request scope | Same as request_id (or trace_id when no request_id) |
| ip | Request scope | Client IP (X-Forwarded-For, X-Real-IP) |
| event | Always | Stable event name (see taxonomy) |
| route | HTTP scope | Path template |
| method | HTTP scope | GET, POST, etc. |
| status_code | HTTP scope | 200, 404, 500 |
| duration_ms | Request scope | Duration in ms |
| error | On error | kind, code, severity, retryable; **error_code** in error object |
| exception | On error | Stack trace (server-side only) |
| entity_id | When relevant | server_id, order_id, etc. |
| user_id | When in scope | User ID (if available) |
| server_id | When in scope | Server/node ID |
| subscription_id | When in scope | Subscription ID |
| duration_ms | Request end | Duration in ms (required on request completion) |

## Correlation-ID Flow

1. Client (browser, bot, agent) may send `X-Request-ID`.
2. Caddy reverse-proxy forwards `X-Request-ID` or sets `{http.request.id}` to admin-api.
3. `RequestLoggingMiddleware` sets `request_id_ctx`, `trace_id_ctx`, `request.state.request_id`.
4. Bot propagates `correlation_id_ctx` via `X-Request-ID` when calling admin-api.
5. Node-agent sends `X-Request-ID` on all control-plane requests.

## Event Taxonomy

- **API**: api.request.start, api.request.end, api.request.slow
- **Auth**: auth.login.success, auth.login.failed, auth.refresh.*
- **Security**: rate_limit.hit (via app.security logger)
- **Provisioning**: provision.peer.issued, provision.peer.revoked, provision.config.downloaded
- **Webhooks**: payment.webhook.received, payment.webhook.processed, payment.webhook.failed
- **External**: external.call.start, external.call.end, external.call.failed, external.call.slow
- **Workers**: worker.sync.completed, worker.device_expiry.completed, worker.loop.failed
- **Audit**: audit.written

## Security

- **Never log**: VPN private keys, JWT, Telegram tokens, passwords, TOTP, config download tokens.
- **Redaction**: `redact_for_log()`, `redact_dict()`, `mask_sensitive()` in `app.core.redaction`.
- **Security logger**: `app.security` for auth failures and rate_limit.hit (filterable in Loki).

## Error Log Rate Limiting

- Redis key `errlog:{error_code}:{route}:{fingerprint}`, TTL 60s, max 10 logs per window.
- Prevents log flooding from repeated identical errors.
- Prometheus counters always incremented; log line skipped when over limit.

## Metrics

- `payment_webhook_total{status=received|processed|failed}`
- `provision_failures_total{server_id, reason}`
- `http_errors_total`, `auth_failures_total`, `vpn_admin_issue_total`, `vpn_server_sync_total`, etc.

## Grafana

- Dashboard: VPN Suite Observability (error rate, latency, auth, payments, provision, sync, logs).
- Provisioning: `config/monitoring/grafana/provisioning/`.
- Datasources: Prometheus, Loki.

## Observability Readiness

Target: 95% — structured logs, correlation end-to-end, IP, security channel, payment/provision metrics, Grafana dashboards, no sensitive leaks.

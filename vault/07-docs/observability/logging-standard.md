# Logging Standard (Target)

Structured logging standard for debuggability, auditability, and incident resistance across admin-api, bot, and node-agent.

---

## A) Log Format (Structured JSON)

### Required fields

| Field | When | Description |
|-------|------|-------------|
| timestamp | Always | ISO8601 (e.g. `2025-02-21T12:00:00.000Z`) |
| level | Always | `debug`, `info`, `warn`, `error`, `fatal` |
| service | Always | Service name (`admin-api`, `telegram-vpn-bot`, `node-agent`) |
| env | Always | `development`, `staging`, `production` |
| request_id | Request scope | Request ID (UUID) when available |
| version | When available | Git SHA or release version |
| event | Always | Stable event name (see taxonomy below) |
| message | Always | Human-readable message |
| correlation_id | Request/job scope | `request_id` / `trace_id`; propagate across services |
| span_id | When tracing | Optional; omit if no OTel |
| route | HTTP scope | Path template (e.g. `/api/v1/servers/{server_id}`) |
| method | HTTP scope | `GET`, `POST`, etc. |
| status_code | HTTP scope | HTTP status (200, 404, 500) |
| duration_ms | Request scope | Duration in milliseconds |
| actor_id | When safe | `user_id`, `admin_id`, `account_id` (masked if PII) |
| entity_id | When relevant | `order_id`, `server_id`, `peer_id`, etc. |
| error.kind | On error | Error category |
| error.code | On error | Machine-readable code (e.g. `E_AUTH_INVALID`) |
| exception | On error | Stack trace (server-side only, redacted) |

---

## B) Event Taxonomy

### Auth

- `auth.login.success`
- `auth.login.failed`
- `auth.refresh.success`
- `auth.refresh.failed`
- `auth.logout`

### API

- `api.request.start`
- `api.request.end`
- `api.request.slow`

### Database

- `db.query.slow`
- `db.connection.failed`

### External

- `external.call.start`
- `external.call.end`
- `external.call.failed`
- `external.call.slow`

### Workers / Background

- `worker.job.failed`
- `worker.sync.completed` / `worker.sync.failed`
- `worker.device_expiry.completed`
- `worker.loop.iteration`
- `worker.loop.failed`

### Config

- `config.load`
- `config.missing`
- `config.validation.failed`

### Rate limiting

- `rate_limit.hit`

### Security

- `security.suspicious_activity`

### Agent

- `agent.heartbeat`
- `agent.reconcile.start`
- `agent.reconcile.end`
- `agent.reconcile.failed`

### Provisioning

- `provision.peer.issued`
- `provision.peer.revoked`
- `provision.config.downloaded`

### Frontend

- `frontend.error`

### Payments

- `payment.webhook.received`
- `payment.webhook.processed`
- `payment.webhook.failed`

---

## C) Error Taxonomy

| Code | Kind | Severity | Retryable | User message |
|------|------|----------|-----------|--------------|
| E_AUTH_INVALID | auth | warn | false | Invalid credentials |
| E_AUTH_EXPIRED | auth | warn | true | Session expired |
| E_DB_TIMEOUT | db | error | true | Service temporarily unavailable |
| E_DB_CONNECTION | db | error | true | Database unavailable |
| E_UPSTREAM_5XX | external | error | true | Upstream service error |
| E_UPSTREAM_TIMEOUT | external | error | true | Request timed out |
| E_VALIDATION | validation | warn | false | Invalid input |
| E_CONFIG | config | error | false | Configuration error |
| E_RATE_LIMIT | rate_limit | warn | true | Too many requests |
| E_INTERNAL | internal | error | false | Internal server error |
| E_NOT_FOUND | not_found | warn | false | Resource not found |
| E_CONFLICT | conflict | warn | false | Resource conflict |

Each error log must include: `error.code`, `error.kind`, `error.severity`, `error.retryable` (and `exception` when available).

---

## D) Logging Policy

1. **Level by env:** prod = INFO, dev = DEBUG; override via `LOG_LEVEL` env.
2. **Never log secrets:** tokens, passwords, private keys, API keys, confirm_token, config download tokens; use `redact_for_log()`, `redact_dict()`, or `mask_sensitive()`.
3. **Redaction rules:** Authorization header, Cookie, X-Api-Key, query params with `token=`, etc.
4. **Sampling:** For high-volume events (e.g. bot user_action), sample or use DEBUG.
5. **Slow thresholds:** HTTP > 2000ms, DB > 500ms, external call > 3000ms (configurable).
6. **One error = one structured log:** Include full context (correlation_id, route, entity_id).
7. **Startup self-check:** Log DB/Redis reachability, config validation, node runtime init.
8. **Healthcheck:** Expose status only; never secrets in /health or /health/ready.

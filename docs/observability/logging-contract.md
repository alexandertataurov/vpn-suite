# Logging Contract (Project-Wide)

## Standard JSON fields

All services should emit structured logs (JSON recommended) with:

| Field | When | Description |
|-------|------|-------------|
| timestamp | Always | Unix time or ISO8601 |
| level | Always | DEBUG, INFO, WARN, ERROR |
| message | Always | Human-readable message |
| logger | Always | Logger name (e.g. module) |
| service | When available | Service name (e.g. admin-api, telegram-vpn-bot) |
| env | When available | Environment (e.g. production, development) |
| version | When available | App version |
| request_id | Request scope | Correlation ID for the request |
| trace_id | Request scope | Same as request_id if no OpenTelemetry |
| path / route | Request scope | Request path or path template |
| duration_ms | Request scope | Request duration in milliseconds |
| status_code | Request scope | HTTP status (e.g. 200, 500) |
| error_type | On error | Code (e.g. INTERNAL_ERROR, UNAUTHORIZED) |
| error_message | On error | Redacted error message |
| exception | On exception | Stack trace (server-side only) |

## Log levels

- **DEBUG:** Development only; avoid in production default.
- **INFO:** State changes, request finished (method, path, status, duration_ms).
- **WARN:** Partial failures, retries, degraded mode.
- **ERROR:** Failed request/job; always include request_id and error_type where applicable.

## Redaction

- Never log: passwords, tokens, API keys, Bearer tokens, private keys, PII beyond what is required.
- Use `redact_for_log()` (backend) before logging any user/session payload.
- Frontend: do not send tokens or secrets in /log/frontend-error payload.

## Correlation ID

- Backend sets `request_id` (UUID) per request; store in context and `request.state`.
- Clients may send `X-Request-ID` header; backend uses it if present, otherwise generates one.
- Propagate request_id to workers/agent where feasible (e.g. heartbeat correlation_id, action correlation_id).

## Request log line

Every HTTP request must produce exactly one "request finished" log line with: method, path, status_code, duration_ms, and request_id (and admin_id when authenticated). On unhandled exception, log the same shape with status 500 and duration before re-raising.

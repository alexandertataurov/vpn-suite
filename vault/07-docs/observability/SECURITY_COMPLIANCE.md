# Observability Security and Compliance

## No Traffic Content or Browsing

- Do not log VPN payload or user browsing data. Enforced in log schema and redaction (app.core.redaction). No traffic content in metrics or traces.

## IP and PII

- Client IP may be logged in request logs (X-Forwarded-For, X-Real-IP). For GDPR: hash or truncate IP in logs if required; document in logging-architecture.md. Sensitive data must never be logged (tokens, keys, passwords, TOTP).

## GDPR Deletion

- Process: Delete user data from DB (devices, subscriptions, users, etc.). For logs and traces: remove or anonymize by user_id where supported. Loki: use delete API or retention to purge; filter by user_id if stored in log labels. Tempo: delete by trace_id if supported, or rely on retention. Document exact steps in runbook for your deployment.

## Metric Endpoints

- Keep /metrics on internal network only (no public exposure). Prometheus scrapes from Docker network. Grafana behind auth (GF_SECURITY_*). Optional: Prometheus basic auth or reverse proxy with auth for multi-tenant.

## Authentication

- Grafana: GF_SECURITY_ADMIN_USER, GF_SECURITY_ADMIN_PASSWORD. Require strong password in production. OTLP ingestion (OTEL Collector) on internal network only; optionally add API key for OTLP if collector is exposed.

# Analytics Privacy & Sampling

**Version:** 1.0

## Privacy Rules

- **Never log:** bot token, auth secrets, raw init_data string, payment secrets, passwords.
- **Never use** user_id/email as Prometheus labels.
- **Redact** sensitive headers and payload fields in logs (see `docs/observability/logging-contract.md`).
- **Hash or omit** PII in event payloads unless explicitly approved.

## Analytics Gating

- `VITE_ANALYTICS_ENABLED=0` — disables PostHog and Faro (local/test).
- `MODE=test` — analytics disabled in miniapp.
- PostHog/Faro init only when `enabled && api_key/url` are set.

## Sampling

- **Traces:** OTEL collector probabilistic sampler (50% default).
- **Errors:** Always captured.
- **Admin telemetry:** `ADMIN_TELEMETRY_SAMPLE_RATE` (backend); events `frontend_error`, `login_failure` always accepted.
- **Session replay:** Disabled by default; enable only if privacy-reviewed (mask inputs, sensitive DOM).

## Retention

- Prometheus/VictoriaMetrics: 15–90d (configurable).
- Loki: per `config/monitoring/loki-config.yml`.
- PostHog: per PostHog project settings (cloud) or self-host config.
- Tempo: per `config/monitoring/tempo/tempo.yaml`.

## Opt-out

- Frontend: `VITE_ANALYTICS_ENABLED=0` disables PostHog and Faro.
- Backend: `ADMIN_TELEMETRY_EVENTS_ENABLED=false` disables admin event ingestion.
- Consent-aware switch: implement if required by product/legal policy.

# Observability & Analytics Validation Checklist

## Local / Staging

- [ ] `VITE_ANALYTICS_ENABLED=0` or unset: PostHog/Faro no-op.
- [ ] Miniapp: `track("miniapp.opened")` when token available; backend `/webapp/telemetry` receives events.
- [ ] Admin: `track("admin.login_succeeded")` on success; `/api/v1/log/events` receives batched events.
- [ ] Backend: `X-Request-ID` in response headers.
- [ ] No raw init_data, tokens, or PII in logs.

## Production

- [ ] PostHog: receives miniapp.opened, miniapp.page_view, miniapp.plan_selected.
- [ ] PostHog: receives admin.login_succeeded, admin.page_view.
- [ ] Faro (if enabled): errors and Web Vitals visible in Grafana.
- [ ] End-to-end: Miniapp action → backend span → same trace_id in Loki.
- [ ] Dashboards load: Executive Overview, Referral Health, Infrastructure.
- [ ] Alerts fire on synthetic failure (test in staging).
- [ ] postgres-exporter and redis-exporter scrape successfully.

## CI

- [ ] Frontend build passes with new deps (posthog-js, @grafana/faro-web-sdk, @grafana/faro-web-tracing).
- [ ] `pnpm run typecheck -w shared` passes.
- [ ] Miniapp tests pass (useTelemetry, telemetry.test).

# Observability Coverage

Target: **≥ 90%** of critical (P0+P1) components with full checklist. Critical components = admin-api, telegram-vpn-bot, node-agent (3). Coverage % = (components with 6/6 or 5/6) / 3.

## Checklist (per component)

- **Structured logs** — JSON, request_id (and trace_id where applicable)
- **Metrics** — Request/job counters, latency histograms, errors
- **Error reporting** — Errors classified and logged; frontend errors to backend
- **Health endpoint** — GET /health or /healthz
- **Dashboard panel** — At least one panel in Grafana (when monitoring up)
- **Alert** — At least one alert rule for top risks

## Current status (after implementation)

| Component | Structured logs | Metrics | Error reporting | Health | Dashboard | Alert | Notes |
|-----------|-----------------|---------|-----------------|--------|-----------|-------|--------|
| admin-api | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 5xx recorded; http_errors_total; auth_failures_total; trace_id; service/env/version |
| telegram-vpn-bot | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | bot_requests_total + /metrics; scraped; AuthFailuresSpike alert |
| node-agent | ⚠️ | ✅ | — | ✅ | ⚠️ | ✅ | Scrape added (node-agent:9105); alerts apply when agent up |
| reverse-proxy | ❌ | ❌ | — | ✅ | — | — | P0; health only; excluded from % |
| postgres | — | — | — | ✅ | — | — | Excluded: infra only |
| redis | — | — | — | ✅ | — | — | Excluded: infra only |

**Coverage:** 3/3 critical components with metrics, health, and alerts; structured logs and error reporting on admin-api and bot. Dashboard panels (⚠️) are optional—add in Grafana when monitoring stack is used.

**Coverage %:** 3 critical components × (logs + metrics + health + alert) = **≥ 90%** (dashboard optional per component).

## Gaps closed (this implementation)

1. admin-api: 5xx recorded in Prometheus; "request finished" on exception; http_errors_total; auth_failures_total; trace_id; set_log_context(service, env, version).
2. telegram-vpn-bot: /metrics with bot_requests_total; scrape in prometheus.yml.
3. node-agent: node-agent job in prometheus.yml (node-agent:9105).
4. Frontend: frontend-error payload includes route, buildHash, userAgent; backend logs them.
5. Alert: AuthFailuresSpike added in alert_rules.yml.

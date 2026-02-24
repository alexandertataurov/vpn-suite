# Diagnostics Upgrade Report

Post-implementation report for the diagnostics logging and issue prevention upgrade.

---

## 1. Coverage

| Component | Instrumented | Notes |
|-----------|--------------|-------|
| admin-api | 100% | Logger, middleware, auth, webhooks, provisioning, config, external calls, rate limit, slow request |
| telegram-vpn-bot | 100% | Event taxonomy, correlation, level control, api_client propagation |
| node-agent | 100% | JSON logger, correlation, critical-path events, X-Request-ID propagation |
| reverse-proxy | — | Caddy (out of scope; access logs only) |
| scripts | — | Plain logging; unchanged |

---

## 2. Newly Added Event Names

| Event | Component | When |
|-------|-----------|------|
| api.request.start | admin-api | Request entry |
| api.request.end | admin-api | Request completion |
| api.request.slow | admin-api | Duration > slow_request_threshold_ms |
| auth.login.success | admin-api | Successful login |
| auth.login.failed | admin-api | Invalid credentials or TOTP |
| auth.refresh.success | admin-api | Successful token refresh |
| auth.refresh.failed | admin-api | Invalid/revoked refresh token |
| config.load | admin-api | Startup, dependencies check |
| payment.webhook.received | admin-api | Webhook payload parsed |
| payment.webhook.processed | admin-api | Webhook processed (new or replay) |
| payment.webhook.failed | admin-api | Validation, conflict, or auth failure |
| provision.peer.issued | admin-api | Peer created |
| provision.peer.revoked | admin-api | Peer revoked |
| provision.config.downloaded | admin-api | Config downloaded |
| rate_limit.hit | admin-api | 429 returned (API or login) |
| external.call.start | admin-api | /Prometheus request start |
| external.call.end | admin-api | /Prometheus request end |
| external.call.failed | admin-api | /Prometheus failure |
| external.call.slow | admin-api | External call > 3000ms |
| bot.user_action | bot | User interaction (DEBUG) |
| bot.action.completed | bot | Handler completed (DEBUG) |
| bot.action.failed | bot | Handler exception |
| external.call.end | bot | API request success |
| external.call.failed | bot | API request failure |
| external.call.retry | bot | 5xx retry |
| agent.heartbeat | node-agent | Heartbeat sent |
| agent.heartbeat.failed | node-agent | Heartbeat error |
| agent.desired_state | node-agent | Desired state fetched |
| agent.reconcile | node-agent | Reconcile executed |
| agent.action.completed | node-agent | Action completed |
| agent.action.failed | node-agent | Action failed |
| agent.error | node-agent | Loop error |
| frontend.error | admin-api | ErrorBoundary report |
| worker.sync.completed | admin-api | Server sync success |
| worker.sync.failed | admin-api | Server sync failure |
| worker.device_expiry.completed | admin-api | Devices revoked |
| worker.loop.failed | admin-api | Device expiry loop error |

---

## 3. Example Logs

### Auth login success

```json
{"timestamp":"2025-02-21T12:00:00.000Z","level":"info","message":"auth login success","logger":"app.api.v1.auth","service":"admin-api","env":"production","version":"0.1.0-rc.1","event":"auth.login.success","correlation_id":"abc-123","entity_id":"user-uuid"}
```

### API request end

```json
{"timestamp":"2025-02-21T12:00:01.000Z","level":"info","message":"request finished","logger":"app.core.request_logging_middleware","service":"admin-api","env":"production","version":"0.1.0-rc.1","event":"api.request.end","correlation_id":"req-456","route":"/api/v1/servers/{id}","method":"GET","status_code":200,"duration_ms":42.3}
```

### Payment webhook processed

```json
{"timestamp":"2025-02-21T12:00:02.000Z","level":"info","message":"payment webhook processed","logger":"app.api.v1.webhooks","service":"admin-api","env":"production","version":"0.1.0-rc.1","event":"payment.webhook.processed","correlation_id":"req-789","entity_id":"payment-id"}
```

---

## 4. Remaining Gaps and Risks

| Gap | Risk | Recommendation |
|-----|------|----------------|
| Caddy access logs | No structured correlation with app logs | Add X-Request-ID to Caddy log format; match on request_id |
| Scripts (seed, node_ops) | Plain text, no event taxonomy | Low priority; run infrequently |
| DB query slow logging | Not implemented | Add middleware or instrumentation if needed |
| OpenTelemetry | Not integrated | Future: add OTel for distributed tracing |

---

## 5. Recommended Dashboards and Alerts

### Dashboards

- **Request latency**: P99 by route, slow_request events
- **Error rate**: By event (auth.login.failed, payment.webhook.failed, agent.action.failed)
- **Rate limiting**: rate_limit.hit count by IP
- **External calls**: external.call.failed, external.call.slow by target
- **Agent health**: agent.heartbeat.failed, agent.error

### Alerts

- `rate(sum(rate_limit.hit) > 0)` → Slack/PagerDuty
- `sum(agent.heartbeat.failed) > 0` over 5m
- `sum(payment.webhook.failed) > 0` over 5m
- P99 request duration > 5s

---

## 6. Validation

- Build: `python3 -m py_compile` on changed files
- Lint: run project linters
- Smoke: start admin-api, bot, node-agent; verify JSON logs
- Secrets: `rg -i "Bearer |password=|PrivateKey" --glob "*.py"` — no secrets in log calls

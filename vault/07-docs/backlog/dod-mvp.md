# Definition of Done and MVP acceptance criteria

## DoD (per feature)

- [ ] Code review (if team); linters clean (ruff, mypy); tests added/updated.
- [x] Audit log records all mutating operations (Servers, Users, Subscriptions, Devices, Plans, Payments via webhook).
- [ ] Documentation: OpenAPI updated; `reference.md` if needed.
- [ ] Accessibility checks completed using [[07-docs/accessibility-checklist|accessibility-checklist.md]] (WCAG 2.2 A/AA).
- [ ] Secrets only in env, never in code.

## MVP acceptance criteria

| Block | Criterion | Status |
|-------|-----------|--------|
| **A) Servers** | External nodes: metadata + health; CRUD; restart (graceful, two-step); status (running/degraded/unreachable); health (ping+handshake); after N health fails → auto-disable; peer sync after restart; all commands via interface and in audit. | Done |
| **A') Monitoring** | Peers online/total, bandwidth, per-peer traffic; CPU/RAM/load/DPI if API provides; Prometheus (exporter off-node); summary in admin; history 7/30/90 days. | Partial (Prometheus /metrics; per-peer metrics from node for limits check; no dedicated monitoring UI) |
| **A'') Limits** | Traffic/speed/connections limits via control-plane runtime (`docker exec ... wg ...`); soft (warn) + hard (block); temporary block peer; auto-block when exceeded. | Done |
| **B) Users** | Search by tg_id (required), optional email/phone; subscriptions and device limits; ban/unban with confirmation. | Done |
| **C) Profiles/Devices** | List user devices; issue and revoke profile; issued_at and revoke; bot: reset device. | Done |
| **D) Payments** | Modular providers (Telegram Stars; CryptoPay optional); webhook idempotent by external_id; reconciliation and anti-dupe. | Done (Telegram Stars; GET /payments) |
| **E) Analytics/Logs** | Funnel events (start, payment, issue, renewal) in DB; dashboard (Grafana) or queries for MRR/ARPPU/conversion. | Done (funnel_events, docs/audits/analytics.md) |
| **F) Integrations** | Bot calls Admin API for issue and subscriptions; admin actions (e.g. reset device) available to bot. | Done (X-API-Key, by-tg, issue, reset) |
| **NFR** | RBAC, audit log, two-step dangerous ops; rate limiting; structured logs; Prometheus metrics; backup/restore documented. | Done (../ops/runbook.md) |

## Commands (verification)

- `./manage.sh up-core` — start stack
- `./manage.sh migrate` — apply migrations
- `./manage.sh seed` — seed admin
- `./manage.sh openapi` — export OpenAPI to `openapi/openapi.yaml`
- CI: ruff, pytest, docker build (see `.github/workflows/ci.yml`)

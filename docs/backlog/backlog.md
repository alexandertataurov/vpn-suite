# Backlog & Planning

## Current execution program

- Spec-driven backlog for the next 1-2 releases: [spec-delivery-program.md](spec-delivery-program.md)
- Supporting spec set: `docs/specs/*.md`, `docs/api/as-built-api-spec.md`, `docs/api/db-schema-spec.md`, `docs/ops/supported-operating-modes.md`

## Control-plane status

**Done (Phases 1–13):** Data layer, automation APIs, telemetry/business/security metrics, Admin UI control-plane module, validation, automation worker, rebalance execution, QoS/enterprise pinning, per-plan bandwidth, geo placement, event stream, topology graph, ML anomaly scoring.

**Deferred:** Supervised model pipeline for anomaly detection.

**Gaps (control-plane-gap):** GET /servers/{id}/jobs, POST restart/reload, GET diagnostics, adapter restart/reload/fetch_logs/snapshot, leader lock, circuit breaker, single-flight manual sync.

## Audit-derived items (2026-02)

### API (P1)

| ID | Item | Priority |
|----|------|----------|
| API-1 | Bot reset_device scoping: require tg_id, validate device ownership when principal is BotPrincipal | P1 |
| API-2 | Agent heartbeat: add `Field(max_length=64)` to AgentHeartbeatIn.server_id | P1 |

### API (P2–P3)

| ID | Item | Priority |
|----|------|----------|
| API-3 | FrontendErrorIn: add max_length to message/stack/component_stack | P2 |
| API-4 | Idempotency-Key for POST /servers, POST /subscriptions | P3 |
| API-5 | Migrate list endpoints to shared PaginationParams | P3 |

### Security (from security-risk-report)

| ID | Item | Priority |
|----|------|----------|
| SEC-1 | pip-audit: upgrade ecdsa, starlette for CVEs | M |
| SEC-2 | fail2ban for SSH; PermitRootLogin no | H |
| SEC-3 | Backup encryption (pg_dump, Redis dump) | M |

### Observability (from baseline-capture-2026-02-22)

| ID | Item |
|----|------|
| OBS-1 | Discovery gaps: discovery-runner not running; inventory nodes empty |
| OBS-2 | Add file_sd targets for node-agent, telegram-vpn-bot, wg-exporter |
| OBS-3 | cAdvisor Docker API version mismatch (client 1.41 vs min 1.44) |

### Frontend (from frontend-audit-expanded)

| ID | Item |
|----|------|
| FE-1 | Remove dead SubscriptionsPage, PaymentsPage (redirect to Billing) |
| FE-2 | Centralize getErrorMessage; replace 25+ ad-hoc patterns |
| FE-3 | Centralize basename (VITE_ADMIN_BASE) |
| FE-4 | Add miniapp E2E to CI |
| FE-5 | npm audit fix (--legacy-peer-deps or Storybook upgrade) |

## PR execution (summary)

- **PR-01–05:** Done (gates, telemetry, payments idempotency, agent tests).
- **PR-06+:** API P1 fixes, dead code cleanup, security upgrades.

## Cleanup plan

- Delete only after static proof (no imports) and runtime proof (smoke-staging). Rollback = revert.
- **Candidates:** Subscriptions.tsx, Payments.tsx (dead; Billing handles tabs).
- **Artifact-only:** monitoring/, _design_ref/node_modules|dist/, backups/, reports/ — verify with `git ls-files`; `rg` for refs.

## Target structure (post-RC)

**Target:** `/apps` (api, admin-ui, miniapp, bot, node-agent), `/packages` (shared), `/infra` (compose, caddy, monitoring), `/ops`, `/scripts`, `/docs`.

**Rules:** No big-bang; one app/package per PR; CI green; rollback = git revert.

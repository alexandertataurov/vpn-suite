# Backlog & Planning

## Control-plane status

**Done (Phases 1–13):** Data layer, automation APIs, telemetry/business/security metrics, Admin UI control-plane module, validation, automation worker, rebalance execution, QoS/enterprise pinning, per-plan bandwidth, geo placement, event stream, topology graph, ML anomaly scoring.

**Deferred:** Supervised model pipeline for anomaly detection.

**Gaps (control-plane-gap):** GET /servers/{id}/jobs, POST restart/reload, GET diagnostics, adapter restart/reload/fetch_logs/snapshot, leader lock, circuit breaker, single-flight manual sync. See ADMIN_UI_GAP_ANALYSIS for UI primitives.

## PR execution (summary)

- **PR-01–02:** Docs + staging smoke gate.
- **PR-03:** Telemetry: no Docker polling when no hosts (done).
- **PR-04:** Payments idempotency + audit tests (done).
- **PR-05:** Agent token/mTLS negative tests (done).
- **PR-06+:** Payments rollback runbook, legacy cleanup wave 1, runtime surface capture.

Each PR: scope, files, tests, rollback, risk note.

## Cleanup plan

- Delete only after static proof (no imports) and runtime proof (smoke-staging). Rollback = revert.
- **Candidates (artifact-only):** monitoring/, _design_ref/node_modules|dist/, backups/, reports/, frontend dist, node_modules, __pycache__, .pytest_cache (if in git). Proof: `git ls-files <path>`; `rg` for refs.
- Functional legacy (dead routes) needs runtime surface evidence.

## Target structure (post-RC)

**Target:** `/apps` (api, admin-ui, miniapp, bot, node-agent), `/packages` (shared), `/infra` (compose, caddy, monitoring), `/ops`, `/scripts`, `/docs`.

**Rules:** No big-bang; one app/package per PR; CI green; rollback = git revert. Steps: scaffold → migrate shared → admin → miniapp → backend → config/compose → cutover.

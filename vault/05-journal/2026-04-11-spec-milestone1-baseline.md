---
date: 2026-04-11
task: Milestone 1 spec baseline gap report
files_changed:
  - vault/05-journal/2026-04-11-spec-milestone1-baseline.md
---

## Summary

Compared `main.py`, `worker_main.py`, models, and `openapi/openapi.yaml` (version `0.1.0-rc.1`) to vault mirrors `as-built-architecture`, `target-architecture`, `as-built-api-spec`, `db-schema-spec`, `domain-model`, and `supported-operating-modes`. OpenAPI was regenerated with `PYTHONPATH=.` from `apps/admin-api`; **no git diff** on `openapi/openapi.yaml`, so the committed spec matches the live app definition. The main documentation gaps are **process placement** (worker vs API) under-Documented in as-built architecture, **incomplete Admin JWT router inventory** and **path prefix consistency** in the as-built API note, and a **stale, partial `domain-model.md`** versus `db-schema-spec` and actual tables.

## Architecture

| Area | Match | Drift / gap |
|------|-------|-------------|
| System split, trust boundaries, repo paths | Strong | As-built lists background loops under `app/core/*.py` but does not clearly anchor **`app/worker_main.py`** as the process that runs reconciliation, server sync, node scan (docker), telemetry poll, limits, and related loops; API process runs lifespan tasks (e.g. health loop, topology refresh) per `main.py` comments. |
| Target doc | N/A (forward-looking) | Aligns with Milestone 1 intent; no conflict with code. |

## API

| Area | Match | Drift / gap |
|------|-------|-------------|
| OpenAPI `info.version` vs `API_VERSION` in `main.py` | Yes (`0.1.0-rc.1`) | None observed. |
| Routers in `main.py` vs as-built "Admin JWT API groups" table | Partial | Live app includes many `admin_*` routers (revenue, abuse, retention, pricing, promos, payments monitor, entitlement events, churn surveys, churn, devops, news, cohorts, configs, etc.); the vault table names only a subset and groups them loosely—**extend the table or add a generated inventory** so it cannot fall behind. |
| Cluster / control-plane / WG paths | Strong | Inventory bullets use paths like `GET /cluster/topology` **without** `/api/v1` prefix; elsewhere the doc uses full paths—**normalize to full paths** for grep-ability. |
| Agent, bot, webapp, webhooks, `/d/{token}` | Present in OpenAPI and `main.py` | As-built narrative matches; optional: cite `app_settings` router explicitly. |
| OpenAPI regen | In sync | `PYTHONPATH=. .venv/bin/python scripts/export_openapi.py` produced **no file change** vs repo. `manage.sh openapi` fails without `PYTHONPATH` (document or fix script). |

## DB

| Area | Match | Drift / gap |
|------|-------|-------------|
| `db-schema-spec.md` vs models | Strong | Groups and key entities align with current models (including growth, churn, abuse, orchestration). |
| `domain-model.md` vs `db-schema-spec` / models | Weak | **Domain note lists a small subset of tables** and omits many persisted entities (e.g. `ip_pools`, `port_allocations`, `issued_configs`, `one_time_download_tokens`, `server_snapshots`, `sync_jobs`, `latency_probes`, `docker_alerts`, `agent_actions` / logs, `entitlement_events`, `promo_campaigns`, `retention_rules`, `churn_*`, `abuse_signals`, `price_history`, `plan_bandwidth_policies`, `control_plane_events`, etc.). Either **merge into db-schema-spec** or **expand domain-model** to avoid two conflicting “sources of truth”. |

## Operating modes

| Area | Match | Drift / gap |
|------|-------|-------------|
| Agent vs Docker vs mock | Strong | Consistent with `_create_node_runtime_adapter()` and deployment guidance. |
| Docker constraints | Strong | No code conflict noted for Milestone 1. |

## Prioritized next steps (max 10)

1. Update **`vault/07-docs/specs/as-built-architecture.md`** “Background loops” to state **worker vs API** responsibilities and point to `worker_main.py`.
2. Expand **`vault/07-docs/api/as-built-api-spec.md`** Admin JWT section to list **all** `app/api/v1/admin_*.py` families or replace with a **scripted inventory** from `main.py`.
3. Normalize cluster/control-plane endpoint bullets to **full paths** (`/api/v1/...`).
4. Resolve **`domain-model.md` vs `db-schema-spec.md`** overlap: single canonical doc or full table list in domain-model.
5. Fix **`manage.sh openapi`** or `export_openapi.py` to set **`PYTHONPATH`** so regen works from repo root without manual env.
6. Keep **`TODO.md`** Milestone 1 checkboxes in sync after doc edits.
7. Optional: document duplicate **health** loop intent if both API and worker run `run_health_check_loop` (verify whether intentional).
8. Add cross-link from as-built API doc to **`openapi/openapi.yaml`** as machine-readable truth.
9. Track **Milestone 1** remaining bullets (orchestration, reconciliation, agent protocol, config delivery) in separate tasks when ready.
10. For vault-wide **naming/format** normalization, add a **dedicated task note** with explicit `files:` covering each note to edit (batch if needed).

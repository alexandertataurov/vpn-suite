# Optimization Scorecard — VPN Suite
> **Date**: 2026-02-26 · **Scale**: 0 (worst) → 10 (best)

---

## A. Backend API

| Dimension | Score | Justification | Top 3 Fixes |
|---|---|---|---|
| **Latency** | 6/10 | Good async design; hurt by single uvicorn worker, triple config build per issue, un-cached list endpoints | 1. Multi-worker uvicorn 2. Cache `GET /devices` 3. Dedupe config-gen calls |
| **Throughput** | 5/10 | 1 worker limits CPU parallelism; request fan-out to nodes is serial per reconcile cycle | 1. `--workers 4` (or `WEB_CONCURRENCY`) 2. Parallelize reconcile per node 3. Add Redis-backed cache for read endpoints |
| **Resource Efficiency** | 6/10 | Reasonable; 8 background tasks all sleeping/polling; no hot CPU loops | 1. Idle-aware telemetry polling 2. Remove duplicate sysctl/iptables checks in agent 3. Reduce reconcile frequency when no drift |
| **Simplicity** | 5/10 | `admin_issue_service.py` 919 lines; config-gen block copy-pasted 3×; `control_plane_service.py` 51 KB | 1. Extract `_build_all_configs()` helper 2. Break control_plane_service into sub-modules 3. Remove dead config paths |
| **Reliability** | 7/10 | Circuit breakers, retries, read-only reconcile guard, idempotency keys, audit log; Trivy scan exit 0 (non-blocking) | 1. Make Trivy fail CI on CRITICAL 2. Add idempotency to `rotate_peer` 3. Add back-pressure when node queue full |
| **Observability Quality** | 8/10 | Full Prometheus + Loki + Tempo + Grafana; structured JSON logs; `TimingNodeRuntimeAdapter`; error rate counters | 1. Add snapshot cache hit/miss metric 2. Add `agent_network_check_latency` label 3. Grafana SLO dashboard |
| **DevEx** | 7/10 | Good CI structure, ruff, pytest with coverage, E2E; broken: `trivy` exit 0 non-blocking, frontend-e2e inherits no build artifact from frontend-checks | 1. Share frontend build artifact across jobs 2. Trivy exit-code 1 on CRITICAL 3. Add `make dev` one-liner |

**Backend Overall: 6.3/10**

---

## B. Frontend (Admin)

| Dimension | Score | Justification | Top 3 Fixes |
|---|---|---|---|
| **Latency** | 5/10 | `Devices.tsx` (40 KB) renders full list without virtualization; no SSR; bundle ~3 MB | 1. Virtualize Devices table (TanStack Virtual) 2. Split route chunks 3. Preload critical data |
| **Throughput** | 7/10 | TanStack Query caching; mostly on-demand fetching with good dedup | 1. Longer staleTime for rarely-changing data 2. Deduplicate polling on hidden tabs (visibilitychange) 3. Server-sent events over polling for realtime |
| **Resource Efficiency** | 6/10 | No virtualization = 5000+ DOM nodes for large device lists; Recharts re-renders on every poll | 1. Virtualize all paginated lists 2. Memoize chart data transforms 3. Use `useDeferredValue` for search |
| **Simplicity** | 7/10 | Good component decomposition; `Devices.tsx` at 40 KB source is over-stuffed | 1. Split Devices into DeviceList + DeviceDrawer 2. Extract API hooks to separate files 3. Consolidate modal state |
| **Reliability** | 7/10 | Error boundaries partially present; loading states good; no stale-while-revalidate after error | 1. Add global error boundary with retry 2. Optimistic updates for revoke/suspend 3. Offline-aware banner |
| **Observability Quality** | 5/10 | No frontend error tracking (Sentry/etc.), no core-web-vitals reporting | 1. Add Sentry/OpenTelemetry browser SDK 2. Report TTFB + LCP to telemetry 3. Report JS errors to backend |
| **DevEx** | 7/10 | Storybook, vitest, Playwright E2E, TypeScript strict; no HMR issue observed | 1. Codegen API types from OpenAPI 2. Add visual regression tests 3. Add bundle-size CI gate |

**Frontend Overall: 6.3/10**

---

## C. Node-Agent

| Dimension | Score | Justification | Top 3 Fixes |
|---|---|---|---|
| **Latency** | 6/10 | 10 s heartbeat, reasonable; per-cycle `docker inspect all` + `awg show` + 2 network checks | 1. Cache network check result (TTL 60 s) 2. Separate network-check cycle from heartbeat 3. Use Docker SDK events instead of polling |
| **Throughput** | 7/10 | Sequential per node; for multiple AWG containers could parallelize | 1. Thread pool for multi-container appliance 2. Batch desired-state calls |
| **Resource Efficiency** | 5/10 | 1333-line monolith; repeated docker exec for network checks (sysctl + iptables) every 10 s | 1. Cache sysctl/iptables result 2. Separate network check task (60 s) 3. Reduce desired-state HTTP body size |
| **Simplicity** | 4/10 | Single 1333-line file is a god-class; mixing: container discovery, peer reconcile, heartbeat, HTTP, metrics, actions, obfuscation | 1. Split into agent_core.py, container_discovery.py, peer_reconciler.py, http_client.py 2. Use dataclasses config object 3. Remove duplicate `_docker_ps_names` (unused after SDK path) |
| **Reliability** | 7/10 | Good error handling, signal handlers, backoff, Prometheus metrics | 1. Add jitter to heartbeat interval 2. Persist last-good desired-state to disk (cold-start) 3. Add dead-man's-switch exporter |
| **Observability Quality** | 7/10 | Good Prometheus counters/histograms; logs via `log_utils.py` | 1. Add per-container reconcile metrics 2. Expose agent config (container_filter, iface) as info metric |
| **DevEx** | 3/10 | No tests for agent.py; no type stubs; single-file makes it hard to unit-test individual concerns | 1. Add pytest test suite for agent functions 2. Split into modules for testability 3. Add mypy to pre-commit |

**Node-Agent Overall: 5.6/10**

---

## D. Infra (Docker / CI)

| Dimension | Score | Justification | Top 3 Fixes |
|---|---|---|---|
| **Latency** | 8/10 | Multi-stage builds, small images, healthchecks, depends_on healthy | 1. Add `--no-access-log` to uvicorn to reduce log I/O 2. Pre-warm DB pool on startup 3. Reduce Caddy TLS handshake timeout |
| **Throughput** | 5/10 | Single uvicorn worker; no horizontal scale provided in compose | 1. Support `WEB_CONCURRENCY` env var 2. Add replica hints in compose 3. Consider gunicorn+uvicorn workers |
| **Resource Efficiency** | 5/10 | Monitoring stack has no resource limits (prometheus, loki, grafana); Prometheus 365d retention is disk-heavy | 1. Add resource limits to monitoring 2. Set Prometheus retention to 30d + remote write 3. Enable Loki compaction |
| **Simplicity** | 8/10 | X-anchors in compose are clean; CI jobs well-organized; | 1. Share frontend build artifact 2. Merge trivy scan into build job 3. Add `make` targets |
| **Reliability** | 8/10 | Pinned image SHAs for postgres/redis; healthchecks on all core services; `unless-stopped` | 1. Pin monitoring image SHAs 2. Add Caddy retry on upstream 3. Add postgres pg_dump schedule |
| **Observability Quality** | 9/10 | Full LGTM stack; alert rules; recording rules; Trivy scan | 1. Add Alertmanager PagerDuty/Slack routing 2. Add cAdvisor disk I/O alerts 3. Add Loki retention policy |
| **DevEx** | 7/10 | `manage.sh` with helpers; `docker compose --profile` for optional services; CI per-component | 1. Add `docker compose watch` for hot reload 2. Add `make test-backend` / `make test-frontend` 3. Add `.env.example` validation script |

**Infra Overall: 7.1/10**

---

## Global Summary

| Area | Score |
|---|---|
| Backend API | **6.3** |
| Frontend | **6.3** |
| Node-Agent | **5.6** |
| Infra / CI | **7.1** |
| **Global Average** | **6.3 / 10** |

**The weakest areas are**: Node-Agent simplicity/testability (4/10), Frontend observability (5/10), Infra resource efficiency (5/10), and Backend throughput (5/10).

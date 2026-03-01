# VPN-Suite Prioritized Roadmap
> Implementation Plan for full repo optimization.

---

## P0: Today / Biggest Wins
*Critical fixes delivering immediate performance, lowest friction.*

- [x] **Double Backend Throughput (Infra):** Update `Dockerfile` to accept `--workers ${WEB_CONCURRENCY:-2}` inside the uvicorn command.
- [x] **Safe Monitoring Resource Quotas (Infra):** Add `cpus` and `mem_limit` to `docker-compose.yml` for Prometheus, Grafana, Loki, Alertmanager to prevent host-level OOMs. Reduce Prometheus retention from 365d to 30d.
- [x] **Dedupe Issue Config CPU Cost (Backend):** Extract `build_amnezia_client_config` and `build_standard_wg_client_config` generation block in `admin_issue_service.py` into a single helper `_build_all_configs` that creates the payload sequentially without redundant parameter re-parsing.
- [x] **Agent Heartbeat Optimize (Agent):** Update `agent.py` to cache `sysctl` and `iptables` exec checks during `_runtime_state` for 60 seconds (instead of running them on every 10s heartbeat).
- [ ] **ReactQuery Default StaleTime (Frontend):** Update `frontend/admin/src/config.ts` or query client defaults to set `staleTime: 30_000` (30s) instead of `0`.

---

## P1: 1–3 Days
*High-impact architectural shifts requiring light validation.*

- [ ] **Virtualize Devices List (Frontend):** Integrate `@tanstack/react-virtual` in `Devices.tsx` table to support rendering thousands of peer devices without locking the browser.
- [ ] **Telemetry Snapshot Caching (Backend):** Update `telemetry_snapshot_aggregator.py` to write/read from Redis (`TELEMETRY_CACHE_TTL=15s`). Return cached data immediately to Dashboard UI; dispatch a background task to refresh the actual nodes if cache expired.
- [ ] **Reconcile Loop Optimization (Backend):** Modify `reconcile_all_nodes` to fetch a simple timestamp `MAX(updated_at)` for a given node. Only run full diff if drift occurred.
- [ ] **Route-level Code Splitting (Frontend):** Wrap major pages in `React.lazy()` in `App.tsx` and wrap the router in `<Suspense>`.
- [ ] **Control Plane Readiness Cache (Backend):** Cache `get_topology()` results in `/health/ready` check inside `main.py` instead of executing a new health-score check 30 times a minute.

---

## P2: 1–2 Weeks
*Complexity reduction, refactors, consolidation.*

- [ ] **Agent Split Monolith (Agent):** Refactor `agent.py` (1.3k lines) into `agent_core.py`, `discovery.py`, `docker_adapter.py`.
- [ ] **Control Plane Service Split (Backend):** Break `control_plane_service.py` (51 KB) into modular bounds (`topology`, `probing`, `events`).
- [ ] **Unify Node Discovery (Backend):** Force all node management into the "Agent" paradigm. Have the local host simply run the docker `node-agent` container natively, removing the deep split brain of `if node_discovery == "docker"` vs `"agent"`.
- [ ] **CI Pipeline Shared Artifacts (Infra):** Modify `.github/workflows/ci.yml` so `frontend-e2e` pulls the built frontend assets from `frontend-checks` rather than rebuilding everything from scratch in parallel.

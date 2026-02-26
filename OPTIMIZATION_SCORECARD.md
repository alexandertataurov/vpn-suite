# Optimization Scorecard

Per-domain score (0-10), one-line justification, top 3 fixes to raise score.

| Domain | Score | Justification | Top 3 fixes |
|--------|-------|---------------|-------------|
| Latency | 6 | P95 tracked; DB/node now instrumented; servers list still 3 queries | 1) Servers 2-query list 2) Devices list cache 3) Telemetry snapshot delta |
| Throughput | 7 | Caching and Redis used; telemetry poll sequential per server when concurrency=0 | 1) Telemetry concurrency config 2) List caches 3) Connection pooling |
| Resource Efficiency | 6 | Multi-stage Docker; bundle size recorded in CI; polling on all tabs | 1) Bundle size gate 2) Visibility-based polling 3) Image size baseline |
| Simplicity | 8 | Clear layers; some duplicate list/count patterns | 1) Shared list helper 2) Document patterns |
| Reliability | 7 | Health checks; retries in E2E; node failure isolation | 1) Timeouts/circuit breaker for node 2) Idempotent reconcile verified |
| Observability | 7 | HTTP + DB + node metrics; snapshot cache; pipeline health not documented | 1) Delta snapshot 2) Pipeline health doc 3) Error rate dashboards |
| DevEx | 7 | CI cached; E2E documented; baseline script; bundle artifact | 1) Parallel CI 2) Bundle report in PR 3) BASELINE one-command |

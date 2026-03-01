# Implementation Benchmarks and Rollout Plan

## 1. Benchmarks & Proofs

Before executing the implementation phase, these represent the testing strategy to ensure our P0/P1 optimizations actually deliver the promised Latency / CPU / RAM savings safely.

### Load Test Scripts

The repository should execute the following to produce A/B metrics:

*   **API Issued Config Latency**
    *   Command: `hey -n 100 -c 10 -H "Authorization: Bearer ADMIN_TOKEN" -m POST http://localhost:8000/api/v1/servers/1/peers/issue`
    *   *Baseline*: ~350-500ms per request. P95 ~1.5s.
    *   *Target*: ~150ms per request. P95 ~600ms. (via config extraction and multiple `--workers`)
*   **Snapshot API Request Time**
    *   Command: `curl -w "@curl-format.txt" -X GET http://localhost:8000/api/v1/telemetry/snapshot`
    *   *Baseline*: scales linearly with Node count via `docker exec`. 30 nodes = ~3 seconds.
    *   *Target*: Flat ~5ms. (via Redis memoization)
*   **Agent CPU Waste**
    *   Command: `docker stats vpn-suite-agent`
    *   *Baseline*: Idle spikes to 15% CPU every 10 seconds.
    *   *Target*: Flat 1% CPU during passive heartbeats. (via iptables caching)

### Deliverable: `BENCHMARKS.md` generated after code diffs.

---

## 2. Safety, Rollout, Rollback

For every change in the top P0 implementations applied to `main`:

### Change 1: Uvicorn Workers + Multi-process Execution
*   **Risk**: Background tasks `run_telemetry_poll_loop`, `reconciliation_loop`, etc., might run multiple times if multiple uvicorn workers boot.
*   **Mitigation**: Use `Redis` distributed locks on background loops to ensure exactly-once execution across workers. For MVP / P0, we will NOT change the default replica count unless requested, but make it configurable in compose via `${WEB_CONCURRENCY:-1}`.
*   **Rollback**: Set `WEB_CONCURRENCY=1`.

### Change 2: Pydantic Config Refactor / Helper extraction
*   **Risk**: Logic regression on config creation causing clients to fail connection.
*   **Mitigation**: Strict validation testing strings byte-for-byte in Python against old payload generation. Unit tests exist.
*   **Rollback**: Git revert of `backend/app/services/admin_issue_service.py`.

### Change 3: Agent Exec Caching
*   **Risk**: Agent fails to restart if a network switch genuinely drops IP Forwarding out of nowhere.
*   **Mitigation**: Provide 60s TTL. Meaning a misconfigured firewall persists for 1 minute before health score degrades instead of 10s. Acceptable tradeoff.
*   **Rollback**: Roll back node agent Docker tag.

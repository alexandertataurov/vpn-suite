# Alert links

Use this mapping to fill/override per-alert links.

| Alert | Runbook | Admin UI | Grafana (placeholder) |
|------|---------|----------|-----------------------|
| HighLatency | `docs/ops/runbook.md` (Troubleshooting) | `/admin` | `https://grafana.example.com/d/vpn-overview` |
| VpnHandshakeAgeHigh | `docs/ops/no-traffic-troubleshooting.md` + `docs/ops/runbook.md` | `/admin/telemetry` | `https://grafana.example.com/d/vpn-overview` |
| VpnHandshakeFreshnessCollapse | `docs/ops/no-traffic-troubleshooting.md` + `docs/ops/runbook.md` | `/admin/telemetry` | `https://grafana.example.com/d/vpn-overview` |
| VpnNodeHealthLow | `docs/ops/runbook.md` + `docs/ops/telemetry-degraded-troubleshooting.md` | `/admin/servers` | `https://grafana.example.com/d/vpn-overview` |
| VpnNodeUnhealthy | `docs/ops/runbook.md` + `docs/ops/telemetry-degraded-troubleshooting.md` | `/admin/servers` | `https://grafana.example.com/d/vpn-overview` |
| VpnNoSchedulableNodes | `docs/ops/runbook.md#vpn-cluster` | `/admin/servers` | `https://grafana.example.com/d/vpn-overview` |

---

## Severity and real vs false-positive review

| Alert | Severity | Real or false-positive? | Notes |
|-------|----------|-------------------------|-------|
| **VpnNoSchedulableNodes** | P1 (critical) | **Real** | No healthy/degraded nodes → scheduler cannot place peers. Check node discovery, agent/control-plane connectivity, and why all nodes are unhealthy. |
| **VpnNodeUnhealthy** | P2 (warning) | **Real** | At least one node has `status=unhealthy` (health_score &lt; 0.5 from control-plane). Driven by unreachable node, failed health check, or low handshake ratio. Not a metric bug. |
| **VpnNodeHealthLow** | P2 (warning) | **Real** | Same signal as above: `vpn_node_health` &lt; 0.5 from topology. Indicates degraded reachability or peer connectivity. |
| **VpnHandshakeFreshnessCollapse** | P2 (warning) | **Mostly real** | Max handshake age &gt; 1h (node-agent metric). Idle peers have no handshake refresh (WireGuard has no keepalive by default). **Real** if you expect active traffic; **benign** if all peers are intentionally idle. |
| **VpnHandshakeAgeHigh** | P2 (warning) | **Mostly real** | Max handshake age &gt; 30m. Same as above: real for active peers, can be acceptable for idle. |
| **HighLatency** | P2 (warning) | **Possible false positive** | p95 over **all** admin-api requests (no path filter). One slow endpoint (e.g. heavy list, export) can trigger. Check Grafana by path; consider scoping to critical paths or raising threshold. |

**Summary:** VPN node and handshake alerts reflect real cluster/peer state. Repeated VpnNodeUnhealthy + VpnNodeHealthLow + VpnNoSchedulableNodes indicate a genuine problem (nodes down, discovery/sync issues, or network). Handshake alerts are real if peers should be active; otherwise treat as informational. HighLatency is the one most likely to be a false positive from a single slow endpoint.

---

## Plan to fix issues triggering alerts

**Owner:** Ops / on-call. **Increments:** one per section below; manual test + rollback note each time.

### Phase 1 — Diagnose (no code change)

1. **Confirm topology source**
   - Check `.env`: `NODE_DISCOVERY=agent` and `NODE_MODE=agent` (production).
   - Run `./manage.sh sanity-check`; fix any mixed docker/agent state.
2. **Why nodes are unhealthy**
   - Admin UI: `/admin/servers` — which servers show unhealthy / missing?
   - Redis: `docker compose exec redis redis-cli KEYS "agent:heartbeat:*"` — which `SERVER_ID`s have recent heartbeats?
   - If agent: on each node run `./manage.sh up-agent` (profile `agent`); check node-agent logs and mTLS to control-plane (8443, `AGENT_ALLOW_CIDRS`).
   - Control-plane: `docker compose logs admin-api --since 30m | rg 'agent|heartbeat|topology|unhealthy'`.
3. **Handshake age**
   - Prometheus: `agent_last_handshake_max_age_seconds` — which instance(s)? Only node-agent targets expose this.
   - If all peers are idle (no traffic): handshake age grows by design; decide whether to relax thresholds or accept as informational.
4. **HighLatency**
   - Grafana/Prometheus: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path_template))` — which path_template(s) drive p95 > 2s?

**Checklist:** Note which servers have heartbeats; which nodes are in topology; which path is slow. **Rollback:** N/A (read-only).

---

### Phase 2 — Fix P1: VpnNoSchedulableNodes

1. **Ensure at least one node is schedulable**
   - Add/fix server in DB so it has `public_key`, `vpn_endpoint`; run `./manage.sh server:sync <server_id>` if key is stale.
   - With agent: ensure node-agent on that server is running and heartbeating; fix network/mTLS/allowlist so control-plane sees it.
   - With docker: ensure AmneziaWG container is running and discoverable; run `POST /api/v1/cluster/scan` if needed (then switch back to agent for prod).
2. **Rebuild topology**
   - Trigger topology refresh (e.g. wait for next node scan / heartbeat cycle, or restart admin-api if safe).
   - Confirm `/admin/servers` shows at least one healthy or degraded node; confirm `vpn_nodes_total{status=~"healthy|degraded"}` ≥ 1.

**Checklist:** VpnNoSchedulableNodes stops firing; new peer can be placed. **Rollback:** Revert server/agent changes; restore previous topology source.

---

### Phase 3 — Fix P2: VpnNodeUnhealthy / VpnNodeHealthLow

1. **Per unhealthy node**
   - Reachability: from control-plane host, curl agent API or docker exec to node (per runbook). Fix network, firewall, agent process.
   - Health score: comes from health check + handshake ratio. If node is reachable but score < 0.5, check last handshake times and peer activity (idle peers lower ratio).
2. **Optional: soften threshold (only if intentional)**
   - Today unhealthy = score < 0.5. Changing this is a product decision; prefer fixing nodes over changing thresholds.

**Checklist:** Unhealthy count drops; health_score ≥ 0.5 for nodes that should be used. **Rollback:** Revert network/agent changes.

---

### Phase 4 — Handshake alerts (VpnHandshakeAgeHigh / VpnHandshakeFreshnessCollapse)

1. **If peers should be active**
   - Fix connectivity/NAT so clients send traffic; handshakes then refresh. See [no-traffic-troubleshooting.md](docs/ops/no-traffic-troubleshooting.md).
   - Option: enable PersistentKeepalive in client config so idle clients still refresh handshakes (runbook/docs).
2. **If peers are intentionally idle**
   - FreshnessCollapse threshold was increased 1h → 2h in `alert_rules.yml` to reduce noise. To relax further (e.g. 4h), edit `agent_last_handshake_max_age_seconds > 7200` and reload Prometheus.
   - Or leave as-is and treat as informational.

**Checklist:** Either handshake age improves for active peers, or thresholds/expectations updated. **Rollback:** Revert alert rule changes and reload Prometheus.

---

### Phase 5 — HighLatency (reduce false positives)

1. **Scope alert to critical paths**
   - In `config/monitoring/alert_rules.yml`, change HighLatency expr to exclude heavy endpoints, e.g.:
     - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{path_template=~"/api/v1/servers.*|/health|/api/v1/cluster.*"}[5m])) by (le)) > 2`
   - Or add a separate rule for a single slow path with a higher threshold.
2. **Reload Prometheus** and confirm no regression on intended coverage.

**Checklist:** HighLatency fires only when critical paths are slow (or disable if not needed). **Rollback:** Revert rule change and reload Prometheus.

---

### Summary table

| Phase | Goal | Main actions |
|-------|------|----------------|
| 1 | Diagnose | sanity-check, heartbeats, topology, handshake metric source, slow path |
| 2 | P1 gone | At least one node heartbeating + schedulable; topology updated |
| 3 | P2 node health | Fix reachability/agent per node; health_score ≥ 0.5 where expected |
| 4 | Handshake | Fix traffic/keepalive or relax/accept handshake thresholds |
| 5 | HighLatency | Scope rule to critical paths (or raise threshold) |

---

[03.03.2026 05:38] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 05:48] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 05:48] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 05:53] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 05:56] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 08:14] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 08:36] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 08:36] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 08:38] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 08:41] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 09:38] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:13] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:14] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:14] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:20] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:21] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:26] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:26] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:31] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 10:34] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:45] AlphaBot: [P2] HighLatency
95th percentile latency > 2s — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:46] AlphaBot: [P2] HighLatency
95th percentile latency > 2s — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:47] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:47] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:47] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:49] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:52] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 11:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 12:05] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 12:05] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 12:46] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 12:47] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 13:28] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 13:29] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 14:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 14:51] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 14:53] AlphaBot: [P1] VpnNoSchedulableNodes
No healthy/degraded VPN nodes are schedulable — Scheduler cannot place new peers. Check node discovery, health, and agent connectivity.
Runbook: https://vpn.vega.llc/docs/ops/runbook.md#vpn-cluster
Dashboard: https://vpn.vega.llc/grafana/d/vpn-overview
[03.03.2026 15:16] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 15:18] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 15:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 16:49] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 16:52] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 17:08] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 17:08] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 17:11] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 17:12] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 18:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:21] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:24] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:26] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:26] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:32] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:33] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 19:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 22:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[03.03.2026 23:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:21] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:23] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:33] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:36] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:41] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:43] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:48] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:51] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:57] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 01:57] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 02:03] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 02:06] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 02:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 03:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:34] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:34] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:37] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:39] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:41] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 04:44] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:07] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:07] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:10] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:13] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:42] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:42] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:44] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:47] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:50] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:50] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:56] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 05:59] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 06:23] AlphaBot: [P2] VpnHandshakeFreshnessCollapse
VPN node handshake max age > 1h (peers may appear offline) — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 07:30] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 07:30] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 07:36] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 07:39] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 07:57] AlphaBot: [P2] VpnHandshakeAgeHigh
VPN handshake age high — Max handshake age > 30 minutes.
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 08:57] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 08:57] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 08:59] AlphaBot: [P2] VpnNodeUnhealthy
At least one VPN node is unhealthy — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)
[04.03.2026 09:02] AlphaBot: [P2] VpnNodeHealthLow
VPN node health is below 0.5 — 
Runbook: (see Alert links above)
Dashboard: (see Alert links above)

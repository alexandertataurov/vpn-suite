# Performance Bottleneck Report

**Audit Date:** 2025-02-21

---

## 1. System Level

### Observed (Snapshot)


| Metric                         | Value                                     |
| ------------------------------ | ----------------------------------------- |
| Load average                   | 1.62, 6.25, 6.76                          |
| Memory                         | 1.9G used / 3.8G total; Swap 1.8G/2G used |
| Disk                           | 25G/40G (65%) on /                        |
| net.core.somaxconn             | 1024                                      |
| net.ipv4.tcp_max_syn_backlog   | 2048                                      |
| net.netfilter.nf_conntrack_max | 65536                                     |
| fs.file-max                    | 200000                                    |
| ulimit -n                      | 1048576                                   |


### Recommendations


| Area      | Finding                | Action                                                                                      |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| Swap      | High swap usage (1.8G) | Investigate memory pressure; add RAM or tune swapiness; NodeSwapHeavy alert; lag→drop incidents often fixable by restart |
| Conntrack | 65536                  | For high connection count (10x VPN peers), consider `net.netfilter.nf_conntrack_max=262144` |
| somaxconn | 1024                   | May limit accept queue; consider 4096+ for high throughput                                  |
| OOM       | Check dmesg            | Monitor OOM kills; ensure containers have memory limits                                     |


---

## 2. VPN Performance (AmneziaWG)


| Parameter       | Value                             | Notes                                       |
| --------------- | --------------------------------- | ------------------------------------------- |
| nofile ulimit   | 51200                             | Set in amnezia-awg2 compose                 |
| MTU             | AWG_MTU env                       | Verify client alignment                     |
| DPI obfuscation | AWG_Jc, Jmin, Jmax, S1, S2, H1–H4 | Overhead; tune per region                   |
| Reconnect burst | -                                 | Kernel WG limits; monitor handshake latency |


### Bottleneck Identification

- **CPU**: AmneziaWG crypto (ChaCha20-Poly1305); monitor per-node CPU
- **Network**: Bandwidth per node; check interface throughput
- **Handshake time**: Use Prometheus `agent_last_handshake_max_age_seconds` when node-agent exposes it

---

## 3. Backend Performance

### API


| Config                    | Value | Notes                            |
| ------------------------- | ----- | -------------------------------- |
| slow_request_threshold_ms | 2000  | Logs api.request.slow above this |
| api_rate_limit_per_minute | 200   | Per-IP global limit              |
| login_rate_limit          | 10    | Per window (900s)                |


### Potential Bottlenecks


| Endpoint / Area        | Finding                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `/api/v1/overview`     | Multiple separate `COUNT` queries; could consolidate                                     |
| `/api/v1/users` (list) | Region filter uses JOIN; ensure indexes on User.devices, Device.server_id, Server.region |
| `/api/v1/servers`      | Batch last_seen fetch (good); pagination with offset can degrade at high offsets         |
| Reconciliation loop    | Runs every 60s; check `reconciliation_interval_seconds` and DB load                      |
| Docker telemetry       | `docker_telemetry_stats_concurrency=8`; may need tuning for many containers              |
| Redis                  | Rate limit + cache; monitor hit rate; connection pool                                    |


### DB Index Recommendations

- `devices.server_id`, `devices.user_id`
- `subscriptions.plan_id`, `subscriptions.status`, `subscriptions.valid_until`
- `server_health_log.server_id`, `server_health_log.ts`
- `audit_log.created_at` (for retention queries)

---

## 4. Control Plane Stability


| Config                                  | Value           |
| --------------------------------------- | --------------- |
| reconciliation_interval_seconds         | 60              |
| agent_heartbeat_ttl_seconds             | 120             |
| topology_cache_ttl_seconds              | 30              |
| control_plane_rebalance_execute_enabled | False (default) |
| control_plane_events_ws_poll_seconds    | 2               |


### Verifications

- Failover: `control_plane_automation_enabled`, rebalance thresholds
- Idempotency: webhook `external_id` dedup; audit logging
- Event stream: WebSocket poll; consider backpressure for high event rate
- Race conditions: Reconciliation uses desired-state from DB; agent applies locally

---

## 5. Monitoring Stack

- Prometheus: scrape admin-api, cadvisor, node-exporter, bot
- Grafana: dashboards; ensure admin password set
- Loki: log aggregation (was Restarting in snapshot)
- cAdvisor: container metrics; full host access—keep internal

---

## 6. 10x Growth Readiness


| Component      | Current         | 10x                                              |
| -------------- | --------------- | ------------------------------------------------ |
| DB             | Single Postgres | Read replica for heavy reads; connection pooling |
| Redis          | Single instance | Redis Cluster or Sentinel                        |
| admin-api      | Single instance | Horizontal scaling behind Caddy                  |
| Reconciliation | 60s interval    | Consider batching; per-server backoff            |
| Node count     | Per env         | Multi-region; agent discovery                    |



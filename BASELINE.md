# Baseline Capture — 2026-02-22

## docker ps
```
72d99db3b1ea vpn-suite-reverse-proxy:local vpn-suite-reverse-proxy-1 Up 7 minutes (healthy) 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 0.0.0.0:8443->8443/tcp, [::]:8443->8443/tcp, 443/udp, 2019/tcp
98b173eb0dd0 vpn-suite-telegram-vpn-bot vpn-suite-telegram-vpn-bot-1 Up 7 minutes (healthy) 127.0.0.1:8090->8090/tcp
e2af147c7d86 vpn-suite-admin-api vpn-suite-admin-api-1 Up 7 minutes (healthy) 127.0.0.1:8000->8000/tcp
175e7b7d6fe7 postgres vpn-suite-postgres-1 Up 7 minutes (healthy) 5432/tcp
d1f6c607ea17 redis vpn-suite-redis-1 Up 7 minutes (healthy) 6379/tcp
1fc3d811bee1 prom/prometheus vpn-suite-prometheus-1 Up 40 minutes 127.0.0.1:19090->9090/tcp
43bd84e50009 vpn-suite-audit-admin-api vpn-suite-audit-admin-api-1 Up About an hour (healthy) 0.0.0.0:18001->8000/tcp, [::]:18001->8000/tcp
bbf7ee1fdc4d vpn-suite-audit-telegram-vpn-bot vpn-suite-audit-telegram-vpn-bot-1 Up 2 seconds (health: starting)
1c4ef5289385 postgres vpn-suite-audit-postgres-1 Up About an hour (healthy) 5432/tcp
9c0856343a58 vpn-suite-node-agent vpn-suite-node-agent-1 Up About an hour (healthy) 9105/tcp
f4cdd62775da containrrr/watchtower watchtower Up About an hour (healthy) 8080/tcp
a9568e1f38af gcr.io/cadvisor/cadvisor vpn-suite-cadvisor-1 Up 40 minutes (healthy) 127.0.0.1:8080->8080/tcp
093f35636646 prom/node-exporter vpn-suite-node-exporter-1 Up 40 minutes 127.0.0.1:9100->9100/tcp
94770f42ad38 grafana/grafana vpn-suite-grafana-1 Up 40 minutes 127.0.0.1:3000->3000/tcp
ccde81c7d12e grafana/loki vpn-suite-loki-1 Up 40 minutes 127.0.0.1:3100->3100/tcp
7cb517fcfebd amnezia-awg2 amnezia-awg2 Up About an hour 0.0.0.0:40498->40498/udp, [::]:40498->40498/udp
d123e1a28aaf quay.io/outline/shadowbox:stable shadowbox Up About an hour
...
```

## docker inspect (summarized)
- amnezia-awg2: image `amnezia-awg2`, privileged, NET_ADMIN, exposes UDP 40498, network bridge.
- shadowbox: image `quay.io/outline/shadowbox:stable`, network_mode=host, mounts `/opt/outline/persisted-state`, env `SB_API_PORT=25432`.
- prometheus: binds `./config/monitoring/discovery/targets.json:/etc/prometheus/targets.json:ro`.
- node-exporter: binds `/` to `/host`.
- cadvisor: binds `/var/run`, `/var/lib/docker` etc.
- node-agent: env includes `NODE_DISCOVERY=agent`, `OUTLINE_MANAGER_URL=https://vpn.vega.llc/outline-api/`.

## docker logs --tail=300
- discovery service: not running (no container present).
- telemetry/poller: not running (no `outline-poller` container present).
- prometheus: normal startup.
- node-exporter: normal startup.
- cadvisor: docker API mismatch: `client version 1.41 is too old. Minimum supported API version is 1.44`.
- amnezia-awg2: `docker logs` not available (`LogConfig.Type=none`).
- shadowbox: Outline server up; outline-ss-server metrics at `127.0.0.1:9092`.

## Host signals
### ip link
```
lo, eth0, docker0, amn0, multiple docker bridges/veths (no wg/awg interfaces on host)
```

### ss -lntup
- UDP 40498 (AWG port) via docker-proxy.
- TCP 25432 (Outline manager).
- TCP 9092 (outline-ss metrics) bound to 127.0.0.1.

### wg show all dump
```
/bin/bash: line 1: wg: command not found
```

## Prometheus health
### /api/v1/targets
- `admin-api`, `cadvisor`, `node-exporter` are up.
- `outline-poller` target down (DNS lookup failure).
- Missing targets: `node-agent`, `telegram-vpn-bot`, `outline-ss`, `wg-exporter`.

### /service-discovery
- UI loads; no JSON output without UI access.

## Discovery outputs
- `config/monitoring/discovery/inventory.json` has `nodes: []`.
- `config/monitoring/discovery/mapping.json` unresolved (confidence 0.0).

---

# Issue Classification (Evidence + Label)
1. **Discovery gaps**: discovery-runner not running; inventory nodes empty; mapping unresolved.
2. **Correlation failures**: mapping.json unresolved with `evidence: no_match`.
3. **Telemetry gaps**: missing file_sd targets for node-agent/telegram/outline-ss.
4. **Scrape failures**: outline-poller target down (DNS lookup failure).
5. **Staleness**: targets.json static and missing dynamic targets; no TTL cleanup.
6. **Data contract drift**: discovery output lacks `confidence`/`evidence` fields at top level.
7. **Misclassification**: backend + node-agent use container name prefixes as primary signals.

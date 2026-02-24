# Baseline Capture — 2026-02-22

## docker ps
```
72d99db3b1ea vpn-suite-reverse-proxy:local vpn-suite-reverse-proxy-1 Up 7 minutes (healthy) 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 0.0.0.0:8443->8443/tcp, [::]:8443->8443/tcp, 443/udp, 2019/tcp
98b173eb0dd0 vpn-suite-telegram-vpn-bot vpn-suite-telegram-vpn-bot-1 Up 7 minutes (healthy) 127.0.0.1:8090->8090/tcp
e2af147c7d86 vpn-suite-admin-api vpn-suite-admin-api-1 Up 7 minutes (healthy) 127.0.0.1:8000->8000/tcp
175e7b7d6fe7 postgres vpn-suite-postgres-1 Up 7 minutes (healthy) 5432/tcp
d1f6c607ea17 redis vpn-suite-redis-1 Up 6379/tcp
1fc3d811bee1 prom/prometheus vpn-suite-prometheus-1 Up 40 minutes 127.0.0.1:19090->9090/tcp
...
```

## docker inspect (summarized)
- amnezia-awg2: image `amnezia-awg2`, privileged, NET_ADMIN, exposes UDP 40498, network bridge.
- prometheus: binds `./config/monitoring/discovery/targets.json:/etc/prometheus/targets.json:ro`.
- node-exporter: binds `/` to `/host`.
- cadvisor: binds `/var/run`, `/var/lib/docker` etc.
- node-agent: env includes `NODE_DISCOVERY=agent`.

## docker logs --tail=300
- discovery service: not running (no container present).
- telemetry/poller: not running.
- prometheus: normal startup.
- node-exporter: normal startup.
- cadvisor: docker API mismatch: `client version 1.41 is too old. Minimum supported API version is 1.44`.
- amnezia-awg2: `docker logs` not available (`LogConfig.Type=none`).

## Host signals
### ip link
```
lo, eth0, docker0, amn0, multiple docker bridges/veths (no wg/awg interfaces on host)
```

### ss -lntup
- UDP 40498 (AWG port) via docker-proxy.

## Prometheus health
### /api/v1/targets
- `admin-api`, `cadvisor`, `node-exporter` are up.
- Missing targets: `node-agent`, `telegram-vpn-bot`, `wg-exporter`.

## Discovery outputs
- `config/monitoring/discovery/inventory.json` has `nodes: []`.
- `config/monitoring/discovery/mapping.json` unresolved (confidence 0.0).

---

# Issue Classification (Evidence + Label)
1. **Discovery gaps**: discovery-runner not running; inventory nodes empty; mapping unresolved.
2. **Correlation failures**: mapping.json unresolved with `evidence: no_match`.
3. **Telemetry gaps**: missing file_sd targets for node-agent/telegram.
4. **Staleness**: targets.json static and missing dynamic targets; no TTL cleanup.
5. **Data contract drift**: discovery output lacks `confidence`/`evidence` fields at top level.
6. **Misclassification**: backend + node-agent use container name prefixes as primary signals.

# Server Logs Report
**Generated:** 2026-02-21 | **Fixes applied:** Loki + node-agent

## Summary

| Service        | Status       | Notes                         |
|----------------|-------------|-------------------------------|
| admin-api      | Healthy     | OK                            |
| reverse-proxy  | Healthy     | Minor warnings                |
| postgres       | Healthy     | OK                            |
| redis          | Healthy     | OK                            |
| telegram-vpn-bot | Healthy   | OK (no recent activity)       |
| node-agent     | Healthy     | Fixed (run as root to read certs) |
| loki           | Healthy     | Fixed (run as root for rules dir) |
| prometheus     | Created     | Not started                   |
| grafana        | Up          | OK                            |
| promtail       | Up          | OK                            |
| cadvisor       | Healthy     | OK                            |
| node-exporter  | Up          | OK                            |

---

## Critical Issues

### 1. Loki — Restart loop (FIXED)
**Cause:** `mkdir /tmp/loki/rules: permission denied`  
**Module:** ruler-storage

Loki runs as non-root; the `loki_data` volume is root-owned and Loki could not create `/tmp/loki/rules`.

**Fix applied:** `user: "0"` in docker-compose so Loki runs as root and can create the rules directory.

### 2. Node-agent — Unhealthy (FIXED)
**Error:** `('Connection aborted.', PermissionError(13, 'Permission denied'))`  

**Root cause:** Agent cert files (600 root-only) were unreadable by non-root container user.

**Fix applied:** `user: "0"` in docker-compose so node-agent runs as root and can read the mTLS client certs.

---

## Warnings

### Reverse-proxy (Caddy)
- **PKI:** `failed to install root certificate` — `tee: exit status 1` (non-fatal in read-only container).
- **Incomplete response:** `/api/v1/servers/stream` — `reading: context canceled` (client disconnects before SSE completes; normal for long-lived streams).

### Admin API
- No errors; health checks and API calls return 200.
- Dashboard and outline-api calls succeed (~440–700 ms).

---

## Services OK

- **Postgres:** Running, checkpoints normal.
- **Redis:** Ready, 3 keys loaded.
- **admin-api:** Health and API requests succeed.
- **reverse-proxy:** Serving; TLS and SNI configured.
- **telegram-vpn-bot:** Healthy; no recent logs.
- **cadvisor, node-exporter, promtail, grafana:** Up and functioning.

---

## Recommendations

1. **Loki:** Add a writable volume for `/tmp/loki` or change `path_prefix`/`rules_directory` to a mounted path with correct permissions.
2. **Node-agent:** Diagnose mTLS connectivity and permissions to the control plane.
3. **Prometheus:** Start the container if monitoring is required (`docker compose up -d prometheus` with the `monitoring` profile).

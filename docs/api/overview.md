# API overview

Base URL: `https://$PUBLIC_DOMAIN` (or `http://localhost:8000` in dev).

Agent (mTLS): `https://$PUBLIC_DOMAIN:8443/api/v1/agent/*` (client cert + `X-Agent-Token`).

OpenAPI: `openapi/openapi.json` or `openapi/openapi.yaml` (generate: `./manage.sh openapi`).

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login → access + refresh tokens |
| POST | `/api/v1/auth/logout` | Logout (invalidate refresh) |
| POST | `/api/v1/auth/refresh` | Refresh → new tokens |
| POST | `/api/v1/auth/totp/setup` | Enable TOTP (JWT) |
| POST | `/api/v1/auth/totp/disable` | Disable TOTP (JWT) |

Admin endpoints use **Bearer** access token. Bot: `X-API-Key`.

---

## Admin (JWT)

### Overview & dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/overview` | Dashboard stats |
| GET | `/api/v1/overview/dashboard_timeseries` | Timeseries metrics |
| GET | `/api/v1/overview/connection_nodes` | Connection nodes |
| GET | `/api/v1/overview/health-snapshot` | Health snapshot |
| GET | `/api/v1/overview/operator` | Operator overview |
| GET | `/api/v1/dashboard/operator` | Operator dashboard |
| GET | `/api/v1/analytics/telemetry/services` | Telemetry services list |

### Cluster

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/cluster/topology` | Cluster topology |
| GET | `/api/v1/cluster/nodes` | Cluster nodes |
| GET | `/api/v1/cluster/health` | Cluster health |
| POST | `/api/v1/cluster/nodes/{id}/drain` | Drain node |
| POST | `/api/v1/cluster/nodes/{id}/undrain` | Undrain node |
| POST | `/api/v1/cluster/scan` | Trigger scan |
| POST | `/api/v1/cluster/resync` | Trigger resync |

### Control-plane

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/control-plane/topology/summary` | Topology summary |
| GET | `/api/v1/control-plane/topology/graph` | Topology graph |
| POST | `/api/v1/control-plane/placement/simulate` | Placement simulation |
| GET/POST | `/api/v1/control-plane/latency-probes` | Latency probes |
| POST | `/api/v1/control-plane/rebalance/plan` | Rebalance plan |
| POST | `/api/v1/control-plane/failover/evaluate` | Failover evaluation |
| GET/POST/PATCH | `/api/v1/control-plane/ip-pools` | IP pools |
| GET/POST/PATCH | `/api/v1/control-plane/port-allocations` | Port allocations |
| GET/PUT | `/api/v1/control-plane/throttling/policies` | Throttling policies |
| POST | `/api/v1/control-plane/throttling/apply` | Apply throttling |
| GET | `/api/v1/control-plane/metrics/{business,security,anomaly}` | Metrics |
| GET | `/api/v1/control-plane/events` | Control-plane events |
| GET | `/api/v1/control-plane/automation/status` | Automation status |
| POST | `/api/v1/control-plane/automation/run` | Run automation |

### Servers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/servers` | List servers |
| GET | `/api/v1/servers/stream` | SSE stream |
| POST | `/api/v1/servers` | Create server |
| PATCH | `/api/v1/servers/bulk` | Bulk update |
| GET | `/api/v1/servers/snapshots/summary` | Snapshots summary |
| GET | `/api/v1/servers/device-counts` | Device counts |
| GET | `/api/v1/servers/telemetry/summary` | Telemetry summary |
| GET | `/api/v1/servers/{id}` | Server details |
| PATCH | `/api/v1/servers/{id}` | Update server |
| DELETE | `/api/v1/servers/{id}` | Delete server |
| GET | `/api/v1/servers/{id}/status` | Cached status |
| GET | `/api/v1/servers/{id}/health` | Health check |
| POST | `/api/v1/servers/{id}/restart` | Restart (confirm_token) |
| GET | `/api/v1/servers/{id}/capabilities` | Capabilities |
| GET/PATCH | `/api/v1/servers/{id}/limits` | Limits |
| GET | `/api/v1/servers/{id}/cert-status` | Cert status |
| GET/POST/PATCH/DELETE | `/api/v1/servers/{id}/ips` | Server IPs |
| POST | `/api/v1/servers/{id}/sync` | Trigger sync |
| GET | `/api/v1/servers/{id}/sync/{job_id}` | Sync job status |
| GET | `/api/v1/servers/{id}/snapshot` | Last snapshot |
| POST | `/api/v1/servers/{id}/actions` | Create action |
| GET | `/api/v1/servers/{id}/actions` | List actions |
| GET | `/api/v1/servers/{id}/peers-sync` | Peers sync diff |
| GET | `/api/v1/servers/{id}/peers` | Server peers |
| POST | `/api/v1/servers/{id}/peers` | Create peer |
| POST | `/api/v1/servers/{id}/peers/{pid}/rotate` | Rotate peer |
| POST | `/api/v1/servers/{id}/peers/{pid}/revoke` | Revoke peer |
| POST | `/api/v1/servers/{id}/peers/block` | Block peer |
| POST | `/api/v1/servers/{id}/peers/reset` | Reset peer |
| GET | `/api/v1/servers/{id}/logs` | Server logs |
| GET | `/api/v1/servers/{id}/telemetry` | Server telemetry |

### Peers & WG

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/peers` | List peers |
| GET | `/api/v1/peers/{id}` | Peer details |
| POST | `/api/v1/peers/{id}/migrate` | Migrate peer |
| POST | `/api/v1/wg/peer` | Create WG peer |
| DELETE | `/api/v1/wg/peer/{pubkey}` | Delete WG peer |

### Actions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/actions/{id}` | Action details |

### Admin configs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/configs/issued/{id}/content` | Issued config content |
| GET | `/api/v1/admin/configs/{token}/download` | Config download (token) |
| GET | `/api/v1/admin/configs/{token}/qr` | Config QR (token) |

### Users, devices, plans, subscriptions, payments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | List users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/by-tg/{tg_id}` | User by Telegram id |
| GET | `/api/v1/users/{id}` | User details |
| PATCH | `/api/v1/users/{id}` | Update user |
| GET | `/api/v1/users/{id}/devices` | User devices |
| POST | `/api/v1/users/{id}/devices/issue` | Issue profile |
| GET | `/api/v1/devices` | List devices |
| POST | `/api/v1/devices/bulk-revoke` | Bulk revoke |
| POST | `/api/v1/devices/{id}/revoke` | Revoke device |
| POST | `/api/v1/devices/{id}/suspend` | Suspend device |
| PATCH | `/api/v1/devices/{id}/limits` | Update device limits |
| POST | `/api/v1/devices/{id}/resume` | Resume device |
| POST | `/api/v1/devices/{id}/reset` | Reset device |
| POST | `/api/v1/devices/{id}/block` | Block peer |
| GET | `/api/v1/plans` | List plans |
| POST | `/api/v1/plans` | Create plan |
| GET | `/api/v1/plans/{id}` | Plan details |
| PATCH | `/api/v1/plans/{id}` | Update plan |
| GET | `/api/v1/subscriptions` | List subscriptions |
| POST | `/api/v1/subscriptions` | Create subscription |
| GET | `/api/v1/subscriptions/{id}` | Subscription details |
| PATCH | `/api/v1/subscriptions/{id}` | Update subscription |
| GET | `/api/v1/payments` | List payments |

### Telemetry (Docker)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/telemetry/docker/hosts` | Docker hosts |
| GET | `/api/v1/telemetry/docker/containers` | Containers (`host_id` filter) |
| GET | `/api/v1/telemetry/docker/container/{id}/metrics` | Container metrics |
| GET | `/api/v1/telemetry/docker/container/{id}/logs` | Container logs |
| GET | `/api/v1/telemetry/docker/alerts` | Docker alerts |

### Audit & log

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/audit` | Audit log |
| POST | `/api/v1/log/frontend-error` | Frontend error (rate-limited) |

---

## Bot (X-API-Key)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/bot/subscriptions/create-or-get` | Create or get subscription |
| POST | `/api/v1/bot/payments/{provider}/create-invoice` | Create invoice |
| GET | `/api/v1/bot/payments/{id}/invoice` | Get invoice |
| POST | `/api/v1/bot/devices/{id}/revoke` | Revoke device |
| POST | `/api/v1/bot/events` | Bot events |
| GET | `/api/v1/bot/referral/my-link` | Referral link |
| POST | `/api/v1/bot/referral/attach` | Attach referral |
| POST | `/api/v1/bot/promo/validate` | Validate promo |
| GET | `/api/v1/bot/referral/stats` | Referral stats |

---

## Webapp (initData / Bearer session)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/webapp/auth` | Auth (initData) |
| GET | `/api/v1/webapp/me` | Current user |
| GET | `/api/v1/webapp/plans` | Plans |
| POST | `/api/v1/webapp/devices/issue` | Issue device |
| POST | `/api/v1/webapp/devices/{id}/revoke` | Revoke device |
| GET | `/api/v1/webapp/referral/my-link` | Referral link |
| GET | `/api/v1/webapp/referral/stats` | Referral stats |
| POST | `/api/v1/webapp/promo/validate` | Validate promo |
| POST | `/api/v1/webapp/payments/create-invoice` | Create invoice |

---

## Agent (X-Agent-Token, mTLS)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/agent/heartbeat` | Heartbeat |
| GET | `/api/v1/agent/desired-state` | Desired state |
| GET | `/api/v1/agent/v1/status` | Status |
| GET | `/api/v1/agent/v1/telemetry` | Telemetry |
| GET | `/api/v1/agent/v1/peers` | Peers |
| POST | `/api/v1/agent/v1/actions/execute` | Execute action |
| GET | `/api/v1/agent/v1/actions/poll` | Poll actions |
| POST | `/api/v1/agent/v1/actions/report` | Report result |

---

## Webhooks (no JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/payments/{provider}` | Payment webhook (e.g. `telegram_stars`). Idempotent. Header `X-Telegram-Bot-Api-Secret-Token` for telegram_stars. |

---

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/health/ready` | Readiness (DB + Redis + cluster) |
| GET | `/metrics` | Prometheus |
| GET | `/openapi.json` | OpenAPI JSON |

---

## Compatibility

`/api/telemetry/docker/*` (without `/v1`) — compatibility aliases, hidden from OpenAPI.

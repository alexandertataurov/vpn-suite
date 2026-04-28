# As-Built API Spec

Repository-aligned API inventory for the current codebase.

## API families

| Family | Auth | Base path | Current purpose |
|--------|------|-----------|-----------------|
| Admin JWT API | Bearer JWT | `/api/v1/*` | Operator CRUD, telemetry, cluster, devices, billing, audit, automation |
| Bot API | `X-API-Key` | `/api/v1/bot/*` | Subscription, payments, device issuance/revoke, events, referrals, promo, trial |
| WebApp API | Bearer session | `/api/v1/webapp/*` | Telegram WebApp auth, plan/device/self-service |
| Agent API | mTLS + `X-Agent-Token` | `/api/v1/agent/*` | Heartbeat, desired state, actions, telemetry, peer inventory |
| Webhooks | Provider secret validation | `/webhooks/*` | Payment provider ingress |
| Observability | None / internal | `/metrics`, `/health`, `/health/ready` | Monitoring and readiness |

## Admin JWT API groups

| Router | Base path | Purpose |
|--------|-----------|---------|
| `auth.py` | `/api/v1/auth/*` | Login, refresh, TOTP |
| `overview.py` | `/api/v1/overview*` | Dashboard summaries |
| `audit.py` | `/api/v1/audit*` | Audit visibility |
| `cluster.py` | `/api/v1/cluster/*` | Topology, nodes, health, scan, resync, drain/undrain |
| `control_plane.py` | `/api/v1/control-plane/*` | Placement, failover eval, topology graph, IP pools, port allocations, throttling, metrics, automation |
| `servers*.py` | `/api/v1/servers*` | Server CRUD, peers, stream, sync, actions, telemetry |
| `devices.py` | `/api/v1/devices*` | Device lifecycle and issue/revoke surfaces |
| `wg.py` | `/api/v1/wg/*` | Raw WG peer provisioning endpoints |
| `peers.py` | `/api/v1/peers*` | Peer-centric control endpoints |
| `plans.py`, `subscriptions.py`, `payments.py` | `/api/v1/*` | Billing, plans, subscriptions |
| `admin_news.py` | `/api/v1/admin/news/*` | Operator news campaigns, targeted broadcasts, direct Telegram messages, broadcast status/history |
| `admin_grants.py` | `/api/v1/admin/grants/*` | Manual trial, subscription extension, and user-scoped discount grants |
| `admin_configs.py` | `/api/v1/admin/configs/*` | Tokenized config download and QR access |
| `live_metrics.py`, `telemetry_*`, `servers_stream.py` | `/api/v1/*` | Near-real-time and telemetry endpoints |

## Cluster and control-plane contract surface

### Cluster endpoints

- `GET /cluster/topology`
- `GET /cluster/nodes`
- `GET /cluster/health`
- `POST /cluster/nodes/{node_id}/drain`
- `POST /cluster/nodes/{node_id}/undrain`
- `POST /cluster/scan`
- `POST /cluster/resync`

### Control-plane endpoints

- `GET /control-plane/topology/summary`
- `GET /control-plane/topology/graph`
- `POST /control-plane/placement/simulate`
- `POST /control-plane/rebalance/plan`
- `POST /control-plane/failover/evaluate`
- `GET|POST|PATCH /control-plane/ip-pools*`
- `GET|POST|PATCH /control-plane/port-allocations*`
- `GET|PUT /control-plane/throttling/policies*`
- `POST /control-plane/throttling/apply`
- `GET /control-plane/metrics/{business,security,anomaly}`
- `GET /control-plane/events`
- `WS /control-plane/events/ws`
- `GET /control-plane/automation/status`
- `POST /control-plane/automation/run`

## Provisioning contract surface

### Raw WG endpoints

- `POST /wg/peer`
- `DELETE /wg/peer/{pubkey}`

### Other issuance entrypoints in current repo

- Admin/operator issue and rotate flows in `servers_peers.py` and `devices.py`
- WebApp issuance flow in `webapp.py`
- Bot device issuance/revoke flows in `bot.py`

## Customer communications and grants

- `POST /admin/news/broadcast` queues a Redis-backed Telegram broadcast. Legacy all-user payloads still work; new payloads may include `target.kind` of `all`, `filters`, `user_ids`, or `tg_ids`.
- `GET /admin/news/broadcast/{broadcast_id}` and `GET /admin/news/broadcasts` expose delivery status and recent campaign history for operators.
- `POST /admin/news/direct` sends a server-side Telegram message to one user; the admin frontend never calls Telegram directly.
- `POST /admin/grants/trial`, `POST /admin/grants/extension`, and `POST /admin/grants/discount` apply manual retention/support grants and write entitlement/audit records.

## Agent API surface

| Endpoint | Direction | Purpose |
|----------|-----------|---------|
| `POST /agent/heartbeat` | Agent -> control plane | Node heartbeat, key runtime metadata, status |
| `GET /agent/desired-state` | Agent <- control plane | Desired peers and node state |
| `GET /agent/v1/status` | Agent <- control plane | Current node status contract |
| `GET /agent/v1/telemetry` | Agent <- control plane | Telemetry pull |
| `GET /agent/v1/peers` | Agent <- control plane | Desired/runtime peer listing contract |
| `POST /agent/v1/actions/execute` | Agent -> control plane | Action execution update |
| `GET /agent/v1/actions/poll` | Agent <- control plane | Action polling |
| `POST /agent/v1/actions/report` | Agent -> control plane | Action result/report |

## Bot API surface

Current bot-facing contract includes:

- Subscription create/get.
- Invoice creation and invoice retrieval.
- Telegram Stars confirmation.
- Device revoke.
- Analytics event ingest.
- Referral link, attach, and stats.
- Promo validation.
- Trial start.
- Churn survey.

The bot is cluster-agnostic and must remain dependent on Admin API rather than WG runtime control.

## WebApp API surface

Current webapp-facing contract includes:

- Telegram `initData` bootstrap and bearer session issuance.
- Plan browsing and checkout-related flows.
- Device issue/revoke and self-service profile management.
- Referral/profile flows.

## Config delivery API surface

Current tokenized config delivery exists in two shapes:

- `GET /api/v1/admin/configs/{token}/download`
- `GET /api/v1/admin/configs/{token}/qr`
- `GET /d/{token}` public single-use download path for opaque tokens

## Observability and streaming

- `GET /metrics`
- `GET /health`
- `GET /health/ready`
- `GET /api/v1/servers/stream`
- Additional near-real-time and polling telemetry endpoints in `live_metrics.py`, `servers_telemetry.py`, `telemetry_snapshot.py`, and `telemetry_docker.py`

## Current compatibility notes

- `/api/telemetry/docker/*` remains as a compatibility alias for `/api/v1/telemetry/docker/*`.
- Non-versioned health and metrics endpoints are intentionally outside `/api/v1`.
- Agent HTTP API is the active contract. `proto/node_agent.proto` exists as a spec artifact, not the deployed primary path.

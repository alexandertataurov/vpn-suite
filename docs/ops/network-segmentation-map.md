# Network Segmentation Map

**Purpose:** Zero-trust infrastructure model for commercial VPN operator.

---

## Zones

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     PUBLIC EDGE (DMZ)                        │
                    │  Caddy :80/:443  │    │  Admin UI      │
                    └───────────────────────────┬─────────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────────┐
                    │                   APPLICATION LAYER                          │
                    │  admin-api :8000  │  telegram-vpn-bot :8090                  │
                    │  (localhost only) │  (localhost only; webhook via Caddy)     │
                    └───────────────────────────┬─────────────────────────────────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────────────────────┐
        │                                       │                                   │
        ▼                                       ▼                                   ▼
┌───────────────┐                     ┌─────────────────┐                 ┌─────────────────┐
│  DATA LAYER   │                     │ MONITORING      │                 │  AGENT / mTLS   │
│  Postgres     │                     │ Prometheus 19090*│                │  :8443 (mTLS)   │
│  Redis        │                     │ Grafana 3000    │                 │  Node-agents    │
│  (internal)   │                     │ Loki 3100       │                 │  AmneziaWG      │
└───────────────┘                     │ (127.0.0.1)     │                 └─────────────────┘
                                      └─────────────────┘
```

---

## Port Matrix

| Port | Service | Binding | Zone |
|------|---------|---------|------|
| 80 | Caddy HTTP→HTTPS | 0.0.0.0 | Public Edge |
| 443 | Caddy HTTPS | 0.0.0.0 | Public Edge |
| 8443 | Agent mTLS | 0.0.0.0 | Application (mTLS required) |
| 8000 | admin-api | 127.0.0.1 | Application |
| 8090 | Bot | 127.0.0.1 | Application |
| 5432 | Postgres | internal | Data |
| 6379 | Redis | internal | Data |
| 19090 | Prometheus (host port) | 127.0.0.1 | Monitoring; PROMETHEUS_HOST_PORT |
| 3000 | Grafana | 127.0.0.1 | Monitoring |
| 8080 | cAdvisor | 127.0.0.1 | Monitoring |
| 9100 | node-exporter | 127.0.0.1 | Monitoring |
| 3100 | Loki | 127.0.0.1 | Monitoring |

---

## Segmentation Rules

### Mandatory

1. **DB and Redis**: Never on host ports; Docker network only.
2. **Prometheus host port**: Use `PROMETHEUS_HOST_PORT` (default `19090`) to avoid collisions with other local Prometheus instances.
2. **Monitoring**: All bind to 127.0.0.1; access via SSH tunnel or VPN.
3. **Control-plane API**: Reached only via Caddy (no direct 8000 exposure).
4. **Agent API**: mTLS + optional AGENT_ALLOW_CIDRS.

### Block Metadata

Block outbound to cloud metadata endpoints (prevents SSRF / instance credential theft):

```
169.254.169.254 (AWS, GCP, Azure, etc.)
169.254.170.2 (AWS ECS)
```

**Implementation:** Run `./ops/block-metadata-endpoints.sh`

---

## Docker Networks

| Network | Purpose |
|---------|---------|
| vpn-suite-app | admin-api, reverse-proxy, bot |
| vpn-suite-db | admin-api, postgres, redis, bot |

---

## Traffic Flow

| Source | Target | Path |
|--------|--------|------|
| Internet | Admin UI | Caddy:443 → file_server /admin/* |
| Internet | Admin API | Caddy:443 → reverse_proxy admin-api:8000 |
| Internet | Bot webhook | Caddy:443 → reverse_proxy bot:8090 (if exposed) |
| Node-agents | Control-plane | Caddy:8443 (mTLS) → admin-api:8000 |
| admin-api | Postgres/Redis | Docker network |

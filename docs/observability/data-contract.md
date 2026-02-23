# Unified Outline + AmneziaWG Data Contract

## Purpose
Define how Outline (Shadowbox) data and AmneziaWG (AWG) telemetry are unified into a single observability layer without changing existing APIs.

## Entities

### 1) Server (AWG control-plane)
- Source: Postgres `servers` table (`backend/app/models/server.py`).
- Primary ID: `servers.id` (string, 32 chars).
- Key fields:
  - `name`, `region`, `api_endpoint`, `vpn_endpoint`, `public_key`, `status`, `health_score`, `max_connections`, `integration_type`.

### 2) Device (AWG peer)
- Source: Postgres `devices` table.
- Primary ID: `devices.id`.
- Key fields:
  - `server_id`, `public_key`, `issued_at`, `revoked_at`, `outline_key_id` (optional).

### 3) AgentHeartbeat (AWG runtime snapshot)
- Source: Redis key `agent:hb:{server_id}`.
- Produced by: `node-agent`.
- Key fields:
  - `server_id`, `container_name`, `interface_name`, `public_key`, `listen_port`,
  - `peer_count`, `total_rx_bytes`, `total_tx_bytes`, `health_score`, `status`, `ts_utc`.
  - `peers[]`: list of {public_key, allowed_ips, last_handshake_age_sec, rx_bytes, tx_bytes, endpoint?}.

### 4) OutlineServer (Shadowbox)
- Source: Outline Shadowbox API `/server`.
- Primary ID: `serverId`.
- Key fields:
  - `name`, `serverId`, `metricsEnabled`, `portForNewAccessKeys`, `hostnameForAccessKeys`.

### 5) OutlineAccessKey
- Source: Outline Shadowbox API `/access-keys`.
- Primary ID: `id`.
- Key fields:
  - `id`, `name`, `port`, `encryptionMethod`, `dataLimit`.

### 6) OutlineMetrics
- Source A: Outline embedded metrics at `outline-ss-server` (`http://127.0.0.1:9092/metrics`).
- Source B: Outline API `/experimental/server/metrics` (optional, best-effort).

## Links / Relationships

### Device ↔ OutlineAccessKey
- `devices.outline_key_id` is the canonical link to Outline access key `id`.
- Ground truth: Postgres `devices.outline_key_id`.

### Server ↔ OutlineServer
- `servers.integration_type = outline` indicates an Outline host stored in the servers registry.
- Mapping is loose and best-effort:
  - Match Outline hostname to `server_ips.ip` or `servers.vpn_endpoint` host.
  - If no match, keep unlinked unless `mapping.json` override provides an explicit link.
- Ground truth: `servers` table for AWG servers; Outline API for Outline server identity.

## Ground Truth vs Derived

### Ground Truth
- Postgres: `servers`, `devices`, `server_ips`.
- Redis: `agent:hb:{server_id}` for runtime state in agent mode.
- Outline API: `/server`, `/access-keys`.
- Outline metrics endpoint: `outline-ss-server` (`9092`).

### Derived
- Peer online/offline counts (from heartbeat peer list and handshake ages).
- Linkage between Outline server and AWG server (from hostname/IP matches or overrides).
- Prometheus aggregate metrics (poller and exporters).

## Mapping Files

### `config/monitoring/discovery/mapping.json`
- Generated periodically by inventory service.
- Example schema:
  ```json
  {
    "outline": {
      "server_id": "5c278441-cdea-40c1-b5c5-63366167870d",
      "hostname": "185.139.228.171",
      "matched_server_id": "vpn-node-1",
      "match_reason": "hostname->server_ips.ip"
    }
  }
  ```

### `config/monitoring/discovery/overrides.json`
- Optional, operator-maintained overrides.
- Example schema:
  ```json
  {
    "outline": {
      "matched_server_id": "vpn-node-1",
      "match_reason": "operator_override"
    }
  }
  ```
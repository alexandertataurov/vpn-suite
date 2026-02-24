# AmneziaWG Data Contract

## Purpose
Define how AmneziaWG (AWG) telemetry is exposed in the observability layer.

## Entities

### 1) Server (AWG control-plane)
- Source: Postgres `servers` table (`backend/app/models/server.py`).
- Primary ID: `servers.id` (string, 32 chars).
- Key fields:
  - `name`, `region`, `api_endpoint`, `vpn_endpoint`, `public_key`, `status`, `health_score`, `max_connections`.

### 2) Device (AWG peer)
- Source: Postgres `devices` table.
- Primary ID: `devices.id`.
- Key fields:
  - `server_id`, `public_key`, `issued_at`, `revoked_at`.

### 3) AgentHeartbeat (AWG runtime snapshot)
- Source: Redis key `agent:hb:{server_id}`.
- Produced by: `node-agent`.
- Key fields:
  - `server_id`, `container_name`, `interface_name`, `public_key`, `listen_port`,
  - `peer_count`, `total_rx_bytes`, `total_tx_bytes`, `health_score`, `status`, `ts_utc`.
  - `peers[]`: list of {public_key, allowed_ips, last_handshake_age_sec, rx_bytes, tx_bytes, endpoint?}.

## Ground Truth vs Derived

### Ground Truth
- Postgres: `servers`, `devices`, `server_ips`.
- Redis: `agent:hb:{server_id}` for runtime state in agent mode.

### Derived
- Peer online/offline counts (from heartbeat peer list and handshake ages).
- Prometheus aggregate metrics (exporters).

# Discovery Data Contract

Deterministic VPN server discovery. **No container names used.** Classification via image digest, entrypoint, ports, mounts, env, labels.

## inventory.json

```json
{
  "timestamp": "2025-02-22T12:00:00+00:00",
  "nodes": [
    {
      "host_id": "local",
      "node_id": "docker:abc123def456",
      "source": "docker",
      "kind": "awg",
      "classification": {
        "kind": "awg",
        "type": "awg-node",
        "fingerprint_score": 1.0,
        "network_score": 0.9,
        "total_confidence": 0.95,
        "evidence": ["image_amnezia", "port_wg_udp", "mount_tun"]
      },
      "confidence": 0.95,
      "evidence": ["image_amnezia", "port_wg_udp", "mount_tun"],
      "container_id": "abc123def456",
      "image": "amneziavpn/amneziawg-go:latest",
      "created": "2025-02-20T10:00:00.000Z",
      "ports": [{"port": 51820, "protocol": "udp"}],
      "mounts": ["/dev/net/tun", "/etc/amnezia/amneziawg"],
      "interface": null,
      "public_key": null
    }
  ],
  "outline_info": { "serverId": "...", "hostnameForAccessKeys": "...", "portForNewAccessKeys": 58294 }
}
```

| Field | Type | Description |
|-------|------|-------------|
| node_id | string | Stable ID: `docker:{id}` or `host:{interface}`. Survives rename. |
| kind | string | `awg` \| `outline` \| `host_wg` \| `unknown` |
| confidence | float | 0–1 confidence for top-level classification. |
| evidence | string[] | Evidence strings for top-level classification. |
| classification.total_confidence | float | 0–1. Evidence-based score. |

## mapping.json

```json
{
  "entries": [
    {
      "outline_server_id": "40f1b4a3-...",
      "host_id": "local",
      "container_id": "def789",
      "node_id": "docker:def789",
      "confidence": 0.92,
      "evidence": ["kind_outline", "port_match", "image_shadowbox"]
    }
  ]
}
```

## targets.json (Prometheus file_sd)

```json
[
  {"labels": {"sd_job": "admin-api"}, "targets": ["admin-api:8000"]},
  {"labels": {"sd_job": "node-exporter"}, "targets": ["node-exporter:9100"]},
  {"labels": {"sd_job": "outline-ss"}, "targets": ["host.docker.internal:19092"]}
]
```

## Classification signals (never names)

| Signal | Weight | Source |
|--------|--------|--------|
| image_digest_shadowbox | 1.0 | Config.Image, RepoDigests, Image Id; quay.io/outline/shadowbox |
| network_mode_host | 0.75 | HostConfig.NetworkMode == "host" (Outline often uses host networking) |
| timestamp_proximity | 0.9 | Container Created vs Outline createdTimestampMs within 1h |
| ip_match | 0.4 | hostnameForAccessKeys resolves to host NIC IP |
| env_sb_* | 0.95 | SB_STATE_DIR, SB_API_PORT |
| label_outline | 0.85 | com.centurylinklabs.watchtower.scope=outline |
| mount_outline | 0.8 | /opt/outline/* |
| image_amnezia | 1.0 | amneziavpn/amneziawg*, metaligh/amneziawg |
| mount_tun | 0.7 | /dev/net/tun |
| cap_net_admin | 0.6 | HostConfig.CapAdd |
| port_wg_udp | 0.9 | 51820–52000/udp |

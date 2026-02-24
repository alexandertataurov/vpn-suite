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
}
```

| Field | Type | Description |
|-------|------|-------------|
| node_id | string | Stable ID: `docker:{id}` or `host:{interface}`. Survives rename. |
| kind | string | `awg` \| `host_wg` \| `unknown` |
| confidence | float | 0–1 confidence for top-level classification. |
| evidence | string[] | Evidence strings for top-level classification. |
| classification.total_confidence | float | 0–1. Evidence-based score. |

## mapping.json

```json
{
  "entries": []
}
```

## targets.json (Prometheus file_sd)

```json
[
  {"labels": {"sd_job": "admin-api"}, "targets": ["admin-api:8000"]},
  {"labels": {"sd_job": "node-exporter"}, "targets": ["node-exporter:9100"]}
]
```

## Classification signals (never names)

| Signal | Weight | Source |
|--------|--------|--------|
| image_amnezia | 1.0 | amneziavpn/amneziawg*, metaligh/amneziawg |
| mount_tun | 0.7 | /dev/net/tun |
| cap_net_admin | 0.6 | HostConfig.CapAdd |
| port_wg_udp | 0.9 | 51820–52000/udp |

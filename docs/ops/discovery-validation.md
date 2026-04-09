# Discovery Validation

## Script

Run `infra/discovery/runtime/validate_discovery.sh` to assert:
- Discovery runs and produces inventory.json
- After renaming VPN containers, inventory still lists them with correct `kind` and stable `node_id` (docker:{id})
- No name-based classification

## Quality gate

Discovery is correct only if:

- [ ] Works with **renamed** containers (node_id stable via docker:{id})
- [ ] Works with multiple hosts
- [ ] Auto-discovers new AWG nodes
- [ ] Produces deterministic mapping
- [ ] Exposes targets for Prometheus file_sd (includes node-agent when present)

## Validation steps

### 1. Rename containers

```bash
docker rename amnezia-awg2 xyz-random-123
cd /opt/vpn-suite && python -m infra.discovery.runtime --out-dir /tmp/discovery
# inventory.json must still list with correct kind + confidence/evidence
```

### 2. Restart Docker

```bash
systemctl restart docker
# Wait for containers to come up
python -m infra.discovery.runtime --out-dir /tmp/discovery
# Same node_ids (by container id), mapping intact
```

### 3. Prometheus targets

```bash
# Ensure Prometheus uses file_sd
# targets.json written to --out-dir
# /targets should show admin-api, node-exporter, etc.
```

### 4. No name-based detection

```bash
# Grep for container name usage in classifier/discovery
rg -i "amnezia-awg|container.*name" infra/discovery/runtime/ --type py
# Should find no classification logic using names
```

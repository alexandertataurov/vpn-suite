# Discovery Validation

## Script

Run `ops/discovery/validate_discovery.sh` to assert:
- Discovery runs and produces inventory.json
- After renaming VPN containers, inventory still lists them with correct `kind` and stable `node_id` (docker:{id})
- No name-based classification

## Quality gate

Discovery is correct only if:

- [ ] Works with **renamed** containers (node_id stable via docker:{id})
- [ ] Works with multiple hosts
- [ ] Auto-discovers new Outline servers
- [ ] Auto-discovers new AWG nodes
- [ ] Produces deterministic mapping
- [ ] Exposes targets for Prometheus file_sd (includes node-agent, outline-ss when present)

## Validation steps

### 1. Rename containers

```bash
docker rename amnezia-awg2 xyz-random-123
docker rename shadowbox foo-bar-456
cd /opt/vpn-suite && python -m ops.discovery --out-dir /tmp/discovery
# inventory.json must still list both with correct kind + confidence/evidence
```

### 2. Restart Docker

```bash
systemctl restart docker
# Wait for containers to come up
python -m ops.discovery --out-dir /tmp/discovery
# Same node_ids (by container id), mapping intact
```

### 3. Prometheus targets

```bash
# Ensure Prometheus uses file_sd
# targets.json written to --out-dir
# /targets should show admin-api, node-exporter, outline-ss (if outline), etc.
```

### 4. No name-based detection

```bash
# Grep for container name usage in classifier/discovery
rg -i "amnezia-awg|shadowbox|container.*name" ops/discovery/ --type py
# Should find no classification logic using names
```

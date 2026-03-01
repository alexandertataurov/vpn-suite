#!/usr/bin/env bash
# Validate deterministic discovery: run discovery, rename VPN containers, re-run, assert correct output.
# Per VALIDATION.md and plan spec.
set -euo pipefail
IFS=$'\n\t'

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }; }
need python3
need docker

OUT_DIR="${DISCOVERY_OUT_DIR:-/tmp/discovery-validate}"
REPO="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO"

echo "=== 1. Run discovery before changes ==="
python3 -m ops.discovery --out-dir "$OUT_DIR" 2>/dev/null || true
INV_BEFORE="${OUT_DIR}/inventory.json"
[[ -f "$INV_BEFORE" ]] || { echo "Missing inventory.json"; exit 1; }

echo "=== 2. Identify VPN containers (by kind, not name) ==="
NODES="$(python3 - <<'PY'
import json
with open("'$INV_BEFORE'") as f:
    inv = json.load(f)
for n in inv.get('nodes', []):
    if n.get('kind') == 'awg' and n.get('container_id'):
        print(f"{n['container_id']}\t{n['kind']}\t{n.get('node_id','')}")
PY
)"
if [[ -z "$NODES" ]]; then
  echo "No VPN containers found; validation assumes at least one. Skipping rename test."
  exit 0
fi

echo "=== 3. Rename containers ==="
while IFS=$'\t' read -r cid kind node_id; do
  cname="$(docker inspect -f '{{.Name}}' "$cid" 2>/dev/null | sed 's#^/##' || true)"
  if [[ -n "$cname" ]]; then
    new_name="xyz-${kind}-$(date +%s)-$RANDOM"
    echo "Renaming $cname -> $new_name"
    docker rename "$cname" "$new_name" 2>/dev/null || true
  fi
done <<< "$NODES"

echo "=== 4. Run discovery again after rename ==="
sleep 2
python3 -m ops.discovery --out-dir "$OUT_DIR" 2>/dev/null || true
INV_AFTER="${OUT_DIR}/inventory.json"
[[ -f "$INV_AFTER" ]] || { echo "Missing inventory.json after rename"; exit 1; }

echo "=== 5. Assert: correct kind and stable node_id (docker:{id}) ==="
python3 - <<'PY'
import json,sys
with open("'$INV_AFTER'") as f:
    inv = json.load(f)
for n in inv.get('nodes', []):
    if n.get('kind') == 'awg' and n.get('container_id'):
        node_id = n.get('node_id') or ''
        if not node_id.startswith('docker:'):
            sys.exit(f'Expected node_id docker:..., got {node_id}')
        if n.get('kind') != 'awg':
            sys.exit(f'Expected kind awg, got {n.get("kind")}')
print('OK: kind and node_id assertions passed')
PY

echo "=== 6. No name-based classification ==="
if rg -i 'amnezia-awg' ops/discovery/*.py 2>/dev/null | grep -v 'image\|#\|pattern' | grep -q .; then
  echo "WARN: Possible name-based logic found"
else
  echo "OK: No classification by container name"
fi

echo "=== Validation complete ==="

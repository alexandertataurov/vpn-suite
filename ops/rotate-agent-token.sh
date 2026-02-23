#!/usr/bin/env bash
set -euo pipefail

# Rotate AGENT_SHARED_TOKEN across control-plane env and a local node env.
# For multi-node setups, distribute the new token to every node before restarting node-agents.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CP_ENV="${CP_ENV:-$ROOT_DIR/.env}"
NODE_ENV="${NODE_ENV:-$ROOT_DIR/../amnezia/amnezia-awg2/secrets/node.env}"

if [ ! -f "$CP_ENV" ]; then
  echo "missing env file: $CP_ENV" >&2
  exit 2
fi
if [ ! -f "$NODE_ENV" ]; then
  echo "missing node env: $NODE_ENV" >&2
  exit 2
fi

NEW_TOKEN="$(openssl rand -hex 32)"

python3 - <<'PY'
import os
from pathlib import Path

cp_env = Path(os.environ["CP_ENV"])
node_env = Path(os.environ["NODE_ENV"])
new_token = os.environ["NEW_TOKEN"]

def rewrite(path: Path) -> None:
    lines = path.read_text().splitlines()
    out = []
    found = False
    for ln in lines:
        if ln.strip().startswith("AGENT_SHARED_TOKEN="):
            out.append("AGENT_SHARED_TOKEN=" + new_token)
            found = True
        else:
            out.append(ln)
    if not found:
        out.append("AGENT_SHARED_TOKEN=" + new_token)
    path.write_text("\n".join(out).rstrip("\n") + "\n")

rewrite(cp_env)
rewrite(node_env)
PY

chmod 600 "$CP_ENV" "$NODE_ENV" || true

echo "rotated (token not printed)"
echo "control-plane: $CP_ENV"
echo "node:         $NODE_ENV"


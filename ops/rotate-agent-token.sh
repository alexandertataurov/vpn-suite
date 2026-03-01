#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Rotate AGENT_SHARED_TOKEN across control-plane env and a local node env.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CP_ENV="${CP_ENV:-$ROOT_DIR/.env}"
NODE_ENV="${NODE_ENV:-$ROOT_DIR/../amnezia/amnezia-awg2/secrets/node.env}"

command -v openssl >/dev/null 2>&1 || { echo "missing openssl" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "missing python3" >&2; exit 1; }

[[ -f "$CP_ENV" ]] || { echo "missing env file: $CP_ENV" >&2; exit 2; }
[[ -f "$NODE_ENV" ]] || { echo "missing node env: $NODE_ENV" >&2; exit 2; }

NEW_TOKEN="$(openssl rand -hex 32)"

CP_ENV="$CP_ENV" NODE_ENV="$NODE_ENV" NEW_TOKEN="$NEW_TOKEN" python3 - <<'PY'
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
    tmp = path.with_suffix(".tmp")
    tmp.write_text("\n".join(out).rstrip("\n") + "\n")
    tmp.replace(path)

rewrite(cp_env)
rewrite(node_env)
PY

chmod 600 "$CP_ENV" "$NODE_ENV" || true

echo "rotated (token not printed)"
echo "control-plane: $CP_ENV"
echo "node:         $NODE_ENV"

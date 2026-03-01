#!/usr/bin/env bash
# Restart core stack (lag recovery).
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[[ -x "$ROOT/manage.sh" ]] || { echo "manage.sh not found in $ROOT" >&2; exit 1; }

"$ROOT/manage.sh" down-core
"$ROOT/manage.sh" up-core
echo "Core stack restarted. Check: curl -sf http://localhost/health"

#!/usr/bin/env bash
# Restart core stack (lag recovery). Use when NodeMemoryPressure/NodeSwapHeavy or connections dropping.
# Usage: ./ops/restart-core-stack.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
"$ROOT/manage.sh" down-core
"$ROOT/manage.sh" up-core
echo "Core stack restarted. Check: curl -sf http://localhost/health"

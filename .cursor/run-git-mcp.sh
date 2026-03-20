#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -euo pipefail
exec "$ROOT/backend/.venv/bin/mcp-server-git" --repository "$ROOT"

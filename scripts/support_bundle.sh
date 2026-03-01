#!/usr/bin/env bash
# Support bundle: bounded logs, Redis heartbeat presence, manifest. For diagnostics.
# Usage: ./scripts/support_bundle.sh [--output DIR]   or   ./manage.sh support-bundle [--output DIR]
set -euo pipefail
IFS=$'\n\t'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-.env}"

OUTPUT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--output DIR]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$ROOT/support-bundle-$(date +%Y%m%d-%H%M%S)"
fi
umask 077
mkdir -p "$OUTPUT_DIR"

LOG_LINES="${SUPPORT_BUNDLE_LOG_LINES:-500}"
PROJECT="${COMPOSE_PROJECT_NAME:-vpn-suite}"

echo "[support_bundle] Collecting to $OUTPUT_DIR (log lines=$LOG_LINES)" >&2

{
  echo "support_bundle_ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "hostname=$(hostname)"
  echo "project=$PROJECT"
  echo "log_lines=$LOG_LINES"
} > "$OUTPUT_DIR/manifest.txt"

DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE")
for svc in admin-api admin-worker; do
  if "${DC[@]}" ps -q "$svc" 2>/dev/null | head -1 | grep -q .; then
    "${DC[@]}" logs --tail="$LOG_LINES" "$svc" 2>&1 > "$OUTPUT_DIR/logs_${svc}.txt" || true
    echo "logs_${svc}=logs_${svc}.txt" >> "$OUTPUT_DIR/manifest.txt"
  else
    echo "[support_bundle] $svc not running; skipping logs" >&2
  fi
done

REDIS_CID="$("${DC[@]}" ps -q redis 2>/dev/null || true)"
if [[ -n "$REDIS_CID" ]]; then
  docker exec "$REDIS_CID" redis-cli --scan --pattern "agent:hb:*" 2>/dev/null > "$OUTPUT_DIR/redis_agent_hb_keys.txt" || true
  echo "redis_agent_hb_keys=redis_agent_hb_keys.txt" >> "$OUTPUT_DIR/manifest.txt"
fi

docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null > "$OUTPUT_DIR/docker_ps.txt" || true
echo "docker_ps=docker_ps.txt" >> "$OUTPUT_DIR/manifest.txt"

echo "[support_bundle] Done. Output: $OUTPUT_DIR" >&2
echo "$OUTPUT_DIR"

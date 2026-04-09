#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-.env}"
DC=(docker compose --env-file "$ENV_FILE" -f docker-compose.yml)

cmd="${1:-}"
case "$cmd" in
  config-validate)
    "${DC[@]}" config >/dev/null
    echo "Config valid."
    ;;
  up)
    "${DC[@]}" up -d
    ;;
  down)
    "${DC[@]}" down
    ;;
  ps)
    "${DC[@]}" ps
    ;;
  logs)
    "${DC[@]}" logs -f "${2:-}"
    ;;
  status)
    container="${WG_CONTAINER_NAME:-isolated-wireguard-client1}"
    iface="${WG_INTERFACE:-wgiso0}"
    docker exec "$container" wg show "$iface"
    ;;
  *)
    echo "Usage: $0 {config-validate|up|down|ps|logs [service]|status}" >&2
    exit 1
    ;;
esac

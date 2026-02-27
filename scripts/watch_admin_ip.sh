#!/usr/bin/env sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-/work/.env}"
PROJECT="${COMPOSE_PROJECT_NAME:-vpn-suite}"
ADMIN_CONTAINER="${PROJECT}-admin-api-1"
REVERSE_CONTAINER="${PROJECT}-reverse-proxy-1"
UPDATE_SCRIPT="/work/scripts/update_admin_api_ip.sh"

if [ ! -x "$UPDATE_SCRIPT" ]; then
  echo "missing update script: $UPDATE_SCRIPT" >&2
  exit 1
fi

update_and_restart() {
  ip="$(ENV_FILE="$ENV_FILE" "$UPDATE_SCRIPT" 2>&1 || true)"
  if [ -n "$ip" ]; then
    docker restart "$REVERSE_CONTAINER" >/dev/null 2>&1 || true
    now="$(date +%s)"
    echo "$now" > /tmp/admin_ip_watcher.ok
    echo "admin-api ip pinned: $ip"
  else
    echo "admin-api ip update failed" >&2
  fi
}

# Initial sync on start
update_and_restart

# Keep healthcheck fresh even when no restarts happen
# (healthcheck expects a recent timestamp in /tmp/admin_ip_watcher.ok)
(
  while true; do
    date +%s > /tmp/admin_ip_watcher.ok
    sleep 60
  done
) &

# Watch admin-api container start events and re-pin
docker events --filter "container=${ADMIN_CONTAINER}" --filter event=start --format '{{.Status}} {{.ID}}' | \
while read -r _ _; do
  update_and_restart
done

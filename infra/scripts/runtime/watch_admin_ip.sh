#!/usr/bin/env sh
set -eu

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }

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
    date +%s > /tmp/admin_ip_watcher.ok
    echo "admin-api ip pinned: $ip"
  else
    echo "admin-api ip update failed" >&2
  fi
}

update_and_restart

(
  while true; do
    date +%s > /tmp/admin_ip_watcher.ok
    sleep 60
  done
) &

docker events --filter "container=${ADMIN_CONTAINER}" --filter event=start --format '{{.Status}} {{.ID}}' | \
while read -r _ _; do
  update_and_restart
done

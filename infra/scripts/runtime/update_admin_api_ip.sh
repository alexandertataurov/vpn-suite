#!/usr/bin/env sh
set -eu

ENV_FILE="${ENV_FILE:-.env}"
PROJECT="${COMPOSE_PROJECT_NAME:-vpn-suite}"
NETWORK="${PROJECT}_vpn-suite-app"
CONTAINER="${PROJECT}-admin-api-1"

if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "admin-api container not found: $CONTAINER" >&2
  exit 1
fi

ip="$(docker inspect -f '{{(index .NetworkSettings.Networks "'"$NETWORK"'").IPAddress}}' "$CONTAINER" 2>/dev/null || true)"
if [ -z "$ip" ]; then
  ip="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{if $v.IPAddress}}{{$v.IPAddress}}{{end}}{{end}}' "$CONTAINER" | awk '{print $1}')"
fi

if [ -z "$ip" ]; then
  echo "admin-api IP not found in docker inspect" >&2
  exit 1
fi

tmp="$(mktemp)"
if grep -q '^ADMIN_API_IP=' "$ENV_FILE"; then
  grep -v '^ADMIN_API_IP=' "$ENV_FILE" > "$tmp"
  printf "ADMIN_API_IP=%s\n" "$ip" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
else
  printf "\nADMIN_API_IP=%s\n" "$ip" >> "$ENV_FILE"
fi

echo "$ip"

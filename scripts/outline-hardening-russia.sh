#!/usr/bin/env bash
# Outline VPN: hardening for Russia/DPI (port 443, domain hostname)
# Usage: ./scripts/outline-hardening-russia.sh [--port-443] [--hostname DOMAIN]
# Requires: OUTLINE_API_URL from /opt/outline/access.txt, docker, root/sudo

set -e

OUTLINE_API_URL="${OUTLINE_API_URL:-}"
HOSTNAME=""
DO_PORT_443=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --port-443) DO_PORT_443=true; shift ;;
    --hostname) HOSTNAME="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$OUTLINE_API_URL" ]] && {
  if [[ -f /opt/outline/access.txt ]]; then
    OUTLINE_API_URL=$(grep '^apiUrl:' /opt/outline/access.txt | cut -d: -f2- | tr -d ' ')
  fi
}
[[ -z "$OUTLINE_API_URL" ]] && { echo "Set OUTLINE_API_URL or ensure /opt/outline/access.txt exists"; exit 1; }

# Ensure URL has no trailing slash for API paths
OUTLINE_API_URL="${OUTLINE_API_URL%/}"
CURL_OPTS=(-k -s -w "\n%{http_code}" -H "Content-Type: application/json")

outline_put() {
  local path="$1" body="$2"
  local out; out=$(curl "${CURL_OPTS[@]}" -X PUT "${OUTLINE_API_URL}${path}" -d "$body")
  local code; code=$(echo "$out" | tail -1)
  if [[ "$code" != "204" && "$code" != "200" ]]; then
    echo "Outline API PUT $path failed: HTTP $code" >&2
    echo "$out" | head -n -1 >&2
    return 1
  fi
  return 0
}

if [[ -n "$HOSTNAME" ]]; then
  echo "Setting Outline hostname to $HOSTNAME ..."
  outline_put "/server/hostname-for-access-keys" "{\"hostname\":\"$HOSTNAME\"}" || exit 1
  echo "Done. Re-issue access keys so clients get the new hostname."
fi

if [[ "$DO_PORT_443" == true ]]; then
  echo "Port 443 swap: Outline->443, Caddy->8443. This requires:"
  echo "  1. Stopping Caddy from binding 443"
  echo "  2. Setting Outline to port 443"
  echo "  3. Moving admin/API to https://\$PUBLIC_DOMAIN:8443"
  read -p "Continue? [yN] " -r
  [[ "$REPLY" =~ ^[yY]$ ]] || exit 0

  # 1. Update Caddy: main site on 8443
  CADDYFILE="${CADDYFILE:-/opt/vpn-suite/config/caddy/Caddyfile}"
  if [[ -f "$CADDYFILE" ]]; then
    # Ensure main block uses :8443
    if ! grep -q '{\$PUBLIC_DOMAIN}:8443' "$CADDYFILE"; then
      echo "Patching Caddyfile: main site -> 8443"
      sed -i.bak 's/{\$PUBLIC_DOMAIN} /{$PUBLIC_DOMAIN}:8443 /' "$CADDYFILE"
    fi
  fi

  # 2. Remove 443 from reverse-proxy in docker-compose
  COMPOSE="${COMPOSE:-/opt/vpn-suite/docker-compose.yml}"
  if [[ -f "$COMPOSE" ]]; then
    if grep -q '"443:443"' "$COMPOSE"; then
      echo "Removing 443 from reverse-proxy ports"
      sed -i.bak '/- "443:443"/d' "$COMPOSE"
    fi
  fi

  # 3. Set Outline port to 443
  echo "Setting Outline to port 443 ..."
  outline_put "/server/port-for-new-access-keys" '{"port":443}' || exit 1

  # 4. UFW: 443 already allowed
  echo "Ensure UFW allows 443/tcp and 443/udp (for Outline)."
  ufw allow 443/tcp 2>/dev/null || true
  ufw allow 443/udp 2>/dev/null || true

  echo ""
  echo "Next steps:"
  echo "  1. cd /opt/vpn-suite && docker compose up -d reverse-proxy"
  echo "  2. /opt/outline/persisted-state/start_container.sh (Outline restart)"
  echo "  3. Admin: https://\$PUBLIC_DOMAIN:8443"
  echo "  4. Re-distribute Outline access keys (port changed to 443)"
fi

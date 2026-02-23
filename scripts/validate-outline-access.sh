#!/usr/bin/env bash
# Validate /opt/outline/access.txt: reject localhost/private IPs (prevents "Outline on local Mac" incidents).
# Run before importing access.txt or during env setup.
# Usage: ./scripts/validate-outline-access.sh [path-to-access.txt]

set -e
ACCESS="${1:-/opt/outline/access.txt}"
if [ ! -f "$ACCESS" ]; then
  echo "ERROR: Outline access.txt not found at $ACCESS" >&2
  exit 1
fi
apiUrl=$(grep -E '^apiUrl:' "$ACCESS" | sed 's/^apiUrl:*//' | tr -d ' \r')
if [ -z "$apiUrl" ]; then
  echo "ERROR: No apiUrl in $ACCESS" >&2
  exit 1
fi

# Extract host from https://HOST:PORT/SECRET or https://HOST/SECRET
host=$(echo "$apiUrl" | sed -E 's|^https?://([^:/]+).*|\1|')
host_lower=$(echo "$host" | tr '[:upper:]' '[:lower:]')

is_local() {
  case "$host_lower" in
    localhost|127.*|::1) return 0 ;;
    *) return 1 ;;
  esac
}

is_private() {
  # 10.x, 192.168.x, 172.16-31.x
  if echo "$host" | grep -qE '^10\.'; then return 0; fi
  if echo "$host" | grep -qE '^192\.168\.'; then return 0; fi
  if echo "$host" | grep -qE '^172\.(1[6-9]|2[0-9]|3[0-1])\.'; then return 0; fi
  return 1
}

if is_local; then
  echo "ERROR: Outline apiUrl points to localhost ($host). Outline MUST run on the production server, NOT on a local Mac." >&2
  echo "  Run the Outline installer on the target server (e.g. SSH into 185.x.x.x), then copy access.txt to /opt/outline/." >&2
  exit 1
fi

if is_private && [ -z "$OUTLINE_ALLOW_PRIVATE" ]; then
  echo "ERROR: Outline apiUrl uses private IP ($host). Outline MUST run on a publicly reachable server." >&2
  echo "  If you ran Outline on a local/dev machine, deploy it on the production server instead." >&2
  echo "  To allow (e.g. same-host): OUTLINE_ALLOW_PRIVATE=1 ./scripts/validate-outline-access.sh" >&2
  exit 1
fi

echo "OK: apiUrl host=$host (not local)"

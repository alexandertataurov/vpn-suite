#!/usr/bin/env bash
# Read /opt/outline/access.txt and print OUTLINE_API_SECRET_PATH and OUTLINE_UPSTREAM for .env or export.
# Validates host is not localhost (prevents Outline-on-local-Mac incidents).
# Usage: eval "$(./scripts/outline-env-from-access.sh)"  or  ./scripts/outline-env-from-access.sh >> .env

set -e
ACCESS="${1:-/opt/outline/access.txt}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/scripts/validate-outline-access.sh" "$ACCESS" || exit 1
if [ ! -f "$ACCESS" ]; then
  echo "# Outline access.txt not found at $ACCESS" >&2
  exit 1
fi
apiUrl=$(grep -E '^apiUrl:' "$ACCESS" | sed 's/^apiUrl:*//' | tr -d ' \r')
if [ -z "$apiUrl" ]; then
  echo "# No apiUrl in $ACCESS" >&2
  exit 1
fi
# apiUrl is https://HOST:PORT/SECRET -> OUTLINE_UPSTREAM=https://HOST:PORT OUTLINE_API_SECRET_PATH=/SECRET
base="${apiUrl%/}"
secret="${base##*/}"
hostport="${base%/*}"
echo "OUTLINE_API_SECRET_PATH=/$secret"
echo "OUTLINE_UPSTREAM=$hostport"

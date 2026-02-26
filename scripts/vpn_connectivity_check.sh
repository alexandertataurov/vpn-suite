#!/usr/bin/env bash
# Bring up WireGuard with issued config, curl external IP, bring down.
# Usage: sudo ./scripts/vpn_connectivity_check.sh /path/to/client.conf
# Optional: EXPECTED_EXIT_IP=1.2.3.4 (fail if exit IP does not match)
set -euo pipefail

CONFIG_FILE="${1:?Usage: $0 /path/to/client.conf}"
CURL_TIMEOUT="${CURL_TIMEOUT:-15}"
CHECK_URL="${CHECK_URL:-https://ifconfig.me}"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "ERROR: Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "ERROR: Run as root (wg-quick needs root). Example: sudo $0 $CONFIG_FILE" >&2
  exit 1
fi

cleanup() {
  wg-quick down "$CONFIG_FILE" 2>/dev/null || true
}
trap cleanup EXIT

echo "Bringing up VPN: $CONFIG_FILE"
wg-quick up "$CONFIG_FILE"

echo "Checking exit IP via $CHECK_URL (timeout ${CURL_TIMEOUT}s)..."
EXIT_IP=$(curl -s --max-time "$CURL_TIMEOUT" "$CHECK_URL" || true)
if [[ -z "$EXIT_IP" ]]; then
  echo "ERROR: No response from $CHECK_URL (no internet via VPN?)" >&2
  exit 1
fi
echo "Exit IP: $EXIT_IP"

if [[ -n "${EXPECTED_EXIT_IP:-}" ]]; then
  if [[ "$EXIT_IP" != "$EXPECTED_EXIT_IP" ]]; then
    echo "ERROR: Exit IP $EXIT_IP != expected $EXPECTED_EXIT_IP" >&2
    exit 1
  fi
  echo "Exit IP matches expected."
fi

echo "OK: Internet via VPN (exit IP $EXIT_IP)"

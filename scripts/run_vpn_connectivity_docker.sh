#!/usr/bin/env bash
# Run VPN connectivity test in a Docker container (no host wireguard-tools needed).
# Usage: ./scripts/run_vpn_connectivity_docker.sh /path/to/issued_wg.conf
# Note: If the config was issued with NODE_MODE=mock, the peer is not on the server so handshake will fail (expected).
set -euo pipefail

CONFIG_FILE="${1:?Usage: $0 /path/to/issued_wg.conf}"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "ERROR: Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

CURL_TIMEOUT="${CURL_TIMEOUT:-20}"
CHECK_URL="${CHECK_URL:-https://ifconfig.me}"
CONFIG_ABS="$(realpath "$CONFIG_FILE")"

echo "==> Running connectivity test in container (config: $CONFIG_FILE)"
docker run --rm --cap-add=NET_ADMIN \
  -v "${CONFIG_ABS}:/etc/wireguard/wg0.conf:ro" \
  alpine sh -c "
    apk add --no-cache wireguard-tools curl >/dev/null 2>&1
    # Parse config and bring up manually (wg setconf only accepts Peer block)
    PRIV=\$(awk '/^PrivateKey =/{print \$3}' /etc/wireguard/wg0.conf)
    ADDR=\$(awk '/^Address =/{print \$3}' /etc/wireguard/wg0.conf)
    PUB=\$(awk '/^PublicKey =/{print \$3}' /etc/wireguard/wg0.conf)
    ENDP=\$(awk '/^Endpoint =/{print \$3}' /etc/wireguard/wg0.conf)
    IPS=\$(awk -F'= ' '/^AllowedIPs =/{print \$2; exit}' /etc/wireguard/wg0.conf | tr -d '\r')
    PK=\$(awk '/^PersistentKeepalive =/{print \$3}' /etc/wireguard/wg0.conf)
    ip link add dev wg0 type wireguard
    echo \"\$PRIV\" | wg set wg0 private-key /dev/stdin
    wg set wg0 peer \"\$PUB\" allowed-ips \"\$IPS\" endpoint \"\$ENDP\" persistent-keepalive \"\${PK:-25}\"
    ip -4 address add \"\$ADDR\" dev wg0
    ip link set mtu 1420 up dev wg0
    ip route add 0.0.0.0/1 dev wg0 2>/dev/null
    ip route add 128.0.0.0/1 dev wg0 2>/dev/null
    echo '=== wg show ==='
    wg show wg0
    echo \"=== curl ${CHECK_URL} (timeout ${CURL_TIMEOUT}s) ===\"
    EXIT_IP=\$(curl -s --max-time ${CURL_TIMEOUT} ${CHECK_URL} 2>/dev/null || true)
    ip link del dev wg0 2>/dev/null || true
    echo \"Exit IP: \${EXIT_IP:-FAIL}\"
    if [ -n \"\$EXIT_IP\" ]; then echo 'OK: Internet via VPN'; exit 0; else echo 'FAIL: No response (peer may not be on server if config from test-stand)'; exit 1; fi
  "

#!/bin/sh
set -eu

WG_INTERFACE="${WG_INTERFACE:-wgiso0}"
WG_LISTEN_PORT="${WG_LISTEN_PORT:-45820}"
WG_ADDRESS="${WG_ADDRESS:-}"
WG_PRIVATE_KEY_FILE="${WG_PRIVATE_KEY_FILE:-}"
WG_PRIVATE_KEY="${WG_PRIVATE_KEY:-}"
WG_CLIENT_PUBLIC_KEY_FILE="${WG_CLIENT_PUBLIC_KEY_FILE:-}"
WG_CLIENT_PUBLIC_KEY="${WG_CLIENT_PUBLIC_KEY:-}"
WG_PRESHARED_KEY_FILE="${WG_PRESHARED_KEY_FILE:-}"
WG_PRESHARED_KEY="${WG_PRESHARED_KEY:-}"
WG_CLIENT_ALLOWED_IPS="${WG_CLIENT_ALLOWED_IPS:-}"
WG_MTU="${WG_MTU:-1420}"
WG_NAT="${WG_NAT:-1}"
WG_EGRESS_IFACE="${WG_EGRESS_IFACE:-eth0}"
WG_TUNNEL_CLIENT_SUBNET="${WG_TUNNEL_CLIENT_SUBNET:-}"

log() {
  printf '%s\n' "$*" >&2
}

cleanup() {
  log "[isolated-wireguard] shutting down: wg-quick down ${WG_INTERFACE}"
  if [ -f "/run/${WG_INTERFACE}.conf" ]; then
    wg-quick down "/run/${WG_INTERFACE}.conf" >/dev/null 2>&1 || true
  else
    wg-quick down "${WG_INTERFACE}" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM

read_secret() {
  value_file="$1"
  value_inline="$2"
  if [ -n "${value_file}" ] && [ -f "${value_file}" ]; then
    tr -d ' \t\r\n' < "${value_file}"
    return 0
  fi
  if [ -n "${value_inline}" ]; then
    printf '%s' "${value_inline}" | tr -d ' \t\r\n'
    return 0
  fi
  return 1
}

SERVER_KEY="$(read_secret "${WG_PRIVATE_KEY_FILE}" "${WG_PRIVATE_KEY}" || true)"
CLIENT_PUBLIC_KEY="$(read_secret "${WG_CLIENT_PUBLIC_KEY_FILE}" "${WG_CLIENT_PUBLIC_KEY}" || true)"
PRESHARED_KEY="$(read_secret "${WG_PRESHARED_KEY_FILE}" "${WG_PRESHARED_KEY}" || true)"

if [ -z "${WG_ADDRESS}" ]; then
  log "[isolated-wireguard] missing WG_ADDRESS"
  exit 2
fi

if [ -z "${WG_CLIENT_ALLOWED_IPS}" ]; then
  log "[isolated-wireguard] missing WG_CLIENT_ALLOWED_IPS"
  exit 2
fi

if [ -z "${WG_TUNNEL_CLIENT_SUBNET}" ]; then
  log "[isolated-wireguard] missing WG_TUNNEL_CLIENT_SUBNET"
  exit 2
fi

if [ -z "${SERVER_KEY}" ] || [ -z "${CLIENT_PUBLIC_KEY}" ] || [ -z "${PRESHARED_KEY}" ]; then
  log "[isolated-wireguard] missing key material"
  exit 2
fi

umask 077
CFG="/run/${WG_INTERFACE}.conf"
{
  printf '%s\n' "[Interface]"
  printf '%s\n' "PrivateKey = ${SERVER_KEY}"
  printf '%s\n' "Address = ${WG_ADDRESS}"
  printf '%s\n' "ListenPort = ${WG_LISTEN_PORT}"
  printf '%s\n' "MTU = ${WG_MTU}"
  if [ "${WG_NAT}" = "1" ] || [ "${WG_NAT}" = "true" ] || [ "${WG_NAT}" = "yes" ]; then
    printf '%s\n' "PostUp = iptables -C FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || iptables -I FORWARD 1 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT; iptables -C FORWARD -i %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -i %i -j ACCEPT; iptables -C FORWARD -o %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -C POSTROUTING -s ${WG_TUNNEL_CLIENT_SUBNET} -o ${WG_EGRESS_IFACE} -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -s ${WG_TUNNEL_CLIENT_SUBNET} -o ${WG_EGRESS_IFACE} -j MASQUERADE"
    printf '%s\n' "PostDown = iptables -t nat -D POSTROUTING -s ${WG_TUNNEL_CLIENT_SUBNET} -o ${WG_EGRESS_IFACE} -j MASQUERADE 2>/dev/null || true; iptables -D FORWARD -o %i -j ACCEPT 2>/dev/null || true; iptables -D FORWARD -i %i -j ACCEPT 2>/dev/null || true"
  fi
  printf '\n%s\n' "[Peer]"
  printf '%s\n' "PublicKey = ${CLIENT_PUBLIC_KEY}"
  printf '%s\n' "PresharedKey = ${PRESHARED_KEY}"
  printf '%s\n' "AllowedIPs = ${WG_CLIENT_ALLOWED_IPS}"
  printf '%s\n' "PersistentKeepalive = 25"
} > "${CFG}"

log "[isolated-wireguard] bringing up interface ${WG_INTERFACE} on UDP ${WG_LISTEN_PORT}"
wg-quick up "${CFG}" &
pid="$!"

sleep 1
if kill -0 "$pid" >/dev/null 2>&1; then
  log "[isolated-wireguard] wg-quick is running, waiting pid=${pid}"
  wait "$pid"
  exit $?
fi

log "[isolated-wireguard] interface up, entering keepalive loop"
while :; do
  sleep 3600
done

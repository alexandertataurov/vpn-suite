#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SECRETS_DIR="${SECRETS_DIR:-$ROOT_DIR/secrets}"
PKI_DIR="${PKI_DIR:-$SECRETS_DIR/pki}"

CA_KEY="$PKI_DIR/agent_ca.key"
CA_CERT_PEM="$SECRETS_DIR/agent_ca.pem"

umask 077
log() { printf '%s\n' "$*" >&2; }

_need() {
  command -v "$1" >/dev/null 2>&1 || { log "missing dependency: $1"; exit 1; }
}

init_ca() {
  _need openssl
  mkdir -p "$PKI_DIR" "$SECRETS_DIR"
  if [[ -f "$CA_KEY" || -f "$CA_CERT_PEM" ]]; then
    log "CA already exists: $CA_KEY / $CA_CERT_PEM"
    exit 2
  fi
  openssl genrsa -out "$CA_KEY" 4096
  openssl req -x509 -new -nodes -key "$CA_KEY" -sha256 -days 3650 \
    -subj "/CN=vpn-suite-agent-ca" \
    -out "$CA_CERT_PEM"
  chmod 600 "$CA_KEY" "$CA_CERT_PEM" || true
  log "Wrote CA key:  $CA_KEY"
  log "Wrote CA cert: $CA_CERT_PEM"
}

issue_client() {
  _need openssl
  local server_id="${1:-}"
  local out_dir="${2:-}"
  if [[ -z "$server_id" || -z "$out_dir" ]]; then
    log "Usage: $0 issue-client <server_id> <out_dir>"
    exit 2
  fi
  if [[ ! -f "$CA_KEY" || ! -f "$CA_CERT_PEM" ]]; then
    log "CA missing. Run: $0 init-ca"
    exit 2
  fi
  mkdir -p "$out_dir"
  local key="$out_dir/agent_client_key.pem"
  local csr="$out_dir/agent_client.csr"
  local crt="$out_dir/agent_client_cert.pem"

  if [[ -f "$key" || -f "$crt" ]]; then
    log "Overwriting existing client certs in $out_dir"
  fi

  openssl genrsa -out "$key" 2048
  openssl req -new -key "$key" -subj "/CN=$server_id" -out "$csr"
  openssl x509 -req -in "$csr" -CA "$CA_CERT_PEM" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$crt" -days 825 -sha256 \
    -extfile <(printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=clientAuth\nsubjectAltName=DNS:%s\n" "$server_id")
  rm -f "$csr" "$PKI_DIR/agent_ca.srl" || true
  chmod 600 "$key" "$crt" || true
  log "Wrote client key:  $key"
  log "Wrote client cert: $crt"
  log "Node: place these into amnezia/amnezia-awg2/secrets/ as agent_client_key.pem / agent_client_cert.pem"
}

cmd="${1:-}"
case "$cmd" in
  init-ca) init_ca ;;
  issue-client) shift; issue_client "$@" ;;
  *)
    log "Usage: $0 {init-ca|issue-client <server_id> <out_dir>}"
    exit 1
    ;;
esac
